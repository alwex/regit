import fs from 'fs'
import path from 'path'
import { TestContext, beforeEach, describe, expect, test } from 'vitest'

const CLI_PATH = path.resolve(__dirname, '..', 'build', 'src', 'index.js')

const recordingHooks = `
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const repoDir = path.join(__dirname, '..')
const logFile = path.join(repoDir, '.git', 'hook-calls.jsonl')

const currentBranch = () => {
    return execSync('git branch --show-current', {
        cwd: repoDir,
        encoding: 'utf8',
    }).trim()
}

const failIfRequested = (hook) => {
    if (process.env.FAIL_HOOK !== hook) {
        return
    }
    if (process.env.FAIL_HOOK_VALUE) {
        throw process.env.FAIL_HOOK_VALUE
    }
    throw new Error(hook + ' exploded')
}

const record = (hook) => {
    return async (...args) => {
        const call = { hook, args, branch: currentBranch() }
        fs.appendFileSync(logFile, JSON.stringify(call) + '\\n')
        failIfRequested(hook)
    }
}

module.exports = {
    preFeatureStart: record('preFeatureStart'),
    postFeatureStart: record('postFeatureStart'),
    preReleaseStart: record('preReleaseStart'),
    postReleaseStart: record('postReleaseStart'),
    preReleaseFinish: record('preReleaseFinish'),
    postReleaseFinish: record('postReleaseFinish'),
}
`

type HookCall = {
    hook: string
    args: unknown[]
    branch: string
}

const runCli = async (ctx: TestContext, args: string) => {
    return ctx.cliLocal(`node ${CLI_PATH} ${args}`)
}

const runCliWithFailingHook = async (
    ctx: TestContext,
    { hook, args, value }: { hook: string; args: string; value?: string }
) => {
    const failValue = value ? `FAIL_HOOK_VALUE=${value} ` : ''

    return ctx.cliLocal(`FAIL_HOOK=${hook} ${failValue}node ${CLI_PATH} ${args}`)
}

const installRecordingHooks = async (ctx: TestContext) => {
    fs.writeFileSync(
        path.join(ctx.tempDirLocal, '.regit', 'hooks.js'),
        recordingHooks
    )
    await ctx.cliLocal('git add .regit/hooks.js')
    await ctx.cliLocal('git commit -m "recording hooks"')
    await ctx.cliLocal('git tag -a v0.0.1 -m "recording hooks"')
    await ctx.cliLocal('git push origin stable v0.0.1')
}

const tagStable = async (ctx: TestContext, tag: string) => {
    await ctx.cliLocal('git checkout stable')
    await ctx.cliLocal(`git commit --allow-empty -m "${tag}"`)
    await ctx.cliLocal(`git tag -a ${tag} -m "${tag}"`)
}

const readHookCalls = (ctx: TestContext, hook: string): HookCall[] => {
    const logFile = path.join(ctx.tempDirLocal, '.git', 'hook-calls.jsonl')

    return fs
        .readFileSync(logFile, 'utf8')
        .trim()
        .split('\n')
        .map((line): HookCall => {
            return JSON.parse(line)
        })
        .filter((call) => {
            return call.hook === hook
        })
}

const lastHookCall = (ctx: TestContext, hook: string) => {
    return readHookCalls(ctx, hook).at(-1)
}

const featureStartContext = (overrides: Record<string, unknown>) => {
    return {
        kind: 'feature',
        id: 'f1',
        branch: 'feature-f1',
        origin: 'new',
        baseTag: 'v0.0.1',
        latestTag: 'v0.0.1',
        isOutdated: false,
        ...overrides,
    }
}

const releaseStartContext = (overrides: Record<string, unknown>) => {
    return {
        kind: 'release',
        id: '0.1.0',
        version: '0.1.0',
        trigger: 'release-start',
        branch: 'release-0.1.0',
        origin: 'new',
        baseTag: 'v0.0.1',
        latestTag: 'v0.0.1',
        isOutdated: false,
        ...overrides,
    }
}

const expectBothHooksCalledWith = (
    ctx: TestContext,
    hooks: { pre: string; post: string },
    expectedArgs: unknown[]
) => {
    expect(lastHookCall(ctx, hooks.pre)?.args).toEqual(expectedArgs)
    expect(lastHookCall(ctx, hooks.post)?.args).toEqual(expectedArgs)
}

const releaseFinishContext = (overrides: Record<string, unknown>) => {
    return {
        version: '0.1.0',
        tag: 'v0.1.0',
        previousTag: 'v0.0.1',
        releaseBranch: 'release-0.1.0',
        features: [],
        ...overrides,
    }
}

const releasedFeature = (id: string) => {
    return { id, branch: `feature-${id}`, baseTag: 'v0.0.1' }
}

const commitOnRelease = async (ctx: TestContext, message: string) => {
    await ctx.cliLocal('git checkout release-0.1.0')
    await ctx.cliLocal(`git commit --allow-empty -m "${message}"`)
    await ctx.cliLocal('git push origin release-0.1.0')
}

const featureStartHooks = { pre: 'preFeatureStart', post: 'postFeatureStart' }

const releaseStartHooks = { pre: 'preReleaseStart', post: 'postReleaseStart' }

describe('hook context', () => {
    beforeEach(async (ctx) => {
        await ctx.regit('init 0.0.0')
        await installRecordingHooks(ctx)
    })

    describe('feature start', () => {
        test('tells hooks the feature branch is new', async (ctx) => {
            await runCli(ctx, 'feature start f1')

            expectBothHooksCalledWith(ctx, featureStartHooks, [
                'f1',
                featureStartContext({ origin: 'new' }),
            ])
        })

        test('tells hooks the feature branch already exists locally', async (ctx) => {
            await runCli(ctx, 'feature start f1')

            await runCli(ctx, 'feature start f1')

            expectBothHooksCalledWith(ctx, featureStartHooks, [
                'f1',
                featureStartContext({ origin: 'local' }),
            ])
        })

        test('tells hooks the feature branch only exists on origin', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await ctx.cliLocal('git checkout stable')
            await ctx.cliLocal('git branch -D feature-f1')

            await runCli(ctx, 'feature start f1')

            expectBothHooksCalledWith(ctx, featureStartHooks, [
                'f1',
                featureStartContext({ origin: 'remote' }),
            ])
        })

        test('tells hooks the feature branch is based on an old release', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await tagStable(ctx, 'v0.0.2')

            await runCli(ctx, 'feature start f1')

            expectBothHooksCalledWith(ctx, featureStartHooks, [
                'f1',
                featureStartContext({
                    origin: 'local',
                    baseTag: 'v0.0.1',
                    latestTag: 'v0.0.2',
                    isOutdated: true,
                }),
            ])
        })

        test('reads the base release from the local branch when it is ahead of origin', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await tagStable(ctx, 'v0.0.2')
            await ctx.cliLocal('git checkout feature-f1')
            await ctx.cliLocal('git merge --no-ff v0.0.2 -m "merge v0.0.2"')

            await runCli(ctx, 'feature start f1')

            expect(lastHookCall(ctx, 'postFeatureStart')?.args).toEqual([
                'f1',
                featureStartContext({
                    origin: 'local',
                    baseTag: 'v0.0.2',
                    latestTag: 'v0.0.2',
                }),
            ])
        })

        test('starts a new feature from the latest release', async (ctx) => {
            await tagStable(ctx, 'v0.0.2')

            await runCli(ctx, 'feature start f1')

            expect(lastHookCall(ctx, 'postFeatureStart')?.args).toEqual([
                'f1',
                featureStartContext({
                    origin: 'new',
                    baseTag: 'v0.0.2',
                    latestTag: 'v0.0.2',
                }),
            ])
        })
    })

    describe('release start', () => {
        test('tells hooks the release branch is new', async (ctx) => {
            await runCli(ctx, 'release start 0.1.0')

            expectBothHooksCalledWith(ctx, releaseStartHooks, [
                '0.1.0',
                releaseStartContext({ origin: 'new' }),
            ])
        })

        test('fires start hooks for the open release when it already exists locally', async (ctx) => {
            await runCli(ctx, 'release start 0.1.0')

            await runCli(ctx, 'release start 0.2.0')

            expectBothHooksCalledWith(ctx, releaseStartHooks, [
                '0.1.0',
                releaseStartContext({ origin: 'local' }),
            ])
        })

        test('fires start hooks for the open release when it only exists on origin', async (ctx) => {
            await runCli(ctx, 'release start 0.1.0')
            await ctx.cliLocal('git checkout stable')
            await ctx.cliLocal('git branch -D release-0.1.0')

            await runCli(ctx, 'release start')

            expectBothHooksCalledWith(ctx, releaseStartHooks, [
                '0.1.0',
                releaseStartContext({ origin: 'remote' }),
            ])
        })

        test('tells hooks the release was created from a preview', async (ctx) => {
            await runCli(ctx, 'preview start p1')

            await ctx.cliLocal(
                `printf '\\n' | node ${CLI_PATH} preview release p1`
            )

            expectBothHooksCalledWith(ctx, releaseStartHooks, [
                '0.1.0',
                releaseStartContext({
                    trigger: 'preview-release',
                    preview: 'p1',
                }),
            ])
        })
    })

    describe('release finish', { timeout: 30000 }, () => {
        test('tells hooks which features went into the release', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await runCli(ctx, 'feature start f2')
            await runCli(ctx, 'release start 0.1.0')
            await runCli(ctx, 'release add f1')
            await runCli(ctx, 'release add f2')

            await runCli(ctx, 'release finish')

            const expectedContext = releaseFinishContext({
                features: [releasedFeature('f1'), releasedFeature('f2')],
            })
            expect(lastHookCall(ctx, 'preReleaseFinish')?.args).toEqual([
                '0.1.0',
                expectedContext,
            ])
            expect(lastHookCall(ctx, 'postReleaseFinish')?.args).toEqual([
                '0.1.0',
                {
                    ...expectedContext,
                    stableCommit: await ctx.cliLocal(
                        'git rev-parse "v0.1.0^{commit}"'
                    ),
                    deletedBranches: [
                        'release-0.1.0',
                        'feature-f1',
                        'feature-f2',
                    ],
                },
            ])
        })

        test('ignores release commits that do not come from a feature', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await runCli(ctx, 'release start 0.1.0')
            await runCli(ctx, 'release add f1')
            await commitOnRelease(ctx, 'hotfix on release')

            await runCli(ctx, 'release finish')

            expect(lastHookCall(ctx, 'preReleaseFinish')?.args).toEqual([
                '0.1.0',
                releaseFinishContext({ features: [releasedFeature('f1')] }),
            ])
        })

        test('finishes a release made only of commits outside features', async (ctx) => {
            await runCli(ctx, 'release start 0.1.0')
            await commitOnRelease(ctx, 'hotfix on release')

            await runCli(ctx, 'release finish')

            expect(lastHookCall(ctx, 'preReleaseFinish')?.args).toEqual([
                '0.1.0',
                releaseFinishContext({ features: [] }),
            ])
            expect(lastHookCall(ctx, 'postReleaseFinish')?.args[1]).toMatchObject({
                features: [],
                deletedBranches: ['release-0.1.0'],
            })
        })

        test('lists the features of a release created from a preview', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await runCli(ctx, 'preview start p1')
            await runCli(ctx, 'preview add p1 f1')
            await ctx.cliLocal(
                `printf '\\n' | node ${CLI_PATH} preview release p1`
            )

            await runCli(ctx, 'release finish')

            expect(lastHookCall(ctx, 'preReleaseFinish')?.args).toEqual([
                '0.1.0',
                releaseFinishContext({ features: [releasedFeature('f1')] }),
            ])
        })

        test('runs preReleaseFinish with the release branch checked out', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await runCli(ctx, 'release start 0.1.0')
            await runCli(ctx, 'release add f1')
            await ctx.cliLocal('git checkout feature-f1')

            await runCli(ctx, 'release finish')

            expect(lastHookCall(ctx, 'preReleaseFinish')?.branch).toBe(
                'release-0.1.0'
            )
        })
    })

    describe('hook failures', { timeout: 30000 }, () => {
        test('reports that the feature started when postFeatureStart fails', async (ctx) => {
            const featureStart = runCliWithFailingHook(ctx, {
                hook: 'postFeatureStart',
                args: 'feature start f1',
            })

            await expect(featureStart).rejects.toMatchObject({
                exitCode: 2,
                message: expect.stringContaining(
                    'Feature f1 started, but hook postFeatureStart failed: postFeatureStart exploded'
                ),
            })
            expect(await ctx.cliLocal('git branch --show-current')).toBe(
                'feature-f1'
            )
        })

        test('reports that the release started when postReleaseStart fails', async (ctx) => {
            const releaseStart = runCliWithFailingHook(ctx, {
                hook: 'postReleaseStart',
                args: 'release start 0.1.0',
            })

            await expect(releaseStart).rejects.toMatchObject({
                exitCode: 2,
                message: expect.stringContaining(
                    'Release 0.1.0 started, but hook postReleaseStart failed: postReleaseStart exploded'
                ),
            })
            expect(await ctx.cliLocal('git branch --show-current')).toBe(
                'release-0.1.0'
            )
        })

        test('reports that the release finished when postReleaseFinish fails', async (ctx) => {
            await runCli(ctx, 'release start 0.1.0')

            const releaseFinish = runCliWithFailingHook(ctx, {
                hook: 'postReleaseFinish',
                args: 'release finish',
            })

            await expect(releaseFinish).rejects.toMatchObject({
                exitCode: 2,
                message: expect.stringContaining(
                    'Release 0.1.0 finished, but hook postReleaseFinish failed: postReleaseFinish exploded'
                ),
            })
            expect(await ctx.cliLocal('git tag -l v0.1.0')).toBe('v0.1.0')
        })

        test('reports a post hook that throws something other than an Error', async (ctx) => {
            const featureStart = runCliWithFailingHook(ctx, {
                hook: 'postFeatureStart',
                args: 'feature start f1',
                value: 'jira-unreachable',
            })

            await expect(featureStart).rejects.toMatchObject({
                message: expect.stringContaining(
                    'Feature f1 started, but hook postFeatureStart failed: jira-unreachable'
                ),
            })
        })

        test('aborts before touching git when a pre hook fails', async (ctx) => {
            const featureStart = runCliWithFailingHook(ctx, {
                hook: 'preFeatureStart',
                args: 'feature start f1',
            })

            await expect(featureStart).rejects.toMatchObject({
                exitCode: 2,
                message: expect.stringContaining('preFeatureStart exploded'),
            })
            expect(await ctx.cliLocal('git branch -a')).not.toContain(
                'feature-f1'
            )
        })
    })
})
