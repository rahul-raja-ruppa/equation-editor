# Unified MathLive Icon Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three-way inconsistent icon system (Unicode chars, Lucide SVGs, MathLive HTML) with a single MathLive `convertLatexToMarkup` renderer for all category button icons and search result glyphs.

**Architecture:** The `ToolbarCategory` type's `glyph` field (currently unused in rendering — `CategoryIcon.tsx` ignores it and uses `id`-keyed hardcoded maps) is renamed to `icon` and given a proper LaTeX string per category. `CategoryButton` renders `<MathPreview>` directly inside a fixed-size CSS wrapper. `CategoryIcon.tsx` is deleted. Search glyphs already use `MathPreview` but need a fixed-width container CSS fix.

**Tech Stack:** React 18, MathLive `convertLatexToMarkup` (already bundled), CSS Modules

---

## File Map

| Action | File |
|---|---|
| Modify | `src/types/index.ts` — rename `glyph` → `icon` in `ToolbarCategory` |
| Modify | `src/data/toolbar/row1.ts` — `glyph:` → `icon:` with LaTeX string per category |
| Modify | `src/data/toolbar/row2.ts` — same |
| Modify | `src/components/Toolbar/CategoryButton.tsx` — swap `<CategoryIcon>` for `<MathPreview>` in wrapper |
| Modify | `src/components/Toolbar/CategoryButton.module.css` — add `.iconWrap`, remove `.unicodeIcon`/`.svgIcon` |
| Delete | `src/components/Toolbar/CategoryIcon.tsx` |
| Modify | `src/components/Utility/UtilityRow.module.css` — fix `.glyph` to fixed-width container |

---

### Task 1: Rename `glyph` → `icon` in the type

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Update `ToolbarCategory` interface**

In `src/types/index.ts`, replace lines 11–16:

```ts
export interface ToolbarCategory {
  id: string;
  icon: string; // LaTeX string rendered as MathLive icon on the category button
  tooltip: string;
  palette: PaletteItem[];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "refactor: rename ToolbarCategory.glyph to icon (LaTeX string)"
```

---

### Task 2: Update row1 category data with LaTeX icons

**Files:**
- Modify: `src/data/toolbar/row1.ts`

- [ ] **Step 1: Replace all `glyph:` values with LaTeX `icon:` strings**

Replace the entire file content:

```ts
import type { ToolbarCategory } from '../../types';

const row1: ToolbarCategory[] = [
  {
    id: 'relations',
    icon: '\\leq',
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
    icon: '\\cdots',
    tooltip: 'Spacing & Dots',
    palette: [
      { latex: '\\ldots', display: '…', tooltip: 'Horizontal dots (baseline)' },
      { latex: '\\cdots', display: '⋯', tooltip: 'Horizontal dots (center)' },
      { latex: '\\vdots', display: '⋮', tooltip: 'Vertical dots' },
      { latex: '\\ddots', display: '⋱', tooltip: 'Diagonal dots' },
      { latex: '\\,', display: '\\,', tooltip: 'Thin space', isSpace: true, spaceSize: 'thin' },
      { latex: '\\;', display: '\\;', tooltip: 'Medium space', isSpace: true, spaceSize: 'med' },
      { latex: '\\quad', display: '\\quad', tooltip: 'Quad space', isSpace: true, spaceSize: 'quad' },
      { latex: '\\qquad', display: '\\qquad', tooltip: 'Double quad space', isSpace: true, spaceSize: 'qquad' },
      { latex: '\\therefore', display: '∴', tooltip: 'Therefore' },
      { latex: '\\because', display: '∵', tooltip: 'Because' },
    ],
  },
  {
    id: 'operators',
    icon: '\\pm',
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
    icon: '\\rightarrow',
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
    icon: '\\forall',
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
    icon: '\\subset',
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
    icon: '\\partial',
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
    icon: '\\lambda',
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
    icon: '\\Omega',
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
];

export default row1;
```

- [ ] **Step 2: Commit**

```bash
git add src/data/toolbar/row1.ts
git commit -m "refactor: replace multi-char glyphs with LaTeX icon strings in row1"
```

---

### Task 3: Update row2 category data with LaTeX icons

**Files:**
- Modify: `src/data/toolbar/row2.ts`

- [ ] **Step 1: Replace all `glyph:` values with LaTeX `icon:` strings**

Replace the entire file content:

```ts
import type { ToolbarCategory } from '../../types';

const row2: ToolbarCategory[] = [
  {
    id: 'fences',
    icon: '\\left(a\\right)',
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
    icon: '\\tfrac{1}{2}',
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
    icon: 'x^{n}',
    tooltip: 'Scripts & Positions',
    palette: [
      { latex: '#0^{#1}', display: 'x²', tooltip: 'Superscript', isTemplate: true },
      { latex: '#0_{#1}', display: 'xₙ', tooltip: 'Subscript', isTemplate: true },
      { latex: '#0_{#1}^{#2}', display: 'xₙ²', tooltip: 'Sub + super', isTemplate: true },
      { latex: '{}^{#0}#1', display: '²x', tooltip: 'Pre-superscript', isTemplate: true },
      { latex: '{}_{#0}#1', display: '₂x', tooltip: 'Pre-subscript', isTemplate: true },
      { latex: '{}_{#0}^{#1}#2', display: '²₂x', tooltip: 'Pre sub+super', isTemplate: true },
      { latex: '#0\\prime', display: 'x′', tooltip: 'Prime', isTemplate: true },
      { latex: '#0\\prime\\prime', display: 'x″', tooltip: 'Double prime', isTemplate: true },
    ],
  },
  {
    id: 'summation',
    icon: '\\textstyle\\sum',
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
    icon: '\\textstyle\\int',
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
    icon: '\\hat{a}',
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
    icon: '\\textstyle\\prod',
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
    icon: '\\begin{smallmatrix}a&b\\\\c&d\\end{smallmatrix}',
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
];

export default row2;
```

- [ ] **Step 2: Commit**

```bash
git add src/data/toolbar/row2.ts
git commit -m "refactor: replace multi-char glyphs with LaTeX icon strings in row2"
```

---

### Task 4: Update CategoryButton to use MathPreview directly

**Files:**
- Modify: `src/components/Toolbar/CategoryButton.tsx`

- [ ] **Step 1: Replace CategoryIcon import with MathPreview, render icon wrap**

Replace the entire file:

```tsx
import { useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ToolbarCategory } from '../../types';
import type { FlyoutPosition } from '../../hooks/useFlyout';
import { FlyoutPalette } from './FlyoutPalette';
import { MathPreview } from '../MathPreview/MathPreview';
import styles from './CategoryButton.module.css';

interface CategoryButtonProps {
  category: ToolbarCategory;
  isOpen: boolean;
  onOpen: (id: string, rect: DOMRect) => void;
  onClose: () => void;
  onCancelClose: () => void;
  onScheduleClose: () => void;
  onInsert: (latex: string) => void;
  position: FlyoutPosition;
}

export function CategoryButton({
  category,
  isOpen,
  onOpen,
  onClose,
  onCancelClose,
  onScheduleClose,
  onInsert,
  position,
}: CategoryButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  function show() {
    onCancelClose();
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) onOpen(category.id, rect);
  }

  function handleClick() {
    if (isOpen) {
      onCancelClose();
      onClose();
    } else {
      show();
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        className={isOpen ? `${styles.btn} ${styles.open}` : styles.btn}
        title={category.tooltip}
        onClick={handleClick}
        onMouseEnter={show}
        onMouseLeave={onScheduleClose}
        type="button"
        data-category-btn="true"
      >
        <span className={styles.iconWrap}>
          <MathPreview latex={category.icon} />
        </span>
        <ChevronDown size={9} strokeWidth={2.5} className={styles.chevron} />
      </button>
      {isOpen && (
        <FlyoutPalette
          label={category.tooltip}
          items={category.palette}
          position={position}
          onInsert={onInsert}
          onMouseEnter={onCancelClose}
          onMouseLeave={onScheduleClose}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Toolbar/CategoryButton.tsx
git commit -m "refactor: render category button icons via MathPreview instead of CategoryIcon"
```

---

### Task 5: Update CategoryButton CSS

**Files:**
- Modify: `src/components/Toolbar/CategoryButton.module.css`

- [ ] **Step 1: Replace unicodeIcon/svgIcon with iconWrap, adjust button font-size**

Replace the entire file:

```css
.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-width: 46px;
  height: 38px;
  padding: 0 9px;
  font-size: 13px;
  background: var(--ee-panel);
  border: 1px solid var(--ee-border);
  border-radius: var(--ee-radius);
  color: var(--ee-text);
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 130ms ease,
    border-color 130ms ease,
    box-shadow 130ms ease,
    transform 80ms ease;
  user-select: none;
}

.btn:hover {
  background: var(--ee-bg);
  border-color: var(--ee-accent);
  box-shadow: 0 0 0 3px var(--ee-accent-weak);
}

.btn.open {
  background: var(--ee-bg);
  border-color: var(--ee-accent);
  color: var(--ee-accent-ink);
  box-shadow: 0 0 0 3px var(--ee-accent-weak);
}

.btn:active {
  transform: translateY(0.5px);
}

.chevron {
  opacity: 0.55;
  color: var(--ee-muted);
  flex-shrink: 0;
  transition:
    opacity 120ms ease,
    color 120ms ease;
}

.btn:hover .chevron,
.open .chevron {
  color: var(--ee-accent);
  opacity: 1;
}

.iconWrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 20px;
  overflow: hidden;
  font-size: 14px;
  flex-shrink: 0;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Toolbar/CategoryButton.module.css
git commit -m "refactor: replace unicodeIcon/svgIcon CSS with unified iconWrap"
```

---

### Task 6: Delete CategoryIcon.tsx

**Files:**
- Delete: `src/components/Toolbar/CategoryIcon.tsx`

- [ ] **Step 1: Verify no other file imports CategoryIcon**

```bash
rg "CategoryIcon" src/
```

Expected output: zero matches (CategoryButton.tsx was already updated in Task 4).

- [ ] **Step 2: Delete the file**

```bash
rm src/components/Toolbar/CategoryIcon.tsx
```

- [ ] **Step 3: Commit**

```bash
git add -A src/components/Toolbar/CategoryIcon.tsx
git commit -m "refactor: delete CategoryIcon — replaced by MathPreview in CategoryButton"
```

---

### Task 7: Fix search result glyph container CSS

**Files:**
- Modify: `src/components/Utility/UtilityRow.module.css`

- [ ] **Step 1: Read the current CSS to find the .glyph rule**

Open `src/components/Utility/UtilityRow.module.css` and locate the `.glyph` selector.

- [ ] **Step 2: Update `.glyph` to fixed-width constrained container**

Replace the existing `.glyph` rule with:

```css
.glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  min-width: 48px;
  height: 28px;
  overflow: hidden;
  font-size: 13px;
  flex-shrink: 0;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Utility/UtilityRow.module.css
git commit -m "fix: constrain search result glyph to fixed-width container"
```

---

## Verification

- [ ] Run dev server: `pnpm run dev`
- [ ] Open `http://localhost:5173`
- [ ] Check toolbar row 1: all 9 category buttons show math-rendered icons (≤, ⋯, ±, →, ∀, ⊂, ∂, λ, Ω) — no Unicode OS font fallback, no Lucide geometry
- [ ] Check toolbar row 2: all 8 category buttons show math-rendered icons — fractions show as proper `½`, scripts as `xⁿ`, matrices as a small grid
- [ ] Hover each button — icon should remain crisp and correctly sized inside the blue accent border
- [ ] Open a flyout — palette items still render correctly (unaffected)
- [ ] Type a search query (e.g. "sum") — result glyphs are fixed-width, rows align uniformly
- [ ] Run `pnpm run lint` — zero errors
- [ ] Run `pnpm run build` — build succeeds with no TypeScript errors
