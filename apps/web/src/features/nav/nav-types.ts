export type NavSubMenuItem = {
  title: string;
  url: string;
};

export type NavMainItem = {
  title: string;
  url: string;
  icon: React.ComponentType;
  hasDropdown?: boolean;
  submenu?: NavSubMenuItem[];
};

export type NavFooterItem = Omit<NavMainItem, "hasDropdown" | "submenu">;

export type NavigationItems = {
  items: NavMainItem[];
  footerItems: NavFooterItem[];
};
