---
name: User assignment access model
description: Product decision for identity handling in the assigned Telegram account workflow.
---

Admin sign-in must require a password. End-user sign-in remains username-only unless the user changes this decision. The server should enforce the admin role and assigned-number checks using a signed session, but username-only end-user identities do not provide secure separation.

**Why:** The user chose username-only sign-in for end users after being told another person can claim a username, and separately requested a password for the admin.

**How to apply:** Keep the admin password in Replit Secrets on Replit or a private, ignored `.env` file for local runs—never source code. Do not claim assigned numbers are protected from another person using the same username; production-safe user isolation requires verifiable end-user identities.
