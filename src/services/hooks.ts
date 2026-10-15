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

export type FeatureSummary = {
    id: string
    branch: string
    baseTag: string
}

export type ReleaseFinishContext = {
    version: string
    tag: string
    previousTag: string
    releaseBranch: string
    features: FeatureSummary[]
}

export type ReleaseFinishedContext = ReleaseFinishContext & {
    stableCommit: string
    deletedBranches: string[]
}

export type FeaturePushContext = {
    id: string
    branch: string
}

export type FeatureRemoveContext = {
    id: string
    branch: string
}

export type ReleaseAddContext = {
    version: string
    releaseBranch: string
    features: FeatureSummary[]
}

export type PreviewStartContext = BranchInspection & {
    kind: 'preview'
    id: string
}

export type PreviewAddContext = {
    preview: string
    previewBranch: string
    features: FeatureSummary[]
}

export type PreviewRemoveContext = {
    preview: string
    previewBranch: string
    features: FeatureSummary[]
}

export interface Hooks {
    getFeatureName: (id: string) => Promise<string>
    getTagMessage: (
        version: string,
        context: ReleaseFinishContext
    ) => Promise<string>
    preFeatureStart: (id: string, context: FeatureStartContext) => Promise<void>
    postFeatureStart: (id: string, context: FeatureStartContext) => Promise<void>
    postFeaturePush: (id: string, context: FeaturePushContext) => Promise<void>
    preFeatureRemove: (
        id: string,
        context: FeatureRemoveContext
    ) => Promise<void>
    postFeatureRemove: (
        id: string,
        context: FeatureRemoveContext
    ) => Promise<void>
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
    preReleaseAdd: (version: string, context: ReleaseAddContext) => Promise<void>
    postReleaseAdd: (
        version: string,
        context: ReleaseAddContext
    ) => Promise<void>
    prePreviewStart: (
        preview: string,
        context: PreviewStartContext
    ) => Promise<void>
    postPreviewStart: (
        preview: string,
        context: PreviewStartContext
    ) => Promise<void>
    prePreviewAdd: (preview: string, context: PreviewAddContext) => Promise<void>
    postPreviewAdd: (
        preview: string,
        context: PreviewAddContext
    ) => Promise<void>
    prePreviewRemove: (
        preview: string,
        context: PreviewRemoveContext
    ) => Promise<void>
    postPreviewRemove: (
        preview: string,
        context: PreviewRemoveContext
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

export const resolveTagMessage = async ({
    hooks,
    version,
    context,
}: {
    hooks: Hooks
    version: string
    context: ReleaseFinishContext
}) => {
    const message: unknown = await hooks.getTagMessage(version, context)
    if (typeof message !== 'string' || message.trim() === '') {
        throw new Error('Hook getTagMessage must return a non-empty string')
    }

    return message
}

const defaultHooks: Hooks = {
    getFeatureName: async (id: string) => {
        // const api = `https://random-word-api.vercel.app/api?words=4`

        // const result = await axios.get(api)

        // return result.data.toString().replaceAll(',', '-')

        return ''
    },
    getTagMessage: async (version: string, context: ReleaseFinishContext) => {
        const branches = context.features.map((feature) => {
            return feature.branch
        })

        return `[regit] ${context.tag}. (${branches.join(',')})`
    },
    preFeatureStart: async (id: string) => {},
    postFeatureStart: async (id: string) => {},
    postFeaturePush: async (id: string) => {},
    preFeatureRemove: async (id: string) => {},
    postFeatureRemove: async (id: string) => {},
    preReleaseStart: async (version: string) => {},
    postReleaseStart: async (version: string) => {},
    preReleaseFinish: async (version: string) => {},
    postReleaseFinish: async (version: string) => {},
    preReleaseAdd: async (version: string) => {},
    postReleaseAdd: async (version: string) => {},
    prePreviewStart: async (preview: string) => {},
    postPreviewStart: async (preview: string) => {},
    prePreviewAdd: async (preview: string) => {},
    postPreviewAdd: async (preview: string) => {},
    prePreviewRemove: async (preview: string) => {},
    postPreviewRemove: async (preview: string) => {},
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
