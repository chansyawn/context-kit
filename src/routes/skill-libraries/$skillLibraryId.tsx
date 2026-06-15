import { SkillsManager } from "@/features/skills/skills-manager";
import {
  NoSkillLibrariesState,
  SkillLibraryErrorState,
  SkillLibraryLoadingState,
} from "@/features/skill-libraries/skill-library-route-states";
import { useSkillLibraries } from "@/features/skill-libraries/skill-library-provider";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/skill-libraries/$skillLibraryId")({
  component: SkillLibraryPage,
});

function SkillLibraryPage() {
  const { skillLibraryId } = Route.useParams();
  const { error, getSkillLibrary, isLoading, refreshSkillLibraries, skillLibraries } =
    useSkillLibraries();
  const skillLibrary = getSkillLibrary(skillLibraryId);
  const firstSkillLibrary = skillLibraries[0] ?? null;

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
        replace
      />
    );
  }

  if (!skillLibrary) {
    return <NoSkillLibrariesState />;
  }

  return <SkillsManager key={skillLibrary.id} skillLibrary={skillLibrary} />;
}
