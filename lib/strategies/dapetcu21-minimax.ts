import {
  GameState,
  Move,
  allLegalMoves,
  applyMove,
} from "../engine/breakthrough";
import { AIStrategy } from "./types";

function evaluate(state: GameState): number {
  if (state.winner === "W") return 100_000;
  if (state.winner === "B") return -100_000;

  const n = state.size;
  const currentPlayer = state.turn;
  let total = 0;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const p = state.board[r][c];
      if (!p) continue;

      const pieceAdv = p.color === "W" ? n - r : r + 1;
      const score = pieceAdv * pieceAdv;

      if (p.color === currentPlayer) {
        total += score;
      } else {
        total -= score;
      }
    }
  }

  return total;
}

function alphabeta(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  getMoves: (state: GameState) => Move[],
  applyMoveFn: (state: GameState, move: Move) => GameState | null
): { value: number; bestMove: Move | undefined } | null {
  if (depth === 0 || state.winner) {
    if (state.winner === state.turn) {
      return { value: Infinity, bestMove: undefined };
    } else if (state.winner) {
      return { value: -Infinity, bestMove: undefined };
    }
    return { value: evaluate(state), bestMove: undefined };
  }

  const moves = getMoves(state);
  if (moves.length === 0) {
    return { value: evaluate(state), bestMove: undefined };
  }

  let bestValue = -Infinity;
  let bestMove: Move | undefined;

  for (const move of moves) {
    const child = applyMoveFn(state, move);
    if (!child) continue;

    const childResult = alphabeta(
      child,
      depth - 1,
      -beta,
      -alpha,
      getMoves,
      applyMoveFn
    );
    if (!childResult) continue;

    const childValue = -childResult.value;

    if (childValue > bestValue) {
      bestValue = childValue;
      bestMove = move;
    }

    alpha = Math.max(alpha, bestValue);
    if (beta <= alpha) {
      break;
    }
  }

  return { value: bestValue, bestMove };
}

export class Dapetcu21MinimaxStrategy implements AIStrategy {
  name = "dapetcu21-minimax";

  chooseMove(state: GameState): Move | null {
    const moves = allLegalMoves(state);
    if (moves.length === 0) return null;

    let result = moves[Math.floor(Math.random() * moves.length)];

    let movesUsed = 0;
    const moveBudget = 10000;
    const moveCache = new Map<string, Move[]>();
    const applicationCache = new Map<string, Map<string, GameState | null>>();

    function stateKey(s: GameState): string {
      return (
        s.board
          .map((row) => row.map((cell) => (cell ? cell.color : ".")).join(""))
          .join("|") +
        ":" +
        s.turn
      );
    }

    function getMoves(s: GameState): Move[] {
      const key = stateKey(s);
      const cached = moveCache.get(key);
      if (cached) return cached;

      const moves = allLegalMoves(s);
      moveCache.set(key, moves);
      return moves;
    }

    function applyMoveFn(s: GameState, move: Move): GameState | null {
      const stateKey_s = stateKey(s);
      const cached = applicationCache.get(stateKey_s);
      if (cached) {
        const moveKey = `${move.from[0]},${move.from[1]}-${move.to[0]},${move.to[1]}`;
        const result = cached.get(moveKey);
        if (result !== undefined) return result;
      }

      if (movesUsed >= moveBudget) {
        return null;
      }
      movesUsed++;

      const result = applyMove(s, move);

      if (!cached) {
        applicationCache.set(stateKey_s, new Map());
      }
      const moveKey = `${move.from[0]},${move.from[1]}-${move.to[0]},${move.to[1]}`;
      applicationCache.get(stateKey_s)!.set(moveKey, result);

      return result;
    }

    for (let depth = 1; depth <= 100; depth++) {
      const prevMovesUsed = movesUsed;

      const searchResult = alphabeta(
        state,
        depth,
        -Infinity,
        Infinity,
        getMoves,
        applyMoveFn
      );
      if (searchResult && searchResult.bestMove) {
        result = searchResult.bestMove;
      } else if (!searchResult) {
        break;
      }

      if (movesUsed === prevMovesUsed) {
        break;
      }
    }

    return result;
  }
}
