"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";

import { useSidebarParams } from "./query-params";
import { RightSidebar, useSidebar } from "./right-sidebar";
import { TicketStatusesSidebar } from "./ticket-statuses-sidebar";

const TicketFilterSidebar = dynamic(() =>
  import("./ticket-filter-sidebar").then((mod) => ({ default: mod.TicketFilterSidebar }))
);
const ContactInfoSidebar = dynamic(() =>
  import("./contact-info-sidebar").then((mod) => ({ default: mod.ContactInfoSidebar }))
);
const CannedResponsesSidebar = dynamic(() =>
  import("./canned-responses-sidebar").then((mod) => ({ default: mod.CannedResponsesSidebar }))
);
const CreateSavedFilterSidebar = dynamic(() =>
  import("./create-saved-filter-sidebar").then((mod) => ({
    default: mod.CreateSavedFilterSidebar,
  }))
);
const EditSavedFilterSidebar = dynamic(() =>
  import("./edit-saved-filter-sidebar").then((mod) => ({
    default: mod.EditSavedFilterSidebar,
  }))
);

export const RightSidebarContainer = ({ belowHeader }: { belowHeader?: boolean }) => {
  const { sidebarParams, setSidebarParams } = useSidebarParams();

  const pathname = usePathname();
  const { setOpen, setOpenMobile, open, openMobile, isMobile } = useSidebar("right");

  const hasSidebarParams = Object.values(sidebarParams).some(Boolean);
  const isOpen = isMobile ? openMobile : open;

  // Helper to set the correct sidebar state based on device
  const setSidebarOpen = (value: boolean) => {
    if (isMobile) {
      setOpenMobile(value);
    } else {
      setOpen(value);
    }
  };

  // TODO: check if we can remove this now that we are not using cookies
  const checkSidebar = () => {
    // closing reasons
    const noParams = !hasSidebarParams && isOpen;
    // staying open reasons

    const shouldClose = noParams;

    if (shouldClose) {
      setSidebarOpen(false);
      void setSidebarParams(null);
    } else if (hasSidebarParams && !isOpen) {
      setSidebarOpen(true);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkSidebar();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [pathname, isOpen, hasSidebarParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get the current active component key for animation
  const getActiveKey = () => {
    if (sidebarParams.contactId) return "contact-info";
    if (sidebarParams.filterSaving) return "create-saved-filter";
    if (sidebarParams.ticketStatusesId) return "ticket-statuses";
    if (sidebarParams.cannedResponsesId) return "canned-responses";
    if (sidebarParams.editSavedFilterId) return "edit-saved-filter";
    if (sidebarParams.filterOpen && !sidebarParams.filterSaving) return "ticket-filter";

    return null;
  };

  return (
    <RightSidebar
      className="h-full"
      belowHeader={belowHeader}
      onClose={() => {
        void setSidebarParams(null);
      }}
    >
      <AnimatePresence mode="wait">
        {getActiveKey() && (
          <motion.div
            key={getActiveKey()}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="flex h-full flex-col"
          >
            {sidebarParams.contactId && <ContactInfoSidebar />}
            {sidebarParams.filterSaving && <CreateSavedFilterSidebar />}
            {sidebarParams.editSavedFilterId && <EditSavedFilterSidebar />}
            {sidebarParams.filterOpen && !sidebarParams.filterSaving && <TicketFilterSidebar />}
            {sidebarParams.ticketStatusesId && <TicketStatusesSidebar />}
            {sidebarParams.cannedResponsesId && <CannedResponsesSidebar />}
          </motion.div>
        )}
      </AnimatePresence>
    </RightSidebar>
  );
};
