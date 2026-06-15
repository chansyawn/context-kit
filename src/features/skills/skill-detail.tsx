import type { LocalSkill } from "@/features/skills/skill-types";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/ui/components/empty";
import { cn } from "@/ui/lib/utils";
import { AlertTriangleIcon, FileTextIcon } from "lucide-react";

type SkillDetailProps = {
  skill: LocalSkill | null;
  className?: string;
  variant?: "panel" | "drawer";
  labels: {
    title: string;
    empty: string;
    emptyTitle: string;
    description: string;
    path: string;
    sourcePreview: string;
    invalidMetadata: string;
    diagnostics: string;
    noDescription: string;
    unreadableSource: string;
  };
};

export function SkillDetail({ className, labels, skill, variant = "panel" }: SkillDetailProps) {
  if (!skill) {
    return (
      <Empty
        className={cn(
          "min-h-64 min-w-0 max-w-full",
          variant === "panel" ? "rounded-lg border bg-card" : null,
          className,
        )}
      >
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileTextIcon />
          </EmptyMedia>
          <EmptyTitle>{labels.emptyTitle}</EmptyTitle>
          <EmptyDescription>{labels.empty}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <section
      className={cn(
        "flex min-h-0 min-w-0 max-w-full flex-col overflow-hidden",
        variant === "panel" ? "rounded-lg border bg-card" : null,
        className,
      )}
    >
      <div className="min-w-0 space-y-4 border-b p-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FileTextIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="break-words text-xl font-semibold tracking-normal">
                {skill.metadata.name}
              </h2>
              {!skill.metadata.valid ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive">
                  <AlertTriangleIcon className="size-3" />
                  {labels.invalidMetadata}
                </span>
              ) : null}
            </div>
            <p className="mt-2 break-words text-sm text-muted-foreground">
              {skill.metadata.description || labels.noDescription}
            </p>
          </div>
        </div>
        <dl className="grid min-w-0 gap-3 text-sm md:grid-cols-[8rem_minmax(0,1fr)]">
          <dt className="text-muted-foreground">{labels.description}</dt>
          <dd className="min-w-0 break-words">
            {skill.metadata.description || labels.noDescription}
          </dd>
          <dt className="text-muted-foreground">{labels.path}</dt>
          <dd className="min-w-0 break-all font-mono text-xs">{skill.skillFilePath}</dd>
        </dl>
        {skill.metadata.diagnostics.length > 0 ? (
          <div className="min-w-0 rounded-lg border bg-muted/40 p-3">
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              {labels.diagnostics}
            </div>
            <ul className="space-y-1 text-sm">
              {skill.metadata.diagnostics.map((diagnostic, index) => (
                <li
                  key={`${diagnostic.level}-${index}`}
                  className={cn(
                    "flex items-start gap-2",
                    diagnostic.level === "error" ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
                  <span className="min-w-0 break-words">{diagnostic.message}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-auto p-4">
        <div className="mb-2 text-xs font-medium text-muted-foreground">{labels.sourcePreview}</div>
        <pre className="max-w-full overflow-x-auto rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed">
          <code>{skill.source || labels.unreadableSource}</code>
        </pre>
      </div>
    </section>
  );
}
