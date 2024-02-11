var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import chalk from 'chalk';
import { getRemoteFeatureName } from './featureHelpers.js';
export const displayTagFeatureBranch = (name) => __awaiter(void 0, void 0, void 0, function* () {
    const remoteName = yield getRemoteFeatureName(name);
    console.log(chalk.bold(`    - ${name} ${chalk.blue(remoteName)}`));
});
export const displayTagHeader = (tagHeader) => {
    const { tag, author, date } = tagHeader;
    console.log(chalk.bold(`Tag: ${tag}`));
    console.log(`Tagger: ${author}`);
    console.log(`Date: ${date}`);
    console.log(`Included features:`);
};
