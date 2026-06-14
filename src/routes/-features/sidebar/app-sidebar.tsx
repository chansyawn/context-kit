"use client";

import { useI18nState } from "@/app/i18n";
import type { LocaleCode, ThemeMode } from "@/app/preferences";
import { THEME_MODE_OPTIONS } from "@/app/preferences";
import { useThemeState } from "@/app/theme";
import {
  chooseSkillsRootDirectory,
  isFileSystemAccessSupported,
} from "@/features/fs/file-system-access";
import { useWorkspaces } from "@/features/workspaces/workspace-provider";
import type { WorkspaceRecord } from "@/features/workspaces/workspace-types";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/components/alert-dialog";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import { Input } from "@/ui/components/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/ui/components/sidebar";
import type { MessageDescriptor } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  FolderIcon,
  FolderPlusIcon,
  LanguagesIcon,
  MoreHorizontalIcon,
  MoonIcon,
  PencilIcon,
  PlusIcon,
  SunIcon,
  TagsIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

function themeModeLabel(themeMode: ThemeMode): MessageDescriptor {
  switch (themeMode) {
    case "dark":
      return msg({ id: "settings.theme.dark", message: "Dark" });
    case "light":
      return msg({ id: "settings.theme.light", message: "Light" });
    case "system":
      return msg({ id: "settings.theme.system", message: "System" });
  }
}

function SidebarSettings() {
  const { i18n } = useLingui();
  const { activeLocale, localeOptions, setLocale } = useI18nState();
  const { resolvedTheme, setThemeMode, themeMode } = useThemeState();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton />}>
            <LanguagesIcon />
            <span>
              <Trans id="settings.language.title">Language</Trans>
            </span>
            <span className="ms-auto text-xs text-muted-foreground">{activeLocale.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <Trans id="settings.language.title">Language</Trans>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={activeLocale.key}
              onValueChange={(value) => {
                setLocale(value as LocaleCode);
              }}
            >
              {localeOptions.map((option) => (
                <DropdownMenuRadioItem key={option.key} value={option.key}>
                  {option.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton />}>
            {resolvedTheme === "dark" ? <MoonIcon /> : <SunIcon />}
            <span>
              <Trans id="settings.theme.title">Theme</Trans>
            </span>
            <span className="ms-auto text-xs text-muted-foreground">
              {i18n._(themeModeLabel(themeMode))}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <Trans id="settings.theme.title">Theme</Trans>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={themeMode}
              onValueChange={(value) => {
                setThemeMode(value as ThemeMode);
              }}
            >
              {THEME_MODE_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option} value={option}>
                  {i18n._(themeModeLabel(option))}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { i18n } = useLingui();
  const { error, isLoading, workspaces } = useWorkspaces();
  const location = useLocation();
  const [workspaceToRename, setWorkspaceToRename] = useState<WorkspaceRecord | null>(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<WorkspaceRecord | null>(null);
  const activeWorkspaceId = getActiveWorkspaceId(location.pathname);
  const menuLabel = i18n._({
    id: "workspaces.menu.label",
    message: "Workspace actions",
  });

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <TagsIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-medium">tagskills</span>
                <span className="truncate text-xs">
                  <Trans id="sidebar.workspace.description">Skill library</Trans>
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <Trans id="workspaces.sidebar.title">Workspaces</Trans>
          </SidebarGroupLabel>
          <CreateWorkspaceDialog />
          <SidebarGroupContent>
            {error ? <p className="px-2 py-1.5 text-xs text-destructive">{error}</p> : null}
            <SidebarMenu>
              {isLoading ? (
                <>
                  <SidebarMenuSkeleton showIcon />
                  <SidebarMenuSkeleton showIcon />
                </>
              ) : null}
              {!isLoading && workspaces.length === 0 ? (
                <li className="px-2 py-1.5 text-xs text-sidebar-foreground/60">
                  <Trans id="workspaces.sidebar.empty">No workspaces</Trans>
                </li>
              ) : null}
              {workspaces.map((workspace) => (
                <SidebarMenuItem key={workspace.id}>
                  <SidebarMenuButton
                    size="lg"
                    tooltip={workspace.name}
                    isActive={activeWorkspaceId === workspace.id}
                    render={
                      <Link to="/workspaces/$workspaceId" params={{ workspaceId: workspace.id }} />
                    }
                  >
                    <FolderIcon />
                    <div className="grid min-w-0 flex-1 text-start leading-tight">
                      <span className="truncate font-medium">{workspace.name}</span>
                      <span className="truncate text-xs text-sidebar-foreground/60">
                        {workspace.rootName}
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
                      <DropdownMenuItem onClick={() => setWorkspaceToRename(workspace)}>
                        <PencilIcon />
                        <span>
                          <Trans id="workspaces.actions.rename">Rename</Trans>
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setWorkspaceToDelete(workspace)}
                      >
                        <Trash2Icon />
                        <span>
                          <Trans id="workspaces.actions.delete">Delete</Trans>
                        </span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSettings />
      </SidebarFooter>
      <RenameWorkspaceDialog
        workspace={workspaceToRename}
        onOpenChange={(open) => {
          if (!open) {
            setWorkspaceToRename(null);
          }
        }}
      />
      <DeleteWorkspaceDialog
        workspace={workspaceToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setWorkspaceToDelete(null);
          }
        }}
      />
    </Sidebar>
  );
}

function CreateWorkspaceDialog() {
  const { i18n } = useLingui();
  const navigate = useNavigate();
  const { createWorkspace, workspaces } = useWorkspaces();
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const isSupported = isFileSystemAccessSupported();
  const trimmedName = name.trim();
  const nameConflict = useMemo(
    () =>
      trimmedName !== "" &&
      workspaces.some(
        (workspace) => workspace.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase(),
      ),
    [trimmedName, workspaces],
  );
  const addLabel = i18n._({
    id: "workspaces.actions.add",
    message: "Add workspace",
  });
  const closeLabel = i18n._({
    id: "common.close",
    message: "Close",
  });
  const displayedError =
    error ??
    (nameConflict
      ? i18n._({
          id: "workspaces.error.nameUnique",
          message: "Workspace name must be unique.",
        })
      : null);

  function resetForm() {
    setDirectoryHandle(null);
    setError(null);
    setIsSaving(false);
    setName("");
  }

  async function handlePickDirectory() {
    setError(null);

    try {
      const nextDirectoryHandle = await chooseSkillsRootDirectory();

      if (!nextDirectoryHandle) {
        return;
      }

      setDirectoryHandle(nextDirectoryHandle);
    } catch (pickError) {
      setError(formatWorkspaceUiError(pickError, i18n));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (trimmedName === "") {
      setError(
        i18n._({
          id: "workspaces.error.nameRequired",
          message: "Workspace name is required.",
        }),
      );
      return;
    }

    if (nameConflict) {
      setError(
        i18n._({
          id: "workspaces.error.nameUnique",
          message: "Workspace name must be unique.",
        }),
      );
      return;
    }

    if (!directoryHandle) {
      setError(
        i18n._({
          id: "workspaces.error.directoryRequired",
          message: "Select a skills directory before saving.",
        }),
      );
      return;
    }

    setIsSaving(true);

    try {
      const workspace = await createWorkspace({ name: trimmedName, directoryHandle });

      setOpen(false);
      resetForm();
      await navigate({
        to: "/workspaces/$workspaceId",
        params: { workspaceId: workspace.id },
        replace: true,
      });
    } catch (createError) {
      setError(formatWorkspaceUiError(createError, i18n));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger render={<SidebarGroupAction aria-label={addLabel} title={addLabel} />}>
        <PlusIcon />
        <span className="sr-only">{addLabel}</span>
      </DialogTrigger>
      <DialogContent closeLabel={closeLabel}>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              <Trans id="workspaces.create.title">Add workspace</Trans>
            </DialogTitle>
            <DialogDescription>
              <Trans id="workspaces.create.description">
                Name the workspace and select its local skills root directory.
              </Trans>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">
                <Trans id="workspaces.form.name">Workspace name</Trans>
              </span>
              <Input
                value={name}
                aria-invalid={displayedError ? true : undefined}
                onChange={(event) => setName(event.currentTarget.value)}
                placeholder={i18n._({
                  id: "workspaces.form.name.placeholder",
                  message: "My skills",
                })}
              />
            </label>
            <div className="grid gap-2 text-sm">
              <span className="font-medium">
                <Trans id="workspaces.form.directory">Skills directory</Trans>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handlePickDirectory()}
                  disabled={!isSupported || isSaving}
                >
                  <FolderPlusIcon data-icon="inline-start" />
                  <Trans id="workspaces.actions.selectDirectory">Select directory</Trans>
                </Button>
                <span className="min-w-0 truncate text-sm text-muted-foreground">
                  {directoryHandle?.name ??
                    i18n._({
                      id: "workspaces.form.directory.none",
                      message: "No folder selected",
                    })}
                </span>
              </div>
              {!isSupported ? (
                <p className="text-sm text-destructive">
                  <Trans id="skills.error.unsupported">
                    This browser does not support selecting local directories.
                  </Trans>
                </p>
              ) : null}
            </div>
            {displayedError ? <p className="text-sm text-destructive">{displayedError}</p> : null}
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              <Trans id="common.cancel">Cancel</Trans>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSaving || trimmedName === "" || !directoryHandle || nameConflict}
            >
              <Trans id="common.save">Save</Trans>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type RenameWorkspaceDialogProps = {
  workspace: WorkspaceRecord | null;
  onOpenChange: (open: boolean) => void;
};

function RenameWorkspaceDialog({ onOpenChange, workspace }: RenameWorkspaceDialogProps) {
  const { i18n } = useLingui();
  const { renameWorkspace, workspaces } = useWorkspaces();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const trimmedName = name.trim();
  const nameConflict = useMemo(
    () =>
      Boolean(workspace) &&
      trimmedName !== "" &&
      workspaces.some(
        (existingWorkspace) =>
          existingWorkspace.id !== workspace?.id &&
          existingWorkspace.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase(),
      ),
    [trimmedName, workspace, workspaces],
  );
  const closeLabel = i18n._({
    id: "common.close",
    message: "Close",
  });
  const displayedError =
    error ??
    (nameConflict
      ? i18n._({
          id: "workspaces.error.nameUnique",
          message: "Workspace name must be unique.",
        })
      : null);

  useEffect(() => {
    setName(workspace?.name ?? "");
    setError(null);
    setIsSaving(false);
  }, [workspace]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!workspace) {
      return;
    }

    if (trimmedName === "") {
      setError(
        i18n._({
          id: "workspaces.error.nameRequired",
          message: "Workspace name is required.",
        }),
      );
      return;
    }

    if (nameConflict) {
      setError(
        i18n._({
          id: "workspaces.error.nameUnique",
          message: "Workspace name must be unique.",
        }),
      );
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await renameWorkspace(workspace.id, trimmedName);
      onOpenChange(false);
    } catch (renameError) {
      setError(formatWorkspaceUiError(renameError, i18n));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(workspace)} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={closeLabel}>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              <Trans id="workspaces.rename.title">Rename workspace</Trans>
            </DialogTitle>
            <DialogDescription>
              <Trans id="workspaces.rename.description">
                This changes only the workspace name in tagskills.
              </Trans>
            </DialogDescription>
          </DialogHeader>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">
              <Trans id="workspaces.form.name">Workspace name</Trans>
            </span>
            <Input
              value={name}
              aria-invalid={displayedError ? true : undefined}
              onChange={(event) => setName(event.currentTarget.value)}
            />
          </label>
          {displayedError ? <p className="text-sm text-destructive">{displayedError}</p> : null}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              <Trans id="common.cancel">Cancel</Trans>
            </DialogClose>
            <Button type="submit" disabled={isSaving || trimmedName === "" || nameConflict}>
              <Trans id="common.save">Save</Trans>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type DeleteWorkspaceDialogProps = {
  workspace: WorkspaceRecord | null;
  onOpenChange: (open: boolean) => void;
};

function DeleteWorkspaceDialog({ onOpenChange, workspace }: DeleteWorkspaceDialogProps) {
  const { i18n } = useLingui();
  const location = useLocation();
  const navigate = useNavigate();
  const { deleteWorkspace, workspaces } = useWorkspaces();
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const activeWorkspaceId = getActiveWorkspaceId(location.pathname);
  const closeLabel = i18n._({
    id: "common.close",
    message: "Close",
  });

  useEffect(() => {
    setError(null);
    setIsDeleting(false);
  }, [workspace]);

  async function handleDelete() {
    if (!workspace) {
      return;
    }

    const nextWorkspace = workspaces.find(
      (existingWorkspace) => existingWorkspace.id !== workspace.id,
    );

    setIsDeleting(true);
    setError(null);

    try {
      await deleteWorkspace(workspace.id);
      onOpenChange(false);

      if (activeWorkspaceId === workspace.id) {
        if (nextWorkspace) {
          await navigate({
            to: "/workspaces/$workspaceId",
            params: { workspaceId: nextWorkspace.id },
            replace: true,
          });
        } else {
          await navigate({ to: "/", replace: true });
        }
      }
    } catch (deleteError) {
      setError(formatWorkspaceUiError(deleteError, i18n));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={Boolean(workspace)} onOpenChange={onOpenChange}>
      <AlertDialogContent closeLabel={closeLabel}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <Trans id="workspaces.delete.title">Delete workspace?</Trans>
          </AlertDialogTitle>
          <AlertDialogDescription>
            <Trans id="workspaces.delete.description">
              This removes the workspace record from tagskills. Local files are not deleted.
            </Trans>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {workspace ? (
          <p className="rounded-lg border bg-muted/40 p-3 text-sm">
            <span className="font-medium">{workspace.name}</span>
            <span className="ms-2 text-muted-foreground">{workspace.rootName}</span>
          </p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel render={<Button type="button" variant="outline" />}>
            <Trans id="common.cancel">Cancel</Trans>
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={() => void handleDelete()}
          >
            <Trans id="workspaces.actions.delete">Delete</Trans>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function getActiveWorkspaceId(pathname: string): string | null {
  const match = /^\/workspaces\/([^/]+)/.exec(pathname);

  return match ? decodeURIComponent(match[1] ?? "") : null;
}

function formatWorkspaceUiError(error: unknown, i18n: ReturnType<typeof useLingui>["i18n"]) {
  if (error instanceof Error) {
    switch (error.message) {
      case "Workspace name is required.":
        return i18n._({
          id: "workspaces.error.nameRequired",
          message: "Workspace name is required.",
        });
      case "Workspace name must be unique.":
        return i18n._({
          id: "workspaces.error.nameUnique",
          message: "Workspace name must be unique.",
        });
      case "This skills directory has already been added.":
        return i18n._({
          id: "workspaces.error.directoryUnique",
          message: "This skills directory has already been added.",
        });
      case "IndexedDB is not available in this browser.":
        return i18n._({
          id: "workspaces.error.indexedDbUnavailable",
          message: "This browser cannot persist workspace records.",
        });
      case "File System Access API is not supported in this browser.":
        return i18n._({
          id: "skills.error.unsupported",
          message: "This browser does not support selecting local directories.",
        });
      case "Workspace was not found.":
        return i18n._({
          id: "workspaces.error.notFound",
          message: "Workspace was not found.",
        });
    }
  }

  return `${i18n._({
    id: "workspaces.error.generic",
    message: "Unable to save workspace.",
  })} ${formatUnknownError(error)}`.trim();
}

function formatUnknownError(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return "";
}
