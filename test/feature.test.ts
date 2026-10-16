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

    test('feature start existing only on origin', async (ctx) => {
        await ctx.regit('feature start f1')
        await ctx.cliLocal('git checkout stable')
        await ctx.cliLocal('git branch -D feature-f1')

        const result = await ctx.regit('feature start f1')

        expect(result).toContain('Branch feature-f1 already exists')
        expect(result).toContain('✔  success   Feature f1 started')
        expect(await ctx.cliLocal('git branch --show-current')).toBe(
            'feature-f1'
        )
        expect(
            await ctx.cliLocal('git rev-parse --abbrev-ref feature-f1@{upstream}')
        ).toBe('origin/feature-f1')
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
        expect(await ctx.cliLocal('git branch --show-current')).toBe('stable')
        expect(await ctx.cliLocal('git branch --list feature-f1')).toBe('')
        expect(await ctx.cliRemote('git branch --list feature-f1')).toBe('')
    })

    test('feature remove of a feature that only exists on origin', async (ctx) => {
        await ctx.regit('feature start f1')
        await ctx.cliLocal('git checkout stable')
        await ctx.cliLocal('git branch -D feature-f1')

        const result = await ctx.regit('feature remove f1')

        expect(result).toContain('✔  success   Feature f1 removed')
        expect(await ctx.cliRemote('git branch --list feature-f1')).toBe('')
    })

    test('feature remove non existing', async (ctx) => {
        const resultF1remove = ctx.regit('feature remove f1')

        await expect(resultF1remove).rejects.toThrowError(
            'Feature f1 does not exist'
        )
    })

    test('feature remove of a feature that only exists locally', async (ctx) => {
        await ctx.cliLocal('git checkout -b feature-1')
        await ctx.cliLocal('git commit --allow-empty -m "work on 1"')
        await ctx.cliLocal('git checkout stable')

        const result = await ctx.regit('feature remove 1')

        expect(result).toContain('✔  success   Feature 1 removed')
        expect(await ctx.cliLocal('git branch --list feature-1')).toBe('')
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

    test('feature list shows a feature branch that only exists locally', async (ctx) => {
        await ctx.cliLocal('git checkout -b feature-1')
        await ctx.cliLocal('git commit --allow-empty -m "work on 1"')

        const result = await ctx.regit('feature list')

        expect(result).toContain('Feature: feature-1 (from v0.0.0)')
        expect(result).toContain('commit')
    })

    test('feature list hides a feature removed from origin by someone else', async (ctx) => {
        await ctx.regit('feature start f1')
        await ctx.cliLocal('git checkout stable')
        await ctx.cliLocal('git branch -D feature-f1')
        await ctx.cliRemote('git branch -D feature-f1')

        const result = await ctx.regit('feature list')

        expect(result).not.toContain('feature-f1')
    })

    test('feature push pushes the current feature branch to origin', async (ctx) => {
        await ctx.regit('feature start f1')
        await ctx.cliLocal('git commit --allow-empty -m "work on f1"')

        await ctx.regit('feature push')

        expect(await ctx.cliRemote('git rev-parse feature-f1')).toBe(
            await ctx.cliLocal('git rev-parse feature-f1')
        )
    })

    test('feature push forgets features removed from origin by someone else', async (ctx) => {
        await ctx.regit('feature start f1')
        await ctx.regit('feature start f2')
        await ctx.cliRemote('git branch -D feature-f1')

        await ctx.regit('feature push')

        expect(await ctx.cliLocal('git branch -r --list origin/feature-f1')).toBe(
            ''
        )
    })

    test('feature push outside a feature branch is rejected', async (ctx) => {
        const featurePush = ctx.regit('feature push')

        await expect(featurePush).rejects.toThrowError(
            'You must be on a feature branch to push a features'
        )
    })
})

describe('feature without regit init', () => {
    test('feature start fails when no release tag exists', async (ctx) => {
        await ctx.cliLocal('git commit --allow-empty -m "first commit"')

        const featureStart = ctx.regit('feature start f1')

        await expect(featureStart).rejects.toThrowError(
            'No release tag found, run regit init first'
        )
    })
})
