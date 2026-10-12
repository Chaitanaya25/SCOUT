"""Internshala — HTML scrape of public category listing pages only.

robots.txt (checked at run time with wildcard support) forbids detail/search pages, URLs with `,` or `?`,
and /api/. We fetch only `/internships/<keywords>-internship/` listings, 1 request per 2s, and never open detail pages.
"""

import re
from typing import Any

import httpx
from selectolax.lexbor import LexborHTMLParser as HTMLParser

from scout_worker.http import fetch_robots, get_text
from scout_worker.models import FetchContext, RawJob
from scout_worker.relevance import feed_prefilter
from scout_worker.sources.base import Source

BASE = "https://internshala.com"
MAX_PER_PAGE = 20


def listing_path(role: str) -> str | None:
    slug = re.sub(
        r"[^a-z0-9]+", "-", re.sub(r"\b(intern|interns|internship|internships)\b", "", role.lower())
    ).strip("-")
    return f"/internships/{slug}-internship/" if slug else None


def parse_internshala(html_text: str, ctx: FetchContext) -> list[RawJob]:
    tree = HTMLParser(html_text)
    jobs: list[RawJob] = []
    for card in tree.css("div.individual_internship")[:MAX_PER_PAGE]:
        internship_id = (
            card.attributes.get("internshipid") or card.attributes.get("internshipId") or ""
        )
        href = card.attributes.get("data-href") or ""
        title_node = card.css_first(".job-title-href")
        company_node = card.css_first(".company-name")
        if not (internship_id and href and title_node and company_node):
            continue
        title = title_node.text(strip=True)
        company = company_node.text(strip=True)
        location = " / ".join(a.text(strip=True) for a in card.css(".locations a")) or None
        stipend = card.css_first(".stipend")
        meta_values: list[str] = [
            n.text(strip=True) for n in card.css(".row-1-item span") if n.text(strip=True)
        ]
        skills = [n.text(strip=True) for n in card.css(".job_skill")]
        about = card.css_first(".about_job .text")
        posted = card.css_first(".status-inactive span, .status-success span")
        description = "\n".join(
            filter(
                None,
                [
                    about.text(strip=True) if about else "",
                    f"Skills: {', '.join(skills)}" if skills else "",
                    f"Stipend: {stipend.text(strip=True)}" if stipend else "",
                    f"Details: {' | '.join(meta_values)}" if meta_values else "",
                ],
            )
        )
        is_remote = bool(location and re.search(r"work from home", location, re.I))
        if not feed_prefilter(
            title, location or "India", ctx.roles, ctx.locations, is_remote or None
        ):
            continue
        extra: dict[str, Any] = {
            "stipend": stipend.text(strip=True) if stipend else None,
            "skills": skills,
        }
        jobs.append(
            RawJob(
                source="internshala",
                source_id=internship_id,
                title=title,
                company=company,
                location=location,
                description=description,
                url=f"{BASE}{href}",
                posted_at=posted.text(strip=True) if posted else None,
                is_remote=is_remote or None,
                job_type_hint="internship",
                extra=extra,
            )
        )
    return jobs


class Internshala(Source):
    name = "internshala"
    kind = "scrape"

    async def fetch(self, ctx: FetchContext, client: httpx.AsyncClient) -> list[RawJob]:
        rules = await fetch_robots(client, BASE)
        jobs: list[RawJob] = []
        for role in ctx.role_terms(3):
            path = listing_path(role)
            if not path:
                continue
            if not rules.allowed(path):
                self.notes.append(f"robots.txt disallows {path}; skipped")
                continue
            interval = max(2.0, rules.crawl_delay or 0.0)
            jobs.extend(
                parse_internshala(
                    await get_text(
                        client, f"{BASE}{path}", throttle=self.throttle, interval=interval
                    ),
                    ctx,
                )
            )
        return jobs
