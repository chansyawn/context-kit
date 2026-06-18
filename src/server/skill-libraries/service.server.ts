import type { SkillLibrary } from "@/domain/skill-libraries/types";
import { requireSession } from "@/server/auth/session.server";
import { db } from "@/server/db/client";
import { skillLibraries } from "@/server/db/schema";
import { createUserOctokit } from "@/server/github/client.server";
import { formatGithubError } from "@/server/github/github-error";
import { getRepositoryContext, resolveTreeSha } from "@/server/github/repositories.server";
import { and, asc, eq } from "drizzle-orm";

import { normalizeRepositoryPath, validateLibraryName } from "./validation";

export async function listSkillLibraries(): Promise<SkillLibrary[]> {
  const { user } = await requireSession();
  const rows = await db
    .select()
    .from(skillLibraries)
    .where(eq(skillLibraries.userId, user.id))
    .orderBy(asc(skillLibraries.createdAt), asc(skillLibraries.name));

  return rows.map(mapSkillLibrary);
}

export async function createSkillLibrary(input: {
  name: string;
  repositoryId: string;
  path: string;
}): Promise<SkillLibrary> {
  const { user } = await requireSession();
  const octokit = await createUserOctokit();

  try {
    const repository = await getRepositoryContext(octokit, input.repositoryId);
    const path = normalizeRepositoryPath(input.path);
    await resolveTreeSha(octokit, repository, path);
    const [row] = await db
      .insert(skillLibraries)
      .values({
        id: crypto.randomUUID(),
        userId: user.id,
        name: validateLibraryName(input.name),
        repositoryId: repository.id,
        repositoryOwner: repository.owner,
        repositoryName: repository.name,
        path,
      })
      .returning();

    if (!row) {
      throw new Error("Unable to create the skill library.");
    }

    return mapSkillLibrary(row);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new Error("This repository path has already been added.");
    }

    if (isGithubError(error)) {
      throw formatGithubError(error);
    }

    throw error;
  }
}

export async function renameSkillLibrary(libraryId: string, name: string): Promise<SkillLibrary> {
  const { user } = await requireSession();
  const [row] = await db
    .update(skillLibraries)
    .set({ name: validateLibraryName(name), updatedAt: new Date() })
    .where(and(eq(skillLibraries.id, libraryId), eq(skillLibraries.userId, user.id)))
    .returning();

  if (!row) {
    throw new Error("Skill library was not found.");
  }

  return mapSkillLibrary(row);
}

export async function deleteSkillLibrary(libraryId: string): Promise<void> {
  const { user } = await requireSession();
  const rows = await db
    .delete(skillLibraries)
    .where(and(eq(skillLibraries.id, libraryId), eq(skillLibraries.userId, user.id)))
    .returning({ id: skillLibraries.id });

  if (rows.length === 0) {
    throw new Error("Skill library was not found.");
  }
}

export async function getOwnedSkillLibrary(libraryId: string): Promise<SkillLibrary> {
  const { user } = await requireSession();
  const [row] = await db
    .select()
    .from(skillLibraries)
    .where(and(eq(skillLibraries.id, libraryId), eq(skillLibraries.userId, user.id)))
    .limit(1);

  if (!row) {
    throw new Error("Skill library was not found.");
  }

  return mapSkillLibrary(row);
}

function mapSkillLibrary(row: typeof skillLibraries.$inferSelect): SkillLibrary {
  return {
    id: row.id,
    name: row.name,
    repositoryId: row.repositoryId,
    repositoryOwner: row.repositoryOwner,
    repositoryName: row.repositoryName,
    path: row.path,
    rootName: row.path.split("/").filter(Boolean).at(-1) ?? row.repositoryName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("UNIQUE constraint failed");
}

function isGithubError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "status" in error;
}
