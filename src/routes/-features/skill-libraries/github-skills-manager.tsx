import { authClient } from "@/app/auth-client";
import type { SkillLibrary } from "@/domain/skill-libraries/types";
import { getGithubAppConfig, getSkillPage } from "@/server/skill-libraries/functions";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/ui/components/sheet";
import { useLingui } from "@lingui/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SkillDetail } from "../skills/skill-detail";
import { SkillFilters } from "../skills/skill-filters";
import { createSkillLabels } from "../skills/skill-labels";
import { SkillList } from "../skills/skill-list";
import {
  NoSkillsState,
  SkillsErrorState,
  SkillsLoadingState,
} from "../skills/skills-manager-states";
import { formatSkillLibraryError, getSkillLibraryErrorAction } from "./skill-library-errors";
import { MAX_SKILL_SEARCH_QUERY_LENGTH, normalizeSkillSearchQuery } from "./skill-search";

const COLUMN_LAYOUT_QUERY = "(max-width: 1023px)";
const SEARCH_DEBOUNCE_MS = 500;

type GithubSkillsManagerProps = {
  skillLibrary: SkillLibrary;
  page: number;
  query: string;
  onPageChange: (page: number) => void;
  onSearchChange: (query: string) => void;
};

export function GithubSkillsManager({
  onPageChange,
  onSearchChange,
  page,
  query,
  skillLibrary,
}: GithubSkillsManagerProps) {
  const { i18n } = useLingui();
  const isColumnLayout = useIsColumnLayout();
  const [inputQuery, setInputQuery] = useState(query);
  const [isSkillDetailDrawerOpen, setIsSkillDetailDrawerOpen] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const skillsQuery = useQuery({
    queryKey: ["skill-page", skillLibrary.id, page, query],
    queryFn: () =>
      getSkillPage({ data: { libraryId: skillLibrary.id, page, query: query || undefined } }),
    placeholderData: keepPreviousData,
    retry: false,
  });
  const errorAction = getSkillLibraryErrorAction(skillsQuery.error);
  const appConfigQuery = useQuery({
    queryKey: ["github-app-config"],
    queryFn: () => getGithubAppConfig(),
    enabled: Boolean(skillsQuery.error) && errorAction === "manage-access",
    staleTime: Number.POSITIVE_INFINITY,
  });
  const skillPage = skillsQuery.data;
  const skills = skillPage?.items ?? [];
  const selectedSkill = useMemo(
    () => skills.find((skill) => skill.id === selectedSkillId) ?? skills[0] ?? null,
    [selectedSkillId, skills],
  );
  const pageCount = Math.max(1, Math.ceil((skillPage?.total ?? 0) / 20));
  const labels = createSkillLabels(i18n);

  useEffect(() => {
    setInputQuery(query);
  }, [query]);

  useEffect(() => {
    const normalizedQuery = normalizeSkillSearchQuery(inputQuery);

    if (normalizedQuery === query) {
      return;
    }

    const timeout = window.setTimeout(() => {
      onSearchChange(normalizedQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [inputQuery, onSearchChange, query]);

  useEffect(() => {
    setSelectedSkillId((current) =>
      skills.some((skill) => skill.id === current) ? current : (skills[0]?.id ?? null),
    );
    setIsSkillDetailDrawerOpen(false);
  }, [skills]);

  useEffect(() => {
    if (skillPage && page > pageCount) {
      onPageChange(pageCount);
    }
  }, [onPageChange, page, pageCount, skillPage]);

  useEffect(() => {
    if (!isColumnLayout || !selectedSkill) {
      setIsSkillDetailDrawerOpen(false);
    }
  }, [isColumnLayout, selectedSkill]);

  const handleSelectSkill = useCallback(
    (skillId: string) => {
      setSelectedSkillId(skillId);

      if (isColumnLayout) {
        setIsSkillDetailDrawerOpen(true);
      }
    },
    [isColumnLayout],
  );

  const handleClearQuery = useCallback(() => {
    setInputQuery("");
    onSearchChange("");
  }, [onSearchChange]);

  const handleErrorAction = useCallback(() => {
    if (errorAction === "login") {
      void authClient.signOut().finally(() => window.location.assign("/login"));
      return;
    }

    if (errorAction === "manage-access") {
      const installationUrl = appConfigQuery.data?.installationUrl;

      if (installationUrl) {
        window.location.assign(installationUrl);
      } else {
        void appConfigQuery.refetch();
      }
      return;
    }

    void skillsQuery.refetch();
  }, [appConfigQuery, errorAction, skillsQuery]);

  if (skillsQuery.isPending) {
    return <SkillsLoadingState />;
  }

  if (skillsQuery.error) {
    const retryLabel =
      errorAction === "login"
        ? labels.error.signIn
        : errorAction === "manage-access"
          ? labels.error.manageAccess
          : labels.error.retry;

    return (
      <SkillsErrorState
        error={formatSkillLibraryError(skillsQuery.error, i18n)}
        isPermissionRequired={errorAction !== "retry"}
        retryLabel={retryLabel}
        onRetry={handleErrorAction}
      />
    );
  }

  if (skillPage?.total === 0 && query === "") {
    return <NoSkillsState onRescan={() => void skillsQuery.refetch()} />;
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[12rem_minmax(18rem,25rem)_minmax(0,1fr)] lg:overflow-hidden">
        <SkillFilters count={skillPage?.total ?? 0} labels={labels.filters} />
        <SkillList
          hasQuery={query !== ""}
          incompleteResults={skillPage?.incompleteResults ?? false}
          isScanning={skillsQuery.isFetching}
          labels={labels.list}
          onClearQuery={handleClearQuery}
          onNextPage={() => onPageChange(page + 1)}
          onPreviousPage={() => onPageChange(Math.max(1, page - 1))}
          onQueryChange={setInputQuery}
          onRescan={() => void skillsQuery.refetch()}
          onSelectSkill={handleSelectSkill}
          page={page}
          pageCount={pageCount}
          query={inputQuery}
          queryMaxLength={MAX_SKILL_SEARCH_QUERY_LENGTH}
          rootName={skillLibrary.rootName}
          selectedSkillId={selectedSkill?.id ?? null}
          skills={skills}
        />
        <div className="hidden min-h-0 min-w-0 lg:flex">
          <SkillDetail
            className="min-h-0 min-w-0 flex-1"
            labels={labels.detail}
            skill={selectedSkill}
          />
        </div>
      </div>
      <Sheet
        open={isColumnLayout && Boolean(selectedSkill) && isSkillDetailDrawerOpen}
        onOpenChange={setIsSkillDetailDrawerOpen}
      >
        <SheetContent
          side="bottom"
          closeLabel={labels.close}
          className="h-[92svh] max-h-[92svh] w-full max-w-full gap-0 overflow-hidden rounded-t-xl p-0"
        >
          <SheetHeader className="border-b pe-12 text-start">
            <SheetTitle>{labels.detail.title}</SheetTitle>
            <SheetDescription>
              {selectedSkill?.metadata.name ?? labels.detail.empty}
            </SheetDescription>
          </SheetHeader>
          <SkillDetail
            className="min-h-0 min-w-0 flex-1"
            labels={labels.detail}
            skill={selectedSkill}
            variant="drawer"
          />
        </SheetContent>
      </Sheet>
    </section>
  );
}

function useIsColumnLayout() {
  const [isColumnLayout, setIsColumnLayout] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(COLUMN_LAYOUT_QUERY);
    const handleChange = () => setIsColumnLayout(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isColumnLayout;
}
