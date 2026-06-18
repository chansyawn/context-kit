import { describe, expect, it } from "vite-plus/test";

import { parseSkillMarkdown } from "./parse-skill";

describe("parseSkillMarkdown", () => {
  it("parses Agent Skills frontmatter and body", () => {
    const parsed = parseSkillMarkdown(
      `---
name: code-review
description: Review code changes before a pull request.
---

# Code Review

Use this skill for reviews.
`,
      { fallbackName: "code-review" },
    );

    expect(parsed.metadata).toMatchObject({
      name: "code-review",
      description: "Review code changes before a pull request.",
      valid: true,
    });
    expect(parsed.body).toBe("# Code Review\n\nUse this skill for reviews.");
  });

  it("keeps a skill visible when required metadata is missing", () => {
    const parsed = parseSkillMarkdown(
      `---
name: broken-skill
---

# Broken
`,
      { fallbackName: "broken-skill" },
    );

    expect(parsed.metadata.name).toBe("broken-skill");
    expect(parsed.metadata.description).toBe("");
    expect(parsed.metadata.valid).toBe(false);
    expect(parsed.metadata.diagnostics).toContainEqual({
      level: "error",
      message: "Missing or invalid description field.",
    });
  });

  it("keeps a skill visible when frontmatter is missing", () => {
    const parsed = parseSkillMarkdown("# No frontmatter", {
      fallbackName: "no-frontmatter",
    });

    expect(parsed.metadata).toMatchObject({
      name: "no-frontmatter",
      description: "",
      valid: false,
    });
    expect(parsed.metadata.diagnostics).toContainEqual({
      level: "error",
      message: "Missing YAML frontmatter.",
    });
    expect(parsed.body).toBe("# No frontmatter");
  });

  it("uses lenient parsing for common unquoted colon metadata", () => {
    const parsed = parseSkillMarkdown(
      `---
name: pdf-tools
description: Use this skill when: the user asks about PDFs
---

# PDF Tools
`,
      { fallbackName: "pdf-tools" },
    );

    expect(parsed.metadata.name).toBe("pdf-tools");
    expect(parsed.metadata.description).toBe("Use this skill when: the user asks about PDFs");
    expect(parsed.metadata.valid).toBe(true);
    expect(parsed.metadata.diagnostics).toContainEqual({
      level: "warning",
      message: "Frontmatter is not valid YAML; loaded name and description with lenient parsing.",
    });
  });

  it("marks completely unparseable frontmatter as invalid metadata", () => {
    const parsed = parseSkillMarkdown(
      `---
[
---

# Broken
`,
      { fallbackName: "broken-yaml" },
    );

    expect(parsed.metadata.name).toBe("broken-yaml");
    expect(parsed.metadata.valid).toBe(false);
    expect(parsed.metadata.diagnostics[0]?.message).toMatch(/^Invalid YAML frontmatter:/);
  });

  it("warns when the metadata does not match Agent Skills naming constraints", () => {
    const parsed = parseSkillMarkdown(
      `---
name: "Invalid Skill Name"
description: Review code.
---
`,
      { fallbackName: "invalid-skill-name" },
    );

    expect(parsed.metadata.valid).toBe(true);
    expect(parsed.metadata.diagnostics).toEqual(
      expect.arrayContaining([
        {
          level: "warning",
          message: "Skill name does not match the parent directory name.",
        },
        {
          level: "warning",
          message: "Skill name should use lowercase letters, numbers, and hyphens.",
        },
      ]),
    );
  });
});
