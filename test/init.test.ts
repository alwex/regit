import { describe, expect, test } from 'vitest'

describe('regit init', () => {
    const versions = ['0.0.0', '0.0.1', '0.1.0', '1.0.0']

    versions.forEach((version) => {
        test(`regit init ${version}`, async (ctx) => {
            const result = await ctx.regit(`init ${version}`)
            expect(result).toContain(
                `Initialized regit with version ${version}`
            )
        })
    })

    test('regit init generates a hooks file defining every hook', async (ctx) => {
        await ctx.regit('init 1.0.0')

        const hookNames = await ctx.cliLocal(
            `node -e "console.log(Object.keys(require('./.regit/hooks.js')).sort().join(','))"`
        )

        expect(hookNames.split(',')).toEqual([
            'getFeatureName',
            'getTagMessage',
            'postFeaturePush',
            'postFeatureRemove',
            'postFeatureStart',
            'postPreviewAdd',
            'postPreviewRemove',
            'postPreviewStart',
            'postReleaseAdd',
            'postReleaseFinish',
            'postReleaseRemove',
            'postReleaseStart',
            'preFeatureRemove',
            'preFeatureStart',
            'prePreviewAdd',
            'prePreviewRemove',
            'prePreviewStart',
            'preReleaseAdd',
            'preReleaseFinish',
            'preReleaseRemove',
            'preReleaseStart',
        ])
    })

    test('regit init tags the first version', async (ctx) => {
        await ctx.regit('init 1.0.0')

        const tagMessage = await ctx.cliLocal(
            "git tag -l --format='%(contents)' v1.0.0"
        )
        expect(tagMessage.trim()).toBe('[regit] v1.0.0. ()')
    })
})
