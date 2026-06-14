import type {
  WorkspaceCreateInput,
  WorkspaceRecord,
  WorkspaceUpdateInput,
  WorkspaceValidationResult,
} from "./workspace-types";

const DATABASE_NAME = "tagskills.workspaces.v1";
const DATABASE_VERSION = 1;
const WORKSPACE_STORE_NAME = "workspaces";

type StoredWorkspaceRecord = WorkspaceRecord;

export type WorkspaceRepository = {
  list: () => Promise<WorkspaceRecord[]>;
  create: (input: WorkspaceCreateInput) => Promise<WorkspaceRecord>;
  update: (id: string, input: WorkspaceUpdateInput) => Promise<WorkspaceRecord>;
  delete: (id: string) => Promise<void>;
};

type FileSystemHandleWithSameEntry = FileSystemHandle & {
  isSameEntry?: (other: FileSystemHandle) => Promise<boolean>;
};

export function createIndexedDbWorkspaceRepository(
  indexedDb: IDBFactory | undefined = globalThis.indexedDB,
): WorkspaceRepository {
  if (!indexedDb) {
    return createUnavailableWorkspaceRepository();
  }

  return {
    async list() {
      return sortWorkspacesByCreation(await readAllWorkspaces(indexedDb));
    },
    async create(input) {
      const existingWorkspaces = await readAllWorkspaces(indexedDb);
      const validation = validateWorkspaceName(input.name, existingWorkspaces);

      if (!validation.valid) {
        throw new Error(validation.message);
      }

      await assertUniqueDirectory(input.directoryHandle, existingWorkspaces);

      const now = createMonotonicTimestamp(existingWorkspaces);
      const workspace: WorkspaceRecord = {
        id: crypto.randomUUID(),
        name: validation.name,
        rootName: input.directoryHandle.name,
        createdAt: now,
        updatedAt: now,
        directoryHandle: input.directoryHandle,
      };

      await writeWorkspace(indexedDb, workspace);

      return workspace;
    },
    async update(id, input) {
      const existingWorkspaces = await readAllWorkspaces(indexedDb);
      const existingWorkspace = existingWorkspaces.find((workspace) => workspace.id === id);

      if (!existingWorkspace) {
        throw new Error("Workspace was not found.");
      }

      const validation = validateWorkspaceName(input.name, existingWorkspaces, id);

      if (!validation.valid) {
        throw new Error(validation.message);
      }

      const workspace = {
        ...existingWorkspace,
        name: validation.name,
        updatedAt: new Date().toISOString(),
      };

      await writeWorkspace(indexedDb, workspace);

      return workspace;
    },
    async delete(id) {
      await deleteWorkspace(indexedDb, id);
    },
  };
}

export function validateWorkspaceName(
  name: string,
  existingWorkspaces: WorkspaceRecord[],
  currentWorkspaceId?: string,
): WorkspaceValidationResult {
  const trimmedName = name.trim();

  if (trimmedName === "") {
    return {
      valid: false,
      message: "Workspace name is required.",
    };
  }

  const normalizedName = trimmedName.toLocaleLowerCase();
  const alreadyExists = existingWorkspaces.some(
    (workspace) =>
      workspace.id !== currentWorkspaceId && workspace.name.toLocaleLowerCase() === normalizedName,
  );

  if (alreadyExists) {
    return {
      valid: false,
      message: "Workspace name must be unique.",
    };
  }

  return {
    valid: true,
    name: trimmedName,
  };
}

async function assertUniqueDirectory(
  directoryHandle: FileSystemDirectoryHandle,
  existingWorkspaces: WorkspaceRecord[],
): Promise<void> {
  for (const workspace of existingWorkspaces) {
    const existingHandle = workspace.directoryHandle as FileSystemHandleWithSameEntry;

    if (
      typeof existingHandle.isSameEntry === "function" &&
      (await existingHandle.isSameEntry(directoryHandle))
    ) {
      throw new Error("This skills directory has already been added.");
    }
  }
}

function createUnavailableWorkspaceRepository(): WorkspaceRepository {
  async function fail(): Promise<never> {
    throw new Error("IndexedDB is not available in this browser.");
  }

  return {
    list: fail,
    create: fail,
    update: fail,
    delete: fail,
  };
}

async function openWorkspaceDatabase(indexedDb: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDb.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(WORKSPACE_STORE_NAME)) {
        database.createObjectStore(WORKSPACE_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onerror = () => reject(request.error ?? new Error("Unable to open IndexedDB."));
    request.onsuccess = () => resolve(request.result);
  });
}

async function withWorkspaceStore<T>(
  indexedDb: IDBFactory,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T> {
  const database = await openWorkspaceDatabase(indexedDb);

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(WORKSPACE_STORE_NAME, mode);
    const store = transaction.objectStore(WORKSPACE_STORE_NAME);
    const request = action(store);
    let result: T | undefined;

    if (request) {
      request.onsuccess = () => {
        result = request.result;
      };
      request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
    }

    transaction.oncomplete = () => {
      database.close();
      resolve(result as T);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("IndexedDB transaction was aborted."));
    };
  });
}

async function readAllWorkspaces(indexedDb: IDBFactory): Promise<WorkspaceRecord[]> {
  return withWorkspaceStore<StoredWorkspaceRecord[]>(indexedDb, "readonly", (store) =>
    store.getAll(),
  );
}

async function writeWorkspace(
  indexedDb: IDBFactory,
  workspace: WorkspaceRecord,
): Promise<WorkspaceRecord> {
  await withWorkspaceStore<IDBValidKey>(indexedDb, "readwrite", (store) => store.put(workspace));

  return workspace;
}

async function deleteWorkspace(indexedDb: IDBFactory, id: string): Promise<void> {
  await withWorkspaceStore<undefined>(indexedDb, "readwrite", (store) => store.delete(id));
}

function sortWorkspacesByCreation(workspaces: WorkspaceRecord[]): WorkspaceRecord[] {
  return [...workspaces].sort((left, right) => {
    const createdAtComparison = left.createdAt.localeCompare(right.createdAt);

    if (createdAtComparison !== 0) {
      return createdAtComparison;
    }

    return left.name.localeCompare(right.name);
  });
}

function createMonotonicTimestamp(existingWorkspaces: WorkspaceRecord[]): string {
  const now = Date.now();
  const latestExistingTime = existingWorkspaces.reduce((latest, workspace) => {
    const createdAtTime = Date.parse(workspace.createdAt);

    if (Number.isNaN(createdAtTime)) {
      return latest;
    }

    return Math.max(latest, createdAtTime);
  }, 0);

  return new Date(Math.max(now, latestExistingTime + 1)).toISOString();
}
