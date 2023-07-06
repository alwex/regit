var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getProjectRootDirectory } from './gitHelpers.js';
import fs from 'fs';
const defaultHooks = {
    getFeatureName: (id) => __awaiter(void 0, void 0, void 0, function* () {
        // const api = `https://random-word-api.vercel.app/api?words=4`
        // const result = await axios.get(api)
        // return result.data.toString().replaceAll(',', '-')
        return '';
    }),
    preFeatureStart: () => __awaiter(void 0, void 0, void 0, function* () { }),
    postFeatureStart: () => __awaiter(void 0, void 0, void 0, function* () { }),
    preReleaseFinish: () => __awaiter(void 0, void 0, void 0, function* () { }),
    postReleaseFinish: () => __awaiter(void 0, void 0, void 0, function* () { }),
};
export const getHooks = () => __awaiter(void 0, void 0, void 0, function* () {
    const rootDir = yield getProjectRootDirectory();
    const hasCustomHooks = fs.existsSync(`${rootDir}/regit.js`);
    if (hasCustomHooks) {
        const customHooks = yield import(`${rootDir}/regit.js`);
        return Object.assign(Object.assign({}, defaultHooks), customHooks.default);
    }
    return defaultHooks;
});
