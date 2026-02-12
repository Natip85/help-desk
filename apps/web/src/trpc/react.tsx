/* eslint-disable no-restricted-properties */
"use client";

import type { QueryClient } from "@tanstack/react-query";
import type { TRPCClient } from "@trpc/client";
import { createContext, useContext, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchStreamLink, loggerLink } from "@trpc/client";
import SuperJSON from "superjson";

import type { AppRouter } from "@help-desk/api";

import { TRPCProvider } from "./";
import { createQueryClient } from "./query-client";

const TRPCClientContext = createContext<TRPCClient<AppRouter> | null>(null);

export function useTRPCClient(): TRPCClient<AppRouter> {
  const client = useContext(TRPCClientContext);
  if (!client) {
    throw new Error("useTRPCClient must be used within TRPCReactProvider");
  }
  return client;
}

let clientQueryClientSingleton: QueryClient | undefined = undefined;
export const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient();
  } else {
    // Browser: use singleton pattern to keep the same query client
    return (clientQueryClientSingleton ??= createQueryClient());
  }
};

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:3000`;
}

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        httpBatchStreamLink({
          transformer: SuperJSON,
          url: getBaseUrl() + "/api/trpc",
          // Limit URL length to prevent "431 Request Header Fields Too Large" errors
          // When exceeded, tRPC will automatically use POST instead of GET
          maxURLLength: 2000,
          fetch: (url, options) => {
            const init: RequestInit = {
              ...(options as RequestInit | undefined),
              credentials: "include",
            };
            return fetch(url as RequestInfo, init);
          },
          async headers() {
            const headers = new Headers();
            headers.set("x-trpc-source", "nextjs-react");

            // During SSR, try to get cookies from the request
            if (typeof window === "undefined") {
              try {
                const { cookies } = await import("next/headers");
                const cookieStore = await cookies();
                const cookieString = cookieStore
                  .getAll()
                  .map((cookie) => `${cookie.name}=${cookie.value}`)
                  .join("; ");
                if (cookieString) {
                  headers.set("cookie", cookieString);
                }
              } catch (error) {
                // Ignore errors during SSR
                // eslint-disable-next-line no-console
                console.warn("Failed to get cookies during SSR:", error);
              }
            }

            return headers;
          },
        }),
      ],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCClientContext.Provider value={trpcClient}>
        <TRPCProvider
          trpcClient={trpcClient}
          queryClient={queryClient}
        >
          {props.children}
        </TRPCProvider>
      </TRPCClientContext.Provider>
    </QueryClientProvider>
  );
}
