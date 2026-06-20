/**
 * Generate restock workflow identifiers from the Eastern Time submission date and time.
 * Format: PREFIX-DDDMMMDD-HHMMSS-SSS
 * Example: RR-TUEJAN12-103055-042
 */
export function generateRestockWorkflowNumber(prefix: 'RR' | 'PO', date: Date = new Date()): string {
  const fixedEstDate = new Date(date.getTime() - (5 * 60 * 60 * 1000));
  const dayOfWeek = fixedEstDate.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).toUpperCase();
  const month = fixedEstDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  const dayOfMonth = String(fixedEstDate.getUTCDate()).padStart(2, '0');
  const hours = String(fixedEstDate.getUTCHours()).padStart(2, '0');
  const minutes = String(fixedEstDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(fixedEstDate.getUTCSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

  return `${prefix}-${dayOfWeek}${month}${dayOfMonth}-${hours}${minutes}${seconds}-${milliseconds}`;
}
