/**
 * Generate restock workflow identifiers from the submission date and time.
 * Format: PREFIX-DDDMMMDD-HHMMSS-SSS
 * Example: RR-TUEJAN12-103055-042
 */
export function generateRestockWorkflowNumber(prefix: 'RR' | 'PO', date: Date = new Date()): string {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayOfWeek = daysOfWeek[date.getDay()].toUpperCase();
  const month = months[date.getMonth()].toUpperCase();
  const dayOfMonth = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

  return `${prefix}-${dayOfWeek}${month}${dayOfMonth}-${hours}${minutes}${seconds}-${milliseconds}`;
}
