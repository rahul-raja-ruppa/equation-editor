# MathType Editor — UI & Functionality Reference

> Source: Wiris official documentation (docs.wiris.com) + wiris.com/en/mathtype  
> Collected: 2026-05-28

---

## 1. What Is MathType?

MathType is a **WYSIWYG (What You See Is What You Get) equation/formula editor** developed by Wiris. It runs entirely in JavaScript, so it works across any browser and OS — including mobile and tablet. It is embedded into tools like Microsoft Word, PowerPoint, Google Docs, Google Slides, CKEditor, TinyMCE, Blackboard, D2L Brightspace, and WPS.

---

## 2. Overall Window Layout

```
┌──────────────────────────────────────────────────────────────┐
│  MENU BAR  (File | Edit | View | Insert | Format | Style |   │
│             Size | Preferences)               [Desktop only] │
├──────────────────────────────────────────────────────────────┤
│  TABBED TOOLBAR (10 tabs with symbol/template icons)         │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ [General][Symbols][Arrows][Greek][Matrices][Scripts] │    │
│  │ [Decorations][Big Operators][Calculus][Contextual]   │    │
│  └──────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│            EQUATION EDITING AREA  (WYSIWYG canvas)          │
│                                                              │
│   Shows formula in real-time · cursor blinks here           │
│   Selected text is highlighted                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  STATUS BAR  (style · font size · zoom · color ·            │
│               equation dimensions)             [Desktop only]│
├──────────────────────────────────────────────────────────────┤
│  [ Cancel ]                               [ OK / Insert ]   │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Toolbar Tabs (Web Interface — 10 Tabs)

| #   | Tab Name                     | Keyboard Shortcut                | Content                                                                         |
| --- | ---------------------------- | -------------------------------- | ------------------------------------------------------------------------------- |
| 1   | **General**                  | Alt+1 (Win/Linux) / Ctrl+1 (Mac) | Basic math elements, common operators                                           |
| 2   | **Symbols**                  | Alt+2                            | Mathematical symbols (∞, ∈, ≠, …)                                               |
| 3   | **Arrows**                   | Alt+3                            | All arrow variants (→, ⇒, ↔, ⟹, …)                                              |
| 4   | **Greek, letters & numbers** | Alt+4                            | Full Greek alphabet (α β γ…), blackboard bold, Fraktur                          |
| 5   | **Matrices and elementary**  | Alt+5                            | Table/matrix templates, long division, stacked operations                       |
| 6   | **Scripts and layouts**      | Alt+6                            | Superscript, subscript, structural templates                                    |
| 7   | **Decorations**              | Alt+7                            | Accents, overlines, underlines, wide hats, arrows above                         |
| 8   | **Big operators**            | Alt+8                            | ∑ ∏ ∫ with/without limits, ⊕ ⊗ …                                                |
| 9   | **Calculus**                 | Alt+9                            | Integrals, derivatives, limits, differential notation                           |
| 10  | **Contextual**               | Alt+0                            | Dynamic — changes based on cursor position (matrix borders, alignment, spacing) |

> **Publishers Tab** (admin-activated): Advanced MathML editing controls — inline/block display toggles, invisible operator insertion.

---

## 4. Desktop (MathType 7) Toolbar Extras

The desktop application has additional toolbar rows:

| Toolbar Row           | Description                                                   |
| --------------------- | ------------------------------------------------------------- |
| **Small Bar**         | User-customizable; stores frequently-used symbols/expressions |
| **Large Tabbed Bar**  | Tabbed; stores full expressions and complex templates         |
| **Small Tabbed Bar**  | Tabbed; stores symbols and templates with labeled tabs        |
| **Symbol Palettes**   | Opened via F2/F5 (Cmd+F5 on Mac)                              |
| **Template Palettes** | Opened via F6 (Cmd+F6 on Mac)                                 |

Toolbar bars can be **docked or floating** (Windows), **resized** (3 size options), **toggled** on/off, and **tabs renamed**.

---

## 5. Input Modes

### 5a. Classic Input Mode

- Select symbols and templates from toolbar tabs
- Combine them to build equations step by step
- Can type characters directly with the keyboard

### 5b. Handwriting Input Mode

- Write math by hand (touch/stylus/mouse)
- **AI-powered handwriting recognition** converts to clean digital equations instantly
- Preview shown before insertion — can switch back to classic mode to correct

### 5c. Direct Code Input

| Shortcut     | Opens                                 |
| ------------ | ------------------------------------- |
| Ctrl+Shift+X | **MathML editor** window (read/write) |
| Ctrl+Shift+L | **LaTeX editor** window (read/write)  |

Both support direct code editing + "Submit Query" to instantly update the visual formula.

---

## 6. Symbol & Template Library

- **500+ mathematical symbols**
- Matrices (up to 6×6 via grid hover, or custom via +/− buttons or typed dimensions)
- Multiline equations
- Fractions, radicals, integrals, summations, products
- Fences (parentheses, brackets, braces — auto-scale with content)
- Accents and embellishments
- Big operators with/without limits
- Calculus notation (∂, ∫, ∇, lim…)

---

## 7. Auto-Formatting Intelligence

| Feature           | Behavior                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| **Autoitalics**   | Single-letter variables auto-italicized; function names (sin, cos, tan, log, ln) stay upright                |
| **Autoformat**    | Keyboard symbols upgraded to enhanced counterparts; brackets/braces auto-close                               |
| **Fence scaling** | Toolbar-inserted fences auto-scale to match content height; keyboard-typed `()` stay static                  |
| **Smart delete**  | Delete at template edge twice → removes container, keeps content; delete opening fence → removes both fences |

---

## 8. Keyboard Shortcuts

| Action             | Windows/Linux    | macOS            |
| ------------------ | ---------------- | ---------------- |
| Superscript        | Ctrl+↑           | Cmd+↑            |
| Subscript          | Ctrl+↓           | Cmd+↓            |
| Bold               | Ctrl+B           | Cmd+B            |
| Italic             | Ctrl+I           | Cmd+I            |
| Cut / Copy / Paste | Ctrl+X/C/V       | Cmd+X/C/V        |
| Undo / Redo        | Ctrl+Z / Ctrl+Y  | Cmd+Z / Cmd+Y    |
| Select             | Shift+arrow keys | Shift+arrow keys |
| Navigate tabs      | Alt+1…0          | Ctrl+1…0         |
| Open MathML editor | Ctrl+Shift+X     | Cmd+Shift+X      |
| Open LaTeX editor  | Ctrl+Shift+L     | Cmd+Shift+L      |

---

## 9. Chemistry Support (ChemType)

A switchable mode inside MathType with a **chemistry-specific toolbar**:

- Periodic table access
- Inorganic chemistry symbols
- Bond notation
- Chemical formula templates
- Seamlessly switches back to math mode

---

## 10. Format & Style Options

| Scope         | Options                                          |
| ------------- | ------------------------------------------------ |
| Whole formula | 6 built-in font styles                           |
| Single symbol | Double-struck (ℝ, ℕ…), Script (𝒜…), Fraktur (𝔄…) |
| Selection     | Bold, Italic, Bold+Italic combinations           |

---

## 11. Output Formats

| Format     | Use case                                         |
| ---------- | ------------------------------------------------ |
| **SVG**    | Scalable, crisp at any size — preferred for web  |
| **PNG**    | Raster image for legacy/email contexts           |
| **PDF**    | Print-ready documents                            |
| **MathML** | Semantic markup for accessibility/screen readers |
| **LaTeX**  | TeX-based documents and academic publishing      |

---

## 12. Platform Integrations

| Category              | Tools                                                       |
| --------------------- | ----------------------------------------------------------- |
| **Office**            | Microsoft Word, PowerPoint, Google Docs, Google Slides, WPS |
| **Rich Text Editors** | CKEditor 4 & 5, TinyMCE                                     |
| **LMS**               | Blackboard, D2L Brightspace                                 |
| **Publishing**        | XML editors, HTML editors                                   |
| **Devices**           | Desktop (Win/Mac), Browser, Mobile, Tablet                  |

---

## 13. Mobile-Specific UI Adaptations

- Cursor replaced with **drag handles** (vertical + horizontal)
- Copy/paste via **popup menus** (keyboard clipboard API restricted)
- Handwriting input as primary input method on touch devices
- Responsive toolbar scales to screen size

---

## 14. Status Bar (Desktop — MathType 7)

Displayed at the bottom of the desktop window:

- Current **style** assignment
- **Font size** setting
- **Zoom level**
- Active **color**
- **Equation dimensions** and baseline shift (shown when saving/copying)

---

## 15. Key Conceptual Differences vs. Word Equation Editor

| Feature             | MathType       | Word Equation Editor |
| ------------------- | -------------- | -------------------- |
| Platform            | Web + Desktop  | Desktop only         |
| Handwriting input   | Yes (AI)       | Limited              |
| Chemistry support   | Yes (ChemType) | No                   |
| MathML/LaTeX export | Yes            | Limited              |
| LMS integration     | Yes            | No                   |
| Symbol count        | 500+           | ~300                 |
| Custom toolbars     | Yes            | No                   |

---

## Sources

- [Toolbar and icons — Wiris](https://docs.wiris.com/mathtype/en/user-interfaces/mathtype-web-interface/toolbar-and-icons.html)
- [Using MathType — Wiris](https://docs.wiris.com/mathtype/en/user-interfaces/mathtype-web-interface/using-mathtype.html)
- [Quick View — Wiris](https://docs.wiris.com/mathtype/en/user-interfaces/mathtype-web-interface/quick-view.html)
- [MathType 7 UI Basic Usage — Wiris](https://docs.wiris.com/mathtype/en/user-interfaces/mathtype-7-interface/mathtype-7-ui-basic-usage.html)
- [MathType 7 Toolbars Reference — Wiris](https://docs.wiris.com/mathtype/en/user-interfaces/mathtype-7-interface/mathtype-reference/toolbars.html)
- [MathType Equation Editor — Wiris](https://www.wiris.com/en/mathtype/)
- [Using the Equation Editor — Richland College](https://people.richland.edu/james/editor/mathtype.html)
- [MathType — Wikipedia](https://en.wikipedia.org/wiki/MathType)
