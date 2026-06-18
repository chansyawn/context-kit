import { GithubSkillsManager } from "@/routes/-features/skill-libraries/github-skills-manager";
import { normalizeSkillSearchQuery } from "@/routes/-features/skill-libraries/skill-search";
import {
  NoSkillLibrariesState,
  SkillLibraryErrorState,
  SkillLibraryLoadingState,
} from "@/routes/-features/skill-libraries/skill-library-route-states";
import { useSkillLibraries } from "@/routes/-features/skill-libraries/use-skill-libraries";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCallback } from "react";

export const Route = createFileRoute("/skill-libraries/$skillLibraryId")({
  validateSearch: (search: Record<string, unknown>) => ({
    page:
      typeof search.page === "number" && Number.isSafeInteger(search.page) && search.page > 0
        ? search.page
        : 1,
    query: typeof search.query === "string" ? normalizeSkillSearchQuery(search.query) : "",
  }),
  component: SkillLibraryPage,
});

function SkillLibraryPage() {
  const { skillLibraryId } = Route.useParams();
  const { page, query } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { error, getSkillLibrary, isLoading, refreshSkillLibraries, skillLibraries } =
    useSkillLibraries();
  const skillLibrary = getSkillLibrary(skillLibraryId);
  const firstSkillLibrary = skillLibraries[0] ?? null;
  const handlePageChange = useCallback(
    (nextPage: number) => {
      void navigate({ search: (current) => ({ ...current, page: nextPage }), replace: true });
    },
    [navigate],
  );
  const handleSearchChange = useCallback(
    (nextQuery: string) => {
      void navigate({
        search: (current) => ({ ...current, page: 1, query: nextQuery }),
        replace: true,
      });
    },
    [navigate],
  );

  if (isLoading) {
    return <SkillLibraryLoadingState />;
  }

  if (error) {
    return <SkillLibraryErrorState error={error} onRetry={() => void refreshSkillLibraries()} />;
  }

  if (!skillLibrary && firstSkillLibrary) {
    return (
      <Navigate
        to="/skill-libraries/$skillLibraryId"
        params={{ skillLibraryId: firstSkillLibrary.id }}
        search={{ page: 1, query: "" }}
        replace
      />
    );
  }

  if (!skillLibrary) {
    return <NoSkillLibrariesState />;
  }

  return (
    <GithubSkillsManager
      key={skillLibrary.id}
      skillLibrary={skillLibrary}
      page={page}
      query={query}
      onPageChange={handlePageChange}
      onSearchChange={handleSearchChange}
    />
  );
}
