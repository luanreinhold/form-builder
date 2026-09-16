import { Button } from "@/components/ui/Button";
import { confirm } from "@/store/dialogStore";
import { toast } from "@/store/toastStore";

export function EditorHeader({ type, onDelete }: { type: string; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-edge pb-2">
      <div>
        <div className="text-xs uppercase text-faint">Editando</div>
        <div className="text-sm font-semibold text-foreground">{type}</div>
      </div>
      <Button
        variant="danger-solid"
        size="sm"
        onClick={async () => {
          const shouldRemove = await confirm({
            title: "Remover este campo?",
            description: "Esta ação não pode ser desfeita.",
            confirmLabel: "Excluir",
            variant: "danger",
          });
          if (shouldRemove) {
            onDelete();
            toast({ description: "Campo removido.", variant: "success" });
          }
        }}
      >
        Excluir
      </Button>
    </div>
  );
}
