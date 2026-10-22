const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2025-03" → "Mar 2025"; anything else (e.g. "June 2025") is shown as written. */
export function formatDate(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  if (!match) return value
  const month = MONTHS[Number(match[2]) - 1]
  return month ? `${month} ${match[1]}` : value
}

/** "2022" + "Present" → "2022 – Present" */
export const formatYears = (start: string, end: string) => (start === end ? start : `${start} – ${end}`)
