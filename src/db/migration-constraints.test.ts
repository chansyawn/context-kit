import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";

const migration = readFileSync(
  resolve("src/db/drizzle/0000_goofy_steel_serpent.sql"),
  "utf8",
).replaceAll("--> statement-breakpoint", "");

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
  it("keeps repository paths unique within one user", () => {
    insertUser("user-1", "one@example.com");
    insertLibrary("library-1", "user-1");

    expect(() => insertLibrary("library-2", "user-1")).toThrow(/UNIQUE constraint failed/);
  });

  it("allows different users to add the same repository path", () => {
    insertUser("user-1", "one@example.com");
    insertUser("user-2", "two@example.com");
    insertLibrary("library-1", "user-1");
    insertLibrary("library-2", "user-2");

    const row = database.prepare("SELECT count(*) AS count FROM skill_libraries").get() as {
      count: number;
    };

    expect(row.count).toBe(2);
  });

  it("deletes a user's libraries when the user is removed", () => {
    insertUser("user-1", "one@example.com");
    insertLibrary("library-1", "user-1");

    database.prepare("DELETE FROM user WHERE id = ?").run("user-1");

    const row = database.prepare("SELECT count(*) AS count FROM skill_libraries").get() as {
      count: number;
    };

    expect(row.count).toBe(0);
  });
});

function insertUser(id: string, email: string): void {
  database
    .prepare("INSERT INTO user (id, name, email) VALUES (?, ?, ?)")
    .run(id, `User ${id}`, email);
}

function insertLibrary(id: string, userId: string): void {
  database
    .prepare(
      `INSERT INTO skill_libraries (
        id,
        user_id,
        name,
        repository_id,
        repository_owner,
        repository_name,
        path
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(id, userId, "Skills", "123", "owner", "repository", "skills");
}
