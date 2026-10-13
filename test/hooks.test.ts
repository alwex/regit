import fs from 'fs'
import path from 'path'
import { beforeEach, describe, expect, test } from 'vitest'

const CLI_PATH = path.resolve(__dirname, '..', 'build', 'src', 'index.js')

type ProjectFiles = {
    packageJson?: Record<string, unknown>
    hooks: { file: string; source: string }
}

const commonJsHooks = `
module.exports = {
    getFeatureName: async (id) => \`name from commonjs hook for \${id}\`,
}
`

const commonJsHooksUsingRequire = `
const { basename } = require('path')

module.exports = {
    getFeatureName: async (id) => \`name from \${basename(__dirname)} for \${id}\`,
}
`

const esModuleHooks = `
export default {
    getFeatureName: async (id) => \`name from esm hook for \${id}\`,
}
`

const writeProjectFiles = (
    rootDir: string,
    { packageJson, hooks }: ProjectFiles
) => {
    if (packageJson) {
        fs.writeFileSync(
            path.join(rootDir, 'package.json'),
            JSON.stringify(packageJson)
        )
    }
    fs.rmSync(path.join(rootDir, '.regit', 'hooks.js'))
    fs.writeFileSync(path.join(rootDir, '.regit', hooks.file), hooks.source)
}

describe('hooks', async () => {
    beforeEach(async (ctx) => {
        await ctx.regit(`init 0.0.0`)
    })

    test.for([
        {
            scenario: 'commonjs hooks.js from a project using es modules',
            project: {
                packageJson: { type: 'module' },
                hooks: { file: 'hooks.js', source: commonJsHooks },
            },
            expectedName: 'name from commonjs hook for feature-f1',
        },
        {
            scenario: 'commonjs hooks.js from a project using commonjs',
            project: {
                packageJson: { type: 'commonjs' },
                hooks: { file: 'hooks.js', source: commonJsHooks },
            },
            expectedName: 'name from commonjs hook for feature-f1',
        },
        {
            scenario: 'commonjs hooks.js from a project without package.json',
            project: {
                hooks: { file: 'hooks.js', source: commonJsHooks },
            },
            expectedName: 'name from commonjs hook for feature-f1',
        },
        {
            scenario: 'commonjs hooks.cjs from a project using es modules',
            project: {
                packageJson: { type: 'module' },
                hooks: { file: 'hooks.cjs', source: commonJsHooks },
            },
            expectedName: 'name from commonjs hook for feature-f1',
        },
        {
            scenario:
                'commonjs hooks.js using require from a project using es modules',
            project: {
                packageJson: { type: 'module' },
                hooks: { file: 'hooks.js', source: commonJsHooksUsingRequire },
            },
            expectedName: 'name from .regit for feature-f1',
        },
        {
            scenario: 'es module hooks.js from a project using es modules',
            project: {
                packageJson: { type: 'module' },
                hooks: { file: 'hooks.js', source: esModuleHooks },
            },
            expectedName: 'name from esm hook for feature-f1',
        },
    ])('loads $scenario', async ({ project, expectedName }, ctx) => {
        await ctx.regit('feature start f1')
        writeProjectFiles(ctx.tempDirLocal, project)

        const result = await ctx.cliLocal(`node ${CLI_PATH} feature status`)

        expect(result).toContain(expectedName)
    })
})
