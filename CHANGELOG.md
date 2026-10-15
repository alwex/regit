# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Agent skills in `skills/`: `regit` (using the CLI) and `regit-hooks` (writing
  and debugging `.regit/hooks.js`), installable with
  `npx skills add alwex/regit@regit` and `npx skills add alwex/regit@regit-hooks`.
- `preFeatureStart` and `postFeatureStart` receive a second `context` argument
  describing the feature branch: whether it is new, already existed locally, or
  only existed on origin (`origin: 'new' | 'local' | 'remote'`), the release it
  is based on (`baseTag`), the latest release (`latestTag`), and whether it is
  behind (`isOutdated`). Existing one-argument hooks keep working unchanged.
- `preReleaseStart` and `postReleaseStart` receive the same `context`, plus
  `version` and `trigger`: `'release-start'` for `release start`, or
  `'preview-release'` (with the `preview` name) when the release is created by
  `preview release`.
- `preReleaseFinish` and `postReleaseFinish` receive a second `context`
  argument with the release `version`, the `tag` being created, the
  `previousTag`, the `releaseBranch`, and the `features` merged into the release
  (`id`, `branch`, `baseTag`). Commits made directly on the release branch are
  not listed. `postReleaseFinish` also gets the `stableCommit` and the
  `deletedBranches`.
- New `prePreviewStart` / `postPreviewStart` hooks for `preview start`, with the
  same branch context as feature and release start (`kind: 'preview'`).
- New `prePreviewAdd` / `postPreviewAdd` hooks for `preview add`, receiving the
  `preview` name, the `previewBranch` and the `features` being merged.
- New `preReleaseAdd` / `postReleaseAdd` hooks for `release add`, receiving the
  release `version`, the `releaseBranch` and the `features` being merged.
- New `postFeaturePush(id, context)` hook, called after `feature push` has pushed
  the current feature branch, with the feature `id` and `branch` (e.g. to open a
  merge request).
- New `preFeatureRemove` / `postFeatureRemove` hooks for `feature remove`,
  receiving `{ id, branch }`. The pre hook runs before anything is deleted (and
  before switching to stable when you remove the feature you are on), so it can
  stop the removal. Not called when `release finish` deletes merged features.
- New `prePreviewRemove` / `postPreviewRemove` hooks for `preview remove`,
  receiving `{ preview, previewBranch, features }`, where `features` lists the
  features the preview contains (read before it is deleted). The pre hook can
  stop the removal. Works for a preview that only exists on origin.
- TypeScript types for hooks: annotate `.regit/hooks.js` with
  `/** @type {import('regit-cli').Hooks} */` for editor completion and type
  checking. Every context type is exported as well.
- New `getTagMessage(version, context)` hook to write the message of the tag
  created by `release finish` (e.g. release notes), using the same context as
  `preReleaseFinish`. It runs right after `preReleaseFinish`, before anything is
  pushed or merged; if it throws or does not return a non-empty string, the
  release is left untouched. Without the hook, the message is unchanged:
  `[regit] v1.2.0. (feature-a,feature-b)`.

### Changed

- `regit init` generates a `.regit/hooks.js` that lists every hook with its
  arguments and a one-line description, typed with `import('regit-cli').Hooks`.
  Existing hooks files are not touched.
- `release start` while a release is already open now fires `preReleaseStart`
  and `postReleaseStart` for the open release, with `origin: 'local'` or
  `'remote'`. Hooks that should only run for new releases can check
  `context.origin === 'new'`.
- `preview release` onto a release branch that already exists now warns
  "Release already exists release-x" instead of reporting the release as started.
- When `postFeatureStart`, `postReleaseStart` or `postReleaseFinish` fails, regit
  says the git work is done and names the failing hook, e.g. "Release 1.2.0
  finished, but hook postReleaseFinish failed: <reason>", instead of printing
  only the hook's error. The exit code stays 2. A hook that throws something
  other than an `Error` now shows that value instead of `undefined`.
- `preview start <name>` fetches from origin first, so a preview pushed by a
  teammate is checked out instead of being recreated.
- `preview add` and `release add` without a feature id print "Feature f1 merged
  into …" (the feature id), like the single-feature form already did.
- `feature remove <id>` on a feature that does not exist now fails with
  "Feature <id> does not exist" instead of git's "remote ref does not exist".

### Fixed

- `preReleaseFinish` now runs with the release branch checked out, so a hook
  that commits (e.g. a generated changelog) commits to the release and the
  change ships in the tag. Previously it ran on whatever branch was checked out.
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
- `feature list` no longer crashes with "malformed object name origin/<branch>"
  when a feature branch exists only locally; it is listed without the `origin/`
  prefix.
- `feature remove`, `preview remove` and `release remove` now work on a branch
  that was never pushed (or was already deleted on origin). Previously the local
  branch was deleted and the command then failed with "remote ref does not
  exist".

## [1.5.0] - 2025-06-07

### Added

- `tag list` command listing the features merged between recent tags, with a
  `-n, --number` option to control how many tags to show.
