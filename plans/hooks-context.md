# Plan: richer hook context and more lifecycle hooks

Status: decisions recorded, ready for implementation (start with S0)
Target version: 1.6.0 (additive, non-breaking)

## Goal

Hook authors need to know **what actually happened**, not just which command ran:

1. On every branch start that fires a hook: was the branch **newly created**, or did it
   **already exist** (locally, or only on `origin`)?
2. On `release finish`: **which features** went into the release, which tag was created,
   what the previous tag was. Commits on the release that do not come from a feature
   branch are **ignored** (not listed, not blocking).
3. Wider coverage: hooks for lifecycle steps that currently have none (preview, release
   add), plus the highest-value automation hooks (`getTagMessage`, `postFeaturePush`).

## Decisions

| # | Question | Decision |
| --- | --- | --- |
| Q1 | `release start` when a release is already open | **Always fire** the start hooks, with `origin: 'local' \| 'remote'`. Same rule for every `start` command. |
| Q2 | API shape | **Additive**: keep the first positional argument, add `context` as second argument. |
| Q3 | Resolve feature display names (`getFeatureName`) in finish context | **No.** Context carries ids and branch names only; hooks call their own `getFeatureName` if needed. |
| Q4 | Check out the release branch before `preReleaseFinish` | **Yes.** Listed under `Fixed` in the changelog. |
| Q5 | Post-hook failure | **Distinct message**: the command reports that the git work succeeded and which post hook failed. |
| Q6 | Scope after P1 | **As recommended**: `getTagMessage` (P3) then `postFeaturePush` (P2). Rest stays in backlog. |
| — | Non-feature commits in a release | **Ignored.** Only branches named `feature-*` appear in `features`. Direct commits, hotfixes, merged previews themselves are not listed and never block finish. |

## Current state (investigation)

### Where hooks fire today

| Command | Hooks | Argument passed | Notes |
| --- | --- | --- | --- |
| `feature start [id]` | `preFeatureStart` / `postFeatureStart` | bare id (`f1`) | `src/commands/feature/start.ts:21-23` |
| `release start [version]` | `preReleaseStart` / `postReleaseStart` | version (`1.2.0`) | via `startRelease`, `src/services/releaseHelpers.ts:18-27` |
| `release start` with an open release | none | — | just checks out, `src/commands/release/start.ts:20-23` |
| `preview release [name]` | `preReleaseStart` / `postReleaseStart` | version | same `startRelease`; hook cannot tell the release came from a preview |
| `release finish` | `preReleaseFinish` / `postReleaseFinish` | version | `src/commands/release/finish.ts:46,74` |
| any listing | `getFeatureName` | full branch name (`feature-f1`) | `src/services/featureHelpers.ts:14` |
| `preview start/add/remove`, `release add/remove/push`, `feature remove/push`, `init`, `tag list` | none | — | |

### Findings that drive the design

- **F1. Hooks cannot know if the branch was created.** `startOrCheckoutBranch`
  (`src/services/gitHelpers.ts:212`) decides internally between "create from latest tag
  + empty `[regit] Init` commit + push" and "checkout existing", logs it to stdout, and
  returns `void`. The pre hook runs before that decision, the post hook gets nothing.
- **F2. There are three states, not two.** Branch exists locally → plain checkout.
  Branch exists only on `origin` → `git checkout` creates a tracking branch (first time
  on this machine, e.g. picking up a teammate's feature). Branch exists nowhere → created.
- **F3. `release finish` already computes the feature list but throws it away.**
  `features` is built at `src/commands/release/finish.ts:35` (used to gate the finish and
  to write the tag message), but hooks only get `version`. After finish the feature
  branches are deleted, so `postReleaseFinish` cannot recompute it. The list must be
  captured before the merge and passed to both hooks.
- **F4. `preReleaseFinish` runs on whatever branch the user is on.** Finish never checks
  out the release branch before the pre hook. The docs example ("generate changelog,
  commit and push" in `preReleaseFinish`) commits to the wrong branch.
- **F5. `preview start` creates branches with no hooks at all**; `preview release` fires
  the release-start hooks with no way to tell the origin.
- **F6. Inconsistent first argument.** `getFeatureName` receives `feature-f1`,
  `preFeatureStart` receives `f1`; both are typed `id: string`. Kept as-is (Q2 additive);
  the context object exposes both `id` and `branch` to remove the ambiguity.
- **F7. Hook error semantics are implicit.** A throwing pre hook aborts the command
  (undocumented). A throwing post hook exits with the generic error path even though the
  git work already succeeded.
- **F8. Hooks are reloaded on every call.** `getHooks()` re-reads and recompiles the
  file each time; `getRemoteFeatureName` calls it once per feature row.
- **F9. Stale artefacts.** `src/templates/hooks.ts` lacks `preReleaseStart` /
  `postReleaseStart`; `README.md` still documents `regit.js` at the project root.
- **F10. How the feature list is derived, and why non-feature commits are already
  excluded.** `listBranchesInBranch` returns remote branches named `feature-*` that are
  `--merged` into the release (fully merged), plus existing feature branches named in
  merge commit messages on the release (partially merged, reflog-based). A direct commit
  on the release branch is neither a `feature-*` branch nor a merge of one, so it is
  naturally excluded. The plan relies on this and pins it with tests (see S3) rather than
  changing the derivation.

## Design

### D1. Backward-compatible API: add a second `context` argument (Q2)

```ts
preFeatureStart: (id: string, context: BranchStartContext) => Promise<void>
```

Existing user hooks keep working unchanged (JS ignores extra args).

### D2. Shared `BranchStartContext` for every start hook

Same shape for feature, release, preview so users learn it once.

| Field | Example | Meaning |
| --- | --- | --- |
| `kind` | `'feature'` | `'feature' \| 'release' \| 'preview'` |
| `id` | `'f1'` | id / version / preview name without prefix |
| `branch` | `'feature-f1'` | full branch name |
| `origin` | `'new'` | `'new' \| 'local' \| 'remote'` — in pre hooks: what is about to happen; in post hooks: what happened |
| `baseTag` | `'v1.1.0'` | tag the branch is/was cut from (new) or latest tag merged into the ref that gets checked out: the local branch for `'local'` (so an unpushed `git merge --no-ff <tag>` counts), `origin/<branch>` for `'remote'` |
| `latestTag` | `'v1.2.0'` | latest tag in the repo |
| `isOutdated` | `true` | `baseTag < latestTag` (feature start already computes this for its warning) |

Release-only extras: `version`, `trigger: 'release-start' | 'preview-release'`,
`preview?: string` (preview name when `trigger === 'preview-release'`).

**Firing rule (Q1):** every `start` command (`feature start`, `release start`,
`preview start`, and `preview release` for its release branch) fires its start hooks
whatever the `origin`. Internal checkouts that are not a "start" (`release add` opening
the release, `preview add` opening the preview, switching to `stable` in remove/finish)
do **not** fire start hooks.

Note: `release start 2.0.0` while `release-1.9.0` is open checks out `release-1.9.0`
(current behaviour, with a warning). Hooks then receive the **open** release
(`version: '1.9.0'`, `origin: 'local' | 'remote'`), not the requested version.

### D3. `ReleaseFinishContext`

| Field | Example | Pre | Post |
| --- | --- | --- | --- |
| `version` | `'1.2.0'` | ✓ | ✓ |
| `tag` | `'v1.2.0'` | ✓ | ✓ |
| `previousTag` | `'v1.1.0'` | ✓ | ✓ |
| `releaseBranch` | `'release-1.2.0'` | ✓ | ✓ |
| `features` | `[{ id: 'f1', branch: 'feature-f1', baseTag: 'v1.1.0' }]` | ✓ | ✓ |
| `stableCommit` | sha of the merge on stable | | ✓ |
| `deletedBranches` | `['release-1.2.0', 'feature-f1']` | | ✓ |

- `features` contains **only `feature-*` branches**. No `commits` / `otherCommits`
  field: non-feature commits are ignored by design.
- No display names (Q3). Same list regit writes into the tag message.
- A release with zero features (only direct commits) is valid: `features: []`.

### D4. Separate "decide" from "do" in branch start

Refactor `startOrCheckoutBranch` into an inspection step returning `{ origin, baseTag }`
and an action step. Commands: inspect → pre hook (context) → act → post hook (same
context). Pure refactor, covered by existing tests.

### D5. Hook classes and error contract

- **Pre hooks** may veto: throwing aborts the command before any git change. Message as
  today.
- **Post hooks** are notifications; the git work is already done. If one throws, regit
  prints a **distinct message** (Q5), e.g.
  `Release 1.2.0 finished, but hook postReleaseFinish failed: <error message>`, and
  exits non-zero so CI still notices.
- **Transformer hooks** (`getX`) return a value regit uses.

## Catalogue of hooks

### Scheduled

| Prio | Hook | Context | Use case |
| --- | --- | --- | --- |
| P1 | `prePreviewStart` / `postPreviewStart` | `BranchStartContext` (`kind: 'preview'`) | spin up / reuse a preview environment |
| P1 | `preReleaseAdd` / `postReleaseAdd` | `{ version, releaseBranch, features: [...] }` (features added by this command) | move tickets to "in release / QA" |
| P1 | `prePreviewAdd` / `postPreviewAdd` | `{ preview, previewBranch, features: [...] }` | redeploy preview env, comment on tickets |
| P1 | release start from `preview release` | `trigger: 'preview-release'`, `preview` | know the release came from a preview |
| P3 | `getTagMessage(context: ReleaseFinishContext)` → `string` | | release notes in the annotated tag instead of `[regit] v1.2.0. (feature-a,feature-b)`; default keeps today's message |
| P2 | `postFeaturePush` | `{ id, branch }` | open a merge/pull request automatically |

### Backlog (not scheduled)

| Prio | Hook | Use case |
| --- | --- | --- |
| P2 | `preFeatureRemove` / `postFeatureRemove` | close / unassign ticket, delete preview env |
| P2 | `preReleaseRemove` / `postReleaseRemove` | "release aborted" notification |
| P2 | `prePreviewRemove` / `postPreviewRemove` | tear down preview env |
| P2 | `postReleasePush` | trigger staging deploy |
| P2 | `postInit` | bootstrap CI config |
| P3 | `validateFeatureId(id)` | enforce Jira key format before branch creation |
| P3 | `suggestVersion(context)` | preselect version prompt from labels / conventional commits |
| P4 | `onError({ command, hook?, error })` | alert when a finish fails half-way |
| P4 | `onEvent(name, context)` | single catch-all for telemetry / Slack |

Rejected: passing a `git` (simple-git) instance in context — couples the public hook API
to a dependency version. Pass `cwd` instead.

## Delivery slices

One PR each, TDD (red → green → mutate → refactor). Each slice updates
`starlight/src/content/docs/reference/hooks.mdx`, `src/templates/hooks.ts`, and the
`Unreleased` section of `CHANGELOG.md`. Version bump to 1.6.0 (package.json,
`src/version.ts`, tag, changelog heading) happens once, at release time.

| # | Slice | Changelog |
| --- | --- | --- |
| S0 ✅ | Split `startOrCheckoutBranch` into inspect + act (D4); load hooks once per run (F8). Characterisation test for "branch only on origin" checkout. | Fixed (F8: hooks file evaluated once per command) |
| S1 ✅ | Feature start: `BranchStartContext` for `new`, `local`, `remote`. Branch start in a repo without any tag fails with "No release tag found, run regit init first" (needed so `latestTag` is always a string). | Added + Fixed |
| S2 ✅ | Release start: context for new release; always fire on open release (Q1); `preview release` trigger. Start message chosen from `origin` ("started" vs "already exists"). Tests drive the `preview release` version prompt with piped stdin (`printf '\n' \| node build/src/index.js preview release p1`). | Added + Changed (Q1; `preview release` onto an existing release branch now warns "already exists") |
| S3 ✅ | Release finish: `ReleaseFinishContext` (feature-only list); checkout release branch before `preReleaseFinish` (Q4). Post hook context type is `ReleaseFinishedContext` (adds `stableCommit`, `deletedBranches`). Q4 is pinned by recording the branch each hook runs on (recording fixture records `git branch --show-current`). | Added + Fixed (Q4) |
| S4 ✅ | Post-hook failure message (D5, Q5) for all post hooks, via `runPostHook`. Exit code stays 2 (same as every other error). Non-`Error` throws are reported with their value. Pre-hook abort pinned by a test. Recording fixture fails on demand (`FAIL_HOOK`, `FAIL_HOOK_VALUE` env vars). | Changed |
| S5 ✅ | Preview start / add hooks (P1), with `git fetch` warmup on `preview start <name>` so `origin` is accurate. `PreviewAddContext` = `{ preview, previewBranch, features }`; feature shape shared with release finish as `FeatureSummary`. One pre/post pair per `preview add`, even with several features picked. Tests drive the checkbox prompt with `printf 'a\n'` (toggle all). | Added + Changed |
| S6 ✅ | Release add hooks (P1). `ReleaseAddContext` = `{ version, releaseBranch, features }`, one pre/post pair per `release add`. Release is still pushed once after all merges. Added characterisation tests for "no open release" and "unknown feature". | Added + Changed |
| S7 ✅ | `getTagMessage(version, context)` (P3), first arg `version` for consistency with the other hooks. Runs right after `preReleaseFinish`, before push/merge; result must be a non-empty string or the finish stops with "Hook getTagMessage must return a non-empty string". Default reproduces `[regit] v1.2.0. (feature-a,feature-b)` (pinned by a characterisation test). `createTag` now takes `{ tag, message }`. | Added |
| S8 ✅ | `postFeaturePush(id, { id, branch })` (P2), post hook only (as planned), runs after the push. Added characterisation tests for `feature push` (pushes to origin; rejected outside a feature branch). | Added |
| S9 ✅ | Template lists all 15 hooks (its `getTagMessage` reproduces the default message, since the template is merged over defaults); README hooks section rewritten. Types: `src/types.ts` exports `Hooks = Partial<…>` + every context type, `declaration: true`, `package.json` `"types": "build/src/types.d.ts"`. Recommend `/** @type … */ const hooks = {…}; module.exports = hooks`: with `@type` on `module.exports =` TS only types arguments, not return values. Tests type-check fixtures and the generated template with the real `tsc`. | Added + Changed |

## Acceptance criteria

### S1 — feature start

- Feature exists nowhere → pre and post hooks receive `origin: 'new'`,
  `baseTag` = latest tag, `isOutdated: false`.
- Feature exists locally → `origin: 'local'`.
- Feature exists only on `origin` (local branch deleted) → `origin: 'remote'`.
- Feature cut from an old tag → `isOutdated: true`, `baseTag` = that old tag.
- Existing single-argument hook file still works (regression).

### S2 — release start

- No open release → `origin: 'new'`, `trigger: 'release-start'`.
- Release already open → hooks **fire** with `origin: 'local'` (or `'remote'` when only
  on origin), `version` = the open release's version.
- `preview release p1` → `trigger: 'preview-release'`, `preview: 'p1'`.

### S3 — release finish

- Release with features f1, f2 → both hooks get `features` = exactly f1 and f2,
  `tag: 'v<version>'`, `previousTag` = tag before finish.
- **Release with f1 plus a direct commit on the release branch** → `features` = f1 only;
  finish succeeds; nothing in the context represents the direct commit.
- **Release with only direct commits (no feature)** → finish succeeds,
  `features: []`.
- **Release created from a preview** containing f1 → `features` = f1; the preview branch
  is not listed.
- `preReleaseFinish` runs with the release branch checked out; a commit made by the hook
  ends up on stable and in the tag.
- Post hook gets `stableCommit` (sha of stable after merge) and `deletedBranches`.

### S4 — post-hook failure

- Post hook throws → stderr names the command, states the git work completed, names the
  failing hook and its error message; exit code non-zero.
- Pre hook throws → command aborted, no branch created / merged / tagged (pins existing
  behaviour).

## Test strategy

- **Spawn `node build/src/index.js`**, not `ctx.regit()` (CLAUDE.md gotcha: hook loading
  needs Node's real module loader).
- Recording hook fixture: every hook appends `{ hook, args }` as a JSON line to a log
  file; tests parse the log and assert on the context.
- **Dirty-tree gotcha:** most commands call `assertCurrentBranchIsClean`. The log file
  must live **outside the repo** (absolute path baked into the fixture, or an env var),
  and the overwritten `.regit/hooks.js` must be **committed** after `init`, otherwise
  `feature start` fails with "Current branch is dirty".
- `origin: 'remote'` scenario: start + push a feature, `git checkout stable`,
  `git branch -D feature-f1`, start again.
- Direct-commit scenario: on the release branch, `git commit --allow-empty -m "hotfix"`
  and push, then finish.
- Pass explicit ids/versions so no interactive prompt is hit (`preview release` prompts
  for a version — needs a non-interactive path or stdin input in tests).

## Risks

- Hook context becomes a public contract; renaming a field later is breaking. Keep the
  field set small; prefer adding over changing.
- `origin` depends on `git fetch` having run. Commands that skip warmup could report
  `new` for a branch that exists remotely but was not fetched. S5 adds warmup to
  `preview start <name>`.
- Partial-merge detection in `listBranchesInBranch` scans commit messages for a quoted
  name. A direct commit whose message quotes an **existing** feature branch name (e.g.
  `revert 'feature-f1'`) could be mistaken for a merge of it. Out of scope; noted for a
  later story that unifies this with the `tag list` source (`[regit] Init` commits).
- Q1 changes behaviour for existing `postReleaseStart` users (fires more often).
  Documented under `Changed`; hooks can filter on `context.origin === 'new'`.
