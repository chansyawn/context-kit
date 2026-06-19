import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestampDefault = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

export const skillLibraries = sqliteTable(
  "skill_libraries",
  {
    id: text("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    name: text("name").notNull(),
    repositoryId: text("repository_id").notNull(),
    repositoryOwner: text("repository_owner").notNull(),
    repositoryName: text("repository_name").notNull(),
    path: text("path").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(timestampDefault).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(timestampDefault)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("skill_libraries_clerk_user_id_idx").on(table.clerkUserId),
    uniqueIndex("skill_libraries_user_repository_path_idx").on(
      table.clerkUserId,
      table.repositoryId,
      table.path,
    ),
  ],
);

export const githubUserAuthorizations = sqliteTable(
  "github_user_authorizations",
  {
    clerkUserId: text("clerk_user_id").primaryKey(),
    githubUserId: text("github_user_id").notNull(),
    githubLogin: text("github_login").notNull(),
    githubAvatarUrl: text("github_avatar_url"),
    encryptedAccessToken: text("encrypted_access_token").notNull(),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    encryptedRefreshToken: text("encrypted_refresh_token"),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(timestampDefault).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(timestampDefault)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("github_user_authorizations_github_user_id_idx").on(table.githubUserId)],
);
