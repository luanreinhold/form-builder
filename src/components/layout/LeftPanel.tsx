import { useState } from "react";
import { DraggableInput } from "@/components/dnd/DraggableInput";
import { Icon } from "@/components/icons/Icon";
import { listByCategory } from "@/components/inputs/registry";

export function LeftPanel() {
  const groups = listByCategory();
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.category, true])),
  );
  console.log(groups);

  return (
    <aside className="w-62 shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50 p-3">
      <h2 className="mb-2 text-xs font-semibold uppercase text-slate-500">Paleta</h2>
      <div className="space-y-3">
        {groups.map((g) => (
          <section key={g.category}>
            <button
              type="button"
              className="mb-1 flex w-full items-center justify-between text-left text-xs font-semibold text-slate-700"
              onClick={() => setOpen((o) => ({ ...o, [g.category]: !o[g.category] }))}
            >
              <span>{g.category}</span>
              <span className="text-slate-400">
                <Icon
                  name={open[g.category] ? "chevron-down" : "chevron-right"}
                  width={14}
                  height={14}
                />
              </span>
            </button>
            {open[g.category] && (
              <div className="space-y-1">
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
