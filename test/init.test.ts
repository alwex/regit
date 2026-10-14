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

    test('regit init tags the first version', async (ctx) => {
        await ctx.regit('init 1.0.0')

        const tagMessage = await ctx.cliLocal(
            "git tag -l --format='%(contents)' v1.0.0"
        )
        expect(tagMessage.trim()).toBe('[regit] v1.0.0. ()')
    })
})
