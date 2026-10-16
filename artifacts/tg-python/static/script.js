/* ══════════ STATE ══════════ */
const state = {
  accounts: [],
  allUsers: [],
  userAssignedAccounts: [],
  selectedAdminUser: null,
  adminDetailPlaceholder: null,
  currentPage: 'dashboard',
  detail: null,
  loginStep: 1,
  loginData: {},
  role: null,
  username: null,
  userSellData: {},
  userSellStep: 1,
  selectMode: false,
  selectedPhones: new Set(),
  pendingZipFile: null,
  sessionCounts: {},
  accountDisplayLimit: 60,
};

/* ══════════ API ══════════ */
const API = '/api';

/* ══════════ PHONE COUNTRIES ══════════ */
// Telegram returns phone numbers in international format. Match the longest
// calling code first so country labels remain correct for shared prefixes.
const COUNTRY_PREFIXES = [
  ['880', 'Bangladesh', '🇧🇩'],
  ['91', 'India', '🇮🇳'],
  ['92', 'Pakistan', '🇵🇰'],
  ['977', 'Nepal', '🇳🇵'],
  ['975', 'Bhutan', '🇧🇹'],
  ['94', 'Sri Lanka', '🇱🇰'],
  ['93', 'Afghanistan', '🇦🇫'],
  ['86', 'China', '🇨🇳'],
  ['81', 'Japan', '🇯🇵'],
  ['82', 'South Korea', '🇰🇷'],
  ['852', 'Hong Kong', '🇭🇰'],
  ['853', 'Macau', '🇲🇴'],
  ['886', 'Taiwan', '🇹🇼'],
  ['65', 'Singapore', '🇸🇬'],
  ['60', 'Malaysia', '🇲🇾'],
  ['62', 'Indonesia', '🇮🇩'],
  ['66', 'Thailand', '🇹🇭'],
  ['84', 'Vietnam', '🇻🇳'],
  ['63', 'Philippines', '🇵🇭'],
  ['855', 'Cambodia', '🇰🇭'],
  ['95', 'Myanmar', '🇲🇲'],
  ['673', 'Brunei', '🇧🇳'],
  ['960', 'Maldives', '🇲🇻'],
  ['967', 'Yemen', '🇾🇪'],
  ['961', 'Lebanon', '🇱🇧'],
  ['971', 'United Arab Emirates', '🇦🇪'],
  ['966', 'Saudi Arabia', '🇸🇦'],
  ['974', 'Qatar', '🇶🇦'],
  ['965', 'Kuwait', '🇰🇼'],
  ['968', 'Oman', '🇴🇲'],
  ['973', 'Bahrain', '🇧🇭'],
  ['972', 'Israel', '🇮🇱'],
  ['962', 'Jordan', '🇯🇴'],
  ['964', 'Iraq', '🇮🇶'],
  ['98', 'Iran', '🇮🇷'],
  ['90', 'Turkey', '🇹🇷'],
  ['7', 'Russia / Kazakhstan', '🇷🇺'],
  ['380', 'Ukraine', '🇺🇦'],
  ['44', 'United Kingdom', '🇬🇧'],
  ['353', 'Ireland', '🇮🇪'],
  ['33', 'France', '🇫🇷'],
  ['49', 'Germany', '🇩🇪'],
  ['39', 'Italy', '🇮🇹'],
  ['34', 'Spain', '🇪🇸'],
  ['351', 'Portugal', '🇵🇹'],
  ['31', 'Netherlands', '🇳🇱'],
  ['32', 'Belgium', '🇧🇪'],
  ['41', 'Switzerland', '🇨🇭'],
  ['43', 'Austria', '🇦🇹'],
  ['45', 'Denmark', '🇩🇰'],
  ['46', 'Sweden', '🇸🇪'],
  ['47', 'Norway', '🇳🇴'],
  ['358', 'Finland', '🇫🇮'],
  ['48', 'Poland', '🇵🇱'],
  ['30', 'Greece', '🇬🇷'],
  ['40', 'Romania', '🇷🇴'],
  ['36', 'Hungary', '🇭🇺'],
  ['420', 'Czechia', '🇨🇿'],
  ['421', 'Slovakia', '🇸🇰'],
  ['386', 'Slovenia', '🇸🇮'],
  ['385', 'Croatia', '🇭🇷'],
  ['381', 'Serbia', '🇷🇸'],
  ['382', 'Montenegro', '🇲🇪'],
  ['387', 'Bosnia and Herzegovina', '🇧🇦'],
  ['359', 'Bulgaria', '🇧🇬'],
  ['370', 'Lithuania', '🇱🇹'],
  ['371', 'Latvia', '🇱🇻'],
  ['372', 'Estonia', '🇪🇪'],
  ['375', 'Belarus', '🇧🇾'],
  ['995', 'Georgia', '🇬🇪'],
  ['374', 'Armenia', '🇦🇲'],
  ['994', 'Azerbaijan', '🇦🇿'],
  ['20', 'Egypt', '🇪🇬'],
  ['27', 'South Africa', '🇿🇦'],
  ['237', 'Cameroon', '🇨🇲'],
  ['232', 'Sierra Leone', '🇸🇱'],
  ['248', 'Seychelles', '🇸🇨'],
  ['963', 'Syria', '🇸🇾'],
  ['236', 'Central African Republic', '🇨🇫'],
  ['242', 'Republic of the Congo', '🇨🇬'],
  ['243', 'Democratic Republic of the Congo', '🇨🇩'],
  ['244', 'Angola', '🇦🇴'],
  ['234', 'Nigeria', '🇳🇬'],
  ['254', 'Kenya', '🇰🇪'],
  ['212', 'Morocco', '🇲🇦'],
  ['213', 'Algeria', '🇩🇿'],
  ['216', 'Tunisia', '🇹🇳'],
  ['218', 'Libya', '🇱🇾'],
  ['249', 'Sudan', '🇸🇩'],
  ['255', 'Tanzania', '🇹🇿'],
  ['256', 'Uganda', '🇺🇬'],
  ['251', 'Ethiopia', '🇪🇹'],
  ['233', 'Ghana', '🇬🇭'],
  ['225', 'Ivory Coast', '🇨🇮'],
  ['221', 'Senegal', '🇸🇳'],
  ['252', 'Somalia', '🇸🇴'],
  ['257', 'Burundi', '🇧🇮'],
  ['250', 'Rwanda', '🇷🇼'],
  ['258', 'Mozambique', '🇲🇿'],
  ['260', 'Zambia', '🇿🇲'],
  ['263', 'Zimbabwe', '🇿🇼'],
  ['264', 'Namibia', '🇳🇦'],
  ['265', 'Malawi', '🇲🇼'],
  ['266', 'Lesotho', '🇱🇸'],
  ['267', 'Botswana', '🇧🇼'],
  ['52', 'Mexico', '🇲🇽'],
  ['55', 'Brazil', '🇧🇷'],
  ['54', 'Argentina', '🇦🇷'],
  ['56', 'Chile', '🇨🇱'],
  ['57', 'Colombia', '🇨🇴'],
  ['51', 'Peru', '🇵🇪'],
  ['58', 'Venezuela', '🇻🇪'],
  ['591', 'Bolivia', '🇧🇴'],
  ['593', 'Ecuador', '🇪🇨'],
  ['595', 'Paraguay', '🇵🇾'],
  ['598', 'Uruguay', '🇺🇾'],
  ['506', 'Costa Rica', '🇨🇷'],
  ['507', 'Panama', '🇵🇦'],
  ['502', 'Guatemala', '🇬🇹'],
  ['503', 'El Salvador', '🇸🇻'],
  ['504', 'Honduras', '🇭🇳'],
  ['505', 'Nicaragua', '🇳🇮'],
  ['509', 'Haiti', '🇭🇹'],
  ['61', 'Australia', '🇦🇺'],
  ['64', 'New Zealand', '🇳🇿'],
  ['679', 'Fiji', '🇫🇯'],
  ['675', 'Papua New Guinea', '🇵🇬'],
  ['676', 'Tonga', '🇹🇴'],
  ['685', 'Samoa', '🇼🇸'],
  ['686', 'Kiribati', '🇰🇮'],
  ['691', 'Micronesia', '🇫🇲'],
  ['692', 'Marshall Islands', '🇲🇭'],
  ['678', 'Vanuatu', '🇻🇺'],
  ['677', 'Solomon Islands', '🇸🇧'],
  ['670', 'Timor-Leste', '🇹🇱'],
].sort((a, b) => b[0].length - a[0].length);

const NANP_AREA_CODES = [
  ['236', 'Canada', '🇨🇦'],
  ['276', 'United States', '🇺🇸'],
  ['551', 'United States', '🇺🇸'],
  ['876', 'Jamaica', '🇯🇲'],
  ['242', 'Bahamas', '🇧🇸'],
  ['246', 'Barbados', '🇧🇧'],
  ['268', 'Antigua and Barbuda', '🇦🇬'],
  ['284', 'British Virgin Islands', '🇻🇬'],
  ['340', 'US Virgin Islands', '🇻🇮'],
  ['345', 'Cayman Islands', '🇰🇾'],
  ['441', 'Bermuda', '🇧🇲'],
  ['473', 'Grenada', '🇬🇩'],
  ['649', 'Turks and Caicos Islands', '🇹🇨'],
  ['664', 'Montserrat', '🇲🇸'],
  ['670', 'Northern Mariana Islands', '🇲🇵'],
  ['671', 'Guam', '🇬🇺'],
  ['684', 'American Samoa', '🇦🇸'],
  ['721', 'Sint Maarten', '🇸🇽'],
  ['758', 'Saint Lucia', '🇱🇨'],
  ['767', 'Dominica', '🇩🇲'],
  ['784', 'Saint Vincent and the Grenadines', '🇻🇨'],
  ['787', 'Puerto Rico', '🇵🇷'],
  ['809', 'Dominican Republic', '🇩🇴'],
  ['829', 'Dominican Republic', '🇩🇴'],
  ['849', 'Dominican Republic', '🇩🇴'],
  ['868', 'Trinidad and Tobago', '🇹🇹'],
  ['869', 'Saint Kitts and Nevis', '🇰🇳'],
  ['939', 'Puerto Rico', '🇵🇷'],
];

const UNKNOWN_COUNTRY = { prefix: '', name: 'Unknown country', flag: '🌐' };

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.startsWith('00') ? digits.slice(2) : digits;
}

function getCountryInfo(phone) {
  const digits = normalizePhone(phone);
  if (digits.startsWith('1')) {
    const areaCode = digits.slice(1, 4);
    const nanpMatch = NANP_AREA_CODES.find(([prefix]) => areaCode === prefix);
    if (nanpMatch) {
      return { prefix: `1 ${nanpMatch[0]}`, name: nanpMatch[1], flag: nanpMatch[2] };
    }
    return { prefix: '1', name: 'United States / Canada', flag: '🇺🇸🇨🇦' };
  }
  const match = COUNTRY_PREFIXES.find(([prefix]) => digits.startsWith(prefix));
  return match
    ? { prefix: match[0], name: match[1], flag: match[2] }
    : UNKNOWN_COUNTRY;
}

async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(API + path, opts);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || data.error || `HTTP ${r.status}`);
  return data;
}

const get  = (path)       => api('GET',    path);
const post = (path, body) => api('POST',   path, body);
const del  = (path)       => api('DELETE', path);

/* ══════════ TOAST ══════════ */
function toast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ', warn: '⚠' };
  el.innerHTML = `<span style="font-size:14px;font-weight:800;flex-shrink:0">${icons[type]||'ℹ'}</span><span>${msg}</span>`;
  el.style.setProperty('--d', '3.5s');
  c.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/* ══════════ LOGIN GATE ══════════ */
async function gateLogin() {
  const u = (document.getElementById('gate-username').value || '').trim();
  if (!u) return toast('Please enter a username', 'warn');
  const btn = document.getElementById('gate-btn');
  setLoading(btn, true);
  try {
    const r = await post('/auth/login', { username: u });
    state.username = r.username;
    state.role     = r.role;
    localStorage.setItem('tgm_username', r.username);
    localStorage.setItem('tgm_role', r.role);
    applyRole();
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
  setLoading(btn, false);
}

function applyRole() {
  if (state.role === 'admin') restoreAdminDetailPage();
  document.getElementById('login-gate').style.display  = 'none';
  if (state.role === 'admin') {
    document.getElementById('admin-app').style.display = 'flex';
    document.getElementById('user-app').style.display  = 'none';
    state.userAssignedAccounts = [];
    document.getElementById('admin-username-label').textContent = state.username;
    loadAccounts();
    navigate('dashboard');
    startHealthCheck();
    setInterval(loadAccounts, 30000);
    setInterval(loadFailedLogouts, 60000);
  } else {
    document.getElementById('admin-app').style.display = 'none';
    document.getElementById('user-app').style.display  = 'block';
    state.accounts = [];
    state.userAssignedAccounts = [];
    document.getElementById('user-name-pill').textContent = state.username;
    loadUserStats();
    userNavigate('stats');
  }
}

function doLogout() {
  restoreAdminDetailPage();
  localStorage.removeItem('tgm_username');
  localStorage.removeItem('tgm_role');
  state.username = null;
  state.role     = null;
  document.getElementById('login-gate').style.display  = 'flex';
  document.getElementById('admin-app').style.display   = 'none';
  document.getElementById('user-app').style.display    = 'none';
  document.getElementById('gate-username').value       = '';
}

/* ══════════ HEALTH CHECK ══════════ */
function startHealthCheck() {
  async function check() {
    try {
      await get('/healthz');
      document.getElementById('api-status-dot').className  = 'status-dot';
      document.getElementById('api-status-text').textContent = 'API Online';
    } catch {
      document.getElementById('api-status-dot').className  = 'status-dot offline';
      document.getElementById('api-status-text').textContent = 'API Offline';
    }
  }
  check();
  setInterval(check, 15000);
}

/* ══════════ SIDEBAR ══════════ */
function toggleSidebar() {
  const s = document.getElementById('sidebar');
  const b = document.getElementById('sidebar-backdrop');
  const open = s.classList.toggle('open');
  b.classList.toggle('show', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

function closeSidebar() {
  const s = document.getElementById('sidebar');
  const b = document.getElementById('sidebar-backdrop');
  if (s) s.classList.remove('open');
  if (b) b.classList.remove('show');
  document.body.style.overflow = '';
}

/* ══════════ ADMIN NAVIGATION ══════════ */
function navigate(page, data) {
  if (state.role === 'admin') restoreAdminDetailPage();
  state.currentPage = page;
  if (data !== undefined) state.detail = data;

  document.querySelectorAll('#admin-app .page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#admin-app .nav-item, #admin-app .bnav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === page);
  });

  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');

  // Show/hide Select button only on dashboard
  const selectBtn = document.getElementById('topbar-select-btn');
  if (selectBtn) selectBtn.style.display = (page === 'dashboard') ? '' : 'none';

  const titles = {
    dashboard:      ['Accounts', 'Manage your Telegram accounts'],
    adminusers:     ['User Sell', 'Manage user number assignments'],
    login:          ['Add Account', 'Authenticate a new account'],
    detail:         ['Account Detail', state.detail || ''],
    botrefer:       ['Bot Refer', 'Start a bot from any account'],
    sessiondl:      ['Sessions Download', 'Download session files'],
    uploadsessions: ['Upload Sessions', 'Import accounts from ZIP'],
    more:           ['More Tools', 'Send messages & join channels'],
    sendmsg:        ['Send Message', 'Send from any account'],
    joinchannel:    ['Join Channel', 'Join with one or all accounts'],
  };
  const [title, sub] = titles[page] || ['', ''];
  document.getElementById('topbar-title').textContent = title;
  document.getElementById('topbar-sub').textContent   = sub;
  const accountCount = document.getElementById('topbar-account-count');
  if (accountCount) accountCount.style.display = page === 'dashboard' ? 'inline-flex' : 'none';

  if (page !== 'dashboard') exitSelectMode();
  if (page === 'detail' && state.detail) loadDetail(state.detail);
  if (page === 'dashboard') { loadAccounts(); loadFailedLogouts(); }
  if (page === 'adminusers') loadAdminUsers();
  if (page === 'botrefer') { populateAccountSelects(); updateBotAllCount(); }
  if (page === 'sessiondl') { populateAccountSelects(); updateDlCount(); }
  if (page === 'more') { populateAccountSelects(); updateMoreAllCount(); loadAdminConfig(); }
  if (page === 'sendmsg' || page === 'joinchannel') populateAccountSelects();

  const content = document.querySelector('#admin-app .content');
  if (content) content.scrollTop = 0;
}

/* ══════════ USER NAVIGATION ══════════ */
function userNavigate(page) {
  document.querySelectorAll('.user-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.user-nav-btn').forEach(b => b.classList.remove('active'));
  const detailPage = document.getElementById('page-detail');
  if (detailPage?.parentElement?.id === 'user-account-detail-slot') {
    detailPage.classList.remove('active');
  }
  const target = document.getElementById(`upage-${page}`);
  if (target) target.classList.add('active');
  const btn = document.getElementById(`unav-${page}`);
  if (btn) btn.classList.add('active');
  if (page === 'buy-numbers') loadUserStats();
}

/* ══════════ FAILED LOGOUT ALERTS ══════════ */
async function loadFailedLogouts() {
  try {
    const items = await get('/admin/failed-logouts');
    const el = document.getElementById('failed-logout-alerts');
    if (!el) return;
    if (!items.length) { el.innerHTML = ''; return; }
    el.innerHTML = items.map(item => `
      <div class="alert-banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div class="alert-body">
          <div class="alert-title">Session logout failed: <code>${esc(item.phone)}</code></div>
          <div class="alert-sub">${esc(item.error)} · ${item.timestamp ? new Date(item.timestamp).toLocaleString() : ''} · Manual logout required after 24h</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="manualLogout('${esc(item.phone)}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Force Logout
        </button>
        <button class="btn btn-secondary btn-sm" onclick="dismissFailedLogout('${esc(item.phone)}')">Dismiss</button>
      </div>`).join('');
  } catch (_) {}
}

async function manualLogout(phone) {
  try {
    await post(`/telegram/accounts/${encodeURIComponent(phone)}/terminate-all-sessions`, {});
    toast('All sessions terminated for ' + phone, 'success');
    loadFailedLogouts();
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
}

async function dismissFailedLogout(phone) {
  try {
    await del(`/admin/failed-logouts/${encodeURIComponent(phone)}`);
    loadFailedLogouts();
  } catch (_) {}
}

/* ══════════ ACCOUNTS ══════════ */
async function loadAccounts() {
  try {
    const accounts = await get('/telegram/accounts');
    state.accounts = Array.isArray(accounts) ? accounts : [];
    const accountPhones = new Set(state.accounts.map(accountPhone).filter(Boolean));
    state.selectedPhones = new Set(
      [...state.selectedPhones].filter(phone => accountPhones.has(phone)),
    );
    updateStats();
    renderAccounts(state.accounts);
    updateBulkBar();
    if (['botrefer', 'sessiondl', 'more', 'sendmsg', 'joinchannel'].includes(state.currentPage)) {
      populateAccountSelects();
    }
    updateBotAllCount();
    updateDlCount();
    const badge = document.getElementById('acct-badge');
    if (badge) {
      badge.textContent = state.accounts.length || '';
      badge.style.display = state.accounts.length ? 'flex' : 'none';
    }
    const allJoin = document.getElementById('all-join-count');
    if (allJoin) allJoin.textContent = state.accounts.length + ' accts';
  } catch (e) {
    toast('Failed to load: ' + e.message, 'error');
  }
}

async function loadSessionCounts() {
  try {
    const counts = await get('/admin/session-counts');
    state.sessionCounts = counts || {};
    renderAccounts(state.accounts);
  } catch (_) {}
}

function updateBotAllCount() {
  const el = document.getElementById('bot-all-count');
  if (el) el.textContent = state.accounts.length + ' accts';
}

function updateDlCount() {
  const el = document.getElementById('dl-all-count');
  if (el) el.textContent = state.accounts.length + ' sessions';
}

function updateMoreAllCount() {
  const el = document.getElementById('more-all-count');
  if (el) el.textContent = state.accounts.length + ' accts';
}

function updateStats() {
  const total = state.accounts.length;
  document.getElementById('stat-total').textContent  = total;
  document.getElementById('stat-2fa').textContent    = state.accounts.filter(a => a.has2fa).length;
  document.getElementById('stat-active').textContent = total;
  const accountCount = document.getElementById('topbar-account-count');
  if (accountCount) {
    accountCount.textContent = `${total} logged in`;
  }
  renderCountrySummary(state.accounts);
}

function renderCountrySummary(accounts) {
  const container = document.getElementById('country-summary');
  const totalLabel = document.getElementById('country-overview-total');
  if (!container) return;

  const grouped = new Map();
  accounts.forEach(account => {
    const country = getCountryInfo(account.phone);
    const current = grouped.get(country.name) || { ...country, count: 0 };
    current.count += 1;
    grouped.set(country.name, current);
  });

  const countries = [...grouped.values()].sort((a, b) =>
    b.count - a.count || a.name.localeCompare(b.name),
  );
  if (totalLabel) {
    totalLabel.textContent = countries.length
      ? `${countries.length} ${countries.length === 1 ? 'country' : 'countries'}`
      : '';
  }
  container.innerHTML = countries.map(country => `
    <button class="country-chip" type="button" data-country="${esc(country.name)}" title="Show ${esc(country.name)} numbers">
      <span class="country-chip-flag">${country.flag}</span>
      <span class="country-chip-name">${esc(country.name)}</span>
      <strong class="country-chip-count">${country.count}</strong>
    </button>
  `).join('');

  container.querySelectorAll('[data-country]').forEach(button => {
    button.addEventListener('click', () => {
      const input = document.getElementById('search-input');
      if (input) input.value = button.dataset.country || '';
      state.accountDisplayLimit = 60;
      renderAccounts(state.accounts);
      input?.focus();
    });
  });
}

function accountPhone(account) {
  return String(account?.phone || '');
}

function accountMatchesSearch(account, query) {
  const q = query.toLowerCase();
  const phone = accountPhone(account).toLowerCase();
  const country = getCountryInfo(phone);
  return phone.includes(q) ||
    country.name.toLowerCase().includes(q) ||
    country.prefix.includes(q.replace(/^\+/, '')) ||
    String(account?.username || '').toLowerCase().includes(q) ||
    String(account?.firstName || '').toLowerCase().includes(q);
}

function renderAccounts(accounts) {
  const container = document.getElementById('accounts-grid');
  const q = (document.getElementById('search-input')?.value || '').toLowerCase();
  const filtered = accounts.filter(a => accountMatchesSearch(a, q));

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="5"/><path d="M3 21a9 9 0 0118 0"/></svg>
        <h3>${accounts.length ? 'No matches' : 'No accounts yet'}</h3>
        <p>${accounts.length ? 'Try a different search' : 'No numbers connected yet'}</p>
      </div>`;
    return;
  }

  const visible = filtered.slice(0, state.accountDisplayLimit);
  const remaining = filtered.length - visible.length;
  container.innerHTML = visible.map(a => {
    const initials = ((a.firstName||'?')[0] + (a.lastName ? a.lastName[0] : '')).toUpperCase();
    const loginDuration = formatLoginDuration(a.loggedInAt);
    const serialNum = accounts.indexOf(a) + 1;
    const phone = accountPhone(a);
    const isSelected = state.selectedPhones.has(phone);
    const country = getCountryInfo(a.phone);
    const clickFn = state.selectMode
      ? `toggleSelectPhone('${esc(phone)}')`
      : `navigate('detail','${esc(phone)}')`;
    return `
      <div class="account-card${isSelected ? ' card-selected' : ''}" onclick="${clickFn}" style="${state.selectMode ? 'cursor:pointer' : ''}">
        <div class="flex items-center gap-3">
          ${state.selectMode ? `
          <div style="flex-shrink:0;width:20px;height:20px;border-radius:5px;border:2px solid ${isSelected ? 'var(--accent)' : 'rgba(255,255,255,.25)'};background:${isSelected ? 'var(--accent)' : 'transparent'};display:flex;align-items:center;justify-content:center">
            ${isSelected ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
          </div>` : ''}
          <div style="position:relative;flex-shrink:0">
            <div class="account-avatar">${initials}</div>
            <div class="account-serial">${serialNum}</div>
          </div>
          <div class="account-info">
            <div class="account-name">${esc(a.firstName)} ${esc(a.lastName||'')}</div>
            <div class="account-phone">${esc(phone)}</div>
            <div class="account-badges mt-1">
              <span class="badge badge-country">${country.flag} ${esc(country.name)}</span>
              ${a.username ? `<span class="badge badge-blue">@${esc(a.username)}</span>` : ''}
              ${a.has2fa ? `<span class="badge badge-yellow">2FA ON</span>` : `<span class="badge badge-green">2FA OFF</span>`}
              ${loginDuration ? `<span class="badge badge-dim">⏱ ${loginDuration}</span>` : '<span class="badge badge-green">Active</span>'}
              ${state.sessionCounts[a.phone] != null
                ? `<span class="badge" style="background:rgba(123,97,255,.18);color:#b39dff;border:1px solid rgba(123,97,255,.3)">📱 ${state.sessionCounts[a.phone]}</span>`
                : ''}
            </div>
          </div>
        </div>
      </div>`;
  }).join('') + (remaining > 0 ? `
    <div class="account-load-more" style="grid-column:1/-1">
      <span>Showing ${visible.length} of ${filtered.length} accounts</span>
      <button class="btn btn-secondary btn-sm" type="button" onclick="loadMoreAccounts()">Load 60 more</button>
    </div>` : '');
}

function loadMoreAccounts() {
  state.accountDisplayLimit += 60;
  renderAccounts(state.accounts);
}

/* ══════════ SELECT MODE ══════════ */
function toggleSelectMode() {
  if (state.selectMode) {
    exitSelectMode();
  } else {
    state.selectMode = true;
    state.selectedPhones = new Set();
    const btn = document.getElementById('topbar-select-btn');
    if (btn) { btn.innerHTML = btn.innerHTML.replace('Select', 'Cancel'); btn.style.background = 'rgba(0,194,255,.15)'; }
    renderAccounts(state.accounts);
    updateBulkBar();
  }
}

function exitSelectMode() {
  if (!state.selectMode) return;
  state.selectMode = false;
  state.selectedPhones = new Set();
  const btn = document.getElementById('topbar-select-btn');
  if (btn) { btn.innerHTML = btn.innerHTML.replace('Cancel', 'Select'); btn.style.background = ''; }
  const bar = document.getElementById('bulk-bar');
  if (bar) bar.style.display = 'none';
  renderAccounts(state.accounts);
}

function toggleSelectPhone(phone) {
  phone = String(phone || '');
  if (!phone) return;
  if (state.selectedPhones.has(phone)) {
    state.selectedPhones.delete(phone);
  } else {
    state.selectedPhones.add(phone);
  }
  updateBulkBar();
  renderAccounts(state.accounts);
}

function updateBulkBar() {
  const bar = document.getElementById('bulk-bar');
  if (!bar) return;
  const n = state.selectedPhones.size;
  if (state.selectMode) {
    bar.style.display = 'flex';
    const countEl = document.getElementById('bulk-count');
    if (countEl) countEl.textContent = n + ' selected';
  } else {
    bar.style.display = 'none';
  }
}

function bulkSelectAll() {
  const q = (document.getElementById('search-input')?.value || '').toLowerCase();
  state.accounts
    .filter(a => accountMatchesSearch(a, q))
    .map(accountPhone)
    .filter(Boolean)
    .forEach(phone => state.selectedPhones.add(phone));
  updateBulkBar();
  renderAccounts(state.accounts);
}

function bulkClearAll() {
  state.selectedPhones.clear();
  updateBulkBar();
  renderAccounts(state.accounts);
}

/* ══════════ BULK ACTIONS ══════════ */
async function bulkDownload() {
  const phones = [...state.selectedPhones];
  if (!phones.length) return toast('কোনো নাম্বার select করা হয়নি', 'warn');
  try {
    const resp = await fetch(`${API}/admin/download-selected-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phones }),
    });
    if (!resp.ok) throw new Error('Download failed');
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'selected_sessions.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast(`${phones.length} session ZIP downloaded`, 'success');
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
}

async function bulkDisable2fa() {
  const phones = [...state.selectedPhones];
  if (!phones.length) return toast('কোনো নাম্বার select করা হয়নি', 'warn');
  if (!confirm(`${phones.length} নাম্বারের 2FA OFF করবেন?`)) return;
  toast(`${phones.length} নাম্বারের 2FA off হচ্ছে...`, 'info');
  try {
    const r = await post('/admin/bulk-2fa-off', { phones });
    const ok  = r.results.filter(x => x.success).length;
    const fail = r.results.length - ok;
    r.results.filter(x => x.success).forEach(x => {
      const acc = state.accounts.find(a => a.phone === x.phone);
      if (acc) acc.has2fa = false;
    });
    updateStats();
    renderAccounts(state.accounts);
    toast(`2FA OFF: ${ok} সফল${fail ? ', ' + fail + ' ব্যর্থ' : ''}`, fail ? 'warn' : 'success');
  } catch (e) { toast('Error: ' + e.message, 'error'); }
}

async function bulkEnable2fa() {
  const phones = [...state.selectedPhones];
  if (!phones.length) return toast('কোনো নাম্বার select করা হয়নি', 'warn');
  if (!confirm(`${phones.length} নাম্বারে 2FA ON করবেন?`)) return;
  toast(`${phones.length} নাম্বারে 2FA on হচ্ছে...`, 'info');
  try {
    const r = await post('/admin/bulk-2fa-on', { phones });
    const ok  = r.results.filter(x => x.success).length;
    const fail = r.results.length - ok;
    r.results.filter(x => x.success).forEach(x => {
      const acc = state.accounts.find(a => a.phone === x.phone);
      if (acc) acc.has2fa = true;
    });
    updateStats();
    renderAccounts(state.accounts);
    toast(`2FA ON: ${ok} সফল${fail ? ', ' + fail + ' ব্যর্থ' : ''}`, fail ? 'warn' : 'success');
  } catch (e) { toast('Error: ' + e.message, 'error'); }
}

async function bulkLogout() {
  const phones = [...state.selectedPhones];
  if (!phones.length) return toast('কোনো নাম্বার select করা হয়নি', 'warn');
  if (!confirm(`${phones.length} নাম্বার logout করবেন?`)) return;
  toast(`${phones.length} নাম্বার logout হচ্ছে...`, 'info');
  try {
    const r = await post('/admin/bulk-logout', { phones });
    const ok = r.results.filter(x => x.success).length;
    state.accounts = state.accounts.filter(a => !state.selectedPhones.has(a.phone));
    exitSelectMode();
    updateStats();
    renderAccounts(state.accounts);
    populateAccountSelects();
    toast(`${ok} নাম্বার logout সফল`, 'success');
  } catch (e) { toast('Error: ' + e.message, 'error'); }
}

/* ══════════ UPLOAD SESSIONS ══════════ */
function handleZipSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  state.pendingZipFile = file;
  const zoneText = document.getElementById('upload-zone-text');
  if (zoneText) zoneText.textContent = `✓ ${file.name}`;
  const btn = document.getElementById('btn-upload-sessions');
  if (btn) btn.disabled = false;
}

function handleZipDrop(event) {
  event.preventDefault();
  document.getElementById('upload-drop-zone').style.borderColor = 'rgba(0,194,255,.35)';
  const file = event.dataTransfer.files[0];
  if (!file || !file.name.endsWith('.zip')) return toast('ZIP ফাইল দিন', 'warn');
  state.pendingZipFile = file;
  const zoneText = document.getElementById('upload-zone-text');
  if (zoneText) zoneText.textContent = `✓ ${file.name}`;
  const btn = document.getElementById('btn-upload-sessions');
  if (btn) btn.disabled = false;
}

function renderUploadResults(results, title) {
  const el = document.getElementById('upload-results');
  if (!el) return;
  const shown = results.slice(0, 120);
  el.innerHTML = `
    <div class="card">
      <div class="card-header"><div class="card-title">${esc(title)}</div></div>
      ${shown.length ? `<div class="result-list">${shown.map(x => `
        <div class="result-item ${x.success ? 'ok' : 'fail'}">
          <span style="color:${x.success ? 'var(--success)' : 'var(--danger)'};font-weight:800">${x.success ? '✓' : '✕'}</span>
          <span style="font-family:var(--mono);font-size:11px">${esc(x.phone)}</span>
          ${x.name ? `<span class="badge badge-dim" style="margin-left:auto">${esc(x.name)}</span>` : ''}
          ${x.error ? `<span style="color:var(--text-dim);margin-left:auto;font-size:10px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.error)}</span>` : ''}
        </div>`).join('')}</div>` : '<div class="text-dim text-sm">Verification is running in the background.</div>'}
    </div>
    ${results.length > 120 ? `<div class="text-dim text-sm" style="padding:10px 0">Showing the first 120 of ${results.length} results.</div>` : ''}`;
}

async function pollUploadStatus(jobId) {
  const progress = document.getElementById('upload-progress');
  try {
    const status = await get(`/admin/upload-status/${encodeURIComponent(jobId)}`);
    if (!status.done) {
      if (progress) {
        progress.textContent = `Verifying sessions: ${status.processed}/${status.total}…`;
        progress.style.display = 'block';
      }
      setTimeout(() => pollUploadStatus(jobId), 1000);
      return;
    }
    if (progress) {
      progress.textContent = status.error
        ? `Verification stopped: ${status.error}`
        : `Verification complete: ${status.success} logged in, ${status.failed} failed`;
      progress.style.display = 'block';
    }
    renderUploadResults(
      status.results || [],
      status.error
        ? `Upload finished with an error`
        : `Result: ${status.success} logged in${status.failed ? `, ${status.failed} failed` : ''}`,
    );
    loadAccounts();
    setTimeout(() => {
      if (progress) progress.style.display = 'none';
    }, 6000);
  } catch (e) {
    if (progress) progress.textContent = 'Could not read upload progress. Refresh to check accounts.';
  }
}

async function uploadSessions() {
  if (!state.pendingZipFile) return toast('আগে ZIP ফাইল select করুন', 'warn');
  const btn = document.getElementById('btn-upload-sessions');
  setLoading(btn, true);
  const progress = document.getElementById('upload-progress');
  if (progress) {
    progress.textContent = 'Uploading and queueing sessions…';
    progress.style.display = 'block';
  }
  const formData = new FormData();
  formData.append('file', state.pendingZipFile);
  try {
    const resp = await fetch(`${API}/admin/upload-sessions`, { method: 'POST', body: formData });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(data.detail || `HTTP ${resp.status}`);
    state.pendingZipFile = null;
    const zoneText = document.getElementById('upload-zone-text');
    if (zoneText) zoneText.textContent = 'Click or drag ZIP file here';
    document.getElementById('session-zip-input').value = '';
    if (btn) btn.disabled = true;

    if (data.queued && data.jobId) {
      renderUploadResults([], `Queued ${data.total} sessions — verifying in background`);
      toast(`${data.total} sessions queued for fast import`, 'success');
      loadAccounts();
      pollUploadStatus(data.jobId);
    } else {
      const results = data.results || [];
      const ok = results.filter(x => x.success).length;
      const fail = results.length - ok;
      renderUploadResults(results, `Result: ${ok} logged in${fail ? `, ${fail} failed` : ''}`);
      toast(`${ok} নাম্বার imported${fail ? ', ' + fail + ' failed' : ''}`, fail && !ok ? 'error' : ok ? 'success' : 'warn');
      if (progress) progress.style.display = 'none';
      if (ok > 0) loadAccounts();
    }
  } catch (e) {
    toast('Error: ' + e.message, 'error');
    if (progress) progress.style.display = 'none';
  }
  setLoading(btn, false);
}

function populateAccountSelects() {
  const page = document.getElementById(`page-${state.currentPage}`);
  const selects = page?.querySelectorAll('.account-select') ||
    document.querySelectorAll('.account-select');
  selects.forEach(sel => {
    const prev = sel.value;
    sel.innerHTML = `<option value="">-- Select Account --</option>` +
      state.accounts.map(a =>
        `<option value="${esc(a.phone)}">${esc(a.phone)}${a.firstName ? ' ('+esc(a.firstName)+')' : ''}</option>`
      ).join('');
    if (prev) sel.value = prev;
  });
}

/* ══════════ ADMIN USERS ══════════ */
async function loadAdminUsers() {
  const el = document.getElementById('admin-users-list');
  el.innerHTML = '<div class="empty-state"><p>Loading...</p></div>';
  try {
    const users = await get('/admin/users');
    state.allUsers = users;
    const badge = document.getElementById('users-badge');
    if (badge) {
      badge.textContent = users.length || '';
      badge.style.display = users.length ? 'flex' : 'none';
    }
    renderUsers(users);
  } catch (e) {
    el.innerHTML = '<div class="empty-state"><p style="color:var(--danger)">Failed to load users</p></div>';
    toast('Error: ' + e.message, 'error');
  }
}

function filterUsers() {
  const q = (document.getElementById('user-search-input')?.value || '').toLowerCase();
  const filtered = state.allUsers.filter(u => u.username.toLowerCase().includes(q));
  renderUsers(filtered);
}

function renderUsers(users) {
  const el = document.getElementById('admin-users-list');
  if (!users.length) {
    el.innerHTML = '<div class="empty-state"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><h3>No users found</h3><p>Users appear here after they sell numbers</p></div>';
    return;
  }
  el.innerHTML = `
    <div class="user-table">
      <div class="user-table-header">
        <div>Username</div>
        <div>Numbers Sold</div>
        <div>Assigned</div>
        <div>Total Logins</div>
      </div>
      ${users.map(u => `
        <div class="user-table-row">
          <div class="flex items-center gap-2">
            <div class="user-avatar">${esc(u.username)[0].toUpperCase()}</div>
            <button class="user-name-button" type="button" data-username="${esc(u.username)}">${esc(u.username)}</button>
          </div>
          <div><span class="badge badge-blue">${u.sold_count}</span></div>
          <div><span class="badge badge-purple">${u.assigned_count || 0}</span></div>
          <div><span class="badge badge-dim">${u.total_logins}</span></div>
        </div>
      `).join('')}
    </div>`;
  el.querySelectorAll('.user-name-button').forEach(button => {
    button.addEventListener('click', () => showUserDetail(button.dataset.username));
  });
}

function showUserDetail(username) {
  const u = state.allUsers.find(user => user.username === username);
  if (!u) return toast('User not found. Refresh the user list.', 'error');
  state.selectedAdminUser = username;
  const panel = document.getElementById('user-detail-panel');
  document.getElementById('user-detail-name').textContent = u.username;
  const el = document.getElementById('user-detail-numbers');
  if (!u.sold_numbers || !u.sold_numbers.length) {
    el.innerHTML = '<div class="empty-state" style="padding:14px"><p>No numbers sold yet</p></div>';
  } else {
    el.innerHTML = u.sold_numbers.map((ph, i) => `
      <div class="result-item ok" style="margin-bottom:6px">
        <span style="color:var(--text-dim);font-size:10px;font-family:var(--mono);min-width:20px">${i+1}.</span>
        <span style="font-family:var(--mono);font-size:13px;font-weight:600">${esc(ph)}</span>
        <span class="badge badge-green" style="margin-left:auto">Sold</span>
      </div>`).join('');
  }
  renderAssignedNumbersForAdmin(u);
  document.getElementById('assign-numbers-panel').style.display = 'none';
  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderAssignedNumbersForAdmin(user) {
  const el = document.getElementById('user-assigned-numbers');
  const phones = user.assigned_numbers || [];
  if (!phones.length) {
    el.innerHTML = '<div class="empty-state" style="padding:14px"><p>No numbers assigned yet</p></div>';
    return;
  }
  el.innerHTML = phones.map(phone => {
    const country = getCountryInfo(phone);
    return `
      <div class="result-item ok assigned-admin-row">
        <span class="badge badge-country">${country.flag} ${esc(country.name)}</span>
        <span class="assigned-phone">${esc(phone)}</span>
        <button class="btn btn-danger btn-sm unassign-user-number" type="button"
          data-username="${esc(user.username)}" data-phone="${esc(phone)}">Remove</button>
      </div>`;
  }).join('');
  el.querySelectorAll('.unassign-user-number').forEach(button => {
    button.addEventListener('click', () =>
      unassignUserNumber(button.dataset.username, button.dataset.phone),
    );
  });
}

function toggleAssignNumbers() {
  const panel = document.getElementById('assign-numbers-panel');
  const opening = panel.style.display === 'none';
  panel.style.display = opening ? 'block' : 'none';
  if (opening) renderAssignableCountries();
}

function renderAssignableCountries() {
  const select = document.getElementById('assign-country-select');
  if (!select) return;
  const countries = new Map();
  state.accounts.forEach(account => {
    const info = getCountryInfo(account.phone);
    countries.set(info.name, info);
  });
  const options = [...countries.values()].sort((a, b) => a.name.localeCompare(b.name));
  select.innerHTML = options.length
    ? options.map(country => `<option value="${esc(country.name)}">${country.flag} ${esc(country.name)}</option>`).join('')
    : '<option value="">No account numbers available</option>';
  renderAssignableNumbers();
}

function renderAssignableNumbers() {
  const container = document.getElementById('assign-number-options');
  const countrySelect = document.getElementById('assign-country-select');
  const username = state.selectedAdminUser;
  if (!container || !countrySelect || !username) return;
  const currentUser = state.allUsers.find(user => user.username === username);
  const assignedToOtherUsers = new Set(
    state.allUsers
      .filter(user => user.username !== username)
      .flatMap(user => user.assigned_numbers || []),
  );
  const alreadyAssigned = new Set(currentUser?.assigned_numbers || []);
  const candidates = state.accounts.filter(account => {
    const phone = String(account.phone || '');
    return getCountryInfo(phone).name === countrySelect.value &&
      !alreadyAssigned.has(phone) &&
      !assignedToOtherUsers.has(phone);
  });
  if (!candidates.length) {
    container.innerHTML = '<div class="empty-state" style="padding:12px"><p>এই দেশের কোনো unassigned account number নেই।</p></div>';
    return;
  }
  container.innerHTML = candidates.map(account => `
    <label class="assign-number-option">
      <input class="assign-account-checkbox" type="checkbox" value="${esc(account.phone)}">
      <span class="badge badge-country">${getCountryInfo(account.phone).flag} ${esc(countrySelect.value)}</span>
      <span class="assigned-phone">${esc(account.phone)}</span>
    </label>`).join('');
}

async function assignSelectedNumbers() {
  const username = state.selectedAdminUser;
  const phones = [...document.querySelectorAll('.assign-account-checkbox:checked')]
    .map(input => input.value);
  if (!username) return;
  if (!phones.length) return toast('Select at least one number', 'warn');
  const btn = document.getElementById('btn-assign-selected');
  setLoading(btn, true);
  try {
    await post(`/admin/users/${encodeURIComponent(username)}/assigned-numbers`, { phones });
    toast(`${phones.length} number${phones.length === 1 ? '' : 's'} assigned to ${username}`, 'success');
    await loadAdminUsers();
    showUserDetail(username);
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
  setLoading(btn, false);
}

async function unassignUserNumber(username, phone) {
  if (!confirm(`${phone} নম্বরটির assignment ${username} থেকে সরাবেন? Account logout বা delete হবে না।`)) return;
  try {
    await del(`/admin/users/${encodeURIComponent(username)}/assigned-numbers/${encodeURIComponent(phone)}`);
    toast(`${phone} assignment removed`, 'success');
    await loadAdminUsers();
    showUserDetail(username);
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
}

/* ══════════ BOT REFER ══════════ */
async function startBotSingle() {
  const phone    = document.getElementById('bot-from').value;
  const bot_link = document.getElementById('bot-link-single').value.trim();
  if (!phone)    return toast('Select an account', 'warn');
  if (!bot_link) return toast('Enter bot link or @username', 'warn');
  const btn = document.getElementById('btn-start-bot-single');
  setLoading(btn, true);
  try {
    const r = await post(`/telegram/accounts/${encodeURIComponent(phone)}/start-bot`, { bot_link });
    toast(r.message || 'Bot started!', 'success');
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
  setLoading(btn, false);
}

async function startBotAll() {
  const bot_link = document.getElementById('bot-link-all').value.trim();
  if (!bot_link)              return toast('Enter bot link or @username', 'warn');
  if (!state.accounts.length) return toast('No accounts logged in', 'warn');
  const btn = document.getElementById('btn-start-bot-all');
  setLoading(btn, true);
  try {
    const r = await post('/telegram/start-bot-all', { bot_link });
    const el = document.getElementById('bot-all-results');
    const ok = r.results.filter(x => x.success).length;
    el.innerHTML = `
      <div style="margin-top:12px;font-size:11px;font-weight:600;color:var(--text-mid);margin-bottom:6px">
        RESULTS — ${ok}/${r.results.length} started
      </div>
      <div class="result-list">
        ${r.results.map(x => `
          <div class="result-item ${x.success?'ok':'fail'}">
            <span style="color:${x.success?'var(--success)':'var(--danger)'};font-weight:800">${x.success?'✓':'✕'}</span>
            <span style="font-family:var(--mono);font-size:11px">${esc(x.phone)}</span>
            ${x.error ? `<span style="color:var(--text-dim);margin-left:auto;font-size:10px;text-align:right;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.error)}</span>` : ''}
          </div>`).join('')}
      </div>`;
    toast(`${ok}/${r.results.length} bots started`, ok === r.results.length ? 'success' : 'warn');
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
  setLoading(btn, false);
}

/* ══════════ SESSION DOWNLOAD ══════════ */
function downloadSession() {
  const phone = document.getElementById('dl-session-from').value;
  if (!phone) return toast('Select an account', 'warn');
  const url = `${API}/telegram/accounts/${encodeURIComponent(phone)}/download-session`;
  const a = document.createElement('a');
  a.href = url;
  a.download = '';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  toast('Downloading session...', 'info');
}

function downloadAllSessions() {
  if (!state.accounts.length) return toast('No accounts to download', 'warn');
  const url = `${API}/admin/download-all-sessions`;
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sessions.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  toast('Downloading all sessions as ZIP...', 'info');
}

/* ══════════ ADMIN LOGIN ══════════ */
function setLoginStep(step) {
  state.loginStep = step;
  document.querySelectorAll('#page-login .login-step').forEach((el, i) => {
    el.style.display = (i + 1 === step) ? 'block' : 'none';
  });
  [1,2,3].forEach(n => {
    const el = document.getElementById(`step-${n}`);
    if (!el) return;
    el.classList.toggle('active', n === step);
    el.classList.toggle('done',   n < step);
  });
}

async function sendCode() {
  const phone = document.getElementById('login-phone').value.trim();
  if (!phone) return toast('Enter phone number', 'warn');
  const btn = document.getElementById('btn-send-code');
  setLoading(btn, true);
  try {
    const r = await post('/telegram/send-code', { phone });
    state.loginData = { phone, phoneCodeHash: r.phoneCodeHash, sessionId: r.sessionId };
    document.getElementById('login-phone-display').textContent = phone;
    setLoginStep(2);
    toast('Code sent to ' + phone, 'success');
    setTimeout(() => document.getElementById('login-code')?.focus(), 100);
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
  setLoading(btn, false);
}

async function signIn() {
  const code = document.getElementById('login-code').value.trim();
  if (!code) return toast('Enter the code', 'warn');
  const btn = document.getElementById('btn-sign-in');
  setLoading(btn, true);
  try {
    const r = await post('/telegram/sign-in', {
      phone: state.loginData.phone, code,
      phoneCodeHash: state.loginData.phoneCodeHash,
      sessionId: state.loginData.sessionId, password: null,
    });
    toast(`Logged in: ${r.firstName}`, 'success');
    resetLogin(); await loadAccounts(); navigate('dashboard');
  } catch (e) {
    if (e.message === '2FA_REQUIRED') {
      setLoginStep(3); toast('2FA password required', 'warn');
      setTimeout(() => document.getElementById('login-2fa')?.focus(), 100);
    } else { toast('Error: ' + e.message, 'error'); }
  }
  setLoading(btn, false);
}

async function signIn2fa() {
  const pw = document.getElementById('login-2fa').value.trim();
  if (!pw) return toast('Enter 2FA password', 'warn');
  const btn = document.getElementById('btn-sign-in-2fa');
  setLoading(btn, true);
  try {
    const r = await post('/telegram/sign-in', {
      phone: state.loginData.phone,
      code: document.getElementById('login-code').value.trim(),
      phoneCodeHash: state.loginData.phoneCodeHash,
      sessionId: state.loginData.sessionId, password: pw,
    });
    toast(`Logged in: ${r.firstName}`, 'success');
    resetLogin(); await loadAccounts(); navigate('dashboard');
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  setLoading(btn, false);
}

function resetLogin() {
  state.loginData = {};
  ['login-phone','login-code','login-2fa'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  setLoginStep(1);
}

/* ══════════ USER: SELL NUMBER ══════════ */
function userSellStep(step) {
  state.userSellStep = step;
  document.querySelectorAll('.user-sell-step').forEach((el, i) => {
    el.style.display = (i + 1 === step) ? 'block' : 'none';
  });
  document.getElementById('usell-success').style.display = 'none';
  [1,2,3].forEach(n => {
    const el = document.getElementById(`ustep-${n}`);
    if (!el) return;
    el.classList.toggle('active', n === step);
    el.classList.toggle('done',   n < step);
  });
}

async function userSendCode() {
  const phone = document.getElementById('user-phone').value.trim();
  if (!phone) return toast('Enter phone number', 'warn');
  const btn = document.getElementById('ubtn-send-code');
  setLoading(btn, true);
  try {
    const r = await post('/telegram/send-code', { phone });
    state.userSellData = { phone, sessionId: r.sessionId, phoneCodeHash: r.phoneCodeHash };
    document.getElementById('user-phone-display').textContent = phone;
    userSellStep(2);
    toast('OTP sent to ' + phone, 'success');
    setTimeout(() => document.getElementById('user-otp')?.focus(), 100);
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
  setLoading(btn, false);
}

async function userVerify() {
  const code = document.getElementById('user-otp').value.trim();
  if (!code) return toast('Enter OTP code', 'warn');
  const btn = document.getElementById('ubtn-verify');
  setLoading(btn, true);
  try {
    const r = await post('/telegram/sign-in', {
      phone: state.userSellData.phone,
      code,
      phoneCodeHash: state.userSellData.phoneCodeHash,
      sessionId: state.userSellData.sessionId,
      password: null,
    });
    state.userSellData.had2fa      = r.has2fa || false;
    state.userSellData.usedPassword = r.usedPassword || null;
    await completeSale(r);
  } catch (e) {
    if (e.message === '2FA_REQUIRED') {
      userSellStep(3);
      toast('2FA password required', 'warn');
      setTimeout(() => document.getElementById('user-2fa-pw')?.focus(), 100);
    } else {
      toast('Error: ' + e.message, 'error');
    }
  }
  setLoading(btn, false);
}

async function userSign2fa() {
  const pw = document.getElementById('user-2fa-pw').value.trim();
  if (!pw) return toast('Enter your 2FA password', 'warn');
  const btn = document.getElementById('ubtn-sign2fa');
  setLoading(btn, true);
  try {
    const r = await post('/telegram/sign-in', {
      phone: state.userSellData.phone,
      code: document.getElementById('user-otp').value.trim(),
      phoneCodeHash: state.userSellData.phoneCodeHash,
      sessionId: state.userSellData.sessionId,
      password: pw,
    });
    state.userSellData.had2fa      = true;
    state.userSellData.usedPassword = pw;
    await completeSale(r);
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
  setLoading(btn, false);
}

async function completeSale(r) {
  try {
    await post('/user/record-sale', {
      username:     state.username,
      phone:        state.userSellData.phone,
      had2fa:       state.userSellData.had2fa || false,
      old_password: state.userSellData.usedPassword || null,
    });
  } catch (_) {}

  document.querySelectorAll('.user-sell-step').forEach(el => el.style.display = 'none');
  const successEl = document.getElementById('usell-success');
  successEl.style.display = 'block';
  document.getElementById('usell-success-phone').textContent = state.userSellData.phone;
  [1,2,3].forEach(n => {
    const s = document.getElementById(`ustep-${n}`);
    if (s) { s.classList.remove('active'); s.classList.add('done'); }
  });

  toast('Number sold successfully!', 'success');
  loadUserStats();
}

function userResetSell() {
  state.userSellData = {};
  ['user-phone','user-otp','user-2fa-pw'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('usell-success').style.display = 'none';
  userSellStep(1);
}

/* ══════════ USER STATS ══════════ */
async function loadUserStats() {
  try {
    const userPath = `/user/${encodeURIComponent(state.username)}`;
    const [r, assignedAccounts] = await Promise.all([
      get(`${userPath}/stats`),
      get(`${userPath}/assigned-accounts`),
    ]);
    state.userAssignedAccounts = Array.isArray(assignedAccounts) ? assignedAccounts : [];
    if (state.role === 'user') state.accounts = state.userAssignedAccounts;
    document.getElementById('user-stat-sold').textContent   = r.sold_numbers.length;
    document.getElementById('user-stat-logins').textContent = r.total_logins;

    const el = document.getElementById('user-sold-list');
    if (!r.sold_numbers.length) {
      el.innerHTML = '<div class="empty-state"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 12 11 13 2 9 22 2"/></svg><h3>No numbers sold yet</h3><p>Use "Sell Number" to get started</p></div>';
      renderUserAssignedAccounts();
      return;
    }
    el.innerHTML = r.sold_numbers.map((ph, i) => `
      <div class="result-item ok" style="margin-bottom:6px">
        <span style="color:var(--text-dim);font-size:10px;font-family:var(--mono);min-width:22px">${i+1}.</span>
        <span style="font-family:var(--mono);font-size:13px;font-weight:600">${esc(ph)}</span>
        <span class="badge badge-green" style="margin-left:auto">Sold</span>
      </div>`).join('');
    renderUserAssignedAccounts();
  } catch (e) {
    toast('Failed to load stats: ' + e.message, 'error');
  }
}

function renderUserAssignedAccounts() {
  const el = document.getElementById('user-assigned-list');
  if (!el) return;
  if (!state.userAssignedAccounts.length) {
    el.innerHTML = '<div class="empty-state"><h3>No numbers assigned yet</h3><p>Contact the admin if you expect to see a number here.</p></div>';
    return;
  }
  el.innerHTML = state.userAssignedAccounts.map(account => {
    const country = getCountryInfo(account.phone);
    return `
      <button class="user-assigned-account" type="button" data-phone="${esc(account.phone)}">
        <span class="badge badge-country">${country.flag} ${esc(country.name)}</span>
        <span class="assigned-phone">${esc(account.phone)}</span>
        <span class="user-assigned-action">Open details →</span>
      </button>`;
  }).join('');
  el.querySelectorAll('.user-assigned-account').forEach(button => {
    button.addEventListener('click', () => openUserAssignedAccount(button.dataset.phone));
  });
}

function openUserAssignedAccount(phone) {
  const account = state.userAssignedAccounts.find(item => item.phone === phone);
  if (!account) return toast('This number is no longer assigned to you', 'error');
  const detailPage = document.getElementById('page-detail');
  const slot = document.getElementById('user-account-detail-slot');
  if (detailPage.parentElement !== slot) {
    state.adminDetailPlaceholder = document.createComment('admin account detail location');
    detailPage.parentNode.insertBefore(state.adminDetailPlaceholder, detailPage);
    slot.appendChild(detailPage);
  }
  document.querySelectorAll('.user-page').forEach(page => page.classList.remove('active'));
  document.querySelectorAll('.user-nav-btn').forEach(button => {
    button.classList.toggle('active', button.id === 'unav-buy-numbers');
  });
  state.detail = phone;
  detailPage.classList.add('active');
  loadDetail(phone);
}

function restoreAdminDetailPage() {
  const detailPage = document.getElementById('page-detail');
  const slot = document.getElementById('user-account-detail-slot');
  if (!detailPage || !slot || detailPage.parentElement !== slot) return;
  detailPage.classList.remove('active');
  const placeholder = state.adminDetailPlaceholder;
  if (placeholder?.parentNode) {
    placeholder.parentNode.insertBefore(detailPage, placeholder);
    placeholder.remove();
  } else {
    document.querySelector('#admin-app .content')?.appendChild(detailPage);
  }
  state.adminDetailPlaceholder = null;
}

function backFromDetail() {
  if (state.role === 'user') {
    restoreAdminDetailPage();
    userNavigate('buy-numbers');
  } else {
    navigate('dashboard');
  }
}

/* ══════════ DETAIL ══════════ */
async function loadDetail(phone) {
  const acc = state.accounts.find(a => a.phone === phone);
  if (!acc) return;

  const initials = ((acc.firstName||'?')[0] + (acc.lastName ? acc.lastName[0] : '')).toUpperCase();
  document.getElementById('detail-avatar').textContent   = initials;
  document.getElementById('detail-name').textContent     = `${acc.firstName||''} ${acc.lastName||''}`.trim();
  document.getElementById('detail-phone').textContent    = acc.phone;
  document.getElementById('detail-username').textContent = acc.username ? '@'+acc.username : '';
  const removeButton = document.getElementById('detail-remove-btn');
  if (removeButton) removeButton.style.display = state.role === 'admin' ? '' : 'none';

  const badge = document.getElementById('detail-2fa-badge');
  badge.textContent  = acc.has2fa ? '2FA ON' : '2FA OFF';
  badge.className    = 'badge ' + (acc.has2fa ? 'badge-yellow' : 'badge-green');

  document.getElementById('disable-2fa-section').style.display = acc.has2fa ? 'block' : 'none';
  document.getElementById('no-2fa-msg').style.display          = acc.has2fa ? 'none'  : 'block';
  document.getElementById('login-code-result').innerHTML = '';
  document.getElementById('sessions-list').innerHTML     = '<div class="text-dim text-sm">Tap "Refresh" to load sessions</div>';
  document.getElementById('email-step2').style.display   = 'none';
  document.getElementById('email-input').value           = '';
  document.getElementById('email-code').value            = '';
}

async function disable2fa() {
  const btn = document.getElementById('btn-disable-2fa');
  setLoading(btn, true);
  try {
    const r = await post(`/telegram/accounts/${encodeURIComponent(state.detail)}/disable-2fa`, { password: '4735908767' });
    toast(r.message || '2FA disabled', 'success');
    const acc = state.accounts.find(a => a.phone === state.detail);
    if (acc) { acc.has2fa = false; loadDetail(state.detail); }
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  setLoading(btn, false);
}

async function getLoginCode() {
  const btn = document.getElementById('btn-get-code');
  setLoading(btn, true);
  try {
    const r = await get(`/telegram/accounts/${encodeURIComponent(state.detail)}/login-code`);
    const el = document.getElementById('login-code-result');
    if (r.found) {
      el.innerHTML = `
        <div class="code-box">
          <div>
            <div class="code-value">${esc(r.code)}</div>
            <div class="code-meta">From: Telegram · ${r.date ? new Date(r.date).toLocaleTimeString() : ''}</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="copyText('${esc(r.code)}')">Copy</button>
        </div>`;
      toast('Code: ' + r.code, 'success');
    } else {
      el.innerHTML = `<div class="empty-state" style="padding:14px"><p>No recent code found</p></div>`;
      toast('No recent code found', 'warn');
    }
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  setLoading(btn, false);
}

async function loadSessions() {
  const btn = document.getElementById('btn-load-sessions');
  setLoading(btn, true);
  try {
    const sessions = await get(`/telegram/accounts/${encodeURIComponent(state.detail)}/sessions`);
    renderSessions(sessions);
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  setLoading(btn, false);
}

function renderSessions(sessions) {
  const el = document.getElementById('sessions-list');
  if (!sessions || !sessions.length) {
    el.innerHTML = `<div class="empty-state" style="padding:14px"><p>No sessions found</p></div>`;
    return;
  }
  el.innerHTML = sessions.map(s => `
    <div class="session-item">
      <div class="session-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg></div>
      <div class="session-info flex-1">
        <div class="session-device">${esc(s.deviceModel)}${s.current ? ' <span class="session-current">CURRENT</span>' : ''}</div>
        <div class="session-meta">${esc(s.appName)} · ${esc(s.country)} · ${s.dateActive ? new Date(s.dateActive).toLocaleDateString() : ''}</div>
      </div>
      ${!s.current ? `<button class="btn btn-danger btn-sm" onclick="terminateSession('${esc(s.hash)}')">Kill</button>` : ''}
    </div>`).join('');
}

async function terminateSession(hash) {
  try {
    await post(`/telegram/accounts/${encodeURIComponent(state.detail)}/terminate-session`, { hash });
    toast('Session terminated', 'success');
    loadSessions();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
}

async function terminateAllSessions() {
  const btn = document.getElementById('btn-terminate-all');
  setLoading(btn, true);
  try {
    await post(`/telegram/accounts/${encodeURIComponent(state.detail)}/terminate-all-sessions`, {});
    toast('All other sessions terminated', 'success');
    loadSessions();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  setLoading(btn, false);
}

async function logoutAccount() {
  if (!confirm(`Remove ${state.detail}?`)) return;
  try {
    await del(`/telegram/accounts/${encodeURIComponent(state.detail)}`);
    toast('Account removed', 'success');
    state.accounts = state.accounts.filter(a => a.phone !== state.detail);
    updateStats(); navigate('dashboard');
  } catch (e) { toast('Error: ' + e.message, 'error'); }
}

/* ══════════ EMAIL ══════════ */
async function sendEmail() {
  const email = document.getElementById('email-input').value.trim();
  if (!email) return toast('Enter email address', 'warn');
  if (!email.includes('@')) return toast('Enter a valid email', 'warn');
  const btn = document.getElementById('btn-send-email');
  setLoading(btn, true);
  try {
    await post(`/telegram/accounts/${encodeURIComponent(state.detail)}/change-email`, { email });
    document.getElementById('email-step2').style.display = 'block';
    toast('Verification code sent to email', 'success');
    setTimeout(() => document.getElementById('email-code')?.focus(), 100);
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  setLoading(btn, false);
}

async function verifyEmail() {
  const email = document.getElementById('email-input').value.trim();
  const code  = document.getElementById('email-code').value.trim();
  if (!code) return toast('Enter verification code', 'warn');
  const btn = document.getElementById('btn-verify-email');
  setLoading(btn, true);
  try {
    await post(`/telegram/accounts/${encodeURIComponent(state.detail)}/verify-email`, { email, code });
    toast('Email changed successfully!', 'success');
    document.getElementById('email-input').value         = '';
    document.getElementById('email-code').value          = '';
    document.getElementById('email-step2').style.display = 'none';
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  setLoading(btn, false);
}

/* ══════════ SEND MESSAGE ══════════ */
async function sendMessage() {
  const phone    = document.getElementById('msg-from').value;
  const username = document.getElementById('msg-to').value.trim();
  const message  = document.getElementById('msg-text').value.trim();
  if (!phone)    return toast('Select an account', 'warn');
  if (!username) return toast('Enter username or phone', 'warn');
  if (!message)  return toast('Enter message text', 'warn');
  const btn = document.getElementById('btn-send-msg');
  setLoading(btn, true);
  try {
    await post(`/telegram/accounts/${encodeURIComponent(phone)}/send-message`, { username, message });
    toast('Message sent!', 'success');
    document.getElementById('msg-text').value = '';
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  setLoading(btn, false);
}

/* ══════════ CONFIG / 2FA PASSWORD ══════════ */
let _current2faPw = '';

async function loadAdminConfig() {
  try {
    const r = await get('/admin/config');
    _current2faPw = r.auto_2fa_password || '';
    const el = document.getElementById('current-2fa-pw-display');
    if (el) el.textContent = _current2faPw;
  } catch (_) {}
}

async function save2faPw() {
  const pw = (document.getElementById('new-2fa-pw-input')?.value || '').trim();
  if (!pw) return toast('Enter a new password', 'warn');
  const btn = document.getElementById('btn-save-2fa-pw');
  setLoading(btn, true);
  try {
    const r = await post('/admin/config', { auto_2fa_password: pw });
    _current2faPw = r.auto_2fa_password;
    const el = document.getElementById('current-2fa-pw-display');
    if (el) el.textContent = _current2faPw;
    document.getElementById('new-2fa-pw-input').value = '';
    toast('Auto 2FA password updated!', 'success');
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
  setLoading(btn, false);
}

function copyCurrent2faPw() {
  if (_current2faPw) copyText(_current2faPw);
  else toast('No password loaded', 'warn');
}

/* ══════════ MORE PAGE FUNCTIONS ══════════ */
async function sendMessageMore() {
  const phone    = document.getElementById('more-msg-from').value;
  const username = document.getElementById('more-msg-to').value.trim();
  const message  = document.getElementById('more-msg-text').value.trim();
  if (!phone)    return toast('Select an account', 'warn');
  if (!username) return toast('Enter username or phone', 'warn');
  if (!message)  return toast('Enter message text', 'warn');
  const btn = document.getElementById('btn-more-send-msg');
  setLoading(btn, true);
  try {
    await post(`/telegram/accounts/${encodeURIComponent(phone)}/send-message`, { username, message });
    toast('Message sent!', 'success');
    document.getElementById('more-msg-text').value = '';
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  setLoading(btn, false);
}

async function joinChannelMore() {
  const phone   = document.getElementById('more-join-from').value;
  const channel = document.getElementById('more-join-channel').value.trim();
  if (!phone)   return toast('Select an account', 'warn');
  if (!channel) return toast('Enter channel username', 'warn');
  const btn = document.getElementById('btn-more-join');
  setLoading(btn, true);
  try {
    const r = await post(`/telegram/accounts/${encodeURIComponent(phone)}/join-channel`, { channel });
    toast(r.message || 'Joined!', 'success');
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  setLoading(btn, false);
}

async function joinAllMore() {
  const channel = document.getElementById('more-join-all-channel').value.trim();
  if (!channel)               return toast('Enter channel username', 'warn');
  if (!state.accounts.length) return toast('No accounts logged in', 'warn');
  const btn = document.getElementById('btn-more-join-all');
  setLoading(btn, true);
  try {
    const r = await post('/telegram/join-all', { channel });
    const el = document.getElementById('more-join-all-results');
    const ok = r.results.filter(x => x.success).length;
    el.innerHTML = `
      <div style="margin-top:12px;font-size:11px;font-weight:600;color:var(--text-mid);margin-bottom:6px">
        RESULTS — ${ok}/${r.results.length} joined
      </div>
      <div class="result-list">
        ${r.results.map(x => `
          <div class="result-item ${x.success?'ok':'fail'}">
            <span style="color:${x.success?'var(--success)':'var(--danger)'};font-weight:800">${x.success?'✓':'✕'}</span>
            <span style="font-family:var(--mono);font-size:11px">${esc(x.phone)}</span>
            ${x.error ? `<span style="color:var(--text-dim);margin-left:auto;font-size:10px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.error)}</span>` : ''}
          </div>`).join('')}
      </div>`;
    toast(`${ok}/${r.results.length} joined`, ok === r.results.length ? 'success' : 'warn');
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  setLoading(btn, false);
}

/* ══════════ JOIN CHANNEL ══════════ */
async function joinChannel() {
  const phone   = document.getElementById('join-from').value;
  const channel = document.getElementById('join-channel-input').value.trim();
  if (!phone)   return toast('Select an account', 'warn');
  if (!channel) return toast('Enter channel username', 'warn');
  const btn = document.getElementById('btn-join-channel');
  setLoading(btn, true);
  try {
    const r = await post(`/telegram/accounts/${encodeURIComponent(phone)}/join-channel`, { channel });
    toast(r.message || 'Joined!', 'success');
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  setLoading(btn, false);
}

async function joinAllChannels() {
  const channel = document.getElementById('join-all-channel').value.trim();
  if (!channel)               return toast('Enter channel username', 'warn');
  if (!state.accounts.length) return toast('No accounts logged in', 'warn');
  const btn = document.getElementById('btn-join-all');
  setLoading(btn, true);
  try {
    const r = await post('/telegram/join-all', { channel });
    const el = document.getElementById('join-all-results');
    const ok = r.results.filter(x => x.success).length;
    el.innerHTML = `
      <div style="margin-top:12px;font-size:11px;font-weight:600;color:var(--text-mid);margin-bottom:6px">
        RESULTS — ${ok}/${r.results.length} joined
      </div>
      <div class="result-list">
        ${r.results.map(x => `
          <div class="result-item ${x.success?'ok':'fail'}">
            <span style="color:${x.success?'var(--success)':'var(--danger)'};font-weight:800">${x.success?'✓':'✕'}</span>
            <span style="font-family:var(--mono);font-size:11px">${esc(x.phone)}</span>
            ${x.error ? `<span style="color:var(--text-dim);margin-left:auto;font-size:10px;text-align:right;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.error)}</span>` : ''}
          </div>`).join('')}
      </div>`;
    toast(`${ok}/${r.results.length} accounts joined`, ok === r.results.length ? 'success' : 'warn');
  } catch (e) { toast('Error: ' + e.message, 'error'); }
  setLoading(btn, false);
}

/* ══════════ UTILS ══════════ */
function formatLoginDuration(loggedInAt) {
  if (!loggedInAt) return null;
  const ms = Date.now() - new Date(loggedInAt).getTime();
  if (ms < 0) return null;
  const mins  = Math.floor(ms / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days > 0)  return days + 'd ' + (hours % 24) + 'h';
  if (hours > 0) return hours + 'h ' + (mins % 60) + 'm';
  if (mins > 0)  return mins + 'm';
  return 'just now';
}

function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function copyText(t) {
  navigator.clipboard.writeText(t).then(() => toast('Copied!', 'success'));
}

function setLoading(btn, on) {
  if (!btn) return;
  if (on) {
    btn.dataset.origHtml = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> Loading...`;
    btn.disabled = true;
  } else {
    if (btn.dataset.origHtml) btn.innerHTML = btn.dataset.origHtml;
    btn.disabled = false;
  }
}

/* ══════════ INIT ══════════ */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('gate-username')?.addEventListener('keydown', e => { if(e.key==='Enter') gateLogin(); });
  document.getElementById('login-phone')?.addEventListener('keydown',   e => { if(e.key==='Enter') sendCode(); });
  document.getElementById('login-code')?.addEventListener('keydown',    e => { if(e.key==='Enter') signIn(); });
  document.getElementById('login-2fa')?.addEventListener('keydown',     e => { if(e.key==='Enter') signIn2fa(); });
  document.getElementById('email-code')?.addEventListener('keydown',    e => { if(e.key==='Enter') verifyEmail(); });
  document.getElementById('user-phone')?.addEventListener('keydown',    e => { if(e.key==='Enter') userSendCode(); });
  document.getElementById('user-otp')?.addEventListener('keydown',      e => { if(e.key==='Enter') userVerify(); });
  document.getElementById('user-2fa-pw')?.addEventListener('keydown',   e => { if(e.key==='Enter') userSign2fa(); });

  document.getElementById('search-input')?.addEventListener('input', () => {
    state.accountDisplayLimit = 60;
    renderAccounts(state.accounts);
  });

  let touchStartX = 0;
  document.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', e => {
    const dx = touchStartX - e.changedTouches[0].clientX;
    if (dx > 60 && document.getElementById('sidebar')?.classList.contains('open')) closeSidebar();
  }, { passive: true });

  const savedUser = localStorage.getItem('tgm_username');
  const savedRole = localStorage.getItem('tgm_role');
  if (savedUser && savedRole) {
    state.username = savedUser;
    state.role     = savedRole;
    applyRole();
  }
});
