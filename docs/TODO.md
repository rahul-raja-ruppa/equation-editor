# Equation Editor — Implementation TODO

**Spec:** `docs/superpowers/specs/2026-05-28-equation-editor-design.md`
**Architecture:** `docs/ARCHITECTURE.md`

---

## Phase 0 — Scaffold ✅

- [x] Project created with Vite + React 18 + TypeScript (`pnpm`)
- [x] `mathlive@0.101.2` installed
- [x] `vite.config.ts` — base `/equation-editor/`, manual chunks (react / mathlive / app), cssCodeSplit off
- [x] `.env.example` — `VITE_CMS_ORIGIN=http://localhost:3001`
- [x] `src/types/index.ts` — all shared types + `TAB_IDS` const tuple
- [x] `src/vite-env.d.ts` — Vite client types (added by hooks agent)
- [x] `Dockerfile` — multi-stage: node builder → nginx:alpine runtime
- [x] `nginx.conf` — serves `/equation-editor/`, aggressive asset caching, gzip
- [x] `docker-compose.yml` — port 8090

---

## Phase 1 — Core Hooks ✅

- [x] `src/hooks/useMathField.ts` — `OutputFormat` typed, exposes `insert` / `getValue` / `setValue`
- [x] `src/hooks/usePostMessage.ts` — origin validation, stores origin from first `load`, stable listener
- [x] `src/hooks/useTabData.ts` — module-level cache, dynamic `import()` per tab, cancelled-fetch guard

---

## Phase 2 — Data Files ✅

- [x] `src/data/quickaccess.ts` — 26 symbols + 20 templates, typed `QuickButtonDef[]`
- [x] `src/data/tabs/algebra.json` — 9 expressions
- [x] `src/data/tabs/calculus.json` — 8 expressions
- [x] `src/data/tabs/statistics.json` — 7 expressions
- [x] `src/data/tabs/matrices.json` — 5 expressions
- [x] `src/data/tabs/sets.json` — 7 expressions
- [x] `src/data/tabs/trig.json` — 7 expressions
- [x] `src/data/tabs/geometry.json` — 6 expressions
- [x] `src/data/tabs/greek.json` — 36 expressions (24 lowercase + 12 uppercase)
- [x] `src/data/tabs/arrows.json` — 17 expressions
- [x] `src/data/tabs/more.json` — 13 expressions

---

## Phase 3 — Components ✅

### Toolbar

- [x] `QuickButton.tsx` — variant symbol/template, tooltip, calls `onInsert`
- [x] `QuickAccessBar.tsx` + CSS module
- [x] `TabStrip.tsx` + CSS module — `TAB_IDS` driven, "More +" label
- [x] `ExpressionChip.tsx` — display glyph + label badge
- [x] `ExpressionLibrary.tsx` + CSS module — skeleton loader while lazy-loading

### Editor

- [x] `MathField.tsx` + CSS module — eager `import 'mathlive'`, `input` event wired
- [x] `LaTeXBar.tsx` + CSS module — pill → input toggle, Enter/blur commit, Escape cancel, autoFocus

### Action Bar

- [x] `TypeToggle.tsx` — controlled display/inline select
- [x] `SizeControl.tsx` — controlled pt select (10/11/12/14/16)
- [x] `CancelButton.tsx`
- [x] `InsertButton.tsx` — full insert flow, loading/error states, debounce on double-click
- [x] `ActionBar.tsx` + CSS module

---

## Phase 4 — API Layer ✅ (partial)

- [x] `src/api/texconversion.ts` — POST with `credentials: 'include'`, typed error throws
- [ ] **Verify `response.body` shape** — `imageUrl` field name unconfirmed; needs live kriya2.0 request

---

## Phase 5 — App Wiring ✅

- [x] `App.tsx` — 4-zone CSS Grid, all state, postMessage ↔ mathfield connected
- [x] `App.module.css` — `grid-template-rows: auto auto 1fr auto`, no scroll at 760px
- [x] TypeScript — zero errors (`tsc --noEmit` clean)
- [x] Build passes — 990ms build time

---

## Phase 6 — Performance

- [x] Manual chunk split: `vendor-react` / `vendor-mathlive` / `index` — parallel HTTP/2 loading
- [x] Tab JSONs lazy-loaded per-tab (non-blocking)
- [x] App code chunk: **5.3 KB gzip** ✅
- [x] React chunk: **45.2 KB gzip** ✅
- [~] MathLive chunk: **212.8 KB gzip** — exceeds 200 KB spec target; MathLive has no lighter import path. Spec estimate of "~150 KB" was incorrect. Revised target: **265 KB total**.
- [ ] Disable MathLive virtual keyboard overlay (not needed — editor has its own symbol panel)
- [ ] Keyboard accessibility: QuickButtons and chips focusable + Enter-activatable
- [ ] Lighthouse TTI check on throttled 4G

---

## Phase 7 — Integration Test

- [ ] Serve `dist/` locally and embed in a kriya2.0 test page
- [ ] Test `load` with existing LaTeX (edit flow)
- [ ] Test `load` with empty string (new equation flow)
- [ ] Verify `insert` payload: `latex`, `mathml`, `imageUrl`, `fontSize`, `mathType` all present
- [ ] Test `cancel` — no side effects
- [ ] Test error path: `/api/texconversion` failure → error shown, no `insert` sent
- [ ] Test all 10 tabs load
- [ ] Test Quick Access Row 1 + Row 2 insert
- [ ] Verify `#0` placeholder cursor jump after template insert

---

## Open Questions

| #   | Question                                                                         | How to resolve                                                    |
| --- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | Exact `response.body` shape from `/api/texconversion` — is the field `imageUrl`? | Live request in kriya2.0 dev, log response                        |
| 2   | CMS origin validation — whitelist for staging/prod?                              | Check with team                                                   |
| 3   | MathLive `getValue('math-ml')` — correct format string?                          | Confirmed in MathLive source; `OutputFormat` includes `'math-ml'` |
