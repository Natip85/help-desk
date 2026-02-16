"use client";

import type { Editor } from "@tiptap/react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GlobeIcon, MailIcon, Plus, UserIcon, WebhookIcon, X } from "lucide-react";
import { toast } from "sonner";

import type { ConversationChannel } from "@help-desk/db/schema/conversations";
import type { Tag } from "@help-desk/db/schema/tags";
import {
  conversationChannel,
  conversationPriority,
  conversationStatus,
} from "@help-desk/db/schema/conversations";
import { ticketFormDefaults, ticketFormSchema } from "@help-desk/db/validators";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTRPC } from "@/trpc";
import { RichTextEditor } from "../ticket/rich-text-editor";
import { priorityConfig, statusConfig } from "./ticket-card";
import { usePrefillTicketParams } from "./ticket-prefill-query-params";

type ContactOption = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

type MemberOption = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

const channelConfig: Record<
  ConversationChannel,
  { label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }
> = {
  email: { label: "Email", icon: MailIcon },
  web: { label: "Web", icon: GlobeIcon },
  api: { label: "API", icon: WebhookIcon },
};

function getContactLabel(c: ContactOption) {
  if (c.displayName) return c.displayName;
  if (c.firstName || c.lastName) return [c.firstName, c.lastName].filter(Boolean).join(" ");
  return c.email;
}

function getUserInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  return name.charAt(0).toUpperCase();
}

function getErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: string }).message);
  }
  return null;
}

function FieldError({ errors }: { errors: readonly unknown[] }) {
  if (errors.length === 0) return null;
  return (
    <>
      {errors.map((error) => {
        const message = getErrorMessage(error);
        if (!message) return null;
        return (
          <p
            key={message}
            className="text-destructive text-sm"
          >
            {message}
          </p>
        );
      })}
    </>
  );
}

export function CreateTicketForm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const editorRef = useRef<Editor | null>(null);
  const { prefillTicket, clearPrefillTicket } = usePrefillTicketParams();
  const [contactSearch, setContactSearch] = useState(prefillTicket?.prefillContactEmail ?? "");
  const [showCreateContact, setShowCreateContact] = useState(false);
  const tagAnchor = useComboboxAnchor();
  const hasAppliedPrefillRef = useRef(false);

  const { data: contactsData } = useQuery(
    trpc.contact.getGlobalSearchAll.queryOptions(contactSearch)
  );
  const contacts: ContactOption[] = contactsData?.contacts ?? [];

  const { data: members = [] } = useQuery(trpc.user.getOrganizationMembers.queryOptions());

  const { data: tagsData } = useQuery(trpc.tags.list.queryOptions());
  const allTags = tagsData?.items ?? [];

  const { mutateAsync: createTicket } = useMutation(trpc.ticket.create.mutationOptions());

  const form = useForm({
    defaultValues: {
      ...ticketFormDefaults,
      ...(prefillTicket?.prefillContactId ? { contactId: prefillTicket.prefillContactId } : {}),
    },
    onSubmit: async ({ value }) => {
      try {
        await createTicket(value);
        await queryClient.invalidateQueries({ queryKey: trpc.ticket.all.queryKey() });
        toast.success("Ticket created successfully");
        router.push("/tickets");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create ticket");
      }
    },
    validators: {
      onSubmit: ticketFormSchema,
    },
  });

  useEffect(() => {
    if (hasAppliedPrefillRef.current) return;
    if (!prefillTicket?.prefillContactId) return;

    hasAppliedPrefillRef.current = true;
    clearPrefillTicket();
  }, [prefillTicket?.prefillContactId, clearPrefillTicket]);

  const handleToggleNewContact = () => {
    if (showCreateContact) {
      // Switching back to existing contact — clear the newContact fields
      form.setFieldValue("newContact", undefined);
      setShowCreateContact(false);
    } else {
      // Switching to new contact — clear contactId and seed newContact
      form.setFieldValue("contactId", "");
      form.setFieldValue("newContact", { email: "", firstName: "", lastName: "", phone: "" });
      setShowCreateContact(true);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
      className="grid gap-6"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Contact */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>
              Contact <span className="text-destructive">*</span>
            </Label>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
              onClick={handleToggleNewContact}
            >
              {showCreateContact ?
                <>
                  <X className="size-3" />
                  Use existing
                </>
              : <>
                  <Plus className="size-3" />
                  New
                </>
              }
            </button>
          </div>

          {/* Existing contact combobox */}
          {!showCreateContact && (
            <form.Field name="contactId">
              {(field) => {
                const selectedContact = contacts.find((c) => c.id === field.state.value) ?? null;
                return (
                  <>
                    <Combobox
                      items={contacts}
                      value={selectedContact}
                      onValueChange={(option: ContactOption | null) => {
                        field.handleChange(option?.id ?? "");
                      }}
                      isItemEqualToValue={(a, b) => a?.id === b?.id}
                      itemToStringLabel={(item) => (item ? getContactLabel(item) : "")}
                    >
                      <ComboboxInput
                        placeholder="Search contacts..."
                        showClear={!!selectedContact}
                        onChange={(e) => setContactSearch(e.target.value)}
                        className="bg-accent/50!"
                      />
                      <ComboboxContent className="w-72">
                        <ComboboxEmpty>No contacts found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item: ContactOption) => (
                            <ComboboxItem
                              key={item.id}
                              value={item}
                            >
                              <div className="flex items-center gap-2">
                                <Avatar className="size-5">
                                  {item.avatarUrl && (
                                    <AvatarImage
                                      src={item.avatarUrl}
                                      alt={getContactLabel(item)}
                                    />
                                  )}
                                  <AvatarFallback className="text-[10px]">
                                    <UserIcon className="size-3" />
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-sm">{getContactLabel(item)}</span>
                                  <span className="text-muted-foreground text-xs">
                                    {item.email}
                                  </span>
                                </div>
                              </div>
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    <FieldError errors={field.state.meta.errors} />
                  </>
                );
              }}
            </form.Field>
          )}

          {/* Inline new contact fields */}
          <Collapsible open={showCreateContact}>
            <CollapsibleContent>
              <div className="bg-accent/30 border-accent space-y-3 rounded-md border p-3">
                <span className="text-sm font-medium">New Contact</span>
                <div className="space-y-2">
                  <form.Field name="newContact.email">
                    {(field) => (
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Email <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          placeholder="email@example.com"
                          value={field.state.value ?? ""}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="h-8 text-sm"
                        />
                        <FieldError errors={field.state.meta.errors} />
                      </div>
                    )}
                  </form.Field>
                  <div className="grid grid-cols-2 gap-2">
                    <form.Field name="newContact.firstName">
                      {(field) => (
                        <div className="space-y-1">
                          <Label className="text-xs">First Name</Label>
                          <Input
                            placeholder="First name"
                            value={field.state.value ?? ""}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      )}
                    </form.Field>
                    <form.Field name="newContact.lastName">
                      {(field) => (
                        <div className="space-y-1">
                          <Label className="text-xs">Last Name</Label>
                          <Input
                            placeholder="Last name"
                            value={field.state.value ?? ""}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      )}
                    </form.Field>
                  </div>
                  <form.Field name="newContact.phone">
                    {(field) => (
                      <div className="space-y-1">
                        <Label className="text-xs">Phone</Label>
                        <Input
                          placeholder="Phone number"
                          value={field.state.value ?? ""}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Subject */}
        <form.Field name="subject">
          {(field) => (
            <div className="space-y-2">
              <Label>
                Subject <span className="text-destructive mb-1.5">*</span>
              </Label>
              <Input
                placeholder="Ticket subject"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
      </div>

      {/* ── Row 2: Status + Priority + Channel ───────────────────────── */}
      <div className="grid gap-6 sm:grid-cols-3">
        {/* Status */}
        <form.Field name="status">
          {(field) => (
            <div className="space-y-2">
              <Label>
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={field.state.value}
                onValueChange={(val) => field.handleChange(val as typeof field.state.value)}
              >
                <SelectTrigger className="bg-accent/50 w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {conversationStatus.map((s) => (
                    <SelectItem
                      key={s}
                      value={s}
                    >
                      {statusConfig[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        {/* Priority */}
        <form.Field name="priority">
          {(field) => (
            <div className="space-y-2">
              <Label>
                Priority <span className="text-destructive">*</span>
              </Label>
              <Select
                value={field.state.value}
                onValueChange={(val) => field.handleChange(val as typeof field.state.value)}
              >
                <SelectTrigger className="bg-accent/50 w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {conversationPriority.map((p) => (
                    <SelectItem
                      key={p}
                      value={p}
                    >
                      <span>{priorityConfig[p].label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        {/* Channel */}
        <form.Field name="channel">
          {(field) => (
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={field.state.value}
                onValueChange={(val) => field.handleChange(val as typeof field.state.value)}
              >
                <SelectTrigger className="bg-accent/50 w-full">
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  {conversationChannel.map((ch) => {
                    const config = channelConfig[ch];
                    const Icon = config.icon;
                    return (
                      <SelectItem
                        key={ch}
                        value={ch}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="size-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
      </div>

      {/* ── Row 3: Agent + Tags ──────────────────────────────────────── */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Agent */}
        <form.Field name="assignedToId">
          {(field) => {
            const selectedAgent = members.find((m) => m.id === field.state.value) ?? null;

            return (
              <div className="space-y-2">
                <Label>Agent</Label>
                <Combobox
                  items={members}
                  value={selectedAgent}
                  onValueChange={(option: MemberOption | null) => {
                    field.handleChange(option?.id ?? undefined);
                  }}
                  isItemEqualToValue={(a, b) => a?.id === b?.id}
                  itemToStringLabel={(item) => item?.name ?? ""}
                >
                  <ComboboxTrigger
                    render={
                      <button
                        type="button"
                        className="border-input hover:bg-accent/50 focus-visible:ring-ring bg-accent/50 flex h-9 w-full items-center gap-2 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
                      >
                        {selectedAgent ?
                          <div className="flex items-center gap-2">
                            <Avatar className="size-5">
                              {selectedAgent.image && (
                                <AvatarImage
                                  src={selectedAgent.image}
                                  alt={selectedAgent.name}
                                />
                              )}
                              <AvatarFallback className="text-[10px]">
                                {getUserInitials(selectedAgent.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{selectedAgent.name}</span>
                          </div>
                        : <span className="text-muted-foreground">Assign an agent...</span>}
                      </button>
                    }
                  />
                  <ComboboxContent className="w-56">
                    <ComboboxInput
                      showTrigger={false}
                      placeholder="Search agents..."
                      className="bg-accent/50"
                    />
                    <ComboboxEmpty>No agents found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item: MemberOption) => (
                        <ComboboxItem
                          key={item.id}
                          value={item}
                        >
                          <div className="flex items-center gap-2">
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
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                <FieldError errors={field.state.meta.errors} />
              </div>
            );
          }}
        </form.Field>

        {/* Tags */}
        <form.Field name="tagIds">
          {(field) => {
            const selectedTags = (field.state.value ?? [])
              .map((id) => allTags.find((t) => t.id === id))
              .filter((t): t is Tag => !!t);

            return (
              <div className="space-y-2">
                <Label>Tags</Label>
                <Combobox
                  multiple
                  autoHighlight
                  items={allTags}
                  value={selectedTags.length > 0 ? selectedTags : null}
                  onValueChange={(values: Tag[] | null) => {
                    const tagIds = (values ?? []).map((t) => t.id);
                    field.handleChange(tagIds);
                  }}
                  isItemEqualToValue={(a, b) => a?.id === b?.id}
                  itemToStringLabel={(item) => item.name}
                >
                  <ComboboxChips
                    ref={tagAnchor}
                    className="w-full"
                  >
                    <ComboboxValue>
                      {(values: Tag[] | null) => {
                        const selected = values ?? [];
                        return (
                          <Fragment>
                            {selected.map((tag: Tag) => (
                              <ComboboxChip key={tag.id}>
                                <span
                                  className="size-2 shrink-0 rounded-full"
                                  style={{ backgroundColor: tag.color }}
                                />
                                {tag.name}
                              </ComboboxChip>
                            ))}
                            <ComboboxChipsInput
                              placeholder={selected.length > 0 ? "" : "Select tags..."}
                            />
                          </Fragment>
                        );
                      }}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent anchor={tagAnchor}>
                    <ComboboxEmpty>No tags found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item: Tag) => (
                        <ComboboxItem
                          key={item.id}
                          value={item}
                        >
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.name}</span>
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                <FieldError errors={field.state.meta.errors} />
              </div>
            );
          }}
        </form.Field>
      </div>

      {/* ── Description (Rich Text Editor) ───────────────────────────── */}
      <form.Field name="description">
        {(field) => (
          <div className="space-y-2">
            <Label>
              Description <span className="text-destructive">*</span>
            </Label>
            <div className="border-accent overflow-hidden rounded-md border">
              <RichTextEditor
                onEditorReady={(editor) => {
                  editorRef.current = editor;
                  // Sync initial content
                  editor.on("update", () => {
                    field.handleChange(editor.getHTML());
                  });
                }}
              />
            </div>
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      {/* ── Submit ────────────────────────────────────────────────────── */}
      <form.Subscribe>
        {(state) => (
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                setShowCreateContact(false);
                editorRef.current?.commands.clearContent();
              }}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={!state.canSubmit || state.isSubmitting}
            >
              {state.isSubmitting ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
