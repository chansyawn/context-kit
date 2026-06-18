import {
  parseCreateLibraryInput,
  parseDirectoryInput,
  parseIdInput,
  parseRenameInput,
  parseRepositoryPageInput,
  parseSkillPageInput,
} from "@/server/skill-libraries/validation";
import { createServerFn } from "@tanstack/react-start";

export const listInstallations = createServerFn({ method: "GET" }).handler(async () => {
  const service = await import("@/server/github/repositories.server");

  return service.listInstallations();
});

export const listRepositories = createServerFn({ method: "GET" })
  .validator(parseRepositoryPageInput)
  .handler(async ({ data }) => {
    const service = await import("@/server/github/repositories.server");

    return service.listRepositories(data.installationId, data.page);
  });

export const listDirectories = createServerFn({ method: "GET" })
  .validator(parseDirectoryInput)
  .handler(async ({ data }) => {
    const service = await import("@/server/github/repositories.server");

    return service.listDirectories(data.repositoryId, data.path);
  });

export const listLibraries = createServerFn({ method: "GET" }).handler(async () => {
  const service = await import("./service.server");

  return service.listSkillLibraries();
});

export const createLibrary = createServerFn({ method: "POST" })
  .validator(parseCreateLibraryInput)
  .handler(async ({ data }) => {
    const service = await import("./service.server");

    return service.createSkillLibrary(data);
  });

export const renameLibrary = createServerFn({ method: "POST" })
  .validator(parseRenameInput)
  .handler(async ({ data }) => {
    const service = await import("./service.server");

    return service.renameSkillLibrary(data.libraryId, data.name);
  });

export const deleteLibrary = createServerFn({ method: "POST" })
  .validator(parseIdInput)
  .handler(async ({ data }) => {
    const service = await import("./service.server");

    return service.deleteSkillLibrary(data.libraryId);
  });

export const getSkillPage = createServerFn({ method: "GET" })
  .validator(parseSkillPageInput)
  .handler(async ({ data }) => {
    const libraries = await import("./service.server");
    const github = await import("@/server/github/skills.server");
    const library = await libraries.getOwnedSkillLibrary(data.libraryId);

    return github.getSkillPage(library, data.page, data.query);
  });
