/**
 * Espelho local de IFormSourceItem da populis-v3-core
 * (populis-v3-core/interfaces/form-source-item.interface.ts).
 * Definido localmente para nao acoplar o build a pasta de referencia.
 */
export interface FormSourceItem {
  type: string;
  class?: string;
  hide?: boolean;
  action?: string;
  group?: string;
  props: Record<string, unknown>;
}
