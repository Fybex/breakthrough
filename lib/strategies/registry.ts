import { AIStrategy } from "./types";
import { MineStrategy } from "./mine";
import { Dapetcu21MinimaxStrategy } from "./dapetcu21-minimax";
import { Dapetcu21MonteCarloStrategy } from "./dapetcu21-montecarlo";

export class StrategyRegistry {
  private static strategies: Map<string, () => AIStrategy> = new Map();

  static {
    
    this.register("mine", () => new MineStrategy());
    this.register("dapetcu21-minimax", () => new Dapetcu21MinimaxStrategy());
    this.register("dapetcu21-montecarlo", () => new Dapetcu21MonteCarloStrategy());
  }

  static register(name: string, factory: () => AIStrategy): void {
    this.strategies.set(name.toLowerCase(), factory);
  }

  static get(name: string): AIStrategy | null {
    const factory = this.strategies.get(name.toLowerCase());
    return factory ? factory() : null;
  }

  static list(): string[] {
    return Array.from(this.strategies.keys());
  }

  static has(name: string): boolean {
    return this.strategies.has(name.toLowerCase());
  }
}

export function getStrategy(name: string): AIStrategy | null {
  return StrategyRegistry.get(name);
}

export type StrategyName = "mine" | "dapetcu21-minimax" | "dapetcu21-montecarlo" | string;