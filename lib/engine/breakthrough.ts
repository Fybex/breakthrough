export type Color = "W" | "B";

export type Piece = {
  color: Color;
};

export type Board = (Piece | null)[][]; 

export type Move = {
  from: [number, number];
  to: [number, number];
  capture?: boolean;
};

export type GameState = {
  board: Board;
  turn: Color;
  winner?: Color;
  size: number;
};

export function initialState(size = 8): GameState {
  const board: Board = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );

  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < size; c++) board[r][c] = { color: "B" };
  }
  
  for (let r = size - 2; r < size; r++) {
    for (let c = 0; c < size; c++) board[r][c] = { color: "W" };
  }

  return { board, turn: "W", size };
}

export function inBounds(state: GameState, r: number, c: number) {
  return r >= 0 && c >= 0 && r < state.size && c < state.size;
}

export function pieceAt(state: GameState, r: number, c: number) {
  return state.board[r][c];
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

export function legalMovesFrom(
  state: GameState,
  r: number,
  c: number
): Move[] {
  const p = pieceAt(state, r, c);
  if (!p) return [];
  const dir = p.color === "W" ? -1 : 1; 
  const moves: Move[] = [];

  const fr = r + dir;
  if (inBounds(state, fr, c) && !pieceAt(state, fr, c)) {
    moves.push({ from: [r, c], to: [fr, c] });
  }
  
  for (const dc of [-1, 1] as const) {
    const cr = r + dir;
    const cc = c + dc;
    if (!inBounds(state, cr, cc)) continue;
    const target = pieceAt(state, cr, cc);
    if (!target) {
      
      moves.push({ from: [r, c], to: [cr, cc] });
    } else if (target.color !== p.color) {
      
      moves.push({ from: [r, c], to: [cr, cc], capture: true });
    }
  }
  return moves;
}

export function allLegalMoves(state: GameState): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < state.size; r++) {
    for (let c = 0; c < state.size; c++) {
      const p = state.board[r][c];
      if (!p || p.color !== state.turn) continue;
      const ms = legalMovesFrom(state, r, c);
      for (const m of ms) moves.push(m);
    }
  }
  return moves;
}

export function applyMove(state: GameState, move: Move): GameState {
  const { from, to } = move;
  const [fr, fc] = from;
  const [tr, tc] = to;
  const p = pieceAt(state, fr, fc);
  if (!p) return state;

  const board = cloneBoard(state.board);
  board[fr][fc] = null;
  board[tr][tc] = { color: p.color };

  const winner = checkWinner({ ...state, board, turn: state.turn });
  const nextTurn: Color = p.color === "W" ? "B" : "W";

  return { ...state, board, turn: winner ? state.turn : nextTurn, winner };
}

export function checkWinner(state: GameState): Color | undefined {
  
  for (let c = 0; c < state.size; c++) {
    if (state.board[0][c]?.color === "W") return "W";
    if (state.board[state.size - 1][c]?.color === "B") return "B";
  }
  return undefined;
}
