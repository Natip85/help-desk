import { Building2, TicketsIcon } from "lucide-react";

import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { Card, CardContentLink } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-10 py-6 pr-4.5 pl-6">
      <div className="flex flex-col gap-3">
        <PageTitle title="Organization">
          <Button>Click here</Button>
        </PageTitle>
        <Card className="bg-accent/50 hover:bg-accent/70 w-fit p-0 transition-all duration-300 hover:cursor-pointer">
          <CardContentLink
            href="/settings/organizations"
            className="flex flex-row items-center gap-4 px-6 py-4"
          >
            <Building2 />
            <div className="flex flex-col gap-1">
              <h2 className="text-[16px]">Organizations</h2>
              <p className="text-xs">Manage your organizations</p>
            </div>
          </CardContentLink>
        </Card>
      </div>
      <div className="flex flex-col gap-3">
        <PageTitle title="Ticket flow">
          <Button>Click here</Button>
        </PageTitle>
        <Card className="bg-accent/50 hover:bg-accent/70 w-fit p-0 transition-all duration-300 hover:cursor-pointer">
          <CardContentLink
            href="/settings/tickets-flow"
            className="flex flex-row items-center gap-4 px-6 py-4"
          >
            <TicketsIcon />
            <div className="flex flex-col gap-1">
              <h2 className="text-[16px]">Tickets flow</h2>
              <p className="text-xs">Manage your workflow</p>
            </div>
          </CardContentLink>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <PageTitle title="Work productivity">
          <Button>Click here</Button>
        </PageTitle>
        <Card className="bg-accent/50 hover:bg-accent/70 w-fit p-0 transition-all duration-300 hover:cursor-pointer">
          <CardContentLink
            href="/settings/work-productivity"
            className="flex flex-row items-center gap-4 px-6 py-4"
          >
            <TicketsIcon />
            <div className="flex flex-col gap-1">
              <h2 className="text-[16px]">Agents</h2>
              <p className="text-xs">Define agents and set roles/permissions</p>
            </div>
          </CardContentLink>
        </Card>
      </div>
    </div>
  );
}
