---
name: Imported Python app routing
description: Non-Vite Python web apps imported into the workspace need artifact routing adjustments.
---

For an imported Python web app, the managed web artifact's development command is evaluated from that artifact's directory, so sibling source folders need paths such as `cd ../source-app`. A pre-existing artifact with a more specific route like `/api` can shadow the imported root app; move that unused route before verifying the app through the shared proxy.

**Why:** The Python process can be healthy on its local port while the proxied preview still returns 502 or sends API requests to an unrelated scaffold service.

**How to apply:** When importing a server-rendered app, register a root web artifact, point its managed service at the Python entrypoint, and inspect all existing artifact paths for conflicts before testing preview URLs.