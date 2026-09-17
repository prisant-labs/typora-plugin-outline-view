# Marketplace release runbook

Repository: `prisant-labs/typora-plugin-outline-view`.
Plugin identity: `prisant-labs.outline-view` / **Outline View**.
Current candidate: **0.2.1**. Existing `0.2.0` is an immutable historical tag.

## Validate before publishing

1. Review the exact commit through a PR. Require **CI required**, which aggregates
   Linux and Windows verification; do not bypass a failed job.
2. Complete [native platform checks](release/NATIVE-CHECKLIST.md) on the packaged
   candidate. Automation and native validation are separate gates.
3. Audit all branches/tags and reachable history that will become public, not
   just the working tree. Check screenshots, artifacts, issue/PR content, and
   contributor metadata; never push private intermediate work branches.
4. Confirm README, release notes, minimum versions and platform claims match the
   validated candidate. Only advertise platforms that passed native checks.
5. Obtain explicit publication and visibility approval. A merge is not a release.

## Build the reviewed commit

Use Node.js 22 and pnpm 10.33.4, from a clean checkout of the reviewed commit:

```sh
pnpm install --frozen-lockfile
pnpm audit --audit-level=moderate
pnpm prototype:check
pnpm test:run
pnpm typecheck
pnpm run pack
pnpm release:check --tag 0.2.1
```

`release:check` checks the proposed version string; it does **not** create or
verify a Git tag. It verifies matching package/source/built manifests, the
pinned core baseline, both byte-identical ZIPs, exact nonempty archive contents,
and license copies. Record the printed SHA-256 with native test evidence.

The archive contains only `main.js`, `manifest.json`, `style.css`, `LICENSE.md`,
and `THIRD-PARTY-NOTICES.md` at its root. Source, prototype, private notes, and
development dependencies are excluded. Run `pnpm run pack`; plain `pnpm pack`
is a different package-manager operation.

## Publish after approval and all gates

1. Make the repository public after the privacy review. Verify repository
   description, private security reporting, dependency alerts, and protected
   `main` with required CI. If account-plan restrictions prevented configuring
   them while private, configure them now before further merges.
2. Create an annotated **`0.2.1`** tag on the exact reviewed merge commit. Verify
   its commit with `git rev-parse 0.2.1^{commit}` and push only that tag. Never
   move `0.2.0` or use a blanket `git push --tags`.
3. Build from the tagged commit, rerun the gates, and check native validation
   still applies to these bytes. Create a draft GitHub Release titled `0.2.1`
   for that tag, with [the release notes](release/0.2.1.md).
4. Attach the exact **`plugin.zip`** plus its recorded SHA-256. The branded ZIP
   is optional and never a substitute. Review and publish the draft explicitly.
5. Submit a PR to
   [typora-plugin-releases](https://github.com/typora-community-plugin/typora-plugin-releases)
   adding an entry to `community-plugins.json`. Copy identity, description, and
   validated platforms from `src/manifest.json`; do not edit generated
   translations/statistics. Upstream acceptance controls marketplace listing.
6. Verify installation/update from the marketplace once accepted. Change the
   README candidate banner and changelog date to reflect actual publication.

No PR to the core repository README is needed for registry enrollment. Manual
releases are supported; no automatic publish workflow is required. This repo
intentionally keeps publication behind a human gate.

## Marketplace entry

Windows and macOS are currently candidate platforms. Keep `darwin` only after
the current native check passes; do not infer Linux support from Linux CI.

```json
{
  "id": "prisant-labs.outline-view",
  "name": "Outline View",
  "author": "Prisant Labs",
  "description": "A synchronized document outline for Typora's right workspace dock.",
  "repo": "prisant-labs/typora-plugin-outline-view",
  "platforms": ["win32", "darwin"]
}
```

## References

- [Official marketplace publishing instructions](https://github.com/typora-community-plugin/typora-plugin-releases#publish-a-plugin)
- [Core release guide](https://github.com/typora-community-plugin/typora-community-plugin/blob/main/docs/en-us/dev-guide/9-releasing.md)
- [MIT license](../LICENSE.md)

Recheck upstream instructions at publication time if this runbook has aged.
