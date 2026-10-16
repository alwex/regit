import { readFileSync, writeFileSync } from 'fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'))

writeFileSync('./src/version.ts', `export default '${version}'\n`)
