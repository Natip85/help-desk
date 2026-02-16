import type { BreadcrumbPageType } from "@/components/breadcrumbs";

// Base breadcrumb definitions
export const homeBreadcrumb: BreadcrumbPageType = { href: "/", label: "Home" };

export const ticketsBreadcrumb: BreadcrumbPageType = { href: "/tickets", label: "Tickets" };

export const emailsBreadcrumb: BreadcrumbPageType = { href: "/emails", label: "Emails" };

export const dashboardBreadcrumb: BreadcrumbPageType = { href: "/dashboard", label: "Dashboard" };

export const contactsBreadcrumb: BreadcrumbPageType = { href: "/contacts", label: "Contacts" };

export const settingsBreadcrumb: BreadcrumbPageType = { href: "/settings", label: "Settings" };

export const profileBreadcrumb: BreadcrumbPageType = { href: "/profile", label: "Profile" };

// Common breadcrumb arrays
export const ticketsBreadcrumbs: BreadcrumbPageType[] = [homeBreadcrumb, ticketsBreadcrumb];

export const emailsBreadcrumbs: BreadcrumbPageType[] = [homeBreadcrumb, emailsBreadcrumb];

export const dashboardBreadcrumbs: BreadcrumbPageType[] = [homeBreadcrumb, dashboardBreadcrumb];

export const contactsBreadcrumbs: BreadcrumbPageType[] = [homeBreadcrumb, contactsBreadcrumb];

export const settingsBreadcrumbs: BreadcrumbPageType[] = [homeBreadcrumb, settingsBreadcrumb];

export const profileBreadcrumbs: BreadcrumbPageType[] = [homeBreadcrumb, profileBreadcrumb];

// Tickets sub-pages
export const newTicketBreadcrumbs: BreadcrumbPageType[] = [
  homeBreadcrumb,
  ticketsBreadcrumb,
  { href: "/tickets/new", label: "New Ticket" },
];

export const trashTicketsBreadcrumbs: BreadcrumbPageType[] = [
  homeBreadcrumb,
  ticketsBreadcrumb,
  { href: "/tickets/trash", label: "Trash" },
];

// Contacts sub-pages
export const newContactBreadcrumbs: BreadcrumbPageType[] = [
  homeBreadcrumb,
  contactsBreadcrumb,
  { href: "/contacts/new", label: "New Contact" },
];

// Emails sub-pages
export const newEmailBreadcrumbs: BreadcrumbPageType[] = [
  homeBreadcrumb,
  ticketsBreadcrumb,
  { href: "/emails/new", label: "New Email" },
];

// Settings sub-pages
export const settingsOrganizationsBreadcrumbs: BreadcrumbPageType[] = [
  homeBreadcrumb,
  settingsBreadcrumb,
  { href: "/settings/organizations", label: "Organizations" },
];

export const settingsSavedFiltersBreadcrumbs: BreadcrumbPageType[] = [
  homeBreadcrumb,
  settingsBreadcrumb,
  { href: "/settings/saved-filters", label: "Saved Filters" },
];

export const settingsCannedResponsesBreadcrumbs: BreadcrumbPageType[] = [
  homeBreadcrumb,
  settingsBreadcrumb,
  { href: "/settings/canned-responses", label: "Canned Responses" },
];

export const settingsNewCannedResponseBreadcrumbs: BreadcrumbPageType[] = [
  homeBreadcrumb,
  settingsBreadcrumb,
  { href: "/settings/canned-responses", label: "Canned Responses" },
  { href: "/settings/canned-responses/new", label: "New" },
];

export const settingsTagsBreadcrumbs: BreadcrumbPageType[] = [
  homeBreadcrumb,
  settingsBreadcrumb,
  { href: "/settings/tags", label: "Tags" },
];

export const settingsTicketFiltersBreadcrumbs: BreadcrumbPageType[] = [
  homeBreadcrumb,
  settingsBreadcrumb,
  { href: "/settings/ticket-filters", label: "Ticket Filters" },
];

// Factory functions for dynamic breadcrumbs
export function createTicketDetailBreadcrumbs(
  ticketId: string,
  ticketTitle?: string
): BreadcrumbPageType[] {
  return [
    homeBreadcrumb,
    ticketsBreadcrumb,
    { href: `/tickets/${ticketId}`, label: ticketTitle ?? ticketId },
  ];
}

export function createContactDetailBreadcrumbs(
  contactId: string,
  contactName?: string
): BreadcrumbPageType[] {
  return [
    homeBreadcrumb,
    contactsBreadcrumb,
    { href: `/contacts/${contactId}`, label: contactName ?? contactId },
  ];
}

export function createOrganizationDetailBreadcrumbs(
  orgId: string,
  orgName?: string
): BreadcrumbPageType[] {
  return [
    homeBreadcrumb,
    settingsBreadcrumb,
    { href: "/settings/organizations", label: "Organizations" },
    { href: `/settings/organizations/${orgId}`, label: orgName ?? orgId },
  ];
}

export function createCannedResponseDetailBreadcrumbs(
  cannedId: string,
  title?: string
): BreadcrumbPageType[] {
  return [
    homeBreadcrumb,
    settingsBreadcrumb,
    { href: "/settings/canned-responses", label: "Canned Responses" },
    { href: `/settings/canned-responses/${cannedId}`, label: title ?? cannedId },
  ];
}
