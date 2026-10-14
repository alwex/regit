import fs from 'fs'
import path from 'path'
import { TestContext, beforeEach, describe, expect, test } from 'vitest'

const CLI_PATH = path.resolve(__dirname, '..', 'build', 'src', 'index.js')

const recordingHooks = `
const fs = require('fs')
const path = require('path')

const logFile = path.join(__dirname, '..', '.git', 'hook-calls.jsonl')

const record = (hook) => {
    return async (...args) => {
        fs.appendFileSync(logFile, JSON.stringify({ hook, args }) + '\\n')
    }
}

module.exports = {
    preFeatureStart: record('preFeatureStart'),
    postFeatureStart: record('postFeatureStart'),
}
`

type HookCall = {
    hook: string
    args: unknown[]
}

const runCli = async (ctx: TestContext, args: string) => {
    return ctx.cliLocal(`node ${CLI_PATH} ${args}`)
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

describe('hook context', () => {
    beforeEach(async (ctx) => {
        await ctx.regit('init 0.0.0')
        await installRecordingHooks(ctx)
    })

    describe('feature start', () => {
        test('tells hooks the feature branch is new', async (ctx) => {
            await runCli(ctx, 'feature start f1')

            const expectedArgs = ['f1', featureStartContext({ origin: 'new' })]
            expect(lastHookCall(ctx, 'preFeatureStart')?.args).toEqual(
                expectedArgs
            )
            expect(lastHookCall(ctx, 'postFeatureStart')?.args).toEqual(
                expectedArgs
            )
        })

        test('tells hooks the feature branch already exists locally', async (ctx) => {
            await runCli(ctx, 'feature start f1')

            await runCli(ctx, 'feature start f1')

            const expectedArgs = [
                'f1',
                featureStartContext({ origin: 'local' }),
            ]
            expect(lastHookCall(ctx, 'preFeatureStart')?.args).toEqual(
                expectedArgs
            )
            expect(lastHookCall(ctx, 'postFeatureStart')?.args).toEqual(
                expectedArgs
            )
        })

        test('tells hooks the feature branch only exists on origin', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await ctx.cliLocal('git checkout stable')
            await ctx.cliLocal('git branch -D feature-f1')

            await runCli(ctx, 'feature start f1')

            const expectedArgs = [
                'f1',
                featureStartContext({ origin: 'remote' }),
            ]
            expect(lastHookCall(ctx, 'preFeatureStart')?.args).toEqual(
                expectedArgs
            )
            expect(lastHookCall(ctx, 'postFeatureStart')?.args).toEqual(
                expectedArgs
            )
        })

        test('tells hooks the feature branch is based on an old release', async (ctx) => {
            await runCli(ctx, 'feature start f1')
            await tagStable(ctx, 'v0.0.2')

            await runCli(ctx, 'feature start f1')

            const expectedArgs = [
                'f1',
                featureStartContext({
                    origin: 'local',
                    baseTag: 'v0.0.1',
                    latestTag: 'v0.0.2',
                    isOutdated: true,
                }),
            ]
            expect(lastHookCall(ctx, 'preFeatureStart')?.args).toEqual(
                expectedArgs
            )
            expect(lastHookCall(ctx, 'postFeatureStart')?.args).toEqual(
                expectedArgs
            )
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
})
