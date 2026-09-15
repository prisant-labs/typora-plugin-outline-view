import { spawn as spawnProcess } from 'node:child_process'
import { execFile as execFileProcess } from 'node:child_process'
import { access as accessFile } from 'node:fs/promises'
import path from 'node:path'

function listWindowsProcesses() {
  return new Promise((resolve, reject) => {
    execFileProcess(
      'tasklist',
      ['/FI', 'IMAGENAME eq Typora.exe', '/FO', 'CSV', '/NH'],
      { encoding: 'utf8', windowsHide: true },
      (error, stdout) => {
        if (error) reject(error)
        else resolve(stdout)
      },
    )
  })
}

export async function assertTyporaClosed(options = {}) {
  const platform = options.platform ?? process.platform
  if (platform !== 'win32') return

  const listProcesses = options.listProcesses ?? listWindowsProcesses
  const processes = await listProcesses()
  if (/Typora\.exe/i.test(processes)) {
    throw new Error(
      'Typora is already running. Close every Typora window, then rerun pnpm build:dev so the newly installed plugin is loaded.',
    )
  }
}

export async function findTyporaExecutable(options = {}) {
  const platform = options.platform ?? process.platform
  const env = options.env ?? process.env
  const access = options.access ?? accessFile

  if (platform !== 'win32') {
    return env.TYPORA_PATH || 'Typora'
  }

  const candidates = [
    env.TYPORA_PATH,
    env.ProgramFiles && path.win32.join(env.ProgramFiles, 'Typora', 'Typora.exe'),
    env.LOCALAPPDATA && path.win32.join(
      env.LOCALAPPDATA,
      'Programs',
      'Typora',
      'Typora.exe',
    ),
  ].filter(Boolean)

  for (const candidate of candidates) {
    try {
      await access(candidate)
      return candidate
    }
    catch {
      // Try the next supported installation location.
    }
  }

  throw new Error(
    'Typora executable not found. Set TYPORA_PATH to the full Typora executable path.',
  )
}

export async function launchTypora(documentPath, dependencies = {}) {
  const executable = await findTyporaExecutable(dependencies)
  const resolvePath = dependencies.resolvePath ?? path.resolve
  const spawn = dependencies.spawn ?? spawnProcess
  const child = spawn(executable, [resolvePath(documentPath)], {
    detached: true,
    stdio: 'ignore',
    windowsHide: false,
  })

  child.unref()
}
