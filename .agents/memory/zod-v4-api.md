---
name: Zod v4 API quirks in api-server
description: How to correctly use Zod in the api-server artifact (import path, error field, direct dep)
---

The api-server does NOT inherit zod from workspace packages automatically.

**Rule:** Add `zod` as a direct `dependency` in `artifacts/api-server/package.json` (use `"catalog:"` since it's in the workspace catalog at `^3.25.76`).

**Import path:** Always `import { z } from "zod/v4"` — this is the v4 compatibility layer in zod 3.x.

**Error field:** In Zod v4 API, `ZodError` exposes `.issues[]` not `.errors[]`. Use:
```ts
parsed.error.issues[0]?.message ?? "Dados inválidos"
```

**Why:** `zod/v4` is a subpath export in zod 3.25+. TypeScript will error `Cannot find module 'zod/v4'` if zod is not a direct dep of the consuming package.

**How to apply:** Any time a new route file in api-server needs validation, ensure zod is in api-server's package.json and use the `zod/v4` import path + `.issues` for error messages.
