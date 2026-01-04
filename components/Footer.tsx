import Link from 'next/link';

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
          <Link 
            href="/privacy" 
            className="hover:text-blue-400 underline transition-colors"
          >
            Privacy & Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}




