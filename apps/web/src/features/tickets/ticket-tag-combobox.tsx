import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import type { Tag } from "@help-desk/db/schema/tags";

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
import { CreateTagDialog } from "../settings/tags/create-tag-dialog";

type TicketTagComboboxProps = {
  ticketId: string;
  currentTags: Tag[];
};

export function TicketTagCombobox({ ticketId, currentTags }: TicketTagComboboxProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const anchor = useComboboxAnchor();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();
  const { data: tagsData } = useQuery(trpc.tags.list.queryOptions());
  const allTags = tagsData?.items ?? [];

  const { mutate: setConversationTags } = useMutation(
    trpc.tags.setConversationTags.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.ticket.getById.queryKey(ticketId),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.ticket.all.queryKey(),
        });
        toast.success("Tags updated");
        router.refresh();
      },
    })
  );

  // Map current tags to the full tag objects from the list
  const selectedTags = currentTags
    .map((ct) => allTags.find((t) => t.id === ct.id))
    .filter((t): t is Tag => !!t);

  return (
    <>
      <Combobox
        key={currentTags.map((t) => t.id).join("|")}
        multiple
        autoHighlight
        items={allTags}
        value={selectedTags.length > 0 ? selectedTags : null}
        onValueChange={(values: Tag[] | null) => {
          const tagIds = (values ?? []).map((t) => t.id);
          setConversationTags({ conversationId: ticketId, tagIds });
        }}
        isItemEqualToValue={(a, b) => a?.id === b?.id}
        itemToStringLabel={(item) => item.name}
      >
        <ComboboxChips
          ref={anchor}
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
                    placeholder={selected.length > 0 ? "" : "tags"}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                </Fragment>
              );
            }}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground flex w-full cursor-pointer items-center justify-center gap-1.5 py-2 text-sm transition-colors"
              onPointerDown={(e) => {
                // Prevent the combobox from closing
                e.preventDefault();
                setCreateDialogOpen(true);
              }}
            >
              <Plus className="size-3.5" />
              <span>Create &ldquo;{searchValue}&rdquo;</span>
            </button>
          </ComboboxEmpty>
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

      <CreateTagDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        defaultName={searchValue}
      />
    </>
  );
}
