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

import {
  createIndexedDbSkillLibraryRepository,
  type SkillLibraryRepository,
} from "./skill-library-store";
import type { SkillLibraryCreateInput, SkillLibraryRecord } from "./skill-library-types";

type SkillLibraryContextValue = {
  skillLibraries: SkillLibraryRecord[];
  isLoading: boolean;
  error: string | null;
  createSkillLibrary: (input: SkillLibraryCreateInput) => Promise<SkillLibraryRecord>;
  renameSkillLibrary: (id: string, name: string) => Promise<SkillLibraryRecord>;
  deleteSkillLibrary: (id: string) => Promise<void>;
  getSkillLibrary: (id: string) => SkillLibraryRecord | null;
  refreshSkillLibraries: () => Promise<void>;
};

type SkillLibraryProviderProps = {
  children: ReactNode;
  repository?: SkillLibraryRepository;
};

const SkillLibraryContext = createContext<SkillLibraryContextValue | null>(null);

export function SkillLibraryProvider({ children, repository }: SkillLibraryProviderProps) {
  const repositoryRef = useRef(repository ?? createIndexedDbSkillLibraryRepository());
  const [skillLibraries, setSkillLibraries] = useState<SkillLibraryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSkillLibraries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setSkillLibraries(await repositoryRef.current.list());
    } catch (loadError) {
      setError(formatSkillLibraryError(loadError));
      setSkillLibraries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadSkillLibraries() {
      setIsLoading(true);

      try {
        const nextSkillLibraries = await repositoryRef.current.list();

        if (isMounted) {
          setSkillLibraries(nextSkillLibraries);
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setSkillLibraries([]);
          setError(formatSkillLibraryError(loadError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSkillLibraries();

    return () => {
      isMounted = false;
    };
  }, []);

  const createSkillLibrary = useCallback(async (input: SkillLibraryCreateInput) => {
    const skillLibrary = await repositoryRef.current.create(input);

    setSkillLibraries(await repositoryRef.current.list());
    setError(null);

    return skillLibrary;
  }, []);

  const renameSkillLibrary = useCallback(async (id: string, name: string) => {
    const skillLibrary = await repositoryRef.current.update(id, { name });

    setSkillLibraries(await repositoryRef.current.list());
    setError(null);

    return skillLibrary;
  }, []);

  const deleteSkillLibrary = useCallback(async (id: string) => {
    await repositoryRef.current.delete(id);
    setSkillLibraries(await repositoryRef.current.list());
    setError(null);
  }, []);

  const getSkillLibrary = useCallback(
    (id: string) => skillLibraries.find((skillLibrary) => skillLibrary.id === id) ?? null,
    [skillLibraries],
  );

  const value = useMemo<SkillLibraryContextValue>(
    () => ({
      skillLibraries,
      isLoading,
      error,
      createSkillLibrary,
      renameSkillLibrary,
      deleteSkillLibrary,
      getSkillLibrary,
      refreshSkillLibraries,
    }),
    [
      createSkillLibrary,
      deleteSkillLibrary,
      error,
      getSkillLibrary,
      isLoading,
      refreshSkillLibraries,
      renameSkillLibrary,
      skillLibraries,
    ],
  );

  return <SkillLibraryContext.Provider value={value}>{children}</SkillLibraryContext.Provider>;
}

export function useSkillLibraries(): SkillLibraryContextValue {
  const context = useContext(SkillLibraryContext);

  if (!context) {
    throw new Error("useSkillLibraries must be used within a SkillLibraryProvider.");
  }

  return context;
}

function formatSkillLibraryError(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return "Unable to load skill libraries.";
}
