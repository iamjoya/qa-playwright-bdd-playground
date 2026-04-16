export const OrangeHrmSidebarLocators = {
  searchInput:  'input[placeholder="Search"]',
  navItemLinks: 'a.oxd-main-menu-item',
  navItem:      (name: string) => ({ role: 'link' as const, name }),
  sidebarBody:  '.oxd-sidepanel-body',
} as const;
