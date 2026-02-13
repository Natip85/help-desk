import { Building2 } from "lucide-react";

import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { Card, CardContentLink } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 py-6 pr-4.5 pl-6">
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
  );
}
