"use client";

import type { Route } from "next";
import { Fragment } from "react";
import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { formatTitle } from "./formatted-title";

export type BreadcrumbPageType = {
  href: string;
  label: string;
};

type Props = React.ComponentProps<typeof Breadcrumb> & {
  pages: (BreadcrumbPageType | undefined)[] | BreadcrumbPageType;
};

export function Breadcrumbs({ pages, className, ...props }: Props) {
  const pagesArray =
    Array.isArray(pages) ? (pages.filter(Boolean) as BreadcrumbPageType[]) : [pages];
  return (
    <Breadcrumb
      className={cn("w-fit capitalize", className)}
      {...props}
    >
      <BreadcrumbList>
        {pagesArray.map((page, index) => (
          <Fragment key={page.label}>
            {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
            <BreadcrumbItem>
              {index === pagesArray.length - 1 ?
                <BreadcrumbPage>{formatTitle(page.label)}</BreadcrumbPage>
              : <BreadcrumbLink asChild>
                  <Link href={page.href as Route}>{formatTitle(page.label)}</Link>
                </BreadcrumbLink>
              }
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
