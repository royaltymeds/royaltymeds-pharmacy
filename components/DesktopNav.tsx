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
}

export function DesktopNav({ navLinks }: DesktopNavProps) {
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

  return (
    <>
      {/* Primary Navigation Links */}
      <div className="hidden md:flex space-x-1">
        {primaryLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium text-green-100 hover:text-white hover:bg-green-700 transition"
          >
            {link.label}
          </Link>
        ))}

        {/* More Menu Button */}
        <div className="relative" ref={moreButtonRef}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium text-green-100 hover:text-white hover:bg-green-700 transition flex items-center gap-1"
          >
            More
            <ChevronDown
              size={16}
              className={`transition-transform ${showMoreMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {showMoreMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-green-700 rounded-md shadow-lg py-1 z-50">
              {moreLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-2 text-xs md:text-sm text-green-100 hover:text-white hover:bg-green-600 transition"
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
