# Test Plan

## Purpose

Validate the plugin as both a Typora integration and a Community Plugin marketplace package.

## Primary validation

The most important test:

> Can Files remain visible in Typora's left sidebar while Outline View remains visible and usable in the Community Plugin right dock?

If not, stop and resolve architecture before adding features.

## Test fixture documents

The primary interactive fixture is `test/vault/doc.md`. It is a 465-line manual
test atlas containing all heading levels, skipped levels, duplicate labels,
Unicode, long labels, pseudo-headings in code and quoted content, and enough body
content for active-scroll testing. `test/vault/second.md` covers file switching.

`test/vault/heading-level-sample.md` is the presentation-quality hierarchy
fixture. Its 57 headings are prefixed with `h1.` through `h6.` and its coherent
content supports wrapping, truncation, padding, active-state, and navigation
checks without the intentionally adversarial density of the manual atlas.

Additional focused fixtures may be created for:

### `empty.md`

No headings.

### `simple.md`

```md
# One
## Two
### Three
## Four
# Five
```

### `skipped-levels.md`

```md
# One
### Three
###### Six
## Two
```

### `duplicate-headings.md`

Repeated heading text.

### Generated large outline

Generate 500+ headings for performance testing when preparing a marketplace
submission; it is not the default human-readable manual fixture.

### `editing.md`

A normal document used for interactive mutation testing.

## Functional test matrix

### Loading

- plugin loads
- no console error
- right dock can be created
- right dock can be toggled
- plugin unload does not leave orphan UI

### Parsing

- H1-H6 detected
- source order preserved
- empty headings handled
- duplicate heading names work
- skipped heading levels work
- non-heading text ignored

### Navigation

- click H1
- click nested H4/H6
- navigation still works after edit
- navigation still works after file switch
- active item remains correct after navigation

### Live refresh

- rename heading
- add heading
- delete heading
- convert paragraph to heading
- change H2 to H3
- paste multiple headings
- undo/redo heading changes

### Active heading

- scroll slowly
- scroll quickly
- jump via outline
- scroll above first heading
- scroll below final heading
- document with one heading

### Collapse

- collapse branch
- expand branch
- collapse all
- expand all
- edit inside collapsed branch
- switch files

### Settings

- auto-open on/off
- follow heading on/off
- auto-scroll on/off
- heading depth
- density
- indentation
- heading wrapping on/off, default on
- plugin-specific tab appears under Community Plugins
- settings persist at `.typora/data/prisant-labs.outline-view.json`
- minimum level never exceeds maximum level
- structure and appearance changes update an open view
- select controls remain close to their labels at normal modal widths

### Outline toolbar and dock

- Collapse all and Expand all appear as small left-aligned controls
- the right-aligned gear opens Community Plugins → Outline View
- the H1-H6 selector appears directly below the toolbar and above scrolling content
- selecting each stop immediately shows headings through that level
- a new document starts at the configured maximum heading level
- switching files restores each document's session-only selector value
- changing the selector does not change the persisted maximum heading setting
- stops below the configured minimum heading level are disabled
- Left/Up, Right/Down, Home, and End keys operate the selector
- the selected stop and track are legible in light and dark themes
- the selector remains contained at narrow sidebar widths
- outline content has balanced left and right padding
- multiline disclosure arrows align with the center of the first heading line
- the lower-right dock control reads Toggle outline sidebar
- disabling the plugin restores the core dock tooltip

## Performance

### Large outline

500+ headings:

- opening document should remain responsive
- scrolling should remain smooth
- typing heading text should not cause visible lag

### Mutation burst

Paste or delete a large Markdown section.

Verify debouncing prevents excessive renders.

## Lifecycle tests

Repeat:

1. enable plugin
2. open right view
3. switch files
4. disable plugin
5. re-enable plugin

Check:

- no duplicated listeners
- no duplicated view
- no stale outline
- no repeated MutationObservers

## Platform tests

### Required before the 0.1.0 marketplace release

- Windows

### Required before adding each platform to the manifest

- Linux

### macOS release-candidate validation

The candidate manifest includes `darwin` to permit manual installation. Remove
it before marketplace submission if the Mac smoke test does not pass.

Manifest should list a platform only after reasonable validation.

## Theme tests

At least:

- default light
- default dark
- one non-default Typora theme

Check:

- text readable
- hover visible
- active state visible
- borders appropriate
- no hard-coded white backgrounds

## Source mode

Explicitly test entering/exiting source mode.

Document expected behavior in README.

V1 does not need to support live outline parsing from source mode if Typora's normal document DOM is unavailable, but it must fail gracefully.

## Regression checklist

Before every release:

- [ ] build succeeds
- [ ] dev install succeeds
- [ ] no startup error
- [ ] Files + Outline View simultaneously visible
- [ ] click navigation works
- [ ] editing refresh works
- [ ] file switch works
- [ ] active heading works
- [ ] toggle works
- [ ] unload/reload works
- [ ] dark mode works
- [ ] wrapped and truncated heading modes work
- [ ] H1-H6 selector filters immediately and restores per-document session values
- [ ] H1-H6 selector works with mouse and keyboard at narrow and wide dock widths
- [ ] settings gear opens the Outline View tab
- [ ] both archives are byte-identical and `plugin.zip` remains present
- [ ] manifest version updated
- [ ] README limitations accurate

## 0.2.0 heading presentation regression checks

- [ ] Drag either endpoint and use click-to-arm then click-level.
- [ ] Test H2-H4, equality H3-H3, outward merged-handle drags, crossing clamps,
      arrows/Home/End, Escape, pointer cancellation, and focus loss.
- [ ] Switch documents during a drag and confirm subsequent movement cannot
      change the new document's range; verify per-file ranges and default resets.
- [ ] Check all three styles with labels on/off and theme/grayscale, hidden
      selector, narrow dock widths, light/dark and a third-party theme.
- [ ] Test all six size sliders/numbers including 50%, 250%, invalid input,
      and no compounded nesting. Check B/I/U, case, native color picker, resets.
- [ ] With custom color and Bold On/Off, the current heading remains identifiable.
- [ ] Preview real headings and sample fallback; style changes show immediately
      without closing settings, and Markdown remains untouched.
- [ ] Close/reopen the settings modal without switching tabs: hidden preview
      stays idle, reopening refreshes, and repeated cycles do not add listeners.
- [ ] Test tab hide/plugin unload during a drag and pending refresh.
- [ ] Recheck settings and dock-toggle SVG icons on macOS, including enable/unload.

Automated/browser component coverage is not a substitute for installing the
archive in native Typora. Record platform checks separately as described in
[0.2.0 release notes](release/0.2.0.md).

## 0.2.1 settings polish and prototype checks

- Run `pnpm prototype:build` when source changes; `pnpm prototype:check` must
  pass without modifying the artifact. Check rejects missing or stale output.
- Open `docs/prototype/settings.html` offline. Test its light/dark and wide/narrow
  environments, document fixtures, reset, and browser back/forward restoration.
- Check select controls remain close to labels and dropdown/preview borders are
  visible without a `--base-border` theme variable.
- Confirm Theme emphasis has a subtle tint without a corner badge, On has inverse
  contrast, Off has a neutral outline, and all states retain accessible names/tooltips.
- Confirm the wide preview fills the available settings viewport as the modal is
  resized; the narrow preview stays compact. The short style guidance appears
  above the outline, with no footer paragraph below it.
- Confirm no short dash appears under either range endpoint for Rail, Enclosure,
  or Bracket with labels on or off; retain the main rail/bracket and visible
  keyboard focus cues.
- Confirm Theme hides/disables the swatch, Custom reveals it, and reset hides it.
- Test section links with pointer/keyboard, focus transfer, current section at
  the bottom, narrow sticky preview, and repeated settings hide/show cleanup.
- Repeat native Windows/macOS checks with the packed candidate, including small
  settings windows, theme contrast, live preview and native color picker.

## Release gate

- Run `pnpm run pack` and `pnpm release:check` against the actual production ZIP.
- Check exact entries, nonempty matching payloads, version/core consistency,
  both identical archive names, and current MIT/third-party notices.
- Run `pnpm audit --audit-level=moderate` after dependency changes.
- CI runs tests/types/prototype/pack checks on Linux and Windows. `CI required`
  fails if either platform fails or is cancelled. Native validation is recorded
  separately in [the release checklist](release/NATIVE-CHECKLIST.md).
