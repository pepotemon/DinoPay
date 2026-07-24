"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type RouteLoan = {
  id: string;
  alias: string;
  barrio: string | null;
  valorCuota: number;
};

export function RouteSorter({
  action,
  loans
}: {
  action: (formData: FormData) => void | Promise<void>;
  loans: RouteLoan[];
}) {
  const [items, setItems] = useState(loans);
  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setItems((currentItems) => {
      const oldIndex = currentItems.findIndex((item) => item.id === active.id);
      const newIndex = currentItems.findIndex((item) => item.id === over.id);
      return arrayMove(currentItems, oldIndex, newIndex);
    });
  }

  return (
    <form action={action} className="space-y-4">
      {items.map((item) => (
        <input key={item.id} name="loanIds" type="hidden" value={item.id} />
      ))}

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.map((item, index) => (
              <SortableLoanItem index={index + 1} item={item} key={item.id} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="sticky bottom-4 z-10">
        <Button className="h-12 w-full shadow-lg" type="submit">
          <Save className="h-4 w-4" />
          Guardar ruta
        </Button>
      </div>
    </form>
  );
}

function SortableLoanItem({ index, item }: { index: number; item: RouteLoan }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      className={
        isDragging
          ? "rounded-md border bg-background p-3 opacity-80 shadow-lg"
          : "rounded-md border bg-background p-3"
      }
      ref={setNodeRef}
      style={style}
    >
      <div className="flex items-center gap-3">
        <button
          aria-label="Mover en la ruta"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground"
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              {index}
            </span>
            <p className="truncate font-semibold">{item.alias}</p>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {item.barrio ?? "Sin barrio"} - {formatCurrency(item.valorCuota)}
          </p>
        </div>
      </div>
    </div>
  );
}
