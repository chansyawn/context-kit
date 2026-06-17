import type {
  SkillLibraryCreateInput,
  SkillLibraryRecord,
  SkillLibraryUpdateInput,
  SkillLibraryValidationResult,
} from "./skill-library-types";

const DATABASE_NAME = "context-kit.skill-libraries.v1";
const DATABASE_VERSION = 1;
const SKILL_LIBRARY_STORE_NAME = "skillLibraries";

type StoredSkillLibraryRecord = SkillLibraryRecord;

export type SkillLibraryRepository = {
  list: () => Promise<SkillLibraryRecord[]>;
  create: (input: SkillLibraryCreateInput) => Promise<SkillLibraryRecord>;
  update: (id: string, input: SkillLibraryUpdateInput) => Promise<SkillLibraryRecord>;
  delete: (id: string) => Promise<void>;
};

type FileSystemHandleWithSameEntry = FileSystemHandle & {
  isSameEntry?: (other: FileSystemHandle) => Promise<boolean>;
};

export function createIndexedDbSkillLibraryRepository(
  indexedDb: IDBFactory | undefined = globalThis.indexedDB,
): SkillLibraryRepository {
  if (!indexedDb) {
    return createUnavailableSkillLibraryRepository();
  }

  return {
    async list() {
      return sortSkillLibrariesByCreation(await readAllSkillLibraries(indexedDb));
    },
    async create(input) {
      const existingSkillLibraries = await readAllSkillLibraries(indexedDb);
      const validation = validateSkillLibraryName(input.name, existingSkillLibraries);

      if (!validation.valid) {
        throw new Error(validation.message);
      }

      await assertUniqueDirectory(input.directoryHandle, existingSkillLibraries);

      const now = createMonotonicTimestamp(existingSkillLibraries);
      const skillLibrary: SkillLibraryRecord = {
        id: crypto.randomUUID(),
        name: validation.name,
        rootName: input.directoryHandle.name,
        createdAt: now,
        updatedAt: now,
        directoryHandle: input.directoryHandle,
      };

      await writeSkillLibrary(indexedDb, skillLibrary);

      return skillLibrary;
    },
    async update(id, input) {
      const existingSkillLibraries = await readAllSkillLibraries(indexedDb);
      const existingSkillLibrary = existingSkillLibraries.find(
        (skillLibrary) => skillLibrary.id === id,
      );

      if (!existingSkillLibrary) {
        throw new Error("Skill library was not found.");
      }

      const validation = validateSkillLibraryName(input.name, existingSkillLibraries, id);

      if (!validation.valid) {
        throw new Error(validation.message);
      }

      const skillLibrary = {
        ...existingSkillLibrary,
        name: validation.name,
        updatedAt: new Date().toISOString(),
      };

      await writeSkillLibrary(indexedDb, skillLibrary);

      return skillLibrary;
    },
    async delete(id) {
      await deleteSkillLibrary(indexedDb, id);
    },
  };
}

export function validateSkillLibraryName(
  name: string,
  existingSkillLibraries: SkillLibraryRecord[],
  currentSkillLibraryId?: string,
): SkillLibraryValidationResult {
  const trimmedName = name.trim();

  if (trimmedName === "") {
    return {
      valid: false,
      message: "Skill library name is required.",
    };
  }

  const normalizedName = trimmedName.toLocaleLowerCase();
  const alreadyExists = existingSkillLibraries.some(
    (skillLibrary) =>
      skillLibrary.id !== currentSkillLibraryId &&
      skillLibrary.name.toLocaleLowerCase() === normalizedName,
  );

  if (alreadyExists) {
    return {
      valid: false,
      message: "Skill library name must be unique.",
    };
  }

  return {
    valid: true,
    name: trimmedName,
  };
}

async function assertUniqueDirectory(
  directoryHandle: FileSystemDirectoryHandle,
  existingSkillLibraries: SkillLibraryRecord[],
): Promise<void> {
  for (const skillLibrary of existingSkillLibraries) {
    const existingHandle = skillLibrary.directoryHandle as FileSystemHandleWithSameEntry;

    if (
      typeof existingHandle.isSameEntry === "function" &&
      (await existingHandle.isSameEntry(directoryHandle))
    ) {
      throw new Error("This skills directory has already been added.");
    }
  }
}

function createUnavailableSkillLibraryRepository(): SkillLibraryRepository {
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

async function openSkillLibraryDatabase(indexedDb: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDb.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(SKILL_LIBRARY_STORE_NAME)) {
        database.createObjectStore(SKILL_LIBRARY_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onerror = () => reject(request.error ?? new Error("Unable to open IndexedDB."));
    request.onsuccess = () => resolve(request.result);
  });
}

async function withSkillLibraryStore<T>(
  indexedDb: IDBFactory,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T> {
  const database = await openSkillLibraryDatabase(indexedDb);

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(SKILL_LIBRARY_STORE_NAME, mode);
    const store = transaction.objectStore(SKILL_LIBRARY_STORE_NAME);
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

async function readAllSkillLibraries(indexedDb: IDBFactory): Promise<SkillLibraryRecord[]> {
  return withSkillLibraryStore<StoredSkillLibraryRecord[]>(indexedDb, "readonly", (store) =>
    store.getAll(),
  );
}

async function writeSkillLibrary(
  indexedDb: IDBFactory,
  skillLibrary: SkillLibraryRecord,
): Promise<SkillLibraryRecord> {
  await withSkillLibraryStore<IDBValidKey>(indexedDb, "readwrite", (store) =>
    store.put(skillLibrary),
  );

  return skillLibrary;
}

async function deleteSkillLibrary(indexedDb: IDBFactory, id: string): Promise<void> {
  await withSkillLibraryStore<undefined>(indexedDb, "readwrite", (store) => store.delete(id));
}

function sortSkillLibrariesByCreation(skillLibraries: SkillLibraryRecord[]): SkillLibraryRecord[] {
  return [...skillLibraries].sort((left, right) => {
    const createdAtComparison = left.createdAt.localeCompare(right.createdAt);

    if (createdAtComparison !== 0) {
      return createdAtComparison;
    }

    return left.name.localeCompare(right.name);
  });
}

function createMonotonicTimestamp(existingSkillLibraries: SkillLibraryRecord[]): string {
  const now = Date.now();
  const latestExistingTime = existingSkillLibraries.reduce((latest, skillLibrary) => {
    const createdAtTime = Date.parse(skillLibrary.createdAt);

    if (Number.isNaN(createdAtTime)) {
      return latest;
    }

    return Math.max(latest, createdAtTime);
  }, 0);

  return new Date(Math.max(now, latestExistingTime + 1)).toISOString();
}
