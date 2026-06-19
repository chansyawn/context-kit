import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const placeholderD1DatabaseId = "00000000-0000-0000-0000-000000000000";

type DeployEnvironment = "development" | "production";

type WranglerConfigValues = {
  databaseName: string;
  databaseId: string;
};

function readDeployEnvironment(argv: string[]): DeployEnvironment {
  const envFlagIndex = argv.indexOf("--env");
  const envValue = envFlagIndex === -1 ? "development" : argv.at(envFlagIndex + 1);

  if (envValue === "development" || envValue === "production") {
    return envValue;
  }

  throw new Error('Expected "--env development" or "--env production".');
}

function readWranglerConfigValues(environment: DeployEnvironment): WranglerConfigValues {
  if (environment === "development") {
    return {
      databaseName: "context-kit-local",
      databaseId: placeholderD1DatabaseId,
    };
  }

  const databaseId = process.env.CONTEXT_KIT_PRODUCTION_D1_DATABASE_ID?.trim() ?? "";

  if (databaseId === "" || databaseId === placeholderD1DatabaseId) {
    throw new Error(
      "CONTEXT_KIT_PRODUCTION_D1_DATABASE_ID must be set to the production D1 database id.",
    );
  }

  return {
    databaseName: "context-kit-production",
    databaseId,
  };
}

function renderTemplate(template: string, values: WranglerConfigValues): string {
  return template
    .replaceAll("__D1_DATABASE_NAME__", values.databaseName)
    .replaceAll("__D1_DATABASE_ID__", values.databaseId);
}

function main(): void {
  const environment = readDeployEnvironment(process.argv.slice(2));
  const values = readWranglerConfigValues(environment);
  const templatePath = resolve("wrangler.template.jsonc");
  const outputPath = resolve("wrangler.jsonc");
  const template = readFileSync(templatePath, "utf8");

  writeFileSync(outputPath, renderTemplate(template, values));
  console.log(`Generated wrangler.jsonc for ${environment}.`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
