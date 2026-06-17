import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/ui/components/sidebar";
import { Trans } from "@lingui/react/macro";
import { Link } from "@tanstack/react-router";
import { TagsIcon } from "lucide-react";

export function ProductSidebarHeader() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" render={<Link to="/" />}>
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <TagsIcon className="size-4" />
          </div>
          <div className="grid flex-1 text-start text-sm leading-tight">
            <span className="truncate font-medium">ContextKit</span>
            <span className="truncate text-xs">
              <Trans id="sidebar.skillLibrary.description">Skill library</Trans>
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
