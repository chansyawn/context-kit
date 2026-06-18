import { parse as parseYaml } from "yaml";

import type { ParsedSkillMarkdown, SkillDiagnostic, SkillMetadata } from "./skill-types";

type ParseSkillOptions = {
  fallbackName: string;
  directoryName?: string;
};

type FrontmatterParts = {
  frontmatter: string;
  body: string;
};

const FRONTMATTER_DELIMITER = "---";
const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parseSkillMarkdown(
  source: string,
  { fallbackName, directoryName = fallbackName }: ParseSkillOptions,
): ParsedSkillMarkdown {
  const parts = extractFrontmatter(source);

  if (!parts) {
    return {
      metadata: createInvalidMetadata(fallbackName, [
        {
          level: "error",
          message: "Missing YAML frontmatter.",
        },
      ]),
      body: source.trim(),
    };
  }

  const parsedFrontmatter = parseFrontmatter(parts.frontmatter);

  if (!parsedFrontmatter.raw) {
    return {
      metadata: createInvalidMetadata(fallbackName, parsedFrontmatter.diagnostics),
      body: parts.body,
    };
  }

  return {
    metadata: createSkillMetadata(parsedFrontmatter.raw, {
      diagnostics: parsedFrontmatter.diagnostics,
      directoryName,
      fallbackName,
    }),
    body: parts.body,
  };
}

function extractFrontmatter(source: string): FrontmatterParts | null {
  const content = source.startsWith("\uFEFF") ? source.slice(1) : source;
  const firstLineEnd = findLineEnd(content, 0);
  const firstLine = content.slice(0, firstLineEnd.lineEnd);

  if (firstLine.trim() !== FRONTMATTER_DELIMITER) {
    return null;
  }

  let lineStart = firstLineEnd.nextLineStart;

  while (lineStart < content.length) {
    const { lineEnd, nextLineStart } = findLineEnd(content, lineStart);
    const line = content.slice(lineStart, lineEnd);

    if (line.trim() === FRONTMATTER_DELIMITER) {
      return {
        frontmatter: content.slice(firstLineEnd.nextLineStart, lineStart),
        body: content.slice(nextLineStart).trim(),
      };
    }

    lineStart = nextLineStart;
  }

  return null;
}

function findLineEnd(
  content: string,
  lineStart: number,
): { lineEnd: number; nextLineStart: number } {
  const lineFeedIndex = content.indexOf("\n", lineStart);

  if (lineFeedIndex === -1) {
    return {
      lineEnd: trimCarriageReturn(content, content.length),
      nextLineStart: content.length,
    };
  }

  return {
    lineEnd: trimCarriageReturn(content, lineFeedIndex),
    nextLineStart: lineFeedIndex + 1,
  };
}

function trimCarriageReturn(content: string, lineEnd: number): number {
  return lineEnd > 0 && content[lineEnd - 1] === "\r" ? lineEnd - 1 : lineEnd;
}

function parseFrontmatter(frontmatter: string): {
  raw: Record<string, unknown> | null;
  diagnostics: SkillDiagnostic[];
} {
  try {
    const parsed = parseYaml(frontmatter);

    if (!isRecord(parsed)) {
      return {
        raw: null,
        diagnostics: [
          {
            level: "error",
            message: "YAML frontmatter must be a mapping.",
          },
        ],
      };
    }

    return {
      raw: parsed,
      diagnostics: [],
    };
  } catch (error) {
    const lenientRaw = parseLenientTopLevelMetadata(frontmatter);

    if (lenientRaw) {
      return {
        raw: lenientRaw,
        diagnostics: [
          {
            level: "warning",
            message:
              "Frontmatter is not valid YAML; loaded name and description with lenient parsing.",
          },
        ],
      };
    }

    return {
      raw: null,
      diagnostics: [
        {
          level: "error",
          message: `Invalid YAML frontmatter: ${formatParseError(error)}`,
        },
      ],
    };
  }
}

function parseLenientTopLevelMetadata(frontmatter: string): Record<string, unknown> | null {
  const raw: Record<string, unknown> = {};

  for (const line of frontmatter.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (trimmedLine === "" || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf(":");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();

    if (key === "name" || key === "description") {
      raw[key] = trimYamlLikeQuotes(value);
    }
  }

  return typeof raw.name === "string" || typeof raw.description === "string" ? raw : null;
}

function trimYamlLikeQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function createSkillMetadata(
  raw: Record<string, unknown>,
  {
    diagnostics,
    directoryName,
    fallbackName,
  }: {
    diagnostics: SkillDiagnostic[];
    directoryName: string;
    fallbackName: string;
  },
): SkillMetadata {
  const nextDiagnostics = [...diagnostics];
  const name = readRequiredString(raw.name, "name", fallbackName, nextDiagnostics);
  const description = readRequiredString(raw.description, "description", "", nextDiagnostics);

  if (name.length > 64) {
    nextDiagnostics.push({
      level: "warning",
      message: "Skill name exceeds 64 characters.",
    });
  }

  if (name !== fallbackName && name !== directoryName) {
    nextDiagnostics.push({
      level: "warning",
      message: "Skill name does not match the parent directory name.",
    });
  }

  if (!SKILL_NAME_PATTERN.test(name)) {
    nextDiagnostics.push({
      level: "warning",
      message: "Skill name should use lowercase letters, numbers, and hyphens.",
    });
  }

  if (description.length > 1024) {
    nextDiagnostics.push({
      level: "warning",
      message: "Skill description exceeds 1024 characters.",
    });
  }

  return {
    name,
    description,
    valid: nextDiagnostics.every((diagnostic) => diagnostic.level !== "error"),
    diagnostics: nextDiagnostics,
    raw,
  };
}

function readRequiredString(
  value: unknown,
  fieldName: "name" | "description",
  fallbackValue: string,
  diagnostics: SkillDiagnostic[],
): string {
  if (typeof value !== "string" || value.trim() === "") {
    diagnostics.push({
      level: "error",
      message: `Missing or invalid ${fieldName} field.`,
    });

    return fallbackValue;
  }

  return value.trim();
}

function createInvalidMetadata(
  fallbackName: string,
  diagnostics: SkillDiagnostic[],
): SkillMetadata {
  return {
    name: fallbackName,
    description: "",
    valid: false,
    diagnostics,
    raw: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatParseError(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return "Unable to parse YAML.";
}
