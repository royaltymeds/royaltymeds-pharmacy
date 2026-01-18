// Quick test of prescription number generation
import { generatePrescriptionNumber } from './lib/prescription-number';

// Test with a known date: Monday, January 12, 2025, 10:30:55
const testDate = new Date(2025, 0, 12, 10, 30, 55); // Month is 0-indexed, so 0 = January
const result = generatePrescriptionNumber(testDate);

console.log('Test Case:');
console.log('Date: January 12, 2025, 10:30:55 (Monday)');
console.log('Generated: ' + result);
console.log('Expected format: MONJAN12-103055');
console.log('Match: ' + (result === 'MONJAN12-103055' ? '✓ PASS' : '✗ FAIL'));

// Test with current date
const now = generatePrescriptionNumber();
console.log('\nCurrent prescription number:', now);
