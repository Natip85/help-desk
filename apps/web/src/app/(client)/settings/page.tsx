import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { SettingsMenu } from "@/features/settings/settings-menu";

export default function SettingsPage() {
  return (
    <div className="flex w-full flex-1 flex-col gap-10 py-6 pr-4.5 pl-6">
      <PageTitle
        title="Settings"
        subTitle="Manage your settings and preferences"
      >
        <Button>Click here</Button>
      </PageTitle>
      <SettingsMenu />
    </div>
  );
}
