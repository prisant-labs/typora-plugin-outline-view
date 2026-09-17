import fs from 'node:fs'
import { copyFile } from 'node:fs/promises'
import archiver from 'archiver'
import { releaseFiles } from './scripts/release.mjs'

const output = fs.createWriteStream('plugin.zip')
const archive = archiver('zip', { zlib: { level: 9 } })
const completed = new Promise((resolve, reject) => {
  output.on('close', resolve)
  output.on('error', reject)
  archive.on('error', reject)
})

archive.pipe(output)
for (const name of releaseFiles) {
  // Read before archiving so a missing required file is a hard failure.
  archive.append(fs.readFileSync('dist/' + name), { name })
}
await archive.finalize()
await completed
await copyFile('plugin.zip', 'plugin_typora-outline-view.zip')
