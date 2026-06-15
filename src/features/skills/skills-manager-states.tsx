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
import { AlertTriangleIcon, FolderOpenIcon, KeyRoundIcon, RefreshCwIcon } from "lucide-react";

export function SkillsLoadingState() {
  return (
    <section className="grid min-h-0 flex-1 place-items-center">
      <div className="w-full max-w-md space-y-3 text-center">
        <p className="text-sm text-muted-foreground">
          <Trans id="skills.loading">Scanning skills...</Trans>
        </p>
        <Skeleton className="mx-auto h-2 w-48" />
      </div>
    </section>
  );
}

type NoSkillsStateProps = {
  onRescan: () => void;
};

export function NoSkillsState({ onRescan }: NoSkillsStateProps) {
  return (
    <Empty className="min-h-0 border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderOpenIcon />
        </EmptyMedia>
        <EmptyTitle>
          <Trans id="skills.empty.title">No skills found</Trans>
        </EmptyTitle>
        <EmptyDescription>
          <Trans id="skills.empty.description">
            This skill library does not contain any readable SKILL.md files.
          </Trans>
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button type="button" onClick={onRescan}>
          <RefreshCwIcon data-icon="inline-start" />
          <Trans id="skills.actions.rescan">Rescan</Trans>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

type SkillsErrorStateProps = {
  error: string;
  isPermissionRequired: boolean;
  retryLabel: string;
  onRetry: () => void;
};

export function SkillsErrorState({
  error,
  isPermissionRequired,
  onRetry,
  retryLabel,
}: SkillsErrorStateProps) {
  const RetryIcon = isPermissionRequired ? KeyRoundIcon : RefreshCwIcon;

  return (
    <Empty role="alert" className="min-h-0 border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
          <AlertTriangleIcon />
        </EmptyMedia>
        <EmptyTitle>
          <Trans id="skills.error.title">Unable to load skills</Trans>
        </EmptyTitle>
        <EmptyDescription>{error}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button type="button" onClick={onRetry}>
          <RetryIcon data-icon="inline-start" />
          {retryLabel}
        </Button>
      </EmptyContent>
    </Empty>
  );
}
