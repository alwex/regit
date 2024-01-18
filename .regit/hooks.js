const execSync = require('child_process').execSync

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
    execSync(`pushd ${rootFolder} && yarn version ${version} && popd`)
}

module.exports = {
    getFeatureName: async (id) => {
        // return feature name
        return Promise.resolve('')
    },
    preFeatureStart: async (id) => {
        // do something clever before feature start
    },
    postFeatureStart: async (id) => {
        // do something clever after feature start
    },
    preReleaseFinish: async (id) => {
        // do something clever before release finish
        // generateChangelog()
        setPackageVersion(id)
    },
    postReleaseFinish: async (id) => {
        // do something clever after release finish
    },
}
