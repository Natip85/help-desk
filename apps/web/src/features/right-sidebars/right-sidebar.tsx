import { X } from "lucide-react";

import { Sidebar, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export { useSidebar };

export type RightSidebarProps = React.ComponentProps<typeof Sidebar> & {
  onClose?: () => void;
};

export const RightSidebar = ({ children, className, onClose, ...props }: RightSidebarProps) => {
  return (
    <Sidebar
      side="right"
      collapsible="offcanvas"
      variant="sidebar"
      className={cn("relative", className)}
      onMobileClose={onClose}
      {...props}
    >
      <SidebarTrigger
        side="right"
        className="absolute top-2.5 right-1 z-10"
        size="sm"
        onClick={onClose}
      >
        <X />
      </SidebarTrigger>
      {children}
    </Sidebar>
  );
};
