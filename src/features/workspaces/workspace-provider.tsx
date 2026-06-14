import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { createIndexedDbWorkspaceRepository, type WorkspaceRepository } from "./workspace-store";
import type { WorkspaceCreateInput, WorkspaceRecord } from "./workspace-types";

type WorkspaceContextValue = {
  workspaces: WorkspaceRecord[];
  isLoading: boolean;
  error: string | null;
  createWorkspace: (input: WorkspaceCreateInput) => Promise<WorkspaceRecord>;
  renameWorkspace: (id: string, name: string) => Promise<WorkspaceRecord>;
  deleteWorkspace: (id: string) => Promise<void>;
  getWorkspace: (id: string) => WorkspaceRecord | null;
  refreshWorkspaces: () => Promise<void>;
};

type WorkspaceProviderProps = {
  children: ReactNode;
  repository?: WorkspaceRepository;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children, repository }: WorkspaceProviderProps) {
  const repositoryRef = useRef(repository ?? createIndexedDbWorkspaceRepository());
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshWorkspaces = useCallback(async () => {
    setError(null);

    try {
      setWorkspaces(await repositoryRef.current.list());
    } catch (loadError) {
      setError(formatWorkspaceError(loadError));
      setWorkspaces([]);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspaces() {
      setIsLoading(true);

      try {
        const nextWorkspaces = await repositoryRef.current.list();

        if (isMounted) {
          setWorkspaces(nextWorkspaces);
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setWorkspaces([]);
          setError(formatWorkspaceError(loadError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadWorkspaces();

    return () => {
      isMounted = false;
    };
  }, []);

  const createWorkspace = useCallback(async (input: WorkspaceCreateInput) => {
    const workspace = await repositoryRef.current.create(input);

    setWorkspaces(await repositoryRef.current.list());
    setError(null);

    return workspace;
  }, []);

  const renameWorkspace = useCallback(async (id: string, name: string) => {
    const workspace = await repositoryRef.current.update(id, { name });

    setWorkspaces(await repositoryRef.current.list());
    setError(null);

    return workspace;
  }, []);

  const deleteWorkspace = useCallback(async (id: string) => {
    await repositoryRef.current.delete(id);
    setWorkspaces(await repositoryRef.current.list());
    setError(null);
  }, []);

  const getWorkspace = useCallback(
    (id: string) => workspaces.find((workspace) => workspace.id === id) ?? null,
    [workspaces],
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      isLoading,
      error,
      createWorkspace,
      renameWorkspace,
      deleteWorkspace,
      getWorkspace,
      refreshWorkspaces,
    }),
    [
      createWorkspace,
      deleteWorkspace,
      error,
      getWorkspace,
      isLoading,
      refreshWorkspaces,
      renameWorkspace,
      workspaces,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspaces(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspaces must be used within a WorkspaceProvider.");
  }

  return context;
}

function formatWorkspaceError(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return "Unable to load workspaces.";
}
