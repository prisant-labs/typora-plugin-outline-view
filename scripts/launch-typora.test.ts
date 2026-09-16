import { describe, expect, it, vi } from 'vitest'

import {
  assertTyporaClosed,
  findTyporaExecutable,
  launchTypora,
} from './launch-typora.js'

describe('assertTyporaClosed', () => {
  it('stops a development launch when Windows Typora is already running', async () => {
    await expect(
      assertTyporaClosed({
        platform: 'win32',
        listProcesses: async () =>
          '"Typora.exe","69416","Console","1","120,000 K"',
      }),
    ).rejects.toThrow('Close every Typora window')
  })

  it('allows a development launch when Windows Typora is closed', async () => {
    await expect(
      assertTyporaClosed({
        platform: 'win32',
        listProcesses: async () => 'INFO: No tasks are running',
      }),
    ).resolves.toBeUndefined()
  })

  it('does not run a Windows process check on other platforms', async () => {
    const listProcesses = vi.fn()

    await assertTyporaClosed({ platform: 'darwin', listProcesses })

    expect(listProcesses).not.toHaveBeenCalled()
  })
})

describe('findTyporaExecutable', () => {
  it('finds the standard Windows Program Files installation', async () => {
    const access = vi.fn(async (candidate: string) => {
      if (candidate !== 'C:\\Program Files\\Typora\\Typora.exe') {
        throw new Error('missing')
      }
    })

    await expect(
      findTyporaExecutable({
        platform: 'win32',
        env: {
          ProgramFiles: 'C:\\Program Files',
          LOCALAPPDATA: 'C:\\Users\\test\\AppData\\Local',
        },
        access,
      }),
    ).resolves.toBe('C:\\Program Files\\Typora\\Typora.exe')
  })

  it('prefers an explicit TYPORA_PATH', async () => {
    const access = vi.fn(async () => undefined)

    await expect(
      findTyporaExecutable({
        platform: 'win32',
        env: { TYPORA_PATH: 'D:\\Apps\\Typora.exe' },
        access,
      }),
    ).resolves.toBe('D:\\Apps\\Typora.exe')
    expect(access).toHaveBeenCalledOnce()
  })

  it('reports how to configure a missing Windows installation', async () => {
    const access = vi.fn(async () => {
      throw new Error('missing')
    })

    await expect(
      findTyporaExecutable({ platform: 'win32', env: {}, access }),
    ).rejects.toThrow('Set TYPORA_PATH')
  })
})

describe('launchTypora', () => {
  it('starts a detached visible process with the absolute document path', async () => {
    const unref = vi.fn()
    const spawn = vi.fn(() => ({ unref }))
    const access = vi.fn(async () => undefined)

    await launchTypora('./test/vault/doc.md', {
      platform: 'win32',
      env: { TYPORA_PATH: 'D:\\Apps\\Typora.exe' },
      access,
      spawn,
      resolvePath: () => 'E:\\repo\\test\\vault\\doc.md',
    })

    expect(spawn).toHaveBeenCalledWith(
      'D:\\Apps\\Typora.exe',
      ['E:\\repo\\test\\vault\\doc.md'],
      {
        detached: true,
        stdio: 'ignore',
        windowsHide: false,
      },
    )
    expect(unref).toHaveBeenCalledOnce()
  })
})
