import { useWorkspaces } from "@/features/workspaces/workspace-provider";
import { createFileRoute, Navigate } from "@tanstack/react-router";

import { SkillsManager } from "./-features/skills/skills-manager";
import { NoWorkspacesState } from "./-features/workspaces/no-workspaces-state";
import { WorkspaceLoadingState } from "./-features/workspaces/workspace-loading-state";
import { WorkspaceShell } from "./-features/workspaces/workspace-shell";

export const Route = createFileRoute("/workspaces/$workspaceId")({
  component: WorkspacePage,
});

function WorkspacePage() {
  const { workspaceId } = Route.useParams();
  const { error, getWorkspace, isLoading, workspaces } = useWorkspaces();
  const workspace = getWorkspace(workspaceId);
  const firstWorkspace = workspaces[0] ?? null;

  if (isLoading) {
    return (
      <WorkspaceShell>
        <WorkspaceLoadingState />
      </WorkspaceShell>
    );
  }

  if (!workspace && firstWorkspace) {
    return (
      <Navigate to="/workspaces/$workspaceId" params={{ workspaceId: firstWorkspace.id }} replace />
    );
  }

  if (!workspace) {
    return (
      <WorkspaceShell>
        <NoWorkspacesState error={error} />
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell breadcrumbPage={workspace.name}>
      <SkillsManager workspace={workspace} />
    </WorkspaceShell>
  );
}
