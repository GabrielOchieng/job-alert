import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logError, reportFailure } from "./alert.mjs";

describe("logError", () => {
  it("logs a structured JSON line with the scope and error message", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logError("test-scope", new Error("boom"), { extra: 1 });

    expect(spy).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(spy.mock.calls[0][0]);
    expect(logged.scope).toBe("test-scope");
    expect(logged.message).toBe("boom");
    expect(logged.level).toBe("error");
    expect(logged.extra).toBe(1);

    spy.mockRestore();
  });
});

describe("reportFailure", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    process.exitCode = undefined;
    vi.restoreAllMocks();
  });

  it("sets a non-zero exit code so the CI run shows as failed", async () => {
    delete process.env.MY_EMAIL;
    delete process.env.RESEND_API_KEY;

    await reportFailure("test-scope", new Error("boom"));

    expect(process.exitCode).toBe(1);
  });

  it("skips sending an email when MY_EMAIL or RESEND_API_KEY is missing", async () => {
    delete process.env.MY_EMAIL;
    delete process.env.RESEND_API_KEY;

    // Should resolve without throwing even though no alert can be sent.
    await expect(reportFailure("test-scope", new Error("boom"))).resolves.toBeUndefined();
  });
});
