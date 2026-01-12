import Link from 'next/link';
import { Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-gray-900 dark:bg-gray-900 border-t border-gray-800 py-6">
      <div className="center-container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex flex-col items-center sm:items-start gap-2">
            <p>© 2026 AI Driven Future. All rights reserved.</p>
            <p className="text-[10px] text-gray-500/60 max-w-2xl text-center sm:text-left">
              Curated for news reporting purposes under Section 29.2 of the Canadian Copyright Act and Section 107 of the U.S. Copyright Act.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/privacy" 
              className="hover:text-blue-400 underline transition-colors"
            >
              Privacy & Terms
            </Link>
            <a
              href="https://www.linkedin.com/company/110440119/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow AI Driven Future on LinkedIn"
              className="w-10 h-10 rounded-full bg-white/5 border border-gray-800 flex items-center justify-center hover:bg-white/10 hover:border-[#0070F3]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0070F3] focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <Linkedin className="w-5 h-5 text-gray-400 hover:text-[#0070F3] transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}




