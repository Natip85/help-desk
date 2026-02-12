"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex h-screen flex-1 flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">404 - Page not found</h2>
      <p className="text-muted-foreground">The page you are looking for does not exist.</p>
      <Button
        onClick={() => router.back()}
        variant="outline"
      >
        Go back
      </Button>
    </div>
  );
}
