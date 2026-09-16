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

There is no architectural reason to run an entire second Typora plugin framework merely to get the desired outline experience.

Community Plugin already provides the workspace infrastructure necessary for a native implementation.
