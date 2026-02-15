import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageTitle } from "@/components/page-title";
import { dashboardBreadcrumbs } from "@/lib/breadcrumbs";

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 py-6 pr-4.5 pl-6">
      <Breadcrumbs
        pages={dashboardBreadcrumbs}
        className="px-2"
      />
      <PageTitle
        title="Dashboard"
        subTitle="Manage your dashboard"
        className="w-full"
      />
    </div>
  );
}
