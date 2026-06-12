# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- `release finish` now tags prerelease versions in full (e.g. `v1.0.0-beta.1`
  instead of truncating to `v1.0.0`).
- `release status` and `preview status` show the correct author and date on
  branches whose tip is a merge commit (header is parsed by field, not line
  position).
- `preview release <name>` now fails fast when the preview does not exist
  instead of continuing past the check.

## [1.5.0] - 2025-06-07

### Added

- `tag list` command listing the features merged between recent tags, with a
  `-n, --number` option to control how many tags to show.
