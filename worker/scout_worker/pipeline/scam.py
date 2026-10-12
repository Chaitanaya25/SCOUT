"""Scam heuristics (ARCHITECTURE.md §7.4): none / low / high plus short human-readable reasons.

high: an explicit fee/deposit demand. Low signals add up: two or more → high. Gemini scoring can only RAISE the risk.
"""

import re

from scout_worker.models import ScamRisk

HIGH_RULES: list[tuple[re.Pattern[str], str]] = [
    (
        re.compile(
            r"\b(registration|training|joining|admission|kit|security|processing|application)\s+(fee|fees|charges?)\b",
            re.I,
        ),
        "Asks for a registration/training/processing fee",
    ),
    (re.compile(r"\b(refundable\s+)?(security\s+)?deposit\b", re.I), "Mentions a deposit"),
    (
        re.compile(
            r"\bpay(ment)?\s+(to|for)\s+(join|apply|register|get\s+(the\s+)?(job|placed))\b", re.I
        ),
        "Asks you to pay to join or apply",
    ),
    (
        re.compile(r"\bpay\s+(a\s+)?(small\s+)?(fee|amount)\s+(before|to|for)\b", re.I),
        "Asks for a fee before starting",
    ),
]
_WHATSAPP = re.compile(
    r"(contact|apply|send|reach|message|call).{0,60}(whatsapp|telegram)|whatsapp\s*(us|only|number|no\.?)",
    re.I,
)
_PERSONAL_EMAIL = re.compile(r"[\w.+-]+@(gmail|yahoo|outlook|hotmail|rediffmail)\.(com|in)\b", re.I)
_UNREALISTIC_PAY = re.compile(
    r"\bearn\s*(up\s*to\s*)?(rs\.?|inr|₹|\$)?\s*\d[\d,]{3,}\s*(/|per|a)\s*(day|week)\b", re.I
)
_NO_INTERVIEW = re.compile(r"\bno\s+interview\b", re.I)
_IMMEDIATE = re.compile(r"\bimmediate\s+joining\b", re.I)
_WFH = re.compile(r"\bwork\s+from\s+home\b", re.I)
_ANON_COMPANY = {"", "confidential", "na", "n/a", "hiring", "company", "anonymous", "undisclosed"}


def assess_scam(
    title: str, company: str, description: str | None, *, is_ats: bool = False
) -> tuple[ScamRisk, list[str]]:
    """Returns (risk, reasons). `is_ats`: jobs fetched from an ATS board are first-party; personal-email recruiter
    signals are ignored for them."""
    text = f"{title}\n{description or ''}"
    reasons: list[str] = []
    for pattern, reason in HIGH_RULES:
        if pattern.search(text):
            reasons.append(reason)
    if reasons:
        return "high", list(dict.fromkeys(reasons))

    low: list[str] = []
    if _WHATSAPP.search(text):
        low.append("Contact only via WhatsApp/Telegram")
    if not is_ats and _PERSONAL_EMAIL.search(text):
        low.append("Recruiter uses a personal email address")
    if _UNREALISTIC_PAY.search(text):
        low.append("Unrealistic pay claim")
    if _NO_INTERVIEW.search(text) and _IMMEDIATE.search(text) and _WFH.search(text):
        low.append("'No interview' + 'immediate joining' + work from home")
    if company.strip().lower() in _ANON_COMPANY:
        low.append("Company name missing")
    if len(low) >= 2:
        return "high", low
    return ("low", low) if low else ("none", [])


_ORDER = {"none": 0, "low": 1, "high": 2}


def raise_risk(current: ScamRisk, signals: list[str]) -> tuple[ScamRisk, list[str]]:
    """Apply validated Gemini scam signals: 1 signal → at least low, 2+ → high. Never lowers the risk."""
    candidate: ScamRisk = "high" if len(signals) >= 2 else "low" if signals else "none"
    return (candidate if _ORDER[candidate] > _ORDER[current] else current), signals
