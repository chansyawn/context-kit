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
import { AlertTriangleIcon, FolderPlusIcon, RefreshCwIcon } from "lucide-react";

import { SkillLibraryCreateDialog } from "./skill-library-create-dialog";

export function NoSkillLibrariesState() {
  return (
    <Empty className="min-h-0 border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderPlusIcon />
        </EmptyMedia>
        <EmptyTitle>
          <Trans id="skillLibraries.empty.title">No skill libraries yet</Trans>
        </EmptyTitle>
        <EmptyDescription>
          <Trans id="skillLibraries.empty.description">
            Add a skill library to connect a local skills root.
          </Trans>
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <SkillLibraryCreateDialog triggerVariant="empty-state" />
      </EmptyContent>
    </Empty>
  );
}

type SkillLibraryErrorStateProps = {
  error: string;
  onRetry: () => void;
};

export function SkillLibraryErrorState({ error, onRetry }: SkillLibraryErrorStateProps) {
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
          <RefreshCwIcon data-icon="inline-start" />
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
