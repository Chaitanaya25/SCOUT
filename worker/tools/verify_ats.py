"""Verify candidate company → ATS tokens against the LIVE APIs and write worker/data/ats_companies.yaml.

    cd worker
    uv run python tools/verify_ats.py            # prints a report only
    uv run python tools/verify_ats.py --write    # also (re)writes data/ats_companies.yaml

A candidate is kept only when its API answers 200 with at least one posting AND the board lists an
intern/graduate-style role or an India/remote location. Nothing is guessed: unverified candidates are dropped.
Polite by design: a small concurrency limit and a short delay per request.
"""

from __future__ import annotations

import argparse
import asyncio
import re
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

import httpx
import yaml

UA = "Mozilla/5.0 (compatible; ScoutRadar/0.1; personal job radar)"
INTERN_RE = re.compile(
    r"\b(intern(ship)?s?|trainee|graduate|campus|apprentice|early career|new grad|university)\b",
    re.I,
)
INDIA_RE = re.compile(
    r"\b(india|bangalore|bengaluru|hyderabad|pune|mumbai|delhi|gurgaon|gurugram|noida|chennai|kolkata|ahmedabad)\b",
    re.I,
)
REMOTE_RE = re.compile(r"\b(remote|anywhere|work from home)\b", re.I)

# (display name, ats, token). Workday tokens are "tenant|wdN|site".
GREENHOUSE = [
    ("Stripe", "stripe"),
    ("Airbnb", "airbnb"),
    ("Databricks", "databricks"),
    ("GitLab", "gitlab"),
    ("Coinbase", "coinbase"),
    ("Figma", "figma"),
    ("Discord", "discord"),
    ("Cloudflare", "cloudflare"),
    ("Datadog", "datadog"),
    ("Elastic", "elastic"),
    ("MongoDB", "mongodb"),
    ("Twilio", "twilio"),
    ("Okta", "okta"),
    ("Pinterest", "pinterest"),
    ("Robinhood", "robinhood"),
    ("Instacart", "instacart"),
    ("DoorDash", "doordashusa"),
    ("Lyft", "lyft"),
    ("Reddit", "reddit"),
    ("Duolingo", "duolingo"),
    ("Asana", "asana"),
    ("Brex", "brex"),
    ("Plaid", "plaid"),
    ("Affirm", "affirm"),
    ("Grafana Labs", "grafanalabs"),
    ("Samsara", "samsara"),
    ("Vercel", "vercel"),
    ("Mixpanel", "mixpanel"),
    ("Amplitude", "amplitude"),
    ("Fivetran", "fivetran"),
    ("dbt Labs", "dbtlabsinc"),
    ("Scale AI", "scaleai"),
    ("Webflow", "webflow"),
    ("Gusto", "gusto"),
    ("Carta", "carta"),
    ("Intercom", "intercom"),
    ("Flexport", "flexport"),
    ("Airtable", "airtable"),
    ("PagerDuty", "pagerduty"),
    ("New Relic", "newrelic"),
    ("Braze", "braze"),
    ("CircleCI", "circleci"),
    ("LaunchDarkly", "launchdarkly"),
    ("Postman", "postman"),
    ("Razorpay", "razorpaysoftwareprivatelimited"),
    ("Razorpay (alt)", "razorpay"),
    ("Groww", "groww"),
    ("Juspay", "juspay"),
    ("BrowserStack", "browserstack"),
    ("InMobi", "inmobi"),
    ("ThoughtSpot", "thoughtspot"),
    ("Dream11", "dreamsports"),
    ("PhonePe", "phonepe"),
    ("Zeta", "zeta"),
    ("Sprinklr", "sprinklr"),
    ("Cohesity", "cohesity"),
    ("Nutanix", "nutanix"),
    ("Zscaler", "zscaler"),
    ("Wiz", "wizinc"),
    ("Rubrik", "rubrik"),
    ("Anthropic", "anthropic"),
    ("Roblox", "roblox"),
    ("Unity", "unity3d"),
    ("Squarespace", "squarespace"),
    ("Toast", "toast"),
    ("Snyk", "snyk"),
    ("HashiCorp", "hashicorp"),
    ("Segment", "segment"),
    ("Medium", "medium"),
    ("Khan Academy", "khanacademy"),
    ("Lucid", "lucidsoftware"),
    ("Contentful", "contentful"),
    ("Sumo Logic", "sumologic"),
    ("Quora", "quora"),
    ("Zillow", "zillow"),
    ("Pure Storage", "purestorage"),
    ("Arista", "aristanetworks"),
    ("Nvidia (gh)", "nvidia"),
    ("Mozilla", "mozilla"),
    ("Wikimedia", "wikimedia"),
    ("Hugging Face", "huggingface"),
    ("Mercari", "mercari"),
    ("ClickUp", "clickup"),
    ("Zapier", "zapier"),
    ("Canva", "canva"),
]
LEVER = [
    ("Palantir", "palantir"),
    ("Spotify", "spotify"),
    ("Meesho", "meesho"),
    ("CRED", "cred"),
    ("Swiggy", "swiggy"),
    ("ShareChat", "sharechat"),
    ("Paytm", "paytm"),
    ("Lendingkart", "lendingkart"),
    ("Rapido", "rapido"),
    ("Slice", "sliceit"),
    ("Jupiter", "jupiter"),
    ("Cars24", "cars24"),
    ("upGrad", "upgrad"),
    ("Unacademy", "unacademy"),
    ("ClearTax", "cleartax"),
    ("Mindtickle", "mindtickle"),
    ("Hasura", "hasura"),
    ("Chargebee", "chargebee"),
    ("CleverTap", "clevertap"),
    ("Whatfix", "whatfix"),
    ("Uniphore", "uniphore"),
    ("Innovaccer", "innovaccer"),
    ("Druva", "druva"),
    ("MPL", "mpl"),
    ("Zepto", "zepto"),
    ("Atlassian", "atlassian"),
    ("Netflix", "netflix"),
    ("Kuku FM", "kukufm"),
    ("Urban Company", "urbancompany"),
    ("Dunzo", "dunzo"),
    ("Udaan", "udaan"),
    ("PharmEasy", "pharmeasy"),
    ("Vedantu", "vedantu"),
    ("Zomato", "zomato"),
    ("Nykaa", "nykaa"),
    ("Freshworks", "freshworks"),
    ("Postman (lever)", "postman"),
    ("Navi", "navi"),
    ("Open Financial", "open"),
    ("Gojek", "gojek"),
    ("Zoho", "zoho"),
    ("Kissflow", "kissflow"),
    ("Ola", "olacabs"),
    ("Sarvam AI", "sarvam"),
    ("Eightfold", "eightfoldai"),
    ("Highspot", "highspot"),
    ("Tekion", "tekion"),
    ("Turing", "turing"),
    ("Toptal", "toptal"),
    ("Arcesium", "arcesium"),
    ("Thoughtworks", "thoughtworks"),
    ("Coursera", "coursera"),
    ("Wealthfront", "wealthfront"),
    ("Plaid (lever)", "plaid"),
    ("Yugabyte", "yugabyte"),
]
ASHBY = [
    ("Ramp", "ramp"),
    ("Notion", "notion"),
    ("Linear", "linear"),
    ("OpenAI", "openai"),
    ("Supabase", "supabase"),
    ("Deel", "deel"),
    ("Replit", "replit"),
    ("Zapier (ashby)", "zapier"),
    ("Retool", "retool"),
    ("Mercury", "mercury"),
    ("Perplexity", "perplexity"),
    ("Cohere", "cohere"),
    ("Harvey", "harvey"),
    ("Runway", "runway"),
    ("PostHog", "posthog"),
    ("Sourcegraph", "sourcegraph"),
    ("Temporal", "temporal"),
    ("Modal", "modal"),
    ("Pinecone", "pinecone"),
    ("ClickHouse", "clickhouse"),
    ("Neon", "neon"),
    ("Airbyte", "airbyte"),
    ("Vanta", "vanta"),
    ("Lattice", "lattice"),
    ("Cursor (Anysphere)", "anysphere"),
    ("ElevenLabs", "elevenlabs"),
    ("Synthesia", "synthesia"),
    ("LangChain", "langchain"),
    ("Resend", "resend"),
    ("Cal.com", "cal"),
    ("Zepto (ashby)", "zepto"),
    ("Sarvam AI (ashby)", "sarvam"),
    ("Postman (ashby)", "postman"),
    ("Krutrim", "krutrim"),
    ("Vercel (ashby)", "vercel"),
    ("Anthropic (ashby)", "anthropic"),
    ("Weights & Biases", "wandb"),
    ("Fireworks AI", "fireworks-ai"),
    ("Together AI", "together-ai"),
    ("Mistral", "mistral"),
    ("Hex", "hex"),
    ("Whop", "whop"),
    ("Clerk", "clerk"),
    ("Sentry", "sentry"),
    ("Grammarly", "grammarly"),
    ("Statsig", "statsig"),
    ("Descript", "descript"),
    ("Loom", "loom"),
    ("Segment (ashby)", "segment"),
    ("Rippling", "rippling"),
]
SMARTRECRUITERS = [
    ("Freshworks (sr)", "Freshworks"),
    ("Bosch", "BoschGroup"),
    ("Ubisoft", "Ubisoft2"),
    ("Equinix", "Equinix"),
    ("ServiceNow", "ServiceNow"),
    ("Visa", "Visa"),
    ("Publicis", "PublicisGroupe"),
    ("McDonald's", "McDonaldsCorporation"),
    ("Skechers", "Skechers"),
    ("Infosys", "Infosys"),
    ("Wipro", "Wipro"),
    ("TCS", "TataConsultancyServices"),
    ("Sodexo", "Sodexo"),
    ("Experian", "Experian"),
    ("LinkedIn", "LinkedIn3"),
    ("Dentsu", "DentsuInternational"),
    ("Capgemini", "Capgemini"),
    ("Siemens", "Siemens"),
    ("Nagarro", "Nagarro"),
    ("EPAM", "EPAM"),
]
WORKDAY = [
    ("NVIDIA", "nvidia|wd5|NVIDIAExternalCareerSite"),
    ("Adobe", "adobe|wd5|external_experienced"),
    ("Salesforce", "salesforce|wd12|External_Career_Site"),
    ("Intel", "intel|wd1|External"),
    ("Cisco", "cisco|wd5|Cisco_Careers"),
    ("Dell", "dell|wd1|External"),
    ("Mastercard", "mastercard|wd1|CorporateCareers"),
    ("Walmart", "walmart|wd5|WalmartExternal"),
    ("PayPal", "paypal|wd1|jobs"),
    ("Workday", "workday|wd5|Workday"),
    ("Qualcomm", "qualcomm|wd12|External"),
    ("Micron", "micron|wd1|External"),
    ("Capgemini (wd)", "capgemini|wd3|capgemini"),
    ("HP", "hp|wd5|ExternalCareerSite"),
    ("Texas Instruments", "ti|wd1|External"),
    ("Snowflake", "snowflake|wd1|Snowflake"),
    ("VMware/Broadcom", "broadcom|wd1|External_Career"),
    ("Autodesk", "autodesk|wd1|Ext"),
    ("Zebra", "zebra|wd1|Zebra"),
    ("Western Digital", "wdc|wd1|WDC"),
    ("Fidelity", "fmr|wd1|FidelityCareers"),
    ("American Express", "aexp|wd5|Amex"),
    ("Citi", "citi|wd5|2"),
    ("Goldman Sachs", "gs|wd1|GS"),
    ("Morgan Stanley", "ms|wd5|External"),
    ("JPMorgan (oracle)", "jpmc|wd5|External"),
]


@dataclass
class Result:
    name: str
    ats: str
    token: str
    ok: bool
    jobs: int = 0
    interns: int = 0
    india: int = 0
    remote: int = 0
    error: str = ""


def _score(titles_locs: list[tuple[str, str]]) -> tuple[int, int, int, int]:
    jobs = len(titles_locs)
    interns = sum(1 for t, _ in titles_locs if INTERN_RE.search(t))
    india = sum(1 for _, loc in titles_locs if INDIA_RE.search(loc or ""))
    remote = sum(1 for _, loc in titles_locs if REMOTE_RE.search(loc or ""))
    return jobs, interns, india, remote


async def check(
    client: httpx.AsyncClient, sem: asyncio.Semaphore, name: str, ats: str, token: str
) -> Result:
    async with sem:
        await asyncio.sleep(0.15)
        try:
            if ats == "greenhouse":
                r = await client.get(f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs")
                if r.status_code != 200:
                    return Result(name, ats, token, False, error=f"HTTP {r.status_code}")
                rows = [
                    (j.get("title", ""), (j.get("location") or {}).get("name", ""))
                    for j in r.json().get("jobs", [])
                ]
            elif ats == "lever":
                r = await client.get(
                    f"https://api.lever.co/v0/postings/{token}",
                    params={"mode": "json", "limit": 500},
                )
                if r.status_code != 200:
                    return Result(name, ats, token, False, error=f"HTTP {r.status_code}")
                rows = [
                    (
                        j.get("text", ""),
                        (j.get("categories") or {}).get("location", "")
                        or j.get("workplaceType", ""),
                    )
                    for j in r.json()
                ]
            elif ats == "ashby":
                r = await client.get(f"https://api.ashbyhq.com/posting-api/job-board/{token}")
                if r.status_code != 200:
                    return Result(name, ats, token, False, error=f"HTTP {r.status_code}")
                rows = [
                    (
                        j.get("title", ""),
                        (j.get("location") or "") + (" remote" if j.get("isRemote") else ""),
                    )
                    for j in r.json().get("jobs", [])
                ]
            elif ats == "smartrecruiters":
                r = await client.get(
                    f"https://api.smartrecruiters.com/v1/companies/{token}/postings",
                    params={"limit": 100},
                )
                if r.status_code != 200:
                    return Result(name, ats, token, False, error=f"HTTP {r.status_code}")
                content = r.json().get("content", [])
                rows = [
                    (
                        j.get("name", ""),
                        f"{(j.get('location') or {}).get('city', '')} {(j.get('location') or {}).get('country', '')}"
                        + (" remote" if (j.get("location") or {}).get("remote") else ""),
                    )
                    for j in content
                ]
            elif ats == "workday":
                tenant, wd, site = token.split("|")
                r = await client.post(
                    f"https://{tenant}.{wd}.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs",
                    json={"appliedFacets": {}, "limit": 20, "offset": 0, "searchText": "intern"},
                )
                if r.status_code != 200:
                    return Result(name, ats, token, False, error=f"HTTP {r.status_code}")
                body = r.json()
                rows = [
                    (j.get("title", ""), j.get("locationsText", ""))
                    for j in body.get("jobPostings", [])
                ]
                total = int(body.get("total", 0))
                jobs, interns, india, remote = _score(rows)
                return Result(
                    name,
                    ats,
                    token,
                    total > 0,
                    jobs=total,
                    interns=max(interns, 1 if total else 0),
                    india=india,
                    remote=remote,
                )
            else:
                return Result(name, ats, token, False, error="unknown ats")
        except Exception as exc:  # noqa: BLE001 - verification tool: report, never crash
            return Result(name, ats, token, False, error=type(exc).__name__)
    jobs, interns, india, remote = _score(rows)
    return Result(
        name,
        ats,
        token,
        jobs > 0 and (interns > 0 or india > 0 or remote > 0),
        jobs,
        interns,
        india,
        remote,
    )


async def run() -> list[Result]:
    sem = asyncio.Semaphore(6)
    limits = httpx.Limits(max_connections=8)
    async with httpx.AsyncClient(
        headers={"User-Agent": UA}, timeout=30, limits=limits, follow_redirects=True
    ) as client:
        tasks = []
        for ats, items in (
            ("greenhouse", GREENHOUSE),
            ("lever", LEVER),
            ("ashby", ASHBY),
            ("smartrecruiters", SMARTRECRUITERS),
            ("workday", WORKDAY),
        ):
            tasks += [check(client, sem, n, ats, t) for n, t in items]
        return await asyncio.gather(*tasks)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    results = asyncio.run(run())
    good = [r for r in results if r.ok]
    # One entry per (ats, token); drop alternates of the same company (e.g. "Razorpay (alt)").
    seen: dict[str, Result] = {}
    for r in sorted(good, key=lambda x: (-x.jobs, x.name)):
        key = re.sub(r"\s*\(.*\)$", "", r.name).lower()
        seen.setdefault(f"{key}|{r.ats}", r)
    by_company: dict[str, Result] = {}
    for key, r in seen.items():
        by_company.setdefault(
            key.split("|")[0], r
        )  # keep the board with the most postings per company
    kept = sorted(by_company.values(), key=lambda x: x.name.lower())
    print(
        f"checked {len(results)} candidates, {len(good)} passed, {len(kept)} unique companies kept"
    )
    for r in kept:
        print(
            f"  OK   {r.ats:15} {r.name:24} token={r.token:34} jobs={r.jobs:4} interns={r.interns:3} india={r.india:3} remote={r.remote:3}"
        )
    print(
        "rejected:",
        ", ".join(
            f"{r.name}[{r.ats}:{r.error or 'no relevant postings'}]" for r in results if not r.ok
        )[:3000],
    )
    if args.write:
        out = Path(__file__).resolve().parent.parent / "data" / "ats_companies.yaml"
        out.parent.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now(UTC).strftime("%Y-%m-%d")
        companies = [
            {
                "name": re.sub(r"\s*\(.*\)$", "", r.name),
                "ats": r.ats,
                "token": r.token,
                "verified_at": stamp,
                "note": f"{r.jobs} postings; {r.interns} intern/grad-style; {r.india} India; {r.remote} remote at verification",
            }
            for r in kept
        ]
        header = (
            "# Companies scanned on every full scan. Each token was verified LIVE (HTTP 200 + postings + an intern/graduate-style\n"
            "# role or an India/remote location). Regenerate with: uv run python tools/verify_ats.py --write\n"
            "# Workday tokens are tenant|wdN|site.\n"
        )
        out.write_text(
            header + yaml.safe_dump({"companies": companies}, sort_keys=False, allow_unicode=True),
            encoding="utf-8",
        )
        print(f"wrote {out} ({len(companies)} companies)")


if __name__ == "__main__":
    main()
