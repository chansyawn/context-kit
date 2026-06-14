import { readSkillFilesFromRoot } from "@/features/fs/file-system-access";

import { parseSkillMarkdown } from "./parse-skill";
import type { LocalSkill } from "./skill-types";

export async function scanSkillsRoot(rootHandle: FileSystemDirectoryHandle): Promise<LocalSkill[]> {
  const skillFiles = await readSkillFilesFromRoot(rootHandle);
  const skills = skillFiles.map<LocalSkill>((skillFile) => {
    if (skillFile.readError) {
      return {
        id: skillFile.skillFilePath,
        directoryName: skillFile.directoryName,
        rootName: skillFile.rootName,
        relativePath: skillFile.relativePath,
        skillFilePath: skillFile.skillFilePath,
        source: skillFile.source,
        body: "",
        metadata: {
          name: skillFile.directoryName,
          description: "",
          valid: false,
          diagnostics: [
            {
              level: "error",
              message: skillFile.readError,
            },
          ],
          raw: {},
        },
      };
    }

    const parsed = parseSkillMarkdown(skillFile.source, {
      fallbackName: skillFile.directoryName,
      directoryName: skillFile.directoryName,
    });

    return {
      id: skillFile.skillFilePath,
      directoryName: skillFile.directoryName,
      rootName: skillFile.rootName,
      relativePath: skillFile.relativePath,
      skillFilePath: skillFile.skillFilePath,
      source: skillFile.source,
      body: parsed.body,
      metadata: parsed.metadata,
    };
  });

  return skills.sort((left, right) => left.metadata.name.localeCompare(right.metadata.name));
}
