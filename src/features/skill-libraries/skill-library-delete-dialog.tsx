"use client";

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
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useSkillLibraries } from "./skill-library-provider";
import type { SkillLibraryRecord } from "./skill-library-types";
import { formatSkillLibraryUiError } from "./skill-library-ui-errors";

type SkillLibraryDeleteDialogProps = {
  skillLibrary: SkillLibraryRecord | null;
  onOpenChange: (open: boolean) => void;
};

export function SkillLibraryDeleteDialog({
  onOpenChange,
  skillLibrary,
}: SkillLibraryDeleteDialogProps) {
  const { i18n } = useLingui();
  const location = useLocation();
  const navigate = useNavigate();
  const { deleteSkillLibrary, skillLibraries } = useSkillLibraries();
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const activeSkillLibraryId = getActiveSkillLibraryId(location.pathname);
  const closeLabel = i18n._({
    id: "common.close",
    message: "Close",
  });

  useEffect(() => {
    setError(null);
    setIsDeleting(false);
  }, [skillLibrary]);

  async function handleDelete() {
    if (!skillLibrary) {
      return;
    }

    const nextSkillLibrary = skillLibraries.find(
      (existingSkillLibrary) => existingSkillLibrary.id !== skillLibrary.id,
    );

    setIsDeleting(true);
    setError(null);

    try {
      await deleteSkillLibrary(skillLibrary.id);
      onOpenChange(false);

      if (activeSkillLibraryId === skillLibrary.id) {
        if (nextSkillLibrary) {
          await navigate({
            to: "/skill-libraries/$skillLibraryId",
            params: { skillLibraryId: nextSkillLibrary.id },
            replace: true,
          });
        } else {
          await navigate({ to: "/skill-libraries", replace: true });
        }
      }
    } catch (deleteError) {
      setError(formatSkillLibraryUiError(deleteError, i18n));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={Boolean(skillLibrary)} onOpenChange={onOpenChange}>
      <AlertDialogContent closeLabel={closeLabel}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <Trans id="skillLibraries.delete.title">Delete skill library?</Trans>
          </AlertDialogTitle>
          <AlertDialogDescription>
            <Trans id="skillLibraries.delete.description">
              This removes the skill library record from ContextKit. Local files are not deleted.
            </Trans>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {skillLibrary ? (
          <p className="rounded-lg border bg-muted/40 p-3 text-sm">
            <span className="font-medium">{skillLibrary.name}</span>
            <span className="ms-2 text-muted-foreground">{skillLibrary.rootName}</span>
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
            <Trans id="skillLibraries.actions.delete">Delete</Trans>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function getActiveSkillLibraryId(pathname: string): string | null {
  const match = /^\/skill-libraries\/([^/]+)/.exec(pathname);

  return match ? decodeURIComponent(match[1] ?? "") : null;
}
