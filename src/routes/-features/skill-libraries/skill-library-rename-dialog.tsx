"use client";

import type { SkillLibrary } from "@/domain/skill-libraries/types";
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
import { useEffect, useState, type FormEvent } from "react";

import { formatError, useSkillLibraries } from "./use-skill-libraries";

type SkillLibraryRenameDialogProps = {
  skillLibrary: SkillLibrary | null;
  onOpenChange: (open: boolean) => void;
};

export function SkillLibraryRenameDialog({
  onOpenChange,
  skillLibrary,
}: SkillLibraryRenameDialogProps) {
  const { i18n } = useLingui();
  const { renameSkillLibrary } = useSkillLibraries();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const trimmedName = name.trim();

  useEffect(() => {
    setName(skillLibrary?.name ?? "");
    setError(null);
    setIsSaving(false);
  }, [skillLibrary]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!skillLibrary || trimmedName === "") {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await renameSkillLibrary(skillLibrary.id, trimmedName);
      onOpenChange(false);
    } catch (renameError) {
      setError(formatError(renameError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(skillLibrary)} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={i18n._({ id: "common.close", message: "Close" })}>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              <Trans id="skillLibraries.rename.title">Rename skill library</Trans>
            </DialogTitle>
            <DialogDescription>
              <Trans id="skillLibraries.rename.description">
                This changes only the skill library name in ContextKit.
              </Trans>
            </DialogDescription>
          </DialogHeader>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">
              <Trans id="skillLibraries.form.name">Skill library name</Trans>
            </span>
            <Input value={name} onChange={(event) => setName(event.currentTarget.value)} />
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              <Trans id="common.cancel">Cancel</Trans>
            </DialogClose>
            <Button type="submit" disabled={isSaving || trimmedName === ""}>
              <Trans id="common.save">Save</Trans>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
