/**
 * Espelho local do formato de item de formulario consumido pela v3.
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
