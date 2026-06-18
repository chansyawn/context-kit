export type SkillDiagnosticLevel = "warning" | "error";

export type SkillDiagnostic = {
  level: SkillDiagnosticLevel;
  message: string;
};

export type SkillMetadata = {
  name: string;
  description: string;
  valid: boolean;
  diagnostics: SkillDiagnostic[];
  raw: Record<string, unknown>;
};

export type ParsedSkillMarkdown = {
  metadata: SkillMetadata;
  body: string;
};

export type LocalSkill = {
  id: string;
  directoryName: string;
  rootName: string;
  relativePath: string;
  skillFilePath: string;
  source: string;
  body: string;
  metadata: SkillMetadata;
};
