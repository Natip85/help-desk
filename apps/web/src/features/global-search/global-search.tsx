"use client";

import type { Route } from "next";
import { useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { skipToken, useQuery } from "@tanstack/react-query";
import { GlobeIcon, Loader2Icon, MailIcon, Search, WebhookIcon } from "lucide-react";

import type { ConversationChannel } from "@help-desk/db/schema/conversations";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
} from "@/components/ui/combobox";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useTRPC } from "@/trpc";
import { useGlobalSearchParams } from "./use-global-search-params";

const channelIconMap: Record<ConversationChannel, React.FC<React.SVGProps<SVGSVGElement>>> = {
  email: MailIcon,
  web: GlobeIcon,
  api: WebhookIcon,
};

type TicketSearchItem = {
  _type: "ticket";
  id: string;
  subject: string | null;
  channel: ConversationChannel;
};

type ContactSearchItem = {
  _type: "contact";
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

type SearchItem = TicketSearchItem | ContactSearchItem;

type SearchGroup = {
  value: string;
  href: string;
  count: number;
  items: SearchItem[];
};

function getContactDisplayName(c: ContactSearchItem) {
  if (c.displayName) return c.displayName;
  if (c.firstName || c.lastName) return [c.firstName, c.lastName].filter(Boolean).join(" ");
  return c.email;
}

function getContactInitials(c: ContactSearchItem) {
  if (c.firstName || c.lastName) {
    return `${c.firstName?.charAt(0) ?? ""}${c.lastName?.charAt(0) ?? ""}`.toUpperCase();
  }
  if (c.displayName) return c.displayName.charAt(0).toUpperCase();
  return c.email.charAt(0).toUpperCase();
}

function itemToString(item: SearchItem) {
  if (item._type === "ticket") return item.subject ?? item.id;
  return getContactDisplayName(item);
}

export function GlobalSearch() {
  const trpc = useTRPC();
  const router = useRouter();
  const { globalSearchParams, setGlobalSearchQuery } = useGlobalSearchParams();
  const q = globalSearchParams.globalSearchQuery;
  const inputRef = useRef<HTMLInputElement>(null);

  const { value, onChange, clear } = useDebouncedValue({
    initialValue: q,
    delay: 300,
    onDebouncedChange: setGlobalSearchQuery,
  });

  // Queries
  const queryInput = q && q.trim().length >= 2 ? q : skipToken;
  const { data: ticketsData, isLoading: isLoadingTickets } = useQuery(
    trpc.ticket.getGlobalSearchAll.queryOptions(queryInput)
  );
  const { data: contactsData, isLoading: isLoadingContacts } = useQuery(
    trpc.contact.getGlobalSearchAll.queryOptions(queryInput)
  );

  // Total counts from DB (independent of search)
  const { data: ticketsTotalCount } = useQuery(trpc.ticket.totalCount.queryOptions());
  const { data: contactsTotalCount } = useQuery(trpc.contact.totalCount.queryOptions());

  const isLoading = isLoadingTickets || isLoadingContacts;

  // Build grouped items for the Combobox
  const groups: SearchGroup[] = useMemo(() => {
    const tickets = ticketsData?.tickets ?? [];
    const contacts = contactsData?.contacts ?? [];
    const result: SearchGroup[] = [];
    if (tickets.length > 0) {
      result.push({
        value: "Tickets",
        href: `/tickets`,
        count: ticketsTotalCount?.count ?? 0,
        items: tickets.map((t) => ({ ...t, _type: "ticket" })),
      });
    }
    if (contacts.length > 0) {
      result.push({
        value: "Contacts",
        href: `/contacts`,
        count: contactsTotalCount?.count ?? 0,
        items: contacts.map((c) => ({ ...c, _type: "contact" })),
      });
    }
    return result;
  }, [ticketsData, contactsData, ticketsTotalCount, contactsTotalCount]);

  const handleSelect = (val: SearchItem | null) => {
    if (!val) return;
    clear("");
    if (val._type === "ticket") {
      router.push(`/tickets/${val.id}`);
    } else {
      router.push(`/contacts/${val.id}`);
    }
  };

  return (
    <div className="w-46 min-w-0 sm:w-64 md:w-96">
      <Combobox
        items={groups}
        onValueChange={handleSelect}
        onInputValueChange={(val) => onChange(val)}
        inputValue={value}
        filter={() => true}
        itemToStringValue={itemToString}
        openOnInputClick={false}
      >
        <div className="relative">
          <ComboboxInput
            showTrigger={false}
            showClear={!!value}
            placeholder="Search..."
            ref={inputRef}
            className="bg-accent/50! w-full ring-0! focus:ring-0! focus-visible:ring-0!"
          />
          <Search className="text-muted-foreground absolute top-1/2 right-5 size-4 -translate-y-1/2" />
        </div>
        <ComboboxContent>
          {isLoading && groups.length === 0 ?
            <div className="flex items-center justify-center py-6">
              <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
            </div>
          : <ComboboxEmpty>No results found.</ComboboxEmpty>}
          <ComboboxList className="flex flex-col gap-5">
            {(group: SearchGroup, index: number) => (
              <ComboboxGroup
                key={group.value}
                items={group.items}
              >
                <ComboboxLabel className="flex items-center justify-between">
                  <span>{group.value}</span>
                  <Link
                    href={group.href as Route}
                    className="text-primary text-xs font-normal hover:underline"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    View all ({group.count})
                  </Link>
                </ComboboxLabel>
                <ComboboxCollection>
                  {(item: SearchItem) =>
                    item._type === "ticket" ?
                      <ComboboxItem
                        className="my-3"
                        key={item.id}
                        value={item}
                      >
                        <TicketResult item={item} />
                      </ComboboxItem>
                    : <ComboboxItem
                        className="my-3"
                        key={item.id}
                        value={item}
                      >
                        <ContactResult item={item} />
                      </ComboboxItem>
                  }
                </ComboboxCollection>
                {index < groups.length - 1 && <ComboboxSeparator />}
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

function TicketResult({ item }: { item: TicketSearchItem }) {
  const ChannelIcon = channelIconMap[item.channel] ?? MailIcon;
  return (
    <Link
      href={`/tickets/${item.id}` as Route}
      className="flex w-full items-center gap-2"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <ChannelIcon className="text-muted-foreground size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.subject ?? "(no subject)"}</span>
      <span className="text-muted-foreground shrink-0 font-mono text-xs">
        {item.id.slice(0, 8)}
      </span>
    </Link>
  );
}

function ContactResult({ item }: { item: ContactSearchItem }) {
  const displayName = getContactDisplayName(item);
  const initials = getContactInitials(item);
  return (
    <Link
      href={`/contacts/${item.id}` as Route}
      className="flex w-full items-center gap-2.5"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Avatar size="sm">
        {item.avatarUrl && (
          <AvatarImage
            src={item.avatarUrl}
            alt={displayName}
          />
        )}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{displayName}</span>
        <span className="text-muted-foreground truncate text-xs">{item.email}</span>
      </div>
    </Link>
  );
}
