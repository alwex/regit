var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { assertCurrentBranchIsClean, getOpenReleaseBranch, startOrCheckoutBranch, } from '../../services/gitHelpers.js';
import { logger } from '../../services/logger.js';
import { promptSelectNextVersionWithConfirmation, startRelease, validateVersion, } from '../../services/releaseHelpers.js';
const action = (version) => __awaiter(void 0, void 0, void 0, function* () {
    yield assertCurrentBranchIsClean();
    const openRelease = yield getOpenReleaseBranch();
    if (openRelease) {
        yield startOrCheckoutBranch(openRelease.name);
        logger.warn(`Release already exists ${openRelease.name}`);
    }
    else {
        let versionToUse = version;
        if (version) {
            yield validateVersion(version);
            versionToUse = version;
        }
        else {
            versionToUse = yield promptSelectNextVersionWithConfirmation();
        }
        yield startRelease(versionToUse);
    }
});
export default (program) => {
    program.command('start').argument('[version]', 'Version').action(action);
};
