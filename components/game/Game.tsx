"use client";

import { useMemo } from "react";
import BoardWithCoords from "./board/BoardWithCoords";
import Toolbar from "@/components/game/GameToolbar";
import { useGameStore } from "@/lib/store/game";
import { legalMovesFrom, pieceAt } from "@/lib/engine/breakthrough";
import PlayerLabel from "@/components/game/PlayerLabel";
import { Button } from "@/components/ui/Button";
import { useGlobalHotkeys } from "@/lib/hooks/useGlobalHotkeys";
import History from "@/components/game/History";

export default function Game() {
  const state = useGameStore((s) => s.state);
  const selected = useGameStore((s) => s.selected);
  const clickSquare = useGameStore((s) => s.clickSquare);
  const lastMove = useGameStore((s) => s.lastMove);
  const mode = useGameStore((s) => s.mode);
  const playerSide = useGameStore((s) => s.playerSide);
  const status = useGameStore((s) => s.status);
  const start = useGameStore((s) => s.start);
  const select = useGameStore((s) => s.select);

  const legal = useMemo(() => {
    if (!selected) return [];
    const [r, c] = selected;
    const p = pieceAt(state, r, c);
    if (!p || p.color !== state.turn) return [];
    return legalMovesFrom(state, r, c);
  }, [selected, state]);

  useGlobalHotkeys();

  const topLabel =
    mode === "ai" ? (playerSide === "B" ? "You" : "AI") : "Player 2";
  const bottomLabel =
    mode === "ai" ? (playerSide === "W" ? "You" : "AI") : "Player 1";

  const canDrag = (r: number, c: number) => {
    const p = state.board[r][c];
    if (!p) return false;
    if (p.color !== state.turn) return false;
    if (status !== "playing") return false;
    if (mode === "ai" && p.color !== playerSide) return false;
    return true;
  };

  const onDragFrom = (e: React.DragEvent, r: number, c: number) => {
    try {
      const img = new Image();
      img.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
      e.dataTransfer.setDragImage(img, 0, 0);
    } catch {}
    select([r, c]);
  };

  const onDropTo = (r: number, c: number) => {
    clickSquare(r, c);
  };

  const focusSquare = (r: number, c: number) => {
    const el = document.getElementById(
      `square-${r}-${c}`
    ) as HTMLButtonElement | null;
    el?.focus();
  };

  const onKeyDownSquare = (e: React.KeyboardEvent, r: number, c: number) => {
    const k = e.key;
    const isMeta = e.metaKey || e.ctrlKey || e.altKey;
    if (isMeta) return;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(k)) {
      e.preventDefault();
      let nr = r,
        nc = c;
      if (k === "ArrowUp") nr = Math.max(0, r - 1);
      if (k === "ArrowDown") nr = Math.min(state.size - 1, r + 1);
      if (k === "ArrowLeft") nc = Math.max(0, c - 1);
      if (k === "ArrowRight") nc = Math.min(state.size - 1, c + 1);
      focusSquare(nr, nc);
      return;
    }
    if (k === "Enter" || k === " ") {
      e.preventDefault();
      const p = state.board[r][c];

      if (!selected) {
        if (!p) return;
        if (p.color !== state.turn) return;
        if (mode === "ai" && p.color !== playerSide) return;
        select([r, c]);
        return;
      }

      const mv = legal.find((m) => m.to[0] === r && m.to[1] === c);
      if (mv) {
        clickSquare(r, c);
        return;
      }

      if (
        p &&
        p.color === state.turn &&
        (mode !== "ai" || p.color === playerSide)
      ) {
        select([r, c]);
      }
    }
  };

  return (
    <div className="w-full max-w-[980px] mx-auto">
      <div className="rounded-lg border bg-card text-card-foreground p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <Toolbar />
          {state.winner && (
            <div className="w-full text-center text-sm sm:text-base">
              <span className="font-medium">
                {state.winner === "W" ? "White" : "Black"} wins!
              </span>
              <span className="mx-2 text-muted-foreground">—</span>
              <button
                className="underline underline-offset-4 hover:opacity-80"
                onClick={() => useGameStore.getState().reset()}
              >
                New game
              </button>
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className="flex-1 flex flex-col items-center gap-2">
              <PlayerLabel
                color="B"
                label={topLabel}
                active={!state.winner && state.turn === "B"}
              />
              <div className="relative">
                <BoardWithCoords
                  state={state}
                  selected={selected}
                  legal={legal}
                  onSquareClick={clickSquare}
                  lastMove={lastMove}
                  canDrag={canDrag}
                  onDragFrom={onDragFrom}
                  onDropTo={onDropTo}
                  onKeyDownSquare={onKeyDownSquare}
                />
                {status === "setup" && (
                  <div className="absolute inset-0 bg-white/70 dark:bg-black/50 backdrop-blur-[1px] flex items-center justify-center rounded-md">
                    <div className="text-center p-4">
                      <div className="mb-3 text-sm text-muted-foreground">
                        Select mode and side, then start
                      </div>
                      <Button size="sm" onClick={() => start()} autoFocus>
                        Start
                      </Button>
                      <div className="mt-2 text-[10px] sm:text-xs text-muted-foreground">
                        Press Enter
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <PlayerLabel
                color="W"
                label={bottomLabel}
                active={!state.winner && state.turn === "W"}
              />
            </div>
            <div className="w-full md:w-56 lg:w-64">
              <History />
            </div>
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground text-center mt-1">
            Hotkeys: Undo ⌘/Ctrl+Z · Redo ⌘/Ctrl+Shift+Z or ⌘/Ctrl+Y · Reset R ·
            Mode M · Side S · AI Move A
          </div>
        </div>
      </div>
    </div>
  );
}
