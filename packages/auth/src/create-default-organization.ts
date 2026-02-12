import { db } from "@help-desk/db";
import { member, organization } from "@help-desk/db/schema/auth";

type UserWithIdAndName = {
  id: string;
  name: string | null;
};

/**
 * Creates a default personal organization for a newly signed-up user.
 * Called from databaseHooks.user.create.after to ensure every new user
 * has an organization from the start.
 */
export async function createDefaultOrganizationForUser(user: UserWithIdAndName): Promise<void> {
  const slug = `personal-${user.id.replace(/-/g, "").slice(0, 12)}`;
  const name = user.name ? `${user.name}'s Workspace` : "My Organization";

  const orgId = crypto.randomUUID().replace(/-/g, "");
  const memberId = crypto.randomUUID().replace(/-/g, "");
  const now = new Date();

  await db.insert(organization).values({
    id: orgId,
    name,
    slug,
    logo: null,
    createdAt: now,
    metadata: null,
  });

  await db.insert(member).values({
    id: memberId,
    organizationId: orgId,
    userId: user.id,
    role: "owner",
    createdAt: now,
  });
}

/**
 * Returns the first organization ID for a user (by membership).
 * Used to set activeOrganizationId when a session is created.
 */
export async function getFirstOrganizationIdForUser(userId: string): Promise<string | null> {
  const firstMember = await db.query.member.findFirst({
    where: (m, { eq }) => eq(m.userId, userId),
    columns: { organizationId: true },
  });
  return firstMember?.organizationId ?? null;
}
