# Native release validation

Record the exact commit, ZIP SHA-256, plugin/Typora/core versions, OS, theme, and
result for each run. Keep detailed evidence in ignored `_local/`; publish only
sanitized results. Never count browser or CI runs as native Typora testing.

## Platform record

| Platform | Current 0.2.1 native gate |
| --- | --- |
| Windows | Pending final archive smoke test |
| macOS | Pending final archive smoke test; earlier testing is not certification of this candidate |
| Linux | Not advertised; native testing required before adding to the manifest |

## Installation and lifecycle

- [ ] Fresh installation from `plugin.zip`, without a dev override or duplicate copy.
- [ ] Upgrade from 0.2.0 preserves existing settings and defaults new settings safely.
- [ ] Restart Typora; saved settings persist and auto-open follows configuration.
- [ ] Disable/re-enable and repeatedly close/open the dock; no duplicate view or errors.
- [ ] Files remain visible alongside the independent outline.

## Editing and navigation

- [ ] Navigate headings; rename/add/delete/change levels and undo/redo.
- [ ] Switch files rapidly; no stale headings, ranges, or active drag remain.
- [ ] Empty, duplicate/skipped levels, long Unicode labels, and 500+ headings.
- [ ] Active following and branch collapse work without lag during scrolling/typing.
- [ ] Enter/exit source mode gracefully; rendered mode recovers.

## Settings and accessibility

- [ ] Wide/narrow settings: controls near labels, visible containers, sticky nav/preview.
- [ ] Rail/Enclosure/Bracket, labels/dots, theme/grayscale, hidden selector.
- [ ] Drag/click/keyboard endpoints, H2-H4, equal endpoints, crossing clamps, Escape.
- [ ] All ranks: size limits, Theme/On/Off emphasis, case, custom colors, resets.
- [ ] Theme hides color swatches; native picker opens and applies a custom color.
- [ ] Live/current-document and sample preview; no Markdown changes.
- [ ] Settings modal close/reopen, tab changes, plugin unload during pending work.
- [ ] Keyboard focus is visible; section navigation and controls remain reachable.
- [ ] Light, dark, and one third-party Typora theme; active cue remains clear.
- [ ] SVG settings/dock toggle icons appear, especially on macOS.

Capture a native screenshot using only synthetic document content after passing.
Include Files + document + Outline View; hide personal paths, account details,
recent documents, and notifications. Strip image metadata before committing.
