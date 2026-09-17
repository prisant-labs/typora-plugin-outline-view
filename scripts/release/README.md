# Release Scripts

The current validation helper is [`../release.mjs`](../release.mjs), exposed as
`pnpm release:check`. Packaging uses the root `pack.js` through `pnpm run pack`.
Both are exercised on Linux and Windows CI. Neither publishes or creates tags.

See the [release runbook](../../docs/MARKETPLACE-RELEASE.md) for the full sequence.
Keep scripts free of local paths, credentials, and account-specific values.
