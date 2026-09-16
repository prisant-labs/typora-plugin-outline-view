# Implementation Plan

## Goal

Move from an empty/new repository to a marketplace-ready Typora Community Plugin with controlled scope and fast validation.

## Phase 0: Repository foundation

### Tasks

- initialize from `typora-plugin-example` patterns
- set package name to `typora-plugin-outline-view`
- set manifest identity
- set Community Plugin dependency to current 2.10.x
- add build scripts
- add test vault
- verify `pnpm install`
- verify `pnpm run build:dev`
- verify Typora launches with the dev plugin

### Manifest target

```json
{
  "id": "prisant-labs.outline-view",
  "name": "Outline View",
  "description": "A flexible document outline view for Typora Community Plugin.",
  "author": "Prisant Labs",
  "authorUrl": "https://github.com/prisant-labs",
  "repo": "prisant-labs/typora-plugin-outline-view",
  "version": "0.1.0",
  "minAppVersion": "1.4.0",
  "minCoreVersion": "2.10.21",
  "platforms": ["win32", "linux", "darwin"]
}
```

Use `2.10.21` initially for certainty. Lower `minCoreVersion` after compatibility testing.

### Exit criteria

Development plugin installs and loads without product logic.

---

## Phase 1: Core right-dock MVP

### Tasks

Implement:

- `OutlineView extends WorkspaceView`
- register with `app.viewManager.registerView`
- open using `core.workspace.right-split:ensure-leaf`
- parse H1-H6 from active `#write`
- render flat outline with indentation
- click-to-scroll
- refresh on `file:open`
- debounced refresh on heading edit
- `Outline View: Toggle`
- `Outline View: Refresh`

### Do not implement yet

- settings UI
- collapse state
- search
- non-heading navigator modes
- alternate placements

### Exit criteria

On macOS:

```text
Files left + document center + Outline View right
```

works reliably.

---

## Phase 2: Model/view separation

Once Phase 1 works, refactor only as needed.

Suggested components:

```text
HeadingParser
OutlineTree
OutlineState
OutlineView
RightDockPlacement
```

### Exit criteria

Rendering does not directly own workspace placement logic.

---

## Phase 3: Active heading synchronization

### Tasks

- detect current heading while document scrolls
- highlight active outline item
- optional auto-scroll outline to active item
- avoid excessive DOM queries
- handle scrolling above first heading
- handle bottom of document

### Settings introduced

- follow active heading
- auto-scroll outline

### Exit criteria

Active state feels stable rather than jumpy.

---

## Phase 4: Collapse behavior

### Tasks

- build nested heading tree
- collapse/expand branches
- expand all
- collapse all
- preserve collapse state through benign edits where feasible

### Commands

- `Outline View: Expand All`
- `Outline View: Collapse All`

### Exit criteria

Long documents remain navigable.

---

## Phase 5: Settings and polish

### Settings

#### General

- auto-open
- default placement (right dock in first release)
- follow active heading
- auto-scroll active heading

#### Structure

- maximum heading depth

#### Appearance

- compact / comfortable density
- small / medium / large indentation

### UI polish

- empty state
- truncation/tooltip
- keyboard focus
- hover state
- current heading state
- dark theme verification

### Exit criteria

No hard-coded prototype behavior remains.

---

## Phase 6: Stability pass

Test:

- empty file
- 1 heading
- hundreds of headings
- rapid typing
- rename heading
- change heading level
- add/delete headings
- switch files quickly
- close/open right dock repeatedly
- plugin reload
- Typora source mode
- light/dark themes
- macOS
- Windows
- Linux if available

Fix lifecycle leaks.

### Exit criteria

No known blocking bugs.

---

## Phase 7: Marketplace preparation

### Tasks

- clean README
- screenshots/GIF
- final manifest
- version `0.1.0`
- LICENSE
- release package
- installation docs
- limitations
- marketplace submission/update path

See `MARKETPLACE-RELEASE.md`.

---

# Prioritized backlog

## P0

- build/install loop
- right dock view
- heading parser
- navigation
- live refresh
- active heading
- cleanup

## P1

- collapsible tree
- settings
- depth
- density
- indentation
- auto-open
- commands

## P2

- filter/search headings
- additional placements
- heading context actions
- copy section link
- focus branch

## P3 / exploration

- tables/images/code/links/math navigator
- structural editing
- drag reorder

---

# Agentic coding workflow

For each phase:

1. read the relevant docs
2. inspect current Community Plugin APIs
3. implement the smallest coherent slice
4. build
5. run local Typora validation
6. record any API discoveries
7. update `DECISIONS.md` if architecture changes
8. move to next phase only after exit criteria pass

Do not ask an agent to implement the entire roadmap in one unreviewed pass.
