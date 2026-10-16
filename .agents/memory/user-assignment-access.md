---
name: User assignment access model
description: Product decision for identity handling in the assigned Telegram account workflow.
---

For the assigned-number workflow, retain the existing username-only login unless the user changes this decision. Be explicit that username-only login does not authenticate identity or provide secure separation between users.

**Why:** The user chose to keep username-only login after being told another person can claim a username and access account tools.

**How to apply:** Do not claim assignments are protected from other users. If production-safe user isolation is requested later, first add verifiable identities and server-side authorization for Telegram account operations.
