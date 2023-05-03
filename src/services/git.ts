import { simpleGit, SimpleGit } from 'simple-git'

// TODO condition this base dir based on dev/build/test
const baseDir = `${process.cwd()}/../regit-playground/local`

export const git: SimpleGit = simpleGit({
    baseDir,
})

git.outputHandler((bin, stdout, stderr, args) => {
    //   stdout.pipe(process.stdout)
    stderr.pipe(process.stderr)
})
