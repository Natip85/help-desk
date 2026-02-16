import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "./root";
import { appRouter, createCaller } from "./root";
import {
  createCallerFactory,
  createOuterContext,
  createTRPCContext,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  requirePermission,
} from "./trpc";

/**
 * Inference helpers for input types
 * @example
 * type ProductByIdInput = RouterInputs['product']['byId']
 *      ^? { id: number }
 **/
type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example
 * type AllProductsOutput = RouterOutputs['product']['all']
 *      ^? Product[]
 **/
type RouterOutputs = inferRouterOutputs<AppRouter>;

export {
  createTRPCContext,
  createOuterContext,
  createTRPCRouter,
  createCallerFactory,
  publicProcedure,
  protectedProcedure,
  requirePermission,
  appRouter,
  createCaller,
};
export type { AppRouter, RouterInputs, RouterOutputs };

// Client-safe schemas are available via "@help-desk/api/schemas"
// Server-side query builders are available via "./lib" internal imports
