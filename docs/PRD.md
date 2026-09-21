# Product Requirements Document

## Product

**Typora Outline View**

## Repository

`prisant-labs/typora-plugin-outline-view`

## Summary

Outline View is a Community Plugin for Typora that provides a persistent, synchronized heading outline of the active Markdown document as an independent workspace view.

Its primary purpose is to let users keep Typora's Files sidebar visible while simultaneously navigating the structure of a long document.

## Problem

Typora's native left sidebar switches between Files, Search, and Outline.

For users working across many Markdown files and long structured documents, both levels of navigation matter at the same time:

- **workspace navigation:** folders and files
- **document navigation:** headings within the active file

Today, selecting Outline hides Files.

## Primary job to be done

> While editing a Markdown document, I want to see both my file structure and my document structure so I can move between files and sections without repeatedly switching sidebar modes.

## Product principles

1. **Native to Community Plugin**
2. **Independent from Typora's native left sidebar**
3. **Simple by default**
4. **Configurable without becoming a generic workspace framework**
5. **Cross-platform**
6. **Low reliance on private Typora internals**

## Target users

Primary:

- people using Typora as a serious Markdown editor
- people working with long structured documents
- users managing folder-based Markdown collections
- Community Plugin users who keep Files open

Secondary:

- technical writers
- researchers
- product managers
- nonfiction writers
- documentation authors

## Core experience

Default layout:

```text
┌────────────────┬───────────────────────────┬──────────────────┐
│ FILES          │ DOCUMENT                  │ OUTLINE VIEW     │
│                │                           │                  │
│ docs           │ # Introduction            │ Introduction     │
│ ├ intro.md     │                           │   Goals          │
│ ├ design.md    │ ## Goals                  │   Scope          │
│ └ roadmap.md   │                           │ Architecture     │
└────────────────┴───────────────────────────┴──────────────────┘
```

## V1 functional requirements

### Outline generation

The plugin must:

- detect H1-H6 headings in the active Typora document
- preserve source order
- preserve heading depth
- render readable nested indentation
- handle documents with skipped heading levels
- display a clear empty state when no headings exist

### Navigation

Users must be able to:

- click an outline item
- navigate to the corresponding heading
- return focus to the document naturally

Navigation should prefer heading `cid` or a direct live DOM reference.

### Live synchronization

The outline must refresh when:

- another file opens
- a heading is added
- a heading is deleted
- heading text changes
- heading levels change

Updates should be debounced to avoid excessive rendering.

### Active heading

The plugin should:

- determine the current/active heading while scrolling
- visually highlight that heading
- keep the active outline item visible when follow mode is enabled

### Collapsing

Users should be able to:

- collapse headings with children
- expand collapsed headings
- optionally expand/collapse all

Collapsed state should remain stable during ordinary edits when possible.

### Commands

At minimum:

- `Outline View: Toggle`
- `Outline View: Refresh`
- `Outline View: Expand All`
- `Outline View: Collapse All`

### Settings

V1 should include:

#### Placement

- default placement: Right dock
- architecture must support additional placement adapters later
- do not promise unsupported placements in the first marketplace release

#### Behavior

- open automatically: on/off
- follow active heading: on/off
- auto-scroll outline: on/off
- remember collapse state: on/off

#### Heading visibility

- maximum heading depth: H1-H6
- optional minimum heading level if implementation remains intuitive

#### Appearance

- density: compact / comfortable
- indentation: small / medium / large

### Persistence

Persist plugin settings using Community Plugin settings APIs.

Persist only state that has clear value. Do not create complex document metadata in V1.

## Accessibility

- outline items should be keyboard-focusable
- use semantic roles where useful
- visible active state must not rely solely on color
- tooltips/title should expose truncated heading text

## Performance

The plugin should remain responsive on documents with:

- 500+ headings
- frequent editing
- long documents

Avoid rebuilding unnecessarily.

Recommended:

- debounce heading refresh
- compare a lightweight signature before DOM replacement if useful
- avoid repeated expensive global selectors during scroll

## Cross-platform requirements

Support:

- macOS
- Windows
- Linux

No V1 feature should require a platform-specific Node bridge.

## Marketplace requirements

The plugin should be suitable for the Typora Community Plugin marketplace:

- independent repository
- valid manifest
- documented installation/use
- MIT-compatible licensing
- current Community Plugin core dependency
- release artifact compatible with marketplace expectations

## Out of scope for V1

Do not include:

- starred/pinned files
- backlinks
- recent files
- Git status
- AI features
- table/image/link/code/math navigation modes
- drag-to-reorder sections
- automatic document rewriting
- full Obsidian-style outline manipulation

## Future opportunities

### V1.x

- search/filter headings
- focus current branch
- heading level badges
- context actions
- copy heading link
- configurable active-heading threshold

### V2: Document Navigator mode

Potential additional navigators:

- tables
- images
- fenced code blocks
- links
- math blocks

This should only be added if it remains coherent with the product.

### V2+: additional placements

Possible:

- main workspace tab
- floating view
- other Community workspace surfaces

Each must be validated before being presented as a supported setting.

### Structural editing

Drag-to-reorder heading sections is intentionally deferred because the obgnail implementation relies on deep Typora document-model internals.

## Success criteria

### Technical success

- Files can remain open on the left
- Outline View remains usable on the right
- no duplicate-plugin framework required
- no significant editor performance regression
- clean unload/reload behavior

### Product success

The user no longer needs to switch to Typora's native Outline sidebar during normal long-document editing.

## Non-goal

This plugin should not attempt to replace Typora Community Plugin's workspace system.

It is a focused view that uses that system.

## Approved 0.2.0 extension: heading presentation

The heading-range selector has two endpoints with drag, click-to-arm then
choose-level, and keyboard support. Keep `1 <= start <= end <= 6`, including
equal endpoints. Both bounds are temporary per document; saved settings provide
defaults. Offer Rail, Enclosure, and Bracket, all-label visibility, theme/grayscale,
and an option to hide the selector.

Each heading rank supports 50-250% size in 5% steps using a slider plus number
field, independent on/off bold/italic/underline, Normal/ALL CAPS/Small Caps, and
theme or custom color via the native picker. Emphasis defaults and resets are
off; legacy Theme emphasis becomes off, preserving explicit on/off choices.
Font scaling is relative to a shared theme-root-based outline size and does not
compound through the hierarchy. The active-heading cue remains visible.

Settings include a live outline preview using the active document or fallback
H1-H6 samples, beside controls at wide widths and in a compact sticky card above
controls at narrow widths. The wide Live outline view is 390px with visible
bottom clearance. Active-document information and Use samples share a compact
row, without a guidance paragraph. Its
renderer and selector are the production components. Changing presentation
must never modify heading text, markup, or document contents.

## Approved outline appearance and browsing extension

The outline offers Current triangle, Small bullet, Line arrow, Open / closed
folder, and No icon disclosure treatments. Every treatment retains the same
focusable 20px collapse target and accessible expanded/collapsed label. Heading
labels sit closer to that target without reducing it.

Vertical hierarchy guides and visible-order alternating row colors are independently
optional. Guides use quiet or clear strength and continue to the bottom of each
real child-list container. Row A and row B alternate across the flattened visible
outline, so collapsed descendants do not affect the sequence. Active, hover,
and keyboard-focus states take precedence over alternating row colors.

Guide, row A, and row B colors each support Theme, Plugin
default, and Custom. Custom mode uses native color inputs, separate light and
dark values, a "Use light color in both themes" shortcut, and 0-100% opacity. Theme changes
must update these presentation variables without private Typora APIs.

Guide, alternating row color, and heading-level selector subsettings appear in
indented groups only when their parent option is enabled. Hiding a group preserves
its settings and disables its controls. Each Custom editor occupies a full-width
row beneath its color-source dropdown. Shared-color mode reuses the light swatch
in both themes while retaining the separate dark choice for later use.

Optional browsing aids include none/space/divider top-level section separation,
active-ancestor emphasis, a clickable current-path bar, and focus-current-branch.
Focus mode retains the selected heading's ancestor chain and complete subtree,
and disabling it restores the full filtered outline. These settings affect only
the outline view and its production-backed settings preview.
