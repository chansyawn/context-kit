import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { createIndexedDbSkillLibraryRepository } from "./skill-library-store";

describe("createIndexedDbSkillLibraryRepository", () => {
  let indexedDb: IDBFactory;
  let uuidCounter: number;

  beforeEach(() => {
    indexedDb = new IDBFactory();
    uuidCounter = 0;
    vi.spyOn(crypto, "randomUUID").mockImplementation(() => {
      uuidCounter += 1;

      return `00000000-0000-4000-8000-${uuidCounter.toString().padStart(12, "0")}`;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates, lists, updates, and deletes skill library records", async () => {
    const repository = createIndexedDbSkillLibraryRepository(indexedDb);
    const skillLibrary = await repository.create({
      name: "  Primary skills  ",
      directoryHandle: createCloneableDirectoryHandle("skills"),
    });

    expect(skillLibrary).toMatchObject({
      id: "00000000-0000-4000-8000-000000000001",
      name: "Primary skills",
      rootName: "skills",
    });
    expect(await repository.list()).toHaveLength(1);

    const renamedSkillLibrary = await repository.update(skillLibrary.id, {
      name: "Renamed skills",
    });

    expect(renamedSkillLibrary.name).toBe("Renamed skills");
    expect(await repository.list()).toMatchObject([{ name: "Renamed skills" }]);

    await repository.delete(skillLibrary.id);

    expect(await repository.list()).toEqual([]);
  });

  it("preserves creation order", async () => {
    const repository = createIndexedDbSkillLibraryRepository(indexedDb);
    const firstSkillLibrary = await repository.create({
      name: "First",
      directoryHandle: createCloneableDirectoryHandle("first-root"),
    });
    const secondSkillLibrary = await repository.create({
      name: "Second",
      directoryHandle: createCloneableDirectoryHandle("second-root"),
    });

    await repository.update(firstSkillLibrary.id, { name: "Updated first" });

    expect((await repository.list()).map((skillLibrary) => skillLibrary.id)).toEqual([
      firstSkillLibrary.id,
      secondSkillLibrary.id,
    ]);
  });

  it("rejects empty and duplicate names", async () => {
    const repository = createIndexedDbSkillLibraryRepository(indexedDb);

    await expect(
      repository.create({
        name: " ",
        directoryHandle: createCloneableDirectoryHandle("empty-name-root"),
      }),
    ).rejects.toThrow("Skill library name is required.");

    await repository.create({
      name: "Docs",
      directoryHandle: createCloneableDirectoryHandle("docs-root"),
    });

    await expect(
      repository.create({
        name: " docs ",
        directoryHandle: createCloneableDirectoryHandle("other-docs-root"),
      }),
    ).rejects.toThrow("Skill library name must be unique.");
  });
});

function createCloneableDirectoryHandle(name: string): FileSystemDirectoryHandle {
  return {
    kind: "directory",
    name,
  } as FileSystemDirectoryHandle;
}
