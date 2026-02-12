"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailVerification } from "./email-verification";
import { ForgotPassword } from "./forgot-password";
import { SignInTab } from "./sign-in-tab";
import { SignUpTab } from "./sign-up-tab";
import { SocialAuthButtons } from "./social-auth-buttons";

type Tab = "signin" | "signup" | "email-verification" | "forgot-password";

type AuthTabsProps = {
  redirectUrl?: string;
};

export function AuthTabs({ redirectUrl }: AuthTabsProps) {
  const [email, setEmail] = useState("");
  const [selectedTab, setSelectedTab] = useState<Tab>("signin");

  function openEmailVerificationTab(email: string) {
    setEmail(email);
    setSelectedTab("email-verification");
  }

  const isAuthTab = selectedTab === "signin" || selectedTab === "signup";

  return (
    <Tabs
      value={selectedTab}
      onValueChange={(t) => setSelectedTab(t as Tab)}
      className="w-full max-w-md"
    >
      {isAuthTab && (
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
      )}

      {isAuthTab && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <SocialAuthButtons redirectUrl={redirectUrl} />

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card text-muted-foreground px-2">or continue with email</span>
              </div>
            </div>

            {selectedTab === "signin" && (
              <SignInTab
                openEmailVerificationTab={openEmailVerificationTab}
                openForgotPassword={() => setSelectedTab("forgot-password")}
                redirectUrl={redirectUrl}
              />
            )}
            {selectedTab === "signup" && (
              <SignUpTab
                openEmailVerificationTab={openEmailVerificationTab}
                redirectUrl={redirectUrl}
              />
            )}
          </CardContent>
        </Card>
      )}

      <TabsContent value="email-verification">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
          </CardHeader>
          <CardContent>
            <EmailVerification email={email} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="forgot-password">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
          </CardHeader>
          <CardContent>
            <ForgotPassword openSignInTab={() => setSelectedTab("signin")} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
