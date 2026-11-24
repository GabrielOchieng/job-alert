import { describe, expect, it } from "vitest";
import { buildTailoredPdfBuffer } from "./pdf-helper";

describe("buildTailoredPdfBuffer", () => {
  it("produces a non-empty PDF buffer server-side", () => {
    const buffer = buildTailoredPdfBuffer(
      {
        optimizedSummary: "A tailored summary.",
        suggestedBulletPoints: ["Shipped a thing", "Fixed a thing"],
        keyKeywordsMissing: ["GraphQL"],
      },
      { company: "Acme" },
    );

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
  });
});
