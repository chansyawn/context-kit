"use client";

import type { SkillLibrary } from "@/domain/skill-libraries/types";
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
import { FolderGit2Icon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { SkillLibraryCreateDialog } from "./skill-library-create-dialog";
import { SkillLibraryDeleteDialog } from "./skill-library-delete-dialog";
import { SkillLibraryRenameDialog } from "./skill-library-rename-dialog";
import { useSkillLibraries } from "./use-skill-libraries";

export function SkillLibrarySidebarGroup() {
  const { i18n } = useLingui();
  const { isLoading, skillLibraries } = useSkillLibraries();
  const location = useLocation();
  const [skillLibraryToRename, setSkillLibraryToRename] = useState<SkillLibrary | null>(null);
  const [skillLibraryToDelete, setSkillLibraryToDelete] = useState<SkillLibrary | null>(null);
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
                  tooltip={skillLibrary.name}
                  isActive={activeSkillLibraryId === skillLibrary.id}
                  render={
                    <Link
                      to="/skill-libraries/$skillLibraryId"
                      params={{ skillLibraryId: skillLibrary.id }}
                      search={{ page: 1, query: "" }}
                    />
                  }
                >
                  <FolderGit2Icon />
                  <span className="truncate font-medium">{skillLibrary.name}</span>
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
                      <Trans id="skillLibraries.actions.rename">Rename</Trans>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setSkillLibraryToDelete(skillLibrary)}
                    >
                      <Trash2Icon />
                      <Trans id="skillLibraries.actions.delete">Delete</Trans>
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
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setSkillLibraryToRename(null);
        }}
      />
      <SkillLibraryDeleteDialog
        skillLibrary={skillLibraryToDelete}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setSkillLibraryToDelete(null);
        }}
      />
    </>
  );
}

function getActiveSkillLibraryId(pathname: string): string | null {
  const match = /^\/skill-libraries\/([^/]+)/.exec(pathname);

  return match ? decodeURIComponent(match[1] ?? "") : null;
}
