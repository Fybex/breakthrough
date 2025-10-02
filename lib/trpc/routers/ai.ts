import { z } from "zod";
import { publicProcedure, router } from "@/lib/trpc/server";
import { getStrategy } from "@/lib/strategies";
import type { GameState } from "@/lib/engine/breakthrough";

export const aiRouter = router({
  getMove: publicProcedure
    .input(
      z.object({
        board: z.array(
          z.array(z.object({ color: z.enum(["W", "B"]) }).nullable())
        ),
        turn: z.enum(["W", "B"]),
        winner: z.enum(["W", "B"]).optional(),
        size: z.number(),
        strategy: z.enum(["mine", "dapetcu21-minimax", "dapetcu21-montecarlo"]).optional().default("mine"),
        moveBudget: z.number().optional().default(1000),
      })
    )
    .output(
      z.object({
        move: z
          .object({
            from: z.tuple([z.number(), z.number()]),
            to: z.tuple([z.number(), z.number()]),
            capture: z.boolean().optional(),
          })
          .nullable(),
      })
    )
    .mutation(async ({ input }) => {
      
      const state: GameState = {
        board: input.board,
        turn: input.turn,
        winner: input.winner,
        size: input.size,
      };

      const strategy = getStrategy(input.strategy);
      if (!strategy) {
        throw new Error(`Unknown strategy: ${input.strategy}`);
      }

      const move = strategy.chooseMove(state, {
        maxDepth: 4,
        verbose: false,
      });

      return { move };
    }),

  getMinimaxMove: publicProcedure
    .input(
      z.object({
        board: z.array(
          z.array(z.object({ color: z.enum(["W", "B"]) }).nullable())
        ),
        turn: z.enum(["W", "B"]),
        winner: z.enum(["W", "B"]).optional(),
        size: z.number(),
        moveBudget: z.number().optional().default(1000),
      })
    )
    .output(
      z.object({
        move: z
          .object({
            from: z.tuple([z.number(), z.number()]),
            to: z.tuple([z.number(), z.number()]),
            capture: z.boolean().optional(),
          })
          .nullable(),
      })
    )
    .mutation(async ({ input }) => {
      
      const state: GameState = {
        board: input.board,
        turn: input.turn,
        winner: input.winner,
        size: input.size,
      };

      const strategy = getStrategy("dapetcu21-minimax");
      if (!strategy) {
        throw new Error("Dapetcu21 minimax strategy not found");
      }

      const move = strategy.chooseMove(state, {
        verbose: false,
      });

      return { move };
    }),
});
