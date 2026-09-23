# Marketplace release runbook

Repository: `prisant-labs/typora-plugin-outline-view`.
Plugin identity: `prisant-labs.outline-view` / **Outline View**.
Current release: **0.3.1** ([release notes](release/0.3.1.md)).
Existing release tags and assets are immutable.

## Publication authorization and validation

The maintainer confirmed macOS and Windows testing and explicitly authorized
publication of 0.3.1 on 2026-09-23. See the [release notes](release/0.3.1.md) and
[native validation record](release/NATIVE-CHECKLIST.md) for the preserved candidate
checksum and the distinction between maintainer reports and automated checks.

For each release:

1. Review the exact commit through a PR and require **CI required**, which
   aggregates Linux and Windows build verification. Do not bypass failed jobs.
2. Record native platform testing separately from automated checks. Keep detailed
   local evidence under ignored `_local/`; publish sanitized results only.
3. Check source, history, documentation, and artifacts being published for private
   data. Keep local plans, installed plugins, settings, and build staging ignored.
4. Confirm versions, platform claims, changelog, and release notes match the release.
5. Obtain explicit publication approval. A merged PR alone is not authorization.

## Build the reviewed commit

Use Node.js 22 and the pnpm version pinned in `package.json`, from a clean checkout
of the reviewed commit:

```sh
pnpm install --frozen-lockfile
pnpm audit --audit-level=moderate
pnpm prototype:check
pnpm test:run
pnpm test:browser
pnpm typecheck
pnpm run pack
pnpm release:check --tag 0.3.1
```

The last command validates the proposed version; it does not create a Git tag.
It checks source/package/built manifests, both identical ZIPs, exact nonempty
archive contents, and licenses. Record the printed SHA-256. The archive contains
only `main.js`, `manifest.json`, `style.css`, `LICENSE.md`, and
`THIRD-PARTY-NOTICES.md`. Use `pnpm run pack`, not the package manager's `pnpm pack`.

If native validation already covers a preserved candidate, keep its ZIP bytes
unchanged instead of repacking. Confirm any later commit changes only release
documentation, rerun the checks above except packing, and validate the existing
ZIP against its recorded checksum. CI can independently rebuild the same source.

## Tag and publish

1. Create an annotated version tag, such as `0.3.1`, on the exact reviewed merge
   commit. Confirm the tag resolves to that commit, then push only that tag.
   Do not move existing tags or push all local tags.
2. Create a draft GitHub Release for that tag, titled with the version, using
   the approved release notes with absolute links suitable for GitHub Releases.
3. Upload the exact **`plugin.zip`** and `plugin.zip.sha256`. A branded ZIP is
   optional and does not replace the required `plugin.zip` asset.
4. Verify the draft's tag, notes, files, and digest; publish it as the latest
   stable release under the maintainer's authorization.
5. Download the published archive and verify its checksum against the local
   validated build. Preserve the release receipt under ignored `_local/`.

## How marketplace updates arrive

Outline View is already registered in upstream `community-plugins.json` with
Windows and macOS support. Its entry points to this repository and does not carry
a version number. **An ordinary version update does not need another registry PR.**
A new plugin or changed registry identity/platform metadata does require one.

Publish the new version as a stable GitHub Release with the exact `plugin.zip`
asset name. The upstream statistics workflow reads releases for registered
repositories and refreshes version metadata daily at 00:00 UTC, subject to
GitHub Actions scheduling delays. Core 2.10.21 prefers those cached version
statistics, falling back to GitHub's latest release when no version is known.
It downloads `plugin.zip` from the selected release when installing/updating.

Consequently, GitHub publication can precede the marketplace's update display.
After upstream metadata refreshes, reopen Community Plugin settings and update
Outline View under Installed Plugins. Use the release ZIP for immediate manual
installation. Native marketplace install/update remains a separate check from
confirming registration and public release assets.

## References

- [Official publishing instructions](https://github.com/typora-community-plugin/typora-plugin-releases#publish-a-plugin)
- [Registry](https://github.com/typora-community-plugin/typora-plugin-releases/blob/main/community-plugins.json)
- [Version statistics workflow](https://github.com/typora-community-plugin/typora-plugin-releases/blob/main/.github/workflows/plugin-stat.yml)
- [Core release guide](https://github.com/typora-community-plugin/typora-community-plugin/blob/main/docs/en-us/dev-guide/9-releasing.md)

Recheck upstream behavior and schedules when publishing; these details were
verified on 2026-09-21 against upstream and the pinned core package. Registry
identity and the statistics workflow schedule were rechecked on 2026-09-23.
