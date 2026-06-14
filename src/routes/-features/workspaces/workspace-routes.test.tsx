import { App } from "@/app/app";
import { createIndexedDbWorkspaceRepository } from "@/features/workspaces/workspace-store";
import type { WorkspaceRecord } from "@/features/workspaces/workspace-types";
import { mockMatchMedia } from "@/test/events";
import { renderWithProviders } from "@/test/render";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

let indexedDb: IDBFactory;
let uuidCounter: number;

describe("workspace routes", () => {
  beforeEach(() => {
    indexedDb = new IDBFactory();
    uuidCounter = 0;
    mockMatchMedia(false);
    window.scrollTo = vi.fn();
    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      value: indexedDb,
    });
    vi.spyOn(crypto, "randomUUID").mockImplementation(() => {
      uuidCounter += 1;

      return `00000000-0000-4000-8000-${uuidCounter.toString().padStart(12, "0")}`;
    });
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    delete window.showDirectoryPicker;
    localStorage.clear();
    vi.restoreAllMocks();
    window.history.replaceState(null, "", "/");
  });

  it("shows an empty workspace state without the old main directory picker CTA", async () => {
    renderApp();

    expect(await screen.findByText("No workspaces yet")).toBeVisible();
    expect(screen.getByText("No workspaces")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Choose skills directory" }),
    ).not.toBeInTheDocument();
  });

  it("requires a workspace name and directory before saving", async () => {
    window.showDirectoryPicker = vi.fn(async () => createCloneableDirectoryHandle("skills"));

    renderApp();
    await openCreateDialog();

    const saveButton = screen.getByRole("button", { name: "Save" });

    expect(saveButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("My skills"), {
      target: { value: "Primary" },
    });

    expect(saveButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Select directory" }));

    expect(await screen.findByText("skills")).toBeVisible();

    expect(saveButton).toBeEnabled();
  });

  it("persists a workspace after provider remount", async () => {
    window.showDirectoryPicker = vi.fn(async () => createCloneableDirectoryHandle("skills"));

    const { unmount } = renderApp();

    await createWorkspaceThroughUi("Primary", "skills");

    expect((await screen.findAllByText("Primary"))[0]).toBeVisible();

    unmount();
    renderApp();

    expect((await screen.findAllByText("Primary"))[0]).toBeVisible();
  });

  it("renames a workspace without changing the route", async () => {
    const workspace = await seedWorkspace("Primary", "skills");

    renderApp(`/workspaces/${workspace.id}`);

    expect((await screen.findAllByText("Primary"))[0]).toBeVisible();

    fireEvent.click(await screen.findByRole("button", { name: "Workspace actions" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Rename" }));
    fireEvent.change(screen.getByDisplayValue("Primary"), {
      target: { value: "Renamed" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect((await screen.findAllByText("Renamed"))[0]).toBeVisible();
    expect(window.location.pathname).toBe(`/workspaces/${workspace.id}`);
  });

  it("deletes only the workspace record and navigates to the first remaining workspace", async () => {
    const firstWorkspace = await seedWorkspace("First", "first-root");
    const secondWorkspace = await seedWorkspace("Second", "second-root");

    renderApp(`/workspaces/${secondWorkspace.id}`);

    expect((await screen.findAllByText("Second"))[0]).toBeVisible();

    const actionButtons = await screen.findAllByRole("button", { name: "Workspace actions" });

    fireEvent.click(actionButtons[1] as HTMLElement);
    fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(window.location.pathname).toBe(`/workspaces/${firstWorkspace.id}`);
      expect(screen.queryByText("Second")).not.toBeInTheDocument();
    });
  });

  it("redirects an invalid workspace id to the first workspace", async () => {
    const workspace = await seedWorkspace("Primary", "skills");

    renderApp("/workspaces/missing");

    await waitFor(() => {
      expect(window.location.pathname).toBe(`/workspaces/${workspace.id}`);
    });
  });
});

function renderApp(path = "/") {
  window.history.replaceState(null, "", path);

  return renderWithProviders(<App />);
}

async function openCreateDialog() {
  fireEvent.click(await screen.findByRole("button", { name: "Add workspace" }));
  expect(await screen.findByRole("heading", { name: "Add workspace" })).toBeVisible();
}

async function createWorkspaceThroughUi(name: string, rootName: string) {
  await openCreateDialog();
  fireEvent.change(screen.getByPlaceholderText("My skills"), {
    target: { value: name },
  });
  fireEvent.click(screen.getByRole("button", { name: "Select directory" }));
  expect(await screen.findByText(rootName)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
}

async function seedWorkspace(name: string, rootName: string): Promise<WorkspaceRecord> {
  const repository = createIndexedDbWorkspaceRepository(indexedDb);

  return repository.create({
    name,
    directoryHandle: createCloneableDirectoryHandle(rootName),
  });
}

function createCloneableDirectoryHandle(name: string): FileSystemDirectoryHandle {
  return {
    kind: "directory",
    name,
  } as FileSystemDirectoryHandle;
}
