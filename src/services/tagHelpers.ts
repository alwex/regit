import chalk from 'chalk'
import { getRemoteFeatureName } from './featureHelpers.js'
import { TagHeaderResult } from './gitHelpers.js'

export const displayTagFeatureBranch = async (name: string) => {
    const remoteName = await getRemoteFeatureName(name)

    console.log(chalk.bold(`    - ${name} ${chalk.blue(remoteName)}`))
}

export const displayTagHeader = (tagHeader: TagHeaderResult) => {
    const { tag, author, date } = tagHeader

    console.log(chalk.bold(`Tag: ${tag}`))
    console.log(`Tagger: ${author}`)
    console.log(`Date: ${date}`)
    console.log(`Included features:`)
}
