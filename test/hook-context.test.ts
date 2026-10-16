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

const tagMessageFromEnv = () => {
    if (process.env.TAG_MESSAGE === 'undefined') {
        return undefined
    }
    return process.env.TAG_MESSAGE
}

const getTagMessage = async (...args) => {
    await record('getTagMessage')(...args)
    if ('TAG_MESSAGE' in process.env) {
        return tagMessageFromEnv()
    }
    const ids = args[1].features.map((feature) => {
        return feature.id
    })
    return 'notes for ' + args[1].tag + ': ' + ids.join(', ')
}

module.exports = {
    getTagMessage,
    preFeatureStart: record('preFeatureStart'),
    postFeatureStart: record('postFeatureStart'),
    preReleaseStart: record('preReleaseStart'),
    postReleaseStart: record('postReleaseStart'),
    preReleaseFinish: record('preReleaseFinish'),
    postReleaseFinish: record('postReleaseFinish'),
    prePreviewStart: record('prePreviewStart'),
    postPreviewStart: record('postPreviewStart'),
    prePreviewAdd: record('prePreviewAdd'),
    postPreviewAdd: record('postPreviewAdd'),
    preReleaseAdd: record('preReleaseAdd'),
    postReleaseAdd: record('postReleaseAdd'),
    postFeaturePush: record('postFeaturePush'),
    preFeatureRemove: record('preFeatureRemove'),
    postFeatureRemove: record('postFeatureRemove'),
    prePreviewRemove: record('prePreviewRemove'),
    postPreviewRemove: record('postPreviewRemove'),
    preReleaseRemove: record('preReleaseRemove'),
    postReleaseRemove: record('postReleaseRemove'),
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
    if (!fs.existsSync(logFile)) {
        return []
    }

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

const successLine = (message: string) => {
    return `✔  success   ${message}`
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

const featureSummary = (id: string) => {
    return { id, branch: `feature-${id}`, baseTag: 'v0.0.1' }
}

const commitOnRelease = async (ctx: TestContext, message: string) => {
    await ctx.cliLocal('git checkout release-0.1.0')
    await ctx.cliLocal(`git commit --allow-empty -m "${message}"`)
    await ctx.cliLocal('git push origin release-0.1.0')
}

const readTagMessage = async (ctx: TestContext, tag: string) => {
    const message = await ctx.cliLocal(
        `git tag -l --format='%(contents)' ${tag}`
    )

    return message.trim()
}

const featureStartHooks = { pre: 'preFeatureStart', post: 'postFeatureStart' }

const releaseStartHooks = { pre: 'preReleaseStart', post: 'postReleaseStart' }

const previewStartContext = (overrides: Record<string, unknown>) => {
    return {
        kind: 'preview',
        id: 'p1',
        branch: 'preview-p1',
        origin: 'new',
        baseTag: 'v0.0.1',
        latestTag: 'v0.0.1',
        isOutdated: false,
        ...overrides,
    }
}

const previewFeaturesContext = (overrides: Record<string, unknown>) => {
    return {
        preview: 'p1',
        previewBranch: 'preview-p1',
        features: [],
        ...overrides,
    }
}

const previewStartHooks = { pre: 'prePreviewStart', post: 'postPreviewStart' }

const previewAddHooks = { pre: 'prePreviewAdd', post: 'postPreviewAdd' }

const releaseFeaturesContext = (overrides: Record<string, unknown>) => {
    return {
        version: '0.1.0',
        releaseBranch: 'release-0.1.0',
        features: [],
        ...overrides,
    }
}

const releaseAddHooks = { pre: 'preReleaseAdd', post: 'postReleaseAdd' }

const featureRemoveHooks = {
    pre: 'preFeatureRemove',
    post: 'postFeatureRemove',
}

const previewRemoveHooks = {
    pre: 'prePreviewRemove',
    post: 'postPreviewRemove',
}

const releaseRemoveHooks = {
    pre: 'preReleaseRemove',
    post: 'postReleaseRemove',
}

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
                features: [featureSummary('f1'), featureSummary('f2')],
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
                releaseFinishContext({ features: [featureSummary('f1')] }),
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
                releaseFinishContext({ features: [featureSummary('f1')] }),
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

    describe('feature push', () => {
        test('tells hooks which feature was pushed', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await ctx.cliLocal('git commit --allow-empty -m "work on f1"')

            await runCli(ctx, 'feature push')

            expect(lastHookCall(ctx, 'postFeaturePush')?.args).toEqual([
                'f1',
                { id: 'f1', branch: 'feature-f1' },
            ])
        })
    })

    describe('feature remove', { timeout: 30000 }, () => {
        test('tells hooks which feature is removed', async (ctx) => {
            await runCli(ctx, 'feature start f1')

            await runCli(ctx, 'feature remove f1')

            expectBothHooksCalledWith(ctx, featureRemoveHooks, [
                'f1',
                { id: 'f1', branch: 'feature-f1' },
            ])
        })

        test('runs preFeatureRemove before leaving the branch being removed', async (ctx) => {
            await runCli(ctx, 'feature start f1')

            await runCli(ctx, 'feature remove f1')

            expect(lastHookCall(ctx, 'preFeatureRemove')?.branch).toBe(
                'feature-f1'
            )
            expect(lastHookCall(ctx, 'postFeatureRemove')?.branch).toBe(
                'stable'
            )
        })

        test('does not fire remove hooks for a feature that does not exist', async (ctx) => {
            const featureRemove = runCli(ctx, 'feature remove f1')

            await expect(featureRemove).rejects.toMatchObject({
                message: expect.stringContaining('Feature f1 does not exist'),
            })
            expect(readHookCalls(ctx, 'preFeatureRemove')).toEqual([])
            expect(readHookCalls(ctx, 'postFeatureRemove')).toEqual([])
        })

        test('does not fire remove hooks when release finish deletes features', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await runCli(ctx, 'release start 0.1.0')
            await runCli(ctx, 'release add f1')

            await runCli(ctx, 'release finish')

            expect(readHookCalls(ctx, 'preFeatureRemove')).toEqual([])
            expect(readHookCalls(ctx, 'postFeatureRemove')).toEqual([])
        })
    })

    describe('tag message', { timeout: 30000 }, () => {
        test('uses getTagMessage for the release tag', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await runCli(ctx, 'release start 0.1.0')
            await runCli(ctx, 'release add f1')

            await runCli(ctx, 'release finish')

            expect(lastHookCall(ctx, 'getTagMessage')?.args).toEqual([
                '0.1.0',
                releaseFinishContext({ features: [featureSummary('f1')] }),
            ])
            expect(await readTagMessage(ctx, 'v0.1.0')).toBe(
                'notes for v0.1.0: f1'
            )
        })

        test.for([
            { label: 'an empty message', value: "''" },
            { label: 'a blank message', value: "'   '" },
            { label: 'no message', value: 'undefined' },
        ])(
            'stops before merging when getTagMessage returns $label',
            async ({ value }, ctx) => {
                await runCli(ctx, 'release start 0.1.0')
                const localStableBefore = await ctx.cliLocal(
                    'git rev-parse stable'
                )
                const remoteStableBefore = await ctx.cliRemote(
                    'git rev-parse stable'
                )

                const releaseFinish = ctx.cliLocal(
                    `TAG_MESSAGE=${value} node ${CLI_PATH} release finish`
                )

                await expect(releaseFinish).rejects.toMatchObject({
                    exitCode: 2,
                    message: expect.stringContaining(
                        'Hook getTagMessage must return a non-empty string'
                    ),
                })
                expect(await ctx.cliLocal('git tag -l v0.1.0')).toBe('')
                expect(await ctx.cliLocal('git rev-parse stable')).toBe(
                    localStableBefore
                )
                expect(await ctx.cliRemote('git rev-parse stable')).toBe(
                    remoteStableBefore
                )
            }
        )
    })

    describe('preview start', () => {
        test('tells hooks the preview branch is new', async (ctx) => {
            await runCli(ctx, 'preview start p1')

            expectBothHooksCalledWith(ctx, previewStartHooks, [
                'p1',
                previewStartContext({ origin: 'new' }),
            ])
        })

        test('tells hooks the preview branch already exists locally', async (ctx) => {
            await runCli(ctx, 'preview start p1')

            await runCli(ctx, 'preview start p1')

            expectBothHooksCalledWith(ctx, previewStartHooks, [
                'p1',
                previewStartContext({ origin: 'local' }),
            ])
        })

        test('fetches origin before telling hooks a preview only exists there', async (ctx) => {
            await runCli(ctx, 'preview start p1')
            await ctx.cliLocal('git checkout stable')
            await ctx.cliLocal('git branch -D preview-p1')
            await ctx.cliLocal('git branch -dr origin/preview-p1')

            await runCli(ctx, 'preview start p1')

            expectBothHooksCalledWith(ctx, previewStartHooks, [
                'p1',
                previewStartContext({ origin: 'remote' }),
            ])
        })
    })

    describe('preview add', { timeout: 30000 }, () => {
        test('tells hooks which feature is added to the preview', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await runCli(ctx, 'preview start p1')

            await runCli(ctx, 'preview add p1 f1')

            expectBothHooksCalledWith(ctx, previewAddHooks, [
                'p1',
                previewFeaturesContext({ features: [featureSummary('f1')] }),
            ])
        })

        test('tells hooks which features are picked in the prompt', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await runCli(ctx, 'feature start f2')
            await runCli(ctx, 'preview start p1')

            await ctx.cliLocal(`printf 'a\\n' | node ${CLI_PATH} preview add p1`)

            expectBothHooksCalledWith(ctx, previewAddHooks, [
                'p1',
                previewFeaturesContext({
                    features: [featureSummary('f1'), featureSummary('f2')],
                }),
            ])
        })
    })

    describe('preview remove', { timeout: 30000 }, () => {
        test('tells hooks which features the removed preview contains', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await runCli(ctx, 'feature start f2')
            await runCli(ctx, 'preview start p1')
            await runCli(ctx, 'preview add p1 f1')
            await runCli(ctx, 'preview add p1 f2')

            await runCli(ctx, 'preview remove p1')

            expectBothHooksCalledWith(ctx, previewRemoveHooks, [
                'p1',
                previewFeaturesContext({
                    features: [featureSummary('f1'), featureSummary('f2')],
                }),
            ])
        })

        test('tells hooks an empty preview has no features', async (ctx) => {
            await runCli(ctx, 'preview start p1')

            await runCli(ctx, 'preview remove p1')

            expectBothHooksCalledWith(ctx, previewRemoveHooks, [
                'p1',
                previewFeaturesContext({ features: [] }),
            ])
        })

        test('lists the features of a preview that only exists on origin', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await runCli(ctx, 'preview start p1')
            await runCli(ctx, 'preview add p1 f1')
            await ctx.cliLocal('git checkout stable')
            await ctx.cliLocal('git branch -D preview-p1')

            await runCli(ctx, 'preview remove p1')

            expectBothHooksCalledWith(ctx, previewRemoveHooks, [
                'p1',
                previewFeaturesContext({ features: [featureSummary('f1')] }),
            ])
            expect(await ctx.cliRemote('git branch --list preview-p1')).toBe('')
        })

        test('runs prePreviewRemove before leaving the preview being removed', async (ctx) => {
            await runCli(ctx, 'preview start p1')

            await runCli(ctx, 'preview remove p1')

            expect(lastHookCall(ctx, 'prePreviewRemove')?.branch).toBe(
                'preview-p1'
            )
            expect(lastHookCall(ctx, 'postPreviewRemove')?.branch).toBe(
                'stable'
            )
        })

        test('does not fire remove hooks for a preview that does not exist', async (ctx) => {
            const previewRemove = runCli(ctx, 'preview remove p1')

            await expect(previewRemove).rejects.toMatchObject({
                message: expect.stringContaining('Preview p1 does not exist'),
            })
            expect(readHookCalls(ctx, 'prePreviewRemove')).toEqual([])
            expect(readHookCalls(ctx, 'postPreviewRemove')).toEqual([])
        })
    })

    describe('release remove', { timeout: 30000 }, () => {
        test('tells hooks which features the removed release contains', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await runCli(ctx, 'feature start f2')
            await runCli(ctx, 'release start 0.1.0')
            await runCli(ctx, 'release add f1')
            await runCli(ctx, 'release add f2')

            await runCli(ctx, 'release remove')

            expectBothHooksCalledWith(ctx, releaseRemoveHooks, [
                '0.1.0',
                releaseFeaturesContext({
                    features: [featureSummary('f1'), featureSummary('f2')],
                }),
            ])
        })

        test('tells hooks an empty release has no features', async (ctx) => {
            await runCli(ctx, 'release start 0.1.0')

            await runCli(ctx, 'release remove')

            expectBothHooksCalledWith(ctx, releaseRemoveHooks, [
                '0.1.0',
                releaseFeaturesContext({ features: [] }),
            ])
        })

        test('lists the features of a release that only exists on origin', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await runCli(ctx, 'release start 0.1.0')
            await runCli(ctx, 'release add f1')
            await ctx.cliLocal('git checkout stable')
            await ctx.cliLocal('git branch -D release-0.1.0')

            await runCli(ctx, 'release remove')

            expectBothHooksCalledWith(ctx, releaseRemoveHooks, [
                '0.1.0',
                releaseFeaturesContext({ features: [featureSummary('f1')] }),
            ])
            expect(await ctx.cliRemote('git branch --list release-0.1.0')).toBe(
                ''
            )
        })

        test('runs preReleaseRemove before leaving the release being removed', async (ctx) => {
            await runCli(ctx, 'release start 0.1.0')

            await runCli(ctx, 'release remove')

            expect(lastHookCall(ctx, 'preReleaseRemove')?.branch).toBe(
                'release-0.1.0'
            )
            expect(lastHookCall(ctx, 'postReleaseRemove')?.branch).toBe(
                'stable'
            )
        })

        test('does not fire remove hooks without an open release', async (ctx) => {
            const releaseRemove = runCli(ctx, 'release remove')

            await expect(releaseRemove).rejects.toMatchObject({
                message: expect.stringContaining('No open release found'),
            })
            expect(readHookCalls(ctx, 'preReleaseRemove')).toEqual([])
            expect(readHookCalls(ctx, 'postReleaseRemove')).toEqual([])
        })

        test('does not fire remove hooks when release finish deletes the release', async (ctx) => {
            await runCli(ctx, 'release start 0.1.0')

            await runCli(ctx, 'release finish')

            expect(readHookCalls(ctx, 'preReleaseRemove')).toEqual([])
            expect(readHookCalls(ctx, 'postReleaseRemove')).toEqual([])
        })
    })

    describe('release add', { timeout: 30000 }, () => {
        test('tells hooks which feature is added to the release', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await runCli(ctx, 'release start 0.1.0')

            await runCli(ctx, 'release add f1')

            expectBothHooksCalledWith(ctx, releaseAddHooks, [
                '0.1.0',
                releaseFeaturesContext({ features: [featureSummary('f1')] }),
            ])
        })

        test('tells hooks which features are picked in the prompt', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await runCli(ctx, 'feature start f2')
            await runCli(ctx, 'release start 0.1.0')

            await ctx.cliLocal(`printf 'a\\n' | node ${CLI_PATH} release add`)

            expectBothHooksCalledWith(ctx, releaseAddHooks, [
                '0.1.0',
                releaseFeaturesContext({
                    features: [featureSummary('f1'), featureSummary('f2')],
                }),
            ])
        })
    })

    describe('hook failures', { timeout: 30000 }, () => {
        test('reports that the feature was pushed when postFeaturePush fails', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await ctx.cliLocal('git commit --allow-empty -m "work on f1"')

            const featurePush = runCliWithFailingHook(ctx, {
                hook: 'postFeaturePush',
                args: 'feature push',
            })

            await expect(featurePush).rejects.toMatchObject({
                exitCode: 2,
                message: expect.stringContaining(
                    'Feature f1 pushed, but hook postFeaturePush failed: postFeaturePush exploded'
                ),
            })
            expect(await ctx.cliRemote('git rev-parse feature-f1')).toBe(
                await ctx.cliLocal('git rev-parse feature-f1')
            )
        })

        test('reports that features were merged when postReleaseAdd fails', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await runCli(ctx, 'release start 0.1.0')

            const releaseAdd = runCliWithFailingHook(ctx, {
                hook: 'postReleaseAdd',
                args: 'release add f1',
            })

            await expect(releaseAdd).rejects.toMatchObject({
                exitCode: 2,
                message: expect.stringContaining(
                    'Merged feature-f1 into release-0.1.0, but hook postReleaseAdd failed: postReleaseAdd exploded'
                ),
            })
        })

        test('reports that the preview started when postPreviewStart fails', async (ctx) => {
            const previewStart = runCliWithFailingHook(ctx, {
                hook: 'postPreviewStart',
                args: 'preview start p1',
            })

            await expect(previewStart).rejects.toMatchObject({
                exitCode: 2,
                message: expect.stringContaining(
                    'Preview p1 started, but hook postPreviewStart failed: postPreviewStart exploded'
                ),
                stdout: expect.not.stringContaining(successLine('Preview p1 started')),
            })
            expect(await ctx.cliLocal('git branch --show-current')).toBe(
                'preview-p1'
            )
        })

        test('reports that features were merged when postPreviewAdd fails', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await runCli(ctx, 'preview start p1')

            const previewAdd = runCliWithFailingHook(ctx, {
                hook: 'postPreviewAdd',
                args: 'preview add p1 f1',
            })

            await expect(previewAdd).rejects.toMatchObject({
                exitCode: 2,
                message: expect.stringContaining(
                    'Merged feature-f1 into preview-p1, but hook postPreviewAdd failed: postPreviewAdd exploded'
                ),
            })
        })

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
                stdout: expect.not.stringContaining(successLine('Feature f1 started')),
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
                stdout: expect.not.stringContaining(successLine('Release 0.1.0 started')),
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

        test('reports that the feature was removed when postFeatureRemove fails', async (ctx) => {
            await runCli(ctx, 'feature start f1')

            const featureRemove = runCliWithFailingHook(ctx, {
                hook: 'postFeatureRemove',
                args: 'feature remove f1',
            })

            await expect(featureRemove).rejects.toMatchObject({
                exitCode: 2,
                message: expect.stringContaining(
                    'Feature f1 removed, but hook postFeatureRemove failed: postFeatureRemove exploded'
                ),
                stdout: expect.not.stringContaining(successLine('Feature f1 removed')),
            })
            expect(await ctx.cliLocal('git branch -a')).not.toContain(
                'feature-f1'
            )
        })

        test('keeps the feature when preFeatureRemove fails', async (ctx) => {
            await runCli(ctx, 'feature start f1')

            const featureRemove = runCliWithFailingHook(ctx, {
                hook: 'preFeatureRemove',
                args: 'feature remove f1',
            })

            await expect(featureRemove).rejects.toMatchObject({
                exitCode: 2,
                message: expect.stringContaining('preFeatureRemove exploded'),
            })
            expect(await ctx.cliLocal('git branch --show-current')).toBe(
                'feature-f1'
            )
            expect(await ctx.cliRemote('git branch --list feature-f1')).toContain(
                'feature-f1'
            )
        })

        test('reports that the preview was removed when postPreviewRemove fails', async (ctx) => {
            await runCli(ctx, 'preview start p1')

            const previewRemove = runCliWithFailingHook(ctx, {
                hook: 'postPreviewRemove',
                args: 'preview remove p1',
            })

            await expect(previewRemove).rejects.toMatchObject({
                exitCode: 2,
                message: expect.stringContaining(
                    'Preview p1 removed, but hook postPreviewRemove failed: postPreviewRemove exploded'
                ),
                stdout: expect.not.stringContaining(successLine('Preview p1 removed')),
            })
            expect(await ctx.cliLocal('git branch -a')).not.toContain(
                'preview-p1'
            )
        })

        test('keeps the preview when prePreviewRemove fails', async (ctx) => {
            await runCli(ctx, 'preview start p1')

            const previewRemove = runCliWithFailingHook(ctx, {
                hook: 'prePreviewRemove',
                args: 'preview remove p1',
            })

            await expect(previewRemove).rejects.toMatchObject({
                exitCode: 2,
                message: expect.stringContaining('prePreviewRemove exploded'),
            })
            expect(await ctx.cliLocal('git branch --show-current')).toBe(
                'preview-p1'
            )
            expect(await ctx.cliRemote('git branch --list preview-p1')).toContain(
                'preview-p1'
            )
        })

        test('reports that the release was removed when postReleaseRemove fails', async (ctx) => {
            await runCli(ctx, 'release start 0.1.0')

            const releaseRemove = runCliWithFailingHook(ctx, {
                hook: 'postReleaseRemove',
                args: 'release remove',
            })

            await expect(releaseRemove).rejects.toMatchObject({
                exitCode: 2,
                message: expect.stringContaining(
                    'Release release-0.1.0 removed, but hook postReleaseRemove failed: postReleaseRemove exploded'
                ),
                stdout: expect.not.stringContaining(successLine('Release release-0.1.0 removed')),
            })
            expect(await ctx.cliLocal('git branch -a')).not.toContain(
                'release-0.1.0'
            )
        })

        test('keeps the release when preReleaseRemove fails', async (ctx) => {
            await runCli(ctx, 'release start 0.1.0')

            const releaseRemove = runCliWithFailingHook(ctx, {
                hook: 'preReleaseRemove',
                args: 'release remove',
            })

            await expect(releaseRemove).rejects.toMatchObject({
                exitCode: 2,
                message: expect.stringContaining('preReleaseRemove exploded'),
            })
            expect(await ctx.cliLocal('git branch --show-current')).toBe(
                'release-0.1.0'
            )
            expect(
                await ctx.cliRemote('git branch --list release-0.1.0')
            ).toContain('release-0.1.0')
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
