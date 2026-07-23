import "@testing-library/jest-dom/vitest";

// Node 22 expõe um localStorage global sem valor (requer --localstorage-file),
// o que faz o middleware `persist` do zustand quebrar nos testes. Garantimos um
// localStorage funcional em memória antes de qualquer teste rodar.
if (typeof globalThis.localStorage === "undefined" || !globalThis.localStorage) {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
      key: (i: number) => [...store.keys()][i] ?? null,
      get length() {
        return store.size;
      },
    },
  });
}
