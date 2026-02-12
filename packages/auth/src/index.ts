import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { lastLoginMethod } from "better-auth/plugins";
import { admin as adminPlugin } from "better-auth/plugins/admin";
import { organization } from "better-auth/plugins/organization";
import { twoFactor } from "better-auth/plugins/two-factor";

import { db } from "@help-desk/db";
import * as schema from "@help-desk/db/schema/auth";
import { env } from "@help-desk/env/server";

import {
  createDefaultOrganizationForUser,
  getFirstOrganizationIdForUser,
} from "./create-default-organization";
import { sendDeleteAccountVerificationEmail } from "./emails/delete-account-verification";
import { sendEmailVerificationEmail } from "./emails/email-verification";
import { sendOrganizationInviteEmail } from "./emails/organization-invite-email";
import { sendPasswordResetEmail } from "./emails/password-reset-email";
import { ac, admin, user } from "./permissions";

export const auth = betterAuth({
  appName: "Help Desk",
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, url, newEmail }) => {
        await sendEmailVerificationEmail({
          user: { ...user, email: newEmail },
          url,
        });
      },
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }) => {
        await sendDeleteAccountVerificationEmail({ user, url });
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({ user, url });
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmailVerificationEmail({ user, url });
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 1, // 1 minutes
    },
  },
  plugins: [
    nextCookies(),
    twoFactor(),
    adminPlugin({
      ac,
      roles: {
        admin,
        user,
      },
    }),
    organization({
      sendInvitationEmail: async ({ email, organization, inviter, invitation }) => {
        await sendOrganizationInviteEmail({
          invitation,
          inviter: inviter.user,
          organization,
          email,
        });
      },

      // teams: {
      //   enabled: true,
      //   maximumTeams: 10, // Optional: limit teams per organization
      //   allowRemovingAllTeams: false, // Optional: prevent removing the last team
      // },
      // allowUserToCreateOrganization: (user) => {
      //   return user.role === "admin";
      // },
      allowUserToCreateOrganization: () => true,
      // Automatically add the creator AND org owners/admins to new teams
      organizationHooks: {
        // afterCreateTeam: async ({ team, user, organization: org }) => {
        //   // Get org owners and admins
        //   const orgAdmins = await db.query.member.findMany({
        //     where: (member, { and, eq, inArray }) =>
        //       and(eq(member.organizationId, org.id), inArray(member.role, ["owner", "admin"])),
        //   });
        //   // Collect all user IDs to add (creator + org admins/owners)
        //   const userIdsToAdd = new Set<string>();
        //   // Add the creator if exists
        //   if (user) {
        //     userIdsToAdd.add(user.id);
        //   }
        //   // Add all org owners and admins
        //   for (const admin of orgAdmins) {
        //     userIdsToAdd.add(admin.userId);
        //   }
        //   // Insert all team members
        //   if (userIdsToAdd.size > 0) {
        //     await db
        //       .insert(schema.teamMember)
        //       .values(
        //         Array.from(userIdsToAdd).map((userId) => ({
        //           id: crypto.randomUUID().replace(/-/g, ""),
        //           teamId: team.id,
        //           userId,
        //           createdAt: new Date(),
        //         }))
        //       )
        //       .onConflictDoNothing();
        //   }
        // },
      },
    }),

    lastLoginMethod(),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await createDefaultOrganizationForUser(user);
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          if (!session.activeOrganizationId) {
            const orgId = await getFirstOrganizationIdForUser(session.userId);
            if (orgId) {
              return { data: { ...session, activeOrganizationId: orgId } };
            }
          }
          return { data: session };
        },
      },
    },
  },
  trustedOrigins: env.BETTER_AUTH_URL ? [env.BETTER_AUTH_URL] : [],
});
