import { App } from "@/app/app";
import { createIndexedDbSkillLibraryRepository } from "@/features/skill-libraries/skill-library-store";
import type { SkillLibraryRecord } from "@/features/skill-libraries/skill-library-types";
import { mockMatchMedia } from "@/test/events";
import { renderWithProviders } from "@/test/render";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

let indexedDb: IDBFactory;
let uuidCounter: number;

describe("skill library routes", () => {
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

  it("redirects root to the skill library landing route", async () => {
    renderApp();

    await waitFor(() => {
      expect(window.location.pathname).toBe("/skill-libraries");
    });
  });

  it("shows an empty skill library state without the old main directory picker CTA", async () => {
    renderApp("/skill-libraries");

    expect(await screen.findByText("No skill libraries yet")).toBeVisible();
    expect(screen.getByText("No skill libraries")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Choose skills directory" }),
    ).not.toBeInTheDocument();
  });

  it("requires a skill library name and directory before saving", async () => {
    window.showDirectoryPicker = vi.fn(async () => createCloneableDirectoryHandle("skills"));

    renderApp("/skill-libraries");
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

  it("persists a skill library after provider remount", async () => {
    window.showDirectoryPicker = vi.fn(async () => createCloneableDirectoryHandle("skills"));

    const { unmount } = renderApp("/skill-libraries");

    await createSkillLibraryThroughUi("Primary", "skills");

    expect((await screen.findAllByText("Primary"))[0]).toBeVisible();

    unmount();
    renderApp("/skill-libraries");

    expect((await screen.findAllByText("Primary"))[0]).toBeVisible();
  });

  it("renames a skill library without changing the route", async () => {
    const skillLibrary = await seedSkillLibrary("Primary", "skills");

    renderApp(`/skill-libraries/${skillLibrary.id}`);

    expect((await screen.findAllByText("Primary"))[0]).toBeVisible();

    fireEvent.click(await screen.findByRole("button", { name: "Skill library actions" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Rename" }));
    fireEvent.change(screen.getByDisplayValue("Primary"), {
      target: { value: "Renamed" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect((await screen.findAllByText("Renamed"))[0]).toBeVisible();
    expect(window.location.pathname).toBe(`/skill-libraries/${skillLibrary.id}`);
  });

  it("deletes only the skill library record and navigates to the first remaining skill library", async () => {
    const firstSkillLibrary = await seedSkillLibrary("First", "first-root");
    const secondSkillLibrary = await seedSkillLibrary("Second", "second-root");

    renderApp(`/skill-libraries/${secondSkillLibrary.id}`);

    expect((await screen.findAllByText("Second"))[0]).toBeVisible();

    const actionButtons = await screen.findAllByRole("button", { name: "Skill library actions" });

    fireEvent.click(actionButtons[1] as HTMLElement);
    fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(window.location.pathname).toBe(`/skill-libraries/${firstSkillLibrary.id}`);
      expect(screen.queryByText("Second")).not.toBeInTheDocument();
    });
  });

  it("redirects an invalid skill library id to the first skill library", async () => {
    const skillLibrary = await seedSkillLibrary("Primary", "skills");

    renderApp("/skill-libraries/missing");

    await waitFor(() => {
      expect(window.location.pathname).toBe(`/skill-libraries/${skillLibrary.id}`);
    });
  });

  it("redirects the skill library landing route to the first skill library", async () => {
    const skillLibrary = await seedSkillLibrary("Primary", "skills");

    renderApp("/skill-libraries");

    await waitFor(() => {
      expect(window.location.pathname).toBe(`/skill-libraries/${skillLibrary.id}`);
    });
  });
});

function renderApp(path = "/") {
  window.history.replaceState(null, "", path);

  return renderWithProviders(<App />);
}

async function openCreateDialog() {
  fireEvent.click(await screen.findByRole("button", { name: "Add skill library" }));
  expect(await screen.findByRole("heading", { name: "Add skill library" })).toBeVisible();
}

async function createSkillLibraryThroughUi(name: string, rootName: string) {
  await openCreateDialog();
  fireEvent.change(screen.getByPlaceholderText("My skills"), {
    target: { value: name },
  });
  fireEvent.click(screen.getByRole("button", { name: "Select directory" }));
  expect(await screen.findByText(rootName)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
}

async function seedSkillLibrary(name: string, rootName: string): Promise<SkillLibraryRecord> {
  const repository = createIndexedDbSkillLibraryRepository(indexedDb);

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
