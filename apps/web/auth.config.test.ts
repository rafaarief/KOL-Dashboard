import { describe, expect, it } from "vitest";
import { authConfig } from "./auth.config";

function authorize(role: string | undefined, pathname: string): boolean {
  const auth = role ? { user: { role, id: "u1" } } : null;
  const request = { nextUrl: { pathname } } as unknown as Request & { nextUrl: URL };
  const result = authConfig.callbacks!.authorized!({ auth, request } as never);
  return Boolean(result);
}

describe("role-based route authorization (auth.config authorized callback)", () => {
  it("blocks unauthenticated visitors from every protected area", () => {
    expect(authorize(undefined, "/admin")).toBe(false);
    expect(authorize(undefined, "/dashboard/creator")).toBe(false);
    expect(authorize(undefined, "/dashboard/brand")).toBe(false);
  });

  it("only admins may access /admin, including the KOL Finder and Business Leads sub-areas", () => {
    expect(authorize("admin", "/admin")).toBe(true);
    expect(authorize("admin", "/admin/kol-finder/search")).toBe(true);
    expect(authorize("admin", "/admin/business-leads")).toBe(true);
    expect(authorize("creator", "/admin")).toBe(false);
    expect(authorize("brand", "/admin")).toBe(false);
  });

  it("only creators (or admins) may access /dashboard/creator and /api/creator/*", () => {
    expect(authorize("creator", "/dashboard/creator/applications")).toBe(true);
    expect(authorize("admin", "/dashboard/creator")).toBe(true);
    expect(authorize("brand", "/dashboard/creator")).toBe(false);
    expect(authorize("creator", "/api/creator/applications")).toBe(true);
    expect(authorize("brand", "/api/creator/applications")).toBe(false);
  });

  it("only brands (or admins) may access /dashboard/brand and /api/brand/*", () => {
    expect(authorize("brand", "/dashboard/brand/campaigns")).toBe(true);
    expect(authorize("admin", "/dashboard/brand")).toBe(true);
    expect(authorize("creator", "/dashboard/brand")).toBe(false);
    expect(authorize("creator", "/api/brand/campaigns")).toBe(false);
  });

  it("leaves public marketplace routes open to everyone", () => {
    expect(authorize(undefined, "/campaigns")).toBe(true);
    expect(authorize(undefined, "/creators/some-username")).toBe(true);
    expect(authorize("creator", "/")).toBe(true);
  });

  // Regression test for a real gap found in Sprint 1.5 QA: the /admin/kol-finder and
  // /admin/business-leads *pages* were middleware-protected, but their underlying API
  // routes (inherited from the pre-OpenCollab app, which never had role-based auth) were
  // not — anyone who knew the URL could call them directly, bypassing the /admin gate
  // entirely (e.g. to trigger a paid Apify scrape or read the leads CRM unauthenticated).
  it("gates every KOL Finder / Business Leads API route behind admin, same as their pages", () => {
    const kolFinderAndLeadsApiPaths = [
      "/api/searches",
      "/api/searches/some-id",
      "/api/searches/some-id/cancel",
      "/api/searches/some-id/results",
      "/api/searches/some-id/export.csv",
      "/api/shortlists",
      "/api/shortlists/some-id/creators",
      "/api/shortlists/some-id/creators/entry-id",
      "/api/creators",
      "/api/creators/facets",
      "/api/creators/some-id/refresh",
      "/api/kols",
      "/api/kols/facets",
      "/api/dashboard/summary",
      "/api/leads",
      "/api/categories",
    ];

    for (const path of kolFinderAndLeadsApiPaths) {
      expect(authorize(undefined, path), `${path} should reject unauthenticated`).toBe(false);
      expect(authorize("creator", path), `${path} should reject a non-admin creator`).toBe(false);
      expect(authorize("brand", path), `${path} should reject a non-admin brand`).toBe(false);
      expect(authorize("admin", path), `${path} should allow admin`).toBe(true);
    }
  });

  it("does not accidentally gate the OpenCollab singular /api/creator/* or /api/marketplace/* behind the plural KOL Finder /api/creators prefix", () => {
    expect(authorize("creator", "/api/creator/profile")).toBe(true);
    expect(authorize(undefined, "/api/marketplace/categories")).toBe(true);
  });
});
