import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/ui/components/breadcrumb";
import { useSkillLibraries } from "@/routes/-features/skill-libraries/use-skill-libraries";
import { Separator } from "@/ui/components/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/ui/components/sidebar";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { Outlet, useLocation } from "@tanstack/react-router";

import { AppSidebar } from "./app-sidebar";

export function AppLayout() {
  const { i18n } = useLingui();
  const { getSkillLibrary } = useSkillLibraries();
  const location = useLocation();
  const activeSkillLibraryId = getActiveSkillLibraryId(location.pathname);
  const breadcrumbPage = activeSkillLibraryId ? getSkillLibrary(activeSkillLibraryId)?.name : null;
  const sidebarToggleLabel = i18n._({
    id: "sidebar.toggle",
    message: "Toggle Sidebar",
  });
  const sidebarTitle = i18n._({
    id: "sidebar.mobile.title",
    message: "Sidebar",
  });
  const sidebarDescription = i18n._({
    id: "sidebar.mobile.description",
    message: "Displays the mobile sidebar.",
  });
  const closeLabel = i18n._({
    id: "common.close",
    message: "Close",
  });

  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden">
      <AppSidebar
        labels={{ title: sidebarTitle, description: sidebarDescription, close: closeLabel }}
      />
      <SidebarInset className="min-h-0 overflow-hidden">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 bg-background">
          <div className="flex min-w-0 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" label={sidebarToggleLabel} />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb
              aria-label={i18n._({
                id: "app.breadcrumb.aria",
                message: "Breadcrumb",
              })}
            >
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/skill-libraries">
                    <Trans id="app.breadcrumb.section">Skill Libraries</Trans>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {breadcrumbPage ?? <Trans id="app.breadcrumb.empty">No skill library</Trans>}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-auto p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function getActiveSkillLibraryId(pathname: string): string | null {
  const match = /^\/skill-libraries\/([^/]+)/.exec(pathname);

  return match ? decodeURIComponent(match[1] ?? "") : null;
}
