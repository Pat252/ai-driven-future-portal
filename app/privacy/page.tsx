import Header from '@/components/Header';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy & Terms of Service - AI Driven Future',
  description: 'Privacy Policy and Terms of Service for AI Driven Future news portal.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-[#EDEDED]">
      <Header />
      
      <main className="w-full py-20">
        <div className="max-w-3xl mx-auto px-6">
          {/* Back Link */}
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-500 hover:text-blue-400 mb-8 transition-colors"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor" 
              className="w-5 h-5 mr-2"
            >
              <path 
                fillRule="evenodd" 
                d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" 
                clipRule="evenodd" 
              />
            </svg>
            Back to Home
          </Link>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-extrabold mb-12 text-gray-900 dark:text-[#EDEDED]">
            Privacy Policy & Terms of Service
          </h1>

          {/* Last Updated */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-12">
            Last Updated: January 2026
          </p>

          {/* Section 1: Newsletter */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-[#EDEDED]">
              Newsletter & Data Collection
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              We respect your inbox. We collect your email address solely to send you our newsletter 
              with curated AI and technology news. We will never sell, rent, or share your data with 
              third parties. You can unsubscribe at any time via the link in every email. Your privacy 
              is paramount, and we are committed to protecting your personal information.
            </p>
          </section>

          {/* Section 2: Content Aggregation */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-[#EDEDED]">
              Content Aggregation & Copyright
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              This website is a news aggregator. Headlines and summaries are sourced from public RSS 
              feeds for informational purposes only. All copyrights, images, and trademarks belong to 
              their respective original publishers. We provide links to the original sources for full 
              articles. If you are a content creator or publisher and wish to have your content removed 
              from our aggregation, please contact us at{' '}
              <a 
                href="mailto:contact@aidrivenfuture.com" 
                className="text-blue-500 hover:text-blue-400 underline"
              >
                contact@aidrivenfuture.com
              </a>
              , and we will promptly honor your request.
            </p>
          </section>

          {/* Section 3: Cookies & Analytics */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-[#EDEDED]">
              Cookies & Analytics
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              We may use cookies and similar tracking technologies to improve your browsing experience 
              and analyze site traffic. These technologies help us understand how visitors interact with 
              our site. You can control cookie preferences through your browser settings. We do not use 
              cookies to collect personally identifiable information without your consent.
            </p>
          </section>

          {/* Section 4: Third-Party Links */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-[#EDEDED]">
              Third-Party Links
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Our website contains links to external sites operated by third parties. We are not 
              responsible for the privacy practices or content of these external sites. We encourage 
              you to review the privacy policies of any third-party sites you visit.
            </p>
          </section>

          {/* Section 5: Changes to Policy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-[#EDEDED]">
              Changes to This Policy
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              We reserve the right to update this Privacy Policy at any time. Changes will be posted 
              on this page with an updated "Last Updated" date. Your continued use of the site after 
              any changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact Section */}
          <section className="p-6 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
            <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-[#EDEDED]">
              Questions or Concerns?
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              If you have any questions about this Privacy Policy or our data practices, please reach 
              out to us at{' '}
              <a 
                href="mailto:contact@aidrivenfuture.com" 
                className="text-blue-500 hover:text-blue-400 underline"
              >
                contact@aidrivenfuture.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}




