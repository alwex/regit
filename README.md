register globally

```shell
yarn link --global
```

unregister globally

```shell
yarn unlink --global
```

init playground

```shell
mkdir local
mkdir remote

# set origin
cd local
git remote add origin /Users/alexandre/WorkspacePerso/regit-playground/remote
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

It is possible to add pre and post hook functions to adapt the tool to your workflow, to implement your own logic, place a file named `regit.js` in the root of your project.

Hook interface:

```typescript
export interface Hooks {
    getFeatureName: (id: string) => Promise<string>
    preFeatureStart: (id: string) => Promise<void>
    postFeatureStart: (id: string) => Promise<void>
    preReleaseFinish: (version: string) => Promise<void>
    postReleaseFinish: (version: string) => Promise<void>
}
```

```javascript
module.exports = {
    getFeatureName: async (id) => {
        return Promise.resolve('your feature name')
    },

    preFeatureStart: async (id) => {
        console.log('do something clever BEFORE feature start')
    },

    postFeatureStart: async (id) => {
        console.log('do something clever AFTER feature start')
    },

    preReleaseFinish: async (id) => {
        console.log('do something clever BEFORE release finish')
    },

    postReleaseFinish: async (id) => {
        console.log('do something clever AFTER release finish')
    },
}
```
