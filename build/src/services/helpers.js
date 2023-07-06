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
import { getHooks } from './hooks.js';
export const getRemoteFeatureName = (branch) => __awaiter(void 0, void 0, void 0, function* () {
    const hooks = yield getHooks();
    const name = yield hooks.getFeatureName(branch);
    return name;
});
export const displayFeatureBranch = (branch) => __awaiter(void 0, void 0, void 0, function* () {
    const { from, name, show } = branch;
    const remoteName = yield getRemoteFeatureName(name);
    console.log(chalk.bold(`Feature: origin/${name} ${chalk.dim(`(from ${from})`)} ${chalk.blue(remoteName)}`));
    show.forEach((showLine) => {
        console.log(showLine);
    });
    // new line
    console.log('');
});
export const displaySubFeatureBranch = (branch) => __awaiter(void 0, void 0, void 0, function* () {
    const { from, name, show } = branch;
    const remoteName = yield getRemoteFeatureName(name);
    console.log(chalk.bold(`    - origin/${branch.name} ${branch.upToDate
        ? chalk.green('[merged]')
        : chalk.yellow('[in progress]')} ${chalk.blue(remoteName)}`));
});
export const displayTagFeatureBranch = (name) => __awaiter(void 0, void 0, void 0, function* () {
    const remoteName = yield getRemoteFeatureName(name);
    console.log(chalk.bold(`    - ${name} ${chalk.blue(remoteName)}`));
});
export const displayReleaseHeader = (releaseHeader, releaseBranch) => {
    const { author, date } = releaseHeader;
    const { name, from } = releaseBranch;
    console.log(`${chalk.bold(`Release: origin/${name}`)} (from ${from})`);
    console.log(`Author: ${author}`);
    console.log(`Date: ${date}`);
    console.log(chalk.bold(`Included features:`));
};
export const displayTagHeader = (tagHeader) => {
    const { tag, author, date } = tagHeader;
    console.log(chalk.bold(`Tag: ${tag}`));
    console.log(`Tagger: ${author}`);
    console.log(`Date: ${date}`);
    console.log(`Included features:`);
};
