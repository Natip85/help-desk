"use client";

import type { ReactNode } from "react";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { CannedResponseFoldersSidebar } from "./canned-response-folders-sidebar";

type CannedResponseLayoutProps = {
  children: ReactNode;
};

export function CannedResponseLayout({ children }: CannedResponseLayoutProps) {
  return (
    <div className="size-full">
      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId="canned-response-layout"
      >
        <ResizablePanel
          defaultSize={20}
          minSize={15}
          maxSize={30}
          collapsible
          className="bg-secondary"
        >
          <CannedResponseFoldersSidebar />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={80}>
          <div className="h-full overflow-y-auto">{children}</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
