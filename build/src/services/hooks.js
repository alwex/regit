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
const defaultHooks = {
    getFeatureName: (id) => __awaiter(void 0, void 0, void 0, function* () {
        // const api = `https://random-word-api.vercel.app/api?words=4`
        // const result = await axios.get(api)
        // return result.data.toString().replaceAll(',', '-')
        return '';
    }),
    preFeatureStart: (id) => __awaiter(void 0, void 0, void 0, function* () { }),
    postFeatureStart: (id) => __awaiter(void 0, void 0, void 0, function* () { }),
    preReleaseStart: (version) => __awaiter(void 0, void 0, void 0, function* () { }),
    postReleaseStart: (version) => __awaiter(void 0, void 0, void 0, function* () { }),
    preReleaseFinish: (version) => __awaiter(void 0, void 0, void 0, function* () { }),
    postReleaseFinish: (version) => __awaiter(void 0, void 0, void 0, function* () { }),
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
export const getHooks = () => __awaiter(void 0, void 0, void 0, function* () {
    const regitDir = yield getRegitDirectory();
    const possibleHookPath = [
        `${regitDir}/hooks.js`,
        `${regitDir}/hooks.cjs`,
        `${regitDir}/hooks.mjs`,
    ];
    const hookPath = possibleHookPath.find((path) => fs.existsSync(path));
    if (hookPath) {
        return Object.assign(Object.assign({}, defaultHooks), (yield loadCustomHooks(hookPath)));
    }
    return defaultHooks;
});
