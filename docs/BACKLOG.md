# Product Backlog

## P0: Foundation

- repo scaffold
- build scripts
- manifest
- dev install workflow
- test vault

## P0: Core outline

- custom WorkspaceView
- right dock
- H1-H6 parsing
- hierarchy
- click navigation
- file refresh
- edit refresh
- toggle command
- cleanup

## P0: Active state

- detect current heading
- highlight current heading
- outline auto-scroll

## P1: Tree UX

- collapse branch
- expand branch
- collapse all
- expand all
- preserve collapse state during edits

## P1: Settings

- auto-open
- follow scroll
- auto-scroll
- max depth
- density
- indentation

## P1: Polish

- keyboard focus
- ARIA/tree semantics
- empty state
- truncation
- tooltip
- light/dark themes
- responsive narrow dock

## P1: Marketplace

- screenshots
- README polish
- release packaging
- marketplace submission

## P2: Outline power features

- filter headings
- focus current branch
- copy heading text
- copy section anchor/link if meaningful
- heading level display
- context menu

## P2: Outline presentation options

- Selectable expand/collapse icon styles. Offer a small set of paired icons,
  retaining the current default, keyboard behavior, accessible labels, and
  font-independent rendering on Windows and macOS.
- Optional vertical hierarchy guide lines connecting nested outline levels.
  Keep them subtle and theme-aware, align them with indentation, and preserve
  correct branch boundaries for collapsed branches and skipped heading levels.

These are future options, not requirements for the first marketplace listing.

## P2: Placement exploration

- workspace tab
- floating view
- additional supported placement adapters

Do not expose a setting until placement is technically validated.

## P3: Document Navigator exploration

Potential additional view modes:

- tables
- code blocks
- images
- links
- math

Decide whether these belong in Outline View or a separate Document Navigator plugin before implementation.

## P3: Structural editing

- drag heading section
- promote/demote heading
- move section

High risk because this may require private Typora internals.

## Separate plugin ideas

Do not merge into Outline View:

- Starred / Pinned workspace view
- Recent Files
- Backlinks
- Git sidebar
- broader workspace management
