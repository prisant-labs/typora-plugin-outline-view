# Contributing

Outline View is a focused heading navigator for Typora Community Plugin.
Bug reports, compatibility reports, and small improvements are welcome.

## Before changing code

- Read [AGENTS.md](AGENTS.md) and the documents it lists.
- Discuss larger features in an issue first.
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

### Dependency updates

Automated npm version updates are limited to minor and patch releases. Review
optional major migrations individually or in a deliberately tested build-tool
batch. These are pending:

- `@rollup/plugin-node-resolve` 15 to 16.
- `@rollup/plugin-typescript` 11 to 12.
- `@rollup/plugin-babel` 6 to 7.
- `archiver` 7 to 8, including its module/API compatibility with the packager.
- `@types/jquery` 3 to 4 only after checking the supported Community Plugin host's
  runtime jQuery version and declarations; newer types are not automatically a
  better compatibility target.

Security remediation must not wait for these optional upgrades. The
`allow.update-types` filter does not restrict security updates; see
[GitHub's Dependabot reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#update-types-allow).
The separate core compatibility-baseline ignore remains in place, so core updates
require manual review. Keep vulnerability alerts and the CI audit enabled.

Dependabot does not regenerate the settings prototype. A dependency PR that fails
`prototype:check` must be checked out, installed with the frozen lockfile, and have
`pnpm prototype:build` run. Review and commit the generated HTML, then rerun the
full verification commands above. A stale-prototype failure alone does not prove
that a dependency is incompatible. Never skip the check or auto-commit arbitrary
PR code from a privileged workflow just to make dependency checks green.

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
