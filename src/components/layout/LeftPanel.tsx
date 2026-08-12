import { useState } from "react";
import { DraggableInput } from "@/components/dnd/DraggableInput";
import { Icon } from "@/components/icons/Icon";
import { listByCategory } from "@/components/inputs/registry";

export function LeftPanel() {
  const groups = listByCategory();
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.category, true])),
  );

  return (
    <aside className="w-64 shrink-0 overflow-y-auto border-r border-edge bg-surface p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">Paleta</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Arraste um campo para o formulário</p>
      </div>
      <div className="space-y-4">
        {groups.map((g) => (
          <section key={g.category}>
            <button
              type="button"
              aria-expanded={open[g.category]}
              className="mb-2 flex w-full items-center justify-between rounded px-1 py-1 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setOpen((o) => ({ ...o, [g.category]: !o[g.category] }))}
            >
              <span>{g.category}</span>
              <Icon
                name={open[g.category] ? "chevron-down" : "chevron-right"}
                width={14}
                height={14}
                className="shrink-0 text-faint"
              />
            </button>
            {open[g.category] && (
              <div className="grid grid-cols-2 gap-2">
                {g.items.map((it) => (
                  <DraggableInput key={it.type} entry={it} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </aside>
  );
}
