import axios from 'axios'
import { BranchInspection, getProjectRootDirectory } from './gitHelpers.js'
import fs from 'fs'
import path from 'path'
import vm from 'vm'
import { createRequire } from 'module'
import { pathToFileURL } from 'url'
import { getRegitDirectory } from './helpers.js'

export type FeatureStartContext = BranchInspection & {
    kind: 'feature'
    id: string
}

export type ReleaseTrigger =
    | { trigger: 'release-start' }
    | { trigger: 'preview-release'; preview: string }

export type ReleaseStartContext = BranchInspection &
    ReleaseTrigger & {
        kind: 'release'
        id: string
        version: string
    }

export type ReleasedFeature = {
    id: string
    branch: string
    baseTag: string
}

export type ReleaseFinishContext = {
    version: string
    tag: string
    previousTag: string
    releaseBranch: string
    features: ReleasedFeature[]
}

export type ReleaseFinishedContext = ReleaseFinishContext & {
    stableCommit: string
    deletedBranches: string[]
}

export interface Hooks {
    getFeatureName: (id: string) => Promise<string>
    preFeatureStart: (id: string, context: FeatureStartContext) => Promise<void>
    postFeatureStart: (id: string, context: FeatureStartContext) => Promise<void>
    preReleaseStart: (
        version: string,
        context: ReleaseStartContext
    ) => Promise<void>
    postReleaseStart: (
        version: string,
        context: ReleaseStartContext
    ) => Promise<void>
    preReleaseFinish: (
        version: string,
        context: ReleaseFinishContext
    ) => Promise<void>
    postReleaseFinish: (
        version: string,
        context: ReleaseFinishedContext
    ) => Promise<void>
}

const describeFailure = (error: unknown) => {
    if (error instanceof Error) {
        return error.message
    }

    return String(error)
}

export const runPostHook = async ({
    hook,
    completed,
    run,
}: {
    hook: keyof Hooks
    completed: string
    run: () => Promise<void>
}) => {
    try {
        await run()
    } catch (error) {
        throw new Error(
            `${completed}, but hook ${hook} failed: ${describeFailure(error)}`
        )
    }
}

const defaultHooks: Hooks = {
    getFeatureName: async (id: string) => {
        // const api = `https://random-word-api.vercel.app/api?words=4`

        // const result = await axios.get(api)

        // return result.data.toString().replaceAll(',', '-')

        return ''
    },
    preFeatureStart: async (id: string) => {},
    postFeatureStart: async (id: string) => {},
    preReleaseStart: async (version: string) => {},
    postReleaseStart: async (version: string) => {},
    preReleaseFinish: async (version: string) => {},
    postReleaseFinish: async (version: string) => {},
}

const compileCommonJs = (hookPath: string) => {
    try {
        return vm.compileFunction(
            fs.readFileSync(hookPath, 'utf8'),
            ['module', 'exports', 'require', '__filename', '__dirname'],
            { filename: hookPath },
        )
    } catch {
        return undefined
    }
}

const loadCustomHooks = async (hookPath: string): Promise<Partial<Hooks>> => {
    const evaluate = compileCommonJs(hookPath)
    if (!evaluate) {
        const esModule = await import(pathToFileURL(hookPath).href)
        return esModule.default
    }

    const hookModule: { exports: Partial<Hooks> } = { exports: {} }
    evaluate(
        hookModule,
        hookModule.exports,
        createRequire(hookPath),
        hookPath,
        path.dirname(hookPath),
    )

    return hookModule.exports
}

const loadedHooks = new Map<string, Promise<Hooks>>()

const loadHooks = async (hookPath: string): Promise<Hooks> => {
    return {
        ...defaultHooks,
        ...(await loadCustomHooks(hookPath)),
    }
}

export const getHooks = async (): Promise<Hooks> => {
    const regitDir = await getRegitDirectory()

    const possibleHookPath = [
        `${regitDir}/hooks.js`,
        `${regitDir}/hooks.cjs`,
        `${regitDir}/hooks.mjs`,
    ]

    const hookPath = possibleHookPath.find((path) => {
        return fs.existsSync(path)
    })
    if (!hookPath) {
        return defaultHooks
    }

    const hooks = loadedHooks.get(hookPath) ?? loadHooks(hookPath)
    loadedHooks.set(hookPath, hooks)

    return hooks
}
