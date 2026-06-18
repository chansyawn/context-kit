import type { CreateSkillLibraryInput, SkillLibrary } from "@/domain/skill-libraries/types";
import {
  createLibrary,
  deleteLibrary,
  listLibraries,
  renameLibrary,
} from "@/server/skill-libraries/functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export const skillLibraryKeys = {
  all: ["skill-libraries"] as const,
};

export function useSkillLibraries() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: skillLibraryKeys.all,
    queryFn: () => listLibraries(),
  });
  const createMutation = useMutation({
    mutationFn: (input: CreateSkillLibraryInput) => createLibrary({ data: input }),
    onSuccess: (skillLibrary) => {
      queryClient.setQueryData<SkillLibrary[]>(skillLibraryKeys.all, (current = []) => [
        ...current,
        skillLibrary,
      ]);
    },
  });
  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      renameLibrary({ data: { libraryId: id, name } }),
    onSuccess: (skillLibrary) => {
      queryClient.setQueryData<SkillLibrary[]>(skillLibraryKeys.all, (current = []) =>
        current.map((item) => (item.id === skillLibrary.id ? skillLibrary : item)),
      );
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLibrary({ data: { libraryId: id } }),
    onSuccess: (_, id) => {
      queryClient.setQueryData<SkillLibrary[]>(skillLibraryKeys.all, (current = []) =>
        current.filter((item) => item.id !== id),
      );
    },
  });
  const skillLibraries = query.data ?? [];
  const getSkillLibrary = useCallback(
    (id: string) => skillLibraries.find((skillLibrary) => skillLibrary.id === id) ?? null,
    [skillLibraries],
  );

  return {
    skillLibraries,
    isLoading: query.isPending,
    error: query.error ? formatError(query.error) : null,
    createSkillLibrary: createMutation.mutateAsync,
    renameSkillLibrary: (id: string, name: string) => renameMutation.mutateAsync({ id, name }),
    deleteSkillLibrary: deleteMutation.mutateAsync,
    getSkillLibrary,
    refreshSkillLibraries: async () => {
      await query.refetch();
    },
  };
}

export function formatError(error: unknown): string {
  return error instanceof Error && error.message.trim() !== ""
    ? error.message
    : "Unable to load skill libraries.";
}
