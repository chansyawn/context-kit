"use client";

import type { RepositorySummary } from "@/domain/skill-libraries/types";
import {
  getGithubAppConfig,
  listDirectories,
  listInstallations,
  listRepositories,
} from "@/server/skill-libraries/functions";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/components/dialog";
import { Input } from "@/ui/components/input";
import { SidebarGroupAction } from "@/ui/components/sidebar";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  FolderIcon,
  FolderPlusIcon,
  GitBranchIcon,
  PlusIcon,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { formatSkillLibraryError } from "./skill-library-errors";
import { useSkillLibraries } from "./use-skill-libraries";

type SkillLibraryCreateDialogProps = {
  triggerVariant?: "sidebar" | "empty-state";
};

export function SkillLibraryCreateDialog({
  triggerVariant = "sidebar",
}: SkillLibraryCreateDialogProps) {
  const { i18n } = useLingui();
  const navigate = useNavigate();
  const { createSkillLibrary } = useSkillLibraries();
  const [browsePath, setBrowsePath] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [installationId, setInstallationId] = useState<string | null>(null);
  const [isNameEdited, setIsNameEdited] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [pathInput, setPathInput] = useState("");
  const [repository, setRepository] = useState<RepositorySummary | null>(null);
  const [repositoryPage, setRepositoryPage] = useState(1);
  const appConfigQuery = useQuery({
    queryKey: ["github-app-config"],
    queryFn: () => getGithubAppConfig(),
    enabled: open,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const installationsQuery = useQuery({
    queryKey: ["github-installations"],
    queryFn: () => listInstallations(),
    enabled: open,
  });
  const repositoriesQuery = useQuery({
    queryKey: ["github-repositories", installationId, repositoryPage],
    queryFn: () =>
      listRepositories({ data: { installationId: installationId ?? "", page: repositoryPage } }),
    enabled: open && installationId !== null,
    placeholderData: keepPreviousData,
  });
  const directoriesQuery = useQuery({
    queryKey: ["github-directories", repository?.id, browsePath],
    queryFn: () =>
      listDirectories({ data: { repositoryId: repository?.id ?? "", path: browsePath } }),
    enabled: open && repository !== null,
  });
  const addLabel = i18n._({
    id: "skillLibraries.actions.add",
    message: "Add skill library",
  });
  const closeLabel = i18n._({ id: "common.close", message: "Close" });

  useEffect(() => {
    const firstInstallation = installationsQuery.data?.[0];

    if (installationId === null && firstInstallation) {
      setInstallationId(firstInstallation.id);
    }
  }, [installationId, installationsQuery.data]);

  function resetForm() {
    setBrowsePath("");
    setError(null);
    setInstallationId(null);
    setIsNameEdited(false);
    setIsSaving(false);
    setName("");
    setPathInput("");
    setRepository(null);
    setRepositoryPage(1);
  }

  function selectInstallation(id: string) {
    setInstallationId(id);
    setRepository(null);
    setRepositoryPage(1);
    setBrowsePath("");
    setPathInput("");
    setError(null);
  }

  function selectRepository(nextRepository: RepositorySummary) {
    setRepository(nextRepository);
    setBrowsePath("");
    setPathInput("");
    setName(`${nextRepository.name} / /`);
    setIsNameEdited(false);
    setError(null);
  }

  function selectPath(path: string) {
    setBrowsePath(path);
    setPathInput(path);

    if (repository && !isNameEdited) {
      setName(`${repository.name} / ${path || "/"}`);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!repository || directoriesQuery.isPending || directoriesQuery.isError) {
      setError(
        i18n._({
          id: "skillLibraries.error.githubSelectionRequired",
          message: "Select an accessible repository directory before saving.",
        }),
      );
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const skillLibrary = await createSkillLibrary({
        name,
        repositoryId: repository.id,
        path: browsePath,
      });

      setOpen(false);
      resetForm();
      await navigate({
        to: "/skill-libraries/$skillLibraryId",
        params: { skillLibraryId: skillLibrary.id },
        search: { page: 1, query: "" },
        replace: true,
      });
    } catch (createError) {
      setError(formatSkillLibraryError(createError, i18n));
    } finally {
      setIsSaving(false);
    }
  }

  const displayedError =
    error ??
    (installationsQuery.error ? formatSkillLibraryError(installationsQuery.error, i18n) : null) ??
    (repositoriesQuery.error ? formatSkillLibraryError(repositoriesQuery.error, i18n) : null) ??
    (directoriesQuery.error ? formatSkillLibraryError(directoriesQuery.error, i18n) : null);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      {triggerVariant === "sidebar" ? (
        <DialogTrigger render={<SidebarGroupAction aria-label={addLabel} title={addLabel} />}>
          <PlusIcon />
          <span className="sr-only">{addLabel}</span>
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button type="button" size="lg" />}>
          <FolderPlusIcon />
          {addLabel}
        </DialogTrigger>
      )}
      <DialogContent closeLabel={closeLabel} className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              <Trans id="skillLibraries.create.title">Add skill library</Trans>
            </DialogTitle>
            <DialogDescription>
              <Trans id="skillLibraries.create.githubDescription">
                Connect a repository directory from your GitHub App installations.
              </Trans>
            </DialogDescription>
          </DialogHeader>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">
              <Trans id="skillLibraries.form.installation">GitHub account</Trans>
            </legend>
            <div className="grid max-h-32 gap-1 overflow-y-auto">
              {installationsQuery.data?.map((installation) => (
                <Button
                  key={installation.id}
                  type="button"
                  variant={installationId === installation.id ? "secondary" : "outline"}
                  className="justify-start"
                  onClick={() => selectInstallation(installation.id)}
                >
                  <GitBranchIcon />
                  {installation.accountLogin}
                </Button>
              ))}
            </div>
            {installationsQuery.data?.length === 0 && appConfigQuery.data ? (
              <Button
                type="button"
                variant="outline"
                render={<a href={appConfigQuery.data.installationUrl} />}
              >
                <ExternalLinkIcon />
                <Trans id="skillLibraries.actions.installApp">Install GitHub App</Trans>
              </Button>
            ) : null}
          </fieldset>

          {installationId ? (
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">
                <Trans id="skillLibraries.form.repository">Repository</Trans>
              </legend>
              <div className="grid max-h-40 gap-1 overflow-y-auto">
                {repositoriesQuery.data?.items.map((item) => (
                  <Button
                    key={item.id}
                    type="button"
                    variant={repository?.id === item.id ? "secondary" : "outline"}
                    className="justify-start"
                    onClick={() => selectRepository(item)}
                  >
                    <GitBranchIcon />
                    <span className="truncate">{item.fullName}</span>
                  </Button>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={i18n._({ id: "common.previous", message: "Previous" })}
                  disabled={repositoryPage === 1}
                  onClick={() => setRepositoryPage((page) => Math.max(1, page - 1))}
                >
                  <ChevronLeftIcon />
                </Button>
                <span className="text-xs text-muted-foreground">{repositoryPage}</span>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={i18n._({ id: "common.next", message: "Next" })}
                  disabled={!repositoriesQuery.data?.hasNextPage}
                  onClick={() => setRepositoryPage((page) => page + 1)}
                >
                  <ChevronRightIcon />
                </Button>
              </div>
            </fieldset>
          ) : null}

          {repository ? (
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">
                <Trans id="skillLibraries.form.directory">Skills directory</Trans>
              </legend>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  aria-label={i18n._({ id: "skillLibraries.actions.parent", message: "Parent" })}
                  disabled={browsePath === ""}
                  onClick={() => selectPath(parentPath(browsePath))}
                >
                  <ArrowLeftIcon />
                </Button>
                <Input
                  value={pathInput}
                  onChange={(event) => setPathInput(event.currentTarget.value)}
                  placeholder="skills"
                />
                <Button type="button" variant="outline" onClick={() => selectPath(pathInput)}>
                  <Trans id="skillLibraries.actions.openPath">Open</Trans>
                </Button>
              </div>
              <div className="grid max-h-36 gap-1 overflow-y-auto">
                {directoriesQuery.data?.map((directory) => (
                  <Button
                    key={directory.path}
                    type="button"
                    variant="ghost"
                    className="justify-start"
                    onClick={() => selectPath(directory.path)}
                  >
                    <FolderIcon />
                    <span className="truncate">{directory.name}</span>
                  </Button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {repository ? (
            <label className="grid gap-2 text-sm">
              <span className="font-medium">
                <Trans id="skillLibraries.form.name">Skill library name</Trans>
              </span>
              <Input
                value={name}
                onChange={(event) => {
                  setName(event.currentTarget.value);
                  setIsNameEdited(true);
                }}
              />
            </label>
          ) : null}

          {displayedError ? (
            <p role="alert" className="text-sm text-destructive">
              {displayedError}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              <Trans id="common.cancel">Cancel</Trans>
            </DialogClose>
            <Button
              type="submit"
              disabled={
                isSaving ||
                !repository ||
                name.trim() === "" ||
                directoriesQuery.isPending ||
                directoriesQuery.isError
              }
            >
              <Trans id="common.save">Save</Trans>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function parentPath(path: string): string {
  return path.split("/").slice(0, -1).join("/");
}
