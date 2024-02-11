var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { branchPreview } from '../../const.js';
import { assertCurrentBranchIsClean, mergeBranch, pushBranch, } from '../../services/gitHelpers.js';
import { assertPreviewExists, promptSelectSinglePreview, } from '../../services/previewHelpers.js';
import { promptSelectNextVersion, startRelease, } from '../../services/releaseHelpers.js';
import { logger } from '../../services/logger.js';
const releasePreviewWithName = (name) => __awaiter(void 0, void 0, void 0, function* () {
    assertPreviewExists(name);
    const previewBranchName = `${branchPreview}${name}`;
    const versionToUse = yield promptSelectNextVersion('What version do you want to release?');
    const { name: releaseBranchName } = yield startRelease(versionToUse);
    yield mergeBranch(previewBranchName);
    logger.success(`Preview ${previewBranchName} merged into ${releaseBranchName}`);
    yield pushBranch(releaseBranchName);
});
const releasePreviewWithPrompt = () => __awaiter(void 0, void 0, void 0, function* () {
    const selectedPreview = yield promptSelectSinglePreview('Select preview to release');
    const previewName = selectedPreview.replace(branchPreview, '');
    yield releasePreviewWithName(previewName);
});
const action = (name) => __awaiter(void 0, void 0, void 0, function* () {
    yield assertCurrentBranchIsClean();
    if (name) {
        yield releasePreviewWithName(name);
    }
    else {
        yield releasePreviewWithPrompt();
    }
});
export default (program) => {
    program
        .command('release')
        .argument('[name]', 'Name')
        .description('Create a release branch from a preview branch')
        .action(action);
};
