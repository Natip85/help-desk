"use client";

import type { LucideIcon } from "lucide-react";
import {
  BookmarkIcon,
  Building2,
  ListChevronsDownUpIcon,
  MessageCircleCode,
  TagsIcon,
  Users2,
  ZapIcon,
} from "lucide-react";

import { PageTitle } from "@/components/page-title";
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
      {
        title: "Ticket filters",
        description: "Customize your ticket filters to quickly reply to tickets and contacts",
        icon: ListChevronsDownUpIcon,
        href: "/settings/ticket-filters",
      },
      {
        title: "Saved filters",
        description: "Manage your saved ticket filter presets",
        icon: BookmarkIcon,
        href: "/settings/saved-filters",
      },
      {
        title: "Ticket automations",
        description:
          "Manage your ticket automations to automatically assign tickets to users or groups",
        icon: ZapIcon,
        href: "/settings/automations",
      },
    ],
  },
  {
    title: "Admin",
    items: [
      {
        title: "Users",
        description: "Manage your users",
        icon: Users2,
        href: "/settings/users",
      },
    ],
  },
];

export function SettingsMenu() {
  return (
    <div className="flex w-full flex-col gap-10">
      {settingsSections.map((section) => (
        <div
          key={section.title}
          className="flex flex-col gap-4"
        >
          <PageTitle title={section.title} />
          <div className="grid grid-cols-2 gap-5 p-2 md:grid-cols-3">
            {section.items.map((item) => (
              <Card
                key={item.href}
                className="bg-accent/50 hover:bg-accent/70 min-h-28 p-0 transition-all duration-300 hover:cursor-pointer"
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
