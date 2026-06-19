import { spawnSync } from "node:child_process";
import { prepareCloudflare, readCloudflareEnvironmentFromProcess } from "./prepare.ts";

function runCommand(args: string[]): void {
  const result = spawnSync("vp", args, { stdio: "inherit" });

  if (result.error !== undefined) {
    throw result.error;
  }

  if (result.status !== null && result.status !== 0) {
    process.exit(result.status);
  }
}

function deploy(): void {
  const environment = readCloudflareEnvironmentFromProcess();

  if (environment !== "production") {
    throw new Error("Deploy requires CONTEXT_KIT_ENV=production.");
  }

  prepareCloudflare({ environment });
  runCommand(["build"]);
  runCommand(["run", "db:migrate"]);
  runCommand(["exec", "wrangler", "deploy"]);
}

try {
  deploy();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
