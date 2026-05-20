'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  placeholder?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  className = '',
  placeholder = 'Select an option',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Ensure dropdown stays visible below button
  useEffect(() => {
    if (isOpen && buttonRef.current && dropdownRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Check if dropdown goes below viewport
      if (buttonRect.bottom + dropdownRect.height > viewportHeight - 20) {
        // Position above instead
        dropdownRef.current.style.top = 'auto';
        dropdownRef.current.style.bottom = '100%';
        dropdownRef.current.style.marginBottom = '0.25rem';
      } else {
        // Position below (default)
        dropdownRef.current.style.bottom = 'auto';
        dropdownRef.current.style.top = '100%';
        dropdownRef.current.style.marginBottom = '0';
      }
    }
  }, [isOpen]);

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-600 w-full sm:w-auto"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg sm:w-auto sm:min-w-64"
          style={{ top: '100%', marginTop: '0.25rem' }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`block w-full border-b border-gray-100 px-4 py-2 text-left text-sm transition ${
                value === option.value
                  ? 'bg-green-50 text-green-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
