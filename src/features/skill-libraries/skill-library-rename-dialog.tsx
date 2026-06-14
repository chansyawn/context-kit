"use client";

import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { Input } from "@/ui/components/input";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { useSkillLibraries } from "./skill-library-provider";
import type { SkillLibraryRecord } from "./skill-library-types";
import { formatSkillLibraryUiError } from "./skill-library-ui-errors";

type SkillLibraryRenameDialogProps = {
  skillLibrary: SkillLibraryRecord | null;
  onOpenChange: (open: boolean) => void;
};

export function SkillLibraryRenameDialog({
  onOpenChange,
  skillLibrary,
}: SkillLibraryRenameDialogProps) {
  const { i18n } = useLingui();
  const { renameSkillLibrary, skillLibraries } = useSkillLibraries();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const trimmedName = name.trim();
  const nameConflict = useMemo(
    () =>
      Boolean(skillLibrary) &&
      trimmedName !== "" &&
      skillLibraries.some(
        (existingSkillLibrary) =>
          existingSkillLibrary.id !== skillLibrary?.id &&
          existingSkillLibrary.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase(),
      ),
    [trimmedName, skillLibrary, skillLibraries],
  );
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

  useEffect(() => {
    setName(skillLibrary?.name ?? "");
    setError(null);
    setIsSaving(false);
  }, [skillLibrary]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!skillLibrary) {
      return;
    }

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

    setIsSaving(true);
    setError(null);

    try {
      await renameSkillLibrary(skillLibrary.id, trimmedName);
      onOpenChange(false);
    } catch (renameError) {
      setError(formatSkillLibraryUiError(renameError, i18n));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(skillLibrary)} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={closeLabel}>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              <Trans id="skillLibraries.rename.title">Rename skill library</Trans>
            </DialogTitle>
            <DialogDescription>
              <Trans id="skillLibraries.rename.description">
                This changes only the skill library name in tagskills.
              </Trans>
            </DialogDescription>
          </DialogHeader>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">
              <Trans id="skillLibraries.form.name">Skill library name</Trans>
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
