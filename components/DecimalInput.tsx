'use client';

import React from 'react';

interface DecimalInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (value: number | null) => void;
  precision?: number;
  allowNegative?: boolean;
}

/**
 * DecimalInput Component
 * 
 * A properly-implemented decimal number input for React that preserves typing experience.
 * 
 * FEATURES:
 * - Accepts intermediate decimal states while typing (e.g., "5.", ".5", "5.1")
 * - Uses browser-native decimal input experience with inputMode="decimal"
 * - No artificial keystroke blocking or value collapsing
 * - Optional precision constraint on blur
 * - Returns null if input is empty or invalid
 * 
 * KEY DIFFERENCE FROM type="number":
 * - type="number" collapses "5." back to 5, making decimals feel rejected
 * - This component keeps the raw string, allowing natural decimal typing
 * 
 * @example
 * const [price, setPrice] = useState('');
 * 
 * return (
 *   <DecimalInput
 *     value={price}
 *     onChange={setPrice}
 *     onBlur={(num) => console.log('Saved:', num)}
 *     placeholder="0.00"
 *     precision={2}
 *   />
 * );
 */
export const DecimalInput = React.forwardRef<HTMLInputElement, DecimalInputProps>(
  ({ value, onChange, onBlur, precision, allowNegative = true, className = '', ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      // Allow empty input
      if (newValue === '') {
        onChange('');
        return;
      }

      // Allow negative sign at start
      if (!allowNegative && newValue.startsWith('-')) {
        return;
      }

      // Pattern allows: digits, single decimal point, and optional leading negative
      // Matches: "5", "5.", "5.5", ".5", "0.5", "-5", "-5.5", "-.5"
      const pattern = allowNegative
        ? /^-?(\d+\.?\d*|\.\d+)$/
        : /^(\d+\.?\d*|\.\d+)$/;

      if (pattern.test(newValue)) {
        onChange(newValue);
      }
      // If pattern doesn't match, silently reject (don't update state)
    };

    const handleBlur = () => {
      if (!onBlur) return;

      const trimmedValue = value.trim();

      if (trimmedValue === '' || trimmedValue === '-') {
        onBlur(null);
        return;
      }

      const parsed = parseFloat(trimmedValue);

      if (Number.isNaN(parsed)) {
        onBlur(null);
        return;
      }

      // Apply precision if specified
      let finalValue = parsed;
      if (precision !== undefined && precision >= 0) {
        const multiplier = Math.pow(10, precision);
        finalValue = Math.round(parsed * multiplier) / multiplier;
      }

      onBlur(finalValue);
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={className}
        {...props}
      />
    );
  }
);

DecimalInput.displayName = 'DecimalInput';
