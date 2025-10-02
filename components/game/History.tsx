"use client";

import { useMemo } from "react";
import { useGameStore } from "@/lib/store/game";
import type { GameState } from "@/lib/engine/breakthrough";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

function toCoord(size: number, r: number, c: number) {
  const file = String.fromCharCode("A".charCodeAt(0) + c);
  const rank = size - r;
  return `${file}${rank}`;
}

function computeMoveText(prev: GameState, curr: GameState): string | null {
  const size = curr.size;
  let from: [number, number] | null = null;
  let to: [number, number] | null = null;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const a = prev.board[r][c];
      const b = curr.board[r][c];
      if (a && !b) from = [r, c];
    }
  }
  if (!from) return null;
  const moverColor = prev.board[from[0]][from[1]]!.color;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const a = prev.board[r][c];
      const b = curr.board[r][c];
      if ((a?.color !== b?.color) && b && b.color === moverColor) {
        to = [r, c];
      }
    }
  }
  if (!to) return null;
  const capture = !!prev.board[to[0]][to[1]];
  const sep = capture ? "x" : "-";
  return `${toCoord(size, from[0], from[1])}${sep}${toCoord(size, to[0], to[1])}`;
}

export default function History() {
  const history = useGameStore((s) => s.history);
  const cursor = history.cursor;
  const jumpTo = useGameStore((s) => s.jumpTo);

  const entries = useMemo(() => {
    const out: { index: number; text: string }[] = [];
    for (let i = 1; i < history.list.length; i++) {
      const text = computeMoveText(history.list[i - 1], history.list[i]) ?? `Move ${i}`;
      out.push({ index: i, text });
    }
    return out;
  }, [history]);

  const copyHistory = () => {
    const readableHistory = entries.map((e) => {
      const moveNumber = Math.floor((e.index - 1) / 2) + 1;
      const isWhiteMove = (e.index - 1) % 2 === 0;
      const player = isWhiteMove ? "White" : "Black";
      return `${moveNumber}. ${player}: ${e.text}`;
    }).join('\n');

    navigator.clipboard.writeText(readableHistory);
  };

  return (
    <div className="w-full md:w-56 lg:w-64">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">History</div>
        {entries.length > 0 && (
          <Button
            onClick={copyHistory}
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
          >
            Copy
          </Button>
        )}
      </div>
      <div className="max-h-[360px] overflow-auto rounded-md border divide-y">
        {entries.length === 0 ? (
          <div className="p-2 text-xs text-muted-foreground">No moves yet</div>
        ) : (
          entries.map((e) => (
            <button
              key={e.index}
              onClick={() => jumpTo(e.index)}
              className={cn(
                "w-full text-left px-2 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground",
                e.index === cursor && "bg-accent text-accent-foreground"
              )}
            >
              <span className="inline-block w-6 text-muted-foreground">
                {Math.floor((e.index - 1) / 2) + 1}.
              </span>
              <span>{e.text}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
