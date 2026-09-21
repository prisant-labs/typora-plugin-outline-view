# Changelog

## 0.3.0 - Unreleased

- Choose triangle, small bullet, line arrow, open/closed folder, or no collapse icon, with closer label spacing and the same accessible collapse target.
- Add optional vertical hierarchy guides with quiet/clear strength and lines extending to each branch container's bottom.
- Add alternating row colors across visible headings, with independent row A and row B colors.
- Choose Theme, Plugin default, or Custom for guides and row colors, including separate light/dark colors, a shared-color option, and opacity.
- Add section spacing/dividers, active-path emphasis, a clickable current-path bar, and focus-current-branch mode.
- Hide and indent dependent settings when their feature is disabled, preserving saved choices. Place custom color editors below their dropdowns.
- Include the new options in the live settings preview and generated offline prototype.
- Fix Markdown delimiters and source-only metadata leaking into heading labels while preserving literal punctuation and heading navigation.
- Preserve hover feedback over alternating row colors and auto-scroll immediately after revealing or focusing the active branch.
- Record maintainer-reported native validation on Windows and macOS for the tested development candidate.

## 0.2.1 - 2026-09-18

- Fix active-heading tracking against the stationary editor viewport instead of the scrolling document's top edge.
- Identify the active heading with a theme-derived row fill and fine outline without overriding its configured text color or font weight.
- Keep settings controls close to labels and the live preview in a bordered, theme-aware card.
- Add sticky settings section navigation and a compact sticky preview for narrow layouts.
- Simplify B/I/U to selected/unselected toggles without corner badges or a third state. Legacy Theme emphasis becomes Off; existing On/Off values are preserved.
- Restore dropdown borders and hide custom-color swatches in Theme mode.
- Widen the Live outline view by 50px, combine document information and Use samples in one row, and remove preview guidance text.
- Fit the live view within the visible settings viewport with bottom clearance; remove the selector's short endpoint dash.
- Constrain long unwrapped headings to the dock and keep active-heading following inside its vertical viewport, preserving toolbar and side padding.
- Stretch the containing side-dock tab group so both short and long outlines use the available width in either wrap mode.
- Add a current-state word-wrap icon beside a toothed settings gear; the toolbar and settings checkbox share one saved preference.
- Use the full 57-heading, h1.-h6.-prefixed sample hierarchy in settings and the standalone prototype.
- Add an offline, self-contained settings prototype generated from production components, with CI enforcement against stale output.
- Include MIT and third-party notices in release archives, validate archive contents and versions, and verify on Windows and Linux CI.
- Update affected build/test dependencies and add dependency-update automation and contribution/security guidance.

## 0.2.0 - 2026-09-16

- Choose both start and end heading levels with drag, click selection, or keyboard controls. Ranges are remembered per document during the session.
- Customize the selector: Rail, Enclosure, or Bracket; labels or dots; Theme or Grayscale; shown or hidden.
- Style H1-H6 independently: 50-250% size, bold/italic/underline, ALL CAPS / Small Caps, theme or custom color, and per-level/all-level reset.
- Preview appearance changes inside settings using the active document or sample headings.
- Render settings and existing dock-toggle icons as SVG, without requiring an icon font.
- Preserve active-heading emphasis with custom styling, and stop range gestures on file changes/unload.

## 0.1.0 baseline

- Independent synchronized right-dock outline, navigation, active-heading following, collapse state, and essential settings.
