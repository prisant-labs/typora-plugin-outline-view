# Changelog

## 0.2.1 - Unreleased

- Keep settings controls close to labels and the live preview in a bordered, theme-aware card.
- Add sticky settings section navigation and a compact sticky preview for narrow layouts.
- Clarify Theme/On/Off emphasis controls, restore dropdown borders, and hide custom-color swatches in Theme mode.
- Keep B/I/U glyphs centered without the tiny automatic-state badge; distinguish Theme with a subtle tint and retain explicit state tooltips.
- Let the wide live preview fill the available settings height, with concise guidance above the outline, and remove the selector's short endpoint dash.
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
