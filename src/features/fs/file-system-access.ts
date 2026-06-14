export type LocalSkillFile = {
  rootName: string;
  directoryName: string;
  relativePath: string;
  skillFilePath: string;
  source: string;
  readError: string | null;
};

type ShowDirectoryPickerOptions = {
  mode?: "read" | "readwrite";
};

declare global {
  interface Window {
    showDirectoryPicker?: (
      options?: ShowDirectoryPickerOptions,
    ) => Promise<FileSystemDirectoryHandle>;
  }
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window.showDirectoryPicker === "function";
}

export function isDirectoryPickerAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export async function chooseSkillsRootDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error("File System Access API is not supported in this browser.");
  }

  try {
    return (await window.showDirectoryPicker?.({ mode: "readwrite" })) ?? null;
  } catch (error) {
    if (isDirectoryPickerAbort(error)) {
      return null;
    }

    throw error;
  }
}

export async function readSkillFilesFromRoot(
  rootHandle: FileSystemDirectoryHandle,
): Promise<LocalSkillFile[]> {
  const files: LocalSkillFile[] = [];

  for await (const [entryName, entryHandle] of rootHandle.entries()) {
    if (entryHandle.kind !== "directory") {
      continue;
    }

    const directoryName = entryName;
    const relativePath = `${rootHandle.name}/${directoryName}`;
    const skillFilePath = `${relativePath}/SKILL.md`;

    try {
      const skillFileHandle = await entryHandle.getFileHandle("SKILL.md");
      const skillFile = await skillFileHandle.getFile();
      const source = await skillFile.text();

      files.push({
        rootName: rootHandle.name,
        directoryName,
        relativePath,
        skillFilePath,
        source,
        readError: null,
      });
    } catch (error) {
      if (isNotFoundError(error)) {
        continue;
      }

      files.push({
        rootName: rootHandle.name,
        directoryName,
        relativePath,
        skillFilePath,
        source: "",
        readError: formatFileSystemError(error),
      });
    }
  }

  return files.sort((left, right) => left.directoryName.localeCompare(right.directoryName));
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "NotFoundError";
}

function formatFileSystemError(error: unknown): string {
  if (error instanceof DOMException && error.message.trim() !== "") {
    return error.message;
  }

  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return "Unable to read SKILL.md.";
}
