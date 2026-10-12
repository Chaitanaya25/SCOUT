# SCOUT — Design System & UI Spec

**Stitch is the source of truth.** Project: *Scout AI Job Radar* (`projects/9530679423670178592`), design system *Editorial Precision Radar*. Exports live in `docs/design/<NN-screen-theme>/{code.html,screen.png}`:

| Folder | Stitch screen | Theme | Status |
|---|---|---|---|
| `00-design-system/` | Design system asset (`design-system.md`, `theme.json`, generated `code.html`) | dark | `screen.png` **missing — Stitch has no image for the design-system asset; export manually** |
| `01-sign-in-dark/` | Sign In — SCOUT | dark | exported |
| `02-dashboard-dark/` | Dashboard — SCOUT | dark | exported |
| `03-job-feed-dark/` | Job Feed — SCOUT (includes the job detail drawer) | dark | exported |

**Gaps in Stitch (no mock exists):** light theme, Watched Companies, Tracker, Programs, Settings. Those sections below are marked **[no Stitch mock]** — they are derived from the Stitch tokens and the previous spec, and must be re-checked if a mock is added.

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

### 1.2 Colour — Light **[no Stitch mock]**
Derived from the Stitch `design-system.md` light palette; accent family aligned to the Stitch dark accent.
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
Deadline: `≤ 14 days → --danger`, `≤ 45 → --warning`, else `--muted` (Stitch shows 3d → danger, 5d/8d → accent/info).

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
- Icons: **Material Symbols Outlined** (Stitch), 18px in nav, 14–15px in chips/buttons, 16–20px in headers. Name map: radar, dynamic_feed, school, domain, view_kanban, tune, search, notifications, send, dark_mode, light_mode, verified, check_circle, shield, gpp_bad, warning, report, bookmark_border, close, north_east / arrow_outward / open_in_new, arrow_forward, content_copy, task_alt, timer, bolt, notifications_active, share, dock_to_right, smart_toy, schedule, refresh, sort, expand_more, visibility(_off). (Replaces lucide-react — see §10.)

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
- Left: mono-micro `SCOUT RADAR` · `/` · mono-label `INTELLIGENCE CORE` (`--text-strong`). Stitch shows `INTELLIGENCE CORE` on both Dashboard and Job Feed; other pages use their own title in that slot.
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

### 4.4 Watched Companies (`/watched`) **[no Stitch mock]**
- Header: `Watched Companies` + `+ Add careers page URL` primary button → inline input row expands (Motion `layout`) with URL field + `Add`; while detecting: mono status steps `Fetching… → Detecting ATS… → Found greenhouse · 3 roles` with a spinner.
- One `--surface` card of rows separated by 8px gaps (rows on `--surface-2`, like the Dashboard alerts rows): 32px logo tile, company (body-base 600) + ATS badge, count pill (`3 open roles` `--accent`+ink; `No openings` `--surface-3`+`--muted`), diff pill (`+2 new` / `No change`), `Last checked 2h ago` mono-micro, **Instant alerts** switch (F2), overflow menu (Open careers page, Remove). Row click expands the open roles (title, location, posted, `Apply ↗`).
- States: `Waiting for next scan` muted pill; `Couldn't read this page` `--danger` text + retry.

### 4.5 Tracker (`/tracker`) **[no Stitch mock]**
- Header `Application Tracker` + `+ Add application` + fullscreen toggle.
- Six columns: Saved · Applied · OA · Interview · Offer · Rejected. Column header name + mono-micro count right; min 220px, equal width, horizontal scroll if needed. Column bg `--surface`, `--r-lg`; cards `--surface-2`, `--r-md`.
- Card: 24px logo tile + company (600) + role; mono-micro date `Applied Oct 10`; next-action chip (`Interview · Oct 15` `--accent-soft`; `Follow up · Oct 14` warning soft; `Offer · Oct 1` success soft). Click → edit popover (stage, dates, next action, notes, delete).
- Drag & drop with @dnd-kit: dragged card scale 1.03, rotate 1.5°, static shadow `0 12px 30px rgb(0 0 0 / .35)` on the overlay; placeholder slot animates open; counts tick.

### 4.6 Programs (`/programs`) **[no Stitch mock — row pattern follows the Dashboard "Upcoming Deadlines" card]**
- Title `Programs & Opportunities`; segmented tabs All · GSoC · LFX · MLH · Hackathons · Off-campus (shared segmented-control style, sliding active bg via `layoutId`); `+ Add program` → small modal (name, category, url, deadline).
- Rows on `--surface-2`, `--r-md`, padding 12: 8px status dot, name (600) + organizer muted, days-left chip (`--danger-container` urgent, else `--surface-3`), date mono-micro, 6px time-elapsed bar (colours per §1.3), bell button (`Set reminder` / `Reminder on` accent) — F10.

### 4.7 Settings (`/settings/[section]`) **[no Stitch mock]**
Left sub-nav card (`--surface`): Profile · Resume · Preferences · Telegram · Scan Settings (active = `--surface-3` + `--text-strong`, same as sidebar). Content in `--surface` cards, inputs `--surface-lowest` 36px `--r-md`.
- **Profile:** display name, avatar upload (circular crop preview), college.
- **Resume:** dropzone (dashed `--outline-variant`, upload icon, "Click to upload or drag and drop", "PDF, DOC, DOCX (Max 5MB)"); progress → "Parsing with AI…" skeleton → parsed summary + **Parsed Skills** chips (removable ×, `+ Add skill`); shows file name + date.
- **Preferences:** target roles, locations (tag inputs), remote toggle, job types (Internship / Full-time chips), graduation year, degree, max experience years, active backlogs (Yes / No / Prefer not), minimum match score (slider 40–90).
- **Telegram:** not linked → QR + `Open in Telegram` + 15-min countdown; linked → chat name, `Send test message`, `Unlink`.
- **Scan Settings:** schedule `Every 3 hours · watched companies hourly`, last 10 runs table, sources list (read-only from env), primary `Scan now` (disabled while running).

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
| Table/Cards view toggle (previous spec) and Match/Company/Similar drawer tabs | — | Not in Stitch; removed. Missing skills live in Overview |
| `Dual Node` split-pane radar workbench, user A/B tab bar (designMd) | — | Not in the screens; profile switching is the sidebar switcher (C6) |

## 10. Stitch-internal conflicts and open points
1. **Accent:** `design-system.md` text says `#D4FF3F`; every screen uses `#c8f232` / `#add500`. Screens win → `--accent #c8f232`.
2. **Surface palette:** `design-system.md` text lists `#0A0A0B / #121214 / #1A1A1D` + hairline `#26262A`; screens use the Material surface set (`#131315 … #353437`) and no borders. Screens win.
3. **Radius:** text says cards 10px / controls 8px / chips 4px; the Tailwind config (what renders) gives 8px / 4px / 2px, and `rounded-full` = 12px. Rendered values adopted; true circles used for avatars/dots/radar (the PNG shows the radar as a rounded square — assumed unintended).
4. **Icons:** Stitch uses Material Symbols Outlined; `CLAUDE.md` says lucide-react. Spec follows Stitch (self-hosted subset). Decide whether to update `CLAUDE.md`.
5. **Page margin:** token `margin-desktop 40px` exists but the mocks render 24px.
6. **Light mode, Watched, Tracker, Programs, Settings** have no mock — generate them in Stitch before building those screens if exact fidelity is wanted.
7. **Score colours below 75%, warning/success colours** are not shown in any mock; values kept from the previous spec.
