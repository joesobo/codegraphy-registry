import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { buildTheme } from "./theme-package";

const root = join(import.meta.dir, "..");
const themes = join(root, "themes");
for (const entry of (await readdir(themes, { withFileTypes: true })).sort((a, b) =>
  a.name.localeCompare(b.name),
)) {
  if (!entry.isDirectory()) continue;
  const directory = join(themes, entry.name);
  const manifest = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8"));
  const filename = `${manifest.id}-${manifest.version}.codegraphy-extension.json`;
  await buildTheme(directory, {
    outputDirectory: join(root, "dist"),
    packageUrl: `https://github.com/joesobo/codegraphy-registry/releases/download/themes-v${manifest.version}/${filename}`,
    releasePath: join(directory, "release.json"),
  });
}
console.log("Built registry-owned theme packages and release metadata.");
