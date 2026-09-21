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
- focus current branch - implemented for 0.3.0
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

These presentation options are implemented for 0.3.0, alongside alternating row
colors and path aids. See [the release notes](release/0.3.0.md).

## Dependency maintenance

After the 0.2.1 native release gate, reassess the temporary minor/patch-only npm
version-update policy in `.github/dependabot.yml`. Review the following optional
major migrations individually or in a deliberately tested build-tool batch:

- `@rollup/plugin-node-resolve` 15 to 16.
- `@rollup/plugin-typescript` 11 to 12.
- `@rollup/plugin-babel` 6 to 7.
- `archiver` 7 to 8, including its module/API compatibility with the packager.
- `@types/jquery` 3 to 4 only after checking the supported Community Plugin host's
  runtime jQuery version and declarations; newer types are not automatically a
  better compatibility target.

The initial automated PRs stopped at the generated-prototype freshness gate;
their plugin tests did not run. They were deferred to preserve the tested release
candidate, not classified as incompatible. Regenerate the prototype and run the
complete verification suite before accepting any migration. Security remediation
remains a priority and must not wait for this optional-upgrade backlog.

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
