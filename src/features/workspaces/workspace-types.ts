export type WorkspaceRecord = {
  id: string;
  name: string;
  rootName: string;
  createdAt: string;
  updatedAt: string;
  directoryHandle: FileSystemDirectoryHandle;
};

export type WorkspaceCreateInput = {
  name: string;
  directoryHandle: FileSystemDirectoryHandle;
};

export type WorkspaceUpdateInput = {
  name: string;
};

export type WorkspaceValidationResult =
  | { valid: true; name: string }
  | { valid: false; message: string };
