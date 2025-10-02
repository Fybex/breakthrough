import { GameState, Move, allLegalMoves, applyMove, inBounds as gameInBounds } from "../engine/breakthrough";
import { AIStrategy, StrategyOptions } from "./types";

type Side = "W" | "B";
const DIR: Record<Side, number> = { W: -1, B: 1 };

function inBounds(n: number, r: number, c: number): boolean {
  return gameInBounds({ size: n } as GameState, r, c);
}

function mostAdvancedPawns(state: GameState, side: Side): Array<[number, number]> {
  const n = state.size;
  let bestRow = side === "W" ? n : -1;
  const out: Array<[number, number]> = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const p = state.board[r][c];
      if (!p || p.color !== side) continue;
      if (side === "W") {
        if (r < bestRow) {
          bestRow = r;
          out.length = 0;
          out.push([r, c]);
        } else if (r === bestRow) out.push([r, c]);
      } else {
        if (r > bestRow) {
          bestRow = r;
          out.length = 0;
          out.push([r, c]);
        } else if (r === bestRow) out.push([r, c]);
      }
    }
  }
  return out;
}

function isPassed(
  state: GameState,
  side: Side,
  r: number,
  c: number
): boolean {
  const n = state.size;
  const opp: Side = side === "W" ? "B" : "W";
  const d = DIR[side];
  for (let rr = r + d; rr >= 0 && rr < n; rr += d) {
    for (let dc = -1; dc <= 1; dc++) {
      const cc = c + dc;
      if (!inBounds(n, rr, cc)) continue;
      const q = state.board[rr][cc];
      if (q && q.color === opp) return false;
    }
  }
  return true;
}

function distToPromo(state: GameState, side: Side, r: number): number {
  const n = state.size;
  return side === "W" ? r : n - 1 - r;
}

function isLikelyUnstoppable(
  state: GameState,
  side: Side,
  r: number,
  c: number
): boolean {
  const n = state.size;
  if (!isPassed(state, side, r, c)) return false;
  const d = DIR[side];
  const remaining = distToPromo(state, side, r);
  const opp: Side = side === "W" ? "B" : "W";
  for (let rr = r + d; rr >= 0 && rr < n; rr += d) {
    for (let dc = -1; dc <= 1; dc++) {
      const cc = c + dc;
      if (!inBounds(n, rr, cc)) continue;
      const q = state.board[rr][cc];
      if (q?.color === opp) {
        const rowsApart = Math.abs(rr - r);
        if (rowsApart <= remaining + 1) return false;
      }
    }
  }
  return remaining <= 3;
}

const CENTER_COL_SCORE = [0, 10, 20, 25, 25, 20, 10, 0];
const EDGE_COL = 0;
const EDGE_COL_R = 7;

function evaluate(state: GameState): number {
  if (state.winner === "W") return 100_000;
  if (state.winner === "B") return -100_000;

  const n = state.size;
  let score = 0;

  let whitePieces = 0;
  let blackPieces = 0;
  let whiteAdvanced = 0;
  let blackAdvanced = 0;
  let whiteCenter = 0;
  let blackCenter = 0;
  let whiteFlank = 0;
  let blackFlank = 0;
  let whiteBack = 0;
  let blackBack = 0;

  for (let r = 0; r < n; r++) {
    const row = state.board[r];
    for (let c = 0; c < n; c++) {
      const p = row[c];
      if (!p) continue;

      const centerBonus = CENTER_COL_SCORE[c];

      const advancement = p.color === "W" ? n - 1 - r : r;
      const advBonus = advancement * 22;

      let flank = 0;
      if (c === EDGE_COL || c === EDGE_COL_R) flank = -10;
      else if (c === EDGE_COL + 1 || c === EDGE_COL_R - 1) flank = -5;

      let mobility = 0;
      const dir = p.color === "W" ? -1 : 1;
      const fr = r + dir;
      if (fr >= 0 && fr < n) {
        if (!state.board[fr][c]) mobility += 10;
        if (c > 0 && !state.board[fr][c - 1] && c >= 3) mobility += 4;
        if (c + 1 < n && !state.board[fr][c + 1] && c <= 4) mobility += 4;
      }

      let runner = 0;
      if (isPassed(state, p.color as Side, r, c)) {
        runner += 20 + (6 - Math.min(6, distToPromo(state, p.color as Side, r))) * 15;
        if (
          distToPromo(state, p.color as Side, r) <= 1
        ) {
          runner += 60;
        }
        if (isLikelyUnstoppable(state, p.color as Side, r, c)) {
          runner += 120;
        }
      }

      const pieceScore =
        130 + advBonus + centerBonus + flank + mobility + runner;
      score += p.color === "W" ? pieceScore : -pieceScore;

      if (p.color === "W") {
        whitePieces++;
        if (r <= 2) whiteAdvanced++;
        if (centerBonus > 0) whiteCenter++;
      } else {
        blackPieces++;
        if (r >= n - 3) blackAdvanced++;
        if (centerBonus > 0) blackCenter++;
      }
    }
  }

  score += (whitePieces - blackPieces) * 290;
  score += (whiteAdvanced - blackAdvanced) * 140;
  score += (whiteCenter - blackCenter) * 45;

  for (let c = 0; c < n; c++) {
    if (state.board[n - 1][c]?.color === "W") whiteBack++;
    if (state.board[0][c]?.color === "B") blackBack++;
    if (
      state.board[0][c]?.color === "B" &&
      (c === EDGE_COL || c === EDGE_COL_R)
    )
      blackFlank++;
    if (
      state.board[n - 1][c]?.color === "W" &&
      (c === EDGE_COL || c === EDGE_COL_R)
    )
      whiteFlank++;
  }

  score += (blackFlank - whiteFlank) * 15;
  score += (blackBack - whiteBack) * 18;

  return score;
}

function orderMoves(moves: Move[], state: GameState): Move[] {
  const n = state.size;
  const side = state.turn;
  const promoRow = side === "W" ? 0 : n - 1;
  const opp: Side = side === "W" ? "B" : "W";
  const enemyRunners = mostAdvancedPawns(state, opp);

  return moves
    .map((m) => {
      if (m.to[0] === promoRow) return { m, k: 10_000 };

      let k = 0;
      if (m.capture) {
        k += 500;
        const c = m.to[1];
        if (c >= 2 && c <= 5) k += 120;
      }

      const adv = side === "W" ? m.from[0] - m.to[0] : m.to[0] - m.from[0];
      k += adv * 40;

      const cd = 3.5 - Math.abs(m.to[1] - 3.5);
      k += cd * 10;

      if (m.from[1] === 0 || m.from[1] === 7) k += 8;

      if (m.to[1] !== m.from[1]) k += 5;

      for (const [er, ec] of enemyRunners) {
        const br = er + DIR[opp];
        if (m.to[0] === er && m.to[1] === ec && m.capture) k += 800;
        if (inBounds(n, br, ec) && m.to[0] === br && m.to[1] === ec) k += 350;
        const dl = [br, ec - 1];
        const dr = [br, ec + 1];
        if (inBounds(n, dl[0], dl[1]) && m.to[0] === dl[0] && m.to[1] === dl[1]) k += 120;
        if (inBounds(n, dr[0], dr[1]) && m.to[0] === dr[0] && m.to[1] === dr[1]) k += 120;
      }

      return { m, k };
    })
    .sort((a, b) => b.k - a.k)
    .map((x) => x.m);
}

type SearchOptions = {
  maxDepth?: number;
};

function negamaxPVS(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  color: 1 | -1,
  ply: number
): number {
  if (depth === 0 || state.winner) {
    return color * evaluate(state);
  }

  const moves = allLegalMoves(state);
  if (moves.length === 0) {
    return color * evaluate(state);
  }

  const ordered = orderMoves(moves, state);

  let best = -Infinity;
  let a = alpha;
  let first = true;

  for (let i = 0; i < ordered.length; i++) {
    const next = applyMove(state, ordered[i]);
    const to = ordered[i].to;
    const from = ordered[i].from;
    const n = state.size;

    const isCapture = !!ordered[i].capture;
    const promoRow = (state.turn === "W" ? 0 : n - 1);
    const isPromotion = to[0] === promoRow;
    let isPassedAdvance = false;
    {
      const moved = state.board[from[0]][from[1]];
      if (moved) {
        const side: Side = moved.color;
        const movedAfter = next.board[to[0]][to[1]];
        if (movedAfter && isPassed(next, side, to[0], to[1])) {
          const advanced =
            (side === "W" ? from[0] > to[0] : to[0] > from[0]);
          if (advanced) isPassedAdvance = true;
        }
      }
    }

    let score: number;
    if (first) {
      const ext = isPromotion || isPassedAdvance ? 1 : 0;
      score = -negamaxPVS(next, depth - 1 + ext, -beta, -a, (-color as 1 | -1), ply + 1);
      first = false;
    } else {
      let reduce = 0;
      const quiet = !isCapture && !isPromotion && !isPassedAdvance;
      if (quiet && depth >= 3 && i >= 3) reduce = 1;

      score = -negamaxPVS(
        next,
        depth - 1 - reduce,
        -a - 1,
        -a,
        (-color as 1 | -1),
        ply + 1
      );
      if (score > a && score < beta) {
        score = -negamaxPVS(next, depth - 1, -beta, -a, (-color as 1 | -1), ply + 1);
      }
    }

    if (score > best) best = score;
    if (best > a) a = best;
    if (a >= beta) {
      break;
    }
  }

  return best;
}

function searchBestMove(
  state: GameState,
  opts: SearchOptions
): { move: Move | null; score: number } {
  const maxDepth = opts.maxDepth ?? 4;
  const color: 1 | -1 = state.turn === "W" ? 1 : -1;

  let bestMove: Move | null = null;
  let bestScore = -Infinity;

  const moves = orderMoves(allLegalMoves(state), state);
  if (moves.length === 0) return { move: null, score: color * evaluate(state) };

  for (let depth = 1; depth <= maxDepth; depth++) {
    let localBest = -Infinity;
    let localMove: Move | null = null;

    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      const next = applyMove(state, m);
      const score = -negamaxPVS(
        next,
        depth - 1,
        -Infinity,
        Infinity,
        -color as 1 | -1,
        1
      );

      if (score > localBest) {
        localBest = score;
        localMove = m;
        if (i > 0) {
          const tmp = moves[0];
          moves[0] = moves[i];
          moves[i] = tmp;
        }
      }
    }

    if (localMove) {
      bestMove = localMove;
      bestScore = localBest;
    }
  }

  return { move: bestMove, score: bestScore };
}

export class MineStrategy implements AIStrategy {
  name = "mine";

  chooseMove(state: GameState, options: StrategyOptions = {}): Move | null {
    const { maxDepth = 4 } = options;

    const { move } = searchBestMove(state, {
      maxDepth
    });

    return move;
  }
}