# CodeGraphy extension registry

This public registry is the directory for CodeGraphy extensions: themes today and plugins when plugin support is available. The shared `index.json` identifies each entry by `kind`, `id`, and its author-owned `releaseUrl`. Each package kind has its own format and validation rules.

CodeGraphy includes its default theme. It downloads another theme only when a user installs it, and installation does not activate the theme.

Theme authors keep source and releases in their own public repository. The registry records one stable release-metadata URL for each theme. An author changes that metadata when they publish a new immutable package, so updates do not require a CodeGraphy application change or another registry pull request.

## Create a theme

1. Copy `template/` into a public repository that you own.
2. Complete `manifest.json`, add an actual app screenshot for each supported color mode, and write `theme.css`. The [styling contract](docs/styling.md) lists stable tokens and hooks.
3. Clone this registry and install its public build tool with `bun install --frozen-lockfile`.
4. Build your package. Predict the immutable release-asset URL before you upload it:

   ```sh
   bun run theme:build ../your-theme \
     --output ../your-theme/dist \
     --package-url https://github.com/you/your-theme/releases/download/1.0.0/your-theme-1.0.0.codegraphy-extension.json \
     --release-file ../your-theme/codegraphy-release.json
   ```

5. Create a GitHub release whose tag matches the manifest version. Upload the generated `.codegraphy-extension.json` file without changing its bytes.
6. Commit `codegraphy-release.json` to a stable path on your default branch.
7. Open one registry pull request that adds your theme ID and the raw HTTPS URL for `codegraphy-release.json` to `index.json`.

The initial registry pull request is the directory review boundary. Later updates only require a new version, an immutable release asset, and a regenerated `codegraphy-release.json` in your repository.

## Source manifest

`manifest.json` uses [schemas/theme-source.schema.json](schemas/theme-source.schema.json). Its required metadata includes:

- `version`: the theme release in `x.y.z` form.
- `minimumCodeGraphyVersion`: the oldest compatible CodeGraphy release in `x.y.z` form. CodeGraphy blocks installation on older versions.
- `description`, `author`, `repository`, `license`, and `keywords`: details shown or used by the theme directory.
- `modes`: `light`, `dark`, or both.
- `settings`: optional theme-specific controls represented by a required array. Use an empty array when the theme has no controls.
- `previews`: a PNG, JPEG, or WebP filename for each declared color mode. The builder requires every creator-provided file and embeds it in the package. It does not create or substitute preview artwork.

IDs and keywords use lowercase letters, digits, and hyphens. Each source repository must include its license text. A package contains the validated manifest and CSS only; it has no executable code.

Theme settings write one declared CSS custom property after theme CSS and before personal appearance values and snippets. Their types are:

| Type | Value exposed to CSS |
| --- | --- |
| `color` | The selected CSS color string |
| `text` | The entered string |
| `number` | A unitless number constrained by `min`, `max`, and `step` |
| `toggle` | `1` when enabled and `0` when disabled |

Each setting needs a unique `id` and `cssVariable`. CSS variable names start with `--` and contain lowercase letters, digits, and hyphens. Use the variable in `theme.css` with a fallback that matches its default.

## CSS and assets

Write ordinary CSS without a cascade-layer wrapper. Use `:root[data-color-scheme="light"]` and `:root[data-color-scheme="dark"]` for mode-specific values. Personal font, accent, and text-size choices apply after the theme. Enabled CSS snippets apply after personal choices in saved order.

CSS may change any app layout or hide content. CodeGraphy does not enforce design quality. Imports and remote resource URLs are rejected. Embed image and font resources as base64 data URLs so the package remains self-contained and works offline.

The complete package is limited to 8 MiB, CSS to 4 MiB, and each embedded preview data URL to 2 MiB. Maintained themes should keep text readable, keyboard focus visible, enlarged text usable, and reduced-motion behavior available.

## Registry structure and ownership

`index.json` is a small directory of pointers. It uses [schemas/registry.schema.json](schemas/registry.schema.json).

| Owner | Stores |
| --- | --- |
| Registry | Package kind, stable ID, and author-owned release URL |
| Author repository | Source, license, previews, current release metadata, and immutable package assets |
| CodeGraphy | Installation, compatibility checks, activation, updates, and local storage |

An entry is identified by `(kind, id)`. IDs are unique within each kind. A future plugin and a theme can use the same ID. Keep both fields stable; do not reuse a removed identity for an unrelated package. Changes to ownership or the release URL require registry review.

The maintained sources under `themes/` are first-party examples. Outside authors keep their packages in their own repositories. Generated packages belong in release assets, not in this Git repository or the application install.

## Releases and updates

CodeGraphy fetches the stable `releaseUrl` to get the current [theme release metadata](schemas/theme-release.schema.json), then verifies the package SHA-256 and complete manifest before installation. Never replace a published package asset. Increase the manifest version, publish a new asset, and regenerate release metadata. Updates do not require another registry pull request or application release.

The directory's `formatVersion` describes its structure. Each package kind defines its own release and package format versions. A theme's `minimumCodeGraphyVersion` controls app compatibility; the catalog version does not. The app offers an update only when the package is newer and compatible.

Initial listing review does not review every later release. The checksum detects changed bytes relative to the author's metadata; it does not prove that an author or update is trustworthy. Removing a directory entry stops discovery but does not uninstall existing copies.

## Adding plugins and growing the directory

Themes are the only installable kind today. Clients ignore kinds they do not support. The publishing check rejects unsupported kinds so an entry cannot pass without package validation.

When plugin support is implemented:

1. Define its manifest, release format, compatibility rules, permissions, and runtime lifecycle in CodeGraphy.
2. Add its public schemas, author guide, starter, and package validator here. Keep theme-specific fields such as CSS modes out of the shared directory entry.
3. Add plugin entries with `kind: "plugin"` to the same index after the installer and validation work end to end.

The registry remains a static directory. It needs no accounts, database, or plugin execution service. Core currently resolves theme feeds in batches of four, reports individual feed failures, and bounds each download by size and timeout. Installed packages remain usable without the registry. Browsing still resolves every theme feed; there is no catalog cache or pagination today. Measure catalog size and browse latency before adding caching, a generated search index, or a CDN.

## Contributing and maintenance

See [CONTRIBUTING.md](CONTRIBUTING.md) for initial submissions, updates, review criteria, and release maintenance. The public tools, schemas, starter, and documentation use the [MIT license](LICENSE); individual themes retain their own licenses.

The public styling reference includes [color defaults](docs/color-defaults.json) and [token defaults](docs/token-defaults.css). These reference files describe the current CodeGraphy theme contract; theme authors do not need the private application source.
