import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements as adminDefaultStatements,
  adminAc as globalAdminAc,
  userAc,
} from "better-auth/plugins/admin/access";
import {
  adminAc as orgAdminAc,
  defaultStatements as orgDefaultStatements,
} from "better-auth/plugins/organization/access";

// Admin plugin access control (for global user.role: "admin" | "user")

export const ac = createAccessControl(adminDefaultStatements);

export const user = ac.newRole({
  ...userAc.statements,
});

export const admin = ac.newRole(globalAdminAc.statements);

// Organization plugin access control (for member.role within an org)
const orgStatements = {
  ...orgDefaultStatements,
  ticket: ["create", "read", "update", "close", "delete", "assign", "export"],
  report: ["view"],
} as const;

export const orgAc = createAccessControl(orgStatements);

export const ownerRole = orgAc.newRole({
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  ticket: ["create", "read", "update", "close", "delete", "assign", "export"],
  report: ["view"],
});

export const adminRole = orgAc.newRole({
  ...orgAdminAc.statements,
  ticket: ["create", "read", "update", "close", "delete", "assign", "export"],
  report: ["view"],
});

export const memberRole = orgAc.newRole({
  ticket: ["create", "read", "update", "close"],
  report: [],
});

export const viewerRole = orgAc.newRole({
  ticket: ["read"],
  report: ["view"],
});
