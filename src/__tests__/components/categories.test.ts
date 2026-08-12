import { describe, expect, it } from "vitest";
import { CATEGORIES } from "@/components/inputs/categories";
import { REGISTRY } from "@/components/inputs/registry";

describe("CATEGORIES", () => {
  // Redundante com o tipo, mas barato e protege contra um `as` mal colocado no futuro
  it("toda categoria do REGISTRY existe em CATEGORIES", () => {
    for (const entry of Object.values(REGISTRY)) {
      expect(CATEGORIES[entry.category]).toBeDefined();
    }
  });
});
