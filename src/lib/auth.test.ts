import { describe, expect, it } from "vitest";
import { isValidAdminPassword } from "./auth";

describe("isValidAdminPassword", () => {
  it("accepts a matching password", () => {
    expect(isValidAdminPassword("correct-horse", "correct-horse")).toBe(
      true,
    );
  });

  it("rejects a non-matching password of the same length", () => {
    expect(isValidAdminPassword("correct-horsf", "correct-horse")).toBe(
      false,
    );
  });

  it("rejects a shorter or longer guess without throwing", () => {
    expect(isValidAdminPassword("short", "correct-horse")).toBe(false);
    expect(isValidAdminPassword("way-too-long-guess", "correct-horse")).toBe(
      false,
    );
  });

  it("rejects an empty guess", () => {
    expect(isValidAdminPassword("", "correct-horse")).toBe(false);
  });
});
