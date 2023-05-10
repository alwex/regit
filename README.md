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
