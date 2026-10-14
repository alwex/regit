var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import { getRegitDirectory } from './helpers.js';
const describeFailure = (error) => {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
};
export const runPostHook = ({ hook, completed, run, }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield run();
    }
    catch (error) {
        throw new Error(`${completed}, but hook ${hook} failed: ${describeFailure(error)}`);
    }
});
export const resolveTagMessage = ({ hooks, version, context, }) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield hooks.getTagMessage(version, context);
    if (typeof message !== 'string' || message.trim() === '') {
        throw new Error('Hook getTagMessage must return a non-empty string');
    }
    return message;
});
const defaultHooks = {
    getFeatureName: (id) => __awaiter(void 0, void 0, void 0, function* () {
        // const api = `https://random-word-api.vercel.app/api?words=4`
        // const result = await axios.get(api)
        // return result.data.toString().replaceAll(',', '-')
        return '';
    }),
    getTagMessage: (version, context) => __awaiter(void 0, void 0, void 0, function* () {
        const branches = context.features.map((feature) => {
            return feature.branch;
        });
        return `[regit] ${context.tag}. (${branches.join(',')})`;
    }),
    preFeatureStart: (id) => __awaiter(void 0, void 0, void 0, function* () { }),
    postFeatureStart: (id) => __awaiter(void 0, void 0, void 0, function* () { }),
    preReleaseStart: (version) => __awaiter(void 0, void 0, void 0, function* () { }),
    postReleaseStart: (version) => __awaiter(void 0, void 0, void 0, function* () { }),
    preReleaseFinish: (version) => __awaiter(void 0, void 0, void 0, function* () { }),
    postReleaseFinish: (version) => __awaiter(void 0, void 0, void 0, function* () { }),
    preReleaseAdd: (version) => __awaiter(void 0, void 0, void 0, function* () { }),
    postReleaseAdd: (version) => __awaiter(void 0, void 0, void 0, function* () { }),
    prePreviewStart: (preview) => __awaiter(void 0, void 0, void 0, function* () { }),
    postPreviewStart: (preview) => __awaiter(void 0, void 0, void 0, function* () { }),
    prePreviewAdd: (preview) => __awaiter(void 0, void 0, void 0, function* () { }),
    postPreviewAdd: (preview) => __awaiter(void 0, void 0, void 0, function* () { }),
};
const compileCommonJs = (hookPath) => {
    try {
        return vm.compileFunction(fs.readFileSync(hookPath, 'utf8'), ['module', 'exports', 'require', '__filename', '__dirname'], { filename: hookPath });
    }
    catch (_a) {
        return undefined;
    }
};
const loadCustomHooks = (hookPath) => __awaiter(void 0, void 0, void 0, function* () {
    const evaluate = compileCommonJs(hookPath);
    if (!evaluate) {
        const esModule = yield import(pathToFileURL(hookPath).href);
        return esModule.default;
    }
    const hookModule = { exports: {} };
    evaluate(hookModule, hookModule.exports, createRequire(hookPath), hookPath, path.dirname(hookPath));
    return hookModule.exports;
});
const loadedHooks = new Map();
const loadHooks = (hookPath) => __awaiter(void 0, void 0, void 0, function* () {
    return Object.assign(Object.assign({}, defaultHooks), (yield loadCustomHooks(hookPath)));
});
export const getHooks = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const regitDir = yield getRegitDirectory();
    const possibleHookPath = [
        `${regitDir}/hooks.js`,
        `${regitDir}/hooks.cjs`,
        `${regitDir}/hooks.mjs`,
    ];
    const hookPath = possibleHookPath.find((path) => {
        return fs.existsSync(path);
    });
    if (!hookPath) {
        return defaultHooks;
    }
    const hooks = (_a = loadedHooks.get(hookPath)) !== null && _a !== void 0 ? _a : loadHooks(hookPath);
    loadedHooks.set(hookPath, hooks);
    return hooks;
});
