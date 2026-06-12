import { beforeEach, describe, expect, test } from 'vitest'

describe('preview', async (ctx) => {
    beforeEach(async (ctx) => {
        await ctx.regit(`init 0.0.0`)
    })

    test('preview start from dirty state', async (ctx) => {
        await ctx.cliLocal('touch test.txt')
        const previewStart = ctx.regit('preview start p1')
        await expect(previewStart).rejects.toThrowError(
            'Current branch is dirty, cannot continue'
        )
    })

    test('perview start new', async (ctx) => {
        const result = await ctx.regit('preview start p1')

        expect(result).toContain('Creating Branch preview-p1 from tag v0.0.0')
        expect(result).toContain('✔  success   Preview p1 started')
    })

    test('perview start existing', async (ctx) => {
        const result = await ctx.regit('preview start p1')

        expect(result).toContain('Creating Branch preview-p1 from tag v0.0.0')
        expect(result).toContain('✔  success   Preview p1 started')

        const result2 = await ctx.regit('preview start p1')
        expect(result2).toContain('Branch preview-p1 already exists')
        expect(result2).toContain('✔  success   Preview p1 started')
    })

    test('preview remove', async (ctx) => {
        const result = await ctx.regit('preview start p1')

        expect(result).toContain('Creating Branch preview-p1 from tag v0.0.0')
        expect(result).toContain('✔  success   Preview p1 started')

        const result2 = await ctx.regit('preview remove p1')
        expect(result2).toContain('✔  success   Preview p1 removed')
    })

    test('preview add feature', async (ctx) => {
        const resultF1 = await ctx.regit('feature start f1')
        expect(resultF1).toContain('Creating Branch feature-f1 from tag v0.0.0')
        expect(resultF1).toContain('✔  success   Feature f1 started')

        const resultF2 = await ctx.regit('feature start f2')
        expect(resultF2).toContain('Creating Branch feature-f2 from tag v0.0.0')
        expect(resultF2).toContain('✔  success   Feature f2 started')

        const resultP1 = await ctx.regit('preview start p1')
        expect(resultP1).toContain('Creating Branch preview-p1 from tag v0.0.0')
        expect(resultP1).toContain('✔  success   Preview p1 started')

        const resultAddF1TpP1 = await ctx.regit('preview add p1 f1')
        expect(resultAddF1TpP1).toContain(
            '✔  success   Feature f1 merged into preview-p1'
        )

        const resultAddF2TpP1 = await ctx.regit('preview add p1 f2')
        expect(resultAddF2TpP1).toContain(
            '✔  success   Feature f2 merged into preview-p1'
        )
    })

    test('preview status', async (ctx) => {
        await ctx.regit('feature start f1')
        await ctx.regit('feature start f2')
        await ctx.regit('preview start p1')
        await ctx.regit('preview add p1 f1')
        await ctx.regit('preview add p1 f2')

        const resultStatus = await ctx.regit('preview status p1')
        expect(resultStatus).toContain('origin/preview-p1 (from v0.0.0)')
        expect(resultStatus).toContain('Included features')
        expect(resultStatus).toContain('- origin/feature-f1 [merged] ')
        expect(resultStatus).toContain('- origin/feature-f2 [merged] ')
    })

    test('preview status with no features', async (ctx) => {
        await ctx.regit('preview start p1')

        const resultStatus = await ctx.regit('preview status p1')
        expect(resultStatus).toContain('origin/preview-p1 (from v0.0.0)')
        expect(resultStatus).toContain('Included features')
    })

    test('preview start with existing preview', async (ctx) => {
        await ctx.regit('preview start p1')
        await ctx.regit('preview start p2')
        const result = await ctx.regit('preview start p1')

        expect(result).toContain('Branch preview-p1 already exists')
        expect(result).toContain('✔  success   Preview p1 started')
    })

    test('preview release on a non-existent preview is rejected', async (ctx) => {
        const previewRelease = ctx.regit('preview release doesnotexist')

        await expect(previewRelease).rejects.toThrowError(
            'Preview doesnotexist does not exist'
        )
    })

    test('preview list', async (ctx) => {
        await ctx.regit('preview start p1')
        await ctx.regit('preview start p2')
        const result = await ctx.regit('preview list')

        expect(result).toContain('origin/preview-p1 (from v0.0.0)')
        expect(result).toContain('origin/preview-p2 (from v0.0.0)')
    })
})
