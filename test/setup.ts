import { $ } from 'execa'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach } from 'vitest'
import { makeProgram } from '../build/src/program.js'

declare module 'vitest' {
    export interface TestContext {
        tempDirLocal: string
        tempDirRemote: string
        cliLocal: (args: string) => Promise<string>
        cliRemote: (args: string) => Promise<string>
        regit: (args: string) => Promise<string>
        info: () => void
    }
}

beforeEach(async (context) => {
    const tempDirLocal = fs.mkdtempSync(path.join(os.tmpdir(), 'regit-local-'))
    const tempDirRemote = fs.mkdtempSync(
        path.join(os.tmpdir(), 'regit-remote-'),
    )

    context.tempDirLocal = tempDirLocal
    context.tempDirRemote = tempDirRemote

    const cliLocal = async (args: any) => {
        const { stdout } = await $(args, { cwd: tempDirLocal, shell: true })
        return stdout
    }

    const cliRemote = async (args: any) => {
        const { stdout } = await $(args, { cwd: tempDirRemote, shell: true })
        return stdout
    }

    context.cliLocal = cliLocal
    context.cliRemote = cliRemote

    const regit = async (args: string): Promise<string> => {
        process.env.GIT_BASE_DIR = tempDirLocal
        process.env.NODE_ENV = 'dev'

        const writeStdout = process.stdout.write.bind(process.stdout)
        let output = ''
        process.stdout.write = ((chunk: unknown) => {
            output += typeof chunk === 'string' ? chunk : String(chunk)
            return true
        }) as typeof process.stdout.write

        try {
            const program = makeProgram()
            await program.parseAsync(['node', 'regit', ...args.split(' ')])
            return output.replace(/\r?\n$/, '')
        } finally {
            process.stdout.write = writeStdout
        }
    }

    context.regit = regit

    const info = () => {
        console.log('tempDirLocal', tempDirLocal)
        console.log('tempDirRemote', tempDirRemote)
    }

    context.info = info

    // initialize the local and remote git repository
    await cliRemote('git init --bare')
    await cliLocal('git init')
    await cliLocal(`git remote add origin ${tempDirRemote}`)
    await cliLocal('git config user.name "Test User"')
    await cliLocal('git config user.email "test@example.com"')
    await cliLocal('git config commit.gpgsign false')
})

afterEach((context) => {
    fs.rmSync(context.tempDirLocal, { recursive: true, force: true })
    fs.rmSync(context.tempDirRemote, { recursive: true, force: true })
})
