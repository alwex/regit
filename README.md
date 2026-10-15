register globally

```shell
yarn link --global
```

unregister globally

```shell
yarn unlink --global
```

## Publish

Update version to match with package.json in `program.ts` then

```shell
npm publish
```

## Usage with npx

```shell
npx regit-cli
```

init playground

```shell
mkdir local
mkdir remote

# set origin
cd local
git init
git remote add origin [playground-remote-folder]
```

# Doc

## Init

```shell
regit init <version>
```

## Features

```shell
regit feature start [feature-name]
regit feature list
```

## Release

```shell
regit release start
regit release add [feature-name]
regit release status
regit release finish
```

## Tags

```shell
regit tag list
```

## Hooks

Hooks let you plug your own logic into regit: label features from your issue tracker,
notify a channel, open a merge request on push, write release notes into the release tag…

`regit init` generates `.regit/hooks.js`, listing every hook as a no-op. Keep the ones you
need. Each hook receives the id / version / preview name, plus a `context` describing what
regit is about to do or just did (e.g. whether a branch is new or already existed, which
features a release contains).

```javascript
/** @type {import('regit-cli').Hooks} */
const hooks = {
    postFeatureStart: async (id, context) => {
        if (context.origin === 'new') {
            console.log(`move ticket ${id} to "In progress"`)
        }
    },
    postReleaseFinish: async (version, context) => {
        const branches = context.features.map((feature) => {
            return feature.branch
        })
        console.log(`${context.tag} released with ${branches.join(', ')}`)
    },
}

module.exports = hooks
```

| Hooks | Command |
| --- | --- |
| `preFeatureStart`, `postFeatureStart` | `feature start` |
| `postFeaturePush` | `feature push` |
| `preFeatureRemove`, `postFeatureRemove` | `feature remove` |
| `preReleaseStart`, `postReleaseStart` | `release start`, `preview release` |
| `preReleaseAdd`, `postReleaseAdd` | `release add` |
| `preReleaseFinish`, `getTagMessage`, `postReleaseFinish` | `release finish` |
| `prePreviewStart`, `postPreviewStart` | `preview start` |
| `prePreviewAdd`, `postPreviewAdd` | `preview add` |
| `prePreviewRemove`, `postPreviewRemove` | `preview remove` |
| `getFeatureName` | listings (`feature list`, `release status`, `tag list`, …) |

The `@type` comment gives editor completion and type checking when `regit-cli` is installed
in the project. Full reference, including every context field:
[Hooks documentation](https://alwex.github.io/regit/reference/hooks/).

## Agent skills

The `skills/` folder contains two [agent skills](https://skills.sh) that teach coding agents
(Claude Code and others) to work with regit:

- `regit`: drive the CLI in a regit repository (features, previews, releases, tags), avoid
  interactive prompts, and confirm before destructive commands.
- `regit-hooks`: write, test and debug `.regit/hooks.js` (hook catalogue, context objects,
  failure rules, typing, sandbox script).

```shell
npx skills add alwex/regit@regit
npx skills add alwex/regit@regit-hooks
```

Or copy the folders into your project's `.claude/skills/`.
