export type ReportLine = { label: string; value: string }

export function withTimeout<T>(promise: Promise<T>, ms: number, message = 'timed out'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

export function formatReport(lines: ReportLine[]): string {
  return lines.map((line) => `${line.label}: ${line.value}`).join('\n')
}

export function describeError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`
  return 'unknown error'
}