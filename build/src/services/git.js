var _a;
import { simpleGit } from 'simple-git';
const baseDir = 
// can force baseDir with GIT_BASE_DIR env variable
(_a = process.env.GIT_BASE_DIR) !== null && _a !== void 0 ? _a : 
// default to dev test base dir
`/Users/alexandre/WorkspacePerso/regit-playground/local`;
const options = process.env.NODE_ENV === 'dev' ? { baseDir } : {};
export const git = simpleGit(options);
git.outputHandler((bin, stdout, stderr, args) => {
    //   stdout.pipe(process.stdout)
    stderr.pipe(process.stderr);
});
