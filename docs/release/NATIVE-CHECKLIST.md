# Native release validation

Record the exact commit, ZIP SHA-256, plugin/Typora/core versions, OS, theme, and
result for each run. Keep detailed evidence in ignored `_local/`; publish only
sanitized results. Never count browser or CI runs as native Typora testing.

## Platform record

| Platform | Current 0.2.1 native gate |
| --- | --- |
| Windows | Focused archive smoke test passed; full release matrix remains pending |
| macOS | Pending final archive smoke test; earlier testing is not certification of this candidate |
| Linux | Not advertised; native testing required before adding to the manifest |

## Windows smoke evidence - 2026-09-16

- Candidate commit: `1dc902225efde14948c5402a779ad506a0c7298e`.
- Archive SHA-256: `8d88b738cb6d5e99c5b44db998d79d8597687f3bcbfa760e400092974aa2252d`.
- Environment: Windows build 26220, Typora 1.14.10, Community Plugin 2.10.21,
  GitHub theme, Outline View 0.2.1. Upgraded the installed 0.2.0 copy after backup.
- Passed: command-palette toggle; independent outline alongside Files; heading
  navigation; dragging both endpoints to H2-H4; switching between two documents
  and restoring the first document's temporary range after refresh.
- Passed: visible settings icon; nearby dropdown controls; contained current-document
  preview; sticky section navigation; bordered style dropdowns; filled Bold On state;
  custom swatch visibility; native color picker live update and Escape cancellation;
  H1 reset returning to Theme and hiding the swatch; sample preview switch.
- The synthetic 57-heading Markdown fixture remained byte-identical after the settings
  tests. Temporary H1 style changes were reset. No private document content was used.

This is a focused smoke test, not full platform certification. The checklist below
remains the complete release gate and requires a per-platform record, including
fresh installation, lifecycle stress, keyboard coverage, and additional themes.

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
