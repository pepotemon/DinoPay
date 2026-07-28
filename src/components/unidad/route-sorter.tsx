"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
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
import { ChevronDown, ChevronUp, GripVertical, Save, Search } from "lucide-react";
import { useMemo, useState } from "react";
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
  const [search, setSearch] = useState("");

  const ids = useMemo(() => items.map((i) => i.id), [items]);

  // TouchSensor: delay 250ms so the browser doesn't intercept as scroll
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const isFiltering = search.trim().length > 0;
  const filtered = isFiltering
    ? items.filter((i) => i.alias.toLowerCase().includes(search.toLowerCase().trim()))
    : items;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIdx = prev.findIndex((i) => i.id === active.id);
      const newIdx = prev.findIndex((i) => i.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  function handleMove(id: string, dir: "up" | "down") {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      const next = dir === "up" ? idx - 1 : idx + 1;
      if (next < 0 || next >= prev.length) return prev;
      return arrayMove(prev, idx, next);
    });
  }

  return (
    <form action={action} className="space-y-4">
      {/* All IDs hidden for form submission (always full order) */}
      {items.map((item) => (
        <input key={item.id} name="loanIds" type="hidden" value={item.id} />
      ))}

      {/* Sticky save + search */}
      <div className="sticky top-0 z-20 space-y-3 bg-background pb-2 pt-1">
        <button
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-black text-white shadow-lg shadow-primary/25 transition-opacity active:opacity-80"
          type="submit"
        >
          <Save className="h-5 w-5" />
          Guardar ruta
        </button>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground/60" />
          <input
            className="h-12 w-full rounded-xl bg-green-50 pl-10 pr-4 text-sm font-medium outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
            placeholder="Buscar cliente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isFiltering ? (
          <p className="text-center text-xs font-bold text-muted-foreground">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} · usa ↑↓ para mover ·{" "}
            <button
              className="text-primary underline"
              onClick={() => setSearch("")}
              type="button"
            >
              limpiar para arrastrar
            </button>
          </p>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Mantén presionado <span className="font-black">≡</span> para arrastrar
          </p>
        )}
      </div>

      {/* List */}
      {isFiltering ? (
        // Filtered view: read-only with up/down buttons
        <div className="space-y-3">
          {filtered.map((item) => {
            const pos = items.findIndex((i) => i.id === item.id);
            return (
              <ReadOnlyLoanItem
                key={item.id}
                index={pos + 1}
                item={item}
                total={items.length}
                onMove={(dir) => handleMove(item.id, dir)}
              />
            );
          })}
          {filtered.length === 0 ? (
            <p className="rounded-2xl border px-4 py-8 text-center text-sm text-muted-foreground">
              Sin resultados para esa búsqueda.
            </p>
          ) : null}
        </div>
      ) : (
        // Sortable view: drag + up/down
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {items.map((item, index) => (
                <SortableLoanItem
                  key={item.id}
                  index={index + 1}
                  item={item}
                  total={items.length}
                  onMove={(dir) => handleMove(item.id, dir)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </form>
  );
}

function SortableLoanItem({
  index,
  item,
  total,
  onMove
}: {
  index: number;
  item: RouteLoan;
  total: number;
  onMove: (dir: "up" | "down") => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-2xl border bg-background p-3 shadow-sm ${
        isDragging ? "opacity-60 shadow-xl ring-2 ring-primary/30" : ""
      }`}
    >
      {/* Position badge */}
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-black text-primary">
        {index}
      </div>

      {/* Client info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-black">{item.alias}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[item.barrio, formatCurrency(item.valorCuota)].filter(Boolean).join(" · ")}
        </p>
      </div>

      {/* Up / Down */}
      <div className="flex flex-col gap-0.5">
        <button
          aria-label="Subir"
          className="grid h-7 w-7 place-items-center rounded-lg bg-muted text-muted-foreground disabled:opacity-30"
          disabled={index === 1}
          onClick={() => onMove("up")}
          type="button"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          aria-label="Bajar"
          className="grid h-7 w-7 place-items-center rounded-lg bg-muted text-muted-foreground disabled:opacity-30"
          disabled={index === total}
          onClick={() => onMove("down")}
          type="button"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Drag handle — touch-action: none prevents browser scroll capture */}
      <button
        aria-label="Arrastrar"
        className="grid h-11 w-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"
        style={{ touchAction: "none" }}
        type="button"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
    </div>
  );
}

function ReadOnlyLoanItem({
  index,
  item,
  total,
  onMove
}: {
  index: number;
  item: RouteLoan;
  total: number;
  onMove: (dir: "up" | "down") => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-background p-3 shadow-sm">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-black text-primary">
        {index}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-black">{item.alias}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[item.barrio, formatCurrency(item.valorCuota)].filter(Boolean).join(" · ")}
        </p>
      </div>

      <div className="flex flex-col gap-0.5">
        <button
          aria-label="Subir"
          className="grid h-7 w-7 place-items-center rounded-lg bg-muted text-muted-foreground disabled:opacity-30"
          disabled={index === 1}
          onClick={() => onMove("up")}
          type="button"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          aria-label="Bajar"
          className="grid h-7 w-7 place-items-center rounded-lg bg-muted text-muted-foreground disabled:opacity-30"
          disabled={index === total}
          onClick={() => onMove("down")}
          type="button"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
