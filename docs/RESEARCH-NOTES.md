# Research Notes and Source Map

These references were verified during the investigation that led to this project.

## Typora Community Plugin

Main repository:

https://github.com/typora-community-plugin/typora-community-plugin

## Built-in outline

Source:

https://github.com/typora-community-plugin/typora-community-plugin/blob/main/packages/core/src/ui/sidebar/outline.ts

Important behavior:

- Community Plugin already has a built-in Outline sidebar panel.
- It uses Typora's native `#outline-content`.
- It calls Typora's `editor.library.switch("outline")`.
- It is still part of the same left sidebar as Files and Search.

This is why a separate Outline View is still useful.

## Workspace

Source:

https://github.com/typora-community-plugin/typora-community-plugin/blob/main/packages/core/src/ui/workspace.ts

Important:

- `Workspace` has `rightSplit: WorkspaceSidedock`.
- Comments describe it as similar to Obsidian's `workspace.rightSplit`.
- Right dock was introduced in the 2.10 generation.
- Workspace includes root, floating, and right split view trees.

## Right-side dock

Source:

https://github.com/typora-community-plugin/typora-community-plugin/blob/main/packages/core/src/ui/layout/sidedock/index.ts

Relevant capabilities:

- right-side dock
- collapse/expand
- toggle
- resizable width
- persisted width
- workspace children/views

## Right-side dock test/example

Source:

https://github.com/typora-community-plugin/typora-community-plugin/blob/main/packages/core/src/ui/layout/sidedock/index-test.ts

Important pattern:

```ts
viewManager.registerView(
  TestSidedockView.type,
  leaf => new TestSidedockView(leaf),
)

commands.run(
  'core.workspace.right-split:ensure-leaf',
  [`typ://${TestSidedockView.type}/Test`],
)
```

## Right-side workspace utility

Source:

https://github.com/typora-community-plugin/typora-community-plugin/blob/main/packages/core/src/ui/layout/workspace-utils.ts

Important function:

```ts
ensureRightSidedockLeaf(uri)
```

Behavior:

- parse `typ://<type>`
- reuse existing view if present
- create a custom leaf
- add it to right dock tabs
- append tabs to `workspace.rightSplit`

## WorkspaceView

Source:

https://github.com/typora-community-plugin/typora-community-plugin/blob/main/packages/core/src/ui/layout/workspace-view.ts

`WorkspaceView` is publicly exported by core.

## Core exports

Source:

https://github.com/typora-community-plugin/typora-community-plugin/blob/main/packages/core/src/index.ts

Confirmed export:

```ts
export { WorkspaceView } from './ui/layout/workspace-view'
```

## Command manager

Source area:

https://github.com/typora-community-plugin/typora-community-plugin/blob/main/packages/core/src/command/command-manager.ts

Relevant typed command:

```text
core.workspace.right-split:ensure-leaf
```

## Events

Developer documentation:

https://github.com/typora-community-plugin/typora-community-plugin/blob/main/docs/en-us/dev-guide/3-events.md

Relevant event families:

- app
- vault
- workspace
- MarkdownEditor

Workspace includes file-open lifecycle.

MarkdownEditor includes editing/scrolling-related events.

## Example plugin

https://github.com/typora-community-plugin/typora-plugin-example

Development workflow:

```bash
pnpm install
pnpm run build:dev
```

The example's dev build:

- compiles plugin
- installs it as a development plugin
- closes Typora
- reopens a test Markdown document

## Existing marketplace plugin view pattern

Markmap:

https://github.com/typora-community-plugin/typora-plugin-markmap

Its source demonstrates:

```ts
app.viewManager.registerView(...)
```

inside a real plugin.

---

# obgnail reference

Repository:

https://github.com/obgnail/typora_plugin

Right Outline source:

https://github.com/obgnail/typora_plugin/blob/master/plugin/right_outline.js

Useful conceptual pieces:

- state manager
- tree renderer
- tree parser
- active heading sync
- multiple navigator modes
- collapse behavior

Less portable/desired pieces:

- custom panel geometry
- custom resizing
- obgnail event hub
- deep drag-to-reorder logic

## obgnail structural reorder risk

The implementation uses deeper Typora internals including concepts like:

- `File.editor.nodeMap.blocks`
- heading node types
- block serialization
- content reload

Do not use this model in V1.

---

# macOS adapter reference

https://github.com/bfyes/Typora-plugin-on-Mac

Important historical finding:

- it provides a WKWebView/Node bridge for obgnail
- `right_outline` is reported working
- it proves the UX is viable on macOS
- it is not needed if Outline View succeeds natively in Community Plugin

---

# Research conclusion

## Heading text and inline Markdown markers

The heading parser previously included all descendant `textContent`, including
Typora's editor-only syntax. A user report showed `**Next steps**` in Outline
View while the document displayed a bold heading. The installed Typora 1.14.10
`style/base-control.css` defines `.md-meta`, `.md-meta-none`, and `.md-content`
as hidden metadata and exposes markers/content under `.md-expand` during editing.

The parser excludes these metadata subtrees from a detached heading clone before
normalizing whitespace. It retains the original element and CID for navigation,
does not mutate the document, and does not strip Markdown-looking punctuation
from ordinary text or code. This is a DOM-class assumption, not a public API;
recheck it after Typora updates. Tests cover synthetic DOM fixtures based on
these classes; native verification against the affected document is still needed.

## Heading source display and macOS navigation

The maintainer reported two bugs in 0.3.1 on macOS. Clicking into a heading
removed its row until the caret left the heading. Outline clicks stopped
scrolling the document, although they worked right after a file loaded. The
maintainer ran a read-only console diagnostic in Typora on macOS on 2026-09-30.
Special characters were not involved: every failing heading was plain text.
Version 0.3.2 contains the fixes described below.

**Heading source display (observed, high confidence).** Typora's preference
Markdown → Live Rendering → "Display source for simple blocks (including
headings, etc.) on focus" is stored as `File.option.expandSimpleBlock` and is
off by default. When it is on, entering a heading removes its `h1`-`h6` element
and inserts a paragraph with the same `cid`:

```html
<p cid="n5" mdtype="paragraph" mdlike="h2" class="md-end-block md-p md-focus">
  <span class="md-block-like"><span class="md-blockmeta">## </span>
  <span class="md-header-span">Start here</span></span></p>
```

When the caret leaves, Typora inserts a new heading element. Typora's own table
of contents counts a paragraph with a heading depth as a heading while the
option is on (`frame.js`, Typora 1.14.10). Outline View does the same, keyed on
`mdlike`, and strips `.md-blockmeta`, which holds the `#` markers and any setext
underline. These are DOM assumptions, not public API.

**Why the swap reaches the outline.** The Community Plugin core's
`markdownEditor` `edit` event comes from a `MutationObserver` on `#write`
(`childList`, `characterData`, `subtree`; no attributes), debounced 400 ms. It
fires for any character change, for a single record that both adds and removes
nodes, and in several other cases. The heading swap is one such record, so the
view reparses while the heading is in its source form. Cores 2.10.21 and 2.10.23
contain the same logic. Between a swap and the reparse, the previous element is
detached, so navigation resolves a detached element by `cid` at click time.

**Navigation scroll on macOS (observed symptom, inferred mechanism).** In the
diagnostic, navigation found a connected target in a document with 14,563 px of
scroll range. It called `scrollIntoView({ behavior: 'smooth', block: 'start' })`
and then `#write.focus({ preventScroll: true })`. The editor's `scrollTop`
stayed at 0 through 1.5 s, while the caret stayed in a block near the top.
Typora on macOS runs on WebKit (`File.isSafari`); on Windows it runs on
Chromium. Typora's own `focusAndRestorePos` saves `content.scrollTop`, focuses
the editor, and restores the value, which implies that focusing the editor can
scroll it. The most likely mechanism is that focus revealed the restored caret
and cancelled the smooth scroll. This fits the report: after a file loads,
there is no caret to restore. The mechanism is inferred and not proven.

Navigation now focuses the editor only when focus is outside it, and does so
first. It then sets the scroll container's `scrollTop` directly, which moves
instantly, so nothing can interrupt it. The scroll container is the same one
that active-heading tracking uses: `<content>` with `overflow-y: auto` on both
macOS and Windows. jsdom tests cover the ordering and a focus call that scrolls
back to the caret. Native macOS confirmation of the fix is pending.

There is no architectural reason to run an entire second Typora plugin framework merely to get the desired outline experience.

Community Plugin already provides the workspace infrastructure necessary for a native implementation.

## Core 2.10.21 side-dock width contract

Verified against the pinned package's source maps for `ui/layout/sidedock`,
`ui/layout/tabs`, and `ui/layout/split`. The side dock inserts tab groups into a
flex `.sidedock-content` element. Unlike normal split children, those groups do
not receive `flex: 1` or `min-width: 0`. Their intrinsic content can therefore
leave unused width for short outlines or overflow for long ones, even when the
outline itself has `width: 100%`.

The plugin's correction targets only direct side-dock tab groups containing
`.outline-view`, with zero-basis flex sizing and bounded width. This is a CSS DOM
contract, not an exported layout API; recheck it when updating core. No private
runtime property or internal import is used. Automated checks verify selector
scope, computed constraints, and removal; they do not simulate browser geometry.

The same source sets the right dock's minimum and default width to 280px
(`WorkspaceSidedock.MIN_SIZE` and the `rightSplitWidth` default). The update
pill's label threshold relies on that minimum; see "Update pill label threshold"
in `TEST-PLAN.md`.

## Plugin Marketplace and updates

Verified on 2026-10-02 by reading the pinned Core 2.10.21 bundle,
`node_modules/@typora-community-plugin/core/dist/core.js`. Line numbers refer to
that file. None of these behaviors has been confirmed in native Typora yet.
[D025 (update pill)](DECISIONS.md#d025-update-pill-offer-cores-marketplace-update-inside-the-plugin)
depends on them.

1. **The Marketplace's lists load only on request.** `loadCommunityPlugins()`
   (line 10664) downloads `community-plugins.json` and
   `community-plugin-stats.json` from the `typora-community-plugin/typora-plugin-releases`
   repository, then calls `markUpdatesAvailable()`. Its only callers are the
   Plugin Marketplace tab (line 5259) and the Installed Plugins tab (line 5437),
   so Core loads the lists when the user opens one of them, not at startup.
2. **`newestVersion` comes from the statistics file.** `markUpdatesAvailable()`
   (line 10685) sets each listed plugin's `newestVersion` from the statistics,
   and deletes it when the statistics have no entry for that plugin.
3. **A failed statistics download looks like an empty list.**
   `loadCommunityPluginStats()` (line 10747) turns a failed download into `{}`.
   The next `markUpdatesAvailable()` then deletes every `newestVersion`. So the
   notifier treats empty statistics as a failed check, and an update reloads the
   lists only when Core's copy is missing or older than the pill's version.
4. **`getPluginNewestVersion()` can call GitHub's REST API.** It returns
   `newestVersion` or the statistics version, and otherwise falls back to
   `github.getReleaseInfo()` (line 10656). The notifier reads `newestVersion`
   directly so that a check never makes that REST call.
5. **`getReleaseInfo(repo)` is an uncached REST call.** It fetches
   `repos/<repo>/releases/latest` from the GitHub API on every call (line 10600).
   The settings masthead makes it once per settings show, and only while
   automatic checks are on.
6. **`updatePlugin(id)` unloads the running plugin before it downloads.** It
   returns early, without an error, when the plugin is unknown, unlisted, or
   already current (line 10914). Otherwise it calls `uninstallPlugin(id)`
   (line 10934), which calls `unloadPlugin(id)`, removes the plugin from the
   enabled list, and deletes the plugin folder. Then it installs the newest
   version and re-enables the plugin if it was enabled. If the download fails,
   the plugin stays uninstalled and must be reinstalled from the Marketplace.
7. **Unloading runs the plugin's cleanup first.** `disablePlugin(id)`
   (line 10904) calls the instance's `unload()`. `Component.unload()` (line 3097)
   runs `onunload()` and then the registered disposables, so Outline View's update
   dialog, notifier, and database close before the folder is deleted.
8. **Settings survive an update.** `PluginSettings` files live in Core's data
   folder, `<config>/data/<plugin id>.json` (`Plugin.dataPath`, line 5899), not in
   the plugin folder that `uninstallPlugin` deletes.

`app.plugins.marketplace` and `app.plugins.updatePlugin` are typed by Core but
are not documented plugin APIs. The notifier checks each method at runtime and
shows nothing when one is missing.
