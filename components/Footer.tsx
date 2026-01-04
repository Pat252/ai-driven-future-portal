import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-gray-900 dark:bg-gray-900 border-t border-gray-800 py-6">
      <div className="center-container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p>© 2026 AI Driven Future. All rights reserved.</p>
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




