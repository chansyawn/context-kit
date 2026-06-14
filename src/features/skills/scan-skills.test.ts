import { describe, expect, it } from "vite-plus/test";

import { scanSkillsRoot } from "./scan-skills";

describe("scanSkillsRoot", () => {
  it("scans one-level skill directories and skips directories without SKILL.md", async () => {
    const rootHandle = createRootDirectoryHandle("skills", [
      createChildDirectoryHandle(
        "code-review",
        `---
name: code-review
description: Review code changes.
---
`,
      ),
      createChildDirectoryHandle("empty-directory", null),
      createChildFileHandle("README.md", "not a skill"),
    ]);

    const skills = await scanSkillsRoot(rootHandle);

    expect(skills).toHaveLength(1);
    expect(skills[0]).toMatchObject({
      directoryName: "code-review",
      rootName: "skills",
      relativePath: "skills/code-review",
      skillFilePath: "skills/code-review/SKILL.md",
      metadata: {
        name: "code-review",
        description: "Review code changes.",
        valid: true,
      },
    });
  });

  it("keeps unreadable SKILL.md files visible as invalid metadata", async () => {
    const rootHandle = createRootDirectoryHandle("skills", [
      createChildDirectoryHandle(
        "restricted",
        new DOMException("Permission denied.", "SecurityError"),
      ),
    ]);

    const skills = await scanSkillsRoot(rootHandle);

    expect(skills).toHaveLength(1);
    expect(skills[0]?.metadata).toMatchObject({
      name: "restricted",
      description: "",
      valid: false,
    });
    expect(skills[0]?.metadata.diagnostics).toContainEqual({
      level: "error",
      message: "Permission denied.",
    });
  });
});

function createRootDirectoryHandle(
  name: string,
  children: Array<FileSystemDirectoryHandle | FileSystemFileHandle>,
): FileSystemDirectoryHandle {
  return {
    kind: "directory",
    name,
    entries: async function* entries() {
      for (const child of children) {
        yield [child.name, child] as [string, FileSystemDirectoryHandle | FileSystemFileHandle];
      }
    },
  } as unknown as FileSystemDirectoryHandle;
}

function createChildDirectoryHandle(
  name: string,
  source: string | DOMException | null,
): FileSystemDirectoryHandle {
  return {
    kind: "directory",
    name,
    getFileHandle: async () => {
      if (source === null) {
        throw new DOMException("Not found.", "NotFoundError");
      }

      if (source instanceof DOMException) {
        throw source;
      }

      return createChildFileHandle("SKILL.md", source);
    },
  } as unknown as FileSystemDirectoryHandle;
}

function createChildFileHandle(name: string, source: string): FileSystemFileHandle {
  return {
    kind: "file",
    name,
    getFile: async () => new File([source], name, { type: "text/markdown" }),
  } as unknown as FileSystemFileHandle;
}
