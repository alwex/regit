var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { branchFeature } from '../../const.js';
import { getLatestTags, getTagDetails, listBranchesBetweenTags, warmupGitRepo, } from '../../services/gitHelpers.js';
import { displayTagFeatureBranch, displayTagHeader, } from '../../services/tagHelpers.js';
const action = (options) => __awaiter(void 0, void 0, void 0, function* () {
    yield warmupGitRepo();
    const { number } = options;
    const tags = yield getLatestTags(Number(number) + 1);
    if (tags.length === 0) {
        throw new Error('No tags found');
    }
    for (let i = 1; i < tags.length; i += 1) {
        const tag1 = tags[i - 1];
        const tag2 = tags[i];
        const tagDetails = yield getTagDetails(tag2);
        const result = yield listBranchesBetweenTags(tag1, tag2);
        const branches = result.filter((name) => name.startsWith(branchFeature));
        displayTagHeader(tagDetails);
        for (const branch of branches) {
            yield displayTagFeatureBranch(branch);
        }
        console.log('');
    }
});
export default (program) => {
    program
        .command('list')
        .option('-n, --number <number>', 'Number of tags to list', '5')
        .action(action);
};
