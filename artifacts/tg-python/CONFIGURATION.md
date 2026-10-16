# Running TG Manager outside Replit

The admin username is configured in `server.py`. The admin password and session-signing key are read from environment variables so credentials do not have to be embedded in source code.

For a local run:

1. Copy `.env.example` to `.env` in this directory.
2. Replace both placeholder values with your own values. Use a strong admin password and a long, random session secret.
3. Keep `.env` private; it is excluded from Git.
4. Run `python server.py` from this directory. The local server uses port `8080` unless `PORT` is set.

In Replit, set `ADMIN_PASSWORD` and `SESSION_SECRET` through Replit Secrets instead. The application prefers environment values over `.env`.
