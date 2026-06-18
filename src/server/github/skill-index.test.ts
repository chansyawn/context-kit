import { describe, expect, it } from "vite-plus/test";

import {
  createCodeSearchQuery,
  createSkillPathPattern,
  isReadableSkillBlob,
  paginateSkillReferences,
  readDirectSkillReferences,
  type SkillReference,
} from "./skill-index";

describe("GitHub skill indexing", () => {
  it("keeps only direct child SKILL.md blobs", () => {
    expect(
      readDirectSkillReferences([
        { path: "alpha/SKILL.md", sha: "alpha", type: "blob" },
        { path: "alpha/reference.md", sha: "reference", type: "blob" },
        { path: "nested/beta/SKILL.md", sha: "nested", type: "blob" },
        { path: "docs", sha: "docs", type: "tree" },
      ]),
    ).toEqual([{ directoryName: "alpha", path: "alpha/SKILL.md", sha: "alpha" }]);
  });

  it("sorts by directory and returns the second page", () => {
    const references: SkillReference[] = Array.from({ length: 21 }, (_, index) => {
      const directoryName = `skill-${String(20 - index).padStart(2, "0")}`;

      return {
        directoryName,
        path: `${directoryName}/SKILL.md`,
        sha: String(index),
      };
    });

    const result = paginateSkillReferences(references, 2, 20);

    expect(result.total).toBe(21);
    expect(result.references.map((reference) => reference.directoryName)).toEqual(["skill-20"]);
  });

  it("anchors search to direct children under the library path", () => {
    const expression = new RegExp(createSkillPathPattern("skills/team"));

    expect(expression.test("skills/team/alpha/SKILL.md")).toBe(true);
    expect(expression.test("skills/team/nested/alpha/SKILL.md")).toBe(false);
    expect(expression.test("other/alpha/SKILL.md")).toBe(false);
  });

  it("anchors root searches to one skill directory", () => {
    const expression = new RegExp(createSkillPathPattern(""));

    expect(expression.test("alpha/SKILL.md")).toBe(true);
    expect(expression.test("skills/alpha/SKILL.md")).toBe(false);
  });

  it("escapes user text and repository paths in code search", () => {
    expect(createCodeSearchQuery("chansyawn/.agents", "skills/v2.0", 'name "demo"')).toBe(
      '"name \\"demo\\"" repo:chansyawn/.agents path:/^skills\\/v2\\.0\\/[^\\/]+\\/SKILL\\.md$/',
    );
  });

  it.each([
    [{ byteSize: 1024, isBinary: false }, 1024, true],
    [{ byteSize: 1025, isBinary: false }, 1024, false],
    [{ byteSize: 10, isBinary: true }, 1024, false],
  ])("selects readable text blobs %#", (metadata, maxByteSize, expected) => {
    expect(isReadableSkillBlob(metadata, maxByteSize)).toBe(expected);
  });
});
