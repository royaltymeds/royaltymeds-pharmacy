'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface NavLink {
  href: string;
  label: string;
}

interface DesktopNavProps {
  navLinks: NavLink[];
  theme?: 'dark' | 'light';
}

export function DesktopNav({ navLinks, theme = 'dark' }: DesktopNavProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreButtonRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreButtonRef.current && !moreButtonRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Split navigation links: primary (always shown) and more (shown in dropdown)
  const primaryLinks = navLinks.slice(0, 4); // Dashboard, Prescriptions, Orders, Refills
  const moreLinks = navLinks.slice(4); // Inventory, Doctors, Users, Payments Config

  const navClasses = theme === 'light' 
    ? 'text-gray-700 hover:text-green-600 hover:bg-green-50'
    : 'text-green-100 hover:text-white hover:bg-green-700';
  
  const moreButtonClasses = theme === 'light'
    ? 'text-gray-700 hover:text-green-600 hover:bg-green-50'
    : 'text-green-100 hover:text-white hover:bg-green-700';
  
  const dropdownClasses = theme === 'light'
    ? 'bg-gray-100 text-gray-700 hover:text-green-600 hover:bg-gray-200'
    : 'bg-green-700 text-green-100 hover:text-white hover:bg-green-600';
  
  const dropdownBgClasses = theme === 'light'
    ? 'bg-gray-50'
    : 'bg-green-700';

  return (
    <>
      {/* Primary Navigation Links */}
      <div className="hidden md:flex space-x-1">
        {primaryLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium transition ${navClasses}`}
          >
            {link.label}
          </Link>
        ))}

        {/* More Menu Button */}
        <div className="relative" ref={moreButtonRef}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium transition flex items-center gap-1 ${moreButtonClasses}`}
          >
            More
            <ChevronDown
              size={16}
              className={`transition-transform ${showMoreMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {showMoreMenu && (
            <div className={`absolute right-0 mt-1 w-48 rounded-md shadow-lg py-1 z-50 ${dropdownBgClasses}`}>
              {moreLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-2 text-xs md:text-sm transition ${dropdownClasses}`}
                  onClick={() => setShowMoreMenu(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
