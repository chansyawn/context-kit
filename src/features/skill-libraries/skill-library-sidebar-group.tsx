"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/ui/components/sidebar";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { Link, useLocation } from "@tanstack/react-router";
import { FolderIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { SkillLibraryCreateDialog } from "./skill-library-create-dialog";
import { SkillLibraryDeleteDialog } from "./skill-library-delete-dialog";
import { useSkillLibraries } from "./skill-library-provider";
import { SkillLibraryRenameDialog } from "./skill-library-rename-dialog";
import type { SkillLibraryRecord } from "./skill-library-types";

export function SkillLibrarySidebarGroup() {
  const { i18n } = useLingui();
  const { isLoading, skillLibraries } = useSkillLibraries();
  const location = useLocation();
  const [skillLibraryToRename, setSkillLibraryToRename] = useState<SkillLibraryRecord | null>(null);
  const [skillLibraryToDelete, setSkillLibraryToDelete] = useState<SkillLibraryRecord | null>(null);
  const activeSkillLibraryId = getActiveSkillLibraryId(location.pathname);
  const menuLabel = i18n._({
    id: "skillLibraries.menu.label",
    message: "Skill library actions",
  });

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>
          <Trans id="skillLibraries.sidebar.title">Skill Libraries</Trans>
        </SidebarGroupLabel>
        <SkillLibraryCreateDialog />
        <SidebarGroupContent>
          <SidebarMenu>
            {isLoading ? (
              <>
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
              </>
            ) : null}
            {skillLibraries.map((skillLibrary) => (
              <SidebarMenuItem key={skillLibrary.id}>
                <SidebarMenuButton
                  size="lg"
                  tooltip={skillLibrary.name}
                  isActive={activeSkillLibraryId === skillLibrary.id}
                  render={
                    <Link
                      to="/skill-libraries/$skillLibraryId"
                      params={{ skillLibraryId: skillLibrary.id }}
                    />
                  }
                >
                  <FolderIcon />
                  <div className="grid min-w-0 flex-1 text-start leading-tight">
                    <span className="truncate font-medium">{skillLibrary.name}</span>
                    <span className="truncate text-xs text-sidebar-foreground/60">
                      {skillLibrary.rootName}
                    </span>
                  </div>
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <SidebarMenuAction showOnHover aria-label={menuLabel} title={menuLabel} />
                    }
                  >
                    <MoreHorizontalIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" className="w-40">
                    <DropdownMenuItem onClick={() => setSkillLibraryToRename(skillLibrary)}>
                      <PencilIcon />
                      <span>
                        <Trans id="skillLibraries.actions.rename">Rename</Trans>
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setSkillLibraryToDelete(skillLibrary)}
                    >
                      <Trash2Icon />
                      <span>
                        <Trans id="skillLibraries.actions.delete">Delete</Trans>
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SkillLibraryRenameDialog
        skillLibrary={skillLibraryToRename}
        onOpenChange={(open) => {
          if (!open) {
            setSkillLibraryToRename(null);
          }
        }}
      />
      <SkillLibraryDeleteDialog
        skillLibrary={skillLibraryToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setSkillLibraryToDelete(null);
          }
        }}
      />
    </>
  );
}

function getActiveSkillLibraryId(pathname: string): string | null {
  const match = /^\/skill-libraries\/([^/]+)/.exec(pathname);

  return match ? decodeURIComponent(match[1] ?? "") : null;
}
