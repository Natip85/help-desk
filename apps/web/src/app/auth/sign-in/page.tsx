import Link from "next/link";

import { AuthTabs } from "@/features/auth/auth-tabs";

type AuthPageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const { redirect: redirectUrl } = await searchParams;
  return (
    <div className="relative min-h-screen">
      {/* Subtle background pattern */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="from-primary/5 absolute -top-40 -right-40 h-80 w-80 rounded-full bg-linear-to-br via-transparent to-transparent blur-3xl" />
        <div className="from-primary/5 absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-linear-to-tr via-transparent to-transparent blur-3xl" />
      </div>

      <main className="relative z-10 flex flex-col items-center px-6 pt-8 pb-16 md:pt-16">
        <div className="mb-8 text-center">
          <h1 className="text-foreground mb-2 text-2xl font-semibold tracking-tight md:text-3xl">
            Welcome back
          </h1>
          <p className="text-muted-foreground text-sm">
            Sign in to access your account across all your devices
          </p>
        </div>

        {/* Auth Tabs Card */}
        <AuthTabs redirectUrl={redirectUrl} />

        <div className="mt-10 space-y-4">
          <div className="text-muted-foreground flex items-center justify-center gap-4 text-xs">
            <Link
              href="#"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <span className="text-border">·</span>
            <Link
              href="#"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <span className="text-border">·</span>
            <Link
              href="#"
              className="hover:text-foreground transition-colors"
            >
              Help
            </Link>
          </div>
        </div>
      </main>

      <footer className="absolute right-0 bottom-0 left-0 p-6">
        <p className="text-muted-foreground text-center text-xs">
          Free forever. Your account, always in sync.
        </p>
      </footer>
    </div>
  );
}
