export type SkillLibraryRecord = {
  id: string;
  name: string;
  rootName: string;
  createdAt: string;
  updatedAt: string;
  directoryHandle: FileSystemDirectoryHandle;
};

export type SkillLibraryCreateInput = {
  name: string;
  directoryHandle: FileSystemDirectoryHandle;
};

export type SkillLibraryUpdateInput = {
  name: string;
};

export type SkillLibraryValidationResult =
  | { valid: true; name: string }
  | { valid: false; message: string };
