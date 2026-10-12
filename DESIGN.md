# SCOUT — Design System & UI Spec

**The UI is final.** It must match the Stitch screens in `docs/design/` (dark + light). This document turns those screens into exact tokens, components and behaviour. When this file and a screenshot disagree on a small detail, **the screenshot wins for layout, this file wins for tokens and motion.** Do not invent new screens, sections or features.

Design principles: restrained, editorial, high-craft (Linear × Vercel × Raycast). One signal accent used sparingly. Hairline borders, generous space, mono micro-labels, tabular numbers. Every motion is smooth, short and purposeful.

---

## 1. Tokens

Define in `apps/web/styles/tokens.css` as CSS variables on `:root` (light) and `.dark` (dark, default). Map them into Tailwind v4 `@theme`. Components use **only** tokens — no raw hex in components.

### 1.1 Colour — Dark (default)
| Token | Value | Use |
|---|---|---|
| `--bg` | `#0A0A0B` | page background |
| `--surface` | `#121214` | cards, sidebar, topbar |
| `--elevated` | `#1A1A1D` | hover, inputs, drawer sections, chips |
| `--border` | `#26262A` | hairlines |
| `--border-strong` | `#34343A` | focused/hovered borders |
| `--text` | `#F4F2EE` | primary text |
| `--muted` | `#8E8B85` | secondary text, labels |
| `--subtle` | `#5C5A56` | tertiary text, disabled |
| `--accent` | `#D4FF3F` | primary buttons, fresh badges, rings, active nav, radar |
| `--accent-ink` | `#0A0A0B` | text on accent |
| `--accent-line` | `#D4FF3F` | rings, progress bars, live dots |
| `--accent-fg` | `#D4FF3F` | accent text/icons on surfaces |
| `--accent-soft` | `rgb(212 255 63 / 0.10)` | active nav bg, selected chip bg |
| `--danger` | `#FF5C47` | scam risk, rejected, low scores, urgent deadlines |
| `--warning` | `#F5B544` | mid scores, soon deadlines |
| `--success` | `#4ADE80` | passes, positive deltas |
| `--info` | `#7AA2FF` | links in drawer, info chips |

### 1.2 Colour — Light
| Token | Value |
|---|---|
| `--bg` | `#F6F5F1` |
| `--surface` | `#FFFFFF` |
| `--elevated` | `#EFEEE9` |
| `--border` | `#E2E0D9` |
| `--border-strong` | `#CFCCC3` |
| `--text` | `#111111` |
| `--muted` | `#6B6862` |
| `--subtle` | `#A3A09A` |
| `--accent` | `#D4FF3F` (fills: buttons, fresh badges, active nav pill) |
| `--accent-ink` | `#111111` |
| `--accent-line` | `#5B8A00` (rings, bars, live dots — legible on white) |
| `--accent-fg` | `#1F3D2E` (accent text/icons) |
| `--accent-soft` | `rgb(212 255 63 / 0.35)` |
| `--danger` | `#D92D20` |
| `--warning` | `#B7791F` |
| `--success` | `#15803D` |
| `--info` | `#2F5BD3` |

Light-mode radar beam uses `--accent-line` (not red). Light mode uses subtle card shadow `0 1px 2px rgb(0 0 0 / 0.04)`; dark mode uses no shadows, only borders.

### 1.3 Semantic score colours
Match ring / score text: `≥ 80 → --accent-line`, `65–79 → --warning`, `< 65 → --danger`.
Deadline text: `≤ 14 days → --danger`, `≤ 45 → --warning`, else `--muted`.

### 1.4 Typography
Load with `next/font` (display: swap).

| Role | Font | Size / line / weight / tracking |
|---|---|---|
| Wordmark (login) | Archivo Black | 96px / 0.9 / 400 / -0.02em |
| Wordmark (sidebar) | Archivo Black | 22px / 1 / 400 / -0.01em |
| H1 page hero | Inter Tight | 36px / 1.1 / 600 / -0.02em |
| H2 page title (topbar / section) | Inter Tight | 20px / 1.2 / 600 / -0.01em |
| H3 card title | Inter Tight | 16px / 1.3 / 600 |
| Body | Inter | 14px / 1.5 / 400 |
| Body small | Inter | 13px / 1.45 / 400 |
| Mono label | JetBrains Mono | 11px / 1.2 / 500 / 0.08em, UPPERCASE |
| Mono data | JetBrains Mono | 12px / 1.3 / 400 (timestamps, counts, URLs) |
| KPI number | Inter Tight | 40px / 1 / 600, `font-variant-numeric: tabular-nums` |
| Ring number | Inter Tight | 14px / 1 / 600, tabular |

All numbers use `tabular-nums`.

### 1.5 Spacing, radius, size
- 8px base grid (Tailwind default scale). Page padding 32px desktop, 20px tablet, 16px mobile.
- Radius: `--r-sm 6px` (chips, badges), `--r-md 8px` (buttons, inputs), `--r-lg 10px` (cards), `--r-xl 14px` (drawer, modals, login cards), pills `999px`.
- Borders: 1px `--border` everywhere. Focus ring: 2px `--accent-line` outline, 2px offset.
- Sidebar 248px (collapsed 68px). Topbar 64px. Drawer 520px. Content max-width 1440px.
- Icons: lucide-react, 16px in nav/buttons, 14px in chips, stroke 1.5.

### 1.6 Background texture
Hero areas (login, dashboard hero) only: 1px grid lines at 48px spacing, `--border` at 35% opacity, radial mask fading to transparent. Login additionally has a static scatter of 1–2px dots at low opacity. No noise/blur animations.

---

## 2. App shell

### 2.1 Sidebar (`components/shell/sidebar.tsx`)
Top → bottom (see `docs/design/*dashboard*`):
1. **Wordmark** "SCOUT" (Archivo Black 22px) with radar-mark glyph replacing the "O" (circle + inner ring + 60° accent arc + crosshair).
2. **Profile switcher**: two stacked rows (avatar 24px, name `User 01`, chevron). Active row has `--elevated` bg. Clicking the other row → `POST /api/auth/switch` → router refresh. Avatar crossfade 200ms.
3. Mono label `DISCOVER` → Dashboard, Job Feed, Programs.
4. Mono label `PIPELINE` → Watched Companies, Tracker.
5. Spacer → Settings.
6. **Next scan card**: mono label `NEXT SCAN`, 56px progress ring (`--accent-line`) with remaining time `58m` centered, caption "Scans every 3 hours". Ring fills as time elapses since last boundary.
7. Collapse button (chevron) at the bottom edge; theme toggle lives in topbar.

Nav item: 36px tall, 12px x-padding, icon + label, `--muted` text. Hover: `--elevated` bg, `--text`. **Active:** `--accent-soft` bg, `--accent-fg` text/icon, 2px left indicator bar in `--accent-line` that slides between items using Motion `layoutId="nav-indicator"`.

Collapsed (68px): icons only, tooltips on hover, profile shows active avatar only, next-scan shows ring only.

### 2.2 Topbar (`components/shell/topbar.tsx`)
64px, sticky, `--surface` at 80% with `backdrop-filter: blur(12px)`, bottom hairline.
- Left: back chevron (when nested) + breadcrumb/page title.
- Center: search field 360px — magnifier icon, placeholder "Search jobs, companies, skills…", `⌘K` kbd chip. Clicking opens cmdk palette (jump to pages, search jobs by title/company, companies, programs).
- Right: **scan status pill** (`● Scanning 14 sources…` with 3 animated dots while running; `● Last scan 42m ago` idle; dot = `--accent-line` running, `--success` idle, `--danger` failed), Telegram status (paper-plane icon + dot), notifications bell (count badge), theme toggle (sun/moon crossfade + 90° rotate), avatar.

### 2.3 Responsive
- ≥1280: full layout.
- 1024–1279: sidebar auto-collapses to 68px; dashboard hero becomes 2 columns (radar hidden into scan card header at small size).
- 768–1023: sidebar hidden; hamburger in topbar opens it as a left sheet; search collapses to icon.
- <768: single column; KPI tiles 2×2; drawer becomes full-screen sheet sliding up; kanban scrolls horizontally with snap; tables switch to cards.

---

## 3. Components

Build in `components/ui/` on top of shadcn primitives, restyled to tokens.

| Component | Spec |
|---|---|
| **Button / primary** | `--accent` bg, `--accent-ink` text, 36px (40px on login/drawer footer), `--r-md`, 600 weight. Hover: brightness 1.05 + translateY(-1px). Press: scale .98. Optional trailing icon (`→` or `↗`) that nudges +2px x on hover. |
| **Button / secondary** | transparent bg, 1px `--border`, `--text`. Hover `--elevated`. |
| **Button / ghost** | no border, `--muted` → `--text` on hover. |
| **Chip (filter)** | 28px pill, `--elevated` bg, `--muted` text 12px. Selected: `--accent-soft` bg, `--accent-fg` text, 1px accent border. |
| **Tag (meta)** | 22px, `--r-sm`, `--elevated`, 11px text — e.g. `Remote`, `Internship`, `Bangalore`. |
| **Fresh badge** | `--accent` bg, `--accent-ink` text, mono 10px: `● FRESH · 3h`. |
| **Scam badge** | 1px `--danger` border, `--danger` text, mono 10px `SCAM RISK`, shield icon; tooltip lists reasons. |
| **ATS badge** | mono 11px lowercase `greenhouse` under company name, `--muted`. |
| **Count pill** | e.g. `3 open roles` — `--accent` bg + ink; `No openings` — `--elevated` + `--muted`. Diff pill: `+2 new` (`--accent-soft`/`--accent-fg`), `No change` (`--muted`). |
| **Match ring** | SVG 44px (cards) / 64px (drawer, with `MATCH` mono caption). Track `--border`, arc coloured per §1.3, round caps. Animates 0 → value (§5). |
| **Progress bar** | 4px, `--border` track, fill `--accent-line` (or semantic), radius pill. |
| **Sparkline** | 7–12 thin vertical bars, 3px wide, 2px gap, `--accent-line` at 80%, last bar 100%. Pure SVG. |
| **Card** | `--surface`, 1px `--border`, `--r-lg`, 16–20px padding. Hover (interactive cards): border → `--border-strong`, translateY(-2px). |
| **Company logo** | 32/40px rounded-md tile, `--elevated` bg; img via favicon/Clearbit-style URL with fallback monogram (first letter, Inter Tight 600). |
| **Kbd** | mono 11px, 1px border, `--r-sm`. |
| **Skeleton** | `--elevated` blocks with a single shimmer gradient sweep (transform only). |
| **Toast** | sonner, `--surface`, border, bottom-right. |
| **Empty state** | small radar-mark glyph (static), H3, one line of `--muted` copy, one action. |

---

## 4. Screens

Each screen ships in dark and light. References in `docs/design/`.

### 4.1 Login / profile picker (`/login`) — ref: `1. LOGIN / PROFILE PICKER`
Centered column, max 440px, vertically centered on full-viewport hero background (§1.6).
1. Wordmark **SCOUT** 96px, radar-mark "O" with the accent arc slowly rotating (12s/turn).
2. Mono tagline `AI JOB & INTERNSHIP RADAR`, letter-spaced, `--muted`.
3. Two **profile cards** side by side, 168×200, `--r-xl`, image cover (uploaded avatar) with bottom gradient and label `USER 01` / display name in Inter Tight 700 uppercase. Rotated −4° / +4°. Selected: 2px `--accent` border, accent check badge top-right, rotation → 0°, scale 1.03, others dim to 60% opacity. Hover lifts −4px. Default selection = last used (cookie `scout_last_profile`).
4. Password input with lock icon + eye toggle, placeholder "Enter shared password", 44px.
5. Full-width primary button **Enter →** 44px.
6. Mono caption `SCOUT SCANS THE WEB EVERY 3 HOURS`, row of source logo glyphs (monochrome, 18px, `--muted`), and `● 20+ SOURCES ONLINE` (count from latest successful `source_runs`).
Error: input shakes (x: 0,−6,6,−4,4,0 over 300ms) + `--danger` caption. Enter key submits.

### 4.2 Dashboard (`/dashboard`) — ref: `2. DASHBOARD`
**Hero row** (12-col grid, gap 24, on hero background):
- Cols 1–4: `Good morning,` (time-of-day aware, IST) in `--muted` 15px; H1 `Here's your job radar.`; caption `Live scanning · AI matching · Alerts on Telegram`.
- Cols 5–8: **Radar** (§6.1), 280px.
- Cols 9–12: **Scan Status card**: mono label `SCAN STATUS`; title `● Scanning 14 sources…` (or `Last scan · 42m ago`); list of top 6 sources from latest run — icon, name, progress bar, `124 new` mono right-aligned; footer link `View all sources →` (opens popover with full list + errors).

**KPI row** (4 tiles): `42 New today` · `18 Fresh < 24h` (+ delta chip `+6%` success) · `27 Applied this week` · `5 Interviews`. Number left, label below, sparkline right.

**Top matches for you** — header + `View all →` (to /jobs). 4 cards in a row: logo, ring top-right, company (H3), role, tags `Remote · Internship · Fresh · 3h`. Click → `/jobs?job=<id>` with drawer open.

**Bottom marquee**: full-width band, mono 11px `--muted`: `SCANNING: GOOGLE · MICROSOFT · AMAZON · NVIDIA · …` (companies from recent jobs). §6.2.

### 4.3 Job Feed (`/jobs`) — ref: `3. JOB DETAIL DRAWER`, `JOB FEED`
- Page title `Job Feed` + search.
- Sticky filter bar: chips `Remote`, `India`, `Internship`, `Fresh < 24h`, `Eligible only` (default on), `Hide scam risk` (default on); sort `Best match / Newest`; view toggle `Cards | Table`. Filters live in URL search params.
- **Card list** (single column, max 760px when drawer open; fills when closed): row card — logo 40px; company (600) + role; tag row (location, type); `MISSING: Kubernetes, Airflow` mono 11px `--muted` (omit if none); right side: Fresh badge (if fresh), match ring 44px, `Apply ↗` small primary button, bookmark icon (Save). Scam badge replaces Fresh badge when flagged. Posted time `12h ago` mono when not fresh.
- **Table view**: Company · Role · Location · Posted · Match · Status · Actions. Sticky header, row hover `--elevated`.
- Virtualize when > 60 items. Infinite scroll by 30.

**Job detail drawer** (right, 520px, `--surface`, left border, `--r-xl` on left corners):
- Header: logo 48px, company, role (H2), tags (location, type, `Posted 3h ago`), match ring 64px with `MATCH`. Close ✕.
- Tabs: **Overview · Match · Company · Similar** (underline indicator slides via `layoutId`).
- **Overview** (two-column inside drawer on ≥1280, stacked otherwise):
  - Left: `Job Description` (clamped 6 lines, `Show more ↓`), `Eligibility Check` (✓ success / ✗ danger / ? muted icons + labels), `Match Breakdown` (Skills / Eligibility / Freshness bars with % mono).
  - Right: **Tailor for this job** card (sparkle icon, one line description, primary `Generate with AI`; after generation shows checklist `✓ 3 tailored resume bullets · ✓ 1 cover note · ✓ Optimized for ATS` and expandable results with copy buttons + `Regenerate`). **Find referrals** card: 3 `--info` links with ↗ icons.
- **Match**: missing skills chips (danger outline), matched skills chips, Gemini `reason`, full eligibility list, scam reasons if any.
- **Company**: other active roles from this company in SCOUT, watched toggle (Watch / Watching).
- **Similar**: 5 similar jobs (via `similar_jobs` RPC) as compact rows.
- Sticky footer: `Apply ↗` (primary, opens apply_url in new tab and asks via toast "Mark as applied?" with action), `Save`, `Skip`.
- URL-driven (`?job=<id>`), Esc closes, focus trapped, ←/→ moves to previous/next job.

### 4.4 Watched Companies (`/watched`) — ref: `4. WATCHED COMPANIES`
- Header: title + `+ Add careers page URL` button → inline input row expands (Motion height via layout) with URL field + `Add`. While detecting: field shows mono status steps `Fetching… → Detecting ATS… → Found greenhouse · 3 roles` with a small spinner; success row animates into the list.
- List rows (one card, divided by hairlines): logo, company name + ATS badge under it, count pill, diff pill, `Last checked 2h ago` mono right, instant-alerts switch, overflow menu (Open careers page, Remove). Row click expands to show open roles (title, location, posted, Apply ↗).
- Generic-pending state: `Waiting for next scan` muted pill. Error: `Couldn't read this page` danger text + retry.

### 4.5 Tracker (`/tracker`) — ref: `5. TRACKER`
- Title `Application Tracker`, `+ Add application` button, fullscreen toggle icon.
- Six columns: Saved · Applied · OA · Interview · Offer · Rejected. Column header: name + mono count right. Columns 220px min, equal width, horizontal scroll if needed. Column bg `--surface`, cards `--elevated`.
- Card: logo 24px + company (600) + role; date mono `Applied Oct 10`; optional next-action chip (`Interview · Oct 15` accent-soft; `Follow up · Oct 14` warning soft; `Offer · Oct 1` success soft). Click opens edit popover (stage, dates, next action, notes, delete).
- Drag & drop with @dnd-kit: dragged card lifts (scale 1.03, rotate 1.5°, shadow `0 12px 30px rgb(0 0 0 / .35)` — shadow applied statically to the drag overlay, not animated), placeholder slot animates open, counts tick.

### 4.6 Programs (`/programs`) — ref: `6. PROGRAMS`
- Title `Programs & Opportunities`. Segmented tabs: All · GSoC · LFX · MLH · Hackathons · Off-campus (sliding active background via `layoutId`).
- Rows: logo 32px, name (600) + organizer/description muted, progress bar (time elapsed opens→deadline), `50 days left` (semantic colour) + date mono under it, bell button (`Set reminder` / `Reminder on` accent).
- `+ Add program` in header → small modal (name, category, url, deadline).

### 4.7 Settings (`/settings/[section]`) — ref: `7. SETTINGS`
Left sub-nav card: Profile · Resume · Preferences · Telegram · Scan Settings (same active style as sidebar).
- **Profile**: display name, avatar upload (circular crop preview), college.
- **Resume**: dropzone (dashed `--border-strong`, upload icon, "Click to upload or drag and drop", "PDF, DOC, DOCX (Max 5MB)"); on drop: progress → "Parsing with AI…" skeleton → parsed summary + **Parsed Skills** chips (removable ×, `+ Add skill`). Shows current file name + uploaded date.
- **Preferences**: target roles (tag input), locations (tag input), remote toggle, job types (Internship / Full-time chips), graduation year, degree, max experience years (stepper), active backlogs (Yes/No/Prefer not), minimum match score (slider 40–90).
- **Telegram**: status card — not linked: QR code + `Open in Telegram` button + 15-min countdown; linked: chat name, `Send test message`, `Unlink`.
- **Scan Settings**: schedule display (`Every 3 hours · watched companies hourly`), last 10 runs table (time, kind, status, jobs, new), sources list with enabled state (read-only from env), primary `Scan now` (disabled while running).

---

## 5. Motion system

Library: `motion/react` via `LazyMotion features={domAnimation}` + `m.` components. Loops are pure CSS keyframes.

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
| Route change | 150ms opacity crossfade of main area only (shell never re-animates) |
| KPI numbers | count-up 0 → value over 900ms (`animate()` on a motion value, write text via ref, no re-render per frame), once per mount |
| Match rings | `strokeDashoffset` full → value, 900ms ease.out, delay = stagger index × 40ms |
| Progress bars / breakdown bars | `scaleX` 0 → value (transform-origin left), 600ms |
| Sparklines | bars `scaleY` 0 → 1 staggered 20ms |
| Cards hover | translateY(-2px) + border colour, 120ms |
| Buttons | hover translateY(-1px); press scale .98; icon nudge 2px |
| Nav / tabs indicator | shared `layoutId`, `spring.snappy` |
| Drawer | x 100% → 0 with `spring.drawer`; overlay opacity 0 → .4 (mobile/tablet only); content inside fades up after 80ms |
| Filters change | list items use `layout` + `AnimatePresence` (popLayout) — exit fade 120ms, enter fadeUp |
| Watched add row | height auto via `layout`, new row fades up + accent flash on border (opacity of an overlay, 600ms) |
| Kanban | dnd-kit overlay; drop settles with `spring.snappy`; column count ticks with 150ms number fade |
| Theme toggle | icon rotate 90° + crossfade 200ms; theme colours swap instantly (no animated colour transitions on the whole page) |
| Toasts | sonner defaults |
| Login cards | selection: rotate → 0, scale 1.03, border colour — `spring.snappy`; password error shake 300ms |
| Live dots | CSS `pulse` (opacity .4↔1, scale .9↔1.1) 1.6s infinite |
| Scanning dots `…` | CSS staggered opacity 1.2s infinite |
| Skeleton shimmer | CSS translateX gradient 1.4s infinite |

### 5.3 Signature elements
**6.1 Radar** (`components/radar/radar.tsx`) — SVG 280×280:
- 4 concentric circles (`--border`), crosshair lines, outer tick marks every 15° (`--subtle`).
- Beam: a `div` with `conic-gradient(from 0deg, transparent 0deg, color-mix(in srgb, var(--accent-line) 35%, transparent) 50deg, transparent 60deg)`, masked to a circle, `animation: spin 6s linear infinite` (transform rotate). GPU layer via `will-change: transform` on this element only.
- Blips: up to 24 recent matches. Polar position: radius = `(100 − score)/100 × R` (best matches near center), angle = hash(job_id) → 0–360°. Size 4px (`--muted`), fresh = 6px `--accent-line` with CSS pulse ring. Blips fade in staggered on mount. Hover → tooltip (company · role · score); click → open drawer.
- Center: small accent dot.
- Paused (`animation-play-state: paused`) when off-screen (IntersectionObserver) or tab hidden; static under reduced motion.

**6.2 Marquee** — two copies of the content in a flex track; CSS `@keyframes marquee { to { transform: translateX(-50%) } }` 40s linear infinite; edges faded with `mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)`; pause on hover; paused off-screen; static under reduced motion.

**6.3 Login wordmark radar-O** — accent arc rotates 12s linear infinite (CSS).

---

## 6. Performance rules (non-negotiable)

1. Animate **only `transform` and `opacity`** (and SVG `strokeDashoffset` for rings). Never animate width/height/top/left/box-shadow/filter/background-color. Height changes use Motion `layout` (which uses transforms).
2. `backdrop-filter` only on the topbar (static, never animated).
3. `will-change` only on the radar beam and on elements during an active drag.
4. Continuous loops are CSS, not JS, and pause when off-screen or `document.hidden`.
5. Count-ups write to DOM via refs/motion values — no React state per frame.
6. Use `LazyMotion` + `m` components; never import the full `motion` bundle in client components.
7. Virtualize long lists (>60). `content-visibility: auto` on below-the-fold sections.
8. Fonts via `next/font`; images via `next/image` with explicit sizes; logos lazy.
9. Server Components by default; client components only for interactivity. Keep client JS for any page < 150KB gz.
10. `prefers-reduced-motion: reduce` → disable loops, stagger, count-ups (show final values), ring/bars render at final value; keep 120ms opacity fades only.
11. Targets: Lighthouse Performance ≥ 90 (desktop), CLS < 0.05, INP < 200ms, steady 60fps on dashboard scroll (verify in DevTools Performance with 4× CPU throttle: no long tasks > 50ms during idle animation).

---

## 7. Accessibility
- WCAG AA contrast in both themes (accent text on surfaces uses `--accent-fg`, never raw lime on white).
- All interactive elements keyboard reachable; visible focus ring (§1.5).
- Drawer and modals: focus trap, Esc to close, return focus on close, `aria-modal`.
- Rings/bars have `aria-label` ("87 percent match"). Icons-only buttons have labels.
- Kanban: dnd-kit keyboard sensor enabled.
- Don't rely on colour alone: scam badge has text; scores show numbers.

## 8. Copy & content rules
- Sentence case for UI text, UPPERCASE only for mono labels.
- Relative times: `3h ago`, `2d ago`; dates `Oct 15` (IST).
- Numbers: `124 new`, `87%`. No exclamation marks, no emojis in the web UI.
- Empty states are one line, specific: "No fresh matches yet. Next scan in 58m."
