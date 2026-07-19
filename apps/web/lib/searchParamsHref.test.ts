import { describe, expect, it } from "vitest";
import { withPage } from "./searchParamsHref";

describe("withPage", () => {
  it("preserves existing filters while changing only the page number", () => {
    const href = withPage({ q: "coffee", city: "Jakarta", page: "2" }, 3);
    const params = new URLSearchParams(href.slice(1));
    expect(params.get("q")).toBe("coffee");
    expect(params.get("city")).toBe("Jakarta");
    expect(params.get("page")).toBe("3");
  });

  it("drops undefined values instead of serializing them as the string 'undefined'", () => {
    const href = withPage({ q: undefined, page: "1" }, 2);
    expect(href).not.toContain("undefined");
  });
});
