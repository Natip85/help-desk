import { Suspense } from "react";
import dynamic from "next/dynamic";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageTitle } from "@/components/page-title";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardBreadcrumbs } from "@/lib/breadcrumbs";
import { prefetch, trpc } from "@/trpc/server";

const DashboardTodayTrends = dynamic(() =>
  import("@/features/dashboard/dashboard-chart").then((mod) => ({
    default: mod.DashboardTodayTrends,
  }))
);

const DashboardStatusChart = dynamic(() =>
  import("@/features/dashboard/dashboard-chart").then((mod) => ({
    default: mod.DashboardStatusChart,
  }))
);

const DashboardPriorityChart = dynamic(() =>
  import("@/features/dashboard/dashboard-chart").then((mod) => ({
    default: mod.DashboardPriorityChart,
  }))
);

function ChartSkeleton() {
  return (
    <div className="ring-foreground/10 bg-card flex flex-col gap-4 rounded-md py-4 ring-1">
      <div className="flex items-center justify-between px-4">
        <Skeleton className="h-5 w-32 rounded-md" />
        <div className="flex gap-6">
          <Skeleton className="h-10 w-20 rounded-md" />
          <Skeleton className="h-10 w-20 rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      </div>
      <div className="px-4">
        <Skeleton className="h-[280px] w-full rounded-md" />
      </div>
    </div>
  );
}

function PieSkeleton() {
  return (
    <div className="ring-foreground/10 bg-card flex flex-col items-center gap-4 rounded-md py-4 ring-1">
      <Skeleton className="h-5 w-40 rounded-md" />
      <Skeleton className="h-[250px] w-[250px] rounded-full" />
    </div>
  );
}

export default function DashboardPage() {
  prefetch(trpc.dashboard.todayTrends.queryOptions());
  prefetch(trpc.dashboard.ticketBreakdown.queryOptions());

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 py-6 pr-4.5 pl-6">
      <Breadcrumbs
        pages={dashboardBreadcrumbs}
        className="px-2"
      />
      <PageTitle
        title="Dashboard"
        subTitle="Manage your dashboard and get insights into your support team's performance."
        className="w-full"
      />
      <Suspense fallback={<ChartSkeleton />}>
        <DashboardTodayTrends />
      </Suspense>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Suspense fallback={<PieSkeleton />}>
          <DashboardStatusChart />
        </Suspense>
        <Suspense fallback={<PieSkeleton />}>
          <DashboardPriorityChart />
        </Suspense>
      </div>
    </div>
  );
}
