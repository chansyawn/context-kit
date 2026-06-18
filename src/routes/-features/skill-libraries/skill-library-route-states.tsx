import { Button } from "@/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/ui/components/empty";
import { Skeleton } from "@/ui/components/skeleton";
import { Trans } from "@lingui/react/macro";
import { AlertTriangleIcon, FolderGit2Icon, RefreshCwIcon } from "lucide-react";

import { SkillLibraryCreateDialog } from "./skill-library-create-dialog";

export function NoSkillLibrariesState() {
  return (
    <Empty className="min-h-0 border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderGit2Icon />
        </EmptyMedia>
        <EmptyTitle>
          <Trans id="skillLibraries.empty.title">No skill libraries yet</Trans>
        </EmptyTitle>
        <EmptyDescription>
          <Trans id="skillLibraries.empty.githubDescription">
            Add a repository directory from your GitHub App installations.
          </Trans>
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <SkillLibraryCreateDialog triggerVariant="empty-state" />
      </EmptyContent>
    </Empty>
  );
}

export function SkillLibraryErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <Empty role="alert" className="min-h-0 border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
          <AlertTriangleIcon />
        </EmptyMedia>
        <EmptyTitle>
          <Trans id="skillLibraries.error.loadTitle">Unable to load skill libraries</Trans>
        </EmptyTitle>
        <EmptyDescription>{error}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button type="button" onClick={onRetry}>
          <RefreshCwIcon />
          <Trans id="common.tryAgain">Try again</Trans>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export function SkillLibraryLoadingState() {
  return (
    <section className="grid min-h-0 flex-1 place-items-center">
      <div className="w-full max-w-md space-y-3 text-center">
        <p className="text-sm text-muted-foreground">
          <Trans id="skillLibraries.loading">Loading skill libraries...</Trans>
        </p>
        <Skeleton className="mx-auto h-2 w-48" />
      </div>
    </section>
  );
}
