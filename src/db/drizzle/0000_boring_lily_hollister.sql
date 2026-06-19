CREATE TABLE `github_user_authorizations` (
	`clerk_user_id` text PRIMARY KEY NOT NULL,
	`github_user_id` text NOT NULL,
	`github_login` text NOT NULL,
	`github_avatar_url` text,
	`encrypted_access_token` text NOT NULL,
	`access_token_expires_at` integer,
	`encrypted_refresh_token` text,
	`refresh_token_expires_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `github_user_authorizations_github_user_id_idx` ON `github_user_authorizations` (`github_user_id`);--> statement-breakpoint
CREATE TABLE `skill_libraries` (
	`id` text PRIMARY KEY NOT NULL,
	`clerk_user_id` text NOT NULL,
	`name` text NOT NULL,
	`repository_id` text NOT NULL,
	`repository_owner` text NOT NULL,
	`repository_name` text NOT NULL,
	`path` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `skill_libraries_clerk_user_id_idx` ON `skill_libraries` (`clerk_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `skill_libraries_user_repository_path_idx` ON `skill_libraries` (`clerk_user_id`,`repository_id`,`path`);