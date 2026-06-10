import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState } from "react";
import { DragOverlayCard } from "@/components/dnd/DragOverlayCard";
import type { FieldType } from "@/schemas/inputs.schema";
import { useFormStore } from "@/store/formStore";
import { CanvasPanel } from "./CanvasPanel";
import { LeftPanel } from "./LeftPanel";
import { PropsPanel } from "./PropsPanel";
import { Toolbar } from "./Toolbar";

export function AppShell() {
  const addField = useFormStore((s) => s.addField);
  const reorderByIndex = useFormStore((s) => s.reorderByIndex);
  const fields = useFormStore((s) => s.fields);

  const [activeType, setActiveType] = useState<FieldType | null>(null);
  const [activeSource, setActiveSource] = useState<"palette" | "canvas" | null>(null);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function onDragCancel() {
    setActiveType(null);
    setActiveSource(null);
    setActiveFieldId(null);
  }

  function onDragStart(e: DragStartEvent) {
    const data = e.active.data.current as
      | { source?: string; type?: FieldType; id?: string }
      | undefined;
    if (data?.source === "palette" && data.type) {
      setActiveType(data.type);
      setActiveSource("palette");
    } else if (data?.source === "canvas") {
      setActiveSource("canvas");
      setActiveFieldId(typeof e.active.id === "string" ? e.active.id : (data?.id ?? null));
    }
  }

  function onDragEnd(e: DragEndEvent) {
    const active = e.active;
    const over = e.over;
    const data = active.data.current as
      | { source?: string; type?: FieldType; id?: string }
      | undefined;

    if (data?.source === "palette" && data.type) {
      if (over?.id === "canvas-droppable") {
        addField(data.type);
      } else if (over && fields.some((f) => f.id === over.id)) {
        const idx = fields.findIndex((f) => f.id === over.id);
        addField(data.type, idx);
      }
    } else if (data?.source === "canvas" && over && over.id !== active.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) reorderByIndex(oldIndex, newIndex);
    }

    onDragCancel();
  }

  const activeCanvasField =
    activeSource === "canvas" && activeFieldId
      ? (fields.find((f) => f.id === activeFieldId) ?? null)
      : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="flex h-screen flex-col bg-slate-100">
        <Toolbar />
        <div className="flex flex-1 overflow-hidden">
          <LeftPanel />
          <CanvasPanel />
          <PropsPanel />
        </div>
      </div>
      <DragOverlay>
        {activeSource === "palette" && activeType ? (
          <DragOverlayCard type={activeType} />
        ) : activeCanvasField ? (
          <DragOverlayCard type={activeCanvasField.type} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
