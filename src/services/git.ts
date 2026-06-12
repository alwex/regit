import { simpleGit, SimpleGit } from 'simple-git'

const devBaseDir = `/Users/alexandre/WorkspacePerso/regit-playground/local`

const resolveBaseDir = (): string | undefined => {
    if (process.env.GIT_BASE_DIR) {
        return process.env.GIT_BASE_DIR
    }

    if (process.env.NODE_ENV === 'dev') {
        return devBaseDir
    }

    return undefined
}

const unset = Symbol('unset')
let cachedBaseDir: string | undefined | typeof unset = unset
let instance: SimpleGit

const getGit = (): SimpleGit => {
    const baseDir = resolveBaseDir()

    if (baseDir !== cachedBaseDir) {
        cachedBaseDir = baseDir
        instance = simpleGit(baseDir ? { baseDir } : {})
        instance.outputHandler((bin, stdout, stderr, args) => {
            stderr.pipe(process.stderr)
        })
    }

    return instance
}

export const git: SimpleGit = new Proxy({} as SimpleGit, {
    get(_target, property) {
        const resolved = getGit() as unknown as Record<string | symbol, unknown>
        const value = resolved[property]

        return typeof value === 'function'
            ? (value as (...args: unknown[]) => unknown).bind(resolved)
            : value
    },
})
