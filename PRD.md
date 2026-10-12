# SCOUT — Product Requirements Document

> AI job & internship radar for two people. Scans job boards and company careers pages every 3 hours, ranks jobs against each person's resume with Gemini, and sends alerts to Telegram with a direct apply link.

**Status:** v1 scope locked. **Feature freeze:** nothing outside this document gets built in v1.

---

## 1. Problem

Finding internships and entry-level roles means checking LinkedIn, Naukri, Internshala, remote boards and a dozen company careers pages by hand every day. Good roles get hundreds of applicants within 24–48 hours, so being late is the same as not applying. Most listings are noise: senior roles, wrong batch, wrong location, or outright scams.

## 2. Users

Exactly **two profiles** sharing one deployment and one password.

| Profile | Context |
|---|---|
| User 01 | B.Tech CSE (Data Science), 2028 batch, ML/AI + backend roles, India + remote, internships first |
| User 02 | Partner — own resume, own preferences, own Telegram, own tracker |

Profiles are fully isolated in data (resume, preferences, matches, tracker, watched companies, Telegram chat). No public signup.

## 3. Goals

1. Never miss a relevant role posted in the last 24 hours.
2. Know within an hour when a watched company opens a role.
3. See only roles the user is actually eligible for, with scams filtered out.
4. Apply in one tap from Telegram or the web app.
5. Track every application from saved → offer in one place.
6. Stay inside the **Gemini free tier** and **free hosting tiers**.

## 4. Non-goals (v1)

- Auto-submitting applications.
- Scraping LinkedIn profiles or messaging people automatically.
- Public multi-tenant signup, billing, teams.
- Mobile native apps (web app is responsive; Telegram is the mobile surface).
- Any feature not listed in §5 and §6.

---

## 5. Core capabilities

### C1. Multi-source job discovery
- Pull jobs from job aggregators, remote boards, and company ATS APIs (full list in `ARCHITECTURE.md §5`).
- Covers India locations **and** remote roles worldwide.
- Covers **internships and full-time entry-level** roles.
- Normalize every job into one schema; dedupe across sources.

**Acceptance:** one full scan returns jobs from ≥10 sources; the same role posted on 3 boards appears once, with all sources recorded.

### C2. Scheduled scanning (every 3 hours)
- Full scan runs every 3 hours.
- Watched-company scan runs every hour (cheap ATS API calls).
- Manual **Scan now** button in Settings → Scan Settings.
- Live scan status visible in the top bar and dashboard.

**Acceptance:** scans run unattended for 7 days without manual intervention; overlapping runs are prevented.

### C3. Resume-based matching
- User uploads resume (PDF/DOC/DOCX, ≤5MB). Gemini parses it into structured data (skills, education, grad year, experience, projects).
- Parsed skills are shown as editable chips.
- Each job gets a **match score 0–100** with a breakdown: Skills, Eligibility, Freshness.

**Acceptance:** top 10 matches for User 01 are visibly ML/AI/backend roles that fit a 2028-batch student.

### C4. Telegram alerts
- Each profile links its own Telegram chat via a one-time deep link / QR from Settings.
- Alerts include title, company, location, posted time, match %, missing skills, and an **Apply ↗** URL button.

**Acceptance:** linking takes under 30 seconds; alerts arrive for the correct profile only.

### C5. Watched companies (careers pages)
- User pastes a careers page URL. SCOUT auto-detects the ATS (Greenhouse, Lever, Ashby, Workday, SmartRecruiters) or falls back to rendering the page.
- Shows per company: ATS badge, open role count, change since last check (`+2 new` / `No change`), last checked time, and the list of open roles.
- Answers the question "is there an opening or not" at a glance.

**Acceptance:** adding a Greenhouse/Lever/Ashby URL shows correct open roles within one minute; adding an unknown site still returns roles or a clear "couldn't read this page" state.

### C6. Two profiles, one password
- Sign-in screen shows both profile cards. Pick one, enter the shared password, enter.
- Profile switcher in the sidebar switches profiles without re-entering the password.
- Each profile has a display name and avatar (uploaded image).

**Acceptance:** wrong password is rejected with rate limiting; switching profile swaps all data instantly.

### C7. Web UI
- Deployable web app matching `DESIGN.md` and `docs/design/<NN-screen-theme>/screen.png` exactly, dark and light mode, smooth non-laggy animations.

---

## 6. The 10 features

### F1. Freshness priority
- Jobs posted < 24h are tagged **FRESH · Nh** and ranked higher.
- Fresh jobs above the score threshold are sent as **individual** Telegram messages right after each scan; older matches go into one digest message.
- Feed filter: **Fresh < 24h**.

**Acceptance:** a matching job posted 2h ago appears above an equally scored job posted 5 days ago, and arrives as its own Telegram message.

### F2. Watched-company instant alerts
- Each watched company has an **Instant alerts** toggle (default on).
- When a watched company posts a new role, the user gets a Telegram message on the next hourly watched scan, regardless of digest timing.

**Acceptance:** a new role at a watched Greenhouse company triggers a Telegram message within ~1 hour of appearing.

### F3. Eligibility filter
- Rule-based hard filter removes: senior/lead/staff/principal/manager titles, roles requiring more years of experience than the profile allows, and roles restricted to graduation years that don't match the profile.
- Top matches get an **Eligibility Check** list (e.g. ✓ 2028 batch eligible, ✓ B.Tech/B.E. CS or related, ? No active backlogs).
- Feed filter: **Eligible only** (default on).

**Acceptance:** "Senior ML Engineer, 5+ years" never appears with Eligible only on.

### F4. Scam filter
- Heuristics + Gemini flag scam-risk jobs (registration/training fees, deposit requests, WhatsApp/Telegram-only contact, personal email recruiters, unrealistic pay).
- `high` risk jobs are never sent to Telegram and are hidden by default in the feed; shown with a **SCAM RISK** badge and reasons when the filter is off.

**Acceptance:** a listing asking for a "registration fee" is flagged high-risk with the reason shown.

### F5. Missing-skills line
- Every scored job shows `MISSING: skill, skill` — skills the JD asks for that the resume lacks (max 4).
- Shown on feed cards, in the drawer Match tab, and in Telegram messages.

**Acceptance:** missing skills only contain skills actually mentioned in the JD.

### F6. Telegram action buttons
- Every job alert has inline buttons: **Apply ↗** (URL), **Save**, **Skip**, **Applied ✓**.
- Save → tracker "Saved". Applied → tracker "Applied" with today's date. Skip → hidden from feed and never re-alerted.
- Button presses update the message to show the new state.

**Acceptance:** tapping Applied in Telegram moves the job to the Applied column in the web tracker.

### F7. Application tracker
- Kanban: **Saved → Applied → OA → Interview → Offer / Rejected** with counts.
- Drag and drop between columns; each card shows company, role, date, and a next-action chip (e.g. `Interview · Oct 15`, `Follow up · Oct 14`).
- Next-action dates trigger a Telegram reminder on the day.
- Jobs can be added manually (for roles found outside SCOUT).

**Acceptance:** stage changes from web and Telegram stay in sync; reminders fire once.

### F8. Tailored resume bullets + cover note
- In the job drawer: **Tailor for this job → Generate with AI**.
- Gemini returns 3 tailored resume bullets (only from real resume content, no invented experience), 1 short cover note, and ATS keywords used.
- Copy buttons; result is cached per job; Regenerate available.

**Acceptance:** bullets reference real projects/skills from the resume and include JD keywords.

### F9. Referral helper
- In the job drawer: **Find referrals** with prefilled LinkedIn search links:
  - People at the company in the relevant team/role
  - Company employees on LinkedIn
  - Alumni from the user's college at the company
- Links only; no scraping, no automated messages.

**Acceptance:** each link opens a correct LinkedIn people search in a new tab.

### F10. Programs tracker
- Separate page for GSoC, LFX Mentorship, MLH Fellowship, hackathons, off-campus drives.
- Tabs: All, GSoC, LFX, MLH, Hackathons, Off-campus. Each row: name, organizer, time-elapsed bar, `N days left`, deadline date.
- **Set reminder** → Telegram reminders 7 days and 1 day before the deadline.
- Programs come from a curated seed file + scraped hackathon listings; manual add supported.

**Acceptance:** setting a reminder on a program 7 days out delivers a Telegram message that day.

---

## 7. Key user flows

1. **First run:** open app → pick profile card → password → Settings → upload resume → review skills → set preferences → link Telegram → done. Next scan populates the dashboard.
2. **Daily:** Telegram ping (fresh match) → tap Apply ↗ → apply → tap Applied ✓ → card appears in tracker.
3. **Watching a dream company:** Watched Companies → paste careers URL → ATS detected → see "3 open roles" or "No openings" → instant alert when a role appears.
4. **Before applying:** Job Feed → open job → check Eligibility + Missing skills → Generate tailored bullets → Find referrals → Apply.

## 8. Success metrics (personal)

- ≥80% of Telegram alerts judged relevant after week 1.
- Median time from posting to alert < 4 hours (< 1.5h for watched companies).
- 0 scam jobs delivered to Telegram.
- Total running cost: ₹0/month.

## 9. Constraints

- Gemini **free tier** only. All model calls are budgeted, batched, cached (see `ARCHITECTURE.md §8`).
- Free hosting: Vercel (web), GitHub Actions (scheduled worker), Supabase free (DB + storage).
- Respect source rate limits and terms; prefer official/public JSON endpoints; no login-walled scraping.
- 2 profiles max; a third profile is not supported in v1.

## 10. Open questions (decide during build, default in brackets)

- Default minimum match score for alerts? **[60]**
- Max individual fresh-alert messages per scan before falling back to digest? **[8]**
- Which sources are enabled at launch? **[all in ARCHITECTURE §5 marked v1]**
