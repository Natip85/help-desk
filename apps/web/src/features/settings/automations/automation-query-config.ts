import type { Field } from "react-querybuilder";

export const automationFields: Field[] = [
  {
    name: "mailboxEmail",
    label: "Mailbox (To email)",
    placeholder: "e.g. support@yarcone.com",
    defaultOperator: "=",
  },
  {
    name: "senderEmail",
    label: "Sender (From email)",
    placeholder: "e.g. customer@example.com",
    defaultOperator: "=",
  },
  {
    name: "subject",
    label: "Subject",
    placeholder: "e.g. Order inquiry",
    defaultOperator: "contains",
  },
  {
    name: "channel",
    label: "Channel",
    valueEditorType: "select",
    values: [
      { name: "email", label: "Email" },
      { name: "web", label: "Web" },
      { name: "api", label: "API" },
    ],
    defaultOperator: "=",
  },
  {
    name: "priority",
    label: "Priority",
    valueEditorType: "select",
    values: [
      { name: "low", label: "Low" },
      { name: "normal", label: "Normal" },
      { name: "high", label: "High" },
      { name: "urgent", label: "Urgent" },
    ],
    defaultOperator: "=",
  },
  {
    name: "status",
    label: "Status",
    valueEditorType: "select",
    values: [
      { name: "open", label: "Open" },
      { name: "pending", label: "Pending" },
      { name: "resolved", label: "Resolved" },
      { name: "closed", label: "Closed" },
    ],
    defaultOperator: "=",
  },
  {
    name: "tags",
    label: "Tags",
    placeholder: "e.g. New",
    defaultOperator: "contains",
  },
];

export const automationOperators = [
  { name: "=", label: "equals" },
  { name: "!=", label: "does not equal" },
  { name: "contains", label: "contains" },
  { name: "doesNotContain", label: "does not contain" },
  { name: "beginsWith", label: "begins with" },
  { name: "endsWith", label: "ends with" },
];
