"use client";

import { useQuery } from "@tanstack/react-query";
import { UserIcon, UserXIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc";

export type AssigneeUser = {
  id: string;
  name: string;
  image: string | null;
};

type MemberOption = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

// Sentinel value for "Unassign"
const UNASSIGN_OPTION: MemberOption = {
  id: "__unassign__",
  name: "Unassign",
  email: "",
  image: null,
};

function getUserInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

type TicketAssigneeComboboxProps = {
  currentAssignee: AssigneeUser | null;
  onValueChange: (assigneeId: string | null) => void;
  /** Render as a full-width button (for sidebars) vs compact avatar (for cards) */
  variant?: "avatar" | "button";
  className?: string;
};

export const TicketAssigneeCombobox = ({
  currentAssignee,
  onValueChange,
  variant = "avatar",
  className,
}: TicketAssigneeComboboxProps) => {
  const trpc = useTRPC();

  const { data: members = [] } = useQuery(trpc.user.getOrganizationMembers.queryOptions());

  // Build options list: unassign option + all members
  const options: MemberOption[] = [...(currentAssignee ? [UNASSIGN_OPTION] : []), ...members];

  const currentOption =
    currentAssignee ? (members.find((m) => m.id === currentAssignee.id) ?? null) : null;

  return (
    <div
      className={cn("", className)}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <Combobox
        key={currentAssignee?.id ?? "unassigned"}
        items={options}
        defaultValue={currentOption}
        onValueChange={(option: MemberOption | null) => {
          if (!option) return;
          if (option.id === UNASSIGN_OPTION.id) {
            onValueChange(null);
          } else {
            onValueChange(option.id);
          }
        }}
        isItemEqualToValue={(a, b) => a?.id === b?.id}
        itemToStringLabel={(item) => item?.name ?? ""}
      >
        <ComboboxTrigger
          render={
            variant === "avatar" ?
              <button
                type="button"
                className="focus-visible:ring-ring cursor-pointer rounded-full outline-none focus-visible:ring-2"
              >
                <AssigneeAvatar assignee={currentAssignee} />
              </button>
            : <button
                type="button"
                className="border-input bg-accent/50 hover:bg-accent/60 focus-visible:ring-ring flex w-full items-center gap-2 rounded-md border px-2 py-1 text-sm font-normal outline-none hover:cursor-pointer focus-visible:ring-2"
              >
                <AssigneeAvatar
                  assignee={currentAssignee}
                  size="sm"
                />
                <span className="flex-1 text-left">{currentAssignee?.name ?? "Unassigned"}</span>
              </button>
          }
        />
        <ComboboxContent
          className="w-56"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <ComboboxInput
            showTrigger={false}
            placeholder="Search members..."
            className="bg-accent/50"
          />
          <ComboboxEmpty>No members found.</ComboboxEmpty>
          <ComboboxList>
            {(item: MemberOption) => (
              <ComboboxItem
                key={item.id}
                value={item}
              >
                {item.id === UNASSIGN_OPTION.id ?
                  <div className="flex items-center gap-2">
                    <UserXIcon className="text-muted-foreground size-4" />
                    <span className="text-muted-foreground">Unassign</span>
                  </div>
                : <div className="flex items-center gap-2">
                    <Avatar className="size-5">
                      {item.image && (
                        <AvatarImage
                          src={item.image}
                          alt={item.name}
                        />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {getUserInitials(item.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{item.name}</span>
                  </div>
                }
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
};

function AssigneeAvatar({
  assignee,
  size,
}: {
  assignee: AssigneeUser | null;
  size?: "sm" | "default";
}) {
  if (!assignee) {
    return (
      <Avatar className={cn(size === "sm" ? "size-5" : "size-7")}>
        <AvatarFallback>
          <UserIcon className={cn(size === "sm" ? "size-3" : "size-4")} />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className={cn(size === "sm" ? "size-5" : "size-7")}>
      {assignee.image && (
        <AvatarImage
          src={assignee.image}
          alt={assignee.name}
        />
      )}
      <AvatarFallback className={cn(size === "sm" ? "text-[10px]" : "text-xs")}>
        {getUserInitials(assignee.name)}
      </AvatarFallback>
    </Avatar>
  );
}
