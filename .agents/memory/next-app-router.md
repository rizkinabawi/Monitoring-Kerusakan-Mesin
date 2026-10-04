---
name: Next App Router compatibility
description: Constraints when running the machine-monitoring UI in Next.js while retaining Wouter client routing.
---

For this app, mount the Wouter UI through a client-only dynamic boundary with server rendering disabled. Keep the Next `app` router and any `pages` router directories under the same root, or remove the legacy router directory.

**Why:** The inherited Vite scaffold had `src/pages` beside a root-level `app`, which Next rejects. Server-rendering the Wouter UI also raised `location is not defined`.

**How to apply:** Do not import the Wouter-based UI directly from a Next Server Component. Preserve the client-only wrapper and preview base-path setup when changing routes.