import { beforeEach, describe, expect, test } from 'vitest'

describe('feature', async () => {
    beforeEach(async (ctx) => {
        await ctx.regit(`init 0.0.0`)
    })

    test('feature start new', async (ctx) => {
        const result = await ctx.regit('feature start f1')

        expect(result).toContain('Creating Branch feature-f1 from tag v0.0.0')
        expect(result).toContain('✔  success   Feature f1 started')
    })

    test('feature start existing', async (ctx) => {
        const resultF1 = await ctx.regit('feature start f1')

        expect(resultF1).toContain('Creating Branch feature-f1 from tag v0.0.0')
        expect(resultF1).toContain('✔  success   Feature f1 started')

        const resultF1_2 = await ctx.regit('feature start f1')

        expect(resultF1_2).toContain('Branch feature-f1 already exists')
        expect(resultF1_2).toContain('✔  success   Feature f1 started')
    })

    test('feature start new from latest version', async (ctx) => {
        await ctx.regit('release start 0.1.0')
        await ctx.regit('release finish')

        const resultF1 = await ctx.regit('feature start f1')
        expect(resultF1).toContain('Creating Branch feature-f1 from tag v0.1.0')
        expect(resultF1).toContain('✔  success   Feature f1 started')
    })

    test('feature start existing with different version', async (ctx) => {
        const resultF1 = await ctx.regit('feature start f1')
        expect(resultF1).toContain('Creating Branch feature-f1 from tag v0.0.0')
        expect(resultF1).toContain('✔  success   Feature f1 started')

        await ctx.regit('release start 0.1.0')
        await ctx.regit('release finish')

        const resultF1_2 = await ctx.regit('feature start f1')

        expect(resultF1_2).toContain('Branch feature-f1 already exists')
        expect(resultF1_2).toContain('✔  success   Feature f1 started')
        expect(resultF1_2).toContain(
            '⚠  warning   Feature feature-f1 is based on an old release'
        )
        expect(resultF1_2).toContain(
            '⚠  warning   Please run: git merge --no-ff v0.1.0 && git push origin feature-f1'
        )
    })

    test('feature start from dirty state', async (ctx) => {
        await ctx.cliLocal('touch test.txt')
        const featureStart = ctx.regit('feature start f1')

        await expect(featureStart).rejects.toThrowError(
            'Current branch is dirty, cannot continue'
        )
    })

    test('feature remove existing', async (ctx) => {
        const resultF1 = await ctx.regit('feature start f1')
        expect(resultF1).toContain('Creating Branch feature-f1 from tag v0.0.0')
        expect(resultF1).toContain('✔  success   Feature f1 started')

        const resultF1remove = await ctx.regit('feature remove f1')
        expect(resultF1remove).toContain('✔  success   Feature f1 removed')
    })

    test('feature remove non existing', async (ctx) => {
        const resultF1remove = ctx.regit('feature remove f1')

        await expect(resultF1remove).rejects.toThrowError(
            "unable to delete 'feature-f1': remote ref does not exist"
        )
    })

    test('feature remove with dirty state', async (ctx) => {
        await ctx.regit('feature start f1')
        await ctx.cliLocal('touch test.txt')

        const featureRemove = ctx.regit('feature remove f1')

        await expect(featureRemove).rejects.toThrowError(
            'Current branch is dirty, cannot continue'
        )
    })

    test('feature status', async (ctx) => {
        const resultF1 = await ctx.regit('feature start f1')
        expect(resultF1).toContain('Creating Branch feature-f1 from tag v0.0.0')
        expect(resultF1).toContain('✔  success   Feature f1 started')

        const resultStatus = await ctx.regit('feature status')

        expect(resultStatus).toContain(
            'Feature: origin/feature-f1 (from v0.0.0)'
        )
        expect(resultStatus).toContain('commit')
        expect(resultStatus).toContain('Author')
        expect(resultStatus).toContain('Date')
    })
})
