# Contribute a theme

You need a public theme repository and public release downloads. You do not need access to the CodeGraphy application repository. Follow the [author guide](README.md#create-a-theme) and use the [starter](template/).

## Submit the first release

1. Build the package and publish it as an immutable release asset in your repository.
2. Commit its generated release metadata at a stable raw HTTPS URL.
3. Fork this registry. Add one entry to `index.json` with `kind: "theme"`, your unique `id`, and `releaseUrl`. Keep theme source and assets in your own repository.
4. Run `bun install --frozen-lockfile`, `bun run check`, and `bun run check:remote`. The remote check downloads the public metadata and packages, then verifies their schemas, identity, CSS, and SHA-256.
5. Open a pull request with your repository, release URL, screenshots, and the CodeGraphy version and platforms you tested.

Maintainers review the license, ownership, package identity, checksum, compatibility, screenshots, and CSS resource rules. Maintained themes should preserve readable text, visible keyboard focus, touch targets, and reduced motion. The app permits custom layout and visibility changes.

## Publish an update

Increase the theme version, build and upload a new package asset, then commit the generated release metadata to the same URL. Do not overwrite existing assets. Updates do not need a registry pull request. A move to a different repository or metadata URL does need a registry change.

## Maintain this repository

Run `bun run build` after changing the bundled example theme sources. Review and commit the resulting `themes/*/release.json` files. Publish the matching files from `dist/` to the release named by their metadata before pushing those metadata changes to `main`. Run `bun run check` before pushing.

The repository license covers the public tools, schemas, starter, and documentation. Each theme keeps its own license in `themes/<id>/LICENSE`.

The directory uses an extension envelope so new package kinds can be added later. Only themes are currently supported. Submit plugin support as a separate proposal before adding plugin entries.
