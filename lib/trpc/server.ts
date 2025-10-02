import { initTRPC } from "@trpc/server";
import { ZodError } from "zod";

export type Context = Record<string, unknown>;

export const createContext = async (): Promise<Context> => ({});

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const mergeRouters = t.mergeRouters;
