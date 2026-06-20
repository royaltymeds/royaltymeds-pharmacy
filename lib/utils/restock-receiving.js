/**
 * @typedef {Object} RestockReceiveQuantityInput
 * @property {number} quantityOrdered
 * @property {number} previouslyReceived
 * @property {number} remainingQuantity
 * @property {number} quantityReceived
 * @property {boolean} received
 */

/**
 * Calculates the cumulative quantity received for a purchase order line.
 *
 * Closing a PO is workflow closure only; it must not imply all outstanding
 * quantities were received. The received total is always the previous total
 * plus the pharmacist-entered pass quantity, clamped to the ordered quantity.
 *
 * @param {RestockReceiveQuantityInput} item
 * @returns {number}
 */
export function calculateCumulativeReceivedQuantity(item) {
  const safeQuantityOrdered = Math.max(0, Number.isFinite(item.quantityOrdered) ? item.quantityOrdered : 0);
  const safePreviouslyReceived = Math.min(
    safeQuantityOrdered,
    Math.max(0, Number.isFinite(item.previouslyReceived) ? item.previouslyReceived : 0)
  );
  const safeRemainingQuantity = Math.max(0, Number.isFinite(item.remainingQuantity) ? item.remainingQuantity : 0);
  const enteredPassQuantity = item.received && Number.isFinite(item.quantityReceived) ? item.quantityReceived : 0;
  const safePassQuantity = Math.min(safeRemainingQuantity, Math.max(0, enteredPassQuantity));

  return Math.min(safeQuantityOrdered, safePreviouslyReceived + safePassQuantity);
}
