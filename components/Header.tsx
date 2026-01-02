'use client';

import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="w-full border-b border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-xl sticky top-0 z-50 transition-colors">
      <div className="h-16 flex items-center justify-between center-container">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900 dark:text-[#EDEDED]">
            AI Driven Future
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#" className="text-sm text-gray-700 dark:text-[#EDEDED] hover:text-[#0070F3] transition-colors">
              Breaking AI
            </Link>
            <Link href="#" className="text-sm text-gray-700 dark:text-[#EDEDED] hover:text-[#0070F3] transition-colors">
              Economy
            </Link>
            <Link href="#" className="text-sm text-gray-700 dark:text-[#EDEDED] hover:text-[#0070F3] transition-colors">
              Creative Tech
            </Link>
            <Link href="#" className="text-sm text-gray-700 dark:text-[#EDEDED] hover:text-[#0070F3] transition-colors">
              Toolbox
            </Link>
          </nav>

          {/* Theme Toggle + CTA Button */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button className="bg-[#0070F3] hover:bg-[#0070F3]/90 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors">
              Get Deep Intent
            </button>
          </div>
      </div>
    </header>
  );
}

