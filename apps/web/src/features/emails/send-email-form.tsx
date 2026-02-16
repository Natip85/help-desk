"use client";

import type { Editor } from "@tiptap/react";
import { Fragment, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MailIcon, Plus, UserIcon, X } from "lucide-react";
import { toast } from "sonner";

import type { DefaultFilter } from "@help-desk/db/schema/default-filters";
import type { Mailbox } from "@help-desk/db/schema/mailboxes";
import type { Tag } from "@help-desk/db/schema/tags";
import { conversationPriority, conversationStatus } from "@help-desk/db/schema/conversations";
import { emailFormDefaults, emailFormSchema } from "@help-desk/db/validators";

import type { CcBccSectionHandle } from "../ticket/cc-bcc-section";
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
import { CcBccSection } from "../ticket/cc-bcc-section";
import { RichTextEditor } from "../ticket/rich-text-editor";
import { priorityConfig, statusConfig } from "../tickets/ticket-card";

type ContactOption = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

function getContactLabel(c: ContactOption) {
  if (c.displayName) return c.displayName;
  if (c.firstName || c.lastName) return [c.firstName, c.lastName].filter(Boolean).join(" ");
  return c.email;
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

export function SendEmailForm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const editorRef = useRef<Editor | null>(null);
  const ccBccRef = useRef<CcBccSectionHandle | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [showCreateContact, setShowCreateContact] = useState(false);
  const tagAnchor = useComboboxAnchor();

  const { data: mailboxesData } = useQuery(trpc.mailbox.list.queryOptions());
  const mailboxes: Mailbox[] = mailboxesData?.items ?? [];

  const { data: contactsData } = useQuery(
    trpc.contact.getGlobalSearchAll.queryOptions(contactSearch)
  );
  const contacts: ContactOption[] = contactsData?.contacts ?? [];

  const { data: tagsData } = useQuery(trpc.tags.list.queryOptions());
  const allTags = tagsData?.items ?? [];

  const { data: defaultFiltersData } = useQuery(trpc.defaultFilter.list.queryOptions());
  const customFilters = (defaultFiltersData?.items ?? []).filter((f: DefaultFilter) => !f.isSystem);

  const { mutateAsync: createEmail } = useMutation(trpc.ticket.createEmail.mutationOptions());

  const form = useForm({
    defaultValues: emailFormDefaults,
    onSubmit: async ({ value }) => {
      try {
        const cc = ccBccRef.current?.getCc() ?? [];
        const bcc = ccBccRef.current?.getBcc() ?? [];
        await createEmail({
          ...value,
          cc: cc.length > 0 ? cc : undefined,
          bcc: bcc.length > 0 ? bcc : undefined,
        });
        await queryClient.invalidateQueries({ queryKey: trpc.ticket.all.queryKey() });
        toast.success("Email sent successfully");
        router.push("/tickets");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to send email");
      }
    },
    validators: {
      onSubmit: emailFormSchema,
    },
  });

  const handleToggleNewContact = () => {
    if (showCreateContact) {
      form.setFieldValue("newContact", undefined);
      setShowCreateContact(false);
    } else {
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
      className="grid gap-6 p-6"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <form.Field name="mailboxId">
          {(field) => {
            const selectedMailbox = mailboxes.find((m) => m.id === field.state.value) ?? null;
            return (
              <div className="space-y-2">
                <Label>
                  From <span className="text-destructive">*</span>
                </Label>
                <Combobox
                  items={mailboxes}
                  value={selectedMailbox}
                  onValueChange={(option: Mailbox | null) => {
                    field.handleChange(option?.id ?? "");
                  }}
                  isItemEqualToValue={(a, b) => a?.id === b?.id}
                  itemToStringLabel={(item) => (item ? `${item.name} <${item.email}>` : "")}
                >
                  <ComboboxTrigger
                    render={
                      <button
                        type="button"
                        className="border-input hover:bg-accent/50 focus-visible:ring-ring bg-accent/50 flex h-9 w-full items-center gap-2 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
                      >
                        {selectedMailbox ?
                          <div className="flex items-center gap-2">
                            <MailIcon className="text-muted-foreground size-4" />
                            <span className="truncate">
                              {selectedMailbox.name} &lt;{selectedMailbox.email}&gt;
                            </span>
                          </div>
                        : <span className="text-muted-foreground">Select a mailbox...</span>}
                      </button>
                    }
                  />
                  <ComboboxContent className="w-72">
                    <ComboboxInput
                      showTrigger={false}
                      placeholder="Search mailboxes..."
                      className="bg-accent/50"
                    />
                    <ComboboxEmpty>No mailboxes found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item: Mailbox) => (
                        <ComboboxItem
                          key={item.id}
                          value={item}
                        >
                          <div className="flex items-center gap-2">
                            <MailIcon className="text-muted-foreground size-4" />
                            <div className="flex flex-col">
                              <span className="text-sm">{item.name}</span>
                              <span className="text-muted-foreground text-xs">{item.email}</span>
                            </div>
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>
              To <span className="text-destructive">*</span>
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
      </div>

      <form.Field name="subject">
        {(field) => (
          <div className="space-y-2">
            <Label>
              Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Email subject"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <div className="space-y-2">
            <Label>
              Description <span className="text-destructive">*</span>
            </Label>
            <div className="border-accent overflow-hidden rounded-md border">
              <CcBccSection ref={ccBccRef} />
              <RichTextEditor
                onEditorReady={(editor) => {
                  editorRef.current = editor;
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

      <div className="grid gap-6 sm:grid-cols-2">
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
      </div>

      {customFilters.length > 0 && (
        <div className="space-y-4">
          <Label className="text-muted-foreground text-sm font-medium">Custom Filters</Label>
          <div className="grid gap-6 sm:grid-cols-2">
            {customFilters.map((filter: DefaultFilter) => (
              <div
                key={filter.id}
                className="space-y-2"
              >
                <Label>{filter.displayName}</Label>
                {filter.type === "multi-select" || filter.type === "checkbox" ?
                  <Select
                    value=""
                    onValueChange={(val) => {
                      const current = form.getFieldValue("customFields") ?? {};
                      const existing =
                        Array.isArray(current[filter.name]) ?
                          (current[filter.name] as string[])
                        : [];
                      const updated =
                        existing.includes(val) ?
                          existing.filter((v) => v !== val)
                        : [...existing, val];
                      form.setFieldValue("customFields", { ...current, [filter.name]: updated });
                    }}
                  >
                    <SelectTrigger className="bg-accent/50 w-full">
                      <SelectValue placeholder={`Select ${filter.displayName.toLowerCase()}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                : <Select
                    value={(() => {
                      const current = form.getFieldValue("customFields") ?? {};
                      const val = current[filter.name];
                      return typeof val === "string" ? val : "";
                    })()}
                    onValueChange={(val) => {
                      const current = form.getFieldValue("customFields") ?? {};
                      form.setFieldValue("customFields", { ...current, [filter.name]: val });
                    }}
                  >
                    <SelectTrigger className="bg-accent/50 w-full">
                      <SelectValue placeholder={`Select ${filter.displayName.toLowerCase()}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              </div>
            ))}
          </div>
        </div>
      )}

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

      <form.Subscribe>
        {(state) => (
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!state.canSubmit || state.isSubmitting}
            >
              {state.isSubmitting ? "Sending..." : "Send Email"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
