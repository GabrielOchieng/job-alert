import { describe, expect, it } from "vitest";
import { sendNewLeadsEmail } from "./notify.mjs";

describe("sendNewLeadsEmail", () => {
  it("is a no-op and sends nothing when jobs is empty", async () => {
    const result = await sendNewLeadsEmail({
      from: "Test <onboarding@resend.dev>",
      to: "me@example.com",
      subject: "Test",
      heading: "Test",
      jobs: [],
    });
    expect(result).toEqual({ sent: false, reason: "no-jobs" });
  });

  it("is a no-op when jobs is undefined", async () => {
    const result = await sendNewLeadsEmail({
      from: "Test <onboarding@resend.dev>",
      to: "me@example.com",
      subject: "Test",
      heading: "Test",
    });
    expect(result).toEqual({ sent: false, reason: "no-jobs" });
  });
});
