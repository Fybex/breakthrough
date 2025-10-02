"use client";

import { cn } from "@/lib/utils";
import Piece from "./Piece";

type Props = {
  r: number;
  c: number;
  piece: { color: "W" | "B" } | null;
  isDark: boolean;
  isSelected?: boolean;
  isHighlight?: boolean; 
  isLastFrom?: boolean;
  isLastTo?: boolean;
  onClick?: () => void;
  
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onFocus?: () => void;
};

export default function Square({
  r,
  c,
  piece,
  isDark,
  isSelected,
  isHighlight,
  isLastFrom,
  isLastTo,
  onClick,
  draggable,
  onDragStart,
  onDrop,
  onKeyDown,
  onFocus,
}: Props) {
  return (
    <button
      id={`square-${r}-${c}`}
      aria-label={`square-${r}-${c}`}
      onClick={onClick}
      draggable={!!draggable}
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      className={cn(
        "relative aspect-square flex items-center justify-center text-[10px] sm:text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500",
        isDark ? "bg-neutral-300" : "bg-neutral-100",
        isSelected && "ring-2 ring-sky-500",
        isHighlight && "outline outline-2 outline-emerald-500/70",
        isLastFrom && "after:absolute after:inset-0 after:ring-2 after:ring-amber-400/60",
        isLastTo && "outline outline-2 outline-amber-400/70",
        "hover:outline hover:outline-2 hover:outline-black/10"
      )}
    >
      {piece ? <Piece color={piece.color} /> : null}
      {isHighlight && !piece ? (
        <span className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500/70" />
      ) : null}
    </button>
  );
}
