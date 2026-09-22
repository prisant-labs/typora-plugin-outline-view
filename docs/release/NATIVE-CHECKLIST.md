# Native release validation

Record the exact commit, ZIP SHA-256, plugin/Typora/core versions, OS, theme, and
result for each run. Keep detailed evidence in ignored `_local/`; publish only
sanitized results. Never count browser or CI runs as native Typora testing.

## 0.3.0 development candidate signoff - 2026-09-21

The maintainer reported that the appearance options and heading-label fix looked
good in both macOS and Windows, then authorized release documentation and PR
merge. This records the maintainer's overall report, not independently observed
per-case results or authorization to publish a release.

- Tested development candidate: appearance options plus Markdown heading-label fix.
- Candidate manifest version: 0.2.1, before the 0.3.0 release-preparation bump.
- Candidate ZIP SHA-256: `48e512a991312b011b7b1156e7668b7d874da88db8ed9df826f222bb4d8b0af7`.
- Platforms: Windows and macOS. Exact OS/Typora/core versions and themes were not supplied.
- The candidate was built from uncommitted development changes; no immutable
  release commit was associated with that ZIP. Do not transfer its checksum or
  native report to a later package as if they were the same artifact.
- See [0.3.0 release notes](0.3.0.md) for scope and publication status.

The maintainer separately authorized tagging and publishing 0.3.0 on 2026-09-21.
Release preparation and the automated hover/auto-scroll fixes do not change the
identity of the earlier native-tested ZIP; the published asset carries its own
checksum. No new native test observations are inferred from publication approval.

## 0.2.1 maintainer signoff - 2026-09-18

After the initial public GitHub release, the maintainer confirmed validation
complete for the released 0.2.1 archive, clearing the Windows/macOS native gate
for marketplace submission. This records maintainer-reported completion, not
an agent-executed native test run or independently reproduced certification.

- Release: [0.2.1](https://github.com/prisant-labs/typora-plugin-outline-view/releases/tag/0.2.1).
- Release commit: `1ea35e425e9168d9eb6e12c9ebde2ce837f7c55d`.
- `plugin.zip` SHA-256: `7d1b46076f6695d76adb4a851d04c73c76fcc061544da2890d5e6cb13ac5fe95`.
- Platforms covered by the signoff: Windows and macOS.
- Detailed OS/Typora/core versions, themes, and per-case observations were not
  supplied with this confirmation. No such details are inferred from earlier runs.
- The declared Typora 1.4.0 minimum remains independently uncertified. Linux is
  not advertised. The published tag and archive have not been changed.

## Published 0.2.1 platform record

| Platform | Current 0.2.1 native gate |
| --- | --- |
| Windows | Complete - maintainer confirmation for the released archive |
| macOS | Complete - maintainer confirmation for the released archive |
| Linux | Not advertised; native testing required before adding to the manifest |

## Windows smoke evidence - 2026-09-16

These historical results describe only the preserved archive identified below,
not the final released ZIP. The final archive's maintainer signoff is recorded
above; the earlier checksum's observations are not transferred to it.

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

This historical run was a focused smoke test, not full platform certification.

## Reusable regression checklist

The unchecked boxes below are a coverage template for future test runs, not open
0.2.1 gates. The maintainer's overall signoff above is not expanded into fabricated
per-case results. For future releases, record a per-platform run including fresh
installation, lifecycle stress, keyboard coverage, and additional themes.

### Installation and lifecycle

- [ ] Fresh installation from `plugin.zip`, without a dev override or duplicate copy.
- [ ] Upgrade from 0.2.0 preserves existing settings and defaults new settings safely.
- [ ] Restart Typora; saved settings persist and auto-open follows configuration.
- [ ] Disable/re-enable and repeatedly close/open the dock; no duplicate view or errors.
- [ ] Files remain visible alongside the independent outline.

### Editing and navigation

- [ ] Navigate headings; rename/add/delete/change levels and undo/redo.
- [ ] Switch files rapidly; no stale headings, ranges, or active drag remain.
- [ ] Empty, duplicate/skipped levels, long Unicode labels, and 500+ headings.
- [ ] Active following and branch collapse work without lag during scrolling/typing.
- [ ] Scroll a long document down and back up; the active fill/outline leaves the first
      H1, reveals collapsed ancestors, and reaches the final heading at bottom.
- [ ] Enter/exit source mode gracefully; rendered mode recovers.

### Settings and accessibility

- [ ] Wide/narrow settings: controls near labels, visible containers, sticky nav/preview.
- [ ] Wide Live outline view is 390px and fills the available height after modal
      resizing without clipping the bottom border/gutter. Use samples is beside
      the source, with no guidance paragraph; narrow preview stays compact.
- [ ] Long unwrapped labels ellipsize at narrow dock widths without shifting the
      toolbar, rail or padding. Repeat after toggling wrap, at 250%, and while following.
- [ ] No B/I/U corner badge or short selector-endpoint dash; binary On/Off and
      keyboard focus stay legible.
- [ ] Rail/Enclosure/Bracket, labels/dots, theme/grayscale, hidden selector.
- [ ] Drag/click/keyboard endpoints, H2-H4, equal endpoints, crossing clamps, Escape.
- [ ] All ranks: size limits, binary emphasis, case, custom colors, resets; old
      Theme emphasis migrates to Off while explicit On/Off values are retained.
- [ ] Theme hides color swatches; native picker opens and applies a custom color.
- [ ] Live/current-document and sample preview; no Markdown changes.
- [ ] Settings modal close/reopen, tab changes, plugin unload during pending work.
- [ ] Keyboard focus is visible; section navigation and controls remain reachable.
- [ ] Light, dark, and one third-party Typora theme; active cue remains clear.
- [ ] Active fill/outline uses theme background/border colors while preserving each heading's selected
      color, bold/italic/underline, size and case; keyboard focus remains visible.
- [ ] SVG settings/dock toggle icons appear, especially on macOS.

Capture a native screenshot using only synthetic document content after passing.
Include Files + document + Outline View; hide personal paths, account details,
recent documents, and notifications. Strip image metadata before committing.
