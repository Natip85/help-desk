"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import {
  SUPPORTED_OAUTH_PROVIDER_DETAILS,
  SUPPORTED_OAUTH_PROVIDERS,
} from "@/lib/o-auth-providers";

type SocialAuthButtonsProps = {
  redirectUrl?: string;
};

export function SocialAuthButtons({ redirectUrl }: SocialAuthButtonsProps) {
  const lastMethod = authClient.getLastUsedLoginMethod();

  return SUPPORTED_OAUTH_PROVIDERS.map((provider) => {
    const Icon = SUPPORTED_OAUTH_PROVIDER_DETAILS[provider].Icon;
    const isLastUsed = lastMethod === provider;

    return (
      <Button
        key={provider}
        onClick={() => {
          void authClient.signIn.social({
            provider,
            callbackURL: redirectUrl ?? "/onboarding",
          });
        }}
        className="relative w-full"
      >
        <Icon />
        {SUPPORTED_OAUTH_PROVIDER_DETAILS[provider].name}
        {isLastUsed && (
          <Badge
            variant="secondary"
            className="absolute -top-2 -right-2 ml-2"
          >
            Last used
          </Badge>
        )}
      </Button>
    );
  });
}
