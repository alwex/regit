import axios from 'axios'
import { getProjectRootDirectory } from './gitHelpers.js'
import fs from 'fs'
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

export const getHooks = async () => {
    const regitDir = await getRegitDirectory()
    const hasCustomHooks = fs.existsSync(`${regitDir}/hooks.js`)
    if (hasCustomHooks) {
        const customHooks = await import(`${regitDir}/hooks.js`)

        return {
            ...defaultHooks,
            ...customHooks.default,
        } as Hooks
    }

    return defaultHooks
}
