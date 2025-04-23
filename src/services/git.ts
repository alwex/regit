import { simpleGit, SimpleGit } from 'simple-git'

const baseDir =
    // can force baseDir with GIT_BASE_DIR env variable
    process.env.GIT_BASE_DIR ??
    // default to dev test base dir
    `/Users/alexandre/WorkspacePerso/regit-playground/local`

const options = process.env.NODE_ENV === 'dev' ? { baseDir } : {}

export const git: SimpleGit = simpleGit(options)

git.outputHandler((bin, stdout, stderr, args) => {
    //   stdout.pipe(process.stdout)
    stderr.pipe(process.stderr)
})
