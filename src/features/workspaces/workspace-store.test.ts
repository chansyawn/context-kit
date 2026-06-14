import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { createIndexedDbWorkspaceRepository } from "./workspace-store";

describe("createIndexedDbWorkspaceRepository", () => {
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

  it("creates, lists, updates, and deletes workspace records", async () => {
    const repository = createIndexedDbWorkspaceRepository(indexedDb);
    const workspace = await repository.create({
      name: "  Primary skills  ",
      directoryHandle: createCloneableDirectoryHandle("skills"),
    });

    expect(workspace).toMatchObject({
      id: "00000000-0000-4000-8000-000000000001",
      name: "Primary skills",
      rootName: "skills",
    });
    expect(await repository.list()).toHaveLength(1);

    const renamedWorkspace = await repository.update(workspace.id, { name: "Renamed skills" });

    expect(renamedWorkspace.name).toBe("Renamed skills");
    expect(await repository.list()).toMatchObject([{ name: "Renamed skills" }]);

    await repository.delete(workspace.id);

    expect(await repository.list()).toEqual([]);
  });

  it("preserves creation order", async () => {
    const repository = createIndexedDbWorkspaceRepository(indexedDb);
    const firstWorkspace = await repository.create({
      name: "First",
      directoryHandle: createCloneableDirectoryHandle("first-root"),
    });
    const secondWorkspace = await repository.create({
      name: "Second",
      directoryHandle: createCloneableDirectoryHandle("second-root"),
    });

    await repository.update(firstWorkspace.id, { name: "Updated first" });

    expect((await repository.list()).map((workspace) => workspace.id)).toEqual([
      firstWorkspace.id,
      secondWorkspace.id,
    ]);
  });

  it("rejects empty and duplicate names", async () => {
    const repository = createIndexedDbWorkspaceRepository(indexedDb);

    await expect(
      repository.create({
        name: " ",
        directoryHandle: createCloneableDirectoryHandle("empty-name-root"),
      }),
    ).rejects.toThrow("Workspace name is required.");

    await repository.create({
      name: "Docs",
      directoryHandle: createCloneableDirectoryHandle("docs-root"),
    });

    await expect(
      repository.create({
        name: " docs ",
        directoryHandle: createCloneableDirectoryHandle("other-docs-root"),
      }),
    ).rejects.toThrow("Workspace name must be unique.");
  });
});

function createCloneableDirectoryHandle(name: string): FileSystemDirectoryHandle {
  return {
    kind: "directory",
    name,
  } as FileSystemDirectoryHandle;
}
