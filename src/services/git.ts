import { simpleGit, SimpleGit } from 'simple-git'

// TODO condition this base dir based on dev/build/test
const baseDir = `/Users/alexandre/WorkspacePerso/regit-playground/local`

export const git: SimpleGit = simpleGit({
    baseDir,
})

git.outputHandler((bin, stdout, stderr, args) => {
    //   stdout.pipe(process.stdout)
    stderr.pipe(process.stderr)
})
