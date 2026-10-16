import os, re, glob, shutil, sqlite3, asyncio, json, io, zipfile, tempfile
import base64, hashlib, hmac, time
from uuid import uuid4
from pathlib import Path
from typing import Optional, List
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, UploadFile, File, Request, Response
from fastapi.responses import FileResponse, JSONResponse, Response, StreamingResponse
from pydantic import BaseModel
import uvicorn

from telethon import TelegramClient
from telethon.errors import (
    PhoneCodeInvalidError, PhoneCodeExpiredError,
    SessionPasswordNeededError, PasswordHashInvalidError, FloodWaitError,
)
from telethon.tl.functions.account import (
    GetPasswordRequest, GetAuthorizationsRequest,
    ResetAuthorizationRequest, SendVerifyEmailCodeRequest, VerifyEmailRequest,
)
from telethon.tl.functions.auth import ResetAuthorizationsRequest
from telethon.tl.functions.channels import JoinChannelRequest
from telethon.tl.functions.messages import StartBotRequest
from telethon.tl.types import (
    EmailVerifyPurposeLoginChange, EmailVerifyPurposeLoginSetup,
    EmailVerificationCode,
)

def load_local_environment(env_path=None, environ=None):
    env_path = Path(env_path) if env_path else Path(__file__).parent / ".env"
    if not env_path.exists():
        return
    environ = os.environ if environ is None else environ
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        if key not in {"ADMIN_PASSWORD", "SESSION_SECRET"} or key in environ:
            continue
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        environ[key] = value

load_local_environment()

API_ID   = 32140582
API_HASH = "e9597b6e5e64a9d093071e20d0545f3f"
DEFAULT_2FA_PASSWORD = "4735908767"
ADMIN_USERNAME       = "sopnox"

BASE_DIR     = Path(__file__).parent
SESSIONS_DIR = BASE_DIR / "sessions"
SESSIONS_DIR.mkdir(exist_ok=True)
STATIC_DIR         = BASE_DIR / "static"
DB_PATH            = str(BASE_DIR / "accounts.db")
USERS_PATH         = BASE_DIR / "users.json"
FAILED_LOGOUT_PATH = BASE_DIR / "failed_logouts.json"
CONFIG_PATH        = BASE_DIR / "config.json"

# ── Config JSON ───────────────────────────────────────────────────────────────
def load_config() -> dict:
    if CONFIG_PATH.exists():
        try:
            return json.loads(CONFIG_PATH.read_text())
        except Exception:
            pass
    return {"auto_2fa_password": DEFAULT_2FA_PASSWORD}

def save_config(data: dict):
    CONFIG_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2))

def get_auto_2fa_password() -> str:
    return load_config().get("auto_2fa_password", DEFAULT_2FA_PASSWORD) or DEFAULT_2FA_PASSWORD

# ── Failed Logout JSON ────────────────────────────────────────────────────────
def load_failed_logouts() -> list:
    if FAILED_LOGOUT_PATH.exists():
        try:
            return json.loads(FAILED_LOGOUT_PATH.read_text())
        except Exception:
            pass
    return []

def save_failed_logouts(data: list):
    FAILED_LOGOUT_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2))

def record_failed_logout(phone: str, error: str):
    data = load_failed_logouts()
    for item in data:
        if item["phone"] == phone and not item.get("resolved"):
            item["error"] = error
            item["timestamp"] = datetime.now(timezone.utc).isoformat()
            save_failed_logouts(data)
            return
    data.append({
        "phone": phone,
        "error": error,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "resolved": False,
    })
    save_failed_logouts(data)

def resolve_failed_logout(phone: str):
    data = load_failed_logouts()
    data = [d for d in data if not (d["phone"] == phone and not d.get("resolved"))]
    save_failed_logouts(data)

# ── Users JSON ────────────────────────────────────────────────────────────────
def load_users() -> dict:
    if USERS_PATH.exists():
        try:
            return json.loads(USERS_PATH.read_text())
        except Exception:
            pass
    return {}

def save_users(data: dict):
    USERS_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2))

def user_ensure(username: str) -> bool:
    username = str(username or "").strip()
    if not username or username.lower() == ADMIN_USERNAME.lower():
        return False
    data = load_users()
    if username in data:
        return False
    data[username] = {"sold_numbers": [], "assigned_numbers": [], "total_logins": 0}
    save_users(data)
    return True

def user_record_sale(username: str, phone: str):
    data = load_users()
    if username not in data:
        data[username] = {"sold_numbers": [], "assigned_numbers": [], "total_logins": 0}
    u = data[username]
    u.setdefault("sold_numbers", [])
    u.setdefault("assigned_numbers", [])
    if phone not in u["sold_numbers"]:
        u["sold_numbers"].append(phone)
    u["total_logins"] = u.get("total_logins", 0) + 1
    save_users(data)

def user_get_stats(username: str) -> dict:
    data = load_users()
    u = data.get(username, {"sold_numbers": [], "total_logins": 0})
    return {
        "username": username,
        "sold_numbers": u.get("sold_numbers", []),
        "assigned_numbers": u.get("assigned_numbers", []),
        "total_logins": u.get("total_logins", 0),
    }

def user_assign_numbers(username: str, phones: List[str]) -> list:
    data = load_users()
    if username not in data:
        raise HTTPException(404, "User not found")

    clean_phones = list(dict.fromkeys(str(phone).strip() for phone in phones if str(phone).strip()))
    account_phones = {account["phone"] for account in db_all()}
    missing = [phone for phone in clean_phones if phone not in account_phones]
    if missing:
        raise HTTPException(404, f"Account not found: {missing[0]}")

    for other_username, user_data in data.items():
        if other_username == username:
            continue
        owned = set(user_data.get("assigned_numbers", []))
        conflict = next((phone for phone in clean_phones if phone in owned), None)
        if conflict:
            raise HTTPException(409, f"{conflict} is already assigned to {other_username}")

    user_data = data[username]
    assigned = user_data.setdefault("assigned_numbers", [])
    added = [phone for phone in clean_phones if phone not in assigned]
    assigned.extend(added)
    save_users(data)
    return added

def user_unassign_number(username: str, phone: str) -> bool:
    data = load_users()
    if username not in data:
        raise HTTPException(404, "User not found")
    assigned = data[username].setdefault("assigned_numbers", [])
    if phone not in assigned:
        return False
    assigned.remove(phone)
    save_users(data)
    return True

# ── Bot link parser ───────────────────────────────────────────────────────────
def parse_bot_link(link: str):
    link = link.strip()
    if link.startswith('@'):
        return link, ''
    m = re.match(r'(?:https?://)?t\.me/([^?/\s]+)(?:\?start=([^\s]+))?', link)
    if m:
        return '@' + m.group(1), m.group(2) or ''
    return link, ''

# ── Database ──────────────────────────────────────────────────────────────────
def init_db():
    with sqlite3.connect(DB_PATH) as c:
        c.execute("""CREATE TABLE IF NOT EXISTS accounts (
            phone TEXT PRIMARY KEY,
            first_name TEXT DEFAULT '',
            last_name TEXT,
            username TEXT,
            user_id TEXT,
            has_2fa INTEGER DEFAULT 0,
            logged_in_at TEXT DEFAULT NULL
        )""")
        try:
            c.execute("ALTER TABLE accounts ADD COLUMN logged_in_at TEXT DEFAULT NULL")
        except Exception:
            pass

def db_all():
    with sqlite3.connect(DB_PATH) as c:
        rows = c.execute(
            "SELECT phone,first_name,last_name,username,user_id,has_2fa,logged_in_at FROM accounts"
        ).fetchall()
    return [
        {"phone": r[0], "firstName": r[1], "lastName": r[2],
         "username": r[3], "id": r[4], "has2fa": bool(r[5]),
         "loggedInAt": r[6]}
        for r in rows
    ]

def db_save(phone, user, has_2fa=False):
    now = datetime.now(timezone.utc).isoformat()
    with sqlite3.connect(DB_PATH) as c:
        c.execute(
            "INSERT OR REPLACE INTO accounts VALUES (?,?,?,?,?,?,?)",
            (phone, user.first_name or "", user.last_name,
             user.username, str(user.id), int(has_2fa), now)
        )

def db_save_many(records):
    if not records:
        return
    now = datetime.now(timezone.utc).isoformat()
    rows = [
        (
            phone,
            user.first_name or "",
            user.last_name,
            user.username,
            str(user.id),
            int(has_2fa),
            now,
        )
        for phone, user, has_2fa in records
    ]
    with sqlite3.connect(DB_PATH) as c:
        c.executemany(
            "INSERT OR REPLACE INTO accounts VALUES (?,?,?,?,?,?,?)",
            rows,
        )

def db_save_placeholders(phones):
    if not phones:
        return
    now = datetime.now(timezone.utc).isoformat()
    rows = [(phone, "", None, None, "", 0, now) for phone in phones]
    with sqlite3.connect(DB_PATH) as c:
        c.executemany(
            """INSERT OR IGNORE INTO accounts
               (phone, first_name, last_name, username, user_id, has_2fa, logged_in_at)
               VALUES (?,?,?,?,?,?,?)""",
            rows,
        )

def db_delete(phone):
    with sqlite3.connect(DB_PATH) as c:
        c.execute("DELETE FROM accounts WHERE phone=?", (phone,))

def db_set_2fa(phone, val):
    with sqlite3.connect(DB_PATH) as c:
        c.execute("UPDATE accounts SET has_2fa=? WHERE phone=?", (int(val), phone))

# ── Session helpers ───────────────────────────────────────────────────────────
def phone_safe(phone: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]", "_", phone)

def session_name(phone: str) -> str:
    return str(SESSIONS_DIR / phone_safe(phone))

def make_client(sess: str) -> TelegramClient:
    return TelegramClient(sess, API_ID, API_HASH)

# ── Pending login sessions ────────────────────────────────────────────────────
_pending: dict = {}
_upload_jobs: dict = {}

# ── App ───────────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app):
    init_db()
    yield
    for d in list(_pending.values()):
        try: await d["client"].disconnect()
        except: pass

app = FastAPI(lifespan=lifespan)
SESSION_COOKIE = "tg_manager_session"
SESSION_MAX_AGE = 12 * 60 * 60

def create_session_token(username: str, role: str) -> str:
    secret = os.getenv("SESSION_SECRET")
    if not secret:
        raise HTTPException(503, "Server session secret is not configured")
    payload = json.dumps(
        {"username": username, "role": role, "expires": int(time.time()) + SESSION_MAX_AGE},
        separators=(",", ":"),
    ).encode()
    encoded = base64.urlsafe_b64encode(payload).decode().rstrip("=")
    signature = hmac.new(secret.encode(), encoded.encode(), hashlib.sha256).hexdigest()
    return f"{encoded}.{signature}"

def read_session_token(token: Optional[str]) -> Optional[dict]:
    if not token:
        return None
    secret = os.getenv("SESSION_SECRET")
    if not secret:
        return None
    try:
        encoded, signature = token.rsplit(".", 1)
        expected = hmac.new(secret.encode(), encoded.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            return None
        payload_bytes = base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4))
        payload = json.loads(payload_bytes)
        if payload.get("expires", 0) < int(time.time()):
            return None
        if payload.get("role") not in ("admin", "user") or not payload.get("username"):
            return None
        return payload
    except (ValueError, TypeError, json.JSONDecodeError):
        return None

@app.middleware("http")
async def enforce_api_session(request: Request, call_next):
    path = request.url.path
    public_paths = {"/api/healthz", "/api/auth/login", "/api/auth/session", "/api/auth/logout"}
    if not path.startswith("/api/") or path in public_paths:
        return await call_next(request)

    session = read_session_token(request.cookies.get(SESSION_COOKIE))
    if not session:
        return JSONResponse(status_code=401, content={"detail": "Please log in"})

    admin_only = (
        path.startswith("/api/admin/") or
        path == "/api/telegram/accounts" or
        path in {"/api/telegram/start-bot-all", "/api/telegram/join-all"}
    )
    if admin_only and session["role"] != "admin":
        return JSONResponse(status_code=403, content={"detail": "Admin access required"})

    if path.startswith("/api/telegram/accounts/") and session["role"] != "admin":
        from urllib.parse import unquote
        phone = unquote(path[len("/api/telegram/accounts/"):].split("/", 1)[0])
        assigned = user_get_stats(session["username"])["assigned_numbers"]
        if phone not in assigned:
            return JSONResponse(status_code=403, content={"detail": "This account is not assigned to your user"})

    if path.startswith("/api/user/") and path != "/api/user/record-sale":
        username = path[len("/api/user/"):].split("/", 1)[0]
        if session["role"] != "admin" and username != session["username"]:
            return JSONResponse(status_code=403, content={"detail": "Cannot access another user's data"})

    return await call_next(request)

# ── Request models ────────────────────────────────────────────────────────────
class SendCodeBody(BaseModel):
    phone: str

class SignInBody(BaseModel):
    phone: str
    code: str
    sessionId: str
    password: Optional[str] = None

class Disable2faBody(BaseModel):
    password: str

class Enable2faBody(BaseModel):
    current_password: Optional[str] = None

class SendMsgBody(BaseModel):
    username: str
    message: str

class JoinBody(BaseModel):
    channel: str

class JoinAllBody(BaseModel):
    channel: str

class TermSessBody(BaseModel):
    hash: str

class EmailBody(BaseModel):
    email: str

class VerifyEmailBody(BaseModel):
    email: str
    code: str

class RecordSaleBody(BaseModel):
    username: str
    phone: str
    had2fa: bool = False
    old_password: Optional[str] = None

class AssignNumbersBody(BaseModel):
    phones: List[str]

class AuthLoginBody(BaseModel):
    username: str
    password: Optional[str] = None

class CreateUserBody(BaseModel):
    username: str

class StartBotBody(BaseModel):
    bot_link: str

class StartBotAllBody(BaseModel):
    bot_link: str

class BulkPhonesBody(BaseModel):
    phones: List[str]

class BulkDisable2faBody(BaseModel):
    phones: List[str]
    password: Optional[str] = None

# ── Auth ──────────────────────────────────────────────────────────────────────
@app.post("/api/auth/login")
async def auth_login(body: AuthLoginBody, response: Response):
    u = body.username.strip()
    if not u:
        raise HTTPException(400, "Username required")
    role = "admin" if u.lower() == ADMIN_USERNAME.lower() else "user"
    if role == "admin":
        expected_password = os.getenv("ADMIN_PASSWORD")
        if not expected_password:
            raise HTTPException(503, "Admin password is not configured")
        if not body.password or not hmac.compare_digest(body.password, expected_password):
            raise HTTPException(401, "Invalid username or password")
    else:
        user_ensure(u)
    response.set_cookie(
        key=SESSION_COOKIE,
        value=create_session_token(u, role),
        max_age=SESSION_MAX_AGE,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
    )
    return {"username": u, "role": role}

@app.get("/api/auth/session")
async def auth_session(request: Request):
    session = read_session_token(request.cookies.get(SESSION_COOKIE))
    if not session:
        raise HTTPException(401, "Please log in")
    return {"username": session["username"], "role": session["role"]}

@app.post("/api/auth/logout")
async def auth_logout(response: Response):
    response.delete_cookie(SESSION_COOKIE, path="/", httponly=True, secure=True, samesite="lax")
    return {"success": True}

# ── Healthcheck ───────────────────────────────────────────────────────────────
@app.get("/api/healthz")
async def healthz():
    return {"status": "ok"}

# ── Login: send code ──────────────────────────────────────────────────────────
@app.post("/api/telegram/send-code")
async def send_code(body: SendCodeBody):
    phone = body.phone.strip()
    sid   = str(uuid4())
    sname = str(SESSIONS_DIR / f"pending_{sid}")
    client = make_client(sname)
    try:
        await client.connect()
        sent = await client.send_code_request(phone)
    except FloodWaitError as e:
        try: await client.disconnect()
        except: pass
        raise HTTPException(429, f"Too many requests. Wait {e.seconds}s.")
    except Exception as e:
        try: await client.disconnect()
        except: pass
        raise HTTPException(500, str(e))

    _pending[sid] = {"client": client, "phone": phone,
                     "hash": sent.phone_code_hash, "sname": sname}

    async def _cleanup():
        await asyncio.sleep(600)
        if sid in _pending:
            try: await _pending[sid]["client"].disconnect()
            except: pass
            _pending.pop(sid, None)
    asyncio.create_task(_cleanup())

    return {"sessionId": sid, "phoneCodeHash": sent.phone_code_hash}

# ── Login: verify code ────────────────────────────────────────────────────────
@app.post("/api/telegram/sign-in")
async def sign_in(body: SignInBody):
    if body.sessionId not in _pending:
        raise HTTPException(400, "Session expired. Please go back and resend the code.")

    p = _pending[body.sessionId]
    client, phone, phash, sname = p["client"], p["phone"], p["hash"], p["sname"]

    user    = None
    has_2fa = False
    used_pw = None
    try:
        user = await client.sign_in(phone, body.code, phone_code_hash=phash)
    except SessionPasswordNeededError:
        if not body.password:
            return JSONResponse(status_code=422, content={"error": "2FA_REQUIRED"})
        try:
            user = await client.sign_in(password=body.password)
            has_2fa = True
            used_pw = body.password
        except PasswordHashInvalidError:
            raise HTTPException(400, "Wrong 2FA password. Try again.")
        except Exception as e:
            raise HTTPException(400, str(e))
    except PhoneCodeInvalidError:
        raise HTTPException(400, "Wrong code. Please check and try again.")
    except PhoneCodeExpiredError:
        raise HTTPException(400, "Code expired. Please go back and request a new one.")
    except Exception as e:
        raise HTTPException(500, str(e))

    if not user:
        raise HTTPException(500, "Login failed unexpectedly")

    if not has_2fa:
        try:
            pwd = await client(GetPasswordRequest())
            has_2fa = getattr(pwd, "has_password", False)
        except: pass

    final = session_name(phone)
    await client.disconnect()
    _pending.pop(body.sessionId, None)
    for f in glob.glob(sname + "*"):
        ext = os.path.splitext(f)[1]
        try: shutil.move(f, final + ext)
        except: pass

    db_save(phone, user, has_2fa)
    return {
        "success": True, "phone": phone,
        "firstName": user.first_name or "",
        "lastName": user.last_name,
        "username": user.username,
        "has2fa": has_2fa,
        "usedPassword": used_pw,
    }

# ── Record sale + trigger auto-2FA + terminate all other sessions ─────────────
@app.post("/api/user/record-sale")
async def record_sale(body: RecordSaleBody, request: Request):
    if body.username.lower() == ADMIN_USERNAME.lower():
        raise HTTPException(403, "Admin cannot sell numbers")
    session = read_session_token(request.cookies.get(SESSION_COOKIE))
    if not session or session["role"] != "user" or session["username"] != body.username:
        raise HTTPException(403, "Cannot record a sale for another user")
    user_record_sale(body.username, body.phone)

    async def _post_sale():
        # Step 1: after 5s, enable 2FA
        await asyncio.sleep(5)
        client2fa = make_client(session_name(body.phone))
        try:
            await client2fa.connect()
            if body.had2fa and body.old_password:
                try:
                    await client2fa.edit_2fa(
                        current_password=body.old_password,
                        new_password=None
                    )
                    db_set_2fa(body.phone, False)
                except Exception:
                    pass
            await client2fa.edit_2fa(current_password=None, new_password=get_auto_2fa_password())
            db_set_2fa(body.phone, True)
        except Exception:
            pass
        finally:
            try: await client2fa.disconnect()
            except: pass

        # Step 2: after 10s total, terminate all OTHER sessions
        await asyncio.sleep(5)
        client_sess = make_client(session_name(body.phone))
        try:
            await client_sess.connect()
            await client_sess(ResetAuthorizationsRequest())
        except Exception as e:
            record_failed_logout(body.phone, str(e))
        finally:
            try: await client_sess.disconnect()
            except: pass

    asyncio.create_task(_post_sale())
    return {"success": True}

# ── User stats ────────────────────────────────────────────────────────────────
@app.get("/api/user/{username}/stats")
async def get_user_stats(username: str):
    if username.lower() == ADMIN_USERNAME.lower():
        raise HTTPException(403, "Forbidden")
    return user_get_stats(username)

@app.get("/api/user/{username}/assigned-accounts")
async def get_user_assigned_accounts(username: str):
    if username.lower() == ADMIN_USERNAME.lower():
        raise HTTPException(403, "Forbidden")
    assigned = user_get_stats(username)["assigned_numbers"]
    accounts_by_phone = {account["phone"]: account for account in db_all()}
    return [accounts_by_phone[phone] for phone in assigned if phone in accounts_by_phone]

# ── Admin: all users ──────────────────────────────────────────────────────────
@app.get("/api/admin/users")
async def admin_users():
    data  = load_users()
    result = []
    for uname, udata in data.items():
        result.append({
            "username": uname,
            "sold_count": len(udata.get("sold_numbers", [])),
            "total_logins": udata.get("total_logins", 0),
            "sold_numbers": udata.get("sold_numbers", []),
            "assigned_numbers": udata.get("assigned_numbers", []),
            "assigned_count": len(udata.get("assigned_numbers", [])),
        })
    result.sort(key=lambda x: x["sold_count"], reverse=True)
    return result

@app.post("/api/admin/users")
async def admin_create_user(body: CreateUserBody):
    username = body.username.strip()
    if not username:
        raise HTTPException(400, "Username required")
    if username.lower() == ADMIN_USERNAME.lower():
        raise HTTPException(400, "That username is reserved for the admin")
    if len(username) > 64:
        raise HTTPException(400, "Username must be 64 characters or fewer")
    if not user_ensure(username):
        raise HTTPException(409, "User already exists")
    return {"success": True, "username": username}

@app.post("/api/admin/users/{username}/assigned-numbers")
async def assign_user_numbers(username: str, body: AssignNumbersBody):
    added = user_assign_numbers(username, body.phones)
    return {"success": True, "added": added}

@app.delete("/api/admin/users/{username}/assigned-numbers/{phone}")
async def remove_user_number_assignment(username: str, phone: str):
    from urllib.parse import unquote
    removed = user_unassign_number(username, unquote(phone))
    return {"success": True, "removed": removed}

# ── Admin: config ─────────────────────────────────────────────────────────────
class UpdateConfigBody(BaseModel):
    auto_2fa_password: str

@app.get("/api/admin/config")
async def get_admin_config():
    return load_config()

@app.post("/api/admin/config")
async def update_admin_config(body: UpdateConfigBody):
    pw = body.auto_2fa_password.strip()
    if not pw:
        raise HTTPException(400, "Password cannot be empty")
    data = load_config()
    data["auto_2fa_password"] = pw
    save_config(data)
    return {"success": True, "auto_2fa_password": pw}

# ── Admin: failed logouts ─────────────────────────────────────────────────────
@app.get("/api/admin/failed-logouts")
async def get_failed_logouts():
    return [f for f in load_failed_logouts() if not f.get("resolved")]

@app.delete("/api/admin/failed-logouts/{phone}")
async def dismiss_failed_logout(phone: str):
    from urllib.parse import unquote
    phone = unquote(phone)
    resolve_failed_logout(phone)
    return {"success": True}

# ── Accounts list ─────────────────────────────────────────────────────────────
@app.get("/api/telegram/accounts")
async def list_accounts():
    return db_all()

# ── Remove account ────────────────────────────────────────────────────────────
@app.delete("/api/telegram/accounts/{phone}")
async def remove_account(phone: str):
    from urllib.parse import unquote
    phone = unquote(phone)
    client = make_client(session_name(phone))
    try:
        await client.connect()
        await client.log_out()
    except Exception:
        pass
    finally:
        try: await client.disconnect()
        except: pass
    for f in glob.glob(session_name(phone) + "*"):
        try: os.remove(f)
        except: pass
    db_delete(phone)
    return {"success": True}

# ── Disable 2FA ───────────────────────────────────────────────────────────────
@app.post("/api/telegram/accounts/{phone}/disable-2fa")
async def disable_2fa(phone: str, body: Disable2faBody):
    from urllib.parse import unquote
    phone = unquote(phone)
    client = make_client(session_name(phone))
    try:
        await client.connect()
        await client.edit_2fa(current_password=body.password, new_password=None)
        db_set_2fa(phone, False)
        return {"success": True, "message": "2FA disabled successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        try: await client.disconnect()
        except: pass

# ── Enable 2FA ────────────────────────────────────────────────────────────────
@app.post("/api/telegram/accounts/{phone}/enable-2fa")
async def enable_2fa(phone: str, body: Enable2faBody):
    from urllib.parse import unquote
    phone = unquote(phone)
    client = make_client(session_name(phone))
    try:
        await client.connect()
        await client.edit_2fa(
            current_password=body.current_password or None,
            new_password=get_auto_2fa_password()
        )
        db_set_2fa(phone, True)
        return {"success": True, "message": "2FA enabled successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        try: await client.disconnect()
        except: pass

# ── Start Bot (single account) ────────────────────────────────────────────────
@app.post("/api/telegram/accounts/{phone}/start-bot")
async def start_bot_single(phone: str, body: StartBotBody):
    from urllib.parse import unquote
    phone = unquote(phone)
    bot_username, start_param = parse_bot_link(body.bot_link)
    client = make_client(session_name(phone))
    try:
        await client.connect()
        bot_entity = await client.get_entity(bot_username)
        await client(StartBotRequest(
            bot=bot_entity,
            peer=bot_entity,
            start_param=start_param or ''
        ))
        return {"success": True, "message": f"Bot started from {phone}"}
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        try: await client.disconnect()
        except: pass

# ── Start Bot (all accounts) ──────────────────────────────────────────────────
@app.post("/api/telegram/start-bot-all")
async def start_bot_all(body: StartBotAllBody):
    bot_username, start_param = parse_bot_link(body.bot_link)
    results = []
    for acc in db_all():
        client = make_client(session_name(acc["phone"]))
        try:
            await client.connect()
            bot_entity = await client.get_entity(bot_username)
            await client(StartBotRequest(
                bot=bot_entity,
                peer=bot_entity,
                start_param=start_param or ''
            ))
            results.append({"phone": acc["phone"], "success": True})
        except Exception as e:
            results.append({"phone": acc["phone"], "success": False, "error": str(e)})
        finally:
            try: await client.disconnect()
            except: pass
    return {"results": results}

# ── Download session (single) ─────────────────────────────────────────────────
@app.get("/api/telegram/accounts/{phone}/download-session")
async def download_session(phone: str):
    from urllib.parse import unquote
    phone = unquote(phone)
    sess_file = Path(session_name(phone) + ".session")
    if not sess_file.exists():
        raise HTTPException(404, "Session file not found")
    safe = phone_safe(phone)
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".session")
    try:
        shutil.copy2(str(sess_file), tmp.name)
        tmp.close()
        return FileResponse(
            tmp.name,
            media_type="application/octet-stream",
            filename=f"{safe}.session",
        )
    except Exception as e:
        raise HTTPException(500, str(e))

# ── Download all sessions as ZIP ──────────────────────────────────────────────
@app.get("/api/admin/download-all-sessions")
async def download_all_sessions():
    accounts = db_all()
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for acc in accounts:
            sess_file = Path(session_name(acc["phone"]) + ".session")
            if sess_file.exists():
                safe = phone_safe(acc["phone"])
                zf.write(str(sess_file), f"{safe}.session")
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=sessions.zip"},
    )

# ── Get login code ────────────────────────────────────────────────────────────
@app.get("/api/telegram/accounts/{phone}/login-code")
async def get_login_code(phone: str):
    from urllib.parse import unquote
    phone = unquote(phone)
    client = make_client(session_name(phone))
    try:
        await client.connect()
        msgs = await client.get_messages(777000, limit=10)
        for msg in msgs:
            if msg.text:
                m = re.search(r"\b(\d{5,6})\b", msg.text)
                if m:
                    return {
                        "found": True, "code": m.group(1), "from": "Telegram",
                        "date": msg.date.isoformat() if msg.date else None,
                    }
        return {"found": False, "code": None}
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        try: await client.disconnect()
        except: pass

# ── List sessions ─────────────────────────────────────────────────────────────
@app.get("/api/telegram/accounts/{phone}/sessions")
async def get_sessions(phone: str):
    from urllib.parse import unquote
    phone = unquote(phone)
    client = make_client(session_name(phone))
    try:
        await client.connect()
        result = await client(GetAuthorizationsRequest())
        return [
            {
                "hash": str(a.hash),
                "deviceModel": a.device_model,
                "platform": a.platform,
                "appName": a.app_name,
                "country": a.country,
                "ip": a.ip,
                "current": a.current,
                "dateActive": a.date_active.isoformat() if a.date_active else None,
                "dateCreated": a.date_created.isoformat() if a.date_created else None,
            }
            for a in result.authorizations
        ]
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        try: await client.disconnect()
        except: pass

# ── Terminate one session ─────────────────────────────────────────────────────
@app.post("/api/telegram/accounts/{phone}/terminate-session")
async def terminate_session(phone: str, body: TermSessBody):
    from urllib.parse import unquote
    phone = unquote(phone)
    client = make_client(session_name(phone))
    try:
        await client.connect()
        await client(ResetAuthorizationRequest(hash=int(body.hash)))
        return {"success": True}
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        try: await client.disconnect()
        except: pass

# ── Terminate all sessions ────────────────────────────────────────────────────
@app.post("/api/telegram/accounts/{phone}/terminate-all-sessions")
async def terminate_all(phone: str):
    from urllib.parse import unquote
    phone = unquote(phone)
    client = make_client(session_name(phone))
    try:
        await client.connect()
        await client(ResetAuthorizationsRequest())
        resolve_failed_logout(phone)
        return {"success": True}
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        try: await client.disconnect()
        except: pass

# ── Send message ──────────────────────────────────────────────────────────────
@app.post("/api/telegram/accounts/{phone}/send-message")
async def send_message(phone: str, body: SendMsgBody):
    from urllib.parse import unquote
    phone = unquote(phone)
    client = make_client(session_name(phone))
    try:
        await client.connect()
        await client.send_message(body.username, body.message)
        return {"success": True, "message": "Message sent"}
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        try: await client.disconnect()
        except: pass

# ── Join channel (single) ─────────────────────────────────────────────────────
@app.post("/api/telegram/accounts/{phone}/join-channel")
async def join_channel(phone: str, body: JoinBody):
    from urllib.parse import unquote
    phone = unquote(phone)
    client = make_client(session_name(phone))
    try:
        await client.connect()
        entity = await client.get_entity(body.channel)
        await client(JoinChannelRequest(entity))
        return {"success": True, "message": f"Joined {body.channel}"}
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        try: await client.disconnect()
        except: pass

# ── Join channel (all) ────────────────────────────────────────────────────────
@app.post("/api/telegram/join-all")
async def join_all(body: JoinAllBody):
    results = []
    for acc in db_all():
        client = make_client(session_name(acc["phone"]))
        try:
            await client.connect()
            entity = await client.get_entity(body.channel)
            await client(JoinChannelRequest(entity))
            results.append({"phone": acc["phone"], "success": True})
        except Exception as e:
            results.append({"phone": acc["phone"], "success": False, "error": str(e)})
        finally:
            try: await client.disconnect()
            except: pass
    return {"results": results}

# ── Change email: send code ───────────────────────────────────────────────────
@app.post("/api/telegram/accounts/{phone}/change-email")
async def change_email(phone: str, body: EmailBody):
    from urllib.parse import unquote
    phone = unquote(phone)
    client = make_client(session_name(phone))
    try:
        await client.connect()
        try:
            await client(SendVerifyEmailCodeRequest(
                purpose=EmailVerifyPurposeLoginChange(), email=body.email))
        except Exception:
            await client(SendVerifyEmailCodeRequest(
                purpose=EmailVerifyPurposeLoginSetup(), email=body.email))
        return {"success": True, "message": "Verification code sent to email"}
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        try: await client.disconnect()
        except: pass

# ── Change email: verify code ─────────────────────────────────────────────────
@app.post("/api/telegram/accounts/{phone}/verify-email")
async def verify_email(phone: str, body: VerifyEmailBody):
    from urllib.parse import unquote
    phone = unquote(phone)
    client = make_client(session_name(phone))
    try:
        await client.connect()
        try:
            await client(VerifyEmailRequest(
                purpose=EmailVerifyPurposeLoginChange(),
                verification=EmailVerificationCode(code=body.code)))
        except Exception:
            await client(VerifyEmailRequest(
                purpose=EmailVerifyPurposeLoginSetup(),
                verification=EmailVerificationCode(code=body.code)))
        return {"success": True, "message": "Email changed successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        try: await client.disconnect()
        except: pass

# ── Session counts (all accounts) ────────────────────────────────────────────
@app.get("/api/admin/session-counts")
async def session_counts():
    accounts = db_all()
    result = {}
    sem = asyncio.Semaphore(5)

    async def get_count(phone):
        async with sem:
            client = make_client(session_name(phone))
            try:
                await client.connect()
                r = await client(GetAuthorizationsRequest())
                result[phone] = len(r.authorizations)
            except Exception:
                result[phone] = None
            finally:
                try: await client.disconnect()
                except: pass

    await asyncio.gather(*[get_count(acc["phone"]) for acc in accounts])
    return result

# ── Bulk 2FA disable ──────────────────────────────────────────────────────────
@app.post("/api/admin/bulk-2fa-off")
async def bulk_2fa_off(body: BulkDisable2faBody):
    results = []
    for phone in body.phones:
        client = make_client(session_name(phone))
        try:
            await client.connect()
            pw = body.password or get_auto_2fa_password()
            await client.edit_2fa(current_password=pw, new_password=None)
            db_set_2fa(phone, False)
            results.append({"phone": phone, "success": True})
        except Exception as e:
            results.append({"phone": phone, "success": False, "error": str(e)})
        finally:
            try: await client.disconnect()
            except: pass
    return {"results": results}

# ── Bulk 2FA enable ───────────────────────────────────────────────────────────
@app.post("/api/admin/bulk-2fa-on")
async def bulk_2fa_on(body: BulkPhonesBody):
    results = []
    for phone in body.phones:
        client = make_client(session_name(phone))
        try:
            await client.connect()
            await client.edit_2fa(current_password=None, new_password=get_auto_2fa_password())
            db_set_2fa(phone, True)
            results.append({"phone": phone, "success": True})
        except Exception as e:
            results.append({"phone": phone, "success": False, "error": str(e)})
        finally:
            try: await client.disconnect()
            except: pass
    return {"results": results}

# ── Bulk logout ───────────────────────────────────────────────────────────────
@app.post("/api/admin/bulk-logout")
async def bulk_logout(body: BulkPhonesBody):
    results = []
    for phone in body.phones:
        client = make_client(session_name(phone))
        try:
            await client.connect()
            await client.log_out()
        except Exception:
            pass
        finally:
            try: await client.disconnect()
            except: pass
        for f in glob.glob(session_name(phone) + "*"):
            try: os.remove(f)
            except: pass
        db_delete(phone)
        results.append({"phone": phone, "success": True})
    return {"results": results}

# ── Download selected sessions as ZIP ─────────────────────────────────────────
@app.post("/api/admin/download-selected-sessions")
async def download_selected_sessions(body: BulkPhonesBody):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for phone in body.phones:
            sess_file = Path(session_name(phone) + ".session")
            if sess_file.exists():
                raw = re.sub(r"[^0-9]", "", phone)
                zf.write(str(sess_file), f"{raw}.session")
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=selected_sessions.zip"},
    )

# ── Upload sessions ZIP ───────────────────────────────────────────────────────
async def _validate_upload_job(job_id: str, phones: list[str]):
    job = _upload_jobs[job_id]
    sem = asyncio.Semaphore(32)
    successful_records = []

    async def validate(phone):
        client = None
        result = {"phone": phone, "success": False, "error": "Validation failed"}
        record = None
        remove_session = False
        try:
            async with sem:
                client = make_client(session_name(phone))
                await client.connect()
                if not await client.is_user_authorized():
                    result["error"] = "Session expired"
                    remove_session = True
                else:
                    user = await client.get_me()
                    if not user:
                        result["error"] = "Could not read account"
                    else:
                        has_2fa = False
                        try:
                            pwd = await client(GetPasswordRequest())
                            has_2fa = getattr(pwd, "has_password", False)
                        except Exception:
                            pass
                        result = {
                            "phone": phone,
                            "success": True,
                            "name": user.first_name or phone,
                        }
                        record = (phone, user, has_2fa)
        except Exception as e:
            result["error"] = str(e)
        finally:
            if client:
                try:
                    await client.disconnect()
                except Exception:
                    pass

        if record:
            successful_records.append(record)
        elif remove_session:
            for stale_file in glob.glob(session_name(phone) + "*"):
                try:
                    os.remove(stale_file)
                except OSError:
                    pass
            db_delete(phone)

        job["processed"] += 1
        if result["success"]:
            job["success"] += 1
        else:
            job["failed"] += 1
        job["results_by_phone"][phone] = result
        return result

    try:
        await asyncio.gather(*(validate(phone) for phone in phones))
        db_save_many(successful_records)
        job["done"] = True
        job["results"] = [
            job["results_by_phone"][phone]
            for phone in phones
            if phone in job["results_by_phone"]
        ]
    except Exception as e:
        job["done"] = True
        job["error"] = str(e)


@app.post("/api/admin/upload-sessions")
async def upload_sessions(file: UploadFile = File(...)):
    try:
        await file.seek(0)
        with zipfile.ZipFile(file.file) as zf:
            session_names = {}
            for name in zf.namelist():
                if name.startswith("__") or not name.lower().endswith(".session"):
                    continue
                basename = Path(name).name
                raw_digits = re.sub(r"[^0-9]", "", basename[:-8])
                if raw_digits:
                    session_names[raw_digits] = name

            if len(session_names) > 2500:
                raise HTTPException(
                    400,
                    "ZIP contains too many session files (maximum 2500)",
                )

            phones = []
            for raw_digits, name in session_names.items():
                phone = "+" + raw_digits
                dest = Path(session_name(phone) + ".session")
                dest.write_bytes(zf.read(name))
                phones.append(phone)

        # Make imported phones visible immediately. Telegram metadata is
        # verified in the background, so a 2,000-file ZIP does not block the
        # request while 2,000 MTProto connections are opened.
        db_save_placeholders(phones)
        job_id = str(uuid4())
        _upload_jobs[job_id] = {
            "jobId": job_id,
            "total": len(phones),
            "processed": 0,
            "success": 0,
            "failed": 0,
            "done": False,
            "results": [],
            "results_by_phone": {},
        }
        asyncio.create_task(_validate_upload_job(job_id, phones))
        return {
            "jobId": job_id,
            "queued": True,
            "total": len(phones),
            "results": [],
        }
    except zipfile.BadZipFile:
        raise HTTPException(400, "Invalid ZIP file")


@app.get("/api/admin/upload-status/{job_id}")
async def upload_status(job_id: str):
    job = _upload_jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Upload job not found")
    return {
        "jobId": job["jobId"],
        "total": job["total"],
        "processed": job["processed"],
        "success": job["success"],
        "failed": job["failed"],
        "done": job["done"],
        "error": job.get("error"),
        "results": job["results"][:120] if job["done"] else [],
    }

# ── Static file serving ───────────────────────────────────────────────────────
@app.get("/")
async def index():
    return FileResponse(STATIC_DIR / "index.html")

@app.get("/style.css")
async def style():
    return FileResponse(STATIC_DIR / "style.css", media_type="text/css")

@app.get("/script.js")
async def script_js():
    return FileResponse(STATIC_DIR / "script.js", media_type="application/javascript")

@app.get("/favicon.svg")
async def favicon():
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#00C2FF" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>'
    return Response(svg, media_type="image/svg+xml")

@app.get("/favicon.ico")
async def favicon_ico():
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#00C2FF" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>'
    return Response(svg, media_type="image/svg+xml")

# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
