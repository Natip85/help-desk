import { Breadcrumbs } from "@/components/breadcrumbs";
import { dashboardBreadcrumbs } from "@/lib/breadcrumbs";

export default function DashboardPage() {
  return (
    <div>
      <Breadcrumbs
        pages={dashboardBreadcrumbs}
        className="px-2"
      />
      <div>Dashboard</div>
    </div>
  );
}
