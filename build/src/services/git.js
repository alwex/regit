import { simpleGit } from 'simple-git';
const devBaseDir = `/Users/alexandre/WorkspacePerso/regit-playground/local`;
const resolveBaseDir = () => {
    if (process.env.GIT_BASE_DIR) {
        return process.env.GIT_BASE_DIR;
    }
    if (process.env.NODE_ENV === 'dev') {
        return devBaseDir;
    }
    return undefined;
};
const unset = Symbol('unset');
let cachedBaseDir = unset;
let instance;
const getGit = () => {
    const baseDir = resolveBaseDir();
    if (baseDir !== cachedBaseDir) {
        cachedBaseDir = baseDir;
        instance = simpleGit(baseDir ? { baseDir } : {});
        instance.outputHandler((bin, stdout, stderr, args) => {
            stderr.pipe(process.stderr);
        });
    }
    return instance;
};
export const git = new Proxy({}, {
    get(_target, property) {
        const resolved = getGit();
        const value = resolved[property];
        return typeof value === 'function'
            ? value.bind(resolved)
            : value;
    },
});
