---
name: regit-hooks
description: Write, change and debug regit hooks in `.regit/hooks.js`, the project file where regit runs custom JavaScript around its commands. Use this skill whenever the user wants something to happen automatically when a feature, release or preview is started, pushed, merged or finished — move a Jira/Linear/GitLab ticket, post to Slack/Teams, open a merge/pull request, generate a changelog or release notes, write the release tag message, show ticket titles next to branches — or mentions a hook name (postFeatureStart, preReleaseFinish, getTagMessage, getFeatureName, …), edits `.regit/hooks.js`, or hits a regit error like "…, but hook postReleaseFinish failed: …".
---

# regit hooks

regit (a git-flow-like CLI, see the **regit** skill for the commands) calls functions exported
by `.regit/hooks.js` before and after its git work. Hooks receive a `context` object
describing what regit is about to do or just did, so automations can react precisely, e.g.
only when a feature branch is created for the first time, or with the exact list of features
a release shipped.

## The hooks file

- `regit init` generates `.regit/hooks.js` listing every hook as a no-op, and commits it.
  `.regit/hooks.cjs` / `.regit/hooks.mjs` also work; CommonJS (`module.exports`) and ESM
  (`export default`) both load, whatever the project's `package.json` `type` says.
- The exported object is **merged over regit's defaults**: define only the hooks you need,
  delete the rest.
- Hooks run in Node (≥ 18: global `fetch` is available). `require` resolves relative to
  `.regit/`, so you can split code into `.regit/*.js` modules or use project dependencies.
- The file is loaded **once per command**; top-level code runs once per command.

Write it like this — the annotation gives editor completion, and `@ts-check` catches context
typos and wrong return types once `regit-cli` is installed in the project
(`npm i -D regit-cli`):

```js
// @ts-check

/** @type {import('regit-cli').Hooks} */
const hooks = {
    postFeatureStart: async (id, context) => {
        if (context.origin === 'new') {
            console.log(`ticket ${id} -> In progress`)
        }
    },
}

module.exports = hooks
```

Annotate a `const` and export it. With `/** @type … */ module.exports = { … }` TypeScript
types the arguments but does not check what hooks return.

## Hook catalogue

Every hook is `async (firstArg, context)`. The first argument is the feature id (`PAY-12`,
without `feature-`), the release version (`1.3.0`, without `v`) or the preview name.

| Hook | Runs during | First arg | Context (fields in `references/context-reference.md`) |
| --- | --- | --- | --- |
| `preFeatureStart` / `postFeatureStart` | `feature start` | id | branch start: `branch`, `origin`, `baseTag`, `latestTag`, `isOutdated` |
| `postFeaturePush` | `feature push`, after the push | id | `{ id, branch }` |
| `preFeatureRemove` / `postFeatureRemove` | `feature remove` (not when `release finish` deletes merged features) | id | `{ id, branch }` |
| `preReleaseStart` / `postReleaseStart` | `release start`, `preview release` | version | branch start + `version`, `trigger`, `preview?` |
| `preReleaseAdd` / `postReleaseAdd` | `release add` | version | `{ version, releaseBranch, features }` |
| `preReleaseRemove` / `postReleaseRemove` | `release remove` (not when `release finish` deletes the release) | version | `{ version, releaseBranch, features }` (features the release contains) |
| `preReleaseFinish` / `postReleaseFinish` | `release finish` | version | `{ version, tag, previousTag, releaseBranch, features }`; post adds `stableCommit`, `deletedBranches` |
| `getTagMessage` | `release finish`, after `preReleaseFinish` | version | same as `preReleaseFinish`; **returns** the tag message |
| `prePreviewStart` / `postPreviewStart` | `preview start` | preview name | branch start (`kind: 'preview'`) |
| `prePreviewAdd` / `postPreviewAdd` | `preview add` | preview name | `{ preview, previewBranch, features }` |
| `prePreviewRemove` / `postPreviewRemove` | `preview remove` | preview name | `{ preview, previewBranch, features }` (features the preview contains) |
| `getFeatureName` | listings (`feature list/status`, `release status`, `preview status/list`, `tag list`) | full branch name (`feature-PAY-12`) | none; **returns** a label shown next to the branch (`''` for none) |

`features` entries are `{ id, branch, baseTag }`. `origin` is `'new'` (branch created now
from the latest tag), `'local'` (existed locally, checked out) or `'remote'` (only on origin,
checked out for the first time on this machine).

Pick the hook from the moment you need, not from the command name: "when a ticket's branch is
first created" → `postFeatureStart` + `origin === 'new'`; "when work is shared" →
`postFeaturePush`; "when a ticket is abandoned" → `postFeatureRemove`; "when QA gets a build" → `postPreviewAdd`; "tear down a staging env" → `postPreviewRemove`; "a release is abandoned" → `postReleaseRemove`; "when it ships" →
`postReleaseFinish`.

## How regit treats hook results

- **Pre hooks can veto.** If a `pre*` hook throws, regit stops before creating, merging,
  tagging or deleting anything, prints the error and exits with code 2. Use this for checks
  (ticket exists, version allowed…).
- **Post hooks cannot undo.** They run after the git work. If one throws, nothing is rolled
  back; regit prints `<what happened>, but hook <name> failed: <reason>` and exits 2. Make
  post hooks safe to re-run by hand, and never rely on them to keep git consistent.
- **`getTagMessage` must return a non-empty string**, otherwise `release finish` stops
  (before any push or merge) with `Hook getTagMessage must return a non-empty string`. The
  default is `[regit] v1.3.0. (feature-a,feature-b)`.
- **`getFeatureName`** is called once per feature shown in a listing: keep it fast (cache,
  short timeouts) and return `''` on failure instead of throwing, or listings break.
- Hook output (`console.log`) appears in the command output.

## Gotchas that bite

- **Hooks are read from the branch that is checked out.** Branches regit creates are cut from
  the latest *tag*, so they carry the hooks file of that tag, not your latest edit on
  `stable`. A new hook applies when you run commands from a branch that contains it: commit
  it on the branch you will run the command from (e.g. the open `release-x` for a
  `postReleaseFinish` you want for this release), and ship it through a release so future
  branches inherit it.
- **Commit hook changes before running regit.** `.regit/hooks.js` is tracked; an uncommitted
  edit makes the tree dirty and regit refuses to run (`Current branch is dirty`).
- **Start hooks also fire for existing branches.** `feature start`, `release start` (even when
  a release is already open) and `preview start` fire with `origin: 'local' | 'remote'` when
  they only check a branch out. Guard "created" automations with `context.origin === 'new'`.
- **`features` only lists `feature-*` branches.** Commits made directly on a release branch
  (fixes, version bumps) are not in it; a release can have `features: []`.
- **No ticket titles in the context.** Contexts carry ids and branch names; call your own
  lookup (or your `getFeatureName`) when you need titles.
- **`preReleaseFinish` runs with the release branch checked out**, right before regit pushes
  it and merges it into `stable`. Anything you commit there ships in the release and the tag.
  Commit everything you change — leftover edits are not part of the release.
- **Secrets come from the environment** (`process.env.GITLAB_TOKEN`), never from the hooks
  file, which is committed.

## Recipes

Release notification with the shipped features:

```js
postReleaseFinish: async (version, context) => {
    const branches = context.features.map((feature) => {
        return feature.branch
    })
    console.log(`Released ${context.tag}: ${branches.join(', ') || 'no features'}`)
},
```

Release notes as the tag message:

```js
getTagMessage: async (version, context) => {
    const lines = context.features.map((feature) => {
        return `- ${feature.id} (${feature.branch})`
    })
    return [`Release ${context.tag}`, '', ...lines].join('\n')
},
```

Changelog committed into the release:

```js
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// in hooks:
preReleaseFinish: async (version, context) => {
    const repoRoot = path.join(__dirname, '..')
    const entry = context.features.map((feature) => {
        return `- ${feature.id}`
    })
    const changelog = path.join(repoRoot, 'CHANGELOG.md')
    const previous = fs.existsSync(changelog) ? fs.readFileSync(changelog, 'utf8') : ''
    fs.writeFileSync(changelog, `## ${version}\n\n${entry.join('\n')}\n\n${previous}`)
    execSync(`git add CHANGELOG.md && git commit -m "changelog ${version}"`, { cwd: repoRoot })
},
```

Merge request on push (GitLab):

```js
postFeaturePush: async (id, context) => {
    const response = await fetch(
        `${process.env.GITLAB_URL}/api/v4/projects/${process.env.GITLAB_PROJECT_ID}/merge_requests`,
        {
            method: 'POST',
            headers: {
                'PRIVATE-TOKEN': process.env.GITLAB_TOKEN ?? '',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source_branch: context.branch,
                target_branch: 'stable',
                title: id,
            }),
        }
    )
    if (!response.ok && response.status !== 409) {
        throw new Error(`merge request for ${context.branch}: HTTP ${response.status}`)
    }
},
```

## Test a hook before relying on it

Do not try hooks on the real repository: commands push to the real `origin`. Build a sandbox
with its own bare origin and run the actual commands there:

```bash
<this-skill-dir>/scripts/make-sandbox.sh /tmp/regit-sandbox path/to/hooks.js
cd /tmp/regit-sandbox/repo
regit feature start demo                 # pre/postFeatureStart, origin 'new'
regit feature start demo                 # again: origin 'local'
git commit --allow-empty -m work && regit feature push
regit release start 1.1.0 && regit release add demo && regit release finish
git tag -l --format='%(contents)' v1.1.0 # tag message from getTagMessage
```

The script commits your hooks file on `stable` and tags it `v1.0.1`, so every branch regit
creates in the sandbox contains it. To see exactly what a hook receives, log it:
`console.log(JSON.stringify(context, null, 2))`. Exercise failure paths too: a throwing
pre hook must leave no branch behind (`git branch -a`).
