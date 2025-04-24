import 'vitest'

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
