import { Command } from 'commander'
import { branchFeature } from '../../const.js'
import {
    getLatestTags,
    getTagDetails,
    listBranchesBetweenTags,
} from '../../services/gitHelpers.js'
import {
    displayTagFeatureBranch,
    displayTagHeader,
} from '../../services/helpers.js'

// git log --no-merges --pretty='oneline' --abbrev-commit 1.1.0..1.2.0

// Tag: v0.53.0
// Tagger: Alexandre Guidet <a.guidet@we-are-mea.com>
// Date:   Wed May 3 10:16:06 2023 +1200
// Included features:
//     - origin/feature-126-matt undefined
//     - origin/feature-125 School admin can be assigned to a classroom and access learning portal - 3SP

const action = async () => {
    const tags = await getLatestTags(5)
    if (tags.length === 0) {
        throw new Error('No tags found')
    }

    for (let i = 1; i < tags.length; i += 1) {
        const tag1 = tags[i - 1]
        const tag2 = tags[i]

        const tagDetails = await getTagDetails(tag2)
        const result = await listBranchesBetweenTags(tag1, tag2)
        const branches = result.filter((name) => name.startsWith(branchFeature))

        displayTagHeader(tagDetails)

        for (const branch of branches) {
            await displayTagFeatureBranch(branch)
        }
        console.log('')
    }
}

export default (program: Command) => {
    program.command('list').action(action)
}
