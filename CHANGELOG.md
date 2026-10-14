# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `preFeatureStart` and `postFeatureStart` receive a second `context` argument
  describing the feature branch: whether it is new, already existed locally, or
  only existed on origin (`origin: 'new' | 'local' | 'remote'`), the release it
  is based on (`baseTag`), the latest release (`latestTag`), and whether it is
  behind (`isOutdated`). Existing one-argument hooks keep working unchanged.

### Fixed

- `feature start` in a repository without any release tag now fails with
  "No release tag found, run regit init first" instead of a raw git error.

- `release finish` now tags prerelease versions in full (e.g. `v1.0.0-beta.1`
  instead of truncating to `v1.0.0`).
- `release status` and `preview status` show the correct author and date on
  branches whose tip is a merge commit (header is parsed by field, not line
  position).
- `preview release <name>` now fails fast when the preview does not exist
  instead of continuing past the check.
- Hooks now load in projects whose `package.json` declares `"type": "module"`.
  `.regit/hooks.js` may use either CommonJS (`module.exports`) or ES modules
  (`export default`), regardless of the host project's module type.
- `.regit/hooks.js` is evaluated once per command. Previously, top-level code in
  a CommonJS hooks file re-ran for every feature shown by `feature list`,
  `release status`, `tag list`, etc.

## [1.5.0] - 2025-06-07

### Added

- `tag list` command listing the features merged between recent tags, with a
  `-n, --number` option to control how many tags to show.
