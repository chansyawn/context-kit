import { Trans } from "@lingui/react/macro";
import { FolderPlusIcon } from "lucide-react";

type NoWorkspacesStateProps = {
  error?: string | null;
};

export function NoWorkspacesState({ error }: NoWorkspacesStateProps) {
  return (
    <section className="grid min-h-[calc(100svh-5rem)] place-items-center">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
          <FolderPlusIcon className="size-6" />
        </div>
        <h1 className="text-xl font-semibold tracking-normal">
          <Trans id="workspaces.empty.title">No workspaces yet</Trans>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <Trans id="workspaces.empty.description">
            Add a workspace from the sidebar to connect a local skills root.
          </Trans>
        </p>
        {error ? (
          <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
