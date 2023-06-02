import { test, expect } from 'vitest'
import { makeProgram } from '../../program.js'

test('feature start', async () => {
    const program = makeProgram()

    program.configureOutput({
        writeOut(str) {
            console.log(`writeOut: ${str}`)
            return ''
        },
        outputError(str, write) {
            console.log(`outputError: ${str}`)
            return ''
        },
    })

    const result = await program.parseAsync([
        'node',
        'regit',
        'feature',
        'start',
        'proute',
    ])
})
