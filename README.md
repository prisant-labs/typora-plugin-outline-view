# Typora Outline View

A flexible document outline for [Typora Community Plugin](https://github.com/typora-community-plugin/typora-community-plugin).

**Repository:** `prisant-labs/typora-plugin-outline-view`

## Why this exists

Typora's built-in **Files** and **Outline** views share the same left sidebar. For long documents, that forces a tradeoff:

- keep the file tree visible, or
- switch to the document outline.

Typora Community Plugin now provides a native right-side workspace dock, which creates an opportunity to keep both visible at the same time.

```text
┌────────────────┬──────────────────────────────┬──────────────────┐
│ FILES          │ DOCUMENT                     │ OUTLINE          │
│                │                              │                  │
│ project        │ # Introduction               │ Introduction     │
│ ├ notes.md     │                              │   Background     │
│ ├ research.md  │ ## Background                │   Goals          │
│ └ draft.md     │                              │ Architecture     │
│                │ ## Architecture              │   Components     │
└────────────────┴──────────────────────────────┴──────────────────┘
```

The project started as a "right outline" idea, but the product is intentionally named **Outline View** so its identity is not tied to one placement. The initial implementation should use the right dock because that solves the immediate problem, while the architecture should allow additional placements later.

## Product direction

The plugin should provide one coherent capability:

> A persistent, synchronized outline of the current Typora document that can live independently from Typora's native left sidebar.

The initial experience should include:

- H1-H6 outline
- nested visual hierarchy
- click-to-navigate
- active-heading highlighting
- live refresh as headings change
- automatic refresh when files change
- collapsible outline branches
- configurable heading depth
- follow-scroll behavior
- configurable density and indentation
- optional auto-open
- right-side dock as the default placement

Future placement options may include:

- workspace tab
- floating workspace view
- other Community Plugin workspace surfaces where technically appropriate

The plugin should **not** become a general-purpose workspace suite. Features such as Starred/Pinned files, Backlinks, Recent Files, or Git should remain separate Community Plugins.

## Why Community Plugin

This project is designed specifically for the Community Plugin ecosystem rather than for `obgnail/typora_plugin`.

Community Plugin already provides:

- plugin lifecycle and marketplace
- TypeScript development model
- cross-platform plugin support
- `WorkspaceView`
- `app.viewManager.registerView(...)`
- workspace commands
- a native `workspace.rightSplit`
- a resizable and persistent right-side dock

That means Outline View can focus on document structure and interaction rather than rebuilding panel geometry.

## Architecture principle

Do **not** move Typora's native `#outline-content` element into another panel.

Instead:

```text
Typora document DOM
        ↓
   OutlineModel
        ↓
    OutlineView
        ↓
 PlacementAdapter
        ↓
 Community Plugin workspace
```

This keeps the plugin independent from Typora's left-sidebar state machine and makes alternate placements possible.

## Current status

**0.2.0 - heading range, appearance, and live preview**

A previous validation spike proved out the intended approach conceptually:

- register a custom `WorkspaceView`
- host it in `workspace.rightSplit`
- parse headings from `#write`
- render an independent outline
- update on document mutation
- navigate by heading `cid`

The current development build provides:

- an independent `WorkspaceView`
- manual right-dock toggle and refresh commands
- H1-H6 parsing from the active `#write` editor
- a collapsible, nested H1-H6 hierarchy
- click navigation using live heading elements
- debounced refresh through exported editor events
- file-open refresh
- active-heading highlighting and optional outline auto-scroll
- per-file collapse memory for the current session
- expand-all and collapse-all commands and toolbar controls
- compact Collapse all and Expand all toolbar links
- a toolbar shortcut to the Outline View settings tab
- a two-endpoint H1-H6 range selector with per-document session memory
- Rail, Enclosure, and Bracket selector styles, optional labels, theme or grayscale colors
- per-heading size, bold, italic, underline, ALL CAPS / Small Caps, and custom colors
- live settings preview using the active document or sample headings
- live heading-range, density, and indentation settings
- configurable heading wrapping, enabled by default
- optional auto-open
- unload cleanup and duplicate-view protection

See [0.2.0 release notes](docs/release/0.2.0.md) for the scope and validation
boundary. A version tag does not by itself publish the marketplace listing.

## Settings

After the plugin is enabled, open the F1 command panel, run **Open Plugin
Settings Modal**, and choose **Outline View** under **Community Plugins**.
**Installed Plugins** remains the separate place to enable or disable the plugin.

Defaults:

- Open automatically - Off
- Follow active heading - On
- Auto-scroll outline - On
- Remember collapse state during the session - On
- Show heading levels - H1 through H6
- Expand by default through - H3
- Density - Comfortable
- Indentation - Medium
- Wrap long heading labels - On
- Heading-level selector - On, Rail, H1-H6 labels, Theme colors
- Heading styles - 100%, inherited emphasis and color, Normal case

Community Plugin stores the vault-local configuration at
`.typora/data/prisant-labs.outline-view.json`. With global settings enabled, the
equivalent file is under Typora's global plugin settings `data` directory.

Available F1 commands:

- **Outline View: Toggle**
- **Outline View: Refresh**
- **Outline View: Expand All**
- **Outline View: Collapse All**

The outline toolbar provides the same collapse/expand actions and a settings button
that opens **Community Plugins → Outline View** directly. While Outline View is
enabled, the Community Plugin right-dock control is labeled **Toggle outline
sidebar**.

Directly beneath the toolbar, the range selector chooses both the first and last
heading levels to show, such as H2-H4. Drag either endpoint, or click an endpoint
and then a level. A small underline marks the selected endpoint. Tab between the
two handles and use arrows, Home, or End with a keyboard. The endpoints stop at
one another instead of crossing. An equal range shows one heading level; drag
the shared handle left to move the start, right to move the end, or click it to
switch the selected endpoint. Escape cancels a drag.

Each document remembers both endpoints for this session only. New documents use
the Minimum/Maximum settings. Changing those defaults resets temporary ranges.
You can hide the selector, choose Rail/Enclosure/Bracket, hide all H1-H6 labels
for dots only, and use theme or grayscale colors. Theme uses the active-file
accent and background; grayscale uses neutral text and hover colors.

Under **Heading styles**, each H1-H6 has a 50-250% size slider and number field
(5% steps), independent B/I/U controls, Normal / ALL CAPS / Small Caps, and Theme
or a native custom-color picker. B/I/U cycle Theme, On, Off. Sizes are relative
to the theme-scaled outline base, not compounded by nesting. Reset a level or
all levels at once. The active heading retains its theme highlight even when
custom colors or bold settings are used. Case and style never change Markdown.

The live preview stays beside settings when space allows and moves below on
narrow layouts. It uses your document, with sample H1-H6 headings available at
any time and automatically when there is no document outline. Preview range
changes are temporary; save defaults with Minimum/Maximum heading level.

## Recommended development baseline

For the first implementation, develop against the current Community Plugin 2.10.x API.

Recommended initial dependency:

```json
"@typora-community-plugin/core": "^2.10.21"
```

The right dock was introduced in the 2.10 generation. After the plugin is stable, test whether `minCoreVersion` can safely be lowered to `2.10.0`.

## Development and testing

Install dependencies and run the automated gate:

```bash
pnpm install
pnpm test:run
pnpm typecheck
pnpm build
```

Install the development plugin into the included test vault and launch Typora:

```bash
pnpm build:dev
```

Close Typora before running `build:dev`. On Windows the command stops with a
clear error if Typora is still running, preventing a newly copied plugin from
being mistaken for the stale in-memory build. It then opens
`test/vault/doc.md`. In Typora:

On Windows, the launcher checks the standard Program Files and per-user install
locations. Set `TYPORA_PATH` to the full executable path if Typora is installed
elsewhere.

The separate `test/vault/heading-level-sample.md` fixture is a coherent project
brief with 57 headings. Every heading begins with its literal rank (`h1.` through
`h6.`), making hierarchy, wrapping, truncation, and active-heading behavior easy
to inspect.

1. Open the command panel with `F1`.
2. Run `Outline View: Toggle`.
3. Confirm Files remains visible on the left and Outline View opens on the right.
4. Confirm the nested tree starts expanded through H3 and deeper branches can be
   disclosed.
5. Click outline items and confirm the document scrolls to each heading.
6. Scroll the document and confirm the active outline item follows and remains
   visible.
7. Use the toolbar and F1 commands to expand and collapse all branches.
8. Change Outline View settings and confirm the open view updates.
9. Rename, add, or delete headings and confirm the outline refreshes.
10. Open `test/vault/second.md`, change collapse state, and switch back.
11. Toggle repeatedly and disable/re-enable the plugin; confirm no duplicate view remains.

## Marketplace publishing

The Community Plugin installer requires the GitHub release asset to be named
`plugin.zip`. `pnpm pack` also creates the byte-identical branded archive
`plugin_typora-outline-view.zip` for direct distribution.

After the smoke test passes:

1. Verify the `0.2.0` tag identifies the tested commit.
2. Create a public GitHub release named `0.2.0` for that tag after publication approval.
3. Upload `plugin.zip` to the release. The branded archive may be uploaded too.
4. Fork `typora-community-plugin/typora-plugin-releases`.
5. Add the Outline View entry to `community-plugins.json` and open a pull request.

The release-candidate manifest allows Windows and macOS so both can be tested.
Keep macOS in the final marketplace entry only after its platform smoke test
passes. Add Linux only after equivalent testing.

### Manual installation on macOS

Close Typora, extract `plugin.zip` into a plugin folder, and place that folder in
one of these locations:

- Vault-local: `<vault>/.typora/plugins/prisant-labs.outline-view`
- Global: `~/.typora/community-plugins/plugins/prisant-labs.outline-view`

The chosen folder must directly contain `main.js`, `manifest.json`, and
`style.css` - do not leave those files inside an extra `dist` directory. Launch
Typora, open Community Plugin settings, and enable **Outline View** under
**Installed Plugins**.

## Known limitations

- Outline View reads Typora's rendered `#write` document. In source mode, where
  that rendered document may be unavailable, the outline shows its unavailable
  state rather than attempting to parse the raw source editor.
- The earlier baseline was tested on Windows, and macOS functionality was
  user-confirmed with a small toggle-icon issue. The new 0.2.0 controls have
  automated and Chromium component coverage; native Windows/macOS 0.2.0 smoke
  tests remain necessary before marketplace publication. Linux is not listed.

## Documentation

Start here:

1. [`AGENTS.md`](AGENTS.md) — instructions for coding agents
2. [`docs/PROJECT-CONTEXT.md`](docs/PROJECT-CONTEXT.md) — why the project exists and prior research
3. [`docs/PRD.md`](docs/PRD.md) — product requirements
4. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — technical design
5. [`docs/IMPLEMENTATION-PLAN.md`](docs/IMPLEMENTATION-PLAN.md) — build sequence
6. [`docs/TEST-PLAN.md`](docs/TEST-PLAN.md) — validation and regression plan
7. [`docs/MARKETPLACE-RELEASE.md`](docs/MARKETPLACE-RELEASE.md) — packaging and marketplace path
8. [`docs/DECISIONS.md`](docs/DECISIONS.md) — decisions already made
9. [`docs/RESEARCH-NOTES.md`](docs/RESEARCH-NOTES.md) — verified Community Plugin and obgnail references
10. [`docs/NEXT-SESSION-HANDOFF.md`](docs/NEXT-SESSION-HANDOFF.md) — ready-made coding-session handoff

## Tentative repository structure

```text
typora-plugin-outline-view/
├── AGENTS.md
├── README.md
├── package.json
├── build.js
├── tsconfig.json
├── src/
│   ├── main.ts
│   ├── manifest.json
│   ├── style.scss
│   ├── outline/
│   │   ├── model.ts
│   │   ├── parser.ts
│   │   ├── state.ts
│   │   └── sync.ts
│   ├── views/
│   │   └── outline-view.ts
│   ├── placement/
│   │   └── right-dock.ts
│   └── settings/
│       ├── settings.ts
│       └── settings-tab.ts
├── test/
│   └── vault/
└── docs/
```

Do not create all abstraction layers before they are needed. The structure above is a target shape, not a requirement for the first commit.

## Planned plugin identity

```json
{
  "id": "prisant-labs.outline-view",
  "name": "Outline View",
  "repo": "prisant-labs/typora-plugin-outline-view",
  "platforms": ["win32", "darwin"]
}
```

## Related projects

- Typora Community Plugin
  https://github.com/typora-community-plugin/typora-community-plugin
- Community Plugin example
  https://github.com/typora-community-plugin/typora-plugin-example
- obgnail Typora Plugin
  https://github.com/obgnail/typora_plugin
- obgnail `right_outline` implementation
  https://github.com/obgnail/typora_plugin/blob/master/plugin/right_outline.js
- Unofficial obgnail macOS adapter
  https://github.com/bfyes/Typora-plugin-on-Mac

## License

Recommended: MIT.
