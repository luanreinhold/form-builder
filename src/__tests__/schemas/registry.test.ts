import { describe, it, expect } from 'vitest';
import { REGISTRY, listByCategory, getRegistry } from '@/components/inputs/registry';
import { FIELD_TYPES } from '@/types';

describe('registry', () => {
  it('cobre todos os FIELD_TYPES', () => {
    for (const t of FIELD_TYPES) {
      expect(REGISTRY[t]).toBeDefined();
      expect(REGISTRY[t].defaultProps.name).toBeTruthy();
    }
  });

  it('getRegistry retorna entry valida', () => {
    const e = getRegistry('input-text');
    expect(e.label).toBe('Texto');
  });

  it('listByCategory agrupa por categoria', () => {
    const groups = listByCategory();
    expect(groups.length).toBeGreaterThan(0);
    const total = groups.reduce((acc, g) => acc + g.items.length, 0);
    expect(total).toBe(FIELD_TYPES.length);
  });
});