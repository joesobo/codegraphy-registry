# Client styling contract

CodeGraphy loads Client CSS through `apps/client/src/styles/index.css`. The entry point fixes the cascade order and produces one CSS bundle. Focused files divide built-in styles by surface and responsibility. Shared control behavior belongs to primitives, application chrome belongs to the shell, Settings layout belongs to `settings.css`, Settings cards and fields belong to `settings-controls.css`, and performance tables and footers belong to diagnostics.

## Cascade layers

For normal declarations, the Client declares these layers from lowest to highest priority. CSS importance and specificity still apply; important declarations reverse layer precedence:

| Layer | Owner |
| --- | --- |
| `codegraphy.reset` | Element defaults and document sizing |
| `codegraphy.pdfjs` | PDF.js page and text-layer defaults |
| `codegraphy.theme.builtin` | Built-in theme values and semantic token defaults |
| `codegraphy.primitives` | Shared controls and focus behavior |
| `codegraphy.features` | Workspace, explorer, editor, Markdown, Graph, and Settings surfaces |
| `codegraphy.platform` | Responsive and mobile adaptation |
| `codegraphy.theme.installed` | The active installed theme package |
| `codegraphy.plugin` | Reserved Plugin-owned structural styles |
| `codegraphy.local` | Personal Settings followed by ordered CSS snippets |
| `codegraphy.accessibility` | Built-in reduced-motion defaults |

Keep each rule in its owner stylesheet. Put responsive rules beside the surface or subpart they adapt unless they coordinate the complete application shell. Do not create generic override or breakpoint files. Do not import Client styles from a Svelte module or depend on JavaScript import order.

## CodeMirror styles

Desktop, local browser, and mobile use the same CodeMirror editor theme extension. CodeMirror injects its built-in theme outside the Client's named cascade layers, so `EditorView.theme` must own properties that compete with CodeMirror defaults and must express their values with CodeGraphy tokens. Keep structural editor layout in the Client stylesheets. Mobile rules may adapt wrapping and layout without defining a separate editor color theme.

## Stable tokens

The CodeGraphy theme provides these catalog-backed color tokens through [color defaults](color-defaults.json):

- Surfaces: `--canvas`, `--surface`, `--surface-raised`, `--surface-muted`, `--border`, `--border-strong`
- Text and actions: `--text`, `--text-muted`, `--text-faint`, `--accent`, `--accent-foreground`, `--accent-strong`, `--accent-surface`, `--selection`, `--focus`
- Diagnostics: `--warning`, `--warning-foreground`, `--danger`, `--danger-foreground`
- Syntax: the `--syntax-*` tokens in the theme catalog
- Graph background: `--graph-background`

CSS derives additional semantic tokens from those catalog colors. Theme CSS and local CSS can replace `--surface-hover`, `--surface-inset`, `--backdrop`, `--diagnostic-warning`, `--diagnostic-danger`, the `--editor-*` color tokens, and the `--markdown-*` color tokens. Markdown callouts use `--markdown-callout-neutral` plus one `--markdown-callout-<type>` token for each documented built-in presentation. Theme catalog JSON cannot add or replace these derived values.

The built-in token file also defines these stable groups:

| Concern | Variables |
| --- | --- |
| Typography | `--font-ui`, `--font-text`, `--font-mono`, `--ui-font-caption`, `--ui-font-body`, `--ui-font-label`, `--ui-heading-font-size`, `--ui-input-font-size`, `--tree-font-size`, `--tree-meta-font-size`, `--editor-font-size`, `--pane-title-font-size`, `--graph-hint-font-size`, `--graph-panel-font-size`, `--graph-panel-heading-size`, `--settings-control-font-size`, `--settings-title-font-size`, `--settings-body-font-size`, `--settings-badge-font-size`, and `--settings-empty-font-size` |
| Spacing and sizing | `--ui-gutter`, `--tree-gap`, `--tree-depth-indent`, `--tree-search-padding`, `--editor-tab-size`, `--editor-tab-min-width`, `--editor-toolbar-size`, `--pane-titlebar-size`, `--graph-index-size`, `--graph-range-size`, `--settings-control-size`, and `--settings-card-icon-size` |
| Shape and elevation | `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-sheet`, `--shadow-flyout`, `--shadow-dialog`, and `--shadow-sheet` |
| Motion and focus | `--motion-duration-fast`, `--motion-easing-standard`, `--focus-ring-width`, and `--focus-ring-offset` |
| Controls | `--control-size-sm`, `--control-size-touch`, `--ui-control-size`, `--ui-icon-size`, `--ui-compact-icon-size`, `--ui-row-size`, `--ui-control-radius`, `--ui-checkbox-size`, `--ui-row-action-size`, `--tree-leading-size`, `--tree-icon-size`, `--tree-action-size`, `--tree-search-leading-size`, `--tree-search-trailing-size`, `--tree-search-border`, `--tree-search-radius`, `--tree-row-inline-start`, and `--tree-row-inline-end` |
| Safe areas | `--safe-area-top`, `--safe-area-right`, `--safe-area-bottom`, and `--safe-area-left` |

Component rules consume these inherited values. The mobile app root changes density and touch-size tokens once instead of reimplementing each control. Override a token on `[data-codegraphy-root="app"]` to affect both platforms. Target `[data-codegraphy-platform="desktop"]` or `[data-codegraphy-platform="mobile"]` when the platforms need different values. [token defaults](token-defaults.css) contains the defaults.

Graph Nodes, Edges, icons, and labels render through WebGPU. The Client resolves `--graph-background`, `--graph-label-color`, `--graph-label-outline`, `--graph-hover-color`, and `--graph-selection-color` from the Graph surface and sends those colors to the renderer. `--graph-node-color` changes all Nodes, `--graph-node-folder-color` changes folders, and `--graph-node-<language-id>-color` changes one language. `--graph-edge-color` changes all Edges and `--graph-edge-<relationship>-color` changes one Relationship. More specific semantic values take precedence over general values. Values of `none` preserve catalog colors. Personal Graph appearance groups apply after these theme defaults and retain ownership of per-Node colors and icons. There is no Graph grid token contract. CSS selectors cannot address individual GPU objects. Theme, personal-setting, and snippet changes publish the same appearance event used to refresh Graph colors and Mermaid diagrams.

Mermaid diagrams consume `--mermaid-background`, `--mermaid-border`, `--mermaid-foreground`, `--mermaid-line`, `--mermaid-primary`, `--mermaid-secondary`, and `--mermaid-tertiary` when generating SVG. A theme change generates a new diagram cache key and refreshes the rendered diagram.

## Stable hooks

Advanced CSS can target these semantic attributes:

| Hook | Surface |
| --- | --- |
| `[data-codegraphy-root="app"]` | Complete Client |
| `[data-codegraphy-platform="desktop"]` | Desktop layout state |
| `[data-codegraphy-platform="mobile"]` | Mobile layout state |
| `[data-codegraphy-surface="welcome"]` | Desktop welcome view |
| `[data-codegraphy-surface="workspaces"]` | Mobile Workspace list |
| `[data-codegraphy-surface="workspace"]` | Open Workspace layout |
| `[data-codegraphy-surface="explorer"]` | File explorer |
| `[data-codegraphy-surface="editor"]` | Editor pane |
| `[data-codegraphy-surface="markdown"]` | Markdown preview |
| `[data-codegraphy-surface="graph"]` | Graph pane and controls |
| `[data-codegraphy-surface="graph-canvas"]` | WebGPU Graph surface |
| `[data-codegraphy-surface="settings"]` | Settings dialog |
| `[data-codegraphy-surface="appearance"]` | Appearance settings and package management |
| `[data-codegraphy-surface="content-search"]` | Workspace content search dialog |

Major parts within those surfaces use `data-codegraphy-part`:

| Hook | Part |
| --- | --- |
| `[data-codegraphy-part="app-header"]` | Desktop or mobile application header |
| `[data-codegraphy-part="mobile-navigation"]` | Mobile Workspace navigation |
| `[data-codegraphy-part="pane-titlebar"]` | Explorer or Graph pane title bar |
| `[data-codegraphy-part="explorer-toolbar"]` | Explorer toolbar |
| `[data-codegraphy-part="explorer-search"]` | Workspace search region |
| `[data-codegraphy-part="explorer-tree"]` | File tree |
| `[data-codegraphy-part="explorer-tree-row"]` | One repeated file-tree row |
| `[data-codegraphy-part="editor-tabs"]` | Editor tab strip |
| `[data-codegraphy-part="editor-toolbar"]` | Editor toolbar |
| `[data-codegraphy-part="markdown-formatting-toolbar"]` | Built-in Markdown formatting controls |
| `[data-codegraphy-part="editor-content"]` | Code, Markdown, or image content region |
| `[data-codegraphy-part="mermaid-surface"]` | Mermaid controls and viewport |
| `[data-codegraphy-part="mermaid-viewport"]` | Focusable Mermaid pan and zoom viewport |
| `[data-codegraphy-part="mermaid-canvas"]` | Generated Mermaid SVG container |
| `[data-codegraphy-part="mermaid-backdrop"]` | Full-screen Mermaid backdrop |
| `[data-codegraphy-part="mermaid-dialog"]` | Full-screen Mermaid dialog |
| `[data-codegraphy-part="graph-toolbar"]` | Graph toolbar |
| `[data-codegraphy-part="graph-settings"]` | Open Graph settings panel |
| `[data-codegraphy-part="settings-dialog"]` | Settings dialog panel |
| `[data-codegraphy-part="settings-navigation"]` | Settings category navigation |
| `[data-codegraphy-part="settings-search"]` | Settings search control |
| `[data-codegraphy-part="settings-scope"]` | Global and Workspace scope controls |
| `[data-codegraphy-part="settings-list"]` | Settings result list |
| `[data-codegraphy-part="setting-card"]` | One repeated setting card |
| `[data-codegraphy-part="theme-manager"]` | Theme browsing, installation, and activation |
| `[data-codegraphy-part="snippet-manager"]` | CSS snippet editing, enabling, and ordering |
| `[data-codegraphy-part="performance-diagnostics"]` | Performance table or footer |
| `[data-codegraphy-part="markdown-callout"]` | One rendered Markdown callout |
| `[data-codegraphy-part="markdown-callout-title"]` | Callout title and disclosure control |
| `[data-codegraphy-part="markdown-callout-icon"]` | Decorative callout type icon |
| `[data-codegraphy-part="markdown-callout-content"]` | Callout body content |

Use semantic HTML and ARIA state for supported state selectors, such as `[aria-current="page"]`, `[aria-selected="true"]`, `[aria-pressed="true"]`, and `[aria-expanded="true"]`. Setting cards also expose stable `data-setting-id` values for a single known setting. Class names remain implementation details unless this document names them.

The Editor surface exposes `data-document-kind` for its active document. The editable content region exposes `data-language` with the active language ID. Use these attributes with the stable surface and part hooks to target one editor content type.

## Themes and snippets

Exactly one theme is active. CodeGraphy is bundled and supports light and dark. The separate base color scheme setting accepts System, Light, or Dark. System follows operating-system changes. A theme with one supported mode uses that mode while preserving the saved preference. The document root exposes `data-theme="<id>"` and `data-color-scheme="light"` or `"dark"`.

A theme manifest can provide up to 50 settings. Each setting has a unique lowercase ID, a unique CSS custom property, a name, and a description. Supported controls are `color`, `text`, `number`, and `toggle`. Colors use `#RRGGBB`. Number settings declare `min`, `max`, `step`, and `default`. Toggle values reach CSS as `1` or `0`. CodeGraphy stores values separately for each theme and shows controls in the selected theme's detail view.

Theme setting declarations apply after theme CSS. Personal accent and font settings apply after theme settings. Enabled snippets remain the final layer.

Appearance Settings separates installation from activation. Theme management shows descriptions, previews, supported modes, and package actions. Personal accent, interface font, text font, monospace font, and text size apply after the selected theme. Empty font and accent values, and a text size of zero, inherit theme defaults. Enabled snippets apply after these personal values, in their saved order. Later normal declarations in that order win when their specificity is equal.

Optional Catppuccin, Dracula, Atom, and Solarized sources and releases live in the public [CodeGraphy theme registry](https://github.com/joesobo/codegraphy-registry); application code does not import them. The package format, storage, catalog, and publication instructions are in [author guide](../README.md). Executable Plugin loading remains separate future work.

Font controls use a dropdown of available families with a custom-name option. Native apps read the device font inventory. Supported browsers can request local font access through an explicit user action; other browsers retain generic families, loaded web fonts, and custom names. Font selection never asks the local browser host for that host machine's fonts. Unavailable saved families remain visible, and CSS uses its normal font fallback. Text size uses a numeric pixel field, and Reset restores the inherited theme or Global value.

The snippet manager imports and exports ordinary `.css` files. Its device library stores each snippet as `snippets/<id>.css` and derives its display name from the ID. Editing and saving through the manager immediately refreshes enabled snippets. External edits are not watched. Enabled snippet IDs and their order are presentation settings, so Global and Workspace selections can differ while sharing the device library.

Theme CSS and snippets are parsed and wrapped in their assigned layers by the Client. Authors can write plain CSS without a layer wrapper:

```css
:root {
  --accent: oklch(72% 0.16 210deg);
  --font-text: Georgia, serif;
  --editor-font-size: 18px;
}

[data-codegraphy-part="editor-tabs"] {
  border-bottom: 1px solid var(--accent);
}

[data-codegraphy-platform="mobile"] {
  --ui-control-size: 50px;
}
```

Use tokens for broad appearance changes and surface or part hooks for layout changes. Themes and snippets may hide elements, change layout, and replace focus styling. CodeGraphy does not assess design quality or enforce visibility. CSS imports and remote resource references are rejected; embed image and font assets as base64 data URLs. These resource rules keep appearance packages self-contained. They do not constrain layout or selectors.

## Accessibility and recovery

Built-in styles honor reduced motion with normal CSS declarations. Custom CSS can override them. Maintained themes should preserve readable contrast, visible keyboard focus, enlarged text, and reduced-motion preferences. There is no guarantee that arbitrary user CSS retains those properties.

Desktop provides the native **Appearance > Restore default appearance** menu, with `Cmd+Alt+Shift+R` on macOS or `Ctrl+Alt+Shift+R` elsewhere. Because the menu is outside themed page content, it remains reachable when CSS hides that content. The Client must still be responsive. In the local browser, reload the app URL with `?reset-appearance` to recover before custom appearance is applied. The query is removed after use.

Recovery resets appearance values globally and removes appearance overrides from every saved Workspace. It disables snippets and selects CodeGraphy without deleting installed packages or snippet files. Other settings remain unchanged.

Global appearance values use one device settings document shared by the app and CLI. Workspace appearance overrides stay local to the Client and apply above those device values. If a removed theme remains in a saved Workspace override, the Client clears that selection when it next loads the installed theme library.

Markdown callouts also expose the common Obsidian selector shape: `.callout[data-callout="<type>"]`, `.callout-title`, `.callout-icon`, and `.callout-content`. Use `--callout-color` for the accent and `--callout-icon` for a CSS image value. Callout types include note, abstract, info, todo, tip, success, question, warning, failure, danger, bug, example, and quote. Unknown types use the neutral presentation.

## Design references

The authoring approach draws on [Obsidian CSS variables](https://docs.obsidian.md/Reference/CSS%20variables/About%20styling) and [snippets](https://obsidian.md/help/snippets), [Inkdrop theme layers](https://developers.inkdrop.app/guides/create-a-theme) and [personal style tweaks](https://developers.inkdrop.app/guides/style-tweaks), and [Thymer's global CSS API](https://github.com/thymerapp/thymer-plugin-sdk/blob/main/types.d.ts).

The inspected guides do not document protected visible controls or runtime enforcement of theme contrast. CodeGraphy permits CSS that changes layout or hides content. Its maintained themes retain accessible defaults, and desktop recovery is outside the styled DOM. This is CodeGraphy's recovery design; it is not a claim that the other apps provide the same mechanism.
