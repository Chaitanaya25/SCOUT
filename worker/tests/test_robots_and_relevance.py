from scout_worker.relevance import ats_prefilter, feed_prefilter, location_ok, remote_region_ok
from scout_worker.robots import parse_robots

INTERNSHALA_ROBOTS = """
User-Agent: *
Disallow: /*,*
Disallow: /*?*
Disallow: /api/
Disallow: /internship/details/
Disallow: /internship/search/
Allow: /favicon.ico?*

User-Agent: Baiduspider
Crawl-delay: 1
"""


def test_robots_wildcards_and_listing_paths():
    rules = parse_robots(INTERNSHALA_ROBOTS)
    assert rules.allowed("/internships/machine-learning-internship/")
    assert not rules.allowed("/internship/details/foo")
    assert not rules.allowed("/internship/search/x")
    assert not rules.allowed("/internships/a,b-internship/")  # Disallow: /*,*
    assert not rules.allowed("/internships/x/?page=2")  # Disallow: /*?*
    assert not rules.allowed("/api/anything")


def test_robots_longest_match_and_allow_ties():
    rules = parse_robots("User-agent: *\nDisallow: /private\nAllow: /private/public\n")
    assert rules.allowed("/private/public/page")
    assert not rules.allowed("/private/other")
    assert parse_robots("").allowed("/anything")


def test_robots_dollar_anchor_and_agent_group():
    rules = parse_robots("User-agent: scoutradar\nDisallow: /x$\n\nUser-agent: *\nDisallow: /\n")
    assert not rules.allowed("/x")
    assert rules.allowed("/x/y")  # our own group wins over '*'


def test_remote_region():
    assert remote_region_ok("Worldwide")
    assert remote_region_ok("Anywhere in the World")
    assert remote_region_ok("India")
    assert remote_region_ok(None)
    assert not remote_region_ok("USA Only")
    assert not remote_region_ok("Europe")
    assert not remote_region_ok("Canada only")


def test_location_ok():
    assert location_ok("Bengaluru, Karnataka", [])
    assert location_ok("Remote - EU", [])
    assert location_ok("Austin, TX", ["Austin"])
    assert not location_ok("Austin, TX", ["India"])


def test_prefilters(ctx):
    roles, locs = ctx.roles, ctx.locations
    assert feed_prefilter("Machine Learning Intern", "Bangalore", roles, locs)
    assert not feed_prefilter("Senior Backend Engineer", "Bangalore", roles, locs)  # senior
    assert not feed_prefilter("Sales Development Representative", "Remote", roles, locs)  # noise
    assert not feed_prefilter("Software Engineer Intern", "Berlin", roles, locs)  # location
    assert ats_prefilter("Backend Engineer Intern", "Remote", roles, locs)
    assert ats_prefilter("Machine Learning Engineer", "India", roles, locs)  # role keyword overlap
    assert not ats_prefilter("Product Engineer", "India", roles, locs)  # no entry marker or keyword
