import { describe, expect, it } from "vite-plus/test";

import {
  normalizeRepositoryPath,
  parseCreateLibraryInput,
  parseSkillPageInput,
  validateLibraryName,
} from "./validation";

describe("skill library validation", () => {
  it("normalizes repository paths", () => {
    expect(normalizeRepositoryPath(" /skills//team/ ")).toBe("skills/team");
    expect(normalizeRepositoryPath("\\skills\\team\\")).toBe("skills/team");
    expect(normalizeRepositoryPath("/ ")).toBe("");
  });

  it("rejects traversal segments", () => {
    expect(() => normalizeRepositoryPath("skills/../private")).toThrow(
      "Repository path contains an invalid segment.",
    );
  });

  it("validates create input", () => {
    expect(
      parseCreateLibraryInput({
        name: "  Agent skills ",
        repositoryId: "1257129942",
        path: "/skills/",
      }),
    ).toEqual({
      name: "Agent skills",
      repositoryId: "1257129942",
      path: "skills",
    });
  });

  it("enforces name and search limits", () => {
    expect(() => validateLibraryName(" ")).toThrow("Skill library name is required.");
    expect(() => parseSkillPageInput({ libraryId: "library", page: 1, query: "a" })).toThrow(
      "Search query must contain at least 2 characters.",
    );
  });

  it("requires positive page numbers", () => {
    expect(() => parseSkillPageInput({ libraryId: "library", page: 0 })).toThrow(
      "Page must be a positive integer.",
    );
  });
});
