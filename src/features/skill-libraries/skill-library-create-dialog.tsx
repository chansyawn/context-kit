"use client";

import {
  chooseSkillsRootDirectory,
  isFileSystemAccessSupported,
} from "@/features/fs/file-system-access";
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
import { Input } from "@/ui/components/input";
import { SidebarGroupAction } from "@/ui/components/sidebar";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useNavigate } from "@tanstack/react-router";
import { FolderPlusIcon, PlusIcon } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import { useSkillLibraries } from "./skill-library-provider";
import { formatSkillLibraryUiError } from "./skill-library-ui-errors";

type SkillLibraryCreateDialogProps = {
  triggerVariant?: "sidebar" | "empty-state";
};

export function SkillLibraryCreateDialog({
  triggerVariant = "sidebar",
}: SkillLibraryCreateDialogProps) {
  const { i18n } = useLingui();
  const navigate = useNavigate();
  const { createSkillLibrary, skillLibraries } = useSkillLibraries();
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
      skillLibraries.some(
        (skillLibrary) => skillLibrary.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase(),
      ),
    [trimmedName, skillLibraries],
  );
  const addLabel = i18n._({
    id: "skillLibraries.actions.add",
    message: "Add skill library",
  });
  const closeLabel = i18n._({
    id: "common.close",
    message: "Close",
  });
  const displayedError =
    error ??
    (nameConflict
      ? i18n._({
          id: "skillLibraries.error.nameUnique",
          message: "Skill library name must be unique.",
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
      setError(formatSkillLibraryUiError(pickError, i18n));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (trimmedName === "") {
      setError(
        i18n._({
          id: "skillLibraries.error.nameRequired",
          message: "Skill library name is required.",
        }),
      );
      return;
    }

    if (nameConflict) {
      setError(
        i18n._({
          id: "skillLibraries.error.nameUnique",
          message: "Skill library name must be unique.",
        }),
      );
      return;
    }

    if (!directoryHandle) {
      setError(
        i18n._({
          id: "skillLibraries.error.directoryRequired",
          message: "Select a skills directory before saving.",
        }),
      );
      return;
    }

    setIsSaving(true);

    try {
      const skillLibrary = await createSkillLibrary({ name: trimmedName, directoryHandle });

      setOpen(false);
      resetForm();
      await navigate({
        to: "/skill-libraries/$skillLibraryId",
        params: { skillLibraryId: skillLibrary.id },
        replace: true,
      });
    } catch (createError) {
      setError(formatSkillLibraryUiError(createError, i18n));
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
      {triggerVariant === "sidebar" ? (
        <DialogTrigger render={<SidebarGroupAction aria-label={addLabel} title={addLabel} />}>
          <PlusIcon />
          <span className="sr-only">{addLabel}</span>
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button type="button" size="lg" />}>
          <FolderPlusIcon data-icon="inline-start" />
          {addLabel}
        </DialogTrigger>
      )}
      <DialogContent closeLabel={closeLabel}>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              <Trans id="skillLibraries.create.title">Add skill library</Trans>
            </DialogTitle>
            <DialogDescription>
              <Trans id="skillLibraries.create.description">
                Name the skill library and select its local skills root directory.
              </Trans>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">
                <Trans id="skillLibraries.form.name">Skill library name</Trans>
              </span>
              <Input
                value={name}
                aria-invalid={displayedError ? true : undefined}
                onChange={(event) => setName(event.currentTarget.value)}
                placeholder={i18n._({
                  id: "skillLibraries.form.name.placeholder",
                  message: "My skills",
                })}
              />
            </label>
            <div className="grid gap-2 text-sm">
              <span className="font-medium">
                <Trans id="skillLibraries.form.directory">Skills directory</Trans>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handlePickDirectory()}
                  disabled={!isSupported || isSaving}
                >
                  <FolderPlusIcon data-icon="inline-start" />
                  <Trans id="skillLibraries.actions.selectDirectory">Select directory</Trans>
                </Button>
                <span className="min-w-0 truncate text-sm text-muted-foreground">
                  {directoryHandle?.name ??
                    i18n._({
                      id: "skillLibraries.form.directory.none",
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
