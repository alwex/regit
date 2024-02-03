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
export const getHooks = () => __awaiter(void 0, void 0, void 0, function* () {
    const regitDir = yield getRegitDirectory();
    const hasCustomHooks = fs.existsSync(`${regitDir}/hooks.js`);
    if (hasCustomHooks) {
        const customHooks = yield import(`${regitDir}/hooks.js`);
        return Object.assign(Object.assign({}, defaultHooks), customHooks.default);
    }
    return defaultHooks;
});
