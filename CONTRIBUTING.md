# Contributing

Outline View is a focused heading navigator for Typora Community Plugin.
Bug reports, compatibility reports, and small improvements are welcome.

## Before changing code

- Read [AGENTS.md](AGENTS.md) and the documents it lists.
- Discuss larger features in an issue first. Search, alternate icons, hierarchy
  guides, and placements are tracked in [the backlog](docs/BACKLOG.md).
- Keep document content unchanged. Use public Community Plugin APIs and never
  move Typora's native outline DOM.
- Use synthetic Markdown in tests, screenshots, and reports. Never submit real
  document contents, local settings, secrets, or machine-specific paths.

## Development

Use Node.js 22 and the exact pnpm version in `package.json` (10.33.4).

```sh
pnpm install --frozen-lockfile
pnpm test:run
pnpm typecheck
pnpm run pack
pnpm release:check
pnpm audit --audit-level=moderate
pnpm prototype:check
```

For UI or dependency changes, run `pnpm prototype:build` and include the generated
`docs/prototype/settings.html`. Do not edit that HTML directly. See the
[prototype guide](docs/prototype/README.md). CI checks freshness before any build
and validates the real ZIP on Linux and Windows. Those checks do not certify
native Typora integration or Linux plugin support.

Use `pnpm run build:dev` for the existing development install loop. Keep personal
notes and testing evidence under ignored `_local/`. Do not commit ZIPs, `dist/`,
installed plugins, or local session logs.

## Pull requests

Include the user-visible change, test coverage, and native platforms/themes
actually checked. Add regression tests for behavior fixes. Update the changelog
for user-visible changes and retain license notices when adapting third-party
code. Keep lifecycle cleanup and keyboard access intact.

Merge through a reviewed PR with the `CI required` check passing. Do not force
push `main`, move existing release tags, or treat a merged PR as authorization
to publish. Follow the [release runbook](docs/MARKETPLACE-RELEASE.md).

Contributions are provided under this repository's [MIT license](LICENSE.md).
Please keep discussions respectful and focused on the work.
