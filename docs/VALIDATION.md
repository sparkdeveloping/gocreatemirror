# Validation — GoCreateMirror v6

Validated in the build environment on 2026-09-15:

- 51 TypeScript / TSX source files parsed successfully with the TypeScript compiler API (0 syntax diagnostics).
- `package.json`, `tsconfig.json`, `firebase.json`, and `database.rules.json` parse as valid JSON.
- Raspberry Pi Python agents compile with `python3 -m py_compile`.
- All kiosk / AI installer shell scripts pass `bash -n`.
- Team schedule parser test passes for a split shift.
- Team schedule live-roster test at Tuesday 2026-09-15 09:31 America/Chicago returns: Kim, Breanna, Jake T, Nomi.
- Tuesday schedule test returns 12 scheduled team members.
- Template library count: 38.
- Widget type count: 35.
- Default template: `team-pulse`.
- Logo widget default glow: 0; renderer ignores legacy `glow` values for logo/image/video widgets.

A full `npm install && npm run build` could not be completed in this environment because npm registry access timed out. Vercel will perform the actual dependency install/build when deployed.
