import { simpleGit, SimpleGit } from 'simple-git'

// TODO condition this base dir based on dev/build/test
const baseDir = `/Users/alexandre/WorkspacePerso/regit-playground/local`
// const baseDir = '/Users/alexandre/WorkspacePerso/blast-workout/MyWorkoutApp'
// const baseDir =
//     '/Users/alexandre/Workspace/autopilot/builder-v2-git-manip/builder-v2'

export const git: SimpleGit = simpleGit({
    baseDir,
})

git.outputHandler((bin, stdout, stderr, args) => {
    //   stdout.pipe(process.stdout)
    stderr.pipe(process.stderr)
})
