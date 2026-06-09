import { describe, it, expect } from "vitest";
import { colSpanClass, COL_SPAN_CLASS } from "@/utils/gridClass";

describe("colSpanClass", () => {
  it("mapeia 1..12 para col-span-{n}", () => {
    expect(colSpanClass(1)).toBe("col-span-1");
    expect(colSpanClass(6)).toBe("col-span-6");
    expect(colSpanClass(12)).toBe("col-span-12");
  });

  it("faz clamp abaixo de 1", () => {
    expect(colSpanClass(0)).toBe("col-span-1");
    expect(colSpanClass(-3)).toBe("col-span-1");
  });

  it("faz clamp acima de 12", () => {
    expect(colSpanClass(13)).toBe("col-span-12");
    expect(colSpanClass(99)).toBe("col-span-12");
  });

  it("default 12 quando undefined", () => {
    expect(colSpanClass(undefined)).toBe("col-span-12");
  });

  it("arredonda para inteiro", () => {
    expect(colSpanClass(6.7)).toBe("col-span-6");
  });

  it("COL_SPAN_CLASS contem 12 entradas com classes estaticas", () => {
    const keys = Object.keys(COL_SPAN_CLASS)
      .map(Number)
      .sort((a, b) => a - b);
    expect(keys).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    for (const [k, v] of Object.entries(COL_SPAN_CLASS)) {
      expect(v).toBe(`col-span-${k}`);
    }
  });
});
