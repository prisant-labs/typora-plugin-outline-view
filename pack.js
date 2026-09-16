import fs from 'node:fs'
import { copyFile } from 'node:fs/promises'
import archiver from 'archiver'

const output = fs.createWriteStream('plugin.zip')
const archive = archiver('zip', { zlib: { level: 9 } })
const completed = new Promise((resolve, reject) => {
  output.on('close', resolve)
  output.on('error', reject)
  archive.on('error', reject)
})

archive.pipe(output)
archive.glob('**/*', { cwd: 'dist' })
await archive.finalize()
await completed
await copyFile('plugin.zip', 'plugin_typora-outline-view.zip')
