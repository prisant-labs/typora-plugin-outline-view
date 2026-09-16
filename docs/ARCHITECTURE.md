# Architecture

## Objective

Build Outline View as an independent Community Plugin workspace view with low coupling to Typora internals.

## High-level design

```text
┌───────────────────────────────┐
│ Typora active Markdown editor │
│            #write             │
└──────────────┬────────────────┘
               │ parse / observe
               ▼
┌───────────────────────────────┐
│ OutlineModel                  │
│ Heading[]                     │
└──────────────┬────────────────┘
               │ state
               ▼
┌───────────────────────────────┐
│ OutlineController / Sync      │
│ active heading                │
│ collapse state                │
└──────────────┬────────────────┘
               │ render
               ▼
┌───────────────────────────────┐
│ OutlineView                   │
│ extends WorkspaceView         │
└──────────────┬────────────────┘
               │ mount
               ▼
┌───────────────────────────────┐
│ Placement Adapter             │
│ RightDockPlacement (V1)       │
└───────────────────────────────┘
```

## Core Community Plugin APIs

Develop against exported APIs from:

```ts
@typora-community-plugin/core
```

Expected relevant exports:

```ts
Plugin
WorkspaceView
WorkspaceLeaf
html
```

Expected application APIs:

```ts
app.viewManager.registerView(...)
app.workspace
app.workspace.rightSplit
app.commands.run(...)
app.workspace.on(...)
```

## Verified right-dock pattern

Community Plugin core has a typed command:

```text
core.workspace.right-split:ensure-leaf
```

The core's own side-dock test uses a pattern equivalent to:

```ts
viewManager.registerView(
  MyView.type,
  leaf => new MyView(leaf),
)

commands.run(
  'core.workspace.right-split:ensure-leaf',
  [`typ://${MyView.type}/Outline`],
)
```

The right dock also exposes:

```ts
app.workspace.rightSplit.expand()
app.workspace.rightSplit.collapse()
app.workspace.rightSplit.toggle()
```

## View identity

Recommended view type:

```ts
prisant-labs.outline-view
```

Recommended URI:

```text
typ://prisant-labs.outline-view/Outline
```

## Data model

Suggested type:

```ts
type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

interface OutlineHeading {
  id: string
  cid?: string
  level: HeadingLevel
  text: string
  element: HTMLElement
  children?: OutlineHeading[]
}
```

Do not make DOM elements serializable state.

If a tree representation is useful, separate:

- flat source-order headings
- nested presentation tree

## Heading source

V1 should parse the active editor DOM.

Initial selector:

```css
#write > h1,
#write > h2,
#write > h3,
#write > h4,
#write > h5,
#write > h6
```

During implementation, verify whether headings may be nested differently under any supported Typora modes/themes.

Use:

```ts
element.getAttribute('cid')
```

when available.

Generate a stable fallback ID only if necessary.

## Why not reuse `#outline-content`

Community Plugin's built-in Outline does:

```ts
document.getElementById('outline-content')
```

and switches Typora's native library view.

Do not move that DOM node.

Risks of moving it:

- Typora expects it to remain inside native sidebar structure
- native sidebar state may hide/show or reparent it
- Community Plugin's built-in outline and this plugin could conflict
- placement becomes coupled to Typora internal DOM ownership

Re-rendering a lightweight outline is safer.

## Tree construction

Input:

```text
H1 A
H2 B
H3 C
H2 D
H1 E
```

Output:

```text
A
├── B
│   └── C
└── D

E
```

Skipped levels should be handled gracefully:

```text
H1 A
H3 C
```

should not create synthetic visible headings. Attach `C` to the nearest preceding lower-level ancestor.

## Update strategy

### File changes

Listen to:

```ts
app.workspace.on('file:open', ...)
```

Then refresh after Typora's document DOM is ready.

### Heading edits

Prefer Community Plugin editor/editing events if reliable for the target core version.

A `MutationObserver` on `#write` is an acceptable V1 fallback.

Observe:

- `childList`
- `subtree`
- `characterData`

Debounce refresh.

### Scroll synchronization

Avoid rebuilding on scroll.

Maintain the current heading element list and determine active heading using:

```ts
element.getBoundingClientRect().top
```

or an `IntersectionObserver` if it behaves reliably inside Typora's scroll container.

Start with the simpler implementation and profile before optimizing.

## State

### Plugin settings

Persist through Community Plugin settings APIs.

### Collapse state

Possible keying strategies:

1. by `cid`
2. by document path + `cid`
3. session-only

Recommended V1:

- maintain collapse state for the active document during the session
- optionally persist later only after behavior is stable

Do not overbuild per-document metadata initially.

## Placement abstraction

The product is named Outline View rather than Right Outline.

Avoid embedding right-dock calls inside the outline rendering logic.

Preferred separation:

```ts
interface OutlinePlacement {
  open(): void
  close(): void
  toggle(): void
  isOpen(): boolean
}
```

V1 implementation:

```ts
RightDockPlacement
```

Future adapters may include:

```text
WorkspaceTabPlacement
FloatingPlacement
```

Do not implement them until validated.

## Suggested source layout

```text
src/
├── main.ts
├── manifest.json
├── style.scss
├── outline/
│   ├── parser.ts
│   ├── tree.ts
│   ├── state.ts
│   └── sync.ts
├── views/
│   └── outline-view.ts
├── placement/
│   └── right-dock.ts
└── settings/
    ├── settings.ts
    └── settings-tab.ts
```

For the first spike, fewer files are acceptable. Refactor only when responsibilities become clear.

## Lifecycle requirements

On unload/close:

- disconnect MutationObserver
- remove DOM event listeners
- cancel timers
- cancel requestAnimationFrame work
- release workspace/event registrations
- avoid leaving orphan right-dock views

## Styling

Use Typora/Community CSS variables where possible rather than hard-coded colors.

The view should look native in:

- light themes
- dark themes
- different Typora themes

Avoid theme-specific assumptions.

## Risk areas

### Typora DOM selectors

Risk: moderate.

Mitigation:

- centralize selectors
- add test documents
- fail gracefully when `#write` is unavailable

### Active-heading synchronization

Risk: low-medium.

Mitigation:

- keep implementation simple
- make follow mode optional
- test long documents

### Source mode

Risk: medium.

Define expected behavior:

- outline may continue showing last parsed headings
- or show a disabled state

Do not manipulate source mode in V1 unless necessary.

### Community Plugin API churn

Risk: moderate because rightSplit is relatively new.

Mitigation:

- pin/test supported core versions
- use exported API surface only
- document minimum version

## Explicitly rejected architecture

Do not:

```text
copy obgnail right_outline wholesale
```

Do not:

```text
run obgnail + Community Plugin just for outline
```

Do not:

```text
move Typora's native #outline-content
```

Use obgnail as UX/behavior reference only.

## 0.2.0 shared presentation components

- `outline/range-selector.ts` owns the two-endpoint DOM control. Pointer capture,
  keyboard handling, range clamping, and display settings are shared by workspace
  and preview. File switches and unload release active gestures.
- `outline/appearance.ts` applies normalized per-rank styles. Row-local percent
  sizing cannot compound into child lists. Weight/color custom properties allow
  active-heading CSS to take precedence without erasing user settings.
- `settings/preview.ts` reads `#write` or detached sample headings and calls the
  same parser/tree/renderer as the workspace. Preview clicks never navigate or
  mutate the editor. Preview range changes do not change saved defaults.
- `settings/settings-tab.ts` persists through public `PluginSettings`. The tab
  owns/disposes its subscriptions, debounce task, preview, and ResizeObserver.
- `selector.scss` and `settings.scss` hold scoped presentation. Both outlines use
  `.8125rem` as the theme-scaled base, avoiding the settings modal's different
  inherited size. The selector uses active-file accent/fill or neutral colors.

Core 2.10.21 calls `SettingTab.onhide` when switching tabs but not when simply
closing the settings modal. The tab observes its own layout visibility and
skips hidden rendering; reopening refreshes without requiring a fresh `onshow`.
No private Modal access or additional editor observer is needed.

`integration/icons.ts` creates font-independent SVG icons. Existing dock toggle
tooltip/icon changes are reversible and do not replace the framework's action.
If that framework element is absent, integration is a no-op; F1 Toggle remains.
