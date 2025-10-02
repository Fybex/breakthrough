import { GameState, Move } from "../engine/breakthrough";

export interface AIStrategy {
  name: string;
  chooseMove(state: GameState, options?: StrategyOptions): Move | null;
}

export interface StrategyOptions {
  verbose?: boolean;
  timeMs?: number;
  maxDepth?: number;
  moveBudget?: number;
}