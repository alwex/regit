import axios from 'axios'
import { getProjectRootDirectory } from './gitHelpers.js'
import fs from 'fs'

export interface Hooks {
    getFeatureName: (id: string) => Promise<string>
    preFeatureStart: (id: string) => Promise<void>
    postFeatureStart: (id: string) => Promise<void>
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
    preFeatureStart: async () => {},
    postFeatureStart: async () => {},
    preReleaseFinish: async () => {},
    postReleaseFinish: async () => {},
}

export const getHooks = async () => {
    const rootDir = await getProjectRootDirectory()
    const hasCustomHooks = fs.existsSync(`${rootDir}/regit.js`)
    if (hasCustomHooks) {
        const customHooks = await import(`${rootDir}/regit.js`)

        return {
            ...defaultHooks,
            ...customHooks.default,
        } as Hooks
    }

    return defaultHooks
}
