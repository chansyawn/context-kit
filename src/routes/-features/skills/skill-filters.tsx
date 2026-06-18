import { Button } from "@/ui/components/button";

type SkillFiltersProps = {
  count: number;
  labels: {
    title: string;
    all: string;
  };
};

export function SkillFilters({ count, labels }: SkillFiltersProps) {
  return (
    <aside className="min-h-0 overflow-auto rounded-lg border bg-card p-3">
      <div className="mb-3 px-1 text-xs font-medium text-muted-foreground">{labels.title}</div>
      <Button type="button" variant="secondary" className="w-full justify-between">
        <span>{labels.all}</span>
        <span className="text-xs text-muted-foreground">{count}</span>
      </Button>
    </aside>
  );
}
