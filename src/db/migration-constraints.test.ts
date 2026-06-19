import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

const migration = readdirSync(resolve("src/db/drizzle"))
  .filter((fileName) => fileName.endsWith(".sql"))
  .sort()
  .map((fileName) => readFileSync(resolve("src/db/drizzle", fileName), "utf8"))
  .join("\n")
  .replaceAll("--> statement-breakpoint", "");

let database: DatabaseSync;

beforeEach(() => {
  database = new DatabaseSync(":memory:");
  database.exec("PRAGMA foreign_keys = ON");
  database.exec(migration);
});

afterEach(() => {
  database.close();
});

describe("D1 migration constraints", () => {
  it("keeps repository paths unique within one Clerk user", () => {
    insertLibrary("library-1", "user-1");

    expect(() => insertLibrary("library-2", "user-1")).toThrow(/UNIQUE constraint failed/);
  });

  it("allows different Clerk users to add the same repository path", () => {
    insertLibrary("library-1", "user-1");
    insertLibrary("library-2", "user-2");

    const row = database.prepare("SELECT count(*) AS count FROM skill_libraries").get() as {
      count: number;
    };

    expect(row.count).toBe(2);
  });
});

function insertLibrary(id: string, clerkUserId: string): void {
  database
    .prepare(
      `INSERT INTO skill_libraries (
        id,
        clerk_user_id,
        name,
        repository_id,
        repository_owner,
        repository_name,
        path
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(id, clerkUserId, "Skills", "123", "owner", "repository", "skills");
}
