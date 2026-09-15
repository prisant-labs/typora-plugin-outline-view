# Marketplace and Release Plan

## Goal

Publish Outline View as an independent Typora Community Plugin.

## Repository identity

```text
prisant-labs/typora-plugin-outline-view
```

## Plugin identity

Recommended:

```json
{
  "id": "prisant-labs.outline-view",
  "name": "Outline View"
}
```

## Development dependency

Start with the current tested core:

```json
"@typora-community-plugin/core": "^2.10.21"
```

## Minimum core version

Initial release recommendation:

```json
"minCoreVersion": "2.10.21"
```

Reason:

The right-side dock exists in 2.10.x, but development should target the exact current version first.

After testing earlier 2.10 releases, the minimum may be reduced.

## Platforms

Release candidate while macOS testing is in progress:

```json
"platforms": ["win32", "darwin"]
```

Keep `darwin` in the marketplace submission only if the Mac smoke test passes.
Remove it after a failed or incomplete test. Add `linux` only after testing the
packaged plugin on Linux.

### Manual macOS smoke-test installation

1. Close Typora.
2. Extract `plugin.zip` so `main.js`, `manifest.json`, and `style.css` sit directly
   inside one plugin folder.
3. Copy the folder to `<vault>/.typora/plugins/prisant-labs.outline-view` for a
   vault-local test, or `~/.typora/community-plugins/plugins/prisant-labs.outline-view`
   for a global test.
4. Launch Typora and enable Outline View under Installed Plugins.
5. Run the platform and functional smoke checks in `docs/TEST-PLAN.md`.

## Release readiness

Before `0.1.0`:

- plugin builds in production mode
- manifest is correct
- README includes screenshots
- test plan passes
- LICENSE exists
- no debug alerts/log spam
- plugin has no hard-coded local paths
- package does not depend on prototype files
- limitations documented
- source mode behavior documented
- settings defaults stable

## README marketplace content

The public README should eventually contain:

1. concise value proposition
2. screenshot showing Files left + Outline right
3. features
4. requirements
5. installation
6. usage
7. commands
8. settings
9. known limitations
10. development
11. attribution
12. license

## Publishing sequence

1. Complete the automated release gate and Windows Typora smoke test.
2. Create annotated tag `0.1.0` on the verified release commit.
3. Push the release commit and tag to the public GitHub repository.
4. Run `pnpm run pack`.
5. Create a GitHub release for tag `0.1.0`, named `0.1.0`.
6. Upload `plugin.zip` to the release.
7. Optionally upload `plugin_typora-outline-view.zip` for direct distribution.
8. Fork `typora-community-plugin/typora-plugin-releases`.
9. Add this object to `community-plugins.json` and submit a pull request:

```json
{
  "id": "prisant-labs.outline-view",
  "name": "Outline View",
  "author": "Prisant Labs",
  "description": "A synchronized document outline for Typora's right workspace dock.",
  "repo": "prisant-labs/typora-plugin-outline-view",
  "platforms": ["win32"]
}
```

Community Plugin core 2.10.21 requests an asset named exactly `plugin.zip`.
The branded archive is an additional artifact, not a replacement.

## Visual asset priority

Most important screenshot:

```text
Files | Markdown document | Outline View
```

It should instantly communicate the problem solved.

Optional:

- short GIF of clicking outline headings
- GIF showing active heading following scroll
- settings screenshot

## Version strategy

### `0.0.x`

Development/prototype.

### `0.1.0`

First usable marketplace release implementing the V1 requirements in `PRD.md`,
including the core outline, active-heading synchronization, collapse behavior,
essential settings, accessibility, and stability work.

### `0.2.x`

Post-launch improvements such as filter/search, additional customization, and
other validated enhancements.

### `1.0.0`

Use only after:

- API stability
- multi-platform confidence
- no major architectural changes expected

## Attribution

The implementation should be original Community Plugin code.

The README/docs may credit obgnail's `right_outline` as inspiration.

If code is directly copied or adapted from MIT-licensed obgnail source, preserve appropriate attribution/license requirements.

Prefer reimplementation using Community Plugin APIs.

## Community Plugin references

- [Core repo](https://github.com/typora-community-plugin/typora-community-plugin)
- [Example plugin](https://github.com/typora-community-plugin/typora-plugin-example)

Before marketplace submission, verify the latest release/submission process in the Community Plugin documentation rather than relying on this document if the process has changed.
