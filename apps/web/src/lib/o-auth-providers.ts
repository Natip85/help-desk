import type { ComponentProps, ElementType } from "react";
import { GithubIcon } from "lucide-react";

import { GoogleIcon } from "@/features/auth/google";

export const SUPPORTED_OAUTH_PROVIDERS = ["google", "github"] as const;
export type SupportedOAuthProvider = (typeof SUPPORTED_OAUTH_PROVIDERS)[number];

export const SUPPORTED_OAUTH_PROVIDER_DETAILS: Record<
  SupportedOAuthProvider,
  { name: string; Icon: ElementType<ComponentProps<"svg">> }
> = {
  google: { name: "Continue with Google", Icon: GoogleIcon },
  github: { name: "Continue with GitHub", Icon: GithubIcon },
};
