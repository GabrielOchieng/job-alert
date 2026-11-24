import { describe, expect, it, vi } from "vitest";
import { dedupeAndInsertJobs, findNewJobs, insertJobs } from "./db.mjs";

function makeFakeClient({ existingUrls = [], selectError = null, insertError = null } = {}) {
  const insertSpy = vi.fn().mockResolvedValue({ error: insertError });
  const client = {
    from: vi.fn(() => ({
      select: () => ({
        in: () =>
          Promise.resolve({
            data: existingUrls.map((url) => ({ url })),
            error: selectError,
          }),
      }),
      insert: insertSpy,
    })),
  };
  return { client, insertSpy };
}

describe("findNewJobs", () => {
  it("filters out jobs whose url already exists", async () => {
    const { client } = makeFakeClient({ existingUrls: ["https://a.com"] });
    const result = await findNewJobs(
      [{ url: "https://a.com" }, { url: "https://b.com" }],
      { client },
    );
    expect(result).toEqual([{ url: "https://b.com" }]);
  });

  it("de-dupes jobs sharing the same key within one batch", async () => {
    const { client } = makeFakeClient({ existingUrls: [] });
    const result = await findNewJobs(
      [{ url: "https://a.com", title: "first" }, { url: "https://a.com", title: "second" }],
      { client },
    );
    expect(result).toHaveLength(1);
  });

  it("drops jobs missing the key field", async () => {
    const { client } = makeFakeClient({ existingUrls: [] });
    const result = await findNewJobs([{ title: "no url" }], { client });
    expect(result).toEqual([]);
  });

  it("returns an empty array and logs on lookup failure", async () => {
    const { client } = makeFakeClient({ selectError: { message: "boom" } });
    const result = await findNewJobs([{ url: "https://a.com" }], { client });
    expect(result).toEqual([]);
  });
});

describe("insertJobs", () => {
  it("is a no-op for an empty list", async () => {
    const { client, insertSpy } = makeFakeClient();
    const ok = await insertJobs([], { client });
    expect(ok).toBe(true);
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("returns false when the insert fails", async () => {
    const { client } = makeFakeClient({ insertError: { message: "boom" } });
    const ok = await insertJobs([{ url: "https://a.com" }], { client });
    expect(ok).toBe(false);
  });
});

describe("dedupeAndInsertJobs", () => {
  it("only inserts the jobs that were actually new", async () => {
    const { client, insertSpy } = makeFakeClient({ existingUrls: ["https://a.com"] });
    const result = await dedupeAndInsertJobs(
      [{ url: "https://a.com" }, { url: "https://b.com" }],
      { client },
    );
    expect(result).toEqual([{ url: "https://b.com" }]);
    expect(insertSpy).toHaveBeenCalledWith([{ url: "https://b.com" }]);
  });

  it("skips the insert call entirely when nothing is new", async () => {
    const { client, insertSpy } = makeFakeClient({ existingUrls: ["https://a.com"] });
    const result = await dedupeAndInsertJobs([{ url: "https://a.com" }], { client });
    expect(result).toEqual([]);
    expect(insertSpy).not.toHaveBeenCalled();
  });
});
