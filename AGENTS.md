<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

## Frontend Infrastructure

### File Organization

```bash
src/
  app/                  # app assembly, global providers, browser preference state
  global.css            # Tailwind entry, design tokens, base CSS
  locales/              # Lingui PO catalogs
  routes/
    -features/          # route-local components and feature glue
  ui/
    components/         # shadcn/Base UI primitives only
    hooks/
    lib/
```

- Keep app-specific copy, routing state, and feature data out of `src/ui/components`.
- Prefer route-local components under `src/routes/-features/<feature>` until they are genuinely reusable.
- Keep global styles in `src/global.css`; do not add a second style entry under `src/ui`.
- Use kebab-case file and directory names unless a generated tool requires another convention.

### I18n

- Use Lingui for user-facing copy.
- Every translatable message must use an explicit semantic ID through `<Trans id="...">` or `i18n._({ id, message })`.
- After adding or changing copy, run `vp run i18n:extract`, translate `src/locales/zh-Hans/messages.po`, then run `vp run i18n:check`.
- `pseudo` is development-only and should not be manually translated.

### Theme And RTL

- User preferences live in `localStorage` under `tagskills.appearance`, with the schema
  version stored in the serialized value.
- Preference state is owned by Jotai atoms in `src/features/preferences/preferences-atoms.ts`.
- Browser preference side effects are owned by `src/features/preferences/preferences-runtime.tsx`; do not write
  `<html lang>`, `<html dir>`, `.dark`, or `colorScheme` elsewhere.
- Prefer CSS logical properties and Tailwind logical utilities such as `ms`, `me`, `ps`, `pe`, `start`, and `end`.

### UI Components

- Use shadcn/Base UI primitives for shared UI and `lucide-react` for icons.
- Avoid embedding app-specific Lingui copy in `src/ui/components`; expose label props when a primitive needs accessible text.
- Avoid modifying generated shadcn components unless the change is infrastructure-level or explicitly requested.

### Test

- Import test APIs from `vite-plus/test`, never directly from `vitest`.
- Prefer pure unit tests for parsing, persistence, validation, and browser-boundary logic.
- Keep UI tests restrained. Add React Testing Library or route/component rendering tests only for high-risk user flows or regressions that cannot be covered cleanly at a lower layer.
- When a UI test is necessary, keep it focused on one user-observable behavior and avoid broad component coverage.
