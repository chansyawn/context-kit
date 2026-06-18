import { describe, expect, it } from "vite-plus/test";

import { MAX_SKILL_SEARCH_QUERY_LENGTH, normalizeSkillSearchQuery } from "./skill-search";

describe("skill search query", () => {
  it.each(["", " ", "a", " a "])("treats fewer than two characters as browse mode", (query) => {
    expect(normalizeSkillSearchQuery(query)).toBe("");
  });

  it("trims searchable text", () => {
    expect(normalizeSkillSearchQuery("  github skill  ")).toBe("github skill");
  });

  it("limits direct URL input to the server contract", () => {
    const result = normalizeSkillSearchQuery("x".repeat(MAX_SKILL_SEARCH_QUERY_LENGTH + 1));

    expect(result).toHaveLength(MAX_SKILL_SEARCH_QUERY_LENGTH);
  });
});
