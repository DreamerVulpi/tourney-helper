export function formatDuration(durationMs, locale) {
  const totalSeconds = Math.floor(durationMs / 1000)

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes > 0) {
    return `${minutes} ${locale.minute} ${seconds} ${locale.second}`
  }

  return `${seconds} ${locale.second}`
}