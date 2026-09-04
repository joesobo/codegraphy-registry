import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import Ajv2020 from "ajv/dist/2020";

const root = join(import.meta.dir, "..");
const schemaNames = ["theme-source", "theme-package", "theme-release", "registry"];
const schemas = await Promise.all(
  schemaNames.map(async (name) =>
    JSON.parse(await readFile(join(root, `schemas/${name}.schema.json`), "utf8")),
  ),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
for (const schema of schemas) ajv.addSchema(schema);
const registry = JSON.parse(await readFile(join(root, "index.json"), "utf8"));
const validateRegistry = ajv.getSchema(schemas[3].$id);
if (!validateRegistry?.(registry))
  throw new Error(`Registry is invalid: ${ajv.errorsText(validateRegistry?.errors)}`);
const ids = new Set<string>();
for (const reference of registry.extensions) {
  if (ids.has(reference.id)) throw new Error(`Duplicate registry ID: ${reference.id}`);
  ids.add(reference.id);
  if (reference.kind !== "theme") continue;
  const localPrefix =
    "https://raw.githubusercontent.com/joesobo/codegraphy-registry/main/themes/";
  if (!reference.releaseUrl.startsWith(localPrefix)) continue;
  const relativePath = reference.releaseUrl.slice(localPrefix.length);
  const release = JSON.parse(await readFile(join(root, "themes", relativePath), "utf8"));
  const validateRelease = ajv.getSchema(schemas[2].$id);
  if (!validateRelease?.(release))
    throw new Error(`${reference.id} release is invalid: ${ajv.errorsText(validateRelease?.errors)}`);
  if (release.manifest.id !== reference.id)
    throw new Error(`${reference.id} release manifest has a different ID`);
  const packageBytes = await readFile(join(root, "dist", basename(new URL(release.url).pathname)));
  const checksum = createHash("sha256").update(packageBytes).digest("hex");
  if (checksum !== release.sha256) throw new Error(`${reference.id} package checksum is stale`);
  const packageValue = JSON.parse(packageBytes.toString("utf8"));
  const validatePackage = ajv.getSchema(schemas[1].$id);
  if (!validatePackage?.(packageValue))
    throw new Error(`${reference.id} package is invalid: ${ajv.errorsText(validatePackage?.errors)}`);
  if (
    packageValue.manifest.id !== release.manifest.id ||
    packageValue.manifest.version !== release.manifest.version
  )
    throw new Error(`${reference.id} package identity does not match its release metadata`);
}
console.log(`Validated ${registry.extensions.length} registry entries.`);
