import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rootFolder = `${__dirname}/../`

const generateChangelog = () => {
    execSync(
        `pushd ${rootFolder} && regit release status >> CHANGELOG.tmp && popd`
    )
    execSync(`pushd ${rootFolder} && echo "" >> CHANGELOG.tmp && popd`)
    execSync(`pushd ${rootFolder} && cat CHANGELOG.md >> CHANGELOG.tmp && popd`)
    execSync(`pushd ${rootFolder} && cat CHANGELOG.tmp > CHANGELOG.md && popd`)
    execSync(`pushd ${rootFolder} && rm CHANGELOG.tmp && popd`)
    execSync(`pushd ${rootFolder} && git add CHANGELOG.md && popd`)
    execSync(
        `pushd ${rootFolder} && git commit -m "chore: update CHANGELOG.md" && popd`
    )
}

const setPackageVersion = (version) => {
    console.log('Setting package version to: ', version)
    execSync(`pushd ${rootFolder} && yarn v --new-version ${version} && popd`)
    execSync(`pushd ${rootFolder} && git add package.json && popd`)
    execSync(
        `pushd ${rootFolder} && echo "export default '${version}'" > ./src/version.ts && popd`
    )
    execSync(`pushd ${rootFolder} && git add ./src/version.ts && popd`)
    execSync(
        `pushd ${rootFolder} && git commit -m "chore: update package version to ${version}" && popd`
    )
}

export default {
    getFeatureName: async (id) => {
        // return feature name
        return Promise.resolve('proute')
    },
    preFeatureStart: async (id) => {
        // do something clever before feature start
    },
    postFeatureStart: async (id) => {
        // do something clever after feature start
    },
    preReleaseStart: async (version) => {
        // do something clever before release start
    },
    preReleaseStart: async (version) => {
        // do something clever before release start
    },
    preReleaseFinish: async (version) => {
        // do something clever before release finish
        // generateChangelog()
        setPackageVersion(version)
    },
    postReleaseFinish: async (version) => {
        // do something clever after release finish
    },
}
