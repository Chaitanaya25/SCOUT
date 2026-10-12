import { describe, expect, it } from "vitest";

import { companyKeyword, referralLinks, roleKeyword } from "./referrals";

describe("referrals", () => {
  it("cleans company and role keywords", () => {
    expect(companyKeyword("Stripe, Inc.")).toBe("Stripe");
    expect(companyKeyword("Razorpay Software Pvt Ltd")).toBe("Razorpay Software");
    expect(roleKeyword("Backend Engineer Intern (Payments) - Summer 2026")).toBe("Backend Engineer");
    expect(roleKeyword("Sr. Machine Learning Engineer II")).toBe("Machine Learning Engineer");
  });

  it("builds three LinkedIn people-search links when a college is known", () => {
    const links = referralLinks({ company: "Stripe Inc.", title: "ML Intern", college: "IIT Delhi" });
    expect(links).toHaveLength(3);
    for (const l of links) {
      const u = new URL(l.url);
      expect(u.origin + u.pathname).toBe("https://www.linkedin.com/search/results/people/");
    }
    expect(new URL(links[0].url).searchParams.get("keywords")).toBe("Stripe ML");
    expect(new URL(links[1].url).searchParams.get("keywords")).toBe("Stripe");
    expect(new URL(links[2].url).searchParams.get("keywords")).toBe("Stripe IIT Delhi");
  });

  it("omits the alumni link without a college and encodes safely", () => {
    const links = referralLinks({ company: "A&B <Co>", title: "Engineer", college: null });
    expect(links).toHaveLength(2);
    expect(links[0].url).not.toContain("<");
    expect(new URL(links[1].url).searchParams.get("keywords")).toBe("A&B <Co>");
  });
});
