---
name: regit
description: Drive the regit CLI in repositories that follow the regit branching model (a long-lived `stable` branch, `feature-*`, `preview-*` and `release-*` branches, `v<semver>` tags, a `.regit/` folder). Use this skill whenever you work in such a repo and need to start, switch to, push or remove a feature; stage features on a preview/staging branch; open, fill, finish or abandon a release; pick the next version; catch a feature up with the latest release; or find out what shipped in a version — even if the user never says "regit" and just talks about tickets, branches, staging, shipping or tagging.
---

# regit

regit is a small git-flow-like CLI. It owns the lifecycle of four branch types and the
release tags. In a regit repo, create, merge, tag and delete these branches **through
regit**, not raw git: regit cuts branches from the right tag, writes the
`[regit] Init '<branch>'` commit that `regit tag list` and `regit release status` rely on,
pushes every change to `origin`, and runs the project's hooks (ticket updates,
notifications, release notes) that a raw `git checkout -b` would silently skip.

## Recognise a regit repo

Any of: a `.regit/` directory (usually `.regit/hooks.js`), a `stable` branch, branches named
`feature-*`, `preview-*`, `release-*`, tags like `v1.4.0`, commits like
`[regit] Init 'feature-x'`. Check with `ls .regit` and `git branch -a`.

## Branching model

| Branch | Created by | From | Ends |
| --- | --- | --- | --- |
| `stable` | `regit init <version>` | — | long-lived; every release is merged here and tagged `v<version>` |
| `feature-<id>` | `regit feature start <id>` | latest tag | deleted by `release finish` once shipped |
| `preview-<name>` | `regit preview start <name>` | latest tag | staging branch combining features; removed manually |
| `release-<version>` | `regit release start <version>` | latest tag | merged into `stable` + tagged by `release finish`, then deleted |

Rules that shape every decision:

- **One release at a time.** `release start` while a release is open just checks out the
  open one and prints `Release already exists release-x` — it does not start a second one.
- **Versions are semver and strictly greater than the latest tag** (`1.3.0`,
  `1.3.0-beta.1`). Find the latest tag with `git tag --sort=-v:refname | head -1`; the next
  minor of `v1.2.0` is `1.3.0`, the next patch `1.2.1`. Pass versions without the `v`.
- **Clean working tree.** Branch-switching commands refuse with
  `Current branch is dirty, cannot continue`. Commit (or stash) first.
- **regit talks to `origin`.** Most commands `git fetch` first and push what they change, so
  they need network access and push rights. Branches on `origin` count as existing.
- **The feature id is the part after `feature-`.** `regit feature start PAY-12` creates
  `feature-PAY-12`; every other command takes `PAY-12`, not the full branch name.

## Never trigger an interactive prompt

regit prompts (arrow-key menus) when an optional argument is missing. You cannot answer
those reliably, and the command hangs. Always pass the argument:

| Instead of | Run |
| --- | --- |
| `regit feature start` | `regit feature start <id>` |
| `regit release start` | `regit release start <version>` |
| `regit release add` (multi-select) | `regit release add <id>` once per feature |
| `regit preview start` | `regit preview start <name>` |
| `regit preview add <name>` (multi-select) | `regit preview add <name> <id>` once per feature |
| `regit preview release` | `regit preview release <name>` **and** answer the version menu, see below |

`regit preview release <name>` always asks for the version, with the choices in this order:
**Minor, Patch, Major** (computed from the latest tag). Pipe the keys:

```bash
printf '\n'               | regit preview release staging   # Minor
printf '\033[B\n'         | regit preview release staging   # Patch
printf '\033[B\033[B\n'   | regit preview release staging   # Major
```

Equivalent without a prompt: `regit release start <version>`, then
`git merge --no-ff origin/preview-<name>` and `git push` on the release branch (hooks see
`trigger: 'release-start'` instead of `'preview-release'`).

## Common tasks

### Start (or resume) work on a feature

```bash
regit feature start PAY-12        # creates feature-PAY-12 from the latest tag, or checks it out
# ...edit, git add, git commit...
regit feature push                # pushes the current feature branch to origin
```

`feature start` on an existing feature (local or only on origin) just checks it out.
`feature push` must run from a `feature-*` branch.

### Check a feature, catch it up with the latest release

```bash
regit feature status              # on the feature branch: base tag, last commit
regit feature list                # every feature, with the tag it is based on
```

If regit warns `Feature feature-x is based on an old release`, run exactly what it prints:

```bash
git merge --no-ff v1.3.0 && git push origin feature-x
```

### Stage features on a preview (staging)

```bash
regit preview start staging
regit preview add staging PAY-12
regit preview add staging PAY-15
regit preview status staging      # features merged into the preview
regit preview list                # all previews with their features
```

### Ship a release

```bash
regit release start 1.3.0         # opens release-1.3.0 from the latest tag
regit release add PAY-12          # merges origin/feature-PAY-12, pushes the release
regit release add PAY-15
regit release status              # each feature [merged] or [in progress]
regit release finish              # see "Destructive commands" first
```

`release finish` refuses if a feature in the release is `[in progress]` (it got new commits
after being added): `regit release add <id>` again, then finish.

Commits made directly on the release branch (fixes, version bumps, changelog) are fine; they
ship with the release; push them with `regit release push` (from the release branch). A
release can even contain no feature at all (hotfix): start it, commit on `release-x`,
`regit release push`, finish.

### See what shipped

```bash
regit tag list            # last 5 tags with the features shipped in each
regit tag list -n 10
```

## Destructive commands — confirm first

These change shared history on `origin` and cannot be undone with a simple command. Run them
only when the user asked for that exact outcome; otherwise describe what will happen and ask.

| Command | Effect |
| --- | --- |
| `regit release finish` | merges the release into `stable`, creates and pushes tag `v<version>`, deletes `release-<version>` **and every feature it contains**, locally and on `origin` |
| `regit release remove` | deletes the open release branch locally and on `origin` (features are kept) |
| `regit feature remove <id>` | deletes `feature-<id>` locally and on `origin` |
| `regit preview remove <name>` | deletes `preview-<name>` locally and on `origin` |

Before `release finish`, run `regit release status` and check the feature list is what the
user expects to ship.

## Hooks run during commands

If `.regit/hooks.js` exists, regit commands run project code (ticket transitions,
notifications, release notes, …). Its output appears in the command output. Two messages
come from hooks, not from regit itself:

- A plain error before anything happened (e.g. `Jira unreachable`) — a **pre** hook stopped
  the command; nothing was created, merged or pushed. Fix the cause and rerun.
- `<what happened>, but hook <name> failed: <reason>` — the git work **is done**; only the
  follow-up automation failed. Do not rerun the command to "retry"; report it and run the
  missing step by hand if needed.

To write or change hooks, use the **regit-hooks** skill.

## Troubleshooting

| Message | Fix |
| --- | --- |
| `Current branch is dirty, cannot continue` | commit or stash, retry |
| `Version x is not greater than the latest tag vy` | pick a version above `vy` (tags, newest first: `git tag --sort=-v:refname`) |
| `Invalid version: x` | use semver, e.g. `1.3.0` |
| `No release branch found` | `regit release start <version>` first |
| `Feature x does not exist` / `Preview x does not exist` | check `regit feature list` / `regit preview list`; use the id without prefix |
| `Not all features are merged into the release branch…` | `regit release status`, re-`add` the `[in progress]` ones |
| `You must be on a feature branch…` | `regit feature start <id>` then retry |
| `No release tag found, run regit init first` / `stable branch already exists` | repo not initialised / already initialised (`regit init <version>` only once) |
