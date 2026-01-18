/**
 * Generate prescription number based on current date and time
 * Format: DDDMMMDD-HHMMSS
 * Example: MONJAN12-103055 (Monday, January 12, 10:30:55)
 */
export function generatePrescriptionNumber(date: Date = new Date()): string {
  // Day of week (Mon, Tue, Wed, etc.)
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeek = daysOfWeek[date.getDay()].toUpperCase();

  // Month (Jan, Feb, Mar, etc.)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()].toUpperCase();

  // Date (01-31)
  const dayOfMonth = String(date.getDate()).padStart(2, "0");

  // Time in 24-hour format (HH:MM:SS)
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${dayOfWeek}${month}${dayOfMonth}-${hours}${minutes}${seconds}`;
}
