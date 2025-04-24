import { beforeEach, describe, expect, test } from 'vitest'

describe('release', async (ctx) => {
    beforeEach(async (ctx) => {
        await ctx.regit(`init 0.0.0`)
    })

    test('list tags', async (ctx) => {
        await ctx.regit('feature start f1')
        await ctx.regit('feature start f2')
        await ctx.regit('feature start f3')
        await ctx.regit('feature start f4')

        await ctx.regit('release start 1.0.0')
        await ctx.regit('release add f1')
        await ctx.regit('release add f2')
        await ctx.regit('release finish')

        await ctx.regit('release start 2.0.0')
        await ctx.regit('release add f3')
        await ctx.regit('release add f4')
        await ctx.regit('release finish')

        const result = await ctx.regit('tag list')

        const tags = result.split('\n\n')

        expect(tags.length).toBe(2)
        expect(tags[0]).toContain('Tag: v1.0.0')
        expect(tags[0]).toContain('feature-f1')
        expect(tags[0]).toContain('feature-f2')
        expect(tags[0]).not.toContain('feature-f3')
        expect(tags[0]).not.toContain('feature-f4')

        expect(tags[1]).toContain('Tag: v2.0.0')
        expect(tags[1]).toContain('feature-f3')
        expect(tags[1]).toContain('feature-f4')
        expect(tags[1]).not.toContain('feature-f1')
        expect(tags[1]).not.toContain('feature-f2')
    })
})
