import { describe, expect, it } from "vitest";
import { isWorldwide } from "./filters";

describe("isWorldwide", () => {
  it("passes a role with no location signal at all", () => {
    expect(isWorldwide("Senior Frontend Engineer", "Acme Inc")).toBe(true);
  });

  it("rejects a role with an explicit region restriction", () => {
    expect(isWorldwide("Frontend Engineer (US only)", "Acme Inc")).toBe(
      false,
    );
  });

  it("rejects common region-restriction phrasing", () => {
    expect(isWorldwide("Engineer - must reside in Germany", "Acme")).toBe(
      false,
    );
    expect(isWorldwide("Engineer - UK only", "Acme")).toBe(false);
    expect(isWorldwide("Engineer - EST timezone required", "Acme")).toBe(
      false,
    );
  });

  it("is case-insensitive for red flags", () => {
    expect(isWorldwide("Frontend Engineer (us ONLY)", "Acme")).toBe(false);
  });

  it("an explicit green flag overrides a red flag in the same text", () => {
    expect(
      isWorldwide("Frontend Engineer - Worldwide (no North America)", "Acme"),
    ).toBe(true);
  });

  it("passes roles with explicit global language", () => {
    expect(isWorldwide("Frontend Engineer - Remote Worldwide", "Acme")).toBe(
      true,
    );
    expect(isWorldwide("Engineer, Distributed team", "Acme")).toBe(true);
    expect(isWorldwide("Work from anywhere Engineer", "Acme")).toBe(true);
  });

  it("checks the company name too, not just the title", () => {
    expect(isWorldwide("Frontend Engineer", "Acme (US Only)")).toBe(false);
  });
});
