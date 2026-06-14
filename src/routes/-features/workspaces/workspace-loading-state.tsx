import { Skeleton } from "@/ui/components/skeleton";
import { Trans } from "@lingui/react/macro";

export function WorkspaceLoadingState() {
  return (
    <section className="grid min-h-[calc(100svh-5rem)] place-items-center">
      <div className="w-full max-w-md space-y-3 text-center">
        <p className="text-sm text-muted-foreground">
          <Trans id="workspaces.loading">Loading workspaces...</Trans>
        </p>
        <Skeleton className="mx-auto h-2 w-48" />
      </div>
    </section>
  );
}
