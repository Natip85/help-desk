import { Building2, TagsIcon } from "lucide-react";

import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { Card, CardContentLink } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 py-6 pr-4.5 pl-6">
      <PageTitle
        title="Settings"
        subTitle="Manage your settings and preferences"
      />

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
        <PageTitle title="Work productivity">
          <Button>Click here</Button>
        </PageTitle>
        <Card className="bg-accent/50 hover:bg-accent/70 w-fit p-0 transition-all duration-300 hover:cursor-pointer">
          <CardContentLink
            href="/settings/tags"
            className="flex flex-row items-center gap-4 px-6 py-4"
          >
            <TagsIcon />
            <div className="flex flex-col gap-1">
              <h2 className="text-[16px]">Tags</h2>
              <p className="text-xs">Manage your tags by labeling tickets and contacts</p>
            </div>
          </CardContentLink>
        </Card>
      </div>
    </div>
  );
}
