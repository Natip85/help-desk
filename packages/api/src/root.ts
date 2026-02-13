import { contactRouter } from "./routers/contact";
import { mailboxRouter } from "./routers/mailbox";
import { tagRouter } from "./routers/tag";
import { ticketRouter } from "./routers/ticket";
import { userRouter } from "./routers/user";
import { createCallerFactory, createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  user: userRouter,
  ticket: ticketRouter,
  contact: contactRouter,
  mailbox: mailboxRouter,
  tags: tagRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.product.all();
 *       ^? Product[]
 */
export const createCaller = createCallerFactory(appRouter);
