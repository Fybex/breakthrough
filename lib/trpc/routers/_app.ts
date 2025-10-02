import { router } from "@/lib/trpc/server";
import { aiRouter } from "./ai";

export const appRouter = router({
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
