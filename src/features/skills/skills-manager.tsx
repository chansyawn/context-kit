import { scanSkillsRoot } from "@/features/skills/scan-skills";
import type { LocalSkill } from "@/features/skills/skill-types";
import { ensureReadWritePermission } from "@/features/skill-libraries/skill-library-permissions";
import type { SkillLibraryRecord } from "@/features/skill-libraries/skill-library-types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/ui/components/sheet";
import { useLingui } from "@lingui/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SkillDetail } from "./skill-detail";
import { SkillFilters } from "./skill-filters";
import { SkillList } from "./skill-list";
import { NoSkillsState, SkillsErrorState, SkillsLoadingState } from "./skills-manager-states";

type ScanStatus = "idle" | "scanning" | "permission-required";

const COLUMN_LAYOUT_QUERY = "(max-width: 1023px)";

type SkillsManagerProps = {
  skillLibrary: SkillLibraryRecord;
};

export function SkillsManager({ skillLibrary }: SkillsManagerProps) {
  const { i18n } = useLingui();
  const isColumnLayout = useIsColumnLayout();
  const [error, setError] = useState<string | null>(null);
  const [isSkillDetailDrawerOpen, setIsSkillDetailDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [skills, setSkills] = useState<LocalSkill[]>([]);
  const [status, setStatus] = useState<ScanStatus>("scanning");

  const isScanning = status === "scanning";
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const visibleSkills = useMemo(() => {
    if (normalizedQuery === "") {
      return skills;
    }

    return skills.filter((skill) => {
      const name = skill.metadata.name.toLocaleLowerCase();
      const description = skill.metadata.description.toLocaleLowerCase();

      return name.includes(normalizedQuery) || description.includes(normalizedQuery);
    });
  }, [normalizedQuery, skills]);

  const selectedSkill = useMemo(
    () => visibleSkills.find((skill) => skill.id === selectedSkillId) ?? null,
    [selectedSkillId, visibleSkills],
  );

  useEffect(() => {
    if (visibleSkills.length === 0) {
      setSelectedSkillId(null);
      setIsSkillDetailDrawerOpen(false);
      return;
    }

    if (!visibleSkills.some((skill) => skill.id === selectedSkillId)) {
      setSelectedSkillId(visibleSkills[0]?.id ?? null);
      setIsSkillDetailDrawerOpen(false);
    }
  }, [selectedSkillId, visibleSkills]);

  useEffect(() => {
    if (!isColumnLayout || !selectedSkill) {
      setIsSkillDetailDrawerOpen(false);
    }
  }, [isColumnLayout, selectedSkill]);

  const scanDirectory = useCallback(async () => {
    setStatus("scanning");
    setError(null);

    try {
      const hasPermission = await ensureReadWritePermission(skillLibrary.directoryHandle);

      if (!hasPermission) {
        setSkills([]);
        setSelectedSkillId(null);
        setStatus("permission-required");
        setError(
          i18n._({
            id: "skills.error.permissionRequired",
            message:
              "The saved folder permission is no longer available. Request access again from the browser prompt, or delete and recreate this skill library.",
          }),
        );
        return;
      }

      const nextSkills = await scanSkillsRoot(skillLibrary.directoryHandle);

      setSkills(nextSkills);
      setSelectedSkillId((currentSkillId) => {
        if (nextSkills.some((skill) => skill.id === currentSkillId)) {
          return currentSkillId;
        }

        return nextSkills[0]?.id ?? null;
      });
      setStatus("idle");
    } catch (scanError) {
      if (isPermissionError(scanError)) {
        setSkills([]);
        setSelectedSkillId(null);
        setStatus("permission-required");
        setError(
          `${i18n._({
            id: "skills.error.permissionRequired",
            message:
              "The saved folder permission is no longer available. Request access again from the browser prompt, or delete and recreate this skill library.",
          })} ${formatUnknownError(scanError)}`,
        );
        return;
      }

      setError(
        `${i18n._({
          id: "skills.error.scan",
          message: "Unable to scan the selected directory.",
        })} ${formatUnknownError(scanError)}`,
      );
      setStatus("idle");
    }
  }, [i18n, skillLibrary.directoryHandle]);

  useEffect(() => {
    setQuery("");
    setSkills([]);
    setSelectedSkillId(null);
    setIsSkillDetailDrawerOpen(false);
    void scanDirectory();
  }, [scanDirectory, skillLibrary.id]);

  const handleRescan = useCallback(() => {
    void scanDirectory();
  }, [scanDirectory]);

  const handleClearQuery = useCallback(() => {
    setQuery("");
  }, []);

  const handleSelectSkill = useCallback(
    (skillId: string) => {
      setSelectedSkillId(skillId);

      if (isColumnLayout) {
        setIsSkillDetailDrawerOpen(true);
      }
    },
    [isColumnLayout],
  );

  const labels = {
    filters: {
      title: i18n._({
        id: "skills.filters.title",
        message: "Filters",
      }),
      all: i18n._({
        id: "skills.filters.all",
        message: "All",
      }),
    },
    list: {
      title: i18n._({
        id: "skills.list.title",
        message: "Skills",
      }),
      rootDirectory: i18n._({
        id: "skills.list.rootDirectory",
        message: "Root",
      }),
      search: i18n._({
        id: "skills.search.placeholder",
        message: "Search skills",
      }),
      rescan: i18n._({
        id: "skills.actions.rescan",
        message: "Rescan",
      }),
      invalidMetadata: i18n._({
        id: "skills.invalidMetadata",
        message: "Invalid metadata",
      }),
      empty: i18n._({
        id: "skills.list.empty",
        message: "No skills were found in this directory.",
      }),
      noMatches: i18n._({
        id: "skills.list.noMatches",
        message: "No skills match your search.",
      }),
      noMatchesDescription: i18n._({
        id: "skills.list.noMatches.description",
        message: "Try another search or clear the current query.",
      }),
      clearSearch: i18n._({
        id: "skills.actions.clearSearch",
        message: "Clear search",
      }),
    },
    detail: {
      title: i18n._({
        id: "skills.detail.title",
        message: "Skill detail",
      }),
      empty: i18n._({
        id: "skills.detail.empty",
        message: "Select a skill to view its metadata and SKILL.md source.",
      }),
      emptyTitle: i18n._({
        id: "skills.detail.emptyTitle",
        message: "No skill selected",
      }),
      description: i18n._({
        id: "skills.detail.description",
        message: "Description",
      }),
      path: i18n._({
        id: "skills.detail.path",
        message: "Local path",
      }),
      sourcePreview: i18n._({
        id: "skills.detail.sourcePreview",
        message: "SKILL.md preview",
      }),
      invalidMetadata: i18n._({
        id: "skills.invalidMetadata",
        message: "Invalid metadata",
      }),
      diagnostics: i18n._({
        id: "skills.detail.diagnostics",
        message: "Diagnostics",
      }),
      noDescription: i18n._({
        id: "skills.detail.noDescription",
        message: "No description available.",
      }),
      unreadableSource: i18n._({
        id: "skills.detail.unreadableSource",
        message: "SKILL.md could not be read.",
      }),
    },
    permission: {
      retry: i18n._({
        id: "skills.actions.requestPermission",
        message: "Request folder access",
      }),
    },
    close: i18n._({
      id: "common.close",
      message: "Close",
    }),
  };

  if (error) {
    return (
      <SkillsErrorState
        error={error}
        isPermissionRequired={status === "permission-required"}
        retryLabel={status === "permission-required" ? labels.permission.retry : labels.list.rescan}
        onRetry={handleRescan}
      />
    );
  }

  if (isScanning && skills.length === 0) {
    return <SkillsLoadingState />;
  }

  if (skills.length === 0) {
    return <NoSkillsState onRescan={handleRescan} />;
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[12rem_minmax(18rem,25rem)_minmax(0,1fr)] lg:overflow-hidden">
        <SkillFilters count={skills.length} labels={labels.filters} />
        <SkillList
          isScanning={isScanning}
          labels={labels.list}
          onClearQuery={handleClearQuery}
          onQueryChange={setQuery}
          onRescan={handleRescan}
          onSelectSkill={handleSelectSkill}
          query={query}
          rootName={skillLibrary.rootName}
          selectedSkillId={selectedSkillId}
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

function isPermissionError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "NotAllowedError" ||
      error.name === "SecurityError" ||
      error.name === "NotFoundError")
  );
}

function formatUnknownError(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return "";
}
