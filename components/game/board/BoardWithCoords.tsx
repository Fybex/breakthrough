"use client";

import Board from "./Board";
import type { GameState, Move } from "@/lib/engine/breakthrough";

export default function BoardWithCoords({
  state,
  selected,
  legal,
  onSquareClick,
  lastMove,
  canDrag,
  onDragFrom,
  onDropTo,
  onKeyDownSquare,
  onFocusSquare,
}: {
  state: GameState;
  selected: [number, number] | null;
  legal: Move[];
  onSquareClick: (r: number, c: number) => void;
  lastMove: Move | null;
  canDrag: (r: number, c: number) => boolean;
  onDragFrom: (e: React.DragEvent, r: number, c: number) => void;
  onDropTo: (r: number, c: number) => void;
  onKeyDownSquare: (e: React.KeyboardEvent, r: number, c: number) => void;
  onFocusSquare?: (r: number, c: number) => void;
}) {
  const size = state.size;

  const fileLabel = (i: number) => String.fromCharCode("A".charCodeAt(0) + i);

  return (
    <div className="grid gap-2" style={{ gridTemplateRows: "auto auto auto" }}>
      <div className="flex justify-center gap-2 text-[10px] sm:text-xs text-muted-foreground select-none">
        {Array.from({ length: size }).map((_, c) => (
          <div key={c} className="w-[40px] sm:w-[45px] text-center">
            {fileLabel(c)}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2">
        <div className="w-5 text-[10px] sm:text-xs text-muted-foreground text-right select-none">
          {Array.from({ length: size }).map((_, r) => (
            <div
              key={r}
              className="h-[40px] sm:h-[45px] flex items-center justify-end"
            >
              {size - r}
            </div>
          ))}
        </div>

        <Board
          state={state}
          selected={selected}
          legal={legal}
          onSquareClick={onSquareClick}
          lastMove={lastMove}
          canDrag={canDrag}
          onDragFrom={onDragFrom}
          onDropTo={onDropTo}
          onKeyDownSquare={onKeyDownSquare}
          onFocusSquare={onFocusSquare}
        />

        <div className="w-5 text-[10px] sm:text-xs text-muted-foreground select-none">
          {Array.from({ length: size }).map((_, r) => (
            <div key={r} className="h-[40px] sm:h-[45px] flex items-center">
              {size - r}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-2 text-[10px] sm:text-xs text-muted-foreground select-none">
        {Array.from({ length: size }).map((_, c) => (
          <div key={c} className="w-[40px] sm:w-[45px] text-center">
            {fileLabel(c)}
          </div>
        ))}
      </div>
    </div>
  );
}
