"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, UserIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { useTRPC } from "@/trpc";

type RecipientOption = {
  id: string;
  email: string;
  label: string;
  avatarUrl?: string | null;
  isVirtual?: boolean;
};

type EmailRecipientPickerProps = {
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getContactLabel(c: {
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string;
}) {
  if (c.displayName) return c.displayName;
  if (c.firstName || c.lastName) return [c.firstName, c.lastName].filter(Boolean).join(" ");
  return c.email;
}

export function EmailRecipientPicker({
  value,
  onChange,
  placeholder = "Search contacts or type email...",
}: EmailRecipientPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const anchor = useComboboxAnchor();
  const trpc = useTRPC();

  const { data: contactsData } = useQuery(trpc.contact.getGlobalSearchAll.queryOptions(searchTerm));
  const contacts = contactsData?.contacts ?? [];

  const selectedRecipients: RecipientOption[] = useMemo(
    () =>
      value.map((email) => {
        const contact = contacts.find((c) => c.email === email);
        if (contact) {
          return {
            id: contact.id,
            email: contact.email,
            label: getContactLabel(contact),
            avatarUrl: contact.avatarUrl,
          };
        }
        return {
          id: `custom-${email}`,
          email,
          label: email,
          isVirtual: true,
        };
      }),
    [value, contacts]
  );

  const unselectedItems: RecipientOption[] = useMemo(() => {
    const items: RecipientOption[] = contacts
      .filter((c) => !value.includes(c.email))
      .map((c) => ({
        id: c.id,
        email: c.email,
        label: getContactLabel(c),
        avatarUrl: c.avatarUrl,
      }));

    const trimmed = searchTerm.trim();
    if (
      trimmed &&
      EMAIL_REGEX.test(trimmed) &&
      !value.includes(trimmed) &&
      !contacts.some((c) => c.email.toLowerCase() === trimmed.toLowerCase())
    ) {
      items.unshift({
        id: `new-${trimmed}`,
        email: trimmed,
        label: trimmed,
        isVirtual: true,
      });
    }

    return items;
  }, [contacts, value, searchTerm]);

  // Combobox needs ALL items (selected + unselected) to reconcile value with items
  const allItems = useMemo(
    () => [...selectedRecipients, ...unselectedItems],
    [selectedRecipients, unselectedItems]
  );

  const handleValueChange = useCallback(
    (newValues: RecipientOption[] | null) => {
      const emails = (newValues ?? []).map((r) => r.email);
      onChange(emails);
      setSearchTerm("");
    },
    [onChange]
  );

  return (
    <Combobox
      multiple
      autoHighlight
      items={allItems}
      value={selectedRecipients.length > 0 ? selectedRecipients : null}
      onValueChange={handleValueChange}
      isItemEqualToValue={(a, b) => a?.email === b?.email}
      itemToStringLabel={(item) => (item ? item.label : "")}
    >
      <ComboboxChips
        ref={anchor}
        className="min-h-7 w-full border-none bg-transparent px-0 py-0.5 shadow-none focus-within:ring-0"
      >
        <ComboboxValue>
          {(values: RecipientOption[] | null) => {
            const selected = values ?? [];
            return (
              <Fragment>
                {selected.map((r) => (
                  <ComboboxChip key={r.email}>{r.label}</ComboboxChip>
                ))}
                <ComboboxChipsInput
                  placeholder={selected.length > 0 ? "" : placeholder}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Fragment>
            );
          }}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent
        anchor={anchor}
        className="w-72"
      >
        <ComboboxEmpty>
          {searchTerm.trim().length > 0 ?
            "No contacts found. Type a full email to add."
          : "Type to search contacts..."}
        </ComboboxEmpty>
        <ComboboxList>
          {(item: RecipientOption) => (
            <ComboboxItem
              key={item.id}
              value={item}
            >
              {item.isVirtual ?
                <div className="flex items-center gap-2">
                  <Plus className="text-muted-foreground size-4" />
                  <span className="text-sm">Add &quot;{item.email}&quot;</span>
                </div>
              : <div className="flex items-center gap-2">
                  <Avatar className="size-5">
                    {item.avatarUrl && (
                      <AvatarImage
                        src={item.avatarUrl}
                        alt={item.label}
                      />
                    )}
                    <AvatarFallback className="text-[10px]">
                      <UserIcon className="size-3" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm">{item.label}</span>
                    {item.label !== item.email && (
                      <span className="text-muted-foreground text-xs">{item.email}</span>
                    )}
                  </div>
                </div>
              }
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
