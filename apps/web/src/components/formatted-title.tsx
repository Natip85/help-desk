import type React from "react";

import { cn } from "@/lib/utils";

export function formatTitle(title: string): string {
  return title.replace(/_/g, " ");
}

type FormattedTitleProps = React.ComponentProps<"h2"> & {
  title: string;
};

export function FormattedTitle({ title, className, ...props }: FormattedTitleProps) {
  return (
    <h2
      {...props}
      className={cn("wrap-break-word", className)}
    >
      {formatTitle(title)}
    </h2>
  );
}
