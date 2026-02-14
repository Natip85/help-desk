"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Switch } from "../components/ui/switch";
import { cn } from "../lib/utils";

export const ModeToggle = ({ className, ...props }: React.ComponentProps<"div">) => {
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      {...props}
    >
      <SunIcon className="text-muted-foreground size-3.5" />
      <Switch
        size="sm"
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle theme"
      />
      <MoonIcon className="text-muted-foreground size-3.5" />
    </div>
  );
};
