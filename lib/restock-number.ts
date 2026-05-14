/**
 * Generate restock workflow identifiers from the Eastern Time submission date and time.
 * Format: PREFIX-DDDMMMDD-HHMMSS-SSS
 * Example: RR-TUEJAN12-103055-042
 */
export function generateRestockWorkflowNumber(prefix: 'RR' | 'PO', date: Date = new Date()): string {
  const easternParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => easternParts.find((item) => item.type === type)?.value || '';

  const dayOfWeek = part('weekday').toUpperCase();
  const month = part('month').toUpperCase();
  const dayOfMonth = part('day').padStart(2, '0');
  const hours = part('hour').padStart(2, '0');
  const minutes = part('minute').padStart(2, '0');
  const seconds = part('second').padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

  return `${prefix}-${dayOfWeek}${month}${dayOfMonth}-${hours}${minutes}${seconds}-${milliseconds}`;
}
