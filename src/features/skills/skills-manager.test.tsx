import { I18nStateProvider } from "@/app/i18n";
import type { SkillLibraryRecord } from "@/features/skill-libraries/skill-library-types";
import { renderWithProviders } from "@/test/render";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { SkillsManager } from "./skills-manager";

describe("SkillsManager", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("auto-scans the selected skill library, shows invalid metadata, and filters by search", async () => {
    const rootHandle = createRootDirectoryHandle("skills", [
      createChildDirectoryHandle(
        "code-review",
        `---
name: code-review
description: Review code changes.
---

# Code Review
`,
      ),
      createChildDirectoryHandle(
        "pdf-tools",
        `---
name: pdf-tools
description: Use this skill when: the user asks about PDFs
---

# PDF Tools
`,
      ),
      createChildDirectoryHandle(
        "broken-skill",
        `---
name: broken-skill
---

# Broken
`,
      ),
    ]);

    renderSkillsManager(rootHandle);

    expect((await screen.findAllByText("code-review"))[0]).toBeVisible();
    expect(screen.getByText("pdf-tools")).toBeVisible();
    expect(screen.getAllByText("broken-skill")[0]).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /code-review/i }));
    expect(screen.getByText("skills/code-review/SKILL.md")).toBeVisible();
    expect(screen.getAllByText("Invalid metadata").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByPlaceholderText("Search skills"), {
      target: { value: "pdf" },
    });

    await waitFor(() => {
      expect(screen.queryAllByText("code-review")).toHaveLength(0);
      expect(screen.getAllByText("pdf-tools")[0]).toBeVisible();
      expect(screen.getAllByText("Use this skill when: the user asks about PDFs")[0]).toBeVisible();
    });
  });

  it("rescans the selected skill library directory handle", async () => {
    const rootHandle = createRootDirectoryHandle("skills", [
      createChildDirectoryHandle(
        "code-review",
        `---
name: code-review
description: Review code changes.
---
`,
      ),
    ]);

    renderSkillsManager(rootHandle);

    expect((await screen.findAllByText("code-review"))[0]).toBeVisible();

    rootHandle.setChildren([
      createChildDirectoryHandle(
        "pdf-tools",
        `---
name: pdf-tools
description: Read PDF files.
---
`,
      ),
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Rescan" }));

    expect((await screen.findAllByText("pdf-tools"))[0]).toBeVisible();
    expect(screen.queryAllByText("code-review")).toHaveLength(0);
  });

  it("shows recovery state when saved skill library permission is missing", async () => {
    const rootHandle = createRootDirectoryHandle("skills", [], "denied");

    renderSkillsManager(rootHandle);

    expect(
      await screen.findByText(/The saved folder permission is no longer available/i),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Request folder access" })).toBeVisible();

    rootHandle.setPermission("granted");
    rootHandle.setChildren([
      createChildDirectoryHandle(
        "code-review",
        `---
name: code-review
description: Review code changes.
---
`,
      ),
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Request folder access" }));

    expect((await screen.findAllByText("code-review"))[0]).toBeVisible();
  });
});

type MutableRootDirectoryHandle = FileSystemDirectoryHandle & {
  setChildren: (children: Array<FileSystemDirectoryHandle | FileSystemFileHandle>) => void;
  setPermission: (permission: PermissionState) => void;
};

function renderSkillsManager(rootHandle: FileSystemDirectoryHandle) {
  renderWithProviders(
    <I18nStateProvider>
      <SkillsManager skillLibrary={createSkillLibrary(rootHandle)} />
    </I18nStateProvider>,
  );
}

function createSkillLibrary(directoryHandle: FileSystemDirectoryHandle): SkillLibraryRecord {
  return {
    id: "skill-library-1",
    name: "Test skill library",
    rootName: directoryHandle.name,
    createdAt: "2026-06-14T00:00:00.000Z",
    updatedAt: "2026-06-14T00:00:00.000Z",
    directoryHandle,
  };
}

function createRootDirectoryHandle(
  name: string,
  initialChildren: Array<FileSystemDirectoryHandle | FileSystemFileHandle>,
  initialPermission: PermissionState = "granted",
): MutableRootDirectoryHandle {
  let children = initialChildren;
  let permission = initialPermission;

  return {
    kind: "directory",
    name,
    entries: async function* entries() {
      for (const child of children) {
        yield [child.name, child] as [string, FileSystemDirectoryHandle | FileSystemFileHandle];
      }
    },
    queryPermission: async () => permission,
    requestPermission: async () => permission,
    setChildren(nextChildren: Array<FileSystemDirectoryHandle | FileSystemFileHandle>) {
      children = nextChildren;
    },
    setPermission(nextPermission: PermissionState) {
      permission = nextPermission;
    },
  } as unknown as MutableRootDirectoryHandle;
}

function createChildDirectoryHandle(name: string, source: string): FileSystemDirectoryHandle {
  return {
    kind: "directory",
    name,
    getFileHandle: async () => createChildFileHandle("SKILL.md", source),
  } as unknown as FileSystemDirectoryHandle;
}

function createChildFileHandle(name: string, source: string): FileSystemFileHandle {
  return {
    kind: "file",
    name,
    getFile: async () => new File([source], name, { type: "text/markdown" }),
  } as unknown as FileSystemFileHandle;
}
