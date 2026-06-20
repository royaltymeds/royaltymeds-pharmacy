import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCumulativeReceivedQuantity } from '../restock-receiving.js';

test('preserves a short receipt amount when closing a purchase order', () => {
  assert.equal(calculateCumulativeReceivedQuantity({
    quantityOrdered: 10,
    previouslyReceived: 0,
    remainingQuantity: 10,
    quantityReceived: 4,
    received: true,
  }), 4);
});

test('adds the current pass quantity to a previously received quantity', () => {
  assert.equal(calculateCumulativeReceivedQuantity({
    quantityOrdered: 10,
    previouslyReceived: 3,
    remainingQuantity: 7,
    quantityReceived: 2,
    received: true,
  }), 5);
});

test('does not exceed the ordered quantity', () => {
  assert.equal(calculateCumulativeReceivedQuantity({
    quantityOrdered: 10,
    previouslyReceived: 3,
    remainingQuantity: 7,
    quantityReceived: 99,
    received: true,
  }), 10);
});

test('keeps the previous total when the line is not marked received in this pass', () => {
  assert.equal(calculateCumulativeReceivedQuantity({
    quantityOrdered: 10,
    previouslyReceived: 3,
    remainingQuantity: 7,
    quantityReceived: 7,
    received: false,
  }), 3);
});
