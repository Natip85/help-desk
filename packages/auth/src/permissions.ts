import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements, userAc } from "better-auth/plugins/admin/access";

// Admin plugin access control (for global user roles)
export const ac = createAccessControl(defaultStatements);

export const user = ac.newRole({
  ...userAc.statements,
  // user: [...userAc.statements.user, 'list'],
});

export const admin = ac.newRole(adminAc.statements);
