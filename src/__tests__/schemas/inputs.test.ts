import { describe, it, expect } from 'vitest';
import { BaseInputPropsSchema } from '@/schemas/base.schema';
import { FieldSchema } from '@/schemas/inputs.schema';
import { FormSchema } from '@/schemas/form.schema';

describe('BaseInputPropsSchema', () => {
  it('exige name', () => {
    const r = BaseInputPropsSchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it('aceita props minimas', () => {
    const r = BaseInputPropsSchema.safeParse({ name: 'campo' });
    expect(r.success).toBe(true);
  });

  it('aceita todas props opcionais', () => {
    const r = BaseInputPropsSchema.safeParse({
      name: 'campo',
      label: 'Label',
      placeholder: 'Digite',
      required: true,
      readonly: false,
      hint: 'dica',
      min: '0',
      max: '100',
      showCaracterCounter: true,
      highlight: false,
      doNotTranslate: false,
      customRequiredWarning: 'Obrigatorio',
      value: 'inicial',
      labelClass: 'cls',
      requestFocus: false,
      keyboardOptions: { layout: 'br' },
    });
    expect(r.success).toBe(true);
  });
});

describe('FieldSchema', () => {
  it('aceita input-text valido', () => {
    const r = FieldSchema.safeParse({
      id: 'abc',
      type: 'input-text',
      class: '',
      hide: false,
      props: { name: 'nome', doNotAllowSpecialCharacters: true },
    });
    expect(r.success).toBe(true);
  });

  it('rejeita tipo desconhecido', () => {
    const r = FieldSchema.safeParse({ id: 'a', type: 'input-xyz', props: { name: 'a' } });
    expect(r.success).toBe(false);
  });

  it('aceita input-money com minValue/maxValue', () => {
    const r = FieldSchema.safeParse({
      id: 'm',
      type: 'input-money',
      props: { name: 'valor', minValue: 0, maxValue: 1000 },
    });
    expect(r.success).toBe(true);
  });

  it('aceita select com source', () => {
    const r = FieldSchema.safeParse({
      id: 's',
      type: 'select-component',
      props: { name: 'sel', source: [{ key: 1, value: 'A' }, { key: 2, value: 'B' }] },
    });
    expect(r.success).toBe(true);
  });

  it('rejeita id vazio', () => {
    const r = FieldSchema.safeParse({ id: '', type: 'input-text', props: { name: 'a' } });
    expect(r.success).toBe(false);
  });

  it('aplica defaults de class e hide', () => {
    const r = FieldSchema.safeParse({ id: 'x', type: 'input-text', props: { name: 'a' } });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.class).toBe('');
      expect(r.data.hide).toBe(false);
    }
  });
});

describe('FormSchema', () => {
  it('aceita formulario valido', () => {
    const r = FormSchema.safeParse({
      schemaVersion: 1,
      formId: 'f1',
      createdAt: '2026-06-08T10:00:00Z',
      updatedAt: '2026-06-08T10:00:00Z',
      fields: [{ id: 'a', type: 'input-text', props: { name: 'a' } }],
    });
    expect(r.success).toBe(true);
  });

  it('rejeita schemaVersion errado', () => {
    const r = FormSchema.safeParse({
      schemaVersion: 2,
      formId: 'f',
      createdAt: '',
      updatedAt: '',
      fields: [],
    });
    expect(r.success).toBe(false);
  });
});