import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseEnv } from "node:util";

const placeholderD1DatabaseId = "00000000-0000-0000-0000-000000000000";
const prepareStateVersion = 1;
const appEnvironmentVariable = "CONTEXT_KIT_ENV";
const d1DatabaseIdVariable = "CONTEXT_KIT_D1_DATABASE_ID";

const dotenvPath = ".env";
const wranglerTemplatePath = "wrangler.template.jsonc";
const wranglerConfigPath = "wrangler.jsonc";
const generatedTypesPath = ".wrangler/types/worker-configuration.d.ts";
const typegenEnvPath = ".wrangler/types/typegen.env";
const prepareStatePath = ".wrangler/cloudflare-prepare-state.json";

export type CloudflareEnvironment = "development" | "production";

export type CloudflareTarget = {
  environment: CloudflareEnvironment;
  databaseName: string;
  databaseId: string;
  migrationMode: "local" | "remote";
};

type WranglerConfigValues = {
  databaseName: string;
  databaseId: string;
};

type WranglerConfigResult = {
  environment: CloudflareEnvironment;
  content: string;
  contentHash: string;
  path: string;
};

type PrepareOptions = {
  environment?: CloudflareEnvironment;
  includeTypes?: boolean;
  silent?: boolean;
};

type PrepareState = {
  version: number;
  types?: {
    fingerprint: string;
    outputMtimeMs: number;
    outputSize: number;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hashString(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function loadDotenvFile(): void {
  if (!existsSync(dotenvPath)) {
    return;
  }

  const parsedEnv = parseEnv(readFileSync(dotenvPath, "utf8"));

  for (const [key, value] of Object.entries(parsedEnv)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function parseCloudflareEnvironment(value: string | undefined): CloudflareEnvironment {
  if (value === undefined || value === "") {
    return "development";
  }

  if (value === "development" || value === "production") {
    return value;
  }

  throw new Error(`Expected ${appEnvironmentVariable} to be "development" or "production".`);
}

export function readCloudflareEnvironmentFromProcess(): CloudflareEnvironment {
  return parseCloudflareEnvironment(process.env[appEnvironmentVariable]?.trim());
}

export function readCloudflareTarget(
  environment = readCloudflareEnvironmentFromProcess(),
): CloudflareTarget {
  if (environment === "development") {
    return {
      environment,
      databaseName: "context-kit-local",
      databaseId: placeholderD1DatabaseId,
      migrationMode: "local",
    };
  }

  const databaseId = process.env[d1DatabaseIdVariable]?.trim() ?? "";

  if (databaseId === "" || databaseId === placeholderD1DatabaseId) {
    throw new Error(`${d1DatabaseIdVariable} must be set to the production D1 database id.`);
  }

  return {
    environment,
    databaseName: "context-kit-production",
    databaseId,
    migrationMode: "remote",
  };
}

function readWranglerConfigValues(environment: CloudflareEnvironment): WranglerConfigValues {
  const target = readCloudflareTarget(environment);

  return {
    databaseName: target.databaseName,
    databaseId: target.databaseId,
  };
}

function renderTemplate(template: string, values: WranglerConfigValues): string {
  return template
    .replaceAll("__D1_DATABASE_NAME__", values.databaseName)
    .replaceAll("__D1_DATABASE_ID__", values.databaseId);
}

function readPrepareState(): PrepareState {
  if (!existsSync(prepareStatePath)) {
    return { version: prepareStateVersion };
  }

  try {
    const value: unknown = JSON.parse(readFileSync(prepareStatePath, "utf8"));

    if (!isRecord(value) || value.version !== prepareStateVersion) {
      return { version: prepareStateVersion };
    }

    const state: PrepareState = { version: prepareStateVersion };

    if (isRecord(value.types)) {
      const { fingerprint, outputMtimeMs, outputSize } = value.types;

      if (
        typeof fingerprint === "string" &&
        typeof outputMtimeMs === "number" &&
        typeof outputSize === "number"
      ) {
        state.types = { fingerprint, outputMtimeMs, outputSize };
      }
    }

    return state;
  } catch {
    return { version: prepareStateVersion };
  }
}

function writePrepareState(state: PrepareState): void {
  mkdirSync(dirname(prepareStatePath), { recursive: true });
  writeFileSync(prepareStatePath, `${JSON.stringify(state, null, 2)}\n`);
}

function readWranglerPackageVersion(): string {
  const packagePath = resolve("node_modules/wrangler/package.json");

  if (!existsSync(packagePath)) {
    return "missing";
  }

  try {
    const value: unknown = JSON.parse(readFileSync(packagePath, "utf8"));

    if (isRecord(value) && typeof value.version === "string") {
      return value.version;
    }
  } catch {
    return "unknown";
  }

  return "unknown";
}

export function ensureWranglerConfig(options: PrepareOptions = {}): WranglerConfigResult {
  const environment = options.environment ?? readCloudflareEnvironmentFromProcess();
  const values = readWranglerConfigValues(environment);
  const template = readFileSync(wranglerTemplatePath, "utf8");
  const content = renderTemplate(template, values);
  const existingContent = existsSync(wranglerConfigPath)
    ? readFileSync(wranglerConfigPath, "utf8")
    : null;

  if (existingContent !== content) {
    writeFileSync(wranglerConfigPath, content);

    if (!options.silent) {
      console.log(`Generated ${wranglerConfigPath} for ${environment}.`);
    }
  }

  return {
    environment,
    content,
    contentHash: hashString(content),
    path: wranglerConfigPath,
  };
}

function createTypesFingerprint(config: WranglerConfigResult): string {
  return hashString(
    JSON.stringify({
      version: prepareStateVersion,
      environment: config.environment,
      wranglerConfigHash: config.contentHash,
      wranglerPackageVersion: readWranglerPackageVersion(),
      outputPath: generatedTypesPath,
    }),
  );
}

function areGeneratedTypesCurrent(fingerprint: string, state: PrepareState): boolean {
  if (!existsSync(generatedTypesPath) || state.types?.fingerprint !== fingerprint) {
    return false;
  }

  const outputStat = statSync(generatedTypesPath);

  return (
    state.types.outputMtimeMs === outputStat.mtimeMs && state.types.outputSize === outputStat.size
  );
}

function runWranglerTypes(config: WranglerConfigResult): void {
  mkdirSync(dirname(generatedTypesPath), { recursive: true });
  writeFileSync(typegenEnvPath, "");

  const args = [
    "exec",
    "wrangler",
    "types",
    generatedTypesPath,
    "--config",
    config.path,
    "--env-file",
    typegenEnvPath,
  ];

  const result = spawnSync("vp", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error !== undefined) {
    throw result.error;
  }

  if (result.status !== 0) {
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
    throw new Error(output === "" ? "wrangler types failed." : output);
  }
}

function ensureCloudflareTypes(config: WranglerConfigResult, options: PrepareOptions): void {
  const state = readPrepareState();
  const fingerprint = createTypesFingerprint(config);

  if (areGeneratedTypesCurrent(fingerprint, state)) {
    return;
  }

  runWranglerTypes(config);

  const outputStat = statSync(generatedTypesPath);

  writePrepareState({
    ...state,
    version: prepareStateVersion,
    types: {
      fingerprint,
      outputMtimeMs: outputStat.mtimeMs,
      outputSize: outputStat.size,
    },
  });

  if (!options.silent) {
    console.log(`Generated ${generatedTypesPath}.`);
  }
}

export function prepareCloudflare(options: PrepareOptions = {}): void {
  const config = ensureWranglerConfig(options);

  if (options.includeTypes ?? true) {
    ensureCloudflareTypes(config, options);
  }
}

function isDirectRun(): boolean {
  const scriptPath = process.argv[1];

  if (scriptPath === undefined) {
    return false;
  }

  return pathToFileURL(resolve(scriptPath)).href === import.meta.url;
}

function assertNoCliArguments(argv: string[]): void {
  if (argv.length === 0) {
    return;
  }

  throw new Error(`Set ${appEnvironmentVariable}=development|production instead of passing args.`);
}

loadDotenvFile();

if (isDirectRun()) {
  try {
    assertNoCliArguments(process.argv.slice(2));
    prepareCloudflare();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
