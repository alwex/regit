import { Command } from 'commander'
import { listBranchStargingWith } from '../../services/gitHelpers.js'
import { branchFeature } from '../../const.js'
import chalk from 'chalk'

// Feature: origin/feature-santiago (from v3.7.1) undefined
// /!\ Tags not merged into this branch: at least 'v4.3.6' to 'v4.3.8'.
// commit 739c9a20259e319111977f3aed1b91bf59d84888
// Author: Alexandre Guidet <a.guidet@we-are-mea.com>
// Date:   Tue Jul 26 10:09:39 2022 +1200

const action = async () => {
    const branches = await listBranchStargingWith(branchFeature)
    branches.forEach((data) => {
        const { from, name, show } = data
        console.log(
            chalk.bold(
                `Feature: origin/${name} ${chalk.dim(
                    `(from ${from})`
                )} ${chalk.blue('Title from remote server')}`
            )
        )
        show.forEach((showLine) => {
            console.log(showLine)
        })
        // new line
        console.log('')
    })
}

export default (program: Command) => {
    program.command('list').action(action)
}
