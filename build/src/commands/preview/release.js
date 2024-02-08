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
import { assertCurrentBranchIsClean } from '../../services/gitHelpers.js';
import { promptSelectSinglePreview } from '../../services/previewHelpers.js';
import { promptSelectNextVersion } from '../../services/releaseHelpers.js';
const releasePreviewWithName = (name) => __awaiter(void 0, void 0, void 0, function* () {
    const previewBranchName = `${branchPreview}${name}`;
    const versionToUse = yield promptSelectNextVersion('What version do you want to release?');
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
