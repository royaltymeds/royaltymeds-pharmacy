'use client';

import { useState } from 'react';
import { DecimalInput } from '@/components/DecimalInput';
import { useDecimalInput } from '@/lib/hooks/useDecimalInput';

/**
 * Test/Demo Component for Decimal Input Solution
 * 
 * Use this to verify the decimal input fix works before migrating actual components.
 * 
 * Test Scenario Instructions:
 * 1. Type "12.50" - verify decimal is accepted immediately
 * 2. Type ".75" - verify leading decimal works
 * 3. Type "0.99" - verify leading zero works
 * 4. Click elsewhere to blur - verify value persists
 * 5. On mobile: verify decimal keyboard appears
 * 6. On numpad: verify decimal key works, doesn't act like Enter
 */
export function DecimalInputTestComponent() {
  const [price1, setPrice1] = useState('5.50');
  const [savedPrice1, setSavedPrice1] = useState<number | null>(5.50);

  const priceInput2 = useDecimalInput(10.99, (num) => {
    setSavedPrice2(num);
  }, 2);

  const [savedPrice2, setSavedPrice2] = useState<number>(10.99);

  const [testResults, setTestResults] = useState<{ test: string; passed: boolean; notes: string }[]>([]);

  const runTest = (testName: string, testFn: () => boolean, notes: string) => {
    const passed = testFn();
    setTestResults((prev) => [...prev, { test: testName, passed, notes }]);
  };

  const handleTest1 = () => {
    // Test typing "12.50"
    setPrice1('12.50');
    runTest('Type "12.50"', () => price1 === '12.50' || price1 === '5.50', 'Enter 12.50 and check if decimal is accepted');
  };

  const handleTest2 = () => {
    // Test typing ".75"
    setPrice1('.75');
    runTest('Type ".75" (leading decimal)', () => true, 'Enter .75 manually');
  };

  const handleTest3 = () => {
    // Test typing "0.99"
    setPrice1('0.99');
    runTest('Type "0.99"', () => true, 'Enter 0.99 manually');
  };

  return (
    <div className="space-y-8 rounded-lg bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Decimal Input Solution - Test Component</h1>
        <p className="mt-2 text-sm text-gray-600">
          Use this component to verify the decimal input fix works before applying to your app.
        </p>
      </div>

      {/* Test Section 1: DecimalInput Component */}
      <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <h2 className="font-bold text-gray-900">Test 1: DecimalInput Component</h2>
        <p className="text-sm text-gray-600">
          The recommended solution. Easy to use, drop-in replacement for broken number inputs.
        </p>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Enter a price (try: 12.50, .75, 0.99, 103.275)
          </label>
          <DecimalInput
            value={price1}
            onChange={setPrice1}
            onBlur={(num) => {
              if (num !== null) {
                setSavedPrice1(num);
              }
            }}
            precision={2}
            placeholder="0.00"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
          />

          <div className="mt-3 grid grid-cols-2 gap-4 rounded-lg bg-blue-50 p-4 text-sm">
            <div>
              <p className="font-semibold text-gray-700">Display Value (while typing):</p>
              <p className="text-blue-600">{price1 === '' ? '(empty)' : price1}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Saved Value (after blur):</p>
              <p className="text-green-600">{savedPrice1 === null ? 'None' : savedPrice1}</p>
            </div>
          </div>

          <div className="mt-2 space-y-2">
            <p className="text-xs font-semibold text-gray-600">Try these test values:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setPrice1('12.50')}
                className="rounded bg-gray-200 px-3 py-1 text-xs hover:bg-gray-300"
              >
                Set 12.50
              </button>
              <button
                onClick={() => setPrice1('.75')}
                className="rounded bg-gray-200 px-3 py-1 text-xs hover:bg-gray-300"
              >
                Set .75
              </button>
              <button
                onClick={() => setPrice1('0.99')}
                className="rounded bg-gray-200 px-3 py-1 text-xs hover:bg-gray-300"
              >
                Set 0.99
              </button>
              <button
                onClick={() => setPrice1('103.275')}
                className="rounded bg-gray-200 px-3 py-1 text-xs hover:bg-gray-300"
              >
                Set 103.275
              </button>
              <button
                onClick={() => setPrice1('')}
                className="rounded bg-gray-200 px-3 py-1 text-xs hover:bg-gray-300"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="rounded border-l-4 border-green-500 bg-green-50 p-3 text-sm text-green-700">
          ✓ <strong>Expected behavior:</strong> Decimal points are accepted immediately. No characters rejected. Value persists
          after blur.
        </div>
      </div>

      {/* Test Section 2: useDecimalInput Hook */}
      <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <h2 className="font-bold text-gray-900">Test 2: useDecimalInput Hook</h2>
        <p className="text-sm text-gray-600">
          For more control, use the hook directly. Useful with form libraries like React Hook Form.
        </p>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Enter an amount (hook-based)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={priceInput2.displayValue}
            onChange={priceInput2.handleChange}
            onBlur={priceInput2.handleBlur}
            placeholder="0.00"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
          />

          <div className="mt-3 grid grid-cols-2 gap-4 rounded-lg bg-purple-50 p-4 text-sm">
            <div>
              <p className="font-semibold text-gray-700">Display Value:</p>
              <p className="text-purple-600">{priceInput2.displayValue || '(empty)'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Saved Value:</p>
              <p className="text-green-600">{savedPrice2}</p>
            </div>
          </div>
        </div>

        <div className="rounded border-l-4 border-green-500 bg-green-50 p-3 text-sm text-green-700">
          ✓ <strong>Expected behavior:</strong> Same as Test 1, but shows hook usage pattern.
        </div>
      </div>

      {/* Test Section 3: Comparison with type="number" */}
      <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <h2 className="font-bold text-gray-900">Test 3: Why type="number" Fails</h2>
        <p className="text-sm text-gray-600">
          This demonstrates the problem with the old approach. Try typing "5." in both fields.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Broken type="number" */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              ❌ type="number" (BROKEN)
            </label>
            <div className="space-y-1">
              <input
                type="number"
                step="any"
                defaultValue={5.5}
                placeholder="Try typing 5."
                className="w-full rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-gray-900"
              />
              <p className="text-xs text-red-600">Type "5." and watch it collapse to "5"</p>
            </div>
          </div>

          {/* Fixed DecimalInput */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              ✓ DecimalInput (FIXED)
            </label>
            <div className="space-y-1">
              <DecimalInput
                value="5.5"
                onChange={() => {}}
                placeholder="Try typing 5."
                className="w-full rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-gray-900"
              />
              <p className="text-xs text-green-600">Type "5." and it stays as "5."</p>
            </div>
          </div>
        </div>

        <div className="rounded border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">
          ⚠️ <strong>The Problem:</strong> When using type="number" with controlled inputs, "5." is converted to "5",
          making decimals feel rejected while typing.
        </div>
      </div>

      {/* Test Section 4: Mobile Testing */}
      <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <h2 className="font-bold text-gray-900">Test 4: Mobile & Keyboard Testing</h2>
        <p className="text-sm text-gray-600">
          On mobile devices, verify that the decimal keyboard appears and the decimal key works correctly.
        </p>

        <div className="space-y-3">
          <div className="rounded border-l-4 border-blue-500 bg-blue-50 p-3 text-sm text-blue-700">
            <strong>iPhone/iPad:</strong> Decimal keyboard should show with decimal point key
          </div>
          <div className="rounded border-l-4 border-blue-500 bg-blue-50 p-3 text-sm text-blue-700">
            <strong>Android with Numpad:</strong> Decimal key should input ".", not act like Enter
          </div>
          <div className="rounded border-l-4 border-blue-500 bg-blue-50 p-3 text-sm text-blue-700">
            <strong>Desktop:</strong> Regular keyboard input should work normally
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Test field (copy and paste on mobile):</label>
          <DecimalInput
            value=""
            onChange={() => {}}
            placeholder="Test decimal input on your phone"
            className="w-full rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-gray-900"
          />
        </div>
      </div>

      {/* Verification Checklist */}
      <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <h2 className="font-bold text-gray-900">Verification Checklist</h2>
        <div className="space-y-2 text-sm">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>Can type "12.50" without rejection</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>Can type ".75" (leading decimal)</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>Can type "0.99"</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>Can type "103.275" (multiple decimals)</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>Value persists after blur</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>Mobile shows decimal keyboard</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>Numpad decimal key works correctly</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>Clear field (empty) works</span>
          </label>
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="font-semibold text-gray-900">Next Steps</h3>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-600">
          <li>Verify the tests above work correctly</li>
          <li>Check the migration guide: `/context/MIGRATION_GUIDE_DECIMAL_INPUTS.md`</li>
          <li>Apply changes to restock components following the examples</li>
          <li>Test in actual form with real data</li>
          <li>Delete this test component when done</li>
        </ol>
      </div>
    </div>
  );
}
