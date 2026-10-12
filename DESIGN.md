# SCOUT — Design System & UI Spec

**Stitch is the source of truth.** Project: *Scout AI Job Radar* (`projects/9530679423670178592`), design system *Editorial Precision Radar*. Exports live in `docs/design/<NN-screen-theme>/{code.html,screen.png}`:

| Folder | Stitch screen | Theme | Status |
|---|---|---|---|
| `00-design-system/` | Design system asset (`design-system.md`, `theme.json`, generated `code.html`) | dark | `screen.png` **missing — Stitch has no image for the design-system asset; export manually** |
| `01-sign-in-dark/` | Sign In — SCOUT | dark | exported |
| `02-dashboard-dark/` | Dashboard — SCOUT | dark | exported |
| `03-job-feed-dark/` | Job Feed — SCOUT (includes the job detail drawer) | dark | exported |
| `04-watched-dark/` | Watched Companies — SCOUT | dark | exported |
| `05-tracker-dark/` | Application Tracker — SCOUT | dark | exported |
| `06-programs-dark/` | Programs & Opportunities — SCOUT | dark | exported |
| `07-settings-dark/` | Settings — SCOUT (page title "Settings & System Telemetry") | dark | exported |

**Gaps in Stitch (no mock exists):** the light theme (**unverified, no mock**), and the content of three Settings sections (Profile, Preferences, Scan Settings — only Resume and Telegram are drawn). These are marked **[no Stitch mock]** — derived from the Stitch tokens and `PRD.md`, to be re-checked if a mock is added.

**Scope decisions applied (owner):** Tracker has the six PRD columns only (Saved, Applied, OA, Interview, Offer, Rejected), neutral monogram tiles, no table view / conversion chips / filters; Programs has no KPI row, no `Filter Batches`, no bottom cards, reminders 7 days and 1 day before the deadline; Settings has exactly Profile, Resume, Preferences, Telegram, Scan Settings; everything in §9 stays unbuilt.

Where this file and a `code.html` disagree on a value, the **`code.html` (rendered design) wins**; where Stitch's own `design-system.md` text disagrees with its `code.html`, the `code.html` wins and the difference is listed in §10. Do not invent screens, sections or features beyond `PRD.md` (see §9 for Stitch elements that are *not* built).

Design principles: telemetric, analytical, high-density command surface (Swiss editorial × Linear dark-mode discipline × Vercel monochrome). One fluorescent signal accent, used only for intelligence signals, primary actions and live state — never more than ~5% of the viewport. **Depth is tonal layering, not borders**; no gradients on interactive controls.

---

## 1. Tokens

Define in `apps/web/styles/tokens.css` as CSS variables on `:root` (light) and `.dark` (dark, default). Map into Tailwind v4 `@theme`. Components use **only** tokens — no raw hex. The "Stitch name" column is the Material-style name used in the Stitch Tailwind config, for traceability.

### 1.1 Colour — Dark (default) — from Stitch `code.html`
| Token | Value | Stitch name | Use |
|---|---|---|---|
| `--bg` | `#131315` | `background` / `surface` | page background |
| `--surface-lowest` | `#0e0e10` | `surface-container-lowest` | sidebar, topbar (80% + blur), inputs, radar scope, inset panels (drawer bars, JD box) |
| `--surface` | `#1b1b1d` | `surface-container-low` | cards, filter hub, drawer, profile switcher |
| `--surface-2` | `#201f21` | `surface-container` | card hover, inner rows, secondary chips, inactive tiles |
| `--surface-3` | `#2a2a2c` | `surface-container-high` | active nav, secondary buttons, tags, selected tile |
| `--surface-4` | `#353437` | `surface-container-highest` | logo tiles, avatars, tooltip |
| `--surface-bright` | `#39393b` | `surface-bright` | chip hover |
| `--text-strong` | `#ffffff` | `primary` | headings, wordmark, active nav, numerals |
| `--text` | `#e5e1e4` | `on-surface` | body text |
| `--muted` | `#c5c9ae` | `on-surface-variant` | labels, secondary text, inactive nav |
| `--secondary` | `#c8c6ca` | `secondary` | tertiary text, taglines |
| `--outline` | `#8f937a` | `outline` | disabled / faint |
| `--outline-variant` | `#444934` | `outline-variant` | axis lines, rare dividers |
| `--accent` | `#c8f232` | `primary-container` | primary buttons, active segment, fresh badge fill, rings, bars, radar beam |
| `--accent-ink` | `#576c00` | `on-primary-container` | text/icons on `--accent` |
| `--accent-hover` | `#add500` | `primary-fixed-dim` | primary button hover, mid-strength tint |
| `--accent-tint` | `#add500` | `surface-tint` | live dots, accent text on dark surfaces, small icons |
| `--accent-soft` | `rgb(200 242 50 / 0.10)` | `primary-container/10` | match chip bg, eligible chip bg |
| `--info` | `#b0c6ff` | `tertiary-fixed-dim` | 75–89% match, "diff detected", secondary progress |
| `--danger` | `#ffb4ab` | `error` | scam text/icon, missing-skill warning, urgent deadline |
| `--danger-container` | `#93000a` | `error-container` | scam badge/blocked ring fill |
| `--on-danger-container` | `#ffdad6` | `on-error-container` | text on `--danger-container` |
| `--warning` | `#F5B544` | *(designMd only)* | mid scores < 75, soon deadlines — not used in the three mocks |
| `--success` | `#4ADE80` | *(designMd only)* | positive deltas, idle scan dot — not used in the three mocks |

Fixed inline colours in Stitch screens map to tokens: `#c8f232` → `--accent`, `#add500` → `--accent-tint`, `#b0c6ff` → `--info`, `#ffffff` → `--text-strong`.

### 1.2 Colour — Light **(unverified, no mock)**
There is no Stitch light screen. Built as tokens only: derived from the dark Stitch tokens above (same token names, same roles, same accent family) using the light palette already in Stitch's `design-system.md`. Every light value is **unverified** against a mock; re-check when a light mock exists.
| Token | Value |
|---|---|
| `--bg` | `#F6F5F1` |
| `--surface-lowest` | `#FFFFFF` |
| `--surface` | `#FFFFFF` |
| `--surface-2` | `#EFEEE9` |
| `--surface-3` | `#E7E5DE` |
| `--surface-4` | `#DEDBD2` |
| `--surface-bright` | `#E2E0D9` |
| `--text-strong` | `#111111` |
| `--text` | `#111111` |
| `--muted` | `#6B6862` |
| `--secondary` | `#6B6862` |
| `--outline` | `#A3A09A` |
| `--outline-variant` | `#E2E0D9` |
| `--accent` | `#c8f232` (fills) |
| `--accent-ink` | `#3d4d00` |
| `--accent-hover` | `#add500` |
| `--accent-tint` | `#5B8A00` (dots, rings, bars — legible on white) |
| `--accent-fg` | `#1F3D2E` (accent text/icons on light surfaces — never raw lime on white) |
| `--accent-soft` | `rgb(200 242 50 / 0.35)` |
| `--info` | `#2F5BD3` |
| `--danger` | `#D92D20` |
| `--danger-container` | `#FDE7E4` |
| `--on-danger-container` | `#7A1A12` |
| `--warning` | `#B7791F` |
| `--success` | `#15803D` |

Light mode uses a subtle card shadow `0 1px 2px rgb(0 0 0 / 0.04)`. Stitch dark cards declare `shadow-md/xl`, which are invisible on the dark canvas; implement them as `0 4px 6px -1px rgb(0 0 0 / .1)` (cards) and `0 20px 25px -5px rgb(0 0 0 / .1)` (radar / drawer), static.

### 1.3 Semantic score colours
Match chip / ring (from Stitch): `≥ 90 → --accent` text on `--accent-soft`; `75–89 → --info` text on `rgb(176 198 255 / .15)`. **Below 75 is not shown in Stitch** — extension: `65–74 → --warning`, `< 65 → --danger`. Scam-blocked jobs show `0% BLOCKED` in `--danger` on `--danger-container/30`.
Ring caption: `≥ 95 BEST FIT`, `≥ 90 HIGH FIT`, `≥ 75 GOOD FIT` (thresholds inferred from the three examples 96/91/88; `< 75` → `FIT`).
Deadline (Programs, from Stitch): `≤ 14 days → --danger`, `≤ 35 → --accent-tint`, else `--muted`. Raw Tailwind `yellow-*`/`amber-*` in the Tracker/Watched mocks → `--warning`; `cyan-*` → `--info`.

### 1.4 Typography — Inter + JetBrains Mono only (Archivo Black / Inter Tight are **removed**)
Load with `next/font` (display: swap): Inter 400/500/600/700, JetBrains Mono 400/500/600.

| Token | Font | Size / line / weight / tracking | Use |
|---|---|---|---|
| `display-hero` | Inter | 48 / 52 / 600 / -0.03em | KPI numerals |
| `display-hero-mobile` | Inter | 32 / 36 / 600 / -0.025em | KPI numerals < 768 |
| `headline-lg` | Inter | 30 / 36 / 600 / -0.02em | drawer job title |
| `headline-lg-mobile` | Inter | 24 / 28 / 600 / -0.02em | |
| `headline-md` | Inter | 20 / 26 / 600 / -0.02em | job card title, login wordmark (`tracking-wider`) |
| `headline-sm` | Inter | 16 / 22 / 600 / -0.015em | sidebar wordmark, section headings, company name, primary button label, tab labels |
| `body-lg` | Inter | 15 / 22 / 400 / -0.005em | dashboard job title (600) |
| `body-base` | Inter | 14 / 20 / 400 / -0.005em | nav items, body |
| `body-sm` | Inter | 13 / 18 / 400 / 0 | small body, buttons, JD text |
| `mono-metric` | JetBrains Mono | 14 / 16 / 500 / -0.01em | counters, logo-tile letters |
| `mono-label` | JetBrains Mono | 11 / 14 / 500 / 0.08em, UPPERCASE | section labels, company in card, form labels |
| `mono-micro` | JetBrains Mono | 10 / 12 / 500 / 0.1em | chips, timestamps, badges, status pills, kbd |

Tiny readouts in Stitch use 9px mono (radar degree labels, source marquee, notification count) — allowed only for those. All numbers `tabular-nums`.

### 1.5 Spacing, radius, size
- Spacing scale (Stitch): `space-xs 4`, `space-sm 8`, `space-md 16`, `space-lg 24`, `space-xl 32`; `gutter 16` (mobile) / `24` (desktop); page margin 16 mobile / 24 tablet / 40 desktop token — **the three mocks render a 24px main padding at 1280**, use 24px at ≥768 until a wider mock exists.
- **Radius (rendered, from the Stitch Tailwind config — `rounded-*` is remapped):** `--r-sm 2px` (Tailwind `DEFAULT`: logo letters, kbd, small tags, avatar tiles), `--r-md 4px` (`lg`: buttons, inputs, nav items, chips, cards' inner rows), `--r-lg 8px` (`xl`: cards, drawer, filter hub, login card, logo tiles), `--r-pill 12px` (`full`: pills, status chips). Avatars, status dots, the radar scope and rings are **true circles (50%)** — Stitch's `rounded-full` renders 12px, which makes the radar scope look like a rounded square in the PNG; build the circle (see §10).
- Hairlines: Stitch uses **no borders** on cards. Selected feed card: `ring-1 ring-accent/40` + 6px left accent bar. Focus: `2px` `--accent-tint` outline, 2px offset. Input focus: bg → `--surface-2`.
- Layout: sidebar **248px** (collapsed 68px), topbar **64px**, drawer **520px**, KPI/grid gap 24px (`space-lg`), card padding 16px (`space-md`), radar card padding 24px. Wide-desktop max container 1680px.
- Icons: **Material Symbols Outlined** (Stitch), 18px in nav, 14–15px in chips/buttons, 16–20px in headers. Name map: radar, dynamic_feed, school, domain, view_kanban, tune, search, notifications, send, dark_mode, light_mode, verified, check_circle, shield, gpp_bad, warning, report, bookmark_border, close, north_east / arrow_outward / open_in_new, arrow_forward, content_copy, task_alt, timer, bolt, notifications_active, share, dock_to_right, smart_toy, schedule, refresh, sort, expand_more, visibility(_off). (Material names are the design reference; the build maps each to a lucide-react icon — see §10.4.)

### 1.6 Background texture
Stitch: a faint canvas dot-grid inside the **dashboard radar card only** — `radial-gradient(#fff 1px, transparent 1px)`, `24px` spacing, `opacity .03`. No grid/dots on the login page or elsewhere (the login page is a flat `--bg` with a centered card). Light mode uses `#000` at `.03`. No noise/blur animation.

---

## 2. App shell (`docs/design/02-dashboard-dark`, `03-job-feed-dark`)

### 2.1 Sidebar (`components/shell/sidebar.tsx`)
Fixed, 248px, `--surface-lowest`, no border. Top → bottom:
1. **Brand row** (64px, padding 24): 32px circular radar-mark image + `SCOUT` (headline-sm, `--text-strong`, tight) over `AI RADAR v2.4` (mono-micro, `--accent-tint`, widest tracking; version from `package.json`).
2. Mono label `DISCOVER` → Dashboard (radar), Job Feed (dynamic_feed), Programs (school).
3. Mono label `PIPELINE` → Watched Companies (domain), Tracker (view_kanban).
4. Spacer, then **Settings** row (tune icon) with an inline **theme toggle** pill on the right (`--surface-2`, 13px `dark_mode` / `light_mode` icons; the active mode icon is `--accent-tint`).
5. **Profile switcher**: `--surface` rounded-lg (8px) container, padding 4, two rows, 20px circular letter avatars (`A`/`N`; active = `--accent` bg + `--accent-ink`; inactive = `--secondary-container #47464a`), label `<Name> (<grad year>)` in body-sm; active row bg `--surface-3` with a 6px `--accent-tint` dot. Click the other row → `POST /api/auth/switch` → router refresh.
6. **Next scan**: `● NEXT SCAN` left, countdown `HH:MM:SS` right (mono-micro, countdown `--text-strong`). *(No progress ring.)*

Nav item: padding 6px 8px, `--r-md`, body-base, icon 18px. Inactive `--muted`; hover `--surface-3` bg + `--text`. **Active:** `--surface-3` bg, `--text-strong` (no left bar). The active background slides between items via `layoutId="nav-active"`.
Collapsed (68px): icons only + tooltips; profile switcher shows the active avatar; next scan shows the dot only.

### 2.2 Topbar (`components/shell/topbar.tsx`)
Fixed, 64px, left offset 248px, `--surface-lowest` at 80% + `backdrop-filter: blur(12px+)`, no border, horizontal padding 24.
- Left: mono-micro `SCOUT RADAR` · `/` · mono-label `INTELLIGENCE CORE` (`--text-strong`). Stitch shows `INTELLIGENCE CORE` on Dashboard, Job Feed, Tracker and Settings; Watched Companies shows `/ PIPELINE / WATCHED COMPANIES` and Programs `/ DISCOVER / PROGRAMS`.
- Center: search field 380px, `--surface`, `--r-md`, magnifier 16px, placeholder `Quick search jobs, companies, tags...`, `⌘K` kbd chip. Click opens the cmdk palette (pages, jobs, companies, programs).
- Right (gap 16): scan-status pill (`--surface`, `--r-sm`, 6px dot `--accent-tint` pulsing + mono-micro `Scanning 14 sources`; idle `Last scan 42m ago`, failed uses `--danger`), Telegram pill (`send` icon `--accent-tint` + `Telegram Active` / `Telegram not linked`), notifications bell 20px with 14px count badge (`--accent-tint` bg, 9px bold), 32px circular avatar with 8px status dot.
- No theme toggle in the topbar (it lives in the sidebar).

### 2.3 Responsive
Stitch provides only 1280px desktop; the rest follows Stitch's `design-system.md` breakpoints.
- ≥1280: full layout; job feed shows the 520px inspector inline.
- 1024–1279: sidebar auto-collapses to 68px; the 12-col dashboard stays 7/5; inspector becomes an overlay sheet.
- 768–1023: sidebar hidden, hamburger in topbar opens it as a left sheet; search collapses to an icon; 8-col layout, margin 24.
- < 768: single column, margin 16; KPI tiles stay 2×2 with `display-hero-mobile`; inspector is a full-screen sheet sliding up; the dual-profile switch is available from the sidebar sheet.

---

## 3. Components

Build in `components/ui/` on top of shadcn primitives, restyled to tokens.

| Component | Spec (from Stitch) |
|---|---|
| **Button / primary** | `--accent` bg, `--accent-ink` text, headline-sm/600, `--r-md`, 36–40px high (login/drawer 40px, feed card 28–30px). Hover → `--accent-hover` + translateY(-2px) (login) ; press `scale .95–.98`; trailing icon 15–18px. |
| **Button / secondary** | `--surface-3` bg, `--text` (or `--muted` → `--text`), body-sm, `--r-md`, padding 4×10; hover → `--surface-4`/`--surface-2`. |
| **Button / danger** | `--danger-container` at 40% bg, `--danger` text, hover 60%. |
| **Segmented control** | track `--surface-lowest`, padding 2, `--r-md`; active segment `--accent` + `--accent-ink` headline-sm with count in mono-micro on `rgb(0 0 0 / .2)`; inactive `--muted`, count on `--surface-2`. Same shape for the drawer tabs but the active segment is `--surface-3` + `--text-strong`. |
| **Filter chip** | `--surface-3`, mono-micro, `--r-md`, padding 4×8, leading 14px `check_circle` (or `shield` / 8px dot) in `--accent`; hover `--surface-bright`; `Reset` is `--surface-2`, `--muted`, right-aligned. |
| **Tag (meta)** | `--surface-3`, `--muted`, mono-micro, `--r-sm`, padding 2×8 — tech tags and location. Location in feed cards is plain mono text after `·`. |
| **Fresh badge** | `--accent` at 15% bg, `--accent-hover` text, mono-micro UPPERCASE `FRESH · 2H`, `--r-sm`. |
| **ATS badge** | `--surface-2`, `--text`, mono-micro UPPERCASE `GREENHOUSE ATS`. |
| **Scam badge** | `--danger-container` bg, `--on-danger-container`, mono-micro bold UPPERCASE `SCAM / PLACEMENT FEE RISK` with `warning` 12px; reasons in an inset `--surface-lowest` box with `report` icon and `--danger` mono text. |
| **Eligible chip** | `✓ 2026 eligible`: `--accent-soft` bg, `--accent` text, mono-micro, pill. |
| **Match chip** | `96% MATCH`: mono-label bold + mono-micro, `--r-md`, padding 4×10, colours per §1.3. |
| **Match ring** | SVG 56px (cards), 36px (drawer summary), `--surface-3` track, arc per §1.3, centered number headline-sm; caption below (§1.3). Animates (§5). |
| **Progress bar** | track `--surface-3` (or `--surface-2` in drawer), height 4px (KPI) / 6px (deadlines, breakdown), fill `--accent`, `--info` or `--danger`, rounded. |
| **Card** | `--surface`, `--r-lg`, padding 16 (24 for radar), no border, static shadow. Interactive card hover: bg → `--surface-2` (120ms). Inner rows: `--surface-2`, `--r-md`, padding 12; hover `--surface-3`. |
| **Company logo tile** | 48px (feed) / 40px (dashboard) / 32px (lists), `--surface-4` (`--surface-3` on dashboard), `--r-lg`, monogram/initials in headline-sm or mono-metric bold `--text-strong`. Selected/drawer variant: `--accent` bg + `--accent-ink`. Scam variant: `--danger-container/40` + `gpp_bad` icon. Real logo image optional with monogram fallback. |
| **Kbd** | mono-micro, `--surface-3`, `--r-sm`. |
| **Skeleton** | `--surface-2` blocks, one transform-only shimmer sweep. |
| **Toast** | sonner, `--surface`, bottom-right. |
| **Empty state** | static radar-mark glyph, headline-sm, one `--muted` line, one action. |
| **Page header** | Eyebrow row (6–8px `--accent`/`--accent-tint` dot + mono-micro UPPERCASE `--muted`, widest tracking) · H1 headline-lg (bold, tight) · body-base `--muted` sub (max 672px); actions right, aligned to the baseline. Used by Watched, Tracker, Programs; Settings uses a breadcrumb line instead of the eyebrow. |
| **Stat tile** | `--surface`, `--r-lg`, padding 14–16; mono-micro UPPERCASE label, numeral (`headline-lg` bold, or `display-hero` on Dashboard), mono-micro caption; optional 4px bar. |
| **Switch** | 36×20px pill, padding 2, `--r-pill`; on: `--accent` track + `--accent-ink` 16px knob translated 16px; off: `--surface-4` track + `--muted` knob. `aria-label` required. |
| **Module card** | `--surface`, `--r-lg`, padding 24, gap 24: eyebrow `MODULE NN / TITLE` (mono-label, `MODULE NN` in `--accent`), headline-md title, body-base `--secondary` description, status chip right. Used in Settings. |
| **Status pill** | `--surface`, `--r-sm`, 6px dot + mono-micro (scan status, Telegram, Stream: Live). |

---

## 4. Screens

### 4.1 Login (`/login`) — ref `01-sign-in-dark`
Flat `--bg`, no texture. One centered card: `max-width 448px`, `--surface`, `--r-lg`, padding 32.
1. Brand row, centered: 28px radar mark · `SCOUT` (headline-md, `tracking-wider`, `--text-strong`) · version badge (mono-micro on `--accent`/20, `--accent-hover` text, UPPERCASE).
2. Tagline (mono-label, `--secondary`, uppercase, centered, max 320px): `AUTONOMOUS AI JOB & INTERNSHIP RADAR`.
3. Row: mono-label `SELECT PROFILE` left; mono-micro `● Dual Node Active` right.
4. Two profile tiles (2-col grid, gap 8): `--r-md`, tile padding 8, `--surface-2` (selected `--surface-3`), corner gradient quarter-circle (`--accent`/10 → transparent, 48px top-right), 32px avatar (initials on `--surface-4`, or uploaded image grayscale), name (headline-sm), `Batch 'YY` (mono-micro `--secondary`), focus line (body-sm `--secondary`), status line: `● 2h ago` (inactive) or `● Active · N alerts` (`--accent`). **Selected tile:** `--surface-3` + 2px bottom bar `--accent`. Default = last used (cookie `scout_last_profile`).
5. Label row: mono-label `WORKSPACE KEY` (left). Input: 36px, `--surface-lowest`, `--r-md`, mono-label text, visibility toggle 16px right.
6. Primary button `Launch Radar →`, full width, 40px.
7. Footer row: `smart_toy` + `@<bot username>` left; `schedule` + `Scan in HH:MM:SS` right (mono-micro, `--secondary`).
8. Source marquee (9px mono, uppercase, widest tracking, `--muted`/70): `GREENHOUSE · LEVER · ASHBY · WORKDAY · …` from enabled sources, CSS marquee.
Error: input shake (x 0,−6,6,−4,4,0 over 300ms) + `--danger` caption. Enter submits.

### 4.2 Dashboard (`/dashboard`) — ref `02-dashboard-dark`
Main padding 24, vertical gap 24. No greeting/H1 hero (Stitch has none).
**Hero row — 12-col grid, 7 / 5:**
- **Radar card** (cols 1–7, `--surface`, `--r-lg`, padding 24, dot-grid §1.6): top bar = pulsing 8px `--accent` dot + mono-micro `TARGET RADAR CORE` `/` `SECTOR: <regions>`; right pill `● LIVE TELEMETRY` (`--surface-2`, `--accent-tint`, bold). Center: **radar scope** 340px (§5.3). Bottom strip: chip `CENTER FREQ: 3H · 14 SOURCES ACTIVE` (`--surface-2`, value in `--accent`) and counters `1,420 SCANNED TODAY / 42 MATCHES PASSED CRITERIA` (mono-metric semibold, value `--text-strong` / `--accent`).
- **Right column** (cols 8–12): 2×2 KPI grid (gap 16) + Telegram card.
  - KPI tile (`--surface`, `--r-lg`, padding 16, hover `--surface-2`): mono-label title (top-left) + slot top-right; `display-hero` numeral (zero-padded 2 digits) left with mono-micro caption right; 4px progress bar at the bottom.
    1. `NEW MATCHES` — delta chip `↗ +6 since 09:00` (`--accent`/10); numeral `18`; caption = active profile name; bar `--accent`.
    2. `FRESH < 24H` — pulsing dot; numeral `09` in `--accent`; caption `PRIORITY RADAR` (`--accent-tint`); bar `--accent-tint`.
    3. `APPLIED (WEEK)` — numeral `07`; bar `--info`. *(Stitch also shows `GOAL: 10/WK` / `70% target` — not built, §9.)*
    4. `INTERVIEWS ACTIVE` — `verified` icon `--accent`; numeral `03`; overlapped 16px company-initial dots; caption `Razorpay · CRED · Stripe` (companies in Interview stage).
  - **Telegram dispatch card** (`--surface`, padding 16): 36px `send` tile, mono-micro `TELEGRAM DISPATCH CHANNEL` (`--accent`) + `14M AGO`, one-line body-sm of the latest alert sent, `OPEN ↗` button (secondary).
**Status marquee** (full width, `--surface-lowest`, `--r-md`, padding 8×16, mono-micro uppercase widest): `● RADAR STATUS: NOMINAL /// 14 SOURCES SCANNED /// TELEGRAM DISPATCH VERIFIED /// ELIGIBILITY FILTER: <batch years> ACTIVE /// NO SCAM DETECTED IN LAST RUN (<time> UTC)`. Items driven by real `source_runs`/alert state; `///` separators in `--surface-4`. (`LATENCY: 142MS` is not built.)
**Workbench — 12-col, 7 / 5:**
- Left (7): header bar (`--surface`, `--r-md`, padding 8×16): `bolt` icon + headline-sm `Top Matches (Scored for <Name>)`, right `SORT BY: MATCH % DESC`. Then **4 job cards** (`--surface`, `--r-lg`, padding 16, gap 16): 40px logo tile; headline-sm company + location pill + eligible chip; body-lg/600 role; right: match chip + `POSTED 2H AGO` (`--accent-tint` if fresh, else `--muted`); footer: `MISSING:` + tag (`None — Exact Match` in `--accent-tint` when none), actions `Inspect Fit` (secondary) and `Apply ↗` (primary; secondary `View Source ↗` when the match is < 90). Click → `/jobs?job=<id>`.
- Right (5, gap 24): **Watched Company Alerts** card (`notifications_active` icon, `N DETECTED TODAY`; rows on `--surface-2`: 32px tile, company (body-base 600) + badge `+2 NEW ROLES` (`--accent`/15) or `DIFF DETECTED` (`--info`), role line mono-micro, time right; footer `MANAGE N WATCHED DOMAINS ⚙` secondary full-width → /watched). **Upcoming Deadlines** card (`timer` icon, `GLOBAL COHORTS` → `PROGRAMS`; rows on `--surface-2` with 8px status dot, name 600, days-left chip (`--danger-container` when urgent, else `--surface-3`), description mono-micro, 6px progress bar (time elapsed)).

### 4.3 Job Feed (`/jobs`) — ref `03-job-feed-dark`
Telemetry strip (mono-micro, above content): `● STREAM: LIVE` pill (`--surface-3`, pinging dot) · `Batch Target: <grad year> (<profile>)` · `Sources Scraped: 14/14 OK`. (Right-side `AUTO-REFRESH` and `Radar Weights` are not built, §9.)
**Split layout** (gap 24): left column `flex-1`, right **520px inspector** sticky `top-16`, `height calc(100vh - 5rem)`.
- **Sticky filter hub** (`--surface`/95 + blur, `--r-lg`, padding 16, shadow): row 1 — segmented `All 142 | Internship 48 | Full-time 94`; search input (`Filter company, keywords, stack...`, `--surface-lowest`, `--r-md`) and sort dropdown (`Match (High → Low)` / Newest). Row 2 — chips `Remote Only`, `India Hubs`, `Fresh < 24h`, `Eligible Only (Batch <year>)`, `Hide Scam Risk` (the last two default on) and `Reset`. State lives in URL params.
- Counter line: mono-micro `DISPLAYING N PRIORITY TELEMETRY DISPATCHES` left, `1 Active In Right Inspector` (`--accent`) right.
- **Job card** (`--surface`, `--r-lg`, padding 16, hover `--surface-2`): 48px logo tile (initials); top line: mono-label bold company · location (mono-micro `--muted`) · Fresh badge · ATS badge; headline-md title (truncate); meta row: `✓ Open to <year> Batch Graduates` (`--accent-hover`, `verified`), `MISSING: …` (`check` `--accent` when none; `warning` + `--danger` when skills missing — max 4, F5), salary/CTC text only when the job record has it; right: 56px match ring + caption. Footer bar (`--surface-2`/50, bleeds to card edges, `--r-lg` bottom): tech tags left; `Save`, `Skip`, `Apply ↗` right (Apply = primary 15px icon; non-selected cards show `Save` + `Inspect →` in `--surface-4`). **Selected card:** `ring-1 --accent/40` + 6px left bar `--accent`. **Scam card:** gradient bg `--danger-container/20 → --surface`, scam logo tile, struck-through title at 75% opacity, reasons box, `0% BLOCKED` circle, footer with `Mute employer` (danger button). Shown only when *Hide Scam Risk* is off.
- Infinite scroll by 30, virtualized > 60. Filter changes animate with `layout` + `AnimatePresence`.
**Inspector drawer** (`--surface`, `--r-lg`, `overflow-hidden`, shadow-2xl):
- Header (padding 24, `--surface-2`/80): 48px logo tile (`--accent` + `--accent-ink`), mono-label `<COMPANY>` + 6px dot + `FOUND 2H AGO` (`--accent-hover`), headline-lg role, body-sm team line; share + dock icons top-right. Below: **match summary bar** (`--surface-lowest`, `--r-md`, padding 8): 36px ring, `PRIME MATCH CONFIRMED` (`--accent`) + `Profile aligned with <Name> (<year> <degree>)`, location tag right. Then tab segmented control: **Overview · Tailor Resume · Referrals (count badge)**.
- Body (scroll, padding 24, gap 24):
  - **Overview:** `AI MATCH TELEMETRY VECTOR` panel (`--surface-lowest`, `--r-lg`, padding 16) with bars — Skills Compatibility / Batch Eligibility / Signal Freshness / Location Alignment (mono-micro label + % right; bar 6px; ≥ 90% `--accent`, else `--secondary`). Per PRD C3 the three scored components are Skills, Eligibility, Freshness; Location is shown only if available. Then `REQUIRED TECHNICAL STACK` chips (`--surface-2`, `--text-strong`, mono-micro, `--r-md`), the **Eligibility Check** list (F3) and **Missing skills** (F5) in the same panel style, then `ROLE OVERVIEW & RESPONSIBILITIES` (`--surface-lowest`, body-sm, bullets in `--muted`; rendered as plain text — never raw HTML).
  - **Tailor Resume:** `AI RESUME ALIGNMENT` header; 3 bullet cards (`--surface-lowest`, mono-micro `TARGET: …` in `--accent`, italic body-sm, `Copy` button `--surface-2`); `ONE-CLICK OUTREACH COVER NOTE` → rendered as **cover note** with `Copy Draft` (copy only; no sending). Empty state shows the `Generate with AI` primary button; `Regenerate` after generation (F8).
  - **Referrals:** `Find referrals` — three LinkedIn **search links** (people at company in the role/team, company employees, college alumni) as secondary link rows with `↗` (F9). Stitch's named-people cards and `12 alumni found` counts are not built (§9).
- Sticky footer (`--surface-3`/90 + blur, padding 16): primary `Apply ↗` (label `Direct <ATS> Apply ↗` when the ATS is known) + secondary `Applied` (`task_alt`) → marks applied; below: `● Sync alert to Telegram` (resend this job's alert) left, parse-time caption right (optional).
- URL-driven (`?job=<id>`), Esc closes, focus trapped on overlay variants, ←/→ previous/next job.

### 4.4 Watched Companies (`/watched`) — ref `04-watched-dark`
Topbar breadcrumb: `SCOUT RADAR / PIPELINE / WATCHED COMPANIES`. Page container max 1560px, vertical gap 24.
**Page header** (§3 *Page header*): eyebrow `● CONTINUOUS CRAWLER ORCHESTRATION`; H1 `Watched Companies` (headline-lg, bold); sub `We check these careers pages every hour for stealth drops, phantom postings, and diff spikes.` Right (580px): **add-company bar** — `--surface` card, `--r-lg`, padding 6: `add_link` icon 18px + borderless input `Paste a careers page URL...` + primary button `radar` icon + `Add Company`; caption row (mono-micro, `--muted`): `AUTO-DETECTS GREENHOUSE · LEVER · ASHBY · WORKDAY`. While detecting, the existing mono step line (`Fetching… → Detecting ATS… → Found greenhouse · 3 roles`) replaces the caption — Stitch has no mock for this state.
**Stat tiles** (4-up, gap 12; `--surface`, `--r-lg`, padding 14; mono-micro label, `headline-lg` bold numeral + mono-micro caption): `TARGETS ACTIVE 07`, `AGGREGATED OPENINGS 18 · +6 TODAY` (caption `--accent`), `CYCLE CADENCE 60m`, `NEXT DIFF PASS 18m 24s` (numeral `--accent`). Captions `100% HEALTH`, `JITTER RESISTANT`, `DISPATCH T-0` are not built (§9).
**Companies card** (`--surface`, `--r-lg`, overflow hidden):
- **Summary strip** (`--surface-2`, padding 14×20): pulsing 8px `--accent` dot + mono-label `7 MONITORED DOMAINS · 18 TOTAL OPENINGS DETECTED · NEXT HOURLY DIFF CYCLE IN 18M`. (Stitch also has `FILTER ENGINE` and `FORCE SCAN ALL` buttons here — not built, §9.)
- **Company row** (padding 16×20, bg `--surface`, hover `--surface-2`/60, no dividers): 44px logo tile (`--surface-3`, `--r-md`, mono-metric bold monogram, `--text-strong`; a muted monogram when the company has no openings), name (headline-sm bold) over mono-micro UPPERCASE `GREENHOUSE ATS` (Stitch continues `· TARGET: INDIA / REMOTE` — not built, §9). Right cluster (gap 20): **count pill** — `3 OPEN ROLES` (`--accent` fill, `--accent-ink`, mono-label bold, with a dot) / `2 OPEN ROLES` & `1 OPEN ROLE` (`--surface-3`, `--text`) / `NO OPENINGS` (`--surface-3`, `--muted`); **diff pill** — `+2 NEW` (`--accent`/10, `--accent`) / `NO CHANGE` (`--surface-3`, `--muted`); `⏲ LAST CHECKED 12M AGO` (mono-label, `--muted`); `ALERTS` label + **Instant alerts switch** (§3 Switch); chevron button (`keyboard_arrow_up` when expanded, `down` when collapsed) and `more_vert` overflow (Open careers page, Remove).
- **Expanded roles panel** (inside the row, padding 4×20×20): `--surface-2`, `--r-lg`, padding 14, gap 10. Header mono-micro `CURRENT ACTIVE ROLES PARSED FROM CAREERS STREAM` (right-hand `AI SCORE: 98% RELEVANCE` is not built, §9). Role rows (`--surface`, hover `--surface-3`, `--r-lg`, padding 12): title (headline-sm, 500) + `NEW DROP` badge (`--accent`/15, `--accent`, mono-micro bold) for roles new since the last check; meta line (mono-micro `--muted`): `location_on` location · `history` `Posted 2h ago` · skill keywords; right: `Track` (secondary, `bookmark` icon → adds the job to the tracker as *Saved*) and `Apply ↗` (primary, small).
- **Pending state** (Vercel): a pulsing 6px `--info` dot next to the name; pill `WAITING FOR NEXT SCAN` (`--surface-3`, `--info`, pulsing dot + text), pill `PENDING DIFF`, `⏳ SCHEDULED IN 08M` (`--info`, semibold); the switch stays on. Custom/unknown ATS is shown as `WORKDAY / CUSTOM ATS`.
- Error state (`Couldn't read this page` in `--danger` + retry) is from `PRD.md` C5; Stitch has no mock for it.
- Footer strip (`DOM MONITOR ENGINE ACTIVE · HEADLESS PUPPETEER WORKER POOL…`) and the bottom row (`Latest Diff Inferences`, `Telemetry Health`) are **not built** (§9).

### 4.5 Tracker (`/tracker`) — ref `05-tracker-dark`
Topbar breadcrumb `SCOUT RADAR / INTELLIGENCE CORE`.
**Page header** (bottom 1px `--surface-3` rule, padding-bottom 24): eyebrow `● PIPELINE TELEMETRY ENGINE` (Stitch's eyebrow continues `• SYNCHRONIZED WITH TELEGRAM & EMAIL PARSER`; email parsing is not in PRD, so only the first part is shown); H1 `Application Tracker`; sub `Autonomous pipeline telemetry & interview lifecycle tracking. Dual-agent synchronization across verified institutional conduits.` Right: primary `+ Add Application` (add icon, headline-sm→body-base, `--r-md`, padding 8×16). The two stat chips (`CONVERSION RATE 16.7%`, `ACTIVE PIPELINE 18 Opportunities`) are not built (§9).
**No toolbar.** Stitch's `Kanban | Table` toggle, `Active Cohort`, `Target` and `Priority Radar Only` filters, sort and refresh are not built (§9.2): the Kanban board is the only view and the board follows the header directly.
**Board:** horizontal scroll container, `grid-cols-6`, gap 14, min-width 1480px (220px+ columns), bottom padding 32. **Column:** `--surface-lowest`/60, `--r-lg`, padding 10, **1px `--surface-3` border** (this screen keeps hairlines; Stitch's only use of borders on cards). Header: 8px stage dot + mono-label semibold uppercase name, count badge right (mono-micro, `--surface-3`; OA = `--warning` tint; Interview & Offer = `--accent` fill + ink). Stage dots: Saved `--secondary`, Applied `--info`, OA `--warning`, Interview `--accent-tint`, Offer `--accent`, Rejected `--danger`/70.
Columns (PRD F7), in this order: **Saved · Applied · OA · Interview · Offer · Rejected** (the OA column header reads `OA Testing` in Stitch; the stage name is `OA`). The sixth column is **Rejected**, replacing Stitch's `Archived`; it keeps Stitch's dimmed styling (opacity 60%, grayscale cards, full colour on hover).
**Card** (`--surface`, `--r-md`, padding 12, 1px `--surface-3` border, hover border `--surface-variant #353437`, cursor pointer; gap 10): row 1 — 24px logo tile + company (body-sm 600) left, mono-micro date `OCT 11` right; row 2 — role (body-sm 500, → `--text-strong` on hover); row 3 — chips (mono-micro, padding 2×8, `--r-sm`): neutral `--surface-3`; **next-action chip** per F7: `Follow up · Oct 14` (`--warning` tint + 1px warning/30 border + dot), `Interview · Oct 15` (`--accent`/10 + accent border, `event` icon), `Offer`/deadline in `--danger` tint; **urgent** `OA DUE · OCT 13 (22:00)` bar (`--danger-container`/30, 1px danger/40 border, `crisis_alert` icon pulsing, `URGENT` 9px right) and soon `OA DUE · OCT 14` (`--warning` tint, `schedule` icon); footer (top hairline `--surface-2`): location / match `Match: 94%` (`--accent-tint`) left, `arrow_outward` (→ opens the job) or a stage icon right. Cards with an imminent action get a 1px `--warning`/40 border and `shadow-sm`; the Offer card a `--accent`/60 border and `shadow-lg`. **Logo tiles are neutral monograms** (`--surface-3` bg, `--text-strong` mono 10px bold initials, `--r-sm`): no per-brand hex colours and no emoji (Stitch uses both; they are not built, §10).
**Drag state:** the dragged card is `--surface-3`, `border-2 --accent`, `ring-4 --accent/10`, rotate 2°, scale 1.03, static `shadow-2xl`, `cursor: grabbing`, with a `MOVING` chip (`--accent` fill) top-right; the stage's drop slot is a 112px dashed `--surface-3` box (`--surface`/40) labelled `DROP TARGET IN STAGE` (mono-micro uppercase). Counts tick on drop.
Card click opens the edit popover (stage, dates, next action, delete — PRD F7). Stitch card extras not built: `Candidate: …`/`Dragging` text, `Launch Prep`, `Review Contract`, `Stage 2 of 3`, referral/`Application viewed` status chips, salary/CTC chips, inline notes, `via Neha`/`Aarav pool` provenance (§9).
**Footer strip** (`SCOUT Ingestion Pipeline Status … Greenhouse API: OK`) is not built (§9).

### 4.6 Programs (`/programs`) — ref `06-programs-dark`
Topbar breadcrumb `SCOUT RADAR / DISCOVER / PROGRAMS`.
**Page header:** eyebrow `● OPPORTUNITY SURVEILLANCE MATRIX`; H1 `Programs & Opportunities`; sub `Global fellowships, open source mentorships, off-campus hiring drives and elite hackathons with verified batch eligibility.` Right: primary `Add Program` (add icon, headline-sm; opens a small modal: name, category, url, deadline — PRD F10). Stitch's `Filter Batches` button is not built (§9.3).
**No KPI row** (Stitch's four tiles are not built, §9.3). The tabs follow the page header directly.
**Tabs:** segmented control (`--surface-lowest`, padding 4, `--r-lg`): `ALL (8) ●` · `GSOC (1)` · `LFX (1)` · `MLH (1)` · `HACKATHONS (3)` · `OFF-CAMPUS (2)` — mono-label, tracking-wider; active `--surface-3` + `--text-strong` with a 6px `--accent-tint` dot after the label (sliding bg via `layoutId`); counts per category. Right-hand `TELEGRAM SYNC: ACTIVE` / `AUTO-SCRAPING HOURLY` captions are not built (§9).
**Table** (`--surface`, `--r-lg`, overflow hidden): header row (`--surface-lowest`, padding 12×24, mono-label uppercase, 12-col grid): `PROGRAM & INITIATIVE` (4) · `DOMAIN / TRACK` (3) · `TIME REMAINING / STATUS` (3) · `DEADLINE & ACTION` (2, right-aligned). Rows: padding 16×24, alternate bg `--surface`/`--surface`/60, hover `--surface-2`, no dividers.
- Program cell: 40px tile (`--surface-3`, mono-metric monogram; urgent rows tint the monogram `--danger`), name (headline-sm 600, truncate; hover → `--accent-tint`) + category tag (mono-micro, `--surface-4`, `--r-sm`: `GLOBAL`, `CNCF`, `GITHUB`, `NATL`, `URGENT` in danger, …) over organizer (body-sm `--muted`).
- Domain/track cell: body-sm line + mono-micro detail line (stipend/prize) — **not in PRD, not built** (§9); the column collapses and the time column widens.
- Time cell: days-left chip (mono-micro semibold) + `85% ELAPSED` (`--muted`) over a 6px bar. Colours: **≤ 14 days** `--danger` (chip `--danger-container`/20 with dot, bar `--danger`); **≤ 35 days** `--accent-tint` text on `--surface-3`, bar `--accent-tint`; **otherwise** `--muted`/`--text` on `--surface-3`, bar `--surface-bright`.
- Deadline cell: date mono-metric 500 `APR 02` + mono-micro time (IST per CLAUDE.md), then the **reminder button** (`--surface-3`, `--r-md`, padding 4×12, body-sm 500): off = `notifications_none` + `Set reminder` (`--muted`); on = filled `notifications` + `Reminder on` (`--accent-tint`). Turning it on creates Telegram reminders **7 days and 1 day before the deadline** (PRD F10; `program_reminders.sent_7d_at` / `sent_1d_at`). Stitch's "<72 hours emergency dispatch" copy is not built.
- **No table footer strip and no bottom cards** (`Batch Compliance Engine`, `Application Roadmap`, `Radar Dispatch Discipline`; `ICS` export): not built (§9.3). The table is the last element on the page.

### 4.7 Settings (`/settings/[section]`) — ref `07-settings-dark`
Topbar breadcrumb `SCOUT RADAR / INTELLIGENCE CORE`. **Page header:** breadcrumb line `SCOUT RADAR / SYSTEM / SETTINGS` (mono-micro, last segment `--accent`), H1 `Settings & System Telemetry`, sub `Candidate intelligence models, document parsing vectors, and autonomous alert routing protocols.` The right-hand `ACTIVE SUBSYSTEM | CORE-V2.4 / RADAR-DISPATCH` badge is not built (§9).
**Scope:** exactly five sections — Profile, Resume, Preferences, Telegram, Scan Settings. Nothing else from Stitch's Settings screen is built (§9.4).
**Layout:** 12-col grid, gap 24: left sub-nav (3 cols), content (9 cols).
- **Sub-nav card** (`--surface`, `--r-lg`, padding 12, gap 4; header mono-micro `NAVIGATION PROTOCOL`): items padding 10×12, `--r-md`, body-base, leading 18px icon: `Profile & Identities` (badge icon, trailing 6px dot), **`Resume Intelligence`** (psychology; **active:** `--surface-3`, `--text-strong`, semibold, 4px left bar `--accent`, accent icon, mono-micro `ACTIVE`), `Match Preferences` (tune), `Telegram Dispatch` (cell_tower, trailing badge `UNPAIRED` — `--danger-container`, `--danger`, 9px bold; absent when linked), `Scan & Frequencies` (sync_alt, trailing mono-micro `3H CYCLE`). Routes: profile · resume · preferences · telegram · scan. The nav has these five items only (**no `API & Webhooks`**) and no `EMBEDDING MODEL` card below it (§9.4). Item labels follow Stitch (`Profile & Identities`, `Resume Intelligence`, `Match Preferences`, `Telegram Dispatch`, `Scan & Frequencies`).
- **Section card** (§3 *Module card*: `--surface`, `--r-lg`, padding 24, gap 24): eyebrow `MODULE 01 / DOCUMENT VECTORIZER` (mono-label; `MODULE 01` in `--accent`), H2 (headline-md), body-base `--secondary` description, status chip right.
**Resume Intelligence (`/settings/resume`)** — module 01, H2 `Autonomous Resume Parsing Engine`, `Scout extracts semantic capability vectors to score ATS listings against your live profile.` (the `MODEL: SBERT-TITAN` chip is not built, §9).
- **Dropzone:** padding 32, `--surface-2`, `--r-lg`, no dashed border; hover `--surface-3`; centered 48px `--surface-4` tile with `upload_file` (`--accent`, scale 1.05 on hover); `Click to upload or drag and drop` (headline-sm → `--accent` on hover); `PDF, DOC, DOCX (Max 5MB)` (body-sm `--muted`). Stitch appends `· Encrypted at rest via AES-256` and an `OCR EXTRACTION · TOKENIZATION · SEMANTIC EMBEDDING` line — not built (§9). Hidden file input covers the zone.
- **Current file row:** `--surface-3`, `--r-lg`, padding 16: 40px `--surface-4` `description` tile, file name (headline-sm) + `ACTIVE` chip (`--surface-2`, `--accent`, 10px), mono-micro `Uploaded Oct 8, 2025 · 1.4 MB` (the `· 98.4% ATS Parse Confidence` suffix is not built); buttons: primary `Replace File` (cloud_sync). `Inspect Nodes` is not built (§9).
- **Parsing state:** progress → `Parsing with AI…` skeleton → parsed summary (no Stitch mock for these transitions).
- **Parsed skills:** heading `Parsed Skills (N Detected)` (headline-sm; Stitch wording `Parsed Skill Vectors`), helper `Click '×' to remove or add target skills.`; chips (`--surface-2`, hover `--surface-3`, `--r-md`, padding 6×12): mono-label skill name + `close` 14px (hover `--danger`) — the per-skill `0.98` confidence value and the `RE-SYNC TO VECTOR DB` link are not built (§9); dashed-free `+ Add skill` chip (`--surface-3`, `--muted`, hover `--accent`).
**Telegram (`/settings/telegram`)** — module 02, eyebrow `MODULE 02 / TELEMETRY ROUTING`, H2 `Telegram Instant Alert Conduit`; status chip right: not linked `NOT CONNECTED` (`--danger-container`/30, `--danger`, pill, pinging dot, mono-label bold) / linked `CONNECTED` (`--accent`).
- Body panel (`--surface-2`, `--r-lg`, padding 24, 12-col grid 5/7): left tile (`--surface-3`, padding 24, centered) with 192px QR on `--surface-lowest` (`--r-lg`, padding 12) and caption `SCAN VIA TELEGRAM MOBILE APP`. Right: numbered steps (24px `--surface-4` circles `01`/`02`, body-base): `Open Telegram on your mobile device and scan the radar key matrix, or invoke direct authorization below.` / `Authorize the SCOUT Dispatch bot to stream verified postings and daily diff logs.` with a mono-micro strip (`--surface-lowest`, padding 10): `BOT: @<bot>` · `PAIRING KEY: <key>` (`--accent`). Then `● SESSION TOKEN EXPIRES IN 14:32` (15-minute countdown, mono-micro) with `Regenerate Key` (↻, `--secondary`) right; actions: primary `Open in Telegram ↗` (headline-sm, 20×10) and `Send Test Ping` (`--surface-4`, `send` icon, disabled at 50% until linked). Linked state shows chat name, `Send Test Ping`, `Unlink` (no Stitch mock).
- The three tiles under the panel (`FILTER THRESHOLD`, `MAX PINGS / DAY`, `QUIET HOURS`) are not built (§9).
**Profile, Preferences, Scan Settings — section content has no Stitch mock** (build from `PRD.md`, styled with the Module card pattern above):
- *Profile:* display name, avatar upload (circular crop preview), college.
- *Match Preferences:* target roles, locations (tag inputs), remote toggle, job types (Internship / Full-time chips), graduation year, degree, max experience years, active backlogs (Yes / No / Prefer not), minimum match score (slider 40–90).
- *Scan & Frequencies:* schedule `Every 3 hours · watched companies hourly`, last 10 runs table, sources list (read-only from env), primary `Scan now` (disabled while running).

---

## 5. Motion system

Library: `motion/react` via `LazyMotion features={domAnimation}` + `m.` components. Loops are pure CSS keyframes. **Stitch's own animations are `spin 6s` (radar beam), `ping`/`pulse` (live dots, deadline dot), a marquee, and 150ms `transition-colors`/`translate-y-0.5`/`scale-95` on buttons** — all consistent with the rules below.

### 5.1 Tokens (`lib/motion.ts`)
```ts
export const ease = { out: [0.22, 1, 0.36, 1], inOut: [0.65, 0, 0.35, 1] } as const;
export const dur = { fast: 0.12, base: 0.2, slow: 0.32, count: 0.9 } as const;
export const spring = {
  drawer: { type: "spring", stiffness: 380, damping: 36, mass: 0.9 },
  snappy: { type: "spring", stiffness: 500, damping: 32 },
} as const;
export const fadeUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: dur.slow, ease: ease.out } } };
export const stagger = (step = 0.04) => ({ show: { transition: { staggerChildren: step } } });
```

### 5.2 Catalogue
| Element | Motion |
|---|---|
| Page enter | content `fadeUp`, children stagger 40ms, **max 8 staggered**, rest appear with the 8th |
| Route change | 150ms opacity crossfade of the main area only (shell never re-animates) |
| KPI numerals | count-up 0 → value over 900ms (`animate()` on a motion value, write text via ref, no re-render per frame), once per mount |
| Match rings | `strokeDashoffset` full → value, 900ms ease.out, delay = stagger index × 40ms |
| Progress / breakdown bars | `scaleX` 0 → value (origin left), 600ms |
| Cards hover | background colour step (`--surface` → `--surface-2`) 120ms — colour swap on hover only, no layout properties |
| Buttons | hover translateY(-2px) (primary, login) / bg step; press `scale .95–.98`; icon nudge 2px |
| Nav active bg / segmented tabs | shared `layoutId`, `spring.snappy` |
| Inspector drawer | inline at ≥1280 (content swaps with a 120ms opacity crossfade on job change); overlay variants: x 100% → 0 with `spring.drawer`, overlay opacity 0 → .4; content fades up after 80ms |
| Filters change | list items use `layout` + `AnimatePresence` (popLayout) — exit fade 120ms, enter fadeUp |
| Watched add row | height via `layout`, new row fades up + accent flash (overlay opacity, 600ms) |
| Kanban | dnd-kit overlay; drop settles with `spring.snappy`; column count ticks with 150ms number fade |
| Theme toggle | active icon crossfade 200ms; colours swap instantly (no animated page-wide colour transitions) |
| Login tiles | selection: bg step + bottom bar; password error shake 300ms |
| Live dots | CSS `pulse` (opacity .4↔1, scale .9↔1.1) 1.6s infinite; `ping` for the radar-card / stream dots |
| Scanning dots | CSS staggered opacity 1.2s infinite |
| Skeleton shimmer | CSS translateX gradient 1.4s infinite |

### 5.3 Signature elements
**Radar scope** (`components/radar/radar.tsx`) — 340px circle on `--surface-lowest`, `overflow: hidden`:
- Concentric discs 280 / 200 / 120 / 40px with tonal fills (`--surface`/40, `--surface-2`/30, `--surface-3`/40, `--accent`/20), crosshair axis lines 1px `--outline-variant`/40, edge readouts `000° N`, `090° E`, `180° S`, `270° W` (9px mono, `--muted`), faint radial vignette at 10% opacity.
- **Beam:** a full-size element rotating `spin 6s linear infinite` containing a quarter-sector gradient (`--accent`/25 → /5 → transparent) and a 1px leading line in `--accent` with a static 8px glow. `will-change: transform` on this element only.
- **Blips:** up to 24 recent matches. Polar position: radius = `(100 − score)/100 × R`, angle = hash(job_id). Size/colour by age: < 4h → 10px `--accent` + glow (pulse), ~12h → 8px `--info`, older → 6px `--secondary`. Hover tooltip `COMPANY · 96%` (`--surface-4`, mono 9px); click opens the inspector.
- Centre: 32px circular `--surface-4` badge with a `radar` icon in `--accent`.
- Paused (`animation-play-state: paused`) when off-screen (IntersectionObserver) or `document.hidden`; static under reduced motion.

**Marquees** (status strip, login sources) — two copies in a flex track, `@keyframes marquee { to { transform: translateX(-50%) } }` 40s linear infinite (login uses the same), edge-faded mask, pause on hover and off-screen, static under reduced motion.

---

## 6. Performance rules (non-negotiable)

1. Animate **only `transform` and `opacity`** (and SVG `strokeDashoffset` for rings). Never animate width/height/top/left/box-shadow/filter. Height changes use Motion `layout`.
2. `backdrop-filter` only on the topbar, filter hub and drawer footer (static, never animated).
3. `will-change` only on the radar beam and elements during an active drag.
4. Continuous loops are CSS and pause when off-screen or `document.hidden`.
5. Count-ups write to the DOM via refs/motion values — no React state per frame.
6. `LazyMotion` + `m` components; never import the full `motion` bundle in client components.
7. Virtualize long lists (> 60). `content-visibility: auto` on below-the-fold sections.
8. Fonts via `next/font`; images via `next/image` with explicit sizes; logos lazy. **No Material Symbols CDN stylesheet** — self-host a subsetted icon font or inline SVGs.
9. Server Components by default; client JS per page < 150KB gz.
10. `prefers-reduced-motion: reduce` → disable loops, stagger and count-ups (show final values), rings/bars at final value; keep 120ms opacity fades only.
11. Targets: Lighthouse Performance ≥ 90 (desktop), CLS < 0.05, INP < 200ms, steady 60fps on dashboard scroll (4× CPU throttle, no long tasks > 50ms while idle).

---

## 7. Accessibility
- WCAG AA in both themes (accent text on light surfaces uses `--accent-fg`; `--accent-ink` on `--accent` fills).
- All interactive elements keyboard reachable; visible focus ring (§1.5).
- Drawer overlays and modals: focus trap, Esc to close, return focus, `aria-modal`. Inline inspector: labelled region, Esc clears selection.
- Rings/bars have `aria-label` ("96 percent match"). Icon-only buttons have labels.
- Kanban: dnd-kit keyboard sensor enabled.
- Colour is never the only signal: scam badge has text, scores show numbers, missing-skill warning has an icon.

## 8. Copy & content rules
- Sentence/Title case for UI text as in the mocks (`Top Matches`, `Inspect Fit`, `Launch Radar`); UPPERCASE only for mono labels/badges.
- Relative times: `3h ago`, `2d ago`, `POSTED 2H AGO` in mono; dates `Oct 15` (IST); countdowns `HH:MM:SS`.
- Numbers: `124 new`, `96%`; KPI numerals zero-padded to 2 digits (`09`).
- No exclamation marks, no emojis. Empty states are one specific line: "No fresh matches yet. Next scan in 58m."
- Demo data in the mocks (Aarav/Neha, Razorpay, ₹ ranges, `@ScoutRadarBot`, `v2.4`) is placeholder — real names, companies, versions and bot usernames come from data/env.

---

## 9. Stitch elements deliberately **not built** (outside `PRD.md` or contradicting it)
| Stitch element | Where | Why / replacement |
|---|---|---|
| `Radar Weights` button | Job Feed strip | Not in PRD (feature freeze) |
| `AUTO-REFRESH ON (30s)` | Job Feed strip | Not in PRD |
| `Mute Employer Forever`, `Reported by 14 campus peers` | scam card | Not in PRD / no peer data; scam card shows reasons only (F4) |
| Named referral people, `Connect`, `12 alumni found` | Referrals tab | F9 is search links only; no scraping or outreach (CLAUDE.md) |
| `One-Click Outreach` wording; addressing a named person | Tailor tab | F8 gives a short cover note with Copy only |
| `Fast Apply` label | Dashboard cards | No auto-apply (CLAUDE.md) — label is `Apply ↗` |
| `GOAL: 10/WK`, `70% target` | KPI 3 | Weekly goals not in PRD |
| `2 Drafts ready`, `Verified Eligible`, `Prerequisites verified` | Deadlines | Not in PRD |
| `LATENCY: 142MS` | status marquee | Not tracked |
| `Encrypted AES-256`, `Multi-tenant Instance` | Login | Inaccurate for a two-profile app; omitted |
| Job Feed Table/Cards toggle (previous spec) and Match/Company/Similar drawer tabs | — | Not in Stitch; removed. Missing skills live in Overview |
| `Dual Node` split-pane radar workbench, user A/B tab bar (designMd) | — | Not in the screens; profile switching is the sidebar switcher (C6) |

### 9.1 Watched Companies (`04-watched-dark`)
| Stitch element | Why not built |
|---|---|
| `FILTER ENGINE` and `FORCE SCAN ALL` buttons | Not in PRD (manual scan lives only in Settings → Scan, C2) |
| `· TARGET: INDIA / REMOTE` per-company target line | No per-company target field in PRD |
| `verified` badge beside a company name ("Target Verified") | Not in PRD |
| `AI SCORE: 98% RELEVANCE` on the roles panel | Not in PRD (per-job match score is shown in the feed, not per company) |
| Stat captions `100% HEALTH`, `JITTER RESISTANT`, `DISPATCH T-0`; `RATE LIMIT: 24 CYCLES / DAY` | Not in PRD / invented figures |
| `DIFF DETECTED` pill without a role count | PRD C5 defines only `+N new` / `No change`; if a role is removed or edited, surface it as `No change` + updated role list unless you approve a third state |
| Footer `DOM MONITOR ENGINE ACTIVE · HEADLESS PUPPETEER WORKER POOL · CACHE LATENCY` | Internal engine telemetry; Puppeteer is not in the stack (ARCHITECTURE.md) |
| **`Latest Diff Inferences`** card (rolling 24h stream with `MATCH: 98%`, `Auto-notified … via Telegram`) | Not in PRD; instant alerts go to Telegram (F2), there is no in-app diff log |
| **`Telemetry Health`** card (`ACTIVE PROXIES`, `AVG CRAWL TIME`, `TELEGRAM NOTIF QUEUE`, `Configure ATS Webhooks`) | Not in PRD; proxies/webhooks are not part of the architecture |

### 9.2 Application Tracker (`05-tracker-dark`)
| Stitch element | Why not built |
|---|---|
| `CONVERSION RATE 16.7%` and `ACTIVE PIPELINE 18 Opportunities` header chips | Not in PRD F7 |
| `Kanban \| Table` view toggle and the whole table view (`Candidate Track`, `Match Telemetry`, …) | PRD F7 specifies a Kanban only |
| `Active Cohort`, `Target: All Roles`, `Priority Radar Only` filters, `SORT: URGENCY DESC`, refresh button | Not in PRD |
| Eyebrow `SYNCHRONIZED WITH TELEGRAM & EMAIL PARSER` | Email parsing is not in PRD; Telegram sync is (F6) |
| Sixth column named `Archived` (`Position Filled`, `Cooling period`, `Reapply: Mar 2025` cards) | **Decided:** the column is `Rejected` (PRD F7), keeping the dimmed style; the sample card content is not built |
| Card extras: `Launch Prep`, `Review Contract`, `Stage 2 of 3`, `Candidate: Aarav` / `Dragging`, `Referral requested/routed`, `Application viewed`, `via Neha` / `Aarav pool`, `Cooling period`, CTC/salary chips, inline notes (`HackerRank (90 min) · …`) | Not in PRD F7 (card = company, role, date, next-action chip) |
| `OFFER RECEIVED · ₹28L CTC` / `Acceptance: Oct 25 (10d left)` | Offer card shows company, role, date and the `Offer · <date>` next-action chip only |
| Footer `SCOUT Ingestion Pipeline Status … Greenhouse API: OK · Lever Sync · Workday Crawler` | Not in PRD; source health is in Settings → Scan |

### 9.3 Programs & Opportunities (`06-programs-dark`)
| Stitch element | Why not built |
|---|---|
| **KPI row** (`ACTIVE PROGRAMS`, `EXPIRING SOON (<14D)`, `REMINDERS SET`, `DIRECT FAST-TRACKS` + captions `100% VERIFIED`, `HIGH URGENCY`, `AUTO-PING ON`, `SES / DSE OFFERS`) | Not in PRD F10 (counts are derivable — add only if you approve) |
| `Filter Batches` button | Not in PRD |
| `DOMAIN / TRACK` column with stipend/prize lines (`Stipend: $1,500 – $3,000 USD`) | Not in PRD F10 row fields (name, organizer, time-elapsed bar, days left, deadline) |
| Captions `TELEGRAM SYNC: ACTIVE`, `AUTO-SCRAPING HOURLY` | Scrape cadence for programs is unspecified in PRD |
| Footer `INDEXED SOURCES…`, `ALL TIMEZONES CONVERTED AUTOMATICALLY`, `EXPORT AS ICS / CALENDAR` | Not in PRD (ICS export is a new feature) |
| **`Batch Compliance Engine`** card (cross-references both profiles' batches) | Not in PRD |
| **`Application Roadmap`** card (`AI proposal drafting assistant`, `14 previously accepted … templates`, `PRE-DRAFT NOW →`) | New AI feature — outside F8/F10 |
| **`Radar Dispatch Discipline`** card (`emergency dispatch when deadline breaches <72 hours … direct PDF application upload commands`) | Contradicts F10 (reminders at 7 days and 1 day) and non-goals (no auto-applying) |
| Row tags `URGENT`, `FLAGSHIP`, `ACADEMY`, `DIRECT` and `Direct Specialist Interview Gate` | Free-text labels; only category (GSoC/LFX/MLH/Hackathons/Off-campus) is modelled |

### 9.4 Settings (`07-settings-dark`)
| Stitch element | Why not built |
|---|---|
| Header badge `ACTIVE SUBSYSTEM | CORE-V2.4 / RADAR-DISPATCH` | Decorative |
| Nav item **`API & Webhooks`** | Not in PRD (Profile, Resume, Preferences, Telegram, Scan Settings only) |
| **`EMBEDDING MODEL` card** (`READY`, `Vector Cache Limit 768 / 1024D`, `LATENCY: 42ms`, `ATS PRECISION: 99.1%`) | Not in PRD; internal model telemetry (also a Gemini-free-tier stack, not "SBERT") |
| `MODEL: SBERT-TITAN` chip | Wrong model — parsing is Gemini (C3, ARCHITECTURE.md) |
| `Encrypted at rest via AES-256` and `OCR EXTRACTION · TOKENIZATION · SEMANTIC EMBEDDING` under the dropzone | Unverified security claim / pipeline internals |
| `98.4% ATS Parse Confidence`, per-skill confidence values (`0.98`), `RE-SYNC TO VECTOR DB` | Not in PRD (C3 shows editable skill chips only) |
| `Inspect Nodes` button | Not in PRD |
| Tiles `FILTER THRESHOLD ≥ 90%`, `MAX PINGS / DAY 8`, `QUIET HOURS 23:00–07:00` | Contradict PRD §10 defaults (min score 60; max 8 *per scan*) and quiet hours are not in PRD; min score is set in Match Preferences |
| Telegram module copy `matching >= 90% confidence`, `sub-second` | Inaccurate vs. PRD defaults and hourly/3-hourly scan cadence |

## 10. Stitch-internal conflicts and open points
1. **Accent:** `design-system.md` text says `#D4FF3F`; every screen uses `#c8f232` / `#add500`. Screens win → `--accent #c8f232`.
2. **Surface palette:** `design-system.md` text lists `#0A0A0B / #121214 / #1A1A1D` + hairline `#26262A`; screens use the Material surface set (`#131315 … #353437`) and no borders. Screens win.
3. **Radius:** text says cards 10px / controls 8px / chips 4px; the Tailwind config (what renders) gives 8px / 4px / 2px, and `rounded-full` = 12px. Rendered values adopted; true circles used for avatars/dots/radar (the PNG shows the radar as a rounded square — assumed unintended).
4. **Icons:** Stitch uses Material Symbols Outlined; `CLAUDE.md` and the owner's install list say lucide-react. **Decided in implementation:** use `lucide-react` (stroke 1.5) with the closest equivalent for each Material name in §1.5; shapes differ slightly from the mocks.
5. **Page margin:** token `margin-desktop 40px` exists but the mocks render 24px.
6. **Light mode** is **unverified, no mock** (derived tokens only), and the content of Settings → Profile / Preferences / Scan Settings has no mock — generate them in Stitch if exact fidelity is wanted.
7. **Score colours below 75%, warning/success colours** are not shown in any mock; values kept from the previous spec.
8. **Borders:** the Tracker uses 1px `--surface-3` borders on columns, cards and header chips, unlike the rest of the app (tonal layering). Spec follows the mock; it is the only screen with hairlines.
9. **Brand colours:** Tracker logo tiles use per-company hex colours and a 🤗 emoji. **Decided:** neutral `--surface-3` monogram tiles, no brand hex, no emoji.
10. **Off-token Tailwind colours:** `yellow-*`, `amber-*`, `cyan-*` appear in Watched/Tracker; mapped to `--warning` / `--info` (§1.3).
11. **Date examples:** Programs mocks show past/mixed dates (`MAR 28` urgent next to `APR 02`); they are placeholder data, deadlines come from the programs table.
