import {
  NoSkillLibrariesState,
  SkillLibraryLoadingState,
} from "@/features/skill-libraries/skill-library-route-states";
import { useSkillLibraries } from "@/features/skill-libraries/skill-library-provider";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/skill-libraries/")({
  component: SkillLibrariesIndexPage,
});

function SkillLibrariesIndexPage() {
  const { error, isLoading, skillLibraries } = useSkillLibraries();
  const firstSkillLibrary = skillLibraries[0] ?? null;

  if (isLoading) {
    return <SkillLibraryLoadingState />;
  }

  if (firstSkillLibrary) {
    return (
      <Navigate
        to="/skill-libraries/$skillLibraryId"
        params={{ skillLibraryId: firstSkillLibrary.id }}
        replace
      />
    );
  }

  return <NoSkillLibrariesState error={error} />;
}
