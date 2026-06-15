# Equation Editor — UI/UX Redesign · Phase 1: Foundation

**Date:** 2026-06-12
**Status:** Proposed
**Stack:** Tailwind CSS v4 + shadcn/ui + Framer Motion (additive to React 18 + Vite + MathLive)
**Scope:** First of 6 phases in the premium UI/UX redesign. This phase is infrastructure-only — it adds the design-token layer, font assets, and Tailwind/shadcn tooling. No existing component (`.tsx`/`.module.css`) is modified.

---

## 1. Goal

Replace this package's plain-CSS token system (`src/index.css` + Google-Fonts CDN links) with a self-hosted **Tailwind v4 `@theme`** layer carrying the Kriya v2.2 design tokens (purple/ink palette, Geist/Geist Mono/Latin Modern Math), plus a freshly-generated shadcn/ui setup — so later phases (2-6) can rebuild each component with Tailwind utilities + shadcn primitives instead of CSS Modules.

**Why this order:** every later phase depends on the token names, fonts, and `cn()`/shadcn conventions being in place and correct. Doing this first as an isolated, non-breaking diff means it can be reviewed and merged independently of any visual change.

---

## 2. Subsequent phases (for context, not built here)

| Phase | Scope |
| --- | --- |
| 2 | App shell & layout — rail / editor / preview 3-column structure, animated Option-A reflow |
| 3 | Rail — header, search trigger, control row, symbol category grid + flyouts, template library |
| 4 | Command palette (⌘K) |
| 5 | Editor column — LaTeX panel, MathLive field, selection-triggered contextual toolbar |
| 6 | Live Preview column + footer ActionBar |

Each later phase scraps the `.module.css` files for the components it rebuilds.

---

## 3. Design tokens (`src/styles/theme.css`)

New file, loaded once from `main.tsx` (replacing the `import './index.css'`). Defines the v2.2 palette via Tailwind v4's `@theme`, which simultaneously creates CSS custom properties (`--color-primary`, etc. — usable by `math-field`'s shadow-DOM theming) **and** generates utility classes (`bg-primary`, `text-ink-500`, `shadow-pop`, ...). This is the single source of truth — no separate `tailwind.config.js` token block.

```css
@import "tailwindcss";

@theme {
  /* Brand */
  --color-primary: #6800d6;
  --color-primary-dark: #7400f0;
  --color-primary-alt: #ddc2fa;
  --color-primary-soft: #f3ecfc;

  --color-secondary: #2680d9;
  --color-secondary-dark: #3c8cdd;
  --color-secondary-alt: #bed9f4;
  --color-secondary-soft: #eef5fc;

  --color-tertiary: #924f92;
  --color-tertiary-alt: #ebe0eb;

  --color-success: #148f47;
  --color-success-soft: #e7f6ec;
  --color-danger: #ff3333;
  --color-danger-soft: #fdeced;
  --color-warning: #eb7100;
  --color-warning-soft: #fdf0e2;

  --color-surface: #fcfcfd;
  --color-surface-dark: #f5f3f7;
  --color-surface-variant: #f0ebf4;

  /* Warm violet-tinted neutral ramp (hue ~285) */
  --color-ink-50: #faf9fc;
  --color-ink-100: #f4f1f7;
  --color-ink-150: #eee9f3;
  --color-ink-200: #e7e1ee;
  --color-ink-300: #d9d2e3;
  --color-ink-400: #b4aac1;
  --color-ink-500: #8c8398;
  --color-ink-600: #6b6276;
  --color-ink-700: #4a4352;
  --color-ink-800: #2e2935;
  --color-ink-900: #1c1a1f;

  /* Typography */
  --font-sans: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, SFMono-Regular, monospace;
  --font-math: 'Latin Modern Math', 'Cambria Math', serif;

  /* Radius */
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 11px;

  /* Shadows */
  --shadow-xs: 0 1px 1.5px rgba(28,26,31,0.05);
  --shadow-sm: 0 1px 2px rgba(28,26,31,0.06), 0 1px 1px rgba(28,26,31,0.04);
  --shadow-pop: 0 14px 34px -12px rgba(54,24,92,0.30), 0 3px 10px -4px rgba(54,24,92,0.14);
  --shadow-ring-primary: 0 0 0 3px rgba(104,0,214,0.16);

  /* Easing */
  --ease-snap: cubic-bezier(.2,.7,.2,1);
}

/* math-field shadow-DOM theming — reads the same custom properties */
math-field {
  --selection-background-color: var(--color-primary-alt);
  --contains-highlight-background-color: var(--color-surface-variant);
  --caret-color: var(--color-primary);
  --primary: var(--color-primary);
  --smart-fence-color: var(--color-ink-500);
}

@font-face {
  font-family: 'Geist';
  src: url('../assets/fonts/Geist-Variable.woff2') format('woff2');
  font-weight: 300 700;
  font-display: swap;
}
@font-face {
  font-family: 'Geist Mono';
  src: url('../assets/fonts/GeistMono-Variable.woff2') format('woff2');
  font-weight: 400 600;
  font-display: swap;
}
@font-face {
  font-family: 'Latin Modern Math';
  src: url('../assets/fonts/latinmodern-math.woff2') format('woff2');
  font-display: swap;
}
```

Notes:
- `--font-math` / Latin Modern Math replaces `STIX Two Math` as the math-glyph rendering font (per v2.2). The `.ee-glyph .ML__cmr / .ML__mathit / ...` selector overrides that apply this font to MathLive's internal markup (used by `MathPreview`) are **ported in Phase 3/5** when `MathPreview` itself is rebuilt — Phase 1 only ships the font file + `--font-math` token.
- `body` base styles (background, color, font-family, antialiasing) move into `theme.css` as a plain `@layer base` block, replacing the equivalent rules currently in `index.css`.
- `index.html`'s Google Fonts `<link>`/`<preconnect>` tags for DM Sans / JetBrains Mono are removed.

Beyond the `@theme` block shown above, `theme.css` also carries forward (unchanged in behavior, just relocated):
- The **compatibility variable block** described in §8 (old token names → new tokens, e.g. `--ui-font: var(--font-sans)`, `--indigo: var(--color-primary)`), so existing `.module.css` files keep working until their phase migrates them.
- The **`.ee-scroll` thin-scrollbar rules** and **`body { overflow: hidden }`** (and any other global rules from `index.css` still consumed by existing components), moved verbatim into `@layer base` / `@layer utilities`.

---

## 4. Fonts

Self-hosted, under `src/assets/fonts/`:
- **Geist** + **Geist Mono** — static `.woff2` files sourced from the `geist` npm package (MIT-licensed, Vercel).
- **Latin Modern Math** — `.woff2`, same source as referenced by the v2.2 bundle (`mathfonts.github.io/LatinModern`), vendored locally.

No `geist` runtime dependency needed — only its font files are copied in; remove the package from `package.json` after extracting assets (or keep as a devDependency if that's the cleanest way to pull the files — implementer's call, documented in the PR).

---

## 5. Tooling

- **Tailwind v4** via `@tailwindcss/vite` plugin, added to `vite.config.ts`. No PostCSS config file needed.
- **shadcn/ui** — `pnpm dlx shadcn@latest init`, generating `components.json` (style: default, base color: neutral — overridden by our `@theme`), `src/lib/utils.ts` (`cn()` via `clsx` + `tailwind-merge`).
- Path alias `@/* → src/*` added to `tsconfig.json` and `vite.config.ts` (dev/build only — `package.json`'s `files: ["dist"]` means published output is unaffected).
- Generate 3 base primitives via the shadcn CLI: **Button**, **Tooltip**, **ScrollArea** — into `src/components/ui/`. These validate the full pipeline (theme tokens → Tailwind utilities → Radix primitives rendering correctly) without touching app code.
- **Framer Motion** added as a dependency (`framer-motion`), unused until Phase 2.

New dependencies: `tailwindcss@^4`, `@tailwindcss/vite`, `clsx`, `tailwind-merge`, `framer-motion`, plus whatever `shadcn init` adds for Button/Tooltip/ScrollArea (`@radix-ui/react-tooltip`, `@radix-ui/react-scroll-area`, `class-variance-authority`, `lucide-react` already present).

---

## 6. Folder structure changes

```
src/
├── styles/
│   └── theme.css          # new — replaces index.css
├── assets/
│   └── fonts/              # new — Geist, Geist Mono, Latin Modern Math woff2
├── components/
│   └── ui/                 # new — shadcn primitives (Button, Tooltip, ScrollArea)
├── lib/
│   ├── utils.ts             # new — cn()
│   └── texToMathML.ts       # unchanged
├── index.css                # deleted
└── ... (all existing component dirs/files unchanged)
```

`main.tsx`: `import './index.css'` → `import './styles/theme.css'`.

---

## 7. Out of scope (this phase)

- No changes to `App.tsx` or any component under `src/components/{Toolbar,ExpressionZone,Editor,ActionBar,MathPreview,Utility}/`.
- No layout restructuring, no command palette, no contextual toolbar — these are Phases 2-6.
- `index.css`'s non-token rules that are still needed by existing components (e.g. `.ee-scroll` thin-scrollbar classes, `body { overflow: hidden }`) are **carried forward verbatim** into `theme.css`'s `@layer base`/`@layer utilities` so existing components don't break before their phase lands.

---

## 8. Risks

- **CSS variable name collisions**: existing `.module.css` files reference old var names (`--ee-bg`, `--indigo`, `--ui-font`, `--math-font`, `--mono-font`, etc. — see `src/index.css`). These old names must remain defined (pointing at the new palette) until each consuming component is migrated in its phase, otherwise existing components visually break immediately. `theme.css` therefore includes a temporary **compatibility block** mapping old var names → new tokens (e.g. `--ui-font: var(--font-sans); --indigo: var(--color-primary); --ee-bg: var(--color-surface-dark);` ...), removed component-by-component as each phase migrates its consumers.
- **Tailwind v4 + Vite + TS path aliases**: verify `vite-tsconfig-paths` isn't needed (Vite 5 resolves `tsconfig` paths natively only with the plugin) — Phase 1's build must pass `tsc --noEmit` and `vite build` cleanly with the new alias.
- **Font licensing/size**: Geist variable fonts are large; subset if needed (Latin only) to avoid bloating the iframe payload further (per earlier discussion, no hard budget, but avoid waste).

---

## 9. Verification

- `pnpm build` succeeds, `pnpm lint` and `tsc --noEmit` clean.
- App still renders and functions identically (manual smoke test) — Phase 1 changes are additive/compat-mapped, so the existing UI must look pixel-identical.
- `src/components/ui/Button|Tooltip|ScrollArea` render correctly in a throwaway test usage (removed before merge, or kept as a `Storybook`-free sanity snippet — implementer's call).
