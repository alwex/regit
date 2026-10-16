# Hook context reference

Exact shape of the second argument of every hook. Type names are the ones exported by
`regit-cli` (`import('regit-cli').FeatureStartContext`, …).

## Contents

- [Branch start context](#branch-start-context) — feature / release / preview start
- [Feature push context](#feature-push-context)
- [Release add context](#release-add-context)
- [Release finish context](#release-finish-context) — also `getTagMessage`
- [Preview add context](#preview-add-context)
- [FeatureSummary](#featuresummary)

## Branch start context

Types: `FeatureStartContext` (`preFeatureStart`, `postFeatureStart`), `ReleaseStartContext`
(`preReleaseStart`, `postReleaseStart`), `PreviewStartContext` (`prePreviewStart`,
`postPreviewStart`). Pre and post hooks of one command get the same object: in the pre hook it
says what is about to happen, in the post hook what happened.

| Field | Example | Meaning |
| --- | --- | --- |
| `kind` | `'feature'` | `'feature'`, `'release'` or `'preview'` |
| `id` | `'PAY-12'` | feature id, release version or preview name, without prefix |
| `branch` | `'feature-PAY-12'` | full branch name |
| `origin` | `'new'` | `'new'`: created now from `latestTag`; `'local'`: already existed locally, checked out; `'remote'`: only existed on `origin`, checked out (tracking branch created) |
| `baseTag` | `'v1.2.0'` | latest release tag merged into the branch that gets checked out (the local branch for `'local'`, `origin/<branch>` for `'remote'`); for `'new'`, the tag it is cut from |
| `latestTag` | `'v1.3.0'` | latest release tag in the repository |
| `isOutdated` | `true` | `baseTag` older than `latestTag`: the branch lacks the latest release (`git merge --no-ff <latestTag>` catches it up) |

Release start only:

| Field | Example | Meaning |
| --- | --- | --- |
| `version` | `'1.3.0'` | release version; when a release is already open, `release start` checks it out and this is the **open** release's version, not the one typed |
| `trigger` | `'release-start'` | `'release-start'` (`regit release start`) or `'preview-release'` (`regit preview release`) |
| `preview` | `'staging'` | preview name; only present when `trigger` is `'preview-release'` |

## Feature push context

Type `FeaturePushContext`, hook `postFeaturePush` (runs after the branch is pushed).

| Field | Example |
| --- | --- |
| `id` | `'PAY-12'` |
| `branch` | `'feature-PAY-12'` |

## Release add context

Type `ReleaseAddContext`, hooks `preReleaseAdd`, `postReleaseAdd`. One call per
`regit release add`, even when several features are picked in the prompt.

| Field | Example | Meaning |
| --- | --- | --- |
| `version` | `'1.3.0'` | version of the open release |
| `releaseBranch` | `'release-1.3.0'` | branch the features are merged into |
| `features` | `[{ id, branch, baseTag }]` | features merged by this command only |

## Release finish context

Type `ReleaseFinishContext` for `preReleaseFinish` and `getTagMessage`;
`ReleaseFinishedContext` (adds two fields) for `postReleaseFinish`.

| Field | Example | Meaning |
| --- | --- | --- |
| `version` | `'1.3.0'` | release version |
| `tag` | `'v1.3.0'` | tag created on `stable` |
| `previousTag` | `'v1.2.0'` | latest tag before this release |
| `releaseBranch` | `'release-1.3.0'` | branch being finished (checked out during `preReleaseFinish`) |
| `features` | `[{ id, branch, baseTag }]` | `feature-*` branches merged into the release, directly or through a preview; commits made directly on the release branch are not listed; can be `[]` |
| `stableCommit` | `'4f2c9e1…'` | post only: commit on `stable` the tag points to |
| `deletedBranches` | `['release-1.3.0', 'feature-PAY-12']` | post only: branches deleted locally and on `origin` |

Order inside `regit release finish`: checkout release branch → `preReleaseFinish` →
`getTagMessage` → push release → merge into `stable` → tag → push `stable` → delete release
and feature branches → `postReleaseFinish`.

## Preview add context

Type `PreviewAddContext`, hooks `prePreviewAdd`, `postPreviewAdd`. First argument: preview
name.

| Field | Example | Meaning |
| --- | --- | --- |
| `preview` | `'staging'` | preview name, without `preview-` |
| `previewBranch` | `'preview-staging'` | branch the features are merged into |
| `features` | `[{ id, branch, baseTag }]` | features merged by this command only |

## FeatureSummary

Entries of every `features` array.

| Field | Example | Meaning |
| --- | --- | --- |
| `id` | `'PAY-12'` | feature id |
| `branch` | `'feature-PAY-12'` | branch name |
| `baseTag` | `'v1.2.0'` | latest release tag merged into the feature on `origin` |
