# Project Context

## Origin

This project emerged from an evaluation of three Typora enhancement paths:

1. [`obgnail/typora_plugin`](https://github.com/obgnail/typora_plugin)
2. [`typora-community-plugin/typora-community-plugin`](https://github.com/typora-community-plugin/typora-community-plugin)
3. [`bfyes/Typora-plugin-on-Mac`](https://github.com/bfyes/Typora-plugin-on-Mac)

The immediate user need was the `right_outline` experience available in obgnail:

> Keep Typora's Files sidebar available while showing the current document outline on the opposite side.

## What was learned

### obgnail

`obgnail/typora_plugin` is a broad bundled enhancement suite with many features:

- `right_outline`
- advanced search
- Markdownlint
- editor width controls
- image/table resizing
- command palette
- templates
- diagram/rendering tools
- tabs and navigation utilities

Its `right_outline` implementation is capable, but the main project does not officially support macOS.

### Typora-plugin-on-Mac

`bfyes/Typora-plugin-on-Mac` is an unofficial compatibility layer for running obgnail on macOS.

It explicitly reports `right_outline` as working.

However, it adds:

- app-bundle modification
- a WKWebView compatibility loader
- a local Node bridge
- launchd integration
- additional maintenance and compatibility risk

It remains a useful fallback and research reference, but is not the preferred long-term architecture for this project.

### Community Plugin

Community Plugin is a more modular ecosystem, closer to Obsidian or VS Code:

- core plugin runtime
- marketplace
- independent plugin repos
- workspace system
- custom views
- side panels
- split views
- cross-platform support

Most importantly, Community Plugin 2.10.x contains **both halves of the desired solution**:

1. an existing built-in Outline integration for Typora's left sidebar
2. a new native right-side dock: `workspace.rightSplit`

The missing piece is a custom outline view hosted independently in that workspace system.

## Important correction from the original investigation

Community Plugin **does already have an outline**.

Its core `Outline` implementation wraps Typora's native `#outline-content` and exposes it as the built-in `core.outline` sidebar panel.

That outline still shares the left sidebar with Files and Search.

So the problem is not:

> "Community Plugin lacks an outline."

It is:

> "Community Plugin lacks an independently placeable outline view."

## Why a dedicated Community Plugin is preferable

A native plugin avoids running two separate Typora plugin frameworks.

It also allows:

- Community marketplace distribution
- normal Community Plugin lifecycle
- TypeScript
- cross-platform behavior
- use of `WorkspaceView`
- future placement flexibility
- easier maintenance

## Why the project was renamed

The first prototype was called:

`typora-plugin-right-outline`

Before committing to that name, the project was reframed.

The permanent repo is:

`typora-plugin-outline-view`

Reason:

The user capability is a reusable **outline view**. Right-side placement is the initial solution, not the permanent product identity.

## Related plugin strategy

Community Plugin encourages focused plugins rather than a single monolithic enhancement suite.

Examples of possible future, separate repos:

```text
typora-plugin-outline-view
typora-plugin-starred
typora-plugin-backlinks
typora-plugin-recent-files
```

A future shared utility package may make sense if multiple plugins repeat workspace-view infrastructure, but not before actual duplication exists.

## Previous validation spike

A V0 spike was created around these ideas:

- `WorkspaceView`
- `app.viewManager.registerView(...)`
- `core.workspace.right-split:ensure-leaf`
- parsing headings from `#write`
- independent DOM rendering
- `MutationObserver`
- click-to-scroll
- active-heading tracking

That spike should be treated as a prototype/reference, not production code.

The dedicated repo should be implemented cleanly from the requirements in this documentation set.
