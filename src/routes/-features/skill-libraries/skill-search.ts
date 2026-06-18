export const MAX_SKILL_SEARCH_QUERY_LENGTH = 100;

export function normalizeSkillSearchQuery(query: string): string {
  const normalized = query.trim().slice(0, MAX_SKILL_SEARCH_QUERY_LENGTH);

  return normalized.length >= 2 ? normalized : "";
}
