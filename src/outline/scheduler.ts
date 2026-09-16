export interface DebouncedTask {
  schedule(): void
  cancel(): void
}

export function createDebouncedTask(
  callback: () => void,
  delay: number,
): DebouncedTask {
  let timerId: number | undefined

  const cancel = () => {
    if (timerId === undefined) return
    window.clearTimeout(timerId)
    timerId = undefined
  }

  const schedule = () => {
    cancel()
    timerId = window.setTimeout(() => {
      timerId = undefined
      callback()
    }, delay)
  }

  return { schedule, cancel }
}
