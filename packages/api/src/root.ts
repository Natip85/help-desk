import { automationRouter } from "./routers/automation";
import { cannedResponseRouter } from "./routers/canned-response";
import { contactRouter } from "./routers/contact";
import { defaultFilterRouter } from "./routers/default-filter";
import { domainRouter } from "./routers/domain";
import { mailboxRouter } from "./routers/mailbox";
import { notificationRouter } from "./routers/notification";
import { savedFilterRouter } from "./routers/saved-filter";
import { tagRouter } from "./routers/tag";
import { ticketRouter } from "./routers/ticket";
import { userRouter } from "./routers/user";
import { createCallerFactory, createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  user: userRouter,
  ticket: ticketRouter,
  contact: contactRouter,
  domain: domainRouter,
  mailbox: mailboxRouter,
  tags: tagRouter,
  automation: automationRouter,
  cannedResponse: cannedResponseRouter,
  savedFilter: savedFilterRouter,
  defaultFilter: defaultFilterRouter,
  notification: notificationRouter,
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
