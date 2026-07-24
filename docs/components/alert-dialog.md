# AlertDialog

Diálogo de confirmação (`role="alertdialog"`) próprio, sem dependências externas. API
**imperativa** baseada em promise para substituir `window.confirm()` com um visual consistente
com o design system (tokens semânticos, dark/light automático).

- Componente: [src/components/ui/AlertDialog.tsx](../../src/components/ui/AlertDialog.tsx)
- Store: [src/store/dialogStore.ts](../../src/store/dialogStore.ts)
- Testes: [src/__tests__/components/AlertDialog.test.tsx](../../src/__tests__/components/AlertDialog.test.tsx)
- Plano/decisão: [docs/plans/03-alert-dialog.plan.md](../plans/03-alert-dialog.plan.md)

## Quando usar

Para qualquer confirmação destrutiva ou de ação relevante onde antes se usaria `window.confirm`.
Já é usado na Toolbar (importar sobre rascunho existente e limpar formulário) —
[src/components/layout/Toolbar.tsx](../../src/components/layout/Toolbar.tsx).

## Pré-requisito

`<AlertDialogHost />` precisa estar montado **uma vez** no root. Já está em
[src/App.tsx](../../src/App.tsx):

```tsx
import { AlertDialogHost } from "./components/ui/AlertDialog";

export default function App() {
  return (
    <>
      <AppShell />
      <AlertDialogHost />
    </>
  );
}
```

## Uso

```tsx
import { confirm } from "@/store/dialogStore";

async function handleDelete() {
  const ok = await confirm({
    title: "Excluir campo?",
    description: "Essa ação não pode ser desfeita.",
    confirmLabel: "Excluir",
    variant: "danger",
  });
  if (!ok) return;
  removeField(id);
}
```

`confirm()` retorna `Promise<boolean>` — `true` ao confirmar, `false` ao cancelar (botão Cancelar,
Esc ou se um novo `confirm()` abrir por cima do anterior).

## API

### `confirm(options): Promise<boolean>`

| Campo | Tipo | Default | Descrição |
|---|---|---|---|
| `title` | `string` | — (obrigatório) | Título do diálogo |
| `description` | `string` | — | Texto de apoio (linka `aria-describedby` quando presente) |
| `confirmLabel` | `string` | `"Confirmar"` | Rótulo do botão de confirmação |
| `cancelLabel` | `string` | `"Cancelar"` | Rótulo do botão de cancelar |
| `variant` | `"primary" \| "danger"` | `"primary"` | Estilo do botão de confirmação |

### Store (`useDialogStore`)

Exposto para casos avançados; o normal é usar `confirm()`.

- `open: boolean`, `options: ConfirmOptions \| null`
- `confirm(options): Promise<boolean>` — abre e resolve ao fechar
- `resolve(result: boolean)` — fecha resolvendo a promise pendente

## Acessibilidade

- `role="alertdialog"` + `aria-modal`, com `aria-labelledby`/`aria-describedby` linkados.
- Foco inicial no **Cancelar** (seguro para ações destrutivas); foco restaurado ao fechar.
- Teclado: **Esc** cancela · **Tab/Shift+Tab** com focus-trap · **Enter/Espaço** aciona o botão
  em foco (não confirma sempre — respeita a navegação).
- Scroll do `body` travado enquanto aberto.
- Backdrop **não** dispensa por clique de propósito: um alertdialog exige escolha explícita.

## Estilo

Usa apenas tokens semânticos ([src/index.css](../../src/index.css)), então respeita dark/light
sem JS. Botões reaproveitam o [`<Button>`](../../src/components/ui/Button.tsx): Cancelar usa
`secondary` (borda + contraste) e o de confirmação usa `primary` ou `danger-solid` conforme
`variant`.
