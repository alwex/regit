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
import { hooksTemplate } from '../templates/hooks.js';
export const initializeRegitFiles = () => __awaiter(void 0, void 0, void 0, function* () {
    const regitFolder = yield getRegitDirectory();
    const hookFile = `${regitFolder}/hooks.js`;
    const hasRegitDirectory = fs.existsSync(regitFolder);
    if (!hasRegitDirectory) {
        fs.mkdirSync(regitFolder);
    }
    fs.writeFileSync(hookFile, hooksTemplate.trimStart());
});
