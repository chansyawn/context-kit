import {
  NoSkillLibrariesState,
  SkillLibraryErrorState,
  SkillLibraryLoadingState,
} from "@/routes/-features/skill-libraries/skill-library-route-states";
import { useSkillLibraries } from "@/routes/-features/skill-libraries/use-skill-libraries";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/skill-libraries/")({
  component: SkillLibrariesIndexPage,
});

function SkillLibrariesIndexPage() {
  const { error, isLoading, refreshSkillLibraries, skillLibraries } = useSkillLibraries();
  const firstSkillLibrary = skillLibraries[0] ?? null;

  if (isLoading) {
    return <SkillLibraryLoadingState />;
  }

  if (error) {
    return <SkillLibraryErrorState error={error} onRetry={() => void refreshSkillLibraries()} />;
  }

  if (firstSkillLibrary) {
    return (
      <Navigate
        to="/skill-libraries/$skillLibraryId"
        params={{ skillLibraryId: firstSkillLibrary.id }}
        search={{ page: 1, query: "" }}
        replace
      />
    );
  }

  return <NoSkillLibrariesState />;
}
