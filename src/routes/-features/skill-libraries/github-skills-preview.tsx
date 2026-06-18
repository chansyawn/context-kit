import type { SkillLibrary } from "@/domain/skill-libraries/types";
import { SkillDetail } from "@/features/skills/skill-detail";
import { SkillFilters } from "@/features/skills/skill-filters";
import { SkillList } from "@/features/skills/skill-list";
import {
  NoSkillsState,
  SkillsErrorState,
  SkillsLoadingState,
} from "@/features/skills/skills-manager-states";
import { getSkillPage } from "@/server/skill-libraries/functions";
import { useLingui } from "@lingui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

export function GithubSkillsPreview({ skillLibrary }: { skillLibrary: SkillLibrary }) {
  const { i18n } = useLingui();
  const [query, setQuery] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const skillsQuery = useQuery({
    queryKey: ["skill-page", skillLibrary.id, 1, ""],
    queryFn: () => getSkillPage({ data: { libraryId: skillLibrary.id, page: 1 } }),
  });
  const skills = skillsQuery.data?.items ?? [];
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleSkills = useMemo(
    () =>
      normalizedQuery === ""
        ? skills
        : skills.filter(
            (skill) =>
              skill.metadata.name.toLocaleLowerCase().includes(normalizedQuery) ||
              skill.metadata.description.toLocaleLowerCase().includes(normalizedQuery),
          ),
    [normalizedQuery, skills],
  );
  const selectedSkill =
    visibleSkills.find((skill) => skill.id === selectedSkillId) ?? visibleSkills[0] ?? null;

  useEffect(() => {
    setSelectedSkillId((current) =>
      visibleSkills.some((skill) => skill.id === current)
        ? current
        : (visibleSkills[0]?.id ?? null),
    );
  }, [visibleSkills]);

  const labels = createLabels(i18n);

  if (skillsQuery.isPending) {
    return <SkillsLoadingState />;
  }

  if (skillsQuery.error) {
    return (
      <SkillsErrorState
        error={skillsQuery.error.message}
        isPermissionRequired={false}
        retryLabel={labels.list.rescan}
        onRetry={() => void skillsQuery.refetch()}
      />
    );
  }

  if (skills.length === 0) {
    return <NoSkillsState onRescan={() => void skillsQuery.refetch()} />;
  }

  return (
    <section className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[12rem_minmax(18rem,25rem)_minmax(0,1fr)] lg:overflow-hidden">
      <SkillFilters count={skillsQuery.data?.total ?? skills.length} labels={labels.filters} />
      <SkillList
        isScanning={skillsQuery.isFetching}
        labels={labels.list}
        onClearQuery={() => setQuery("")}
        onQueryChange={setQuery}
        onRescan={() => void skillsQuery.refetch()}
        onSelectSkill={setSelectedSkillId}
        query={query}
        rootName={skillLibrary.rootName}
        selectedSkillId={selectedSkill?.id ?? null}
        skills={visibleSkills}
        totalCount={skills.length}
      />
      <div className="hidden min-h-0 min-w-0 lg:flex">
        <SkillDetail
          className="min-h-0 min-w-0 flex-1"
          labels={labels.detail}
          skill={selectedSkill}
        />
      </div>
    </section>
  );
}

function createLabels(i18n: ReturnType<typeof useLingui>["i18n"]) {
  return {
    filters: {
      title: i18n._({ id: "skills.filters.title", message: "Filters" }),
      all: i18n._({ id: "skills.filters.all", message: "All" }),
    },
    list: {
      title: i18n._({ id: "skills.list.title", message: "Skills" }),
      rootDirectory: i18n._({ id: "skills.list.rootDirectory", message: "Root" }),
      search: i18n._({ id: "skills.search.placeholder", message: "Search skills" }),
      rescan: i18n._({ id: "skills.actions.rescan", message: "Rescan" }),
      invalidMetadata: i18n._({ id: "skills.invalidMetadata", message: "Invalid metadata" }),
      empty: i18n._({
        id: "skills.list.empty",
        message: "No skills were found in this directory.",
      }),
      noMatches: i18n._({ id: "skills.list.noMatches", message: "No skills match your search." }),
      noMatchesDescription: i18n._({
        id: "skills.list.noMatches.description",
        message: "Try another search or clear the current query.",
      }),
      clearSearch: i18n._({ id: "skills.actions.clearSearch", message: "Clear search" }),
    },
    detail: {
      title: i18n._({ id: "skills.detail.title", message: "Skill detail" }),
      empty: i18n._({
        id: "skills.detail.empty",
        message: "Select a skill to view its metadata and SKILL.md source.",
      }),
      emptyTitle: i18n._({ id: "skills.detail.emptyTitle", message: "No skill selected" }),
      description: i18n._({ id: "skills.detail.description", message: "Description" }),
      path: i18n._({ id: "skills.detail.githubPath", message: "GitHub path" }),
      sourcePreview: i18n._({ id: "skills.detail.sourcePreview", message: "SKILL.md preview" }),
      invalidMetadata: i18n._({ id: "skills.invalidMetadata", message: "Invalid metadata" }),
      diagnostics: i18n._({ id: "skills.detail.diagnostics", message: "Diagnostics" }),
      noDescription: i18n._({
        id: "skills.detail.noDescription",
        message: "No description available.",
      }),
      unreadableSource: i18n._({
        id: "skills.detail.unreadableSource",
        message: "SKILL.md could not be read.",
      }),
    },
  };
}
