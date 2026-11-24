import { describe, expect, it, vi, beforeEach } from "vitest";

const generateTextMock = vi.fn();

vi.mock("ai", () => ({
  generateText: (...args: any[]) => generateTextMock(...args),
  Output: { object: (opts: any) => opts },
}));

vi.mock("@ai-sdk/google", () => ({
  google: (model: string) => ({ model }),
}));

import { generateApplicationEmail, generateTailoredResumeData } from "./applications";

const job = { title: "Frontend Engineer", company: "Acme", description: "Build things" };

describe("generateTailoredResumeData", () => {
  beforeEach(() => generateTextMock.mockReset());

  it("returns the primary model's structured output", async () => {
    generateTextMock.mockResolvedValueOnce({
      output: {
        optimizedSummary: "Summary",
        suggestedBulletPoints: ["Did a thing"],
        keyKeywordsMissing: ["GraphQL"],
      },
    });

    const result = await generateTailoredResumeData("resume text", job);

    expect(result.optimizedSummary).toBe("Summary");
    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to the backup model on a 429", async () => {
    generateTextMock
      .mockRejectedValueOnce(Object.assign(new Error("rate limited"), { statusCode: 429 }))
      .mockResolvedValueOnce({
        output: {
          optimizedSummary: "Backup summary",
          suggestedBulletPoints: [],
          keyKeywordsMissing: [],
        },
      });

    const result = await generateTailoredResumeData("resume text", job);

    expect(result.optimizedSummary).toBe("Backup summary");
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it("rethrows a non-retryable error without falling back", async () => {
    generateTextMock.mockRejectedValueOnce(
      Object.assign(new Error("bad request"), { statusCode: 400 }),
    );

    await expect(generateTailoredResumeData("resume text", job)).rejects.toThrow(
      "bad request",
    );
    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });
});

describe("generateApplicationEmail", () => {
  beforeEach(() => generateTextMock.mockReset());

  it("returns a subject and body", async () => {
    generateTextMock.mockResolvedValueOnce({
      output: { subject: "Application for Frontend Engineer", body: "Dear hiring team..." },
    });

    const result = await generateApplicationEmail("resume text", job);

    expect(result.subject).toContain("Frontend Engineer");
    expect(result.body.length).toBeGreaterThan(0);
  });
});
