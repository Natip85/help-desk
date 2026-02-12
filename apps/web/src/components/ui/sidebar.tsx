"use client";

import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { PanelLeftIcon, PanelRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// Sidebar width variants for left/right
const sideWidthVariants = cva("", {
  variants: {
    side: {
      left: "w-(--sidebar-left-width)",
      right: "w-(--sidebar-right-width)",
    },
  },
  defaultVariants: {
    side: "left",
  },
});

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "13rem";
const SIDEBAR_WIDTH_LARGE = "15rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "4rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarItemState = "expanded" | "collapsed";
type SidebarSide = "left" | "right";

type SidebarSideProp = {
  side?: SidebarSide;
};

type SidebarItemContext = {
  state: SidebarItemState;
  open: boolean;
  setOpen: (value: boolean | ((value: boolean) => boolean)) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

type SidebarContextProps = {
  isMobile: boolean;
  getSidebarState: (side: SidebarSide) => SidebarItemContext;
  leftSidebar: SidebarItemContext;
  rightSidebar: SidebarItemContext;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar(side: SidebarSide = "left") {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context.getSidebarState(side);
}

function SidebarProvider({
  defaultLeftOpen = true,
  defaultRightOpen = false,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultLeftOpen?: boolean;
  defaultRightOpen?: boolean;
}) {
  const isMobile = useIsMobile();

  // Left sidebar state
  const [leftOpenMobile, setLeftOpenMobile] = React.useState(false);
  const [_leftOpen, _setLeftOpen] = React.useState(defaultLeftOpen);

  // Right sidebar state
  const [rightOpenMobile, setRightOpenMobile] = React.useState(false);
  const [_rightOpen, _setRightOpen] = React.useState(defaultRightOpen);

  // Update state from cookies on mount (client-side only)
  React.useEffect(() => {
    const getCookieValue = (name: string) => {
      const match = new RegExp(`(^| )${name}=([^;]+)`).exec(document.cookie);
      return match ? match[2] : null;
    };

    const leftCookieValue = getCookieValue(`${SIDEBAR_COOKIE_NAME}_left`);
    if (leftCookieValue !== null) {
      _setLeftOpen(leftCookieValue === "true");
    }

    const rightCookieValue = getCookieValue(`${SIDEBAR_COOKIE_NAME}_right`);
    if (rightCookieValue !== null) {
      _setRightOpen(rightCookieValue === "true");
    }
  }, []);

  // Left sidebar setters
  const setLeftOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(_leftOpen) : value;
      _setLeftOpen(openState);
      document.cookie = `${SIDEBAR_COOKIE_NAME}_left=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [_leftOpen]
  );

  // Right sidebar setters
  const setRightOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(_rightOpen) : value;
      _setRightOpen(openState);
      document.cookie = `${SIDEBAR_COOKIE_NAME}_right=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [_rightOpen]
  );

  // Helper to toggle left sidebar
  const toggleLeftSidebar = React.useCallback(() => {
    return isMobile ? setLeftOpenMobile((open) => !open) : setLeftOpen((open) => !open);
  }, [isMobile, setLeftOpen]);

  // Helper to toggle right sidebar
  const toggleRightSidebar = React.useCallback(() => {
    return isMobile ? setRightOpenMobile((open) => !open) : setRightOpen((open) => !open);
  }, [isMobile, setRightOpen]);

  // Adds a keyboard shortcut to toggle the left sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleLeftSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleLeftSidebar]);

  // We add a state so that we can do data-state="expanded" or "collapsed".
  const leftState = _leftOpen ? "expanded" : "collapsed";
  const rightState = _rightOpen ? "expanded" : "collapsed";

  // Function to get sidebar state by side
  const getSidebarState = React.useCallback(
    (side: SidebarSide): SidebarItemContext => {
      if (side === "left") {
        return {
          isMobile,
          state: leftState,
          open: _leftOpen,
          setOpen: setLeftOpen,
          openMobile: leftOpenMobile,
          setOpenMobile: setLeftOpenMobile,
          toggleSidebar: toggleLeftSidebar,
        };
      } else {
        return {
          isMobile,
          state: rightState,
          open: _rightOpen,
          setOpen: setRightOpen,
          openMobile: rightOpenMobile,
          setOpenMobile: setRightOpenMobile,
          toggleSidebar: toggleRightSidebar,
        };
      }
    },
    [
      isMobile,
      leftState,
      _leftOpen,
      setLeftOpen,
      leftOpenMobile,
      toggleLeftSidebar,
      rightState,
      _rightOpen,
      setRightOpen,
      rightOpenMobile,
      toggleRightSidebar,
    ]
  );

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      isMobile,
      getSidebarState,
      leftSidebar: {
        isMobile,
        state: leftState,
        open: _leftOpen,
        setOpen: setLeftOpen,
        openMobile: leftOpenMobile,
        setOpenMobile: setLeftOpenMobile,
        toggleSidebar: toggleLeftSidebar,
      },
      rightSidebar: {
        isMobile,
        state: rightState,
        open: _rightOpen,
        setOpen: setRightOpen,
        openMobile: rightOpenMobile,
        setOpenMobile: setRightOpenMobile,
        toggleSidebar: toggleRightSidebar,
      },
    }),
    [
      isMobile,
      leftState,
      _leftOpen,
      setLeftOpen,
      leftOpenMobile,
      toggleLeftSidebar,
      rightState,
      _rightOpen,
      setRightOpen,
      rightOpenMobile,
      toggleRightSidebar,
      getSidebarState,
    ]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-left-width": SIDEBAR_WIDTH,
              "--sidebar-right-width": SIDEBAR_WIDTH_LARGE,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full overflow-hidden",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

const sidebarContainerVariants = cva(
  "fixed inset-y-0 z-10 hidden h-svh transition-[left,right,width] duration-200 ease-linear md:flex",
  {
    variants: {
      state: {
        expanded: "",
        collapsed: "",
      },
      collapsible: {
        icon: "",
        offcanvas: "",
        none: "",
      },
      variant: {
        floating: "p-2",
        inset: "p-2",
        sidebar: "",
      },
      side: {
        left: "left-0",
        right: "right-0",
      },
    },
    compoundVariants: [
      // Width logic for collapsed state with icon
      {
        state: "collapsed",
        collapsible: "icon",
        variant: ["floating", "inset"],
        className: "w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]",
      },
      {
        state: "collapsed",
        collapsible: "icon",
        variant: "sidebar",
        className: "w-(--sidebar-width-icon)",
      },
      // Width logic for collapsed state with offcanvas
      {
        state: "collapsed",
        collapsible: "offcanvas",
        side: "left",
        className: "left-[calc(var(--sidebar-left-width)*-1)]",
      },
      {
        state: "collapsed",
        collapsible: "offcanvas",
        side: "right",
        className: "right-[calc(var(--sidebar-right-width)*-1)]",
      },
    ],
    defaultVariants: {
      state: "expanded",
      collapsible: "offcanvas",
      variant: "sidebar",
      side: "left",
    },
  }
);

const sidebarVariants = cva(
  "group peer hidden min-w-0 transition-[left,right,width] duration-200 ease-linear md:block",
  {
    variants: {
      state: {
        expanded: "",
        collapsed: "",
      },
      collapsible: {
        icon: "",
        offcanvas: "",
        none: "",
      },
      variant: {
        floating: "",
        inset: "",
        sidebar: "",
      },
      side: {
        left: "",
        right: "",
      },
    },
    compoundVariants: [
      // Width logic for collapsed state with icon
      {
        state: "collapsed",
        collapsible: "icon",
        variant: ["floating", "inset"],
        className: "w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]",
      },
      {
        state: "collapsed",
        collapsible: "icon",
        variant: "sidebar",
        className: "w-(--sidebar-width-icon)",
      },
      // Width logic for collapsed state with offcanvas
      {
        state: "collapsed",
        collapsible: "offcanvas",
        className: "w-0",
      },
      // Width logic for expanded state
      {
        state: "expanded",
        side: "left",
        className: "w-(--sidebar-left-width)",
      },
      {
        state: "expanded",
        side: "right",
        className: "w-(--sidebar-right-width)",
      },
    ],
    defaultVariants: {
      state: "expanded",
      collapsible: "offcanvas",
      variant: "sidebar",
      side: "left",
    },
  }
);

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  lightBg = false,
  onMobileClose,
  belowHeader = false,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  lightBg?: boolean;
  onMobileClose?: () => void;
  /** When true, positions the sidebar below the header (top-16) instead of full viewport height */
  belowHeader?: boolean;
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar(side);

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "text-sidebar-foreground flex h-full flex-col",
          sideWidthVariants({ side }),
          className
        )}
        style={
          {
            "--sidebar": lightBg ? "var(--color-neutral-300)" : "var(--sidebar)",
          } as React.CSSProperties
        }
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet
        open={openMobile}
        onOpenChange={(open) => {
          setOpenMobile(open);
          if (!open) {
            onMobileClose?.();
          }
        }}
        {...props}
      >
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className={cn(
            "bg-background! text-foreground p-0 [&>button]:hidden",
            sideWidthVariants({ side }),
            // When below header, add top padding to account for header overlay
            belowHeader && "pt-16"
          )}
          style={
            {
              "--sidebar-left-width": SIDEBAR_WIDTH_MOBILE,
              "--sidebar-right-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className={cn(
        sidebarVariants({
          state,
          collapsible,
          variant,
          side,
        }),
        className
      )}
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
      style={
        {
          "--sidebar": lightBg ? "var(--color-neutral-300)" : "var(--sidebar)",
        } as React.CSSProperties
      }
    >
      <div
        data-slot="sidebar-container"
        className={cn(
          sidebarContainerVariants({
            state,
            collapsible,
            variant,
            side,
          }),
          state === "expanded" && sideWidthVariants({ side }),
          // When below header, override inset-y-0 with top-16 and adjust height
          belowHeader && "top-16 h-[calc(100svh-4rem)]",
          className
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function SidebarTrigger({
  className,
  onClick,
  children,
  side = "left",
  ...props
}: React.ComponentProps<typeof Button> & SidebarSideProp) {
  const { toggleSidebar } = useSidebar(side);

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn("size-7", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      {children ?? (side === "left" ? <PanelLeftIcon /> : <PanelRightIcon />)}
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

function SidebarMobileTrigger({
  className,
  side = "left",
  ...props
}: React.ComponentProps<typeof Button> & SidebarSideProp) {
  const { isMobile, openMobile, toggleSidebar } = useSidebar(side);

  if (!isMobile || openMobile) {
    return null;
  }

  return (
    <Button
      data-sidebar="mobile-trigger"
      data-slot="sidebar-mobile-trigger"
      variant="ghost"
      size="icon"
      className={cn(
        "fixed top-2 z-50 size-8 md:hidden",
        side === "left" ? "left-2" : "right-2",
        className
      )}
      onClick={toggleSidebar}
      {...props}
    >
      {side === "left" ?
        <PanelLeftIcon className="size-5" />
      : <PanelRightIcon className="size-5" />}
      <span className="sr-only">Open Sidebar</span>
    </Button>
  );
}

function SidebarRail({
  className,
  side = "left",
  ...props
}: React.ComponentProps<"button"> & SidebarSideProp) {
  const { toggleSidebar } = useSidebar(side);

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "bg-background no-scrollbar scrollbar-gutter-stable relative flex h-svh flex-1 flex-col gap-0 overflow-x-hidden overflow-y-auto",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className
      )}
      {...props}
    />
  );
}

function SidebarInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("bg-background h-8 w-full shadow-none", className)}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("bg-sidebar-border mx-2 w-auto", className)}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "no-scrollbar flex min-h-0 flex-1 flex-col gap-0 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        "text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        className
      )}
      {...props}
    />
  );
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform group-data-[collapsible=icon]:hidden after:absolute after:-inset-2 focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
        className
      )}
      {...props}
    />
  );
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-xs", className)}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-2", className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  );
}

const sidebarMenuButtonVariants = cva(
  "ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-xs outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2! focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:font-medium [&_svg]:size-4 [&_svg]:shrink-0 group-data-[collapsible=icon]:[&>span]:hidden [&>span:last-child]:truncate",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background hover:bg-sidebar-accent hover:text-sidebar-accent-foreground shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-xs",
        sm: "h-7 text-xs",
        lg: "h-12 text-xs group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  side = "left",
  className,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | React.ComponentProps<typeof TooltipContent>;
  side?: SidebarSide;
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot : "button";
  const { isMobile, state } = useSidebar(side);

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  );

  if (!tooltip) {
    return button;
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    };
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side={side === "left" ? "right" : "left"}
        align="center"
        hidden={state !== "collapsed" || isMobile}
        {...tooltip}
      />
    </Tooltip>
  );
}

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  showOnHover?: boolean;
}) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform group-data-[collapsible=icon]:hidden peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 after:absolute after:-inset-2 focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
        showOnHover &&
          "peer-data-active/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-open:opacity-100 md:opacity-0",
        className
      )}
      {...props}
    />
  );
}

function SidebarMenuBadge({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "text-sidebar-foreground peer-hover/menu-button:text-sidebar-accent-foreground peer-data-active/menu-button:text-sidebar-accent-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none group-data-[collapsible=icon]:hidden peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1",
        className
      )}
      {...props}
    />
  );
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean;
}) {
  // Random width between 50 to 90%.
  const [width] = React.useState(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  });

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5 group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  );
}

function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  );
}

function SidebarMenuSubButton({
  asChild = false,
  size = "md",
  isActive = false,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean;
  size?: "sm" | "md";
  isActive?: boolean;
}) {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-hidden group-data-[collapsible=icon]:hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-xs data-[size=sm]:text-xs [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        className
      )}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMobileTrigger,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
