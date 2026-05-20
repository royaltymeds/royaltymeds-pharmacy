import { useState, useCallback } from 'react';

/**
 * Hook for handling decimal number inputs in controlled React components.
 * 
 * THE PROBLEM: When using type="number" with controlled inputs that store numeric state,
 * intermediate valid typing states like "." or "5." get collapsed back to their numeric equivalents,
 * making decimals appear "rejected" while typing.
 * 
 * THE SOLUTION: Keep the display value as a STRING during editing, and only convert to
 * a number when needed for persistence/calculation. This preserves all intermediate typing states.
 * 
 * @param initialValue - The initial numeric value
 * @param onSave - Callback fired when a valid number is ready (blur or programmatic save)
 * @param precision - Number of decimal places to allow (optional)
 * @returns Object with displayValue, handleChange, handleBlur, setDisplayValue, and getValue
 * 
 * USAGE:
 * const { displayValue, handleChange, handleBlur, getValue } = useDecimalInput(5.50, (val) => {
 *   setFormData({...formData, price: val})
 * })
 * 
 * return <input
 *   type="text"
 *   inputMode="decimal"
 *   value={displayValue}
 *   onChange={handleChange}
 *   onBlur={handleBlur}
 * />
 */
export function useDecimalInput(
  initialValue: number | string = '',
  onSave?: (value: number) => void,
  precision?: number
) {
  // Display value is always a string to preserve typing (e.g., "5." or "5.1")
  const [displayValue, setDisplayValue] = useState<string>(
    initialValue === '' || initialValue === null || initialValue === undefined
      ? ''
      : String(initialValue)
  );

  // Validate that a string is a valid decimal pattern
  const isValidDecimalPattern = useCallback((value: string): boolean => {
    // Empty is valid (user might be clearing)
    if (value === '') return true;
    
    // Allow: "0", "5", "5.", "5.5", ".5", "-5", "-5.5", "-.5"
    const decimalPattern = /^-?(\d+\.?\d*|\.\d+)$/;
    return decimalPattern.test(value);
  }, []);

  // Parse and validate the decimal value
  const parseValue = useCallback((value: string): number | null => {
    if (value === '' || value === '-') return null;
    
    if (!isValidDecimalPattern(value)) return null;
    
    const num = parseFloat(value);
    if (Number.isNaN(num)) return null;
    
    // Apply precision if specified (round to N decimal places)
    if (precision !== undefined && precision >= 0) {
      const multiplier = Math.pow(10, precision);
      return Math.round(num * multiplier) / multiplier;
    }
    
    return num;
  }, [isValidDecimalPattern, precision]);

  // Handle change - keep raw string value to preserve typing experience
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Allow the raw input if it matches decimal pattern (includes intermediate states like "5.")
    if (isValidDecimalPattern(newValue)) {
      setDisplayValue(newValue);
    }
  }, [isValidDecimalPattern]);

  // Handle blur - save the value if valid
  const handleBlur = useCallback(() => {
    const parsedValue = parseValue(displayValue);
    
    if (parsedValue !== null) {
      // Valid number - round display to match precision
      const displayRounded = precision !== undefined 
        ? parsedValue.toFixed(precision).replace(/\.?0+$/, '') 
        : String(parsedValue);
      setDisplayValue(displayRounded);
      onSave?.(parsedValue);
    } else if (displayValue !== '') {
      // Invalid input - revert to empty or previous value
      setDisplayValue('');
      onSave?.(0);
    }
  }, [displayValue, parseValue, precision, onSave]);

  // Programmatic value getter
  const getValue = useCallback((): number | null => {
    return parseValue(displayValue);
  }, [displayValue, parseValue]);

  // Programmatic setter (useful for form resets or external updates)
  const setValue = useCallback((value: number | string) => {
    if (value === '' || value === null || value === undefined) {
      setDisplayValue('');
    } else {
      setDisplayValue(String(value));
    }
  }, []);

  return {
    displayValue,
    setDisplayValue: setValue,
    handleChange,
    handleBlur,
    getValue,
  };
}
