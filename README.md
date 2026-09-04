# CodeGraphy registry

This catalog lists optional CodeGraphy theme packages. CodeGraphy includes its default theme; additional themes download only when installed.

Each entry in index.json contains a manifest, immutable HTTPS package URL, and SHA-256 checksum. Installation and activation are separate. Versioned packages are attached to this repository's releases.

## Theme format

A package contains manifest and css fields. The manifest declares formatVersion (1), kind (theme), id, name, version, description, author, modes, and preview. IDs use lowercase letters, digits, and hyphens. Versions use three numbers. Modes contain light, dark, or both. Preview images are embedded PNG, JPEG, or WebP data URLs.

CSS targets :root[data-color-scheme="light"] and :root[data-color-scheme="dark"]. Use shared variables such as --canvas, --surface, --text, --accent, --font-ui, --font-text, and --font-mono. Personal appearance preferences and enabled snippets follow the selected theme under normal CSS cascade rules.

Packages contain CSS only. Embed fonts and image assets as data URLs; network imports are not supported. Package size is limited to 8 MiB, CSS to 4 MiB, and previews to 2 MiB. Executable plugins are not part of format version 1.

## Contribute

Open a pull request with package metadata, a versioned HTTPS download, its checksum, and license information. Do not replace published package bytes; publish a new version. Maintained themes should retain readable contrast, visible keyboard focus, and reduced-motion support.
