# AGENTS.md

This repository is intended to be developed with coding agents. Read this file before making changes.

## Project

**Name:** Typora Outline View

**Repo:** `prisant-labs/typora-plugin-outline-view`

**Target ecosystem:** Typora Community Plugin marketplace

**Primary language:** TypeScript

## Read first

Before coding, read:

1. `docs/PROJECT-CONTEXT.md`
2. `docs/PRD.md`
3. `docs/ARCHITECTURE.md`
4. `docs/IMPLEMENTATION-PLAN.md`
5. `docs/DECISIONS.md`
6. `docs/TEST-PLAN.md`

Use `docs/RESEARCH-NOTES.md` when verifying Community Plugin APIs.

## Primary objective

Build a stable Community Plugin that displays a synchronized outline of the active Markdown document independently from Typora's native left sidebar.

The initial user outcome is:

> Keep Files visible on the left and Outline View visible on the right.

The architecture should not permanently bind the product identity to "right-side only."

## Engineering constraints

### Prefer public Community Plugin APIs

Use exported APIs from `@typora-community-plugin/core` wherever possible.

Known relevant APIs include:

- `Plugin`
- `WorkspaceView`
- `WorkspaceLeaf`
- `app.viewManager.registerView(...)`
- `app.workspace`
- `app.workspace.rightSplit`
- `app.commands.run(...)`
- plugin registration/cleanup helpers
- Community Plugin workspace/editor events

Avoid importing from Community Plugin internal `src/...` paths in the production plugin.

### Avoid fragile Typora internals

Reading the current editor DOM is acceptable for V1.

Preferred initial source:

```text
#write
  > h1
  > h2
  > h3
  > h4
  > h5
  > h6
```

Use heading `cid` when present.

Do not implement structural document rewriting or heading drag-to-reorder in V1.

Do not depend on:

- `File.editor.nodeMap.blocks`
- `File.reloadContent(...)`
- other deep private Typora document-model APIs

unless a future milestone explicitly approves it.

### Do not move Typora's native outline DOM

Do not relocate `#outline-content`.

Render an independent outline from the current document.

### Cross-platform

The marketplace target is:

- macOS
- Windows
- Linux

Do not add Node-native runtime requirements unless unavoidable. The first release should be browser/DOM-side logic.

### Scope discipline

Outline View is about heading-based document structure.

Do not add these to this plugin unless the PRD is deliberately expanded:

- starred/pinned files
- backlinks
- recent files
- Git
- AI
- generic workspace widgets

Those should be separate Community Plugins.

### Cleanup

All events, observers, timers, and DOM handlers must be released when the plugin/view unloads.

Use plugin/view registration helpers where available.

## Product priorities

In order:

1. reliability
2. native Community Plugin fit
3. low coupling to Typora internals
4. responsive updates
5. clean UX
6. customization
7. advanced features

## First coding milestone

Implement only enough to validate the production architecture:

- plugin manifest/build setup
- `WorkspaceView`
- right-dock placement adapter
- H1-H6 parsing
- indented rendering
- click navigation
- file-open refresh
- debounced edit refresh
- manual toggle command

Then test before adding active-heading synchronization, settings, or collapse behavior.

## Definition of done for a coding task

A task is not done unless:

- TypeScript compiles
- plugin builds
- no known lifecycle leaks are introduced
- behavior is manually testable
- related docs are updated when architecture or scope changes
- assumptions about undocumented APIs are recorded

## Do not silently redesign the product

If implementation discoveries require changing a decision in `docs/DECISIONS.md`, update that document explicitly.
