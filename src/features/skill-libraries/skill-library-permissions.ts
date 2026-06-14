type FileSystemPermissionMode = "read" | "readwrite";

type FileSystemHandleWithPermissions = FileSystemHandle & {
  queryPermission?: (options?: { mode?: FileSystemPermissionMode }) => Promise<PermissionState>;
  requestPermission?: (options?: { mode?: FileSystemPermissionMode }) => Promise<PermissionState>;
};

export async function ensureReadWritePermission(
  directoryHandle: FileSystemDirectoryHandle,
): Promise<boolean> {
  const handle = directoryHandle as FileSystemHandleWithPermissions;

  if (handle.queryPermission) {
    const currentPermission = await handle.queryPermission({ mode: "readwrite" });

    if (currentPermission === "granted") {
      return true;
    }
  }

  if (!handle.requestPermission) {
    return true;
  }

  return (await handle.requestPermission({ mode: "readwrite" })) === "granted";
}
