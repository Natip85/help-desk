import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageTitle } from "@/components/page-title";
import { SlaSettingsForm } from "@/features/settings/sla/sla-settings-form";
import { settingsSlaBreadcrumbs } from "@/lib/breadcrumbs";

export default function SlaSettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 py-6 pr-4.5 pl-6">
      <Breadcrumbs
        pages={settingsSlaBreadcrumbs}
        className="px-2"
      />
      <PageTitle
        title="SLA & Business hours"
        subTitle="Configure first-response targets and working hours for your organization"
        className="w-full"
      />
      <SlaSettingsForm />
    </div>
  );
}
