"use client";

import type { SkillLibrary } from "@/domain/skill-libraries/types";
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

import { formatError, useSkillLibraries } from "./use-skill-libraries";

type SkillLibraryDeleteDialogProps = {
  skillLibrary: SkillLibrary | null;
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

  useEffect(() => {
    setError(null);
    setIsDeleting(false);
  }, [skillLibrary]);

  async function handleDelete() {
    if (!skillLibrary) {
      return;
    }

    const nextSkillLibrary = skillLibraries.find((item) => item.id !== skillLibrary.id);
    setIsDeleting(true);
    setError(null);

    try {
      await deleteSkillLibrary(skillLibrary.id);
      onOpenChange(false);

      if (activeSkillLibraryId === skillLibrary.id) {
        await navigate(
          nextSkillLibrary
            ? {
                to: "/skill-libraries/$skillLibraryId",
                params: { skillLibraryId: nextSkillLibrary.id },
                replace: true,
              }
            : { to: "/skill-libraries", replace: true },
        );
      }
    } catch (deleteError) {
      setError(formatError(deleteError));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={Boolean(skillLibrary)} onOpenChange={onOpenChange}>
      <AlertDialogContent closeLabel={i18n._({ id: "common.close", message: "Close" })}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <Trans id="skillLibraries.delete.title">Delete skill library?</Trans>
          </AlertDialogTitle>
          <AlertDialogDescription>
            <Trans id="skillLibraries.delete.githubDescription">
              This removes the library from ContextKit. GitHub files are not changed.
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
