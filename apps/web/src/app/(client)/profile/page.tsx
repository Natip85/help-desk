import type { ReactNode } from "react";
import { Suspense } from "react";
import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Key, LinkIcon, Loader2Icon, Shield, Trash2, User } from "lucide-react";

import { auth } from "@help-desk/auth";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountDeletion } from "@/features/auth/account-deletion";
import { AccountLinking } from "@/features/auth/account-linking";
import { ChangePasswordForm } from "@/features/auth/change-password-form";
import { ProfileUpdateForm } from "@/features/auth/profile-update-form";
import { SessionManagement } from "@/features/auth/session-managment";
import { SetPasswordButton } from "@/features/auth/set-password-button";
import { TwoFactorAuth } from "@/features/auth/two-factor-auth";
import { profileBreadcrumbs } from "@/lib/breadcrumbs";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session == null) return redirect("/auth/sign-in");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 py-6 pr-4.5 pl-6">
      <Breadcrumbs
        pages={profileBreadcrumbs}
        className="px-2"
      />
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <div className="bg-muted flex size-16 items-center justify-center overflow-hidden rounded-full">
            {session.user.image ?
              <Image
                width={64}
                height={64}
                src={session.user.image}
                alt="User Avatar"
                className="object-cover"
              />
            : <User className="text-muted-foreground size-8" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-5">
              <h1 className="text-3xl font-bold">{session.user.name || "User Profile"}</h1>
              <Badge>{session.user.role}</Badge>
            </div>
            <p className="text-muted-foreground">{session.user.email}</p>
          </div>
        </div>
      </div>

      <Tabs
        className="space-y-2"
        defaultValue="profile"
      >
        <TabsList className="w-full">
          <TabsTrigger value="profile">
            <User className="mr-1 size-4" />
            <span className="max-sm:hidden">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-1 size-4" />
            <span className="max-sm:hidden">Security</span>
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Key className="mr-1 size-4" />
            <span className="max-sm:hidden">Sessions</span>
          </TabsTrigger>
          <TabsTrigger value="accounts">
            <LinkIcon className="mr-1 size-4" />
            <span className="max-sm:hidden">Accounts</span>
          </TabsTrigger>
          <TabsTrigger value="danger">
            <Trash2 className="mr-1 size-4" />
            <span className="max-sm:hidden">Danger</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardContent>
              <ProfileUpdateForm user={session.user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <LoadingSuspense>
            <SecurityTab
              email={session.user.email}
              isTwoFactorEnabled={session.user.twoFactorEnabled ?? false}
            />
          </LoadingSuspense>
        </TabsContent>

        <TabsContent value="sessions">
          <LoadingSuspense>
            <SessionsTab currentSessionId={session.session.id} />
          </LoadingSuspense>
        </TabsContent>

        <TabsContent value="accounts">
          <LoadingSuspense>
            <LinkedAccountsTab />
          </LoadingSuspense>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="border-destructive border">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <AccountDeletion />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

async function SecurityTab({
  email,
  isTwoFactorEnabled,
}: {
  email: string;
  isTwoFactorEnabled: boolean;
}) {
  const [accounts] = await Promise.all([
    // auth.api.listPasskeys({headers: await headers()}),
    auth.api.listUserAccounts({ headers: await headers() }),
  ]);

  const hasPasswordAccount = accounts.some((a) => a.providerId === "credential");

  return (
    <div className="space-y-6">
      {hasPasswordAccount ?
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password for improved security.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      : <Card>
          <CardHeader>
            <CardTitle>Set Password</CardTitle>
            <CardDescription>
              We will send you a password reset email to set up a password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SetPasswordButton email={email} />
          </CardContent>
        </Card>
      }
      {hasPasswordAccount && (
        <Card>
          <CardHeader className="flex items-center justify-between gap-2">
            <CardTitle>Two-Factor Authentication</CardTitle>
            <Badge variant={isTwoFactorEnabled ? "default" : "secondary"}>
              {isTwoFactorEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </CardHeader>
          <CardContent>
            <TwoFactorAuth isEnabled={isTwoFactorEnabled} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

async function SessionsTab({ currentSessionId }: { currentSessionId: string }) {
  const sessions = await auth.api.listSessions({ headers: await headers() });

  return (
    <Card>
      <CardContent>
        <SessionManagement
          sessions={sessions}
          currentSessionId={currentSessionId}
        />
      </CardContent>
    </Card>
  );
}

async function LinkedAccountsTab() {
  const accounts = await auth.api.listUserAccounts({
    headers: await headers(),
  });
  const nonCredentialAccounts = accounts.filter((a) => a.providerId !== "credential");

  return (
    <Card>
      <CardContent>
        <AccountLinking currentAccounts={nonCredentialAccounts} />
      </CardContent>
    </Card>
  );
}

function LoadingSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Loader2Icon className="size-20 animate-spin" />}>{children}</Suspense>
  );
}
