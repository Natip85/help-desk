import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";

type Props = React.ComponentProps<"div"> & {
  title: string;
  children?: ReactNode;
  className?: string;
  subTitle?: string;
  statusBadge?: string;
};

export function PageTitle({ title, children, subTitle, className, statusBadge, ...props }: Props) {
  return (
    <div
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      <div className={cn("flex flex-wrap items-center justify-between gap-4", className)}>
        <div className="flex max-w-3/5 min-w-0 flex-1 items-center gap-4">
          <h2 className="line-clamp-2 text-2xl font-semibold tracking-tight">{title}</h2>
          {statusBadge && <Badge>{statusBadge}</Badge>}
        </div>
        {children && <div className="flex shrink-0 items-center gap-3">{children}</div>}
      </div>
      {subTitle && <PageSubtitle className="line-clamp-3 max-w-3/5">{subTitle}</PageSubtitle>}
    </div>
  );
}

export const PageSubtitle = ({ className, ...props }: React.ComponentProps<"p">) => {
  return (
    <p
      className={cn("text-xs capitalize", className)}
      {...props}
    />
  );
};
