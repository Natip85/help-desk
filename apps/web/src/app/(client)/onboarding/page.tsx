"use client";

import { Button } from "@/components/ui/button";
import { useSidebarParams } from "@/features/right-sidebars/query-params";

export default function OnboardingPage() {
  const { toggleInfoSidebarId } = useSidebarParams();
  return (
    <div>
      OnboardingPage<Button onClick={() => toggleInfoSidebarId("123")}>Open</Button>
    </div>
  );
}
