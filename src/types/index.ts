export type { BaseInputProps } from '@/schemas/base.schema';
export type { Field, FieldType } from '@/schemas/inputs.schema';
export { FIELD_TYPES } from '@/schemas/inputs.schema';
export type { FormPayload } from '@/schemas/form.schema';

export type Category =
  | 'Texto'
  | 'Numerico'
  | 'Data/Hora'
  | 'Documentos BR'
  | 'Endereco'
  | 'Contato'
  | 'Avancado'
  | 'Upload'
  | 'Modal/Lookup'
  | 'Selecao';

export interface RegistryEntry {
  type: import('@/schemas/inputs.schema').FieldType;
  label: string;
  category: Category;
  defaultProps: Record<string, unknown>;
}