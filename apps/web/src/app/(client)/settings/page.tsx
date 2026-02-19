import { Breadcrumbs } from "@/components/breadcrumbs";
import { SettingsMenu } from "@/features/settings/settings-menu";
import { settingsBreadcrumbs } from "@/lib/breadcrumbs";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 py-6 pr-4.5 pl-6">
      <Breadcrumbs
        pages={settingsBreadcrumbs}
        className="px-2"
      />
      <SettingsMenu />
    </div>
  );
}
