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
import { ArrowUpDown, GripVertical, Save, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";

type RouteLoan = {
  id: string;
  alias: string;
  barrio: string | null;
  valorCuota: number;
};

type MoveSheet = { id: string; alias: string; currentIndex: number } | null;

export function RouteSorter({
  action,
  loans
}: {
  action: (formData: FormData) => void | Promise<void>;
  loans: RouteLoan[];
}) {
  const [items, setItems] = useState(loans);
  const [search, setSearch] = useState("");
  const [moveSheet, setMoveSheet] = useState<MoveSheet>(null);
  const [sheetSearch, setSheetSearch] = useState("");

  const ids = useMemo(() => items.map((i) => i.id), [items]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const isFiltering = search.trim().length > 0;
  const filtered = isFiltering
    ? items.filter((i) => i.alias.toLowerCase().includes(search.toLowerCase().trim()))
    : items;

  // Items available as move targets (exclude the item being moved)
  const moveTargets = useMemo(() => {
    if (!moveSheet) return [];
    const q = sheetSearch.toLowerCase().trim();
    return items
      .map((item, idx) => ({ ...item, position: idx + 1 }))
      .filter((item) => {
        if (item.id === moveSheet.id) return false;
        if (!q) return true;
        return item.alias.toLowerCase().includes(q) || String(item.position).includes(q);
      });
  }, [items, moveSheet, sheetSearch]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIdx = prev.findIndex((i) => i.id === active.id);
      const newIdx = prev.findIndex((i) => i.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  function handleMoveTo(targetId: string) {
    if (!moveSheet) return;
    setItems((prev) => {
      const fromIdx = prev.findIndex((i) => i.id === moveSheet.id);
      const toIdx = prev.findIndex((i) => i.id === targetId);
      return arrayMove(prev, fromIdx, toIdx);
    });
    setMoveSheet(null);
    setSheetSearch("");
  }

  function openMoveSheet(item: RouteLoan, index: number) {
    setMoveSheet({ id: item.id, alias: item.alias, currentIndex: index });
    setSheetSearch("");
  }

  return (
    <>
      <form action={action} className="space-y-4">
        {/* Hidden inputs — always the full ordered list */}
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
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} ·{" "}
              <button
                className="text-primary underline"
                onClick={() => setSearch("")}
                type="button"
              >
                ver todos
              </button>
            </p>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Mantén <span className="font-black">≡</span> para arrastrar ·{" "}
              <span className="font-black">↕</span> para mover a posición
            </p>
          )}
        </div>

        {/* List */}
        {isFiltering ? (
          <div className="space-y-3">
            {filtered.map((item) => {
              const pos = items.findIndex((i) => i.id === item.id);
              return (
                <LoanItem
                  key={item.id}
                  index={pos + 1}
                  item={item}
                  onOpenMove={() => openMoveSheet(item, pos + 1)}
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
                    onOpenMove={() => openMoveSheet(item, index + 1)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </form>

      {/* ── Move-to-position sheet ── */}
      {moveSheet ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Cerrar"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => { setMoveSheet(null); setSheetSearch(""); }}
            type="button"
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] flex flex-col rounded-t-3xl bg-background shadow-2xl">
            <div className="mx-auto w-full max-w-md flex flex-col min-h-0">
              {/* Drag handle */}
              <div className="flex justify-center pb-1 pt-3 shrink-0">
                <div className="h-1 w-10 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="flex items-center gap-2 px-5 py-3 shrink-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xl font-black">{moveSheet.alias}</p>
                  <p className="text-xs font-bold text-muted-foreground">
                    Mover a la posición de…
                  </p>
                </div>
                <button
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"
                  onClick={() => { setMoveSheet(null); setSheetSearch(""); }}
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search within sheet */}
              <div className="px-5 pb-3 shrink-0">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground/60" />
                  <input
                    className="h-11 w-full rounded-xl bg-green-50 pl-10 pr-4 text-sm font-medium outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="Buscar posición o nombre…"
                    value={sheetSearch}
                    onChange={(e) => setSheetSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Target list */}
              <div className="overflow-y-auto px-5 pb-8 space-y-2">
                {moveTargets.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Sin resultados.
                  </p>
                ) : (
                  moveTargets.map((target) => (
                    <button
                      key={target.id}
                      className="flex w-full items-center gap-3 rounded-2xl border bg-background px-4 py-3 text-left transition-colors active:bg-muted/40"
                      onClick={() => handleMoveTo(target.id)}
                      type="button"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-black text-primary">
                        {target.position}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-black">{target.alias}</p>
                        {target.barrio ? (
                          <p className="truncate text-xs text-muted-foreground">{target.barrio}</p>
                        ) : null}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SortableLoanItem({
  index,
  item,
  onOpenMove
}: {
  index: number;
  item: RouteLoan;
  onOpenMove: () => void;
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
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-black text-primary">
        {index}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-black">{item.alias}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[item.barrio, formatCurrency(item.valorCuota)].filter(Boolean).join(" · ")}
        </p>
      </div>

      {/* Move-to-position button */}
      <button
        aria-label="Mover a posición"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"
        onClick={onOpenMove}
        type="button"
      >
        <ArrowUpDown className="h-4 w-4" />
      </button>

      {/* Drag handle */}
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

function LoanItem({
  index,
  item,
  onOpenMove
}: {
  index: number;
  item: RouteLoan;
  onOpenMove: () => void;
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

      <button
        aria-label="Mover a posición"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"
        onClick={onOpenMove}
        type="button"
      >
        <ArrowUpDown className="h-4 w-4" />
      </button>
    </div>
  );
}
