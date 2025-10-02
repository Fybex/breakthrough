import { GameState, Move, allLegalMoves, applyMove } from "../engine/breakthrough";
import { AIStrategy, StrategyOptions } from "./types";

class RandomStrategy {
  chooseMove(state: GameState): Move | null {
    const moves = allLegalMoves(state);
    if (moves.length === 0) return null;
    return moves[Math.floor(Math.random() * moves.length)];
  }
}

interface MCNode {
  state: GameState;
  parent?: MCNode;
  children: MCNode[];
  childCount: number;
  score: number;
  playouts: number;
  discovered: boolean;
  winner?: 'W' | 'B' | 'draw';
  moves?: Move[];
  moveCount?: number;
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 1; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export class Dapetcu21MonteCarloStrategy implements AIStrategy {
  name = "dapetcu21-montecarlo";
  private randomStrategy = new RandomStrategy();

  chooseMove(state: GameState, options: StrategyOptions = {}): Move | null {
    const { moveBudget = 1000 } = options;
    const moves = allLegalMoves(state);
    if (moves.length === 0) return null;

    const root: MCNode = {
      state,
      children: [],
      childCount: 0,
      score: 0,
      playouts: 0,
      discovered: false,
    };

    this.discover(root);

    let movesUsed = 0;

    while (movesUsed < moveBudget) {
      const selectedNode = this.select(root);
      const [expandedNode, movesUsedExpand] = this.expand(selectedNode);

      const playoutBudget = moveBudget - movesUsed - movesUsedExpand;
      const [score, movesUsedPlayout, interrupted] = this.playout(
        expandedNode,
        playoutBudget,
        state.turn === 'W' ? 'W' : 'B'
      );

      if (interrupted) {
        break;
      }

      movesUsed += Math.max(1, movesUsedExpand + movesUsedPlayout);

      let node: MCNode | undefined = expandedNode;
      while (node) {
        node.playouts++;
        node.score += score;
        node = node.parent;
      }
    }

    let bestMove: Move | undefined;
    let bestWinRate = -1;

    for (let i = 0; i < root.children.length; i++) {
      const child = root.children[i];
      if (child.playouts === 0) continue;

      const winRate = child.score / child.playouts;
      if (winRate > bestWinRate && root.moves && root.moves[i]) {
        bestWinRate = winRate;
        bestMove = root.moves[i];
      }
    }

    if (!bestMove) {
      return this.randomStrategy.chooseMove(state);
    }

    return bestMove;
  }

  private discover(node: MCNode): void {
    if (node.discovered) return;
    node.discovered = true;

    const winner = this.getWinner(node.state);
    if (winner) {
      node.winner = winner;
      return;
    }

    const moves = shuffle(allLegalMoves(node.state));
    node.moves = moves;
    node.moveCount = moves.length;
  }

  private select(node: MCNode): MCNode {
    while (true) {
      this.discover(node);

      if (node.winner !== undefined) {
        return node;
      }

      if (node.moveCount !== node.childCount) {
        return node;
      }

      let bestChild: MCNode | undefined;
      let bestConfidenceBound = -1;

      for (const child of node.children) {
        if (child.playouts === 0) continue;

        const confidenceBound =
          child.score / child.playouts +
          Math.sqrt(2 * Math.log(node.playouts) / child.playouts);

        if (confidenceBound > bestConfidenceBound) {
          bestChild = child;
          bestConfidenceBound = confidenceBound;
        }
      }

      if (!bestChild) {
        return node;
      }

      node = bestChild;
    }
  }

  private expand(node: MCNode): [MCNode, number] {
    if (node.winner !== undefined || !node.moveCount || node.moveCount === 0) {
      return [node, 0];
    }

    const childCount = node.childCount + 1;
    node.childCount = childCount;

    if (!node.moves || !node.moves[childCount - 1]) {
      return [node, 0];
    }

    const move = node.moves[childCount - 1];
    const newState = applyMove(node.state, move);

    const child: MCNode = {
      state: newState,
      parent: node,
      children: [],
      childCount: 0,
      score: 0,
      playouts: 0,
      discovered: false,
    };

    node.children.push(child);
    return [child, 1];
  }

  private playout(
    node: MCNode,
    moveBudget: number,
    currentPlayer: 'W' | 'B'
  ): [score: number, movesUsed: number, interrupted: boolean] {
    let movesUsed = 0;
    let state = node.state;
    let winner = this.getWinner(state);

    while (movesUsed < moveBudget && !winner) {
      const nextMove = this.randomStrategy.chooseMove(state);

      if (!nextMove) {
        return [0.5, movesUsed, false];
      }

      state = applyMove(state, nextMove);
      winner = this.getWinner(state);
      movesUsed++;
    }

    if (!winner) {
      return [0.5, movesUsed, true];
    }

    const score = winner === 'draw' ? 0.5 : (winner === currentPlayer ? 1 : 0);
    return [score, movesUsed, false];
  }

  private getWinner(state: GameState): 'W' | 'B' | 'draw' | undefined {
    
    for (let r = 0; r < state.size; r++) {
      for (let c = 0; c < state.size; c++) {
        const piece = state.board[r][c];
        if (!piece) continue;

        if (piece.color === 'W' && r === 0) {
          return 'W';
        }
        
        if (piece.color === 'B' && r === state.size - 1) {
          return 'B';
        }
      }
    }

    let hasPieces = false;
    for (let r = 0; r < state.size; r++) {
      for (let c = 0; c < state.size; c++) {
        if (state.board[r][c]) {
          hasPieces = true;
          break;
        }
      }
      if (hasPieces) break;
    }

    if (!hasPieces) {
      return 'draw';
    }

    return undefined; 
  }
}