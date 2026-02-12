"use client";

import type { TRPCClientError } from "@trpc/client";
import type NextError from "next/error";
import { useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";

import { Button } from "@/components/ui/button";

import "../index.css";

import type { AppRouter } from "@help-desk/api";

import { authClient } from "@/lib/auth-client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type GlobalErrorProperties = {
  readonly error: NextError & { digest?: string; message?: string };
  readonly reset: () => void;
};

// Global error handler for tRPC errors
const handleGlobalError = (error: unknown) => {
  // Handle admin access errors globally
  const err = error as TRPCClientError<AppRouter>;
  if (err?.data?.code === "FORBIDDEN" || err?.message === "admin-access-required") {
    // Use window.location for global redirect that works from any context
    window.location.href = "/";
    return true; // Indicate that error was handled
  }
  return false; // Error was not handled
};

const GlobalError = ({ error, reset }: GlobalErrorProperties) => {
  useEffect(() => {
    // Check if this is a tRPC error that should be handled globally
    if (handleGlobalError(error)) {
      return; // Error was handled, don't show the error page
    }

    // Log error to console in development
    // eslint-disable-next-line no-console
    console.error("Global error:", error);
  }, [error]);

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
    >
      <body className="bg-background text-foreground flex min-h-screen items-center justify-center p-4 antialiased">
        <div className="bg-card text-card-foreground w-full max-w-2xl rounded-lg border p-8 text-center shadow-lg">
          <div className="mb-6">
            <h1 className="text-destructive mb-4 text-4xl font-semibold">
              🚨 Oops, something went wrong
            </h1>
            <p className="text-muted-foreground text-lg">
              We're sorry, but something unexpected happened. Please try again or contact support if
              the problem persists.
            </p>
          </div>

          <div className="mb-6 flex justify-center gap-4">
            <Button onClick={() => reset()}>Try again</Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>

          <div className="bg-destructive/10 border-destructive/20 rounded-md border p-4 text-left">
            <h3 className="text-destructive mb-2 font-semibold">Error Details:</h3>
            <code className="text-destructive text-sm break-all">
              {error.message ?? error.digest ?? "Unknown error occurred"}
            </code>
          </div>
        </div>
      </body>
    </html>
  );
};

export default GlobalError;
