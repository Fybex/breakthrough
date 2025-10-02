"use client";

import Square from "./Square";
import type { GameState, Move } from "@/lib/engine/breakthrough";

type Props = {
  state: GameState;
  selected?: [number, number] | null;
  legal: Move[];
  onSquareClick: (r: number, c: number) => void;
  lastMove?: Move | null;
  
  canDrag: (r: number, c: number) => boolean;
  onDragFrom: (e: React.DragEvent, r: number, c: number) => void;
  onDropTo: (r: number, c: number) => void;
  onKeyDownSquare: (e: React.KeyboardEvent, r: number, c: number) => void;
  onFocusSquare?: (r: number, c: number) => void;
};

export default function Board({ state, selected, legal, onSquareClick, lastMove, canDrag, onDragFrom, onDropTo, onKeyDownSquare, onFocusSquare }: Props) {
  const size = state.size;

  const isLegal = (r: number, c: number) =>
    legal.some((m) => m.to[0] === r && m.to[1] === c);

  return (
    <div
      className="grid gap-[2px] p-1 bg-neutral-400/40 rounded-md w-[320px] sm:w-[360px]"
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: size }).map((_, r) =>
        Array.from({ length: size }).map((_, c) => {
          const isDark = (r + c) % 2 === 1;
          const piece = state.board[r][c];
          const isSelected = selected && selected[0] === r && selected[1] === c;
          const isLastFrom = lastMove && lastMove.from[0] === r && lastMove.from[1] === c;
          const isLastTo = lastMove && lastMove.to[0] === r && lastMove.to[1] === c;
          const highlight = isLegal(r, c);
          return (
            <Square
              key={`${r}-${c}`}
              r={r}
              c={c}
              piece={piece}
              isDark={isDark}
              isSelected={!!isSelected}
              isHighlight={highlight}
              isLastFrom={!!isLastFrom}
              isLastTo={!!isLastTo}
              onClick={() => onSquareClick(r, c)}
              draggable={canDrag(r, c)}
              onDragStart={(e) => onDragFrom(e, r, c)}
              onDrop={() => onDropTo(r, c)}
              onKeyDown={(e) => onKeyDownSquare(e, r, c)}
              onFocus={() => onFocusSquare && onFocusSquare(r, c)}
            />
          );
        })
      )}
    </div>
  );
}
