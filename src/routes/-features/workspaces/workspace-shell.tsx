import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/ui/components/breadcrumb";
import { Separator } from "@/ui/components/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/ui/components/sidebar";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import type { ReactNode } from "react";

import { AppSidebar } from "../sidebar/app-sidebar";

type WorkspaceShellProps = {
  children: ReactNode;
  breadcrumbPage?: ReactNode;
};

export function WorkspaceShell({ breadcrumbPage, children }: WorkspaceShellProps) {
  const { i18n } = useLingui();
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
    <SidebarProvider>
      <AppSidebar
        labels={{ title: sidebarTitle, description: sidebarDescription, close: closeLabel }}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex min-w-0 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" label={sidebarToggleLabel} />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb
              aria-label={i18n._({
                id: "workspace.breadcrumb.aria",
                message: "Breadcrumb",
              })}
            >
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">
                    <Trans id="workspace.breadcrumb.section">Workspaces</Trans>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {breadcrumbPage ?? <Trans id="workspace.breadcrumb.empty">No workspace</Trans>}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
