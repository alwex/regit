import axios from 'axios'
import { getProjectRootDirectory } from './gitHelpers.js'
import fs from 'fs'
import path from 'path'
import vm from 'vm'
import { createRequire } from 'module'
import { pathToFileURL } from 'url'
import { getRegitDirectory } from './helpers.js'

export interface Hooks {
    getFeatureName: (id: string) => Promise<string>
    preFeatureStart: (id: string) => Promise<void>
    postFeatureStart: (id: string) => Promise<void>
    preReleaseStart: (version: string) => Promise<void>
    postReleaseStart: (version: string) => Promise<void>
    preReleaseFinish: (version: string) => Promise<void>
    postReleaseFinish: (version: string) => Promise<void>
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
