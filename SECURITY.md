# Security

## Reporting a vulnerability

Please do not publish exploit details, credentials, personal documents, or
private paths in a public issue.

Use GitHub's **Security > Report a vulnerability** on
[this repository](https://github.com/prisant-labs/typora-plugin-outline-view/security/advisories/new)
when private reporting is available. If that option is unavailable, open an
issue requesting a private reporting channel, without sensitive details, and
wait for maintainer instructions.

Include the affected plugin, Typora, Community Plugin and operating-system
versions, minimal reproduction steps, and a synthetic document if needed.
This is a volunteer-maintained project; response times are not guaranteed.

## Supported versions and trust boundary

Security fixes target the latest published release. Before the first public
release, report issues against the current candidate on `main`. Older tags are
historical test milestones, not separately maintained security branches.

Outline View runs inside Typora with the host plugin runtime's privileges. It
reads the active document's heading DOM and stores settings through Community
Plugin. It does not send document contents to a service or deliberately modify
Markdown. Only install plugins and updates from sources you trust.

The offline prototype uses synthetic headings and in-memory settings. Build and
test dependencies are development tooling; audit findings must still be
reviewed and fixed or explicitly assessed before release.
