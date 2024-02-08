import fs from 'fs'
import { getRegitDirectory } from './helpers.js'
import { hooksTemplate } from '../templates/hooks.js'

export const initializeRegitFiles = async () => {
    const regitFolder = await getRegitDirectory()
    const hookFile = `${regitFolder}/hooks.js`

    const hasRegitDirectory = fs.existsSync(regitFolder)
    if (!hasRegitDirectory) {
        fs.mkdirSync(regitFolder)
    }

    fs.writeFileSync(hookFile, hooksTemplate.trimStart())
}
