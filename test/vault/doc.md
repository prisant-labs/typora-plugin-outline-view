# Outline View 0.1.0 Manual Test Atlas

This deliberately long document exercises navigation, hierarchy, filtering,
collapse state, active-heading tracking, Unicode, duplicate names, skipped
levels, and live refresh. Keep the Outline View open while moving through it.

> Test rhythm: scroll slowly, jump by clicking the outline, collapse branches,
> change settings, edit a heading, and switch to `second.md` before returning.

## Quick smoke test

1. Open the Outline View from F1.
2. Confirm this H2 appears below the first H1.
3. Click **Expected starting structure** in the outline.
4. Collapse and re-expand the first branch.
5. Scroll until the active outline highlight follows the document.

### Expected starting structure

With the default expansion setting of H3, this H3 is visible. Its deeper child
starts behind this branch's disclosure until the H3 branch is expanded.

#### Initially concealed detail

This H4 checks the exact boundary of the default expansion depth.

##### A fifth-level detail

The outline should keep nesting without losing the parent chain.

###### The deepest opening detail

This H6 is the first maximum-depth heading in the fixture.

### First sibling branch

Sibling branches should not inherit one another's disclosure state.

#### First sibling detail

Clicking this outline item should move the editor here and keep focus usable.

#### Second sibling detail

Collapse the preceding sibling and confirm this item remains available.

## Settings tour

Open F1, choose **Open Plugin Settings Modal**, and select **Outline View** under
Community Plugins. Changes should affect an already-open outline.

### Heading range: H1 through H6

This is the default range. Narrow the maximum to H3: all H4-H6 entries should
disappear while their text remains in the document.

#### H4 filtered at maximum H3

This entry is intentionally below the temporary maximum.

##### H5 filtered at maximum H3

This is another filtered descendant.

###### H6 filtered at maximum H3

Restore the maximum to H6 and confirm all three entries return.

### Heading range: start at H2

Set the minimum level to H2. Top-level H1 items should disappear, while visible
H2 items become roots and their descendants retain useful nesting.

#### A child while H1 is hidden

This H4 remains attached through the nearest visible lower-level ancestor.

### Density and indentation

Switch between compact and comfortable density, then small, medium, and large
indentation. Labels should remain aligned and disclosures should remain clickable.

#### A moderately long heading used to compare indentation at several nesting depths

Resize the right dock narrowly and confirm the label truncates instead of
overlapping the dock boundary. Hovering should reveal the full label as a title.

##### Dense nested item

This item makes changes in row height easy to see.

###### Densest nested item

Keyboard focus should remain visible at the deepest level.

# Hierarchy stress laboratory

This section contains ordinary and deliberately irregular heading sequences.

## Regular branch Alpha

Alpha uses every heading depth in order.

### Alpha planning

Scroll tracking should select this heading after it crosses the editor threshold.

#### Alpha implementation

The active item should reveal its collapsed ancestors automatically.

##### Alpha verification

The outline should scroll only as much as needed to reveal this active item.

###### Alpha archival detail

This is the end of the fully regular Alpha chain.

### Alpha operations

This H3 is a sibling of Alpha planning, not its child.

#### Alpha monitoring

Collapse only this branch, move away, and return within the session.

##### Alpha alert policy

The remembered state should be keyed to this file.

## Regular branch Beta

Beta checks that a new H2 closes the prior H2 branch.

### Beta discovery

The disclosure state from Alpha must not leak into Beta.

#### Beta analysis

Use **Outline View: Collapse All**, then **Outline View: Expand All**.

##### Beta decision

All branches should respond, while leaf headings have no disclosure control.

###### Beta record

The deepest leaf should still navigate correctly.

## Skipped-level branch

The next heading jumps directly from H2 to H5.

##### Jump from H2 directly to H5

No synthetic H3 or H4 rows should be shown. This H5 attaches to the nearest
preceding lower-level heading - **Skipped-level branch**.

###### H6 after a direct H5 jump

This H6 is a normal child of the preceding H5.

### Return upward to H3

This closes the jumped H5 chain and becomes a child of the H2.

###### Jump from H3 directly to H6

Again, no placeholder levels should appear.

#### Return from H6 to H4

This H4 is a child of **Return upward to H3**, not of the H6.

## Another skipped-level shape

#### Start this branch at H4

The renderer should handle a root-relative jump consistently.

###### Then jump to H6

This nests under the H4.

### Then return to H3

This becomes a sibling path below the H2.

# Duplicate label laboratory

Stable identity must not depend on heading text alone.

## Repeated section

This is the first H2 named **Repeated section**.

### Status

This is the first H3 named **Status**.

#### Details

This is the first H4 named **Details**.

### Status

This is the second H3 named **Status** under the same parent.

#### Details

This is the second H4 named **Details**.

## Repeated section

This is the second H2 with the same label.

### Status

Collapse this Status branch only. Other Status branches should remain unchanged.

#### Details

Navigation should land on this particular duplicate, not the first match.

## Repeated section

This third copy checks identity after several equal labels.

### Status

Rename this heading to **Status edited live** during the refresh test.

#### Details

Undo the rename and confirm the outline refreshes again.

# Text and character coverage

Labels below contain punctuation, inline syntax, and multiple writing systems.

## Punctuation: commas, periods, colons: semicolons; parentheses (yes), and question marks?

The rendered label should be readable and its navigation target exact.

### Inline `code`, **strong text**, *emphasis*, and [a link](https://example.com)

The outline should display the heading's readable text content.

#### Ampersands & angle-like text less than greater than and "quoted words"

No text should be interpreted as injected HTML.

## Unicode: café, naïve, résumé, jalapeño, and Ångström

Accents should remain intact.

### Ελληνικά: Δοκιμή περιγράμματος

Greek characters provide another text-rendering check.

### 日本語: アウトライン表示のテスト

Japanese characters should render and navigate normally.

### العربية: اختبار عرض المخطط

Mixed-direction text should not break the surrounding dock layout.

### Emoji markers: 🧭 navigation, 🌲 hierarchy, and ✅ completion

Emoji may vary by platform but should not disappear or corrupt nearby text.

#### A very long heading intended to exceed the width of a narrow right-hand workspace dock so that truncation, hover titles, active highlighting, and disclosure alignment can all be inspected together

Narrow the dock until the label truncates, then widen it again.

# Content that must not become outline headings

Only actual document headings belong in the Outline View.

## Fenced code is not a heading source

```markdown
# Not a real H1 - inside a fenced code block
## Not a real H2 - inside a fenced code block
### Not a real H3 - inside a fenced code block
```

The three hash-prefixed lines above must not appear in the outline.

### Nested fences and source examples

```typescript
const sample = `# Still not a document heading`;
function renderHeading(text: string) {
  return `<h2>${text}</h2>`;
}
```

Neither string content nor example HTML belongs in the outline.

## Block quotes and list content

> # Quoted hash text
>
> This block quote looks heading-like in source but is content for this test.

- `# Hash text in a list item`
- A normal list item
  - A nested item with `## more hash text`

### A real heading after quoted and listed hashes

This confirms parsing resumes normally after complex body content.

## Table content

| Level | Default visibility | Purpose |
| --- | --- | --- |
| H1 | Visible | Document roots |
| H3 | Visible | Default expansion boundary |
| H6 | Behind H3 branch | Deep navigation |

### A real heading after a table

The table's cells must never appear as outline items.

# Scroll tracking endurance course

The following sections contain enough prose to create meaningful scroll distance.

## Stage one - orient

The active highlight should reach Stage one when this heading becomes the current
section. Click elsewhere in the outline and return by scrolling rather than by
navigation. The highlight should follow the editor without rebuilding or visibly
flashing the full tree.

### Stage one checklist

Read this paragraph slowly while watching the right dock. Resize the window,
move the editor by a few lines, and confirm the current item remains stable near
the threshold instead of rapidly switching between adjacent headings.

#### Stage one checkpoint A

Lorem ipsum is avoided here so the manual fixture remains meaningful. The key
observation is whether a collapsed parent opens when its descendant becomes the
active heading through normal scrolling.

#### Stage one checkpoint B

After this checkpoint is active, collapse a different branch. The active branch
should remain visible and the unrelated disclosure should respect your click.

## Stage two - accelerate

Use Page Down several times, then drag the scrollbar. The active item may update
after a short scheduled delay, but the editor should stay responsive.

### Stage two checkpoint

Turn **Auto-scroll outline** off. Scroll until the active heading would normally
move the outline list; the highlight should update without forcing the dock to
scroll. Turn the setting back on for the next stage.

#### Stage two deep checkpoint

With auto-scroll restored, this item should be kept within the outline viewport.

##### Stage two deeper checkpoint

Collapse the H4 parent before scrolling here and confirm ancestor reveal.

###### Stage two deepest checkpoint

This is a high-value case for active-heading reveal at maximum nesting.

## Stage three - file switch

Collapse a few branches in this file, open `second.md`, and then return here.
With session memory enabled, the prior disclosure choices should return.

### Stage three alternate behavior

Disable session memory, refresh, and repeat the file switch. Branches should use
the configured default expansion depth rather than the prior remembered state.

## Stage four - document bottom

The final visible section must become active near the bottom even if its heading
cannot cross the normal top threshold because there is little content after it.

### Penultimate checkpoint

Scroll close to the bottom and watch the highlight move from this checkpoint.

#### Almost finished

The final H2 below should still be selected when the viewport reaches the end.

# Live editing and recovery

These cases exercise the edit scheduler and empty or unavailable states.

## Rename this heading during testing

Add the word **edited**, wait briefly, and confirm the outline label changes.
Undo the edit and confirm it changes back.

### Add a sibling below this heading

Create a new H3 after this paragraph. Confirm it appears without closing the view.

### Delete this temporary-target heading

Delete this heading during a test and undo the deletion afterward.

## Temporarily remove visible levels

Use the level filters to create the smallest useful visible set, and confirm the
specific no-visible-headings message appears only when appropriate.

### Recovery after filtering

Restore H1-H6 and confirm the full hierarchy returns with functional navigation.

# Final release checks

This final root collects the last pre-release observations.

## Keyboard and focus

Tab through toolbar disclosures and heading buttons. Focus rings should be clear,
Enter or Space should activate the focused control, and focus must not disappear
behind another element.

### Expand all from the toolbar

Every branch should expose all descendants, including H6 leaves.

### Collapse all from the toolbar

Only root rows should remain visible, with functional disclosures to reopen them.

## Theme and layout

Inspect the view in the current light or dark theme, then switch themes if that
is convenient. Text, hover, focus, active state, and borders must remain legible.

### Narrow dock

Drag the dock narrower and confirm labels truncate cleanly.

### Wide dock

Drag it wider and confirm the tree uses the available space without oversized
gaps or a duplicate internal **Outline** title.

## Last heading at the bottom of the document

At the absolute bottom, this item should be active, visible in the outline when
auto-scroll is enabled, and navigable after jumping back to the top.
