# Decision Log

This file records decisions already made so future coding sessions do not repeatedly reopen settled questions without new evidence.

## D001: Use Typora Community Plugin

**Decision:** Build this as a native Community Plugin.

**Why:** Community Plugin supports macOS and provides a modular marketplace architecture plus workspace views and right dock.

**Rejected alternative:** Depend on obgnail-on-Mac for the permanent solution.

---

## D002: Repository name is `typora-plugin-outline-view`

**Decision:** The project is not named `right-outline`.

**Why:** Right-side placement solves the first use case, but placement should not define the product identity.

---

## D003: One plugin equals one coherent user capability

**Decision:** Outline View remains focused on document outline/navigation.

Separate ideas such as Starred/Pinned files should become separate plugins.

**Why:** This aligns with the Community Plugin ecosystem and avoids recreating a monolithic obgnail-style suite.

---

## D004: Right dock is the initial/default placement

**Decision:** V1 should ship with the right dock as the validated placement.

**Why:** It solves the original Files + Outline problem and is directly supported by Community Plugin 2.10.x.

**Important:** architecture should isolate placement logic so more placements can be added later.

---

## D005: Do not move Typora's native `#outline-content`

**Decision:** Render an independent outline.

**Why:** Moving the native element risks conflicts with Typora's left-sidebar lifecycle and makes placement fragile.

---

## D006: Use Typora DOM headings for V1

**Decision:** Parse H1-H6 from the active editor DOM.

**Why:** It is simple, cross-platform, and avoids deeper private document-model APIs.

---

## D007: Avoid structural document editing in V1

**Decision:** No drag-to-reorder heading sections.

**Why:** obgnail implements this using deep Typora internals such as block maps and content reloads, which increases fragility.

---

## D008: Use obgnail as UX reference, not runtime dependency

**Decision:** Study useful `right_outline` behavior but implement natively for Community Plugin.

---

## D009: Build from smallest validated slice

**Decision:** First prove right dock + headings + navigation + refresh before implementing settings and advanced behavior.

---

## D010: No generic document navigator in V1

**Decision:** Tables, images, links, code blocks, and math are deferred.

**Why:** First establish a strong, focused Outline View. Broader navigation can be evaluated later.

---

## D011 (editor events): Use exported MarkdownEditor events for the first slice

**Decision:** Refresh on `app.features.markdownEditor` `load` and `edit` events,
plus `app.workspace` `file:open`.

**Why:** Core 2.10.21 already owns the editor observer and exposes lifecycle-safe
events. A plugin-owned `MutationObserver` is unnecessary unless hands-on testing
finds missed heading changes.

---

## D012 (view identity): Detect existing leaves by `viewType`

**Decision:** Duplicate-view protection compares
`leaf.viewType === 'prisant-labs.outline-view'`.

**Why:** `leaf.type` identifies the generic workspace node as `leaf`; it is not
the registered custom view type.

---

## D013 (initial navigation): Navigate with live heading elements

**Decision:** Each parsed heading retains its live `HTMLElement`. Navigation
uses `scrollIntoView()` and then returns focus to `#write`.

**Why:** This avoids slug generation and private document-model APIs. The view
reparses after edits and file changes, so references are refreshed.

---

## D014 (release boundary): Build toward, then tag, `0.1.0`

**Decision:** Development remains on `0.0.x`. Tag `0.1.0` only after the full V1
scope and release checklist pass.

**Why:** A Git tag should identify a releasable artifact, not the start of
implementation.

---

## D015 (0.2.0 range): One shared two-endpoint selector

**Decision:** Replace maximum-only filtering with start/end controls, allowing
equal endpoints and clamping at the opposite endpoint. Use drag, click-to-arm,
and separately focusable keyboard handles. At equality, drag direction selects
which endpoint moves. Per-document ranges remain session-only; saved defaults
are separate. Three display styles share the same behavior.

**Why:** Direct manipulation stays predictable without automatic endpoint
alternation or hidden range crossing rules.

## D016 (0.2.0 appearance): Per-rank styles with live preview

**Decision:** Use 50-250% size in 5% steps, independent on/off
emphasis, normal/uppercase/small-caps, and theme/custom native color input.
Use the same outline renderer and range component in settings. Keep Markdown
unchanged and retain a separate theme-derived active-heading cue.

**Why:** Users can judge changes immediately; normalized defaults preserve old
settings, theme color inheritance, and a visible navigation cue.

**0.2.1 revision:** User feedback replaces the original tri-state emphasis with
selected/unselected toggles. Legacy null (Theme) values normalize to false;
explicit true/false values remain unchanged. Resets turn emphasis off. Theme
color and the active-heading cue remain independent of these toggles.

**Active-cue revision:** The current heading must also honor those choices.
After testing Soft fill, the user approved Fill + outline for stronger visibility.
Fill only the current row, including its disclosure control, with
`--active-file-bg-color`, then `--item-hover-bg-color`, then a neutral translucent
fallback. Add a one-pixel inset shadow using `--active-file-border-color`, then
`--text-color`, then `currentColor`. Match the direct active label so ancestors
and descendants are not highlighted. Do not override text styles or change
padding, borders, or wrapping. Keep `aria-current` and the separate keyboard
focus cue on the focused control. This replaces the caret-like marker and does
not introduce a multi-style setting.

## D017 (0.2.0 release boundary): Tag separately from marketplace publication

**Decision:** The user authorized completion, testing, integration, and the
`0.2.0` tag. A tag identifies the verified code/package. Public release and
marketplace submission remain subject to native platform smoke checks and
repository publication approval. See [0.2.0 release notes](release/0.2.0.md).

**Why:** Automated/browser component tests do not prove native macOS integration,
and a Git tag alone is not a marketplace listing.

## D018 (settings reference): Generate the prototype from production

**Decision:** Keep `docs/prototype/settings.html` as a tracked offline artifact
generated from production settings/outline components and pinned core CSS. CI
compares deterministic regeneration and fails if the reference is stale. Adapt
only the host services and synthetic document/theme environment; never copy the
product settings markup into a second implementation.

**Why:** Design review should reflect the code being shipped. A fabricated CSS
token in the earlier browser harness masked missing native control borders.
Browser checks complement, but do not replace, native platform/theme validation.

## D019 (settings navigation): Keep section navigation inside the plugin tab

**Decision:** Use sticky section links with keyboard focus and current-section
feedback. The live preview stays beside controls at wide widths and above them
as a compact sticky card at narrow widths. Restore bounded select-label columns
and inherit supported core border/theme colors with fallbacks. Use the binary
emphasis semantics in D016 (per-rank styles), with inverse selected contrast.
The wide Live outline view is 390px, with a single metadata/sample-control row
and no guidance paragraph. Measure its actual top and visible scrollport bottom,
reserving a bottom gutter instead of assuming the sticky offset is its position.

**Why:** This keeps the preview accessible without adding another settings
sidebar column or changing host-owned navigation internals.

## D020 (dock containment): Follow only inside the outline viewport

**Decision:** Explicitly constrain the independent view to the host leaf width.
Auto-follow changes only its content viewport's vertical scroll position, never
using ancestor-scrolling `scrollIntoView` for outline items. Document navigation
still uses the live editor heading as described in D013 (initial navigation).

**Why:** Long no-wrap headings must ellipsize without expanding or horizontally
shifting the dock, its toolbar, or its balanced padding.

**Host-boundary revision:** Core 2.10.21 side-dock tabs do not inherit the flex
sizing provided to ordinary workspace split children. Constrain the direct
side-dock tab group containing `.outline-view` with flex growth, zero basis,
zero minimum width, and a 100% maximum. Scope the CSS using `:has`, so other dock
groups and main panes are unaffected and removing our view removes the match.
Do not set the host dock's width, mutate its private state, or relocate its DOM.

## D021 (wrap shortcut and samples): Share state and sample content

**Decision:** Put a two-icon current-state wrap shortcut immediately before the
settings gear. It changes the existing persisted `wrapHeadingLabels` preference;
settings and dock remain synchronized. Keep both icons visually neutral instead
of adding a second selected/unselected visual state.

The built-in preview and prototype hierarchy share the full 57-heading sample
matching `test/vault/heading-level-sample.md`. Literal `h1.`-`h6.` prefixes are
part of these synthetic labels only.

**Why:** Wrap mode is useful while reading, and a realistic long outline makes
padding, truncation, and heading styling easier to evaluate without a real file.

## D022 (active viewport): Measure tracking from the scroll viewport

**Decision:** Compare heading rectangles with the nearest actual scroll
container's viewport top plus the existing offset, not with `#write`'s top.
Use the same scroll container for end-of-document detection; root scrolling
uses viewport zero. Ignore ordinary overflowing wrappers without scrollable
CSS. Continue using the exported editor scroll event and existing cleanup.

**Why:** `#write` and its headings move together during scroll. Using its top as
the threshold can keep the first heading active forever. Tests must move the
editor rectangle as well as its headings to reproduce this native geometry.

## D023 (outline appearance): Compose optional structural aids

**Decision:** Keep the existing triangle, guides off, alternating row colors off, no section
separation, and no path aids as defaults. Offer triangle, bullet, line arrow,
folder, and no-icon disclosures while retaining the same accessible collapse
button. Add independently configurable bottom-complete vertical guides,
visible-order alternating row colors, root spacing/dividers, active-path emphasis, a
clickable current-path bar, and focus-current-branch projection.

Guide and alternating row A/B colors each use Theme, Plugin default, or Custom.
Custom values use native HTML color inputs, separate light/dark swatches, an
optional shared swatch, and opacity. Determine the active custom pair from the
computed outline surface, and refresh after standard document/theme stylesheet
mutations; do not bind to an undocumented Typora theme flag. Selected, hovered,
and keyboard-focused rows remain visually dominant over alternating row or path styling.

The settings preview and offline artifact use the production renderer,
projection helpers, current-path component, and appearance resolver.

Dependent guide, alternating row color, and selector settings are hidden and
indented beneath their enable option. Disabling a feature retains its choices.
Color-source selects use Theme / Plugin default / Custom; custom swatches and
opacity live below the select, outside its horizontal control container.
"Use light color in both themes" replaces the ambiguous shared-color label and
preserves the dark swatch when that choice is temporarily hidden.

**Why:** The aids improve scanning and location awareness at narrow dock widths
without changing Markdown or forcing a noisier default. Shared production
components keep design review aligned with shipped behavior.

## D024 (settings masthead): Keep plugin identity and release metadata compact

**Decision:** Place a compact Outline View masthead above the sticky settings
navigation. Order the metadata as author, installed manifest version, latest
published GitHub release version, release publication date, GitHub link, and
the smaller Local folder button. Put the same middle-dot separator between
GitHub and Local folder, grouped with the button so it cannot wrap alone.
Open the installed plugin directory through the public app file-opening API.
Release lookup is asynchronous, may fail
without blocking settings, and must not update a hidden or reopened tab from
an old request. The offline prototype simulates release and folder services.

**Why:** Plugin provenance and update context belong near the top of settings,
without a description or secondary links taking space from controls. The
manifest and latest published release have distinct meanings; an offline state
must not imply an update is available.

**Native host boundary:** Use a `div` for the masthead container rather than a
`header` element. Typora's window stylesheet globally positions `header` at
the top of the app window; inside Settings that pulls the masthead out of the
modal. Keep the `h2` heading for structure, and regression-test with the host
rule applied.

**Scroll boundary revision:** The masthead and section navigation share one
sticky group inside the host settings scrollport. Section jumps reserve the
group's measured height; the narrow live preview also reserves space beneath
it. A Chromium layout test runs against the production-generated settings
prototype in CI, while native Typora remains the final integration check.
