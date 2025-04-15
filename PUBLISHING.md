# Publishing doc

## publishing

```
regit release start x.y.z
# merge feature branches into release
yarn v x.y.z
# update version.ts to match with the new version in package.json
yarn build
npm publish
```

## upgrading to latest

```
yarn global add regit-cli@latest
regit --version
```
