#!/usr/bin/env node

import {
  initialState,
  applyMove,
  allLegalMoves,
  GameState,
  Move,
} from "./lib/engine/breakthrough";
import { getStrategy, AIStrategy } from "./lib/strategies";
import { Command } from "commander";
import { createServiceLogger } from "./lib/logger";

type StrategyName = string;

export interface BenchmarkConfig {
  totalGames: number;
  minOpeningMoves: number;
  maxOpeningMoves: number;
  maxMoves: number;
  verbose: boolean;
  save: boolean;
}

const DEFAULT_CONFIG: BenchmarkConfig = {
  totalGames: 100,
  minOpeningMoves: 4,
  maxOpeningMoves: 12,
  maxMoves: 200,
  verbose: false,
  save: false,
};

class RandomStrategy implements AIStrategy {
  name = "random";

  chooseMove(state: GameState): Move | null {
    const moves = allLegalMoves(state);
    if (moves.length === 0) return null;

    return moves[Math.floor(Math.random() * moves.length)];
  }
}

interface GameResult {
  white: StrategyName;
  black: StrategyName;
  winner: "white" | "black" | "draw";
  moves: number;
  openingMoves: number;
}

const benchmarkLogger = createServiceLogger("benchmark", {
  enableConsole: true,
  enableFile: false,
});

function generateRandomOpeningPosition(
  minMoves: number,
  maxMoves: number
): GameState {
  let state = initialState(8);
  const numOpeningMoves =
    Math.floor(Math.random() * (maxMoves - minMoves + 1)) + minMoves;

  for (let i = 0; i < numOpeningMoves; i++) {
    const legalMoves = allLegalMoves(state);
    if (legalMoves.length === 0) break;

    const randomMove =
      legalMoves[Math.floor(Math.random() * legalMoves.length)];
    state = applyMove(state, randomMove);

    if (state.winner) break;
  }

  return state;
}

async function playGame(
  whiteStrategy: AIStrategy,
  blackStrategy: AIStrategy,
  minMoves: number,
  maxMoves: number,
  maxGameMoves: number
): Promise<GameResult> {
  const openingPosition = generateRandomOpeningPosition(minMoves, maxMoves);

  if (openingPosition.winner) {
    return {
      white: whiteStrategy.name,
      black: blackStrategy.name,
      winner: openingPosition.winner === "W" ? "white" : "black",
      moves: 0,
      openingMoves:
        Math.floor(Math.random() * (maxMoves - minMoves + 1)) + minMoves,
    };
  }

  let state = openingPosition;
  let moveCount = 0;

  while (!state.winner && moveCount < maxGameMoves) {
    const currentStrategy = state.turn === "W" ? whiteStrategy : blackStrategy;
    const move = currentStrategy.chooseMove(state);

    if (!move) break;

    state = applyMove(state, move);
    moveCount++;
  }

  return {
    white: whiteStrategy.name,
    black: blackStrategy.name,
    winner:
      state.winner === "W" ? "white" : state.winner === "B" ? "black" : "draw",
    moves: moveCount,
    openingMoves:
      Math.floor(Math.random() * (maxMoves - minMoves + 1)) + minMoves,
  };
}

async function runBenchmark(
  strategyNames: StrategyName[],
  config: BenchmarkConfig
): Promise<void> {
  benchmarkLogger.info(
    `Starting benchmark with strategies: ${strategyNames.join(", ")}`
  );

  const allStrategies = ["random", ...strategyNames];
  const strategies = allStrategies.map((name) => {
    if (name === "random") {
      return new RandomStrategy();
    }
    const strategy = getStrategy(name);
    if (!strategy) {
      throw new Error(`Unknown strategy: ${name}`);
    }
    return strategy;
  });

  const gameTasks: Promise<GameResult>[] = [];

  for (let i = 0; i < strategies.length; i++) {
    for (let j = 0; j < strategies.length; j++) {
      const whiteStrategy = strategies[i];
      const blackStrategy = strategies[j];

      const gamesPerMatchup = Math.max(
        1,
        Math.floor(config.totalGames / (strategies.length * strategies.length))
      );

      for (let game = 0; game < gamesPerMatchup; game++) {
        gameTasks.push(
          playGame(
            whiteStrategy,
            blackStrategy,
            config.minOpeningMoves,
            config.maxOpeningMoves,
            config.maxMoves
          )
        );
      }
    }
  }

  if (config.verbose) {
    benchmarkLogger.info(
      `Playing ${gameTasks.length} games with random positions in parallel...`
    );
  }

  const results = await Promise.all(gameTasks);

  const overallStats = calculateOverallStats(results);
  analyzeResults(results);

  if (config.save) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `logs/benchmark-results-${timestamp}.json`;
    import("fs").then((fs) => {
      fs.writeFileSync(
        filename,
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            config,
            strategies: allStrategies,
            results,
            overallStats,
            summary: {
              totalGames: results.length,
              minOpeningMoves: config.minOpeningMoves,
              maxOpeningMoves: config.maxOpeningMoves,
              averageMovesPerGame:
                Math.round(
                  (results.reduce((sum, r) => sum + r.moves, 0) /
                    results.length) *
                    10
                ) / 10,
            },
          },
          null,
          2
        )
      );
    });
    benchmarkLogger.info(`Results saved to ${filename}`);
  }
}

function calculateOverallStats(results: GameResult[]): {
  [strategy: string]: {
    wins: number;
    losses: number;
    draws: number;
    winrate: number;
  };
} {
  const strategyNames = Array.from(
    new Set(results.flatMap((r) => [r.white, r.black]))
  );
  const overallStats: {
    [strategy: string]: {
      wins: number;
      losses: number;
      draws: number;
      winrate: number;
    };
  } = {};

  strategyNames.forEach((strategy) => {
    overallStats[strategy] = { wins: 0, losses: 0, draws: 0, winrate: 0 };
  });

  results.forEach((result) => {
    if (result.winner === "white") {
      overallStats[result.white].wins++;
      overallStats[result.black].losses++;
    } else if (result.winner === "black") {
      overallStats[result.black].wins++;
      overallStats[result.white].losses++;
    } else {
      overallStats[result.white].draws++;
      overallStats[result.black].draws++;
    }
  });

  strategyNames.forEach((strategy) => {
    const stats = overallStats[strategy];
    const total = stats.wins + stats.losses + stats.draws;
    stats.winrate =
      total > 0 ? Math.round((stats.wins / total) * 100 * 10) / 10 : 0;
  });

  return overallStats;
}

function analyzeResults(results: GameResult[]): void {
  console.log("\nBENCHMARK RESULTS");
  console.log("=".repeat(80));

  const strategyNames = Array.from(
    new Set(results.flatMap((r) => [r.white, r.black]))
  );

  console.log("\nWinrate Table:");
  console.log("-".repeat(80));

  const tableData: {
    [white: string]: {
      [black: string]: { white: number; black: number; draw: number };
    };
  } = {};

  strategyNames.forEach((white) => {
    tableData[white] = {};
    strategyNames.forEach((black) => {
      tableData[white][black] = { white: 0, black: 0, draw: 0 };
    });
  });

  results.forEach((result) => {
    tableData[result.white][result.black][result.winner]++;
  });

  const header =
    "White \\ Black    " + strategyNames.map((name) => name.padEnd(8)).join("");
  console.log(header);
  console.log("-".repeat(header.length));

  strategyNames.forEach((white) => {
    const row = [white.padEnd(15)];
    strategyNames.forEach((black) => {
      const stats = tableData[white][black];
      const total = stats.white + stats.black + stats.draw;
      const winrate =
        total > 0 ? ((stats.white / total) * 100).toFixed(1) : "0.0";
      row.push(`${winrate}%`.padEnd(8));
    });
    console.log(row.join(""));
  });

  console.log("\nOverall Statistics:");
  console.log("-".repeat(80));

  const overallStats = calculateOverallStats(results);

  strategyNames.forEach((strategy) => {
    const stats = overallStats[strategy];
    console.log(
      `${strategy.padEnd(12)}: Winrate: ${stats.winrate}% | Wins: ${
        stats.wins
      }, Losses: ${stats.losses}, Draws: ${stats.draws}`
    );
  });
}

const program = new Command();
program
  .name("benchmark")
  .description("AI strategy benchmark for Breakthrough")
  .option(
    "-s, --strategies <strategies>",
    "Comma-separated list of strategy names",
    "mine,dapetcu21-minimax,dapetcu21-montecarlo"
  )
  .option("-g, --games <number>", "Total number of games", "100")
  .option("--min-opening <number>", "Minimum random opening moves", "4")
  .option("--max-opening <number>", "Maximum random opening moves", "12")
  .option("-m, --moves <number>", "Max moves per game", "200")
  .option("-v, --verbose", "Verbose output")
  .option("--save", "Save results to JSON file")
  .parse();

const options = program.opts();

const config: BenchmarkConfig = {
  ...DEFAULT_CONFIG,
  totalGames: parseInt(options.games) || DEFAULT_CONFIG.totalGames,
  minOpeningMoves:
    parseInt(options.minOpening) || DEFAULT_CONFIG.minOpeningMoves,
  maxOpeningMoves:
    parseInt(options.maxOpening) || DEFAULT_CONFIG.maxOpeningMoves,
  maxMoves: parseInt(options.moves) || DEFAULT_CONFIG.maxMoves,
  verbose: options.verbose || DEFAULT_CONFIG.verbose,
  save: options.save || DEFAULT_CONFIG.save,
};

const strategyNames = options.strategies
  .split(",")
  .map((s: string) => s.trim());

runBenchmark(strategyNames, config).catch((error) => {
  benchmarkLogger.error(`Benchmark failed: ${error.message}`);
  process.exit(1);
});
