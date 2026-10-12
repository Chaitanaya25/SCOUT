"""Minimal robots.txt matcher with RFC 9309 wildcards (`*`, `$`) — Python's urllib.robotparser ignores them,
and sites like Internshala rely on rules such as `Disallow: /*,*`."""

import re
from dataclasses import dataclass, field
from urllib.parse import urlsplit

AGENT = "scoutradar"


@dataclass
class RobotsRules:
    allow: list[str] = field(default_factory=list)
    disallow: list[str] = field(default_factory=list)
    crawl_delay: float | None = None

    @staticmethod
    def _regex(pattern: str) -> re.Pattern[str]:
        anchored = pattern.endswith("$")
        body = re.escape(pattern.rstrip("$")).replace(r"\*", ".*")
        return re.compile("^" + body + ("$" if anchored else ""))

    def allowed(self, url_or_path: str) -> bool:
        """Longest matching rule wins; Allow wins ties; no match means allowed."""
        parts = urlsplit(url_or_path)
        path = parts.path or "/"
        if parts.query:
            path += "?" + parts.query
        best_len, verdict = -1, True
        for rules, allowed in ((self.disallow, False), (self.allow, True)):
            for rule in rules:
                if not rule:
                    continue
                if self._regex(rule).match(path):
                    length = len(rule)
                    if length > best_len or (length == best_len and allowed):
                        best_len, verdict = length, allowed
        return verdict


def parse_robots(text: str) -> RobotsRules:
    """Rules from the group for our agent if present, otherwise the `*` group."""
    groups: dict[str, RobotsRules] = {}
    current: list[str] = []
    seen_rule = False
    for raw in text.splitlines():
        line = raw.split("#", 1)[0].strip()
        if ":" not in line:
            continue
        key, value = (p.strip() for p in line.split(":", 1))
        key = key.lower()
        if key == "user-agent":
            if seen_rule:
                current, seen_rule = [], False
            agent = value.lower()
            current.append(agent)
            groups.setdefault(agent, RobotsRules())
        elif key in ("allow", "disallow", "crawl-delay") and current:
            seen_rule = True
            for agent in current:
                g = groups[agent]
                if key == "allow":
                    g.allow.append(value)
                elif key == "disallow":
                    g.disallow.append(value)
                else:
                    try:
                        g.crawl_delay = float(value)
                    except ValueError:
                        pass
    return groups.get(AGENT) or groups.get("*") or RobotsRules()
