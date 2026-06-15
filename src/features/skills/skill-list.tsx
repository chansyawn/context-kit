import type { LocalSkill } from "@/features/skills/skill-types";
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
import { AlertTriangleIcon, RefreshCwIcon, SearchIcon, SearchXIcon } from "lucide-react";

type SkillListProps = {
  isScanning: boolean;
  query: string;
  rootName: string;
  selectedSkillId: string | null;
  skills: LocalSkill[];
  totalCount: number;
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
  };
  onClearQuery: () => void;
  onQueryChange: (query: string) => void;
  onRescan: () => void;
  onSelectSkill: (skillId: string) => void;
};

export function SkillList({
  isScanning,
  labels,
  onClearQuery,
  onQueryChange,
  onRescan,
  onSelectSkill,
  query,
  rootName,
  selectedSkillId,
  skills,
  totalCount,
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
            placeholder={labels.search}
            className="ps-8"
            onChange={(event) => onQueryChange(event.currentTarget.value)}
          />
        </label>
      </div>
      {skills.length === 0 ? (
        <Empty className="min-h-48 rounded-none border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>{totalCount === 0 ? labels.empty : labels.noMatches}</EmptyTitle>
            {totalCount > 0 ? (
              <EmptyDescription>{labels.noMatchesDescription}</EmptyDescription>
            ) : null}
          </EmptyHeader>
          {totalCount > 0 ? (
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
    </section>
  );
}
