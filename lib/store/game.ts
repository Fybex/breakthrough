"use client";

import { create } from "zustand";
import {
  GameState,
  Move,
  initialState,
  pieceAt,
  legalMovesFrom,
  applyMove,
} from "@/lib/engine/breakthrough";
import { createTrpcClient } from "@/lib/trpc/react";

export type Mode = "ai" | "local"; 
export type AIStrategy = "mine" | "dapetcu21-minimax" | "dapetcu21-montecarlo";

type History = {
  list: GameState[];
  cursor: number; 
};

type Store = {
  state: GameState;
  history: History;
  selected: [number, number] | null;
  mode: Mode;
  playerSide: "W" | "B";
  aiStrategy: AIStrategy;
  lastMove: Move | null;
  status: "setup" | "playing" | "finished";
  
  canUndo: boolean;
  canRedo: boolean;
  
  reset: (size?: number) => void;
  setMode: (m: Mode) => void;
  setPlayerSide: (s: "W" | "B") => void;
  setAIStrategy: (s: AIStrategy) => void;
  select: (rc: [number, number] | null) => void;
  clickSquare: (r: number, c: number) => void;
  undo: () => void;
  redo: () => void;
  aiStep: () => Promise<void>;
  jumpTo: (index: number) => void;
  start: () => void;
};

function pushHistory(hist: History, state: GameState): History {
  const list = hist.list.slice(0, hist.cursor + 1);
  list.push(state);
  return { list, cursor: list.length - 1 };
}

function current(hist: History): GameState {
  return hist.list[hist.cursor];
}

export const useGameStore = create<Store>((set, get) => ({
  state: initialState(8),
  history: { list: [initialState(8)], cursor: 0 },
  selected: null,
  mode: "ai",
  playerSide: "W",
  aiStrategy: "mine",
  lastMove: null,
  status: "setup",
  canUndo: false,
  canRedo: false,

  reset: (size = 8) => {
    const s = initialState(size);
    const hist = { list: [s], cursor: 0 };
    set({ state: s, history: hist, selected: null, lastMove: null, canUndo: false, canRedo: false, status: "setup" });
  },

  setMode: (m) => {
    
    if (get().status !== "setup") return;
    set({ mode: m });
  },

  setPlayerSide: (s) => {
    
    if (get().status !== "setup") return;
    set({ playerSide: s });
  },

  setAIStrategy: (s) => {
    
    if (get().status !== "setup") return;
    set({ aiStrategy: s });
  },

  select: (rc) => set({ selected: rc }),

  clickSquare: (r, c) => {
    const { state, selected, mode, playerSide, status } = get();
    if (status !== "playing") return;
    if (state.winner) return;

    const p = pieceAt(state, r, c);
    const isHumanTurn = state.turn === playerSide;
    if (p && p.color === state.turn) {
      if (mode === "ai" && !isHumanTurn) return; 
      set({ selected: [r, c] });
      return;
    }

    if (selected) {
      const legal = legalMovesFrom(state, selected[0], selected[1]);
      const mv = legal.find((m) => m.to[0] === r && m.to[1] === c);
      if (mv) {
        
          const next = applyMove(state, mv);
        const hist = pushHistory(get().history, next);
        const status = next.winner ? "finished" : "playing";
        set({ state: next, history: hist, selected: null, lastMove: mv, canUndo: hist.cursor > 0, canRedo: false, status });
        
        maybeAiMoveLater();
        return;
      }
    }

    set({ selected: null });
  },

  undo: () => {
    const { history: hist, mode, playerSide } = get();
    if (hist.cursor <= 0) return;
    let cursor = hist.cursor - 1; 
    
    if (mode === "ai") {
      const stAfterOne = hist.list[cursor];
      if (stAfterOne.turn !== playerSide && cursor > 0) {
        cursor = cursor - 1; 
      }
    }
    const newHist = { ...hist, cursor };
    const s = current(newHist);
    const lm = computeLastMoveFromHistory(newHist);
    set({
      history: newHist,
      state: s,
      lastMove: lm,
      canUndo: newHist.cursor > 0,
      canRedo: newHist.cursor < newHist.list.length - 1,
      selected: null,
    });
  },

  redo: () => {
    const hist = get().history;
    if (hist.cursor >= hist.list.length - 1) return;
    const newHist = { ...hist, cursor: hist.cursor + 1 };
    const s = current(newHist);
    const lm = computeLastMoveFromHistory(newHist);
    set({
      history: newHist,
      state: s,
      lastMove: lm,
      canUndo: newHist.cursor > 0,
      canRedo: newHist.cursor < newHist.list.length - 1,
      selected: null,
    });
  },

  aiStep: async () => {
    const { state, status, aiStrategy } = get();
    if (status !== "playing") return;
    if (state.winner) return;

    try {
      const client = createTrpcClient();
      const result = await client.ai.getMove.mutate({
        board: state.board,
        turn: state.turn,
        winner: state.winner,
        size: state.size,
        strategy: aiStrategy,
        moveBudget: aiStrategy.startsWith("dapetcu21") ? 1000 : undefined,
      });

      const mv = result.move;
      if (!mv) return;
      const next = applyMove(state, mv);
      const hist = pushHistory(get().history, next);
      const status2 = next.winner ? "finished" : "playing";
      set({ state: next, history: hist, lastMove: mv, selected: null, canUndo: hist.cursor > 0, canRedo: false, status: status2 });
    } catch (error) {
      console.error("Error getting AI move:", error);
    }
  },

  jumpTo: (index: number) => {
    const { history } = get();
    if (index < 0 || index >= history.list.length) return;
    const newHist = { ...history, cursor: index };
    const s = current(newHist);
    const lm = computeLastMoveFromHistory(newHist);
    set({ history: newHist, state: s, lastMove: lm, selected: null, canUndo: newHist.cursor > 0, canRedo: newHist.cursor < newHist.list.length - 1 });
  },

  start: () => {
    if (get().status !== "setup") return;
    set({ status: "playing" });
    
    maybeAiMoveLater();
  },
}));

async function maybeAiMoveLater() {
  const { mode, playerSide, state, status } = useGameStore.getState();
  if (status !== "playing") return;
  if (mode !== "ai") return;
  if (state.winner) return;
  if (state.turn === playerSide) return; 

  setTimeout(async () => {
    const { state: st1, aiStrategy: strategy } = useGameStore.getState();
    if (st1.winner) return;
    if (st1.turn === playerSide) return;

    try {
      const client = createTrpcClient();
      const result = await client.ai.getMove.mutate({
        board: st1.board,
        turn: st1.turn,
        winner: st1.winner,
        size: st1.size,
        strategy: strategy,
        moveBudget: strategy.startsWith("dapetcu21") ? 1000 : undefined,
      });

      const aiMove = result.move;
      if (!aiMove) return;
      const next = applyMove(st1, aiMove);
      const hist = pushHistory(useGameStore.getState().history, next);
      useGameStore.setState({ state: next, history: hist, lastMove: aiMove, canUndo: hist.cursor > 0, canRedo: false, selected: null });
    } catch (error) {
      console.error("Error getting AI move:", error);
    }
  }, 50);
}

function computeLastMoveFromHistory(hist: History): Move | null {
  if (hist.cursor <= 0) return null;
  const prev = hist.list[hist.cursor - 1];
  const curr = hist.list[hist.cursor];
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
  if (from) {
    const [fr, fc] = from;
    const moverColor = prev.board[fr][fc]!.color;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const a = prev.board[r][c];
        const b = curr.board[r][c];
        if ((a?.color !== b?.color) && b && b.color === moverColor) {
          to = [r, c];
        }
      }
    }
  }
  if (from && to) return { from, to };
  return null;
}
