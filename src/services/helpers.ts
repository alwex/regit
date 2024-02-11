import { getProjectRootDirectory } from './gitHelpers.js'

export const getRegitDirectory = async () => {
    const rootDir = await getProjectRootDirectory()
    const regitFolder = `${rootDir}/.regit`

    return regitFolder
}
