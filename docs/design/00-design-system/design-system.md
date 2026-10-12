---
name: Editorial Precision Radar
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1b1b1d'
  surface-container: '#201f21'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#c5c9ae'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#303032'
  outline: '#8f937a'
  outline-variant: '#444934'
  surface-tint: '#add500'
  primary: '#ffffff'
  on-primary: '#293500'
  primary-container: '#c8f232'
  on-primary-container: '#576c00'
  inverse-primary: '#516600'
  secondary: '#c8c6ca'
  on-secondary: '#303033'
  secondary-container: '#47464a'
  on-secondary-container: '#b6b4b8'
  tertiary: '#ffffff'
  on-tertiary: '#002d6f'
  tertiary-container: '#d9e2ff'
  on-tertiary-container: '#3561b9'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c8f232'
  primary-fixed-dim: '#add500'
  on-primary-fixed: '#171e00'
  on-primary-fixed-variant: '#3d4d00'
  secondary-fixed: '#e4e1e5'
  secondary-fixed-dim: '#c8c6ca'
  on-secondary-fixed: '#1b1b1e'
  on-secondary-fixed-variant: '#47464a'
  tertiary-fixed: '#d9e2ff'
  tertiary-fixed-dim: '#b0c6ff'
  on-tertiary-fixed: '#001945'
  on-tertiary-fixed-variant: '#06429a'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 52px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-base:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  mono-metric:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.01em
  mono-label:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.08em
  mono-micro:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 12px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies the intersection of Swiss International Typographic Style, Linear’s dark-mode engineering discipline, and Vercel’s monochromatic rigor. Designed specifically for a high-performance two-user AI job and internship intelligence engine, the aesthetic rejects consumer career-board clutter in favor of an authoritative, high-density command surface.

The emotional signature is razor-sharp focus, quiet competence, and computational advantage:
- **Tone:** Telemetric, analytical, discreet, high-craft.
- **Visual Stance:** Ultra-flat tactile surfaces defined by 1px hairline structural boundaries, strict monochromatic hierarchies, and a disciplined single-point fluorescent signal accent (`#D4FF3F`) reserved strictly for intelligence signals, primary actions, and real-time state changes.
- **Architectural Rules:** Structural geometry relies on mathematical alignment, disciplined tabular data, and subtle 1px canvas grids (3% opacity) evoking physical drafting sheets and hardware telemetry.

## Colors

The palette operates on absolute chromatic economy. Color is an informational device, never decorative. Surfaces rely on precise luminosity layering rather than elevation shadows.

### Dark Mode (Primary Engine)
- **Background:** `#0A0A0B` (Canvas bedrock)
- **Surface:** `#121214` (Workstations, tables, panels)
- **Elevated Surface:** `#1A1A1D` (Overlays, dialogs, active states)
- **Border / Hairline:** `#26262A` (1px crisp boundary)
- **Text Primary:** `#F4F2EE` (Warm off-white for low eye-strain)
- **Text Muted:** `#8E8B85` (Secondary metadata, structural keys)
- **Signal Lime (Primary Accent):** `#D4FF3F` (Match scores >= 90%, active radar triggers, primary CTA)
- **Status Semantic:**
  - Danger: `#FF5C47`
  - Warning: `#F5B544`
  - Success: `#4ADE80`
  - Info: `#7AA2FF`

### Light Mode (Daytime Archive)
- **Background:** `#F6F5F1` (Tactile editorial stone)
- **Surface:** `#FFFFFF` (Primary modules, clear paper cards)
- **Elevated Surface:** `#EFEEE9` (Tooltips, secondary controls)
- **Border / Hairline:** `#E2E0D9` (Architectural grid boundary)
- **Text Primary:** `#111111` (Deep slate)
- **Text Muted:** `#6B6862` (Secondary captions)
- **Accent Primary:** `#1F3D2E` (Forest slate) punctuated by `#D4FF3F` micro-badges and glow indicators.
- **Status Semantic:**
  - Danger: `#D92D20`
  - Warning: `#B7791F`
  - Success: `#15803D`
  - Info: `#2F5BD3`

### Chromatic Discipline
Never use gradient fills on interactive components. The signal accent `#D4FF3F` must not exceed 5% of viewport real estate at any given time.

## Typography

The typography implements a dual-mode system: high-density editorial sans paired with precise monospaced telemetry.

1. **Headlines & Structural Titles (Inter - Tight Tracking):** Headings feature dense line heights and an aggressive negative tracking (`-0.02em` to `-0.03em`) in semi-bold weight (`600`), establishing an authoritative, editorial cadence reminiscent of high-end design retrospectives.
2. **Body & Prose (Inter):** Fixed between `14px` and `15px` with neutral character rendering and optical balance to handle complex multi-paragraph job specifications and AI analysis memos.
3. **Telemetry & Meta Data (JetBrains Mono):** Reserved for technical readouts, match calculations, ISO timestamps, salary bands, and countdown clocks. All micro-labels in JetBrains Mono use uppercase transformations with tracking from `+0.08em` to `+0.1em`.

## Layout & Spacing

The layout is rooted in a strict 8-point Cartesian grid, anchored by structural hairlines.

### Canvas Grid Architecture
- A faint 1px background grid at 3% opacity (`#FFFFFF` in dark mode, `#000000` in light mode) is rendered across canvas surfaces at 32px intervals.
- **Split Radar View (Two-User Optimization):** The viewport supports an uninterrupted split-pane layout with independent dual-filter states, comparative timelines, and real-time synchronization channels.

### Form Factors & Breakpoints
- **Mobile (< 768px):** Single column stream. Outer margin: `16px`. Tab bar toggles between User A and User B radar streams.
- **Tablet (768px – 1024px):** 8-column layout. Margin: `24px`, Gutter: `16px`. Side drawer collapses to compact telemetry icons.
- **Desktop (1024px – 1600px):** 12-column layout. Margin: `40px`, Gutter: `24px`. Side-by-side multi-stream radar workbench.
- **Wide Desktop (> 1600px):** Fixed max container `1680px` centered with auto-margins.

## Elevation & Depth

This design system avoids traditional dropped blur shadows. Depth is communicated purely through **tonal stratification, hairline containment, and luminous edge highlights**.

### Structural Surface Stack
1. **Bedrock Canvas (Level 0):** `#0A0A0B`. Holds background grid lines.
2. **Standard Surface (Level 1):** `#121214`. Enclosed in a 1px solid hairline of `#26262A`. No shadow.
3. **Interactive & Elevated Surface (Level 2):** `#1A1A1D`. Enclosed in 1px solid `#26262A` with an internal top-inset hairline highlight: `inset 0 1px 0 0 rgba(255, 255, 255, 0.05)`.
4. **Active Focus & High Priority:** Inset highlight shifts to `rgba(212, 255, 63, 0.25)` or direct signal borders.

### Overlays & Flyouts
Floating command palettes, menus, and inspector sheets use `#121214` combined with a `backdrop-filter: blur(12px)` and a subtle ambient occlusion border:
- `box-shadow: 0 0 0 1px #26262A, 0 16px 32px -8px rgba(0, 0, 0, 0.6)`.

## Shapes

The geometric vocabulary balances architectural discipline with ergonomic utility. Edges are crisp, avoiding exaggerated or playful pill shapes.

- **Cards & Data Modules:** Fixed at `10px` radius (`rounded-[10px]`). Maintains precise containment when stacked in a dense table or grid.
- **Interactive Controls (Buttons, Inputs, Selectors):** Fixed at `8px` radius (`rounded-[8px]`).
- **Telemetry Chips, Badges & Micro-Pills:** `4px` radius or sharp chamfered appearance; never fully circular except for round 6px telemetry live-status pings.
- **Dividers:** 1px hairlines without edge rounding.

## Components

### Buttons
- **Primary Signal:** Fill `#D4FF3F`, text `#0A0A0B`, font Inter semi-bold 14px, radius 8px, padding `8px 16px`. Hover: `#C3EE2C`. Active: scales down to `0.98`.
- **Secondary Ghost:** Surface `#1A1A1D`, 1px border `#26262A`, text `#F4F2EE`. Hover: border `#3A3A40` with top hairline highlight.
- **Danger Action:** Surface transparent, 1px border `rgba(255, 92, 71, 0.3)`, text `#FF5C47`. Hover: fill `rgba(255, 92, 71, 0.1)`.

### Cards & Radar Nodes
- Encased in 10px radius, 1px `#26262A` border, background `#121214`.
- Header houses uppercase JetBrains Mono tags (e.g., `MATCH: 96%`, `AI ACCELERATED`, `14M AGO`).
- Hover state: 1px border transitions from `#26262A` to `#3A3A40`, subtle cursor-bound spotlight gradient at 4% opacity.

### Match Score Chips & Micro-Labels
- JetBrains Mono 11px uppercase.
- Scores `>= 90%`: Text `#D4FF3F`, background `rgba(212, 255, 63, 0.08)`, border `1px solid rgba(212, 255, 63, 0.25)`.
- Scores `< 90%` and `>= 75%`: Text `#7AA2FF`, background `rgba(122, 162, 255, 0.08)`, border `1px solid rgba(122, 162, 255, 0.2)`.

### Input Fields & Command Palettes
- Background `#0E0E10`, border 1px `#26262A`, radius 8px, text `#F4F2EE`.
- Height: `36px` compact, `44px` large search.
- Focus: Border shifts to `#8E8B85`, with `0 0 0 1px #8E8B85`. No chromatic ring unless directly validated by AI search.

### Checkboxes & Segmented Radios
- Square 16px with 3px radius. Unchecked: border 1px `#3A3A40`, fill `#121214`.
- Checked: fill `#D4FF3F`, border `#D4FF3F`, icon check in `#0A0A0B`.

### Lists & Data Grids
- Continuous 1px hairline rows with zero margin collapse. Alternate row hover uses `#161619`.
- Column headers rendered strictly in `JetBrains Mono` 11px uppercase tracking `0.08em` in `#8E8B85`.

### Specialized Radar Components
- **Dual User Switcher:** Split tab pill at screen top with active avatar indicators and independent alert counters in `#D4FF3F`.
- **Telemetry Live-Pulse:** 6px circle with a subtle CSS radar ripple indicating real-time background scraping and model inference.