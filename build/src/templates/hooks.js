export const hooksTemplate = `
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
    },
    postReleaseFinish: async (id) => {
        // do something clever after release finish
    },
}
`;
