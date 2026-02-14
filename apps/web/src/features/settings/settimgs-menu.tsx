"use client";

import type { LucideIcon } from "lucide-react";
import { Building2, MessageCircleCode, TagsIcon } from "lucide-react";

import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { Card, CardContentLink } from "@/components/ui/card";

type SettingsItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
};

type SettingsSection = {
  title: string;
  items: SettingsItem[];
};

const settingsSections: SettingsSection[] = [
  {
    title: "Organization",
    items: [
      {
        title: "Organizations",
        description: "Manage your organizations",
        icon: Building2,
        href: "/settings/organizations",
      },
    ],
  },
  {
    title: "Work productivity",
    items: [
      {
        title: "Tags",
        description: "Manage your tags by labeling tickets and contacts",
        icon: TagsIcon,
        href: "/settings/tags",
      },
      {
        title: "Canned responses",
        description: "Manage your canned responses to quickly reply to tickets and contacts",
        icon: MessageCircleCode,
        href: "/settings/canned-responses",
      },
    ],
  },
];

export function SettingsMenu() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      {settingsSections.map((section) => (
        <div
          key={section.title}
          className="flex flex-col gap-4"
        >
          <PageTitle title={section.title}>
            <Button>Click here</Button>
          </PageTitle>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {section.items.map((item) => (
              <Card
                key={item.href}
                className="bg-accent/50 hover:bg-accent/70 p-0 transition-all duration-300 hover:cursor-pointer"
              >
                <CardContentLink
                  href={item.href}
                  className="flex flex-row items-center gap-4 px-6 py-4"
                >
                  <item.icon />
                  <div className="flex flex-col gap-1">
                    <h2 className="text-[16px]">{item.title}</h2>
                    <p className="text-xs">{item.description}</p>
                  </div>
                </CardContentLink>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
