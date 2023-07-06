import { simpleGit } from 'simple-git';
const baseDir = `/Users/alexandre/WorkspacePerso/regit-playground/local`;
const options = process.env.NODE_ENV === 'dev' ? { baseDir } : {};
export const git = simpleGit(options);
git.outputHandler((bin, stdout, stderr, args) => {
    //   stdout.pipe(process.stdout)
    stderr.pipe(process.stderr);
});
