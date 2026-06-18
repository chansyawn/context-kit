import type { SkillPreview } from "@/domain/skill-libraries/types";
import { Button } from "@/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/ui/components/empty";
import { Input } from "@/ui/components/input";
import { cn } from "@/ui/lib/utils";
import {
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshCwIcon,
  SearchIcon,
  SearchXIcon,
} from "lucide-react";

type SkillListProps = {
  isScanning: boolean;
  query: string;
  queryMaxLength: number;
  rootName: string;
  selectedSkillId: string | null;
  skills: SkillPreview[];
  hasQuery: boolean;
  incompleteResults: boolean;
  page: number;
  pageCount: number;
  labels: {
    title: string;
    rootDirectory: string;
    search: string;
    rescan: string;
    invalidMetadata: string;
    empty: string;
    noMatches: string;
    noMatchesDescription: string;
    clearSearch: string;
    previous: string;
    next: string;
    incomplete: string;
  };
  onClearQuery: () => void;
  onQueryChange: (query: string) => void;
  onRescan: () => void;
  onSelectSkill: (skillId: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

export function SkillList({
  hasQuery,
  incompleteResults,
  isScanning,
  labels,
  onClearQuery,
  onQueryChange,
  onRescan,
  onSelectSkill,
  onNextPage,
  onPreviousPage,
  page,
  pageCount,
  query,
  queryMaxLength,
  rootName,
  selectedSkillId,
  skills,
}: SkillListProps) {
  return (
    <section className="flex min-h-0 flex-col rounded-lg border bg-card">
      <div className="space-y-3 border-b p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">{labels.title}</h2>
            <p className="truncate text-xs text-muted-foreground">
              {labels.rootDirectory}: {rootName}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRescan}
            disabled={isScanning}
          >
            <RefreshCwIcon
              data-icon="inline-start"
              className={cn(isScanning ? "animate-spin" : undefined)}
            />
            {labels.rescan}
          </Button>
        </div>
        <label className="relative block">
          <span className="sr-only">{labels.search}</span>
          <SearchIcon className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            maxLength={queryMaxLength}
            placeholder={labels.search}
            className="ps-8"
            onChange={(event) => onQueryChange(event.currentTarget.value)}
          />
        </label>
      </div>
      {incompleteResults ? (
        <p className="flex items-center gap-2 border-b px-3 py-2 text-xs text-muted-foreground">
          <AlertTriangleIcon className="size-3.5" />
          {labels.incomplete}
        </p>
      ) : null}
      {skills.length === 0 ? (
        <Empty className="min-h-48 rounded-none border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>{hasQuery ? labels.noMatches : labels.empty}</EmptyTitle>
            {hasQuery ? <EmptyDescription>{labels.noMatchesDescription}</EmptyDescription> : null}
          </EmptyHeader>
          {hasQuery ? (
            <EmptyContent>
              <Button type="button" variant="outline" size="sm" onClick={onClearQuery}>
                {labels.clearSearch}
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto p-2">
          <div className="space-y-1">
            {skills.map((skill) => (
              <button
                key={skill.id}
                type="button"
                className={cn(
                  "w-full rounded-lg border border-transparent px-3 py-2 text-start text-sm transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  skill.id === selectedSkillId ? "border-border bg-muted" : undefined,
                )}
                onClick={() => onSelectSkill(skill.id)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-medium">{skill.metadata.name}</span>
                  {!skill.metadata.valid ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">
                      <AlertTriangleIcon className="size-3" />
                      {labels.invalidMetadata}
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">
                  {skill.metadata.description || skill.skillFilePath}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex h-10 shrink-0 items-center justify-between border-t px-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={labels.previous}
          disabled={page <= 1}
          onClick={onPreviousPage}
        >
          <ChevronLeftIcon />
        </Button>
        <span className="text-xs tabular-nums text-muted-foreground">
          {page} / {pageCount}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={labels.next}
          disabled={page >= pageCount}
          onClick={onNextPage}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </section>
  );
}
