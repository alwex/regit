import { beforeEach, describe, expect, test } from 'vitest'

describe('release', async (ctx) => {
    beforeEach(async (ctx) => {
        await ctx.regit(`init 0.0.0`)
    })

    test('release start', async (ctx) => {
        const result = await ctx.regit('release start 1.0.0')
        expect(result).toContain(
            'Creating Branch release-1.0.0 from tag v0.0.0'
        )
        expect(result).toContain('✔  success   Release 1.0.0 started')
    })

    test('release start existing', async (ctx) => {
        const result = await ctx.regit('release start 1.0.0')
        expect(result).toContain(
            'Creating Branch release-1.0.0 from tag v0.0.0'
        )
        expect(result).toContain('✔  success   Release 1.0.0 started')

        const result2 = await ctx.regit('release start 1.0.0')
        expect(result2).toContain(
            '⚠  warning   Release already exists release-1.0.0'
        )
    })

    test('release start with multiple versions', async (ctx) => {
        await ctx.regit('release start 1.0.0')
        const releaseStart2 = await ctx.regit('release start 1.1.0')

        // should detect and warn about the existing release
        expect(releaseStart2).toContain(
            '⚠  warning   Release already exists release-1.0.0'
        )
    })

    test('release start with dirty state', async (ctx) => {
        await ctx.cliLocal('touch test.txt')
        const releaseStart = ctx.regit('release start 1.0.0')

        await expect(releaseStart).rejects.toThrowError(
            'Current branch is dirty, cannot continue'
        )
    })

    test('release start when another release is in progress', async (ctx) => {
        await ctx.regit('release start 1.0.0')
        const releaseStart = await ctx.regit('release start')

        expect(releaseStart).toContain(
            '⚠  warning   Release already exists release-1.0.0'
        )
    })

    test('release finish', async (ctx) => {
        await ctx.regit('release start 1.0.0')
        const result = await ctx.regit('release finish')

        expect(result).toContain('Cleanup merged features')
    })

    test('release add features', async (ctx) => {
        await ctx.regit('feature start f1')
        await ctx.regit('feature start f2')
        await ctx.regit('release start 1.0.0')

        const resultAddF1 = await ctx.regit('release add f1')
        expect(resultAddF1).toContain(
            '✔  success   Feature f1 merged into release-1.0.0'
        )
        const resultAddF2 = await ctx.regit('release add f2')
        expect(resultAddF2).toContain(
            '✔  success   Feature f2 merged into release-1.0.0'
        )

        const result = await ctx.regit('release finish')

        expect(result).toContain('Cleanup merged features')
    })

    test('release status', async (ctx) => {
        await ctx.regit('feature start f1')
        await ctx.regit('feature start f2')
        await ctx.regit('release start 1.0.0')
        await ctx.regit('release add f1')
        await ctx.regit('release add f2')

        const result = await ctx.regit('release status')

        expect(result).toContain('Release: origin/release-1.0.0 (from v0.0.0)')
        expect(result).toContain('- origin/feature-f1 [merged]')
        expect(result).toContain('- origin/feature-f2 [merged]')
    })

    test('release remove', async (ctx) => {
        await ctx.regit('release start 1.0.0')
        const result = await ctx.regit('release remove')

        expect(result).toContain('✔  success   Release release-1.0.0 removed')
    })

    test('start release with existing version', async (ctx) => {
        await ctx.regit('release start 1.0.0')
        await ctx.regit('release finish')
        const startRelease = ctx.regit('release start 1.0.0')

        await expect(startRelease).rejects.toThrowError(
            'Version 1.0.0 is not greater than the latest tag v1.0.0'
        )
    })

    // test('create subsequent release and check deprecated features', async (ctx) => {
    //     await ctx.regit('release start 1.0.0')
    //     await ctx.regit('feature start f1')
    //     await ctx.regit('release finish')
    //     await ctx.regit('feature start f2')

    //     const featureList = await ctx.regit('feature list')

    //     expect(featureList).toContain(
    //         'Feature: origin/feature-f1 (from v0.0.0) '
    //     )
    //     expect(featureList).toContain(
    //         'Feature: origin/feature-f2 (from v1.0.0) '
    //     )

    //     const featureStartOldF1 = await ctx.regit('feature start f1')
    //     expect(featureStartOldF1).toContain(
    //         '⚠  warning   Feature feature-f1 is based on an old release'
    //     )
    //     expect(featureStartOldF1).toContain(
    //         '⚠  warning   Please run: git merge --no-ff v1.0.0 && git push origin feature-f1'
    //     )

    //     await ctx.regit('release start 1.1.0')
    //     await ctx.regit('release add f1')
    //     await ctx.regit('release add f2')

    //     const releaseStatus = await ctx.regit('release status')

    //     expect(releaseStatus).toContain(
    //         'Release: origin/release-1.1.0 (from v1.0.0)'
    //     )
    //     expect(releaseStatus).toContain('Included features')
    //     expect(releaseStatus).toContain('- origin/feature-f1 [merged]')
    //     expect(releaseStatus).toContain('- origin/feature-f2 [updated]')

    //     console.log(releaseStatus)

    //     // finish the release should fail as one feature is outdated
    //     const releaseFinish = ctx.regit('release finish')
    //     expect(releaseFinish).toContain(
    //         '⚠  warning   Feature feature-f1 is based on an old release'
    //     )
    // })
})
