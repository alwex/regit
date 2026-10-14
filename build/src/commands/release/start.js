var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { branchRelease } from '../../const.js';
import { assertCurrentBranchIsClean, getOpenReleaseBranch, warmupGitRepo, } from '../../services/gitHelpers.js';
import { promptSelectNextVersionWithConfirmation, startRelease, validateVersion, } from '../../services/releaseHelpers.js';
const resolveVersion = (version) => __awaiter(void 0, void 0, void 0, function* () {
    if (!version) {
        return promptSelectNextVersionWithConfirmation();
    }
    yield validateVersion(version);
    return version;
});
const action = (version) => __awaiter(void 0, void 0, void 0, function* () {
    yield warmupGitRepo();
    yield assertCurrentBranchIsClean();
    const openRelease = yield getOpenReleaseBranch();
    if (openRelease) {
        yield startRelease({
            version: openRelease.name.replace(branchRelease, ''),
            trigger: 'release-start',
        });
        return;
    }
    const versionToUse = yield resolveVersion(version);
    yield startRelease({
        version: versionToUse.trim(),
        trigger: 'release-start',
    });
});
export default (program) => {
    program.command('start').argument('[version]', 'Version').action(action);
};
