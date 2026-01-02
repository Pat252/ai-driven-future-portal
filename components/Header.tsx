'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/category/breaking-ai', label: 'Breaking AI', category: 'breaking-ai' },
    { href: '/category/ai-economy', label: 'Economy', category: 'ai-economy' },
    { href: '/category/creative-tech', label: 'Creative Tech', category: 'creative-tech' },
    { href: '/category/toolbox', label: 'Toolbox', category: 'toolbox' },
  ];

  const isActive = (category: string) => {
    return pathname === `/category/${category}`;
  };

  return (
    <header className="w-full border-b border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-xl sticky top-0 z-50 transition-colors">
      <div className="h-16 flex items-center justify-between center-container">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.jpg"
              alt="AI Driven Future Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-[#EDEDED]">
              AI Driven Future
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.category)
                    ? 'text-[#0070F3]'
                    : 'text-gray-400 hover:text-white dark:hover:text-[#EDEDED]'
                }`}
              >
                {link.label}
              </Link>
            ))}
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

