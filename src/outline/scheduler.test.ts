import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createDebouncedTask } from './scheduler'

describe('createDebouncedTask', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('coalesces multiple schedules into one callback', () => {
    const callback = vi.fn()
    const task = createDebouncedTask(callback, 150)

    task.schedule()
    task.schedule()
    task.schedule()
    vi.advanceTimersByTime(149)

    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)

    expect(callback).toHaveBeenCalledOnce()
  })

  it('restarts the delay when scheduled again', () => {
    const callback = vi.fn()
    const task = createDebouncedTask(callback, 150)

    task.schedule()
    vi.advanceTimersByTime(100)
    task.schedule()
    vi.advanceTimersByTime(100)

    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)

    expect(callback).toHaveBeenCalledOnce()
  })

  it('cancels pending work', () => {
    const callback = vi.fn()
    const task = createDebouncedTask(callback, 150)

    task.schedule()
    task.cancel()
    vi.runAllTimers()

    expect(callback).not.toHaveBeenCalled()
  })

  it('can be scheduled again after firing', () => {
    const callback = vi.fn()
    const task = createDebouncedTask(callback, 150)

    task.schedule()
    vi.advanceTimersByTime(150)
    task.schedule()
    vi.advanceTimersByTime(150)

    expect(callback).toHaveBeenCalledTimes(2)
  })
})
