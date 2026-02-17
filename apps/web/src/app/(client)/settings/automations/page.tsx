import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageTitle } from "@/components/page-title";
import { AutomationsList } from "@/features/settings/automations/automations-list";
import { CreateAutomationButton } from "@/features/settings/automations/create-automation-button";
import { settingsAutomationsBreadcrumbs } from "@/lib/breadcrumbs";

export default function TicketAutomationsPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 py-6 pr-4.5 pl-6">
      <Breadcrumbs
        pages={settingsAutomationsBreadcrumbs}
        className="px-2"
      />
      <PageTitle
        title="Ticket automations"
        subTitle="Create rules to automatically tag, prioritize, and assign tickets"
        className="w-full"
      >
        <CreateAutomationButton />
      </PageTitle>
      <AutomationsList />
    </div>
  );
}
