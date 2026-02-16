"use client";

import type { ListControlsBaseProps } from "../tickets/list-controls";
import type { ViewMode } from "./search-params";
import { useContactTableParams } from "../table/contacts/contact-table-params";
import { ListControls } from "../tickets/list-controls";
import { useContactsListControls } from "./use-contacts-list-controls";

export const contactSortFields: SortField[] = [
  {
    label: "Created at",
    value: "createdAt",
  },
  {
    label: "Updated at",
    value: "updatedAt",
  },
];

export type SortField = {
  label: string;
  value: string;
};

export type SortFieldMap = Record<ViewMode, SortField[]>;

export const contactSortFieldsMap: SortFieldMap = {
  card: contactSortFields,
  list: contactSortFields,
};

export const ContactsListControls = (props: ListControlsBaseProps) => {
  const { ...listControls } = useContactsListControls();
  const tableParams = useContactTableParams();
  return (
    <div className="flex items-center justify-between">
      <ListControls
        {...props}
        listControls={listControls}
        tableParams={tableParams}
        sortFieldsMap={contactSortFieldsMap}
        viewModes={["card", "list"]}
        filterButton={<></>}
      />
    </div>
  );
};
