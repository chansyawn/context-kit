import { spawnSync } from "node:child_process";
import { prepareCloudflare, readCloudflareTarget } from "./prepare.ts";

function applyMigrations(): void {
  const target = readCloudflareTarget();

  prepareCloudflare({
    environment: target.environment,
    includeTypes: false,
  });

  const args = [
    "exec",
    "wrangler",
    "d1",
    "migrations",
    "apply",
    target.databaseName,
    target.migrationMode === "remote" ? "--remote" : "--local",
  ];

  if (target.migrationMode === "remote") {
    args.push("--yes");
  }

  const result = spawnSync("vp", args, { stdio: "inherit" });

  if (result.error !== undefined) {
    throw result.error;
  }

  if (result.status !== null && result.status !== 0) {
    process.exitCode = result.status;
  }
}

try {
  applyMigrations();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
