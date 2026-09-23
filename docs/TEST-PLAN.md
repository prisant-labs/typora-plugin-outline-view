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

### Inline Markdown in headings

Use `test/vault/inline-heading-formatting.md` in Typora. Confirm **Next steps**,
italic text, strike-through text, inline code, and links appear as readable
outline labels without formatting delimiters or link destinations. Check both
while editing each heading and after moving the caret elsewhere. Confirm literal
asterisks, underscores, and brackets remain where intended, and click navigation
still targets the original heading. Verify the settings live preview and current
path bar show the same clean labels. These checks require native Typora; parser
DOM tests alone do not certify every inline extension or Typora version.

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
- scroll down and back up while the document container itself moves; the active
  item must leave the first H1 and follow the current section, including at bottom
- active and inactive labels retain the same configured color/weight; only the
  theme-derived row fill/outline and accessible current-location state distinguish selection
- active fill/outline covers the current row and its disclosure control, not ancestor or
  descendant rows; hovering the active row retains its fill/outline and keyboard focus
  remains separately visible; no caret-like line appears beside the label

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
- the wrap icon immediately left of the gear shows current state, switches on
  click/keyboard, persists across restart, and agrees with the settings checkbox
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
- both a three-heading file and the 57-heading fixture fill the host tab group
  width with wrapping on/off; resizing the dock keeps all toolbar icons visible
- multiline disclosure arrows align with the center of the first heading line
- the lower-right dock control reads Toggle outline sidebar
- disabling the plugin restores the core dock tooltip

### Outline appearance and browsing aids

- each disclosure option shows only on branches and retains Expand/Collapse
  labeling, keyboard focus, and the full hit target
- heading labels remain close to triangle, bullet, arrow, folder, and empty
  disclosure treatments at compact/comfortable density and wrapped text
- guides follow real tree ancestry, end at each child container's bottom, and
  remain aligned for small/medium/large indentation
- quiet/clear guide strength remains legible in light, dark, and a third-party
  theme without overpowering heading labels
- alternating row A/B counts only visible flattened rows after collapse, expansion,
  filtering, branch focus, and file changes
- hover, current-row fill/outline, and keyboard focus remain above alternating row colors
- Theme and Plugin default resolve without stale custom inline colors
- Custom guide and alternating row A/B colors use native light/dark swatches, shared-color
  mode, and 0%, partial, and 100% opacity; invalid persisted values normalize
- guide, alternating row color, and heading-level selector subsettings are
  indented and hidden when disabled; re-enabling restores saved choices
- color-source selects remain normal height with Custom selected; the editor
  sits below the source row without overlap at wide and narrow settings widths
- "Use light color in both themes" hides and disables the dark swatch; unchecking
  restores its saved value, including after closing and reopening settings
- changing Typora theme refreshes the selected custom light/dark pair, including
  after settings preview hide/show, with no observer left after unload
- section spacing and divider appear only between root sections
- active-path emphasis marks ancestors but not siblings or the current row
- current-path buttons show root through current heading and navigate to each
  represented heading
- focus-current-branch retains ancestors plus the full selected subtree, follows
  active-heading changes, and restores the complete filtered outline when off
- reset restores the conservative production defaults without changing heading
  typography settings or document contents

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
- Confirm B/I/U have only selected (inverse) and unselected (neutral) states,
  retain accessible names/tooltips, and reset to unselected. Upgrading old null
  emphasis produces Off without changing explicit On/Off or theme/custom colors.
- Confirm the wide preview fills the available settings viewport as the modal is
  resized, with the bottom border and gutter visible; the narrow preview stays
  compact. The title is Live outline view, and Use samples is beside the document
  information. There is no style guidance paragraph. Wide card width is 390px.
- Toggle wrapping repeatedly with long H1 and nested H6 labels at narrow dock
  widths and 250% size. No-wrap labels ellipsize; toolbar, rail and side padding
  stay inside the dock. Follow headings up/down without horizontal shifts.
- Automated coverage locks width/flex CSS constraints and tests viewport sizing,
  clipping, vertical-only follow, migration, toggles and cleanup. These jsdom/CSS
  checks do not perform browser layout; repeat the native visual checks above.
- The host-boundary CSS test checks the actual side-dock/tabs/leaf selector
  hierarchy in both wrap modes, short/long labels, removal, and unaffected other
  views. Confirm native geometry separately; computed CSS is not pixel evidence.
- Use samples and the default prototype fixture both show all 57 prefixed sample
  headings, including long labels and skipped levels, without modifying #write.
- Confirm no short dash appears under either range endpoint for Rail, Enclosure,
  or Bracket with labels on or off; retain the main rail/bracket and visible
  keyboard focus cues.
- Confirm Theme hides/disables the swatch, Custom reveals it, and reset hides it.
- Test section links with pointer/keyboard, focus transfer, current section at
  the bottom, narrow sticky preview, and repeated settings hide/show cleanup.
- Repeat native Windows/macOS checks with the packed candidate, including small
  settings windows, theme contrast, live preview and native color picker.

## Settings masthead candidate

- In native Typora on Windows and macOS, open Community Plugins > Outline View
  settings. Confirm the compact masthead remains above sticky section navigation
  inside the modal, not at the app-window top behind the modal, at wide and
  narrow modal widths in light/dark themes.
- Confirm the small Local folder button follows GitHub with a middle-dot
  separator that stays with the button on wrapping, and opens the installed
  plugin directory; author and GitHub open the intended pages. No description,
  release-notes, or issue link should appear in the masthead.
- With network access, compare Installed to the manifest and Current/Last updated
  to the latest published GitHub release. With the lookup unavailable, verify
  settings still work and the badge says Unable to check.
- Close/reopen settings during a pending lookup and verify an old result does not
  overwrite the newer header. The offline prototype simulates release data and
  does not validate this native behavior.

## Release gate

- Run `pnpm run pack` and `pnpm release:check` against the actual production ZIP.
- Check exact entries, nonempty matching payloads, version/core consistency,
  both identical archive names, and current MIT/third-party notices.
- Run `pnpm audit --audit-level=moderate` after dependency changes.
- CI runs tests/types/prototype/pack checks on Linux and Windows. `CI required`
  fails if either platform fails or is cancelled. Native validation is recorded
  separately in [the release checklist](release/NATIVE-CHECKLIST.md).
