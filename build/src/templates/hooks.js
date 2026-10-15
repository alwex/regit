export const hooksTemplate = `
// Hooks reference: https://alwex.github.io/regit/reference/hooks/
// Every hook is optional: delete the ones you do not need.

/** @type {import('regit-cli').Hooks} */
const hooks = {
    getFeatureName: async (branch) => {
        // label shown next to a feature branch in listings (e.g. issue title)
        return ''
    },
    getTagMessage: async (version, context) => {
        // message of the tag created by release finish
        const branches = context.features.map((feature) => {
            return feature.branch
        })
        return \`[regit] \${context.tag}. (\${branches.join(',')})\`
    },
    preFeatureStart: async (id, context) => {
        // before a feature branch is created or checked out (context.origin)
    },
    postFeatureStart: async (id, context) => {
        // after a feature branch is created or checked out
    },
    postFeaturePush: async (id, context) => {
        // after feature push
    },
    preFeatureRemove: async (id, context) => {
        // before a feature branch is deleted locally and on origin
    },
    postFeatureRemove: async (id, context) => {
        // after a feature branch is deleted
    },
    preReleaseStart: async (version, context) => {
        // before a release branch is created or checked out
    },
    postReleaseStart: async (version, context) => {
        // after a release branch is created or checked out
    },
    preReleaseAdd: async (version, context) => {
        // before context.features are merged into the release
    },
    postReleaseAdd: async (version, context) => {
        // after context.features are merged into the release
    },
    preReleaseFinish: async (version, context) => {
        // before the release is merged into stable (release branch checked out)
    },
    postReleaseFinish: async (version, context) => {
        // after the release is merged, tagged and cleaned up
    },
    prePreviewStart: async (preview, context) => {
        // before a preview branch is created or checked out
    },
    postPreviewStart: async (preview, context) => {
        // after a preview branch is created or checked out
    },
    prePreviewAdd: async (preview, context) => {
        // before context.features are merged into the preview
    },
    postPreviewAdd: async (preview, context) => {
        // after context.features are merged into the preview
    },
    prePreviewRemove: async (preview, context) => {
        // before a preview branch is deleted (context.features it contains)
    },
    postPreviewRemove: async (preview, context) => {
        // after a preview branch is deleted
    },
}

module.exports = hooks
`;
