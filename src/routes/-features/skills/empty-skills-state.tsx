import { Button } from "@/ui/components/button";
import { AlertTriangleIcon, FolderOpenIcon } from "lucide-react";

type EmptySkillsStateProps = {
  error: string | null;
  isDirectoryPickerSupported: boolean;
  isScanning: boolean;
  labels: {
    title: string;
    description: string;
    chooseDirectory: string;
    unsupported: string;
  };
  onChooseDirectory: () => void;
};

export function EmptySkillsState({
  error,
  isDirectoryPickerSupported,
  isScanning,
  labels,
  onChooseDirectory,
}: EmptySkillsStateProps) {
  const visibleError = error ?? (!isDirectoryPickerSupported ? labels.unsupported : null);

  return (
    <section className="grid min-h-[calc(100svh-5rem)] place-items-center rounded-lg border border-dashed bg-card px-4 py-10 text-center">
      <div className="flex max-w-md flex-col items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <FolderOpenIcon className="size-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-normal">{labels.title}</h1>
          <p className="text-sm text-muted-foreground">{labels.description}</p>
        </div>
        {visibleError ? (
          <p className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertTriangleIcon className="size-4" />
            <span>{visibleError}</span>
          </p>
        ) : null}
        <Button
          type="button"
          size="lg"
          onClick={onChooseDirectory}
          disabled={!isDirectoryPickerSupported || isScanning}
        >
          <FolderOpenIcon data-icon="inline-start" />
          {labels.chooseDirectory}
        </Button>
      </div>
    </section>
  );
}
