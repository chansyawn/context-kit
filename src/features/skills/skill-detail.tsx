import type { LocalSkill } from "@/features/skills/skill-types";
import { cn } from "@/ui/lib/utils";
import { AlertTriangleIcon, FileTextIcon } from "lucide-react";

type SkillDetailProps = {
  skill: LocalSkill | null;
  labels: {
    title: string;
    empty: string;
    description: string;
    path: string;
    sourcePreview: string;
    invalidMetadata: string;
    diagnostics: string;
    noDescription: string;
    unreadableSource: string;
  };
};

export function SkillDetail({ labels, skill }: SkillDetailProps) {
  if (!skill) {
    return (
      <section className="grid min-h-64 place-items-center rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
        {labels.empty}
      </section>
    );
  }

  return (
    <section className="flex min-h-0 flex-col rounded-lg border bg-card">
      <div className="space-y-4 border-b p-4">
        <div className="flex items-start gap-3">
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
            <p className="mt-2 text-sm text-muted-foreground">
              {skill.metadata.description || labels.noDescription}
            </p>
          </div>
        </div>
        <dl className="grid gap-3 text-sm md:grid-cols-[8rem_minmax(0,1fr)]">
          <dt className="text-muted-foreground">{labels.description}</dt>
          <dd className="break-words">{skill.metadata.description || labels.noDescription}</dd>
          <dt className="text-muted-foreground">{labels.path}</dt>
          <dd className="break-all font-mono text-xs">{skill.skillFilePath}</dd>
        </dl>
        {skill.metadata.diagnostics.length > 0 ? (
          <div className="rounded-lg border bg-muted/40 p-3">
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
                  <span>{diagnostic.message}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="mb-2 text-xs font-medium text-muted-foreground">{labels.sourcePreview}</div>
        <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed">
          <code>{skill.source || labels.unreadableSource}</code>
        </pre>
      </div>
    </section>
  );
}
