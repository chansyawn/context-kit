"use client";

import { SidebarSettings } from "@/features/preferences/sidebar-settings";
import { SkillLibrarySidebarGroup } from "@/features/skill-libraries/skill-library-sidebar-group";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/ui/components/sidebar";

import { ProductSidebarHeader } from "./product-sidebar-header";
import { AccountSidebarFooter } from "./account-sidebar-footer";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <ProductSidebarHeader />
      </SidebarHeader>
      <SidebarContent>
        <SkillLibrarySidebarGroup />
      </SidebarContent>
      <SidebarFooter>
        <SidebarSettings />
        <AccountSidebarFooter />
      </SidebarFooter>
    </Sidebar>
  );
}
