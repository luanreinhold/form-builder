export const COL_SPAN_CLASS = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
  11: "col-span-11",
  12: "col-span-12",
} as const satisfies Record<number, string>;

export type ColSpan = keyof typeof COL_SPAN_CLASS;

export function colSpanClass(n: number | undefined): string {
  if (n === undefined || Number.isNaN(n)) return COL_SPAN_CLASS[12];
  const clamped = Math.min(12, Math.max(1, Math.floor(n))) as ColSpan;
  return COL_SPAN_CLASS[clamped];
}
