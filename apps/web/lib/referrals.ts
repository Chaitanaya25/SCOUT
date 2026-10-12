// F9 referral helper: LinkedIn people-search URLs only (no scraping, no outreach — CLAUDE.md). Pure.

export type ReferralLink = { label: string; description: string; url: string };

const BASE = "https://www.linkedin.com/search/results/people/";

function search(keywords: string): string {
  return `${BASE}?${new URLSearchParams({ keywords: keywords.replace(/\s+/g, " ").trim(), origin: "GLOBAL_SEARCH_HEADER" }).toString()}`;
}

/** Strip legal suffixes so the search matches how people list the employer ("Stripe Inc." -> "Stripe"). */
export function companyKeyword(company: string): string {
  return company
    .replace(/\b(inc|llc|ltd|limited|pvt|private|corp|corporation|gmbh|plc|technologies|technology|labs)\b\.?/gi, "")
    .replace(/[(),]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || company.trim();
}

/** "Senior Backend Engineer Intern (Payments)" -> "Backend Engineer": the team/role words worth searching for. */
export function roleKeyword(title: string): string {
  const cleaned = title
    .replace(/\(.*?\)|\[.*?\]/g, " ")
    .replace(/\b(intern(ship)?|trainee|graduate|new grad|junior|jr\.?|senior|sr\.?|lead|staff|principal|i{1,3}|20\d\d|summer|winter|fall|spring|remote|hybrid)\b/gi, " ")
    .replace(/[-–—|/,:.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.split(" ").slice(0, 3).join(" ");
}

export function referralLinks(input: { company: string; title: string; college: string | null }): ReferralLink[] {
  const company = companyKeyword(input.company);
  const role = roleKeyword(input.title);
  const links: ReferralLink[] = [
    { label: `${role || "Engineers"} at ${company}`, description: "People in this team or role", url: search(`${company} ${role}`) },
    { label: `${company} employees`, description: "Anyone currently at the company", url: search(company) },
  ];
  if (input.college?.trim()) {
    links.push({ label: `${input.college.trim()} alumni at ${company}`, description: "Alumni from your college", url: search(`${company} ${input.college.trim()}`) });
  }
  return links;
}
