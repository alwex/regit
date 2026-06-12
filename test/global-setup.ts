import { $ } from 'execa'
import path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '..')

export default async function setup() {
    await $('yarn build', { cwd: PROJECT_ROOT, shell: true })
}
