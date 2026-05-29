# MathType Toolbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current flat StyleBar + TabStrip + SymbolGrid toolbar with an exact MathType replica: two rows of compact category buttons that each open a portal-rendered flyout palette, plus a tabbed expression-chip library below.

**Architecture:** A `ToolbarZone` renders two rows of `CategoryButton` components; each button manages its own `FlyoutPalette` portal via a shared `useFlyout` hook that enforces single-open and handles click-outside/Escape dismissal. Below the toolbar, `ExpressionZone` renders a tab bar and a row of full-formula chips per tab. `App.tsx` wires both zones in place of the removed components.

**Tech Stack:** React 18, TypeScript, CSS Modules, ReactDOM.createPortal, Vite, pnpm

---

## File Map

### New files
| Path | Responsibility |
|------|----------------|
| `src/data/toolbar/row1.ts` | 9 symbol-category definitions with full palette arrays |
| `src/data/toolbar/row2.ts` | 8 template-category definitions with full palette arrays |
| `src/data/expressions/algebra.json` | Formula chips for Algebra tab |
| `src/data/expressions/calculus.json` | Formula chips for Calculus tab |
| `src/data/expressions/statistics.json` | Formula chips for Statistics tab |
| `src/data/expressions/matrices.json` | Formula chips for Matrices tab |
| `src/data/expressions/sets.json` | Formula chips for Sets tab |
| `src/data/expressions/trig.json` | Formula chips for Trig tab |
| `src/data/expressions/geometry.json` | Formula chips for Geometry tab |
| `src/data/expressions/more.json` | Formula chips for More tab |
| `src/hooks/useFlyout.ts` | Single-open flyout state + click-outside + Escape |
| `src/components/Toolbar/FlyoutPalette.tsx` | Portal-rendered symbol/template grid |
| `src/components/Toolbar/FlyoutPalette.module.css` | Palette styles |
| `src/components/Toolbar/CategoryButton.tsx` | Compact toolbar button that triggers its palette |
| `src/components/Toolbar/CategoryButton.module.css` | Button styles |
| `src/components/Toolbar/ToolbarZone.tsx` | Two-row toolbar container |
| `src/components/Toolbar/ToolbarZone.module.css` | Toolbar zone styles |
| `src/components/ExpressionZone/ExpressionZone.tsx` | Tab bar + chips container |
| `src/components/ExpressionZone/ExpressionZone.module.css` | Zone styles |
| `src/components/ExpressionZone/ExpressionTabStrip.tsx` | Tab headers |
| `src/components/ExpressionZone/ExpressionTabStrip.module.css` | Tab strip styles |
| `src/components/ExpressionZone/ExpressionChips.tsx` | Horizontal chip row for active tab |
| `src/components/ExpressionZone/ExpressionChips.module.css` | Chip styles |

### Modified files
| Path | Change |
|------|--------|
| `src/types/index.ts` | Add `ToolbarCategory`, `PaletteItem`, `ExpressionItem`, `ExpressionTabId` types; remove old `TabId`, `TAB_IDS`, `Section`, `SymbolDef`, `TabData`, `TabDef` |
| `src/App.tsx` | Replace StyleBar/TabStrip/SymbolGrid imports with ToolbarZone + ExpressionZone |
| `src/App.module.css` | Update grid rows from 5 zones to 4 zones |

### Deleted files (remove at end)
- `src/components/Toolbar/StyleBar.tsx` + `.module.css`
- `src/components/Toolbar/SymbolGrid.tsx` + `.module.css`
- `src/components/Toolbar/TabStrip.tsx` + `.module.css`
- `src/components/Toolbar/QuickButton.tsx`
- `src/hooks/useTabData.ts`
- `src/data/tabs/` (entire directory)

---

## Task 1: Update types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Replace the contents of `src/types/index.ts` with the new type set**

```typescript
// Toolbar data model
export interface PaletteItem {
  latex: string      // inserted into MathLive on click
  display: string    // shown on the palette button face (Unicode or HTML entity)
  tooltip: string
  isTemplate?: boolean  // true → renders wider, violet-tinted
}

export interface ToolbarCategory {
  id: string
  glyph: string          // shown on the compact category button face
  tooltip: string        // button tooltip
  palette: PaletteItem[]
}

// Expression library (Zone 3 tabs)
export type ExpressionTabId =
  | 'algebra'
  | 'calculus'
  | 'statistics'
  | 'matrices'
  | 'sets'
  | 'trig'
  | 'geometry'
  | 'more'

export const EXPRESSION_TAB_IDS: ExpressionTabId[] = [
  'algebra', 'calculus', 'statistics', 'matrices',
  'sets', 'trig', 'geometry', 'more',
]

export const EXPRESSION_TAB_LABELS: Record<ExpressionTabId, string> = {
  algebra: 'Algebra',
  calculus: 'Calculus',
  statistics: 'Statistics',
  matrices: 'Matrices',
  sets: 'Sets',
  trig: 'Trig',
  geometry: 'Geometry',
  more: 'More',
}

export interface ExpressionItem {
  latex: string     // full formula inserted on click; #0, #1 are MathLive slots
  display: string   // rendered chip label (Unicode approximation)
  label: string     // small badge below chip
}

export interface ExpressionTab {
  id: ExpressionTabId
  label: string
  items: ExpressionItem[]
}

// postMessage protocol (unchanged)
export interface LoadConfig {
  fontSize: number
  mathType: 'display' | 'inline'
  customer: string
  project: string
  doi: string
}

export interface InsertPayload {
  type: 'insert'
  latex: string
  mathml: string
  imageUrl: string
  fontSize: number
  mathType: 'display' | 'inline'
}

export interface CancelPayload {
  type: 'cancel'
}

export interface LoadMessage {
  type: 'load'
  latex: string
  config: LoadConfig
}

export type OutboundMessage = InsertPayload | CancelPayload
export type InboundMessage = LoadMessage
```

- [ ] **Step 2: Verify the build still compiles (existing components will have type errors — that is expected and will be fixed in later tasks)**

```bash
cd /Users/rahul.rr/Documents/repos/equation-editor-poc && pnpm run build 2>&1 | head -60
```

Expected: type errors referencing `TabId`, `Section`, `SymbolDef` in old components. That is fine — those files are being replaced.

---

## Task 2: Write toolbar data — Row 1 (symbol categories)

**Files:**
- Create: `src/data/toolbar/row1.ts`

- [ ] **Step 1: Create `src/data/toolbar/row1.ts`**

```typescript
import type { ToolbarCategory } from '../../types'

const row1: ToolbarCategory[] = [
  {
    id: 'relations',
    glyph: '≤≥≈',
    tooltip: 'Relations',
    palette: [
      { latex: '\\le', display: '≤', tooltip: 'Less than or equal' },
      { latex: '\\ge', display: '≥', tooltip: 'Greater than or equal' },
      { latex: '\\ll', display: '≪', tooltip: 'Much less than' },
      { latex: '\\gg', display: '≫', tooltip: 'Much greater than' },
      { latex: '\\prec', display: '≺', tooltip: 'Precedes' },
      { latex: '\\succ', display: '≻', tooltip: 'Succeeds' },
      { latex: '\\triangleleft', display: '◁', tooltip: 'Triangle left' },
      { latex: '\\triangleright', display: '▷', tooltip: 'Triangle right' },
      { latex: '\\sim', display: '∼', tooltip: 'Similar to' },
      { latex: '\\approx', display: '≈', tooltip: 'Approximately equal' },
      { latex: '\\simeq', display: '≃', tooltip: 'Simeq' },
      { latex: '\\cong', display: '≅', tooltip: 'Congruent' },
      { latex: '\\ne', display: '≠', tooltip: 'Not equal' },
      { latex: '\\equiv', display: '≡', tooltip: 'Identical to' },
      { latex: '\\doteq', display: '≐', tooltip: 'Approaches limit' },
      { latex: '\\propto', display: '∝', tooltip: 'Proportional to' },
      { latex: '\\infty', display: '∞', tooltip: 'Infinity' },
    ],
  },
  {
    id: 'decorations',
    glyph: 'â€¦',
    tooltip: 'Spacing & Dots',
    palette: [
      { latex: '\\ldots', display: '…', tooltip: 'Horizontal dots (baseline)' },
      { latex: '\\cdots', display: '⋯', tooltip: 'Horizontal dots (center)' },
      { latex: '\\vdots', display: '⋮', tooltip: 'Vertical dots' },
      { latex: '\\ddots', display: '⋱', tooltip: 'Diagonal dots' },
      { latex: '\\,', display: '·thin', tooltip: 'Thin space' },
      { latex: '\\;', display: '·med', tooltip: 'Medium space' },
      { latex: '\\quad', display: '·quad', tooltip: 'Quad space' },
      { latex: '\\qquad', display: '·qquad', tooltip: 'Double quad space' },
      { latex: '\\therefore', display: '∴', tooltip: 'Therefore' },
      { latex: '\\because', display: '∵', tooltip: 'Because' },
    ],
  },
  {
    id: 'operators',
    glyph: '±•⊗',
    tooltip: 'Operators',
    palette: [
      { latex: '\\pm', display: '±', tooltip: 'Plus or minus' },
      { latex: '\\mp', display: '∓', tooltip: 'Minus or plus' },
      { latex: '\\times', display: '×', tooltip: 'Times' },
      { latex: '\\ast', display: '∗', tooltip: 'Asterisk' },
      { latex: '\\div', display: '÷', tooltip: 'Division' },
      { latex: '\\oplus', display: '⊕', tooltip: 'Circle plus' },
      { latex: '\\otimes', display: '⊗', tooltip: 'Circle times' },
      { latex: '\\odot', display: '⊙', tooltip: 'Circle dot' },
      { latex: '\\cdot', display: '·', tooltip: 'Dot product' },
      { latex: '\\bullet', display: '•', tooltip: 'Bullet' },
      { latex: '\\circ', display: '∘', tooltip: 'Composition' },
      { latex: '\\langle', display: '⟨', tooltip: 'Left angle' },
      { latex: '\\rangle', display: '⟩', tooltip: 'Right angle' },
    ],
  },
  {
    id: 'arrows',
    glyph: '→',
    tooltip: 'Arrows',
    palette: [
      { latex: '\\leftrightarrow', display: '↔', tooltip: 'Left-right arrow' },
      { latex: '\\rightarrow', display: '→', tooltip: 'Right arrow' },
      { latex: '\\leftarrow', display: '←', tooltip: 'Left arrow' },
      { latex: '\\uparrow', display: '↑', tooltip: 'Up arrow' },
      { latex: '\\downarrow', display: '↓', tooltip: 'Down arrow' },
      { latex: '\\updownarrow', display: '↕', tooltip: 'Up-down arrow' },
      { latex: '\\Leftrightarrow', display: '⇔', tooltip: 'Double left-right' },
      { latex: '\\Rightarrow', display: '⇒', tooltip: 'Double right' },
      { latex: '\\Leftarrow', display: '⇐', tooltip: 'Double left' },
      { latex: '\\Uparrow', display: '⇑', tooltip: 'Double up' },
      { latex: '\\Downarrow', display: '⇓', tooltip: 'Double down' },
      { latex: '\\nearrow', display: '↗', tooltip: 'NE arrow' },
      { latex: '\\searrow', display: '↘', tooltip: 'SE arrow' },
      { latex: '\\swarrow', display: '↙', tooltip: 'SW arrow' },
      { latex: '\\nwarrow', display: '↖', tooltip: 'NW arrow' },
      { latex: '\\mapsto', display: '↦', tooltip: 'Maps to' },
      { latex: '\\hookleftarrow', display: '↩', tooltip: 'Hook left (return)' },
    ],
  },
  {
    id: 'logic',
    glyph: '∴∀',
    tooltip: 'Logic',
    palette: [
      { latex: '\\therefore', display: '∴', tooltip: 'Therefore' },
      { latex: '\\because', display: '∵', tooltip: 'Because' },
      { latex: '\\exists', display: '∃', tooltip: 'There exists' },
      { latex: '\\nexists', display: '∄', tooltip: 'There does not exist' },
      { latex: '\\forall', display: '∀', tooltip: 'For all' },
      { latex: '\\neg', display: '¬', tooltip: 'Negation' },
      { latex: '\\wedge', display: '∧', tooltip: 'Logical and' },
      { latex: '\\vee', display: '∨', tooltip: 'Logical or' },
      { latex: '\\top', display: '⊤', tooltip: 'Tautology' },
      { latex: '\\bot', display: '⊥', tooltip: 'Contradiction' },
      { latex: '\\vdash', display: '⊢', tooltip: 'Proves' },
      { latex: '\\models', display: '⊨', tooltip: 'Models' },
    ],
  },
  {
    id: 'sets',
    glyph: '∈∩⊂',
    tooltip: 'Set Theory',
    palette: [
      { latex: '\\in', display: '∈', tooltip: 'Element of' },
      { latex: '\\notin', display: '∉', tooltip: 'Not element of' },
      { latex: '\\cup', display: '∪', tooltip: 'Union' },
      { latex: '\\cap', display: '∩', tooltip: 'Intersection' },
      { latex: '\\subset', display: '⊂', tooltip: 'Subset' },
      { latex: '\\supset', display: '⊃', tooltip: 'Superset' },
      { latex: '\\subseteq', display: '⊆', tooltip: 'Subset or equal' },
      { latex: '\\supseteq', display: '⊇', tooltip: 'Superset or equal' },
      { latex: '\\emptyset', display: '∅', tooltip: 'Empty set' },
      { latex: '\\setminus', display: '∖', tooltip: 'Set difference' },
      { latex: '\\complement', display: 'ᶜ', tooltip: 'Complement' },
    ],
  },
  {
    id: 'misc',
    glyph: '∂∞ℓ',
    tooltip: 'Misc & Letterlike',
    palette: [
      { latex: '\\partial', display: '∂', tooltip: 'Partial derivative' },
      { latex: '\\infty', display: '∞', tooltip: 'Infinity' },
      { latex: '\\ell', display: 'ℓ', tooltip: 'Script l' },
      { latex: '\\mathbb{R}', display: 'ℝ', tooltip: 'Real numbers' },
      { latex: '\\mathbb{Z}', display: 'ℤ', tooltip: 'Integers' },
      { latex: '\\mathbb{C}', display: 'ℂ', tooltip: 'Complex numbers' },
      { latex: '\\mathbb{Q}', display: 'ℚ', tooltip: 'Rationals' },
      { latex: '\\mathbb{N}', display: 'ℕ', tooltip: 'Natural numbers' },
      { latex: '\\hbar', display: 'ℏ', tooltip: 'h-bar' },
      { latex: '\\dagger', display: '†', tooltip: 'Dagger' },
      { latex: '\\Delta', display: 'Δ', tooltip: 'Delta' },
      { latex: '\\nabla', display: '∇', tooltip: 'Nabla' },
      { latex: '\\angle', display: '∠', tooltip: 'Angle' },
      { latex: '\\perp', display: '⊥', tooltip: 'Perpendicular' },
      { latex: '\\parallel', display: '∥', tooltip: 'Parallel' },
      { latex: '\\triangle', display: '△', tooltip: 'Triangle' },
      { latex: '\\square', display: '□', tooltip: 'Square' },
      { latex: '\\circ', display: '○', tooltip: 'Circle' },
    ],
  },
  {
    id: 'greek-lower',
    glyph: 'λωθ',
    tooltip: 'Lowercase Greek',
    palette: [
      { latex: '\\alpha', display: 'α', tooltip: 'alpha' },
      { latex: '\\beta', display: 'β', tooltip: 'beta' },
      { latex: '\\gamma', display: 'γ', tooltip: 'gamma' },
      { latex: '\\delta', display: 'δ', tooltip: 'delta' },
      { latex: '\\epsilon', display: 'ε', tooltip: 'epsilon' },
      { latex: '\\varepsilon', display: 'ϵ', tooltip: 'varepsilon' },
      { latex: '\\zeta', display: 'ζ', tooltip: 'zeta' },
      { latex: '\\eta', display: 'η', tooltip: 'eta' },
      { latex: '\\theta', display: 'θ', tooltip: 'theta' },
      { latex: '\\vartheta', display: 'ϑ', tooltip: 'vartheta' },
      { latex: '\\iota', display: 'ι', tooltip: 'iota' },
      { latex: '\\kappa', display: 'κ', tooltip: 'kappa' },
      { latex: '\\lambda', display: 'λ', tooltip: 'lambda' },
      { latex: '\\mu', display: 'μ', tooltip: 'mu' },
      { latex: '\\nu', display: 'ν', tooltip: 'nu' },
      { latex: '\\xi', display: 'ξ', tooltip: 'xi' },
      { latex: '\\pi', display: 'π', tooltip: 'pi' },
      { latex: '\\varpi', display: 'ϖ', tooltip: 'varpi' },
      { latex: '\\rho', display: 'ρ', tooltip: 'rho' },
      { latex: '\\varrho', display: 'ϱ', tooltip: 'varrho' },
      { latex: '\\sigma', display: 'σ', tooltip: 'sigma' },
      { latex: '\\varsigma', display: 'ς', tooltip: 'varsigma' },
      { latex: '\\tau', display: 'τ', tooltip: 'tau' },
      { latex: '\\upsilon', display: 'υ', tooltip: 'upsilon' },
      { latex: '\\phi', display: 'φ', tooltip: 'phi' },
      { latex: '\\varphi', display: 'ϕ', tooltip: 'varphi' },
      { latex: '\\chi', display: 'χ', tooltip: 'chi' },
      { latex: '\\psi', display: 'ψ', tooltip: 'psi' },
      { latex: '\\omega', display: 'ω', tooltip: 'omega' },
    ],
  },
  {
    id: 'greek-upper',
    glyph: 'ΛΩΘ',
    tooltip: 'Uppercase Greek',
    palette: [
      { latex: '\\Alpha', display: 'Α', tooltip: 'Alpha' },
      { latex: '\\Beta', display: 'Β', tooltip: 'Beta' },
      { latex: '\\Gamma', display: 'Γ', tooltip: 'Gamma' },
      { latex: '\\Delta', display: 'Δ', tooltip: 'Delta' },
      { latex: '\\Epsilon', display: 'Ε', tooltip: 'Epsilon' },
      { latex: '\\Zeta', display: 'Ζ', tooltip: 'Zeta' },
      { latex: '\\Eta', display: 'Η', tooltip: 'Eta' },
      { latex: '\\Theta', display: 'Θ', tooltip: 'Theta' },
      { latex: '\\Iota', display: 'Ι', tooltip: 'Iota' },
      { latex: '\\Kappa', display: 'Κ', tooltip: 'Kappa' },
      { latex: '\\Lambda', display: 'Λ', tooltip: 'Lambda' },
      { latex: '\\Mu', display: 'Μ', tooltip: 'Mu' },
      { latex: '\\Nu', display: 'Ν', tooltip: 'Nu' },
      { latex: '\\Xi', display: 'Ξ', tooltip: 'Xi' },
      { latex: '\\Pi', display: 'Π', tooltip: 'Pi' },
      { latex: '\\Rho', display: 'Ρ', tooltip: 'Rho' },
      { latex: '\\Sigma', display: 'Σ', tooltip: 'Sigma' },
      { latex: '\\Tau', display: 'Τ', tooltip: 'Tau' },
      { latex: '\\Upsilon', display: 'Υ', tooltip: 'Upsilon' },
      { latex: '\\Phi', display: 'Φ', tooltip: 'Phi' },
      { latex: '\\Chi', display: 'Χ', tooltip: 'Chi' },
      { latex: '\\Psi', display: 'Ψ', tooltip: 'Psi' },
      { latex: '\\Omega', display: 'Ω', tooltip: 'Omega' },
    ],
  },
]

export default row1
```

- [ ] **Step 2: Build check**

```bash
cd /Users/rahul.rr/Documents/repos/equation-editor-poc && pnpm run build 2>&1 | grep -E "error TS|✓|vite"
```

Expected: same pre-existing type errors from old components — no new errors from row1.ts.

---

## Task 3: Write toolbar data — Row 2 (template categories)

**Files:**
- Create: `src/data/toolbar/row2.ts`

- [ ] **Step 1: Create `src/data/toolbar/row2.ts`**

```typescript
import type { ToolbarCategory } from '../../types'

const row2: ToolbarCategory[] = [
  {
    id: 'fences',
    glyph: '( )',
    tooltip: 'Fences & Brackets',
    palette: [
      { latex: '\\left(#0\\right)', display: '(…)', tooltip: 'Parentheses', isTemplate: true },
      { latex: '\\left[#0\\right]', display: '[…]', tooltip: 'Square brackets', isTemplate: true },
      { latex: '\\left\\{#0\\right\\}', display: '{…}', tooltip: 'Curly braces', isTemplate: true },
      { latex: '\\left\\langle#0\\right\\rangle', display: '⟨…⟩', tooltip: 'Angle brackets', isTemplate: true },
      { latex: '\\left|#0\\right|', display: '|…|', tooltip: 'Absolute value', isTemplate: true },
      { latex: '\\left\\|#0\\right\\|', display: '‖…‖', tooltip: 'Norm', isTemplate: true },
      { latex: '\\left\\lfloor#0\\right\\rfloor', display: '⌊…⌋', tooltip: 'Floor', isTemplate: true },
      { latex: '\\left\\lceil#0\\right\\rceil', display: '⌈…⌉', tooltip: 'Ceiling', isTemplate: true },
      { latex: '\\left(#0\\right]', display: '(…]', tooltip: 'Half-open (', isTemplate: true },
      { latex: '\\left[#0\\right)', display: '[…)', tooltip: 'Half-open [', isTemplate: true },
      { latex: '\\left\\{#0\\right.', display: '{…', tooltip: 'Open brace only', isTemplate: true },
      { latex: '\\left.#0\\right\\}', display: '…}', tooltip: 'Close brace only', isTemplate: true },
    ],
  },
  {
    id: 'fractions',
    glyph: '½√',
    tooltip: 'Fractions & Roots',
    palette: [
      { latex: '\\frac{#0}{#1}', display: '□/□', tooltip: 'Fraction', isTemplate: true },
      { latex: '\\dfrac{#0}{#1}', display: 'd□/□', tooltip: 'Display fraction', isTemplate: true },
      { latex: '\\tfrac{#0}{#1}', display: 't□/□', tooltip: 'Text fraction', isTemplate: true },
      { latex: '{#0}/{#1}', display: '□∕□', tooltip: 'Slashed fraction', isTemplate: true },
      { latex: '\\sqrt{#0}', display: '√□', tooltip: 'Square root', isTemplate: true },
      { latex: '\\sqrt[3]{#0}', display: '∛□', tooltip: 'Cube root', isTemplate: true },
      { latex: '\\sqrt[#0]{#1}', display: 'ⁿ√□', tooltip: 'nth root', isTemplate: true },
    ],
  },
  {
    id: 'scripts',
    glyph: 'x²',
    tooltip: 'Scripts & Positions',
    palette: [
      { latex: '#0^{#1}', display: 'x²', tooltip: 'Superscript', isTemplate: true },
      { latex: '#0_{#1}', display: 'xₙ', tooltip: 'Subscript', isTemplate: true },
      { latex: '#0_{#1}^{#2}', display: 'xₙ²', tooltip: 'Sub + super', isTemplate: true },
      { latex: '{}^{#0}#1', display: '²x', tooltip: 'Pre-superscript', isTemplate: true },
      { latex: '{}_{#0}#1', display: '₂x', tooltip: 'Pre-subscript', isTemplate: true },
      { latex: '{}_{#0}^{#1}#2', display: '²₂x', tooltip: 'Pre sub+super', isTemplate: true },
      { latex: '#0\\prime', display: "x′", tooltip: 'Prime', isTemplate: true },
      { latex: '#0\\prime\\prime', display: "x″", tooltip: 'Double prime', isTemplate: true },
    ],
  },
  {
    id: 'summation',
    glyph: 'Σ',
    tooltip: 'Summation',
    palette: [
      { latex: '\\sum #0', display: 'Σ', tooltip: 'Sum (no limits)', isTemplate: true },
      { latex: '\\sum_{#0} #1', display: 'Σₙ', tooltip: 'Sum (lower limit)', isTemplate: true },
      { latex: '\\sum_{#0}^{#1} #2', display: 'Σₙᵐ', tooltip: 'Sum (both limits)', isTemplate: true },
      { latex: '\\displaystyle\\sum_{#0}^{#1} #2', display: '⬛Σ', tooltip: 'Display sum', isTemplate: true },
    ],
  },
  {
    id: 'integrals',
    glyph: '∫',
    tooltip: 'Integrals',
    palette: [
      { latex: '\\int #0 \\, d#1', display: '∫', tooltip: 'Integral', isTemplate: true },
      { latex: '\\int_{#0} #1 \\, d#2', display: '∫₀', tooltip: 'Integral (lower)', isTemplate: true },
      { latex: '\\int_{#0}^{#1} #2 \\, d#3', display: '∫₀¹', tooltip: 'Integral (both)', isTemplate: true },
      { latex: '\\iint #0 \\, d#1', display: '∬', tooltip: 'Double integral', isTemplate: true },
      { latex: '\\iint_{#0} #1 \\, d#2', display: '∬₀', tooltip: 'Double integral (lower)', isTemplate: true },
      { latex: '\\iiint #0 \\, d#1', display: '∭', tooltip: 'Triple integral', isTemplate: true },
      { latex: '\\oint #0 \\, d#1', display: '∮', tooltip: 'Contour integral', isTemplate: true },
      { latex: '\\oint_{#0} #1 \\, d#2', display: '∮ₒ', tooltip: 'Contour (lower)', isTemplate: true },
      { latex: '\\oiint #0 \\, d#1', display: '∯', tooltip: 'Surface integral', isTemplate: true },
    ],
  },
  {
    id: 'over-under',
    glyph: '→̄',
    tooltip: 'Over/Under Decorations',
    palette: [
      { latex: '\\vec{#0}', display: 'a⃗', tooltip: 'Vector arrow', isTemplate: true },
      { latex: '\\hat{#0}', display: 'â', tooltip: 'Hat', isTemplate: true },
      { latex: '\\tilde{#0}', display: 'ã', tooltip: 'Tilde', isTemplate: true },
      { latex: '\\bar{#0}', display: 'ā', tooltip: 'Bar (overline)', isTemplate: true },
      { latex: '\\dot{#0}', display: 'ȧ', tooltip: 'Dot', isTemplate: true },
      { latex: '\\ddot{#0}', display: 'ä', tooltip: 'Double dot', isTemplate: true },
      { latex: '\\overline{#0}', display: 'X̄', tooltip: 'Overline', isTemplate: true },
      { latex: '\\underline{#0}', display: 'X̲', tooltip: 'Underline', isTemplate: true },
      { latex: '\\overbrace{#0}^{#1}', display: '⏞', tooltip: 'Overbrace', isTemplate: true },
      { latex: '\\underbrace{#0}_{#1}', display: '⏟', tooltip: 'Underbrace', isTemplate: true },
      { latex: '\\overleftarrow{#0}', display: '←', tooltip: 'Over left arrow', isTemplate: true },
      { latex: '\\overrightarrow{#0}', display: '→', tooltip: 'Over right arrow', isTemplate: true },
      { latex: '\\overleftrightarrow{#0}', display: '↔', tooltip: 'Over both arrows', isTemplate: true },
    ],
  },
  {
    id: 'bigops',
    glyph: 'Π∪',
    tooltip: 'Big Operators',
    palette: [
      { latex: '\\prod #0', display: 'Π', tooltip: 'Product (no limits)', isTemplate: true },
      { latex: '\\prod_{#0}^{#1} #2', display: 'Πₙᵐ', tooltip: 'Product (limits)', isTemplate: true },
      { latex: '\\bigcup #0', display: '⋃', tooltip: 'Big union (no limits)', isTemplate: true },
      { latex: '\\bigcup_{#0}^{#1} #2', display: '⋃ₙᵐ', tooltip: 'Big union (limits)', isTemplate: true },
      { latex: '\\bigcap #0', display: '⋂', tooltip: 'Big intersection (no limits)', isTemplate: true },
      { latex: '\\bigcap_{#0}^{#1} #2', display: '⋂ₙᵐ', tooltip: 'Big intersection (limits)', isTemplate: true },
      { latex: '\\bigoplus #0', display: '⊕', tooltip: 'Big direct sum', isTemplate: true },
      { latex: '\\bigotimes #0', display: '⊗', tooltip: 'Big tensor product', isTemplate: true },
    ],
  },
  {
    id: 'matrices',
    glyph: '▦',
    tooltip: 'Matrices',
    palette: [
      { latex: '\\begin{pmatrix} #0 \\end{pmatrix}', display: '1×1()', tooltip: '1×1 pmatrix', isTemplate: true },
      { latex: '\\begin{pmatrix} #0 & #1 \\\\ #2 & #3 \\end{pmatrix}', display: '2×2()', tooltip: '2×2 pmatrix', isTemplate: true },
      { latex: '\\begin{pmatrix} #0 & #1 & #2 \\\\ #3 & #4 & #5 \\\\ #6 & #7 & #8 \\end{pmatrix}', display: '3×3()', tooltip: '3×3 pmatrix', isTemplate: true },
      { latex: '\\begin{bmatrix} #0 & #1 \\\\ #2 & #3 \\end{bmatrix}', display: '2×2[]', tooltip: '2×2 bmatrix', isTemplate: true },
      { latex: '\\begin{bmatrix} #0 & #1 & #2 \\\\ #3 & #4 & #5 \\\\ #6 & #7 & #8 \\end{bmatrix}', display: '3×3[]', tooltip: '3×3 bmatrix', isTemplate: true },
      { latex: '\\begin{vmatrix} #0 & #1 \\\\ #2 & #3 \\end{vmatrix}', display: '2×2||', tooltip: '2×2 determinant', isTemplate: true },
      { latex: '\\begin{pmatrix} #0 \\\\ #1 \\end{pmatrix}', display: 'col2', tooltip: '2-row column vector', isTemplate: true },
      { latex: '\\begin{pmatrix} #0 \\\\ #1 \\\\ #2 \\end{pmatrix}', display: 'col3', tooltip: '3-row column vector', isTemplate: true },
      { latex: '\\begin{pmatrix} #0 & #1 \\end{pmatrix}', display: 'row2', tooltip: '2-col row vector', isTemplate: true },
      { latex: '\\begin{pmatrix} #0 & #1 & #2 \\end{pmatrix}', display: 'row3', tooltip: '3-col row vector', isTemplate: true },
    ],
  },
]

export default row2
```

- [ ] **Step 2: Build check**

```bash
cd /Users/rahul.rr/Documents/repos/equation-editor-poc && pnpm run build 2>&1 | grep -E "error TS" | grep -v "StyleBar\|SymbolGrid\|TabStrip\|QuickButton\|useTabData\|TAB_IDS\|TabId\|Section\|SymbolDef"
```

Expected: no new errors from row2.ts.

---

## Task 4: Write expression chip data (8 JSON files)

**Files:**
- Create: `src/data/expressions/algebra.json`
- Create: `src/data/expressions/calculus.json`
- Create: `src/data/expressions/statistics.json`
- Create: `src/data/expressions/matrices.json`
- Create: `src/data/expressions/sets.json`
- Create: `src/data/expressions/trig.json`
- Create: `src/data/expressions/geometry.json`
- Create: `src/data/expressions/more.json`

- [ ] **Step 1: Create `src/data/expressions/algebra.json`**

```json
{
  "id": "algebra",
  "label": "Algebra",
  "items": [
    { "latex": "\\sqrt{a^2+b^2}", "display": "√(a²+b²)", "label": "Pythagorean" },
    { "latex": "\\lim_{x \\to #0} #1", "display": "lim(x→…)", "label": "Limit" },
    { "latex": "\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}", "display": "(-b±√Δ)/2a", "label": "Quadratic" },
    { "latex": "\\frac{n!}{r!(n-r)!}", "display": "n!/r!(n-r)!", "label": "Combination" },
    { "latex": "a_n = a_1 + (n-1)d", "display": "aₙ=a₁+(n-1)d", "label": "Arithmetic" },
    { "latex": "a_n = a_1 \\cdot r^{n-1}", "display": "aₙ=a₁rⁿ⁻¹", "label": "Geometric" },
    { "latex": "(a+b)^2 = a^2 + 2ab + b^2", "display": "(a+b)²", "label": "Expansion" },
    { "latex": "a^2 - b^2 = (a+b)(a-b)", "display": "a²-b²", "label": "Difference sq." }
  ]
}
```

- [ ] **Step 2: Create `src/data/expressions/calculus.json`**

```json
{
  "id": "calculus",
  "label": "Calculus",
  "items": [
    { "latex": "\\int #0 \\, d#1", "display": "∫f dx", "label": "Integral" },
    { "latex": "\\frac{d}{dx} #0", "display": "d/dx f", "label": "Derivative" },
    { "latex": "\\frac{\\partial #0}{\\partial #1}", "display": "∂f/∂x", "label": "Partial" },
    { "latex": "\\int_{#0}^{#1} #2 \\, d#3", "display": "∫ₐᵇf dx", "label": "Def. integral" },
    { "latex": "\\nabla #0", "display": "∇f", "label": "Gradient" },
    { "latex": "\\lim_{\\Delta x \\to 0} \\frac{f(x+\\Delta x)-f(x)}{\\Delta x}", "display": "lim Δx→0", "label": "Def. of deriv." },
    { "latex": "\\frac{d^2#0}{d#1^2}", "display": "d²f/dx²", "label": "2nd deriv." },
    { "latex": "\\int_{#0}^{#1} #2 \\, d#3 = \\left[#4\\right]_{#0}^{#1}", "display": "FTC", "label": "Fund. theorem" }
  ]
}
```

- [ ] **Step 3: Create `src/data/expressions/statistics.json`**

```json
{
  "id": "statistics",
  "label": "Statistics",
  "items": [
    { "latex": "\\bar{x} = \\frac{\\sum x}{n}", "display": "x̄=Σx/n", "label": "Mean" },
    { "latex": "\\sigma^2 = \\frac{\\sum(x-\\mu)^2}{n}", "display": "σ²=Σ(x-μ)²/n", "label": "Variance" },
    { "latex": "P(A \\cap B)", "display": "P(A∩B)", "label": "Joint prob." },
    { "latex": "P(A | B) = \\frac{P(A \\cap B)}{P(B)}", "display": "P(A|B)", "label": "Conditional" },
    { "latex": "\\binom{n}{r} = \\frac{n!}{r!(n-r)!}", "display": "nCr", "label": "Combination" },
    { "latex": "z = \\frac{x - \\mu}{\\sigma}", "display": "z=(x-μ)/σ", "label": "Z-score" },
    { "latex": "E(X) = \\sum x \\cdot P(x)", "display": "E(X)=ΣxP(x)", "label": "Expected val." }
  ]
}
```

- [ ] **Step 4: Create `src/data/expressions/matrices.json`**

```json
{
  "id": "matrices",
  "label": "Matrices",
  "items": [
    { "latex": "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}", "display": "2×2", "label": "2×2 matrix" },
    { "latex": "\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}", "display": "3×3", "label": "3×3 matrix" },
    { "latex": "\\begin{pmatrix} a & b & c \\\\ d & e & f \\end{pmatrix}", "display": "2×3", "label": "2×3 matrix" },
    { "latex": "\\begin{pmatrix} a \\\\ b \\\\ c \\end{pmatrix}", "display": "col", "label": "Column vector" },
    { "latex": "\\begin{pmatrix} a & b & c \\end{pmatrix}", "display": "row", "label": "Row vector" },
    { "latex": "\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc", "display": "det", "label": "Determinant" },
    { "latex": "A^{-1} = \\frac{1}{\\det A} \\text{adj}(A)", "display": "A⁻¹", "label": "Inverse" }
  ]
}
```

- [ ] **Step 5: Create `src/data/expressions/sets.json`**

```json
{
  "id": "sets",
  "label": "Sets",
  "items": [
    { "latex": "A \\cup B", "display": "A∪B", "label": "Union" },
    { "latex": "A \\cap B", "display": "A∩B", "label": "Intersection" },
    { "latex": "A \\subseteq B", "display": "A⊆B", "label": "Subset" },
    { "latex": "A^{\\complement}", "display": "Aᶜ", "label": "Complement" },
    { "latex": "A \\times B", "display": "A×B", "label": "Cartesian" },
    { "latex": "P(A) = 2^A", "display": "P(A)", "label": "Power set" },
    { "latex": "|A \\cup B| = |A| + |B| - |A \\cap B|", "display": "|A∪B|", "label": "Inclusion-excl." }
  ]
}
```

- [ ] **Step 6: Create `src/data/expressions/trig.json`**

```json
{
  "id": "trig",
  "label": "Trig",
  "items": [
    { "latex": "\\sin^2\\theta + \\cos^2\\theta = 1", "display": "sin²+cos²=1", "label": "Pythagorean" },
    { "latex": "\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}", "display": "tan=sin/cos", "label": "Tangent" },
    { "latex": "\\sin(A \\pm B) = \\sin A \\cos B \\pm \\cos A \\sin B", "display": "sin(A±B)", "label": "Sum formula" },
    { "latex": "\\cos(A \\pm B) = \\cos A \\cos B \\mp \\sin A \\sin B", "display": "cos(A±B)", "label": "Sum formula" },
    { "latex": "\\sin 2\\theta = 2\\sin\\theta\\cos\\theta", "display": "sin2θ", "label": "Double angle" },
    { "latex": "\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}", "display": "a/sinA=b/sinB", "label": "Sine rule" },
    { "latex": "c^2 = a^2 + b^2 - 2ab\\cos C", "display": "c²=a²+b²-2ab cosC", "label": "Cosine rule" }
  ]
}
```

- [ ] **Step 7: Create `src/data/expressions/geometry.json`**

```json
{
  "id": "geometry",
  "label": "Geometry",
  "items": [
    { "latex": "a^2 + b^2 = c^2", "display": "a²+b²=c²", "label": "Pythagorean" },
    { "latex": "A = \\pi r^2", "display": "πr²", "label": "Circle area" },
    { "latex": "C = 2\\pi r", "display": "2πr", "label": "Circumference" },
    { "latex": "(x-h)^2 + (y-k)^2 = r^2", "display": "(x-h)²+(y-k)²=r²", "label": "Circle eq." },
    { "latex": "A = \\frac{1}{2}bh", "display": "½bh", "label": "Triangle area" },
    { "latex": "V = \\frac{4}{3}\\pi r^3", "display": "⁴⁄₃πr³", "label": "Sphere vol." },
    { "latex": "d = \\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}", "display": "d=√Δx²+Δy²", "label": "Distance" }
  ]
}
```

- [ ] **Step 8: Create `src/data/expressions/more.json`**

```json
{
  "id": "more",
  "label": "More",
  "items": [
    { "latex": "\\ce{H_2O}", "display": "H₂O", "label": "Chemical" },
    { "latex": "\\ce{CO_2}", "display": "CO₂", "label": "Chemical" },
    { "latex": "\\hbar = \\frac{h}{2\\pi}", "display": "ℏ=h/2π", "label": "Physics" },
    { "latex": "E = mc^2", "display": "E=mc²", "label": "Einstein" },
    { "latex": "F = ma", "display": "F=ma", "label": "Newton" },
    { "latex": "p \\Rightarrow q", "display": "p⇒q", "label": "Implication" },
    { "latex": "p \\Leftrightarrow q", "display": "p⟺q", "label": "Biconditional" },
    { "latex": "\\lfloor #0 \\rfloor", "display": "⌊x⌋", "label": "Floor" },
    { "latex": "\\lceil #0 \\rceil", "display": "⌈x⌉", "label": "Ceiling" }
  ]
}
```

- [ ] **Step 9: Build check**

```bash
cd /Users/rahul.rr/Documents/repos/equation-editor-poc && pnpm run build 2>&1 | grep "error TS" | grep -v "StyleBar\|SymbolGrid\|TabStrip\|QuickButton\|useTabData\|TAB_IDS\|TabId\|Section\|SymbolDef"
```

Expected: no new errors.

---

## Task 5: Build `useFlyout` hook

**Files:**
- Create: `src/hooks/useFlyout.ts`

- [ ] **Step 1: Create `src/hooks/useFlyout.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react'

export interface FlyoutPosition {
  top: number
  left: number
}

interface UseFlyoutReturn {
  openId: string | null
  position: FlyoutPosition
  open: (id: string, rect: DOMRect) => void
  close: () => void
}

export function useFlyout(): UseFlyoutReturn {
  let [openId, setOpenId] = useState<string | null>(null)
  let [position, setPosition] = useState<FlyoutPosition>({ top: 0, left: 0 })

  const close = useCallback(() => {
    setOpenId(null)
  }, [])

  const open = useCallback((id: string, rect: DOMRect) => {
    setOpenId(id)
    setPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX })
  }, [])

  useEffect(() => {
    if (!openId) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Element
      // Close if the click is outside any flyout-palette or category-button element
      if (!target.closest('[data-flyout]') && !target.closest('[data-category-btn]')) {
        close()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [openId, close])

  return { openId, position, open, close }
}
```

- [ ] **Step 2: Build check**

```bash
cd /Users/rahul.rr/Documents/repos/equation-editor-poc && pnpm run build 2>&1 | grep "error TS" | grep -v "StyleBar\|SymbolGrid\|TabStrip\|QuickButton\|useTabData\|TAB_IDS\|TabId\|Section\|SymbolDef"
```

Expected: no errors from useFlyout.ts.

---

## Task 6: Build `FlyoutPalette` component

**Files:**
- Create: `src/components/Toolbar/FlyoutPalette.tsx`
- Create: `src/components/Toolbar/FlyoutPalette.module.css`

- [ ] **Step 1: Create `src/components/Toolbar/FlyoutPalette.module.css`**

```css
.palette {
  position: absolute;
  z-index: 1000;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 6px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2px;
  min-width: 160px;
  max-width: 280px;
}

.item {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  min-height: 34px;
  padding: 4px;
  font-size: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  cursor: pointer;
  transition: background 80ms, border-color 80ms;
  font-family: 'STIX Two Math', 'Latin Modern Math', 'Cambria Math', serif;
  line-height: 1;
}

.item:hover {
  background: #eff6ff;
  border-color: #93c5fd;
}

.item.template {
  grid-column: span 2;
  font-size: 13px;
  font-family: inherit;
  background: #f5f3ff;
  border-color: #ddd6fe;
}

.item.template:hover {
  background: #ede9fe;
  border-color: #a78bfa;
}
```

- [ ] **Step 2: Create `src/components/Toolbar/FlyoutPalette.tsx`**

```typescript
import { createPortal } from 'react-dom'
import type { FlyoutPosition } from '../../hooks/useFlyout'
import type { PaletteItem } from '../../types'
import styles from './FlyoutPalette.module.css'

interface FlyoutPaletteProps {
  items: PaletteItem[]
  position: FlyoutPosition
  onInsert: (latex: string) => void
  onClose: () => void
}

export function FlyoutPalette({ items, position, onInsert, onClose }: FlyoutPaletteProps) {
  const style = {
    top: position.top + 4,
    left: position.left,
  }

  function handleClick(latex: string) {
    onInsert(latex)
    // palette stays open — user may want to insert multiple symbols
  }

  return createPortal(
    <div
      className={styles.palette}
      style={style}
      data-flyout="true"
      role="dialog"
      aria-label="Symbol palette"
    >
      {items.map((item, i) => (
        <button
          key={i}
          className={item.isTemplate ? `${styles.item} ${styles.template}` : styles.item}
          title={item.tooltip}
          onClick={() => handleClick(item.latex)}
          type="button"
        >
          {item.display}
        </button>
      ))}
    </div>,
    document.body,
  )
}
```

- [ ] **Step 3: Build check**

```bash
cd /Users/rahul.rr/Documents/repos/equation-editor-poc && pnpm run build 2>&1 | grep "error TS" | grep -v "StyleBar\|SymbolGrid\|TabStrip\|QuickButton\|useTabData\|TAB_IDS\|TabId\|Section\|SymbolDef"
```

Expected: no errors from new files.

---

## Task 7: Build `CategoryButton` component

**Files:**
- Create: `src/components/Toolbar/CategoryButton.tsx`
- Create: `src/components/Toolbar/CategoryButton.module.css`

- [ ] **Step 1: Create `src/components/Toolbar/CategoryButton.module.css`**

```css
.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  height: 30px;
  padding: 0 6px;
  font-size: 13px;
  font-family: 'STIX Two Math', 'Latin Modern Math', 'Cambria Math', serif;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 80ms, border-color 80ms;
  user-select: none;
}

.btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.btn.open {
  background: #dbeafe;
  border-color: #3b82f6;
  color: #1d4ed8;
}

.chevron {
  font-size: 7px;
  margin-left: 2px;
  opacity: 0.5;
  font-family: sans-serif;
}
```

- [ ] **Step 2: Create `src/components/Toolbar/CategoryButton.tsx`**

```typescript
import { useRef } from 'react'
import type { ToolbarCategory } from '../../types'
import type { FlyoutPosition } from '../../hooks/useFlyout'
import { FlyoutPalette } from './FlyoutPalette'
import styles from './CategoryButton.module.css'

interface CategoryButtonProps {
  category: ToolbarCategory
  isOpen: boolean
  onOpen: (id: string, rect: DOMRect) => void
  onClose: () => void
  onInsert: (latex: string) => void
}

export function CategoryButton({
  category,
  isOpen,
  onOpen,
  onClose,
  onInsert,
  position,
}: CategoryButtonProps & { position: FlyoutPosition }) {
  const btnRef = useRef<HTMLButtonElement>(null)

  function handleClick() {
    if (isOpen) {
      onClose()
    } else {
      const rect = btnRef.current?.getBoundingClientRect()
      if (rect) onOpen(category.id, rect)
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        className={isOpen ? `${styles.btn} ${styles.open}` : styles.btn}
        title={category.tooltip}
        onClick={handleClick}
        type="button"
        data-category-btn="true"
      >
        {category.glyph}
        <span className={styles.chevron}>▾</span>
      </button>
      {isOpen && (
        <FlyoutPalette
          items={category.palette}
          position={position}
          onInsert={onInsert}
          onClose={onClose}
        />
      )}
    </>
  )
}
```

- [ ] **Step 3: Build check**

```bash
cd /Users/rahul.rr/Documents/repos/equation-editor-poc && pnpm run build 2>&1 | grep "error TS" | grep -v "StyleBar\|SymbolGrid\|TabStrip\|QuickButton\|useTabData\|TAB_IDS\|TabId\|Section\|SymbolDef"
```

Expected: no errors from new files.

---

## Task 8: Build `ToolbarZone` component

**Files:**
- Create: `src/components/Toolbar/ToolbarZone.tsx`
- Create: `src/components/Toolbar/ToolbarZone.module.css`

- [ ] **Step 1: Create `src/components/Toolbar/ToolbarZone.module.css`**

```css
.zone {
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  padding: 4px 8px;
  flex-shrink: 0;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  align-items: center;
  padding: 2px 0;
}

.row + .row {
  border-top: 1px solid #e5e7eb;
  margin-top: 2px;
  padding-top: 4px;
}
```

- [ ] **Step 2: Create `src/components/Toolbar/ToolbarZone.tsx`**

```typescript
import { useFlyout } from '../../hooks/useFlyout'
import { CategoryButton } from './CategoryButton'
import row1 from '../../data/toolbar/row1'
import row2 from '../../data/toolbar/row2'
import styles from './ToolbarZone.module.css'

interface ToolbarZoneProps {
  onInsert: (latex: string) => void
}

export function ToolbarZone({ onInsert }: ToolbarZoneProps) {
  const { openId, position, open, close } = useFlyout()

  return (
    <div className={styles.zone}>
      <div className={styles.row}>
        {row1.map((cat) => (
          <CategoryButton
            key={cat.id}
            category={cat}
            isOpen={openId === cat.id}
            onOpen={open}
            onClose={close}
            onInsert={onInsert}
            position={position}
          />
        ))}
      </div>
      <div className={styles.row}>
        {row2.map((cat) => (
          <CategoryButton
            key={cat.id}
            category={cat}
            isOpen={openId === cat.id}
            onOpen={open}
            onClose={close}
            onInsert={onInsert}
            position={position}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Build check**

```bash
cd /Users/rahul.rr/Documents/repos/equation-editor-poc && pnpm run build 2>&1 | grep "error TS" | grep -v "StyleBar\|SymbolGrid\|TabStrip\|QuickButton\|useTabData\|TAB_IDS\|TabId\|Section\|SymbolDef"
```

Expected: no errors from ToolbarZone and dependencies.

---

## Task 9: Build `ExpressionChips` component

**Files:**
- Create: `src/components/ExpressionZone/ExpressionChips.tsx`
- Create: `src/components/ExpressionZone/ExpressionChips.module.css`

- [ ] **Step 1: Create `src/components/ExpressionZone/ExpressionChips.module.css`**

```css
.chips {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  padding: 4px 8px;
  overflow-x: auto;
  scrollbar-width: thin;
  align-items: center;
  min-height: 42px;
}

.chip {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3px 8px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 80ms, border-color 80ms;
}

.chip:hover {
  background: #eff6ff;
  border-color: #93c5fd;
}

.chipDisplay {
  font-size: 14px;
  font-family: 'STIX Two Math', 'Latin Modern Math', 'Cambria Math', serif;
  line-height: 1.2;
}

.chipLabel {
  font-size: 9px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-top: 1px;
}

.loading {
  padding: 4px 8px;
  font-size: 12px;
  color: #9ca3af;
}
```

- [ ] **Step 2: Create `src/components/ExpressionZone/ExpressionChips.tsx`**

```typescript
import { useState, useEffect } from 'react'
import type { ExpressionTabId, ExpressionItem } from '../../types'
import styles from './ExpressionChips.module.css'

interface ExpressionChipsProps {
  tabId: ExpressionTabId
  onInsert: (latex: string) => void
}

// Module-level cache so each tab only loads once per session
const chipCache = new Map<ExpressionTabId, ExpressionItem[]>()

export function ExpressionChips({ tabId, onInsert }: ExpressionChipsProps) {
  let [items, setItems] = useState<ExpressionItem[]>(() => chipCache.get(tabId) ?? [])
  let [loading, setLoading] = useState(!chipCache.has(tabId))

  useEffect(() => {
    if (chipCache.has(tabId)) {
      setItems(chipCache.get(tabId)!)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    import(`../../data/expressions/${tabId}.json`)
      .then((mod) => {
        if (cancelled) return
        const data = mod.default.items as ExpressionItem[]
        chipCache.set(tabId, data)
        setItems(data)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [tabId])

  if (loading) {
    return <div className={styles.loading}>Loading…</div>
  }

  return (
    <div className={styles.chips}>
      {items.map((item, i) => (
        <button
          key={i}
          className={styles.chip}
          title={item.latex}
          onClick={() => onInsert(item.latex)}
          type="button"
        >
          <span className={styles.chipDisplay}>{item.display}</span>
          <span className={styles.chipLabel}>{item.label}</span>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Build check**

```bash
cd /Users/rahul.rr/Documents/repos/equation-editor-poc && pnpm run build 2>&1 | grep "error TS" | grep -v "StyleBar\|SymbolGrid\|TabStrip\|QuickButton\|useTabData\|TAB_IDS\|TabId\|Section\|SymbolDef"
```

---

## Task 10: Build `ExpressionTabStrip` component

**Files:**
- Create: `src/components/ExpressionZone/ExpressionTabStrip.tsx`
- Create: `src/components/ExpressionZone/ExpressionTabStrip.module.css`

- [ ] **Step 1: Create `src/components/ExpressionZone/ExpressionTabStrip.module.css`**

```css
.strip {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  overflow-x: auto;
  scrollbar-width: none;
  flex-shrink: 0;
}

.strip::-webkit-scrollbar {
  display: none;
}

.tab {
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: color 80ms, border-color 80ms;
  margin-bottom: -1px;
}

.tab:hover {
  color: #374151;
}

.tab.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}
```

- [ ] **Step 2: Create `src/components/ExpressionZone/ExpressionTabStrip.tsx`**

```typescript
import type { FC } from 'react'
import { EXPRESSION_TAB_IDS, EXPRESSION_TAB_LABELS, type ExpressionTabId } from '../../types'
import styles from './ExpressionTabStrip.module.css'

interface ExpressionTabStripProps {
  activeTab: ExpressionTabId
  onTabChange: (tab: ExpressionTabId) => void
}

const ExpressionTabStrip: FC<ExpressionTabStripProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className={styles.strip}>
      {EXPRESSION_TAB_IDS.map((id) => (
        <button
          key={id}
          className={id === activeTab ? `${styles.tab} ${styles.active}` : styles.tab}
          onClick={() => onTabChange(id)}
          type="button"
        >
          {EXPRESSION_TAB_LABELS[id]}
        </button>
      ))}
    </div>
  )
}

export default ExpressionTabStrip
```

- [ ] **Step 3: Build check**

```bash
cd /Users/rahul.rr/Documents/repos/equation-editor-poc && pnpm run build 2>&1 | grep "error TS" | grep -v "StyleBar\|SymbolGrid\|TabStrip\|QuickButton\|useTabData\|TAB_IDS\|TabId\|Section\|SymbolDef"
```

---

## Task 11: Build `ExpressionZone` container

**Files:**
- Create: `src/components/ExpressionZone/ExpressionZone.tsx`
- Create: `src/components/ExpressionZone/ExpressionZone.module.css`

- [ ] **Step 1: Create `src/components/ExpressionZone/ExpressionZone.module.css`**

```css
.zone {
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  flex-shrink: 0;
}
```

- [ ] **Step 2: Create `src/components/ExpressionZone/ExpressionZone.tsx`**

```typescript
import { useState } from 'react'
import { type ExpressionTabId, EXPRESSION_TAB_IDS } from '../../types'
import ExpressionTabStrip from './ExpressionTabStrip'
import { ExpressionChips } from './ExpressionChips'
import styles from './ExpressionZone.module.css'

interface ExpressionZoneProps {
  onInsert: (latex: string) => void
}

export function ExpressionZone({ onInsert }: ExpressionZoneProps) {
  let [activeTab, setActiveTab] = useState<ExpressionTabId>(EXPRESSION_TAB_IDS[0])

  return (
    <div className={styles.zone}>
      <ExpressionTabStrip activeTab={activeTab} onTabChange={setActiveTab} />
      <ExpressionChips tabId={activeTab} onInsert={onInsert} />
    </div>
  )
}
```

- [ ] **Step 3: Build check**

```bash
cd /Users/rahul.rr/Documents/repos/equation-editor-poc && pnpm run build 2>&1 | grep "error TS" | grep -v "StyleBar\|SymbolGrid\|TabStrip\|QuickButton\|useTabData\|TAB_IDS\|TabId\|Section\|SymbolDef"
```

---

## Task 12: Wire everything into `App.tsx`

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.module.css`

- [ ] **Step 1: Replace `src/App.tsx` entirely**

```typescript
import { useState, useCallback } from 'react'
import { useMathField } from './hooks/useMathField'
import { usePostMessage } from './hooks/usePostMessage'
import { ToolbarZone } from './components/Toolbar/ToolbarZone'
import { ExpressionZone } from './components/ExpressionZone/ExpressionZone'
import { MathField } from './components/Editor/MathField'
import { LaTeXBar } from './components/Editor/LaTeXBar'
import { ActionBar } from './components/ActionBar/ActionBar'
import type { LoadMessage, LoadConfig, OutboundMessage } from './types'
import styles from './App.module.css'

export default function App() {
  const mathField = useMathField()

  let [mathType, setMathType] = useState<'display' | 'inline'>('display')
  let [fontSize, setFontSize] = useState<number>(12)
  let [loadConfig, setLoadConfig] = useState<LoadConfig | null>(null)
  let [currentLatex, setCurrentLatex] = useState<string>('')

  const onLoad = useCallback((msg: LoadMessage) => {
    mathField.setValue(msg.latex)
    setCurrentLatex(msg.latex)
    setMathType(msg.config.mathType)
    setFontSize(msg.config.fontSize)
    setLoadConfig(msg.config)
  }, [mathField])

  const { send } = usePostMessage(onLoad)

  function handleInsert(latex: string) {
    mathField.insert(latex)
  }

  function handleLatexCommit(latex: string) {
    mathField.setValue(latex)
    setCurrentLatex(latex)
  }

  function handleCancel() {
    const payload: OutboundMessage = { type: 'cancel' }
    send(payload)
  }

  function getLatex() {
    return mathField.getValue('latex')
  }

  function getMathML() {
    return mathField.getValue('math-ml')
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <ToolbarZone onInsert={handleInsert} />
      </div>
      <div className={styles.expressions}>
        <ExpressionZone onInsert={handleInsert} />
      </div>
      <div className={styles.canvas}>
        <MathField mathFieldRef={mathField.ref} onChange={setCurrentLatex} />
        <LaTeXBar value={currentLatex} onCommit={handleLatexCommit} />
      </div>
      <div className={styles.actionBar}>
        <ActionBar
          mathType={mathType}
          onMathTypeChange={setMathType}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          getLatex={getLatex}
          getMathML={getMathML}
          loadConfig={loadConfig}
          send={send}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace `src/App.module.css` entirely**

```css
.root {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: #fff;
}

.toolbar {
  overflow: visible; /* must not clip flyout portals */
  flex-shrink: 0;
}

.expressions {
  overflow: hidden;
  flex-shrink: 0;
}

.canvas {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.canvas > :first-child {
  flex: 1;
  min-height: 0;
}

.actionBar {
  overflow: hidden;
  flex-shrink: 0;
}
```

- [ ] **Step 3: Full build — must be clean**

```bash
cd /Users/rahul.rr/Documents/repos/equation-editor-poc && pnpm run build 2>&1
```

Expected: build succeeds with only the old unused files still present (they are not imported anywhere). No errors from any new file.

---

## Task 13: Delete old files

**Files to delete:**
- `src/components/Toolbar/StyleBar.tsx`
- `src/components/Toolbar/StyleBar.module.css`
- `src/components/Toolbar/SymbolGrid.tsx`
- `src/components/Toolbar/SymbolGrid.module.css`
- `src/components/Toolbar/TabStrip.tsx`
- `src/components/Toolbar/TabStrip.module.css`
- `src/components/Toolbar/QuickButton.tsx`
- `src/hooks/useTabData.ts`
- `src/data/tabs/` (entire directory)

- [ ] **Step 1: Remove old files**

```bash
cd /Users/rahul.rr/Documents/repos/equation-editor-poc && \
  rm src/components/Toolbar/StyleBar.tsx \
     src/components/Toolbar/StyleBar.module.css \
     src/components/Toolbar/SymbolGrid.tsx \
     src/components/Toolbar/SymbolGrid.module.css \
     src/components/Toolbar/TabStrip.tsx \
     src/components/Toolbar/TabStrip.module.css \
     src/components/Toolbar/QuickButton.tsx \
     src/hooks/useTabData.ts && \
  rm -rf src/data/tabs/
```

- [ ] **Step 2: Final clean build**

```bash
cd /Users/rahul.rr/Documents/repos/equation-editor-poc && pnpm run build 2>&1
```

Expected: completely clean build, zero errors, zero warnings about deleted files.

- [ ] **Step 3: Lint check**

```bash
cd /Users/rahul.rr/Documents/repos/equation-editor-poc && pnpm run lint 2>&1
```

Expected: no lint errors.

---

## Task 14: Manual verification + commit

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/rahul.rr/Documents/repos/equation-editor-poc && pnpm run dev
```

Open `http://localhost:5173` in Chrome.

- [ ] **Step 2: Verify toolbar renders**

Confirm you see two rows of compact buttons at the top:
- Row 1: ≤≥≈  …  ± • ⊗  →  ∴∀  ∈∩⊂  ∂∞ℓ  λωθ  ΛΩΘ
- Row 2: ( )  ½√  x²  Σ  ∫  →̄  Π∪  ▦

- [ ] **Step 3: Verify flyout opens**

Click the `≤≥≈` button. A palette grid of ~17 relational symbols should appear below it.
Click `∫`. A palette of integral variants (∫, ∬, ∭, ∮…) should appear.

- [ ] **Step 4: Verify insert works**

With the `≤≥≈` palette open, click `≈`. The MathLive canvas should show `≈` inserted at cursor.

- [ ] **Step 5: Verify dismiss works**

Click outside the palette. It should close.
Open a palette and press Escape. It should close.
Open two different palettes in sequence — only one should be open at a time.

- [ ] **Step 6: Verify expression zone**

Confirm the tab bar shows: Algebra | Calculus | Statistics | Matrices | Sets | Trig | Geometry | More
Click "Calculus" — the chip row should switch to calculus formulas (∫f dx, d/dx f, etc.).
Click a chip — the formula inserts into MathLive.

- [ ] **Step 7: Commit**

```bash
cd /Users/rahul.rr/Documents/repos/equation-editor-poc && \
  git add src/ && \
  git commit -m "$(cat <<'EOF'
feat: replace toolbar with MathType-style flyout palettes

Subject:
Rebuild equation editor toolbar with category buttons and portal flyouts

Context:
Original StyleBar + flat SymbolGrid diverged from MathType model; users need
flyout palettes matching the MathType UX they already know

Changes:
- Add ToolbarZone: two rows of CategoryButton components (9 + 8 categories)
- Add FlyoutPalette: portal-rendered symbol/template grid per category
- Add useFlyout: single-open state, click-outside, Escape dismissal
- Add ExpressionZone: tabbed formula chips (8 tabs, lazy-loaded JSON)
- Add full palette data in src/data/toolbar/row1.ts and row2.ts
- Add expression chip data in src/data/expressions/*.json
- Remove StyleBar, SymbolGrid, TabStrip, QuickButton, useTabData, old tab data

Impact:
Toolbar now matches MathType exactly: compact category buttons open flyout
palettes with all symbol variants; expression library below with formula chips

Signed-off-by: Rahul R R <rahul.rr@kriyadocs.com>
EOF
)"
```

---

## Spec coverage check

| Design requirement | Task |
|---|---|
| Row 1: 9 symbol category buttons | Tasks 2, 8 |
| Row 2: 8 template category buttons | Tasks 3, 8 |
| Each button opens flyout palette | Tasks 5, 6, 7 |
| Portal-rendered (not clipped) | Task 6 — `createPortal(…, document.body)` |
| Single palette open at a time | Task 5 — `useFlyout` enforces single `openId` |
| Click-outside dismisses | Task 5 — `pointerdown` listener |
| Escape dismisses | Task 5 — `keydown` listener |
| Palette stays open on symbol insert | Task 6 — no `onClose()` call in `handleClick` |
| Expression tab bar (8 tabs) | Tasks 10, 11 |
| Formula chips per tab (lazy-loaded) | Tasks 4, 9 |
| Remove StyleBar / SymbolGrid / TabStrip | Task 13 |
| App.tsx wires new zones | Task 12 |
| Clean build | Tasks 6–14 each verify |
