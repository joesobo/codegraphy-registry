import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildTheme } from "./theme-package";

const temporaryDirectories: string[] = [];

async function fixture(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "codegraphy-theme-"));
  temporaryDirectories.push(directory);
  await writeFile(
    join(directory, "manifest.json"),
    JSON.stringify({
      formatVersion: 1,
      kind: "theme",
      id: "sample",
      name: "Sample",
      version: "1.0.0",
      minimumCodeGraphyVersion: "0.1.9",
      description: "Sample theme",
      author: "Author",
      repository: "https://example.com/sample",
      license: "MIT",
      keywords: ["sample"],
      modes: ["dark"],
      settings: [],
      previews: { dark: "preview-dark.png" },
    }),
  );
  await writeFile(join(directory, "preview-dark.png"), Buffer.from("89504e470d0a1a0a", "hex"));
  await writeFile(join(directory, "LICENSE"), "MIT License\n");
  await writeFile(join(directory, "theme.css"), ":root { --canvas: #111; }\n");
  return directory;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe("public theme builder", () => {
  test("builds a self-contained package and update record", async () => {
    const directory = await fixture();
    const output = join(directory, "output");
    await mkdir(output);
    const result = await buildTheme(directory, {
      outputDirectory: output,
      packageUrl: "https://example.com/releases/sample-1.0.0.codegraphy-extension.json",
    });
    expect(result.filename).toBe("sample-1.0.0.codegraphy-extension.json");
    expect(result.release?.manifest.previews.dark).toStartWith("data:image/png;base64,");
    expect(result.release?.sha256).toHaveLength(64);
  });

  test("rejects remote CSS resources before packaging", async () => {
    const directory = await fixture();
    await writeFile(join(directory, "theme.css"), "body { background: url(https://example.com/a.png); }");
    await expect(buildTheme(directory, { outputDirectory: join(directory, "output") })).rejects.toThrow(
      "embedded",
    );
  });
});
