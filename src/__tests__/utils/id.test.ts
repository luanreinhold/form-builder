import { afterEach, describe, expect, it, vi } from "vitest";
import { generateId } from "@/utils/id";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("generateId", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gera UUID v4 valido", () => {
    expect(generateId()).toMatch(UUID_V4);
  });

  it("gera ids unicos", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateId()));
    expect(ids.size).toBe(1000);
  });

  it("fallback sem crypto.randomUUID gera UUID v4 valido", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: crypto.getRandomValues.bind(crypto),
    });
    expect(generateId()).toMatch(UUID_V4);
  });
});
