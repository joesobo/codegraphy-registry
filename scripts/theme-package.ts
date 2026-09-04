import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import Ajv2020, { type ValidateFunction } from "ajv/dist/2020";
import { validateThemeCss } from "./css";

const registryRoot = join(import.meta.dir, "..");
const schemas = await Promise.all(
  ["theme-source", "theme-package", "theme-release", "theme-setting"].map(async (name) =>
    JSON.parse(await readFile(join(registryRoot, `schemas/${name}.schema.json`), "utf8")),
  ),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
for (const schema of schemas) ajv.addSchema(schema);

interface SourceManifest {
  $schema?: string;
  formatVersion: 1;
  kind: "theme";
  id: string;
  name: string;
  version: string;
  minimumCodeGraphyVersion: string;
  description: string;
  author: string;
  repository: string;
  license: string;
  keywords: string[];
  modes: ("light" | "dark")[];
  settings: ThemeSetting[];
  previews: Partial<Record<"light" | "dark", string>>;
}

type ThemeSetting = {
  type: "color" | "text" | "number" | "toggle";
  id: string;
  name: string;
  description: string;
  cssVariable: string;
  default: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
};

interface PackageManifest extends Omit<SourceManifest, "$schema" | "previews"> {
  previews: Partial<Record<"light" | "dark", string>>;
}
type PreviewMediaType = "image/png" | "image/jpeg" | "image/webp";

export interface ThemeRelease {
  formatVersion: 1;
  manifest: PackageManifest;
  url: string;
  sha256: string;
  releaseNotes: string;
}

export interface ThemeBuildOptions {
  outputDirectory: string;
  packageUrl?: string;
  releaseNotes?: string;
  releasePath?: string;
}

function assertValid<T>(validator: ValidateFunction<T>, value: unknown, label: string): asserts value is T {
  if (validator(value)) return;
  const details = validator.errors
    ?.map((error) => `${error.instancePath || "value"} ${error.message}`)
    .join(", ");
  throw new Error(`${label} is invalid: ${details ?? "unknown validation error"}`);
}

function httpsUrl(value: string, label: string): void {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be an HTTPS URL`);
  }
  if (url.protocol !== "https:") throw new Error(`${label} must be an HTTPS URL`);
}

function validateThemeSettings(settings: ThemeSetting[]): void {
  const ids = new Set<string>();
  const variables = new Set<string>();
  for (const setting of settings) {
    if (ids.has(setting.id) || variables.has(setting.cssVariable))
      throw new Error("Theme setting IDs and CSS variables must be unique");
    ids.add(setting.id);
    variables.add(setting.cssVariable);
    if (
      setting.type === "number" &&
      (typeof setting.default !== "number" ||
        typeof setting.min !== "number" ||
        typeof setting.max !== "number" ||
        typeof setting.step !== "number" ||
        setting.min > setting.default ||
        setting.default > setting.max ||
        setting.step <= 0)
    )
      throw new Error("Theme number settings require min <= default <= max and a positive step");
  }
}

async function embeddedPreview(directory: string, filename: string): Promise<string> {
  if (basename(filename) !== filename)
    throw new Error("Theme previews must name images in the theme source directory");
  const previewPath = join(directory, filename);
  const previewInfo = await stat(previewPath);
  if (!previewInfo.isFile() || previewInfo.size === 0 || previewInfo.size > 1_500_000)
    throw new Error("Each theme preview must be a non-empty file below 1.5 MB");
  const mediaType = new Map<string, PreviewMediaType>([
    [".png", "image/png"],
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
    [".webp", "image/webp"],
  ]).get(extname(filename).toLowerCase());
  if (!mediaType) throw new Error("Theme previews must be PNG, JPEG, or WebP images");
  const previewBytes = await readFile(previewPath);
  const signatures = {
    "image/png": previewBytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")),
    "image/jpeg": previewBytes.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex")),
    "image/webp":
      previewBytes.subarray(0, 4).toString("ascii") === "RIFF" &&
      previewBytes.subarray(8, 12).toString("ascii") === "WEBP",
  };
  if (!signatures[mediaType]) throw new Error(`Theme preview is not a valid ${mediaType} file`);
  return `data:${mediaType};base64,${previewBytes.toString("base64")}`;
}

export async function buildTheme(
  sourceDirectory: string,
  options: ThemeBuildOptions,
): Promise<{ filename: string; packageText: string; release?: ThemeRelease }> {
  const directory = resolve(sourceDirectory);
  const source: unknown = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8"));
  const validateSource = ajv.getSchema<SourceManifest>(schemas[0].$id);
  const validatePackage = ajv.getSchema(schemas[1].$id);
  const validateRelease = ajv.getSchema<ThemeRelease>(schemas[2].$id);
  if (!validateSource || !validatePackage || !validateRelease)
    throw new Error("Theme schemas did not load");
  assertValid(validateSource, source, "Theme source manifest");
  httpsUrl(source.repository, "Theme repository");
  validateThemeSettings(source.settings);
  const previewModes = Object.keys(source.previews).sort();
  if (
    previewModes.length !== source.modes.length ||
    ![...source.modes].sort().every((mode, index) => mode === previewModes[index])
  )
    throw new Error("Theme previews must match the declared light and dark modes");
  const previews = Object.fromEntries(
    await Promise.all(
      source.modes.map(async (mode) => [mode, await embeddedPreview(directory, source.previews[mode]!)]),
    ),
  );

  const license = await stat(join(directory, "LICENSE"));
  if (!license.isFile() || license.size === 0)
    throw new Error("Theme source must contain a non-empty LICENSE file");

  const css = await readFile(join(directory, "theme.css"), "utf8");
  if (Buffer.byteLength(css) > 4 * 1024 * 1024) throw new Error("Theme CSS exceeds 4 MiB");
  validateThemeCss(css);
  const { $schema: _schema, previews: _previews, ...metadata } = source;
  const manifest: PackageManifest = {
    ...metadata,
    previews,
  };
  const packageValue = { manifest, css };
  assertValid(validatePackage, packageValue, "Theme package");
  const packageText = `${JSON.stringify(packageValue, null, 2)}\n`;
  if (Buffer.byteLength(packageText) > 8 * 1024 * 1024)
    throw new Error("Theme package exceeds 8 MiB");
  const filename = `${manifest.id}-${manifest.version}.codegraphy-extension.json`;
  await mkdir(resolve(options.outputDirectory), { recursive: true });
  await writeFile(join(resolve(options.outputDirectory), filename), packageText);

  if (!options.packageUrl) return { filename, packageText };
  httpsUrl(options.packageUrl, "Package URL");
  const release: ThemeRelease = {
    formatVersion: 1,
    manifest,
    url: options.packageUrl,
    sha256: createHash("sha256").update(packageText).digest("hex"),
    releaseNotes: options.releaseNotes ?? "",
  };
  assertValid(validateRelease, release, "Theme release metadata");
  if (options.releasePath) {
    await mkdir(resolve(options.releasePath, ".."), { recursive: true });
    await writeFile(resolve(options.releasePath), `${JSON.stringify(release, null, 2)}\n`);
  }
  return { filename, packageText, release };
}

function option(arguments_: string[], name: string): string | undefined {
  const index = arguments_.indexOf(name);
  if (index === -1) return undefined;
  const value = arguments_[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

if (Bun.main === import.meta.path) {
  const arguments_ = process.argv.slice(2);
  const sourceDirectory = arguments_[0];
  if (!sourceDirectory || sourceDirectory.startsWith("--"))
    throw new Error(
      "Usage: bun run theme:build <theme-directory> [--output <directory>] [--package-url <https-url>] [--release-notes-file <file>] [--release-file <file>]",
    );
  const releaseNotesPath = option(arguments_, "--release-notes-file");
  const result = await buildTheme(sourceDirectory, {
    outputDirectory: option(arguments_, "--output") ?? join(sourceDirectory, "dist"),
    packageUrl: option(arguments_, "--package-url"),
    releaseNotes: releaseNotesPath ? await readFile(resolve(releaseNotesPath), "utf8") : undefined,
    releasePath: option(arguments_, "--release-file"),
  });
  console.log(`Built ${result.filename}`);
  if (result.release) console.log(`SHA-256 ${result.release.sha256}`);
}
