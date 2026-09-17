# Current settings experience

Open **[settings.html](settings.html)** directly in a modern browser. It is a
single self-contained file: no development server, install, network connection,
or Typora instance is needed to review it. GitHub's file viewer shows the source;
download the file and open it locally to interact.

Use the environment controls to switch light/dark themes, wide/narrow settings,
or synthetic heading documents. Settings are held in memory only; Reload or
Reset settings restores the production defaults. No personal files or installed
Typora settings are read or written. The version and source fingerprint identify
the checked-in build, not necessarily the latest published release.

## How it stays current

The generator imports the production settings tab, model, range selector, outline
preview/renderer, and styles. Only host services are adapted through
`prototype/host.ts`, using the same host DOM contract as the unit tests. The
pinned Community Plugin dependency supplies its actual CSS; remote font/image
references are removed. The plugin's MIT notice and the core's MIT notice are
included in the artifact and its source fingerprint.

After changing UI source, dependencies, or the prototype shell:

```sh
pnpm prototype:build
pnpm prototype:check
```

Include `docs/prototype/settings.html` with those changes. CI rebuilds in memory
and compares the result to the checked-in file **without overwriting it**. It
fails for missing/stale output. Production-source and dependency fingerprints
also catch changes that do not alter the bundled settings UI directly. Output
normalizes line endings and excludes absolute paths and build timestamps.

This is a generated reference, not a separately maintained mockup. Never edit
the generated HTML by hand. Prototype-only files are excluded from `plugin.zip`.

## Validation boundary

The sample themes approximate light/dark Typora theme values; they are not every
third-party theme. The prototype cannot prove native platform integration,
editor events, the OS color-picker dialog, or the workspace/dock lifecycle.
Windows and macOS native smoke testing remains required before publication.

Review minimum/maximum ranges, all selector styles, labels/dots, theme/grayscale,
hidden controls, size, emphasis states, case, custom/theme colors, resets,
section navigation, and narrow-width preview access.
