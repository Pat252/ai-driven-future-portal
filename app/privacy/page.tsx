import Header from '@/components/Header';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy & Terms of Service - AI Driven Future',
  description: 'Privacy Policy and Terms of Service for AI Driven Future news portal.',
  openGraph: {
    title: 'Privacy Policy & Terms of Service - AI Driven Future',
    description: 'Privacy Policy and Terms of Service for AI Driven Future news portal.',
    url: 'https://www.aidrivenfuture.ca/privacy',
    siteName: 'AI Driven Future',
    images: [
      {
        url: 'https://www.aidrivenfuture.ca/assets/images/og-brand-banner.png.svg',
        width: 1200,
        height: 630,
        alt: 'AI Driven Future - Privacy Policy',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy & Terms of Service - AI Driven Future',
    description: 'Privacy Policy and Terms of Service for AI Driven Future news portal.',
    images: ['https://www.aidrivenfuture.ca/assets/images/og-brand-banner.png.svg'],
  },
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

          {/* Introductory Paragraph */}
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
            This website is operated by The Operator, the entity responsible for managing the website and services of AI Driven Future.
          </p>

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
              Content Aggregation & Copyright Disclaimer
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              This website is a news aggregator operated by The Operator that provides curated summaries and headlines for informational purposes.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-[#EDEDED] mt-6">
              Statutory Compliance
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              Our use of content excerpts and headlines is intended to fall under the following legal protections:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 leading-relaxed mb-4 space-y-2 ml-4">
              <li>
                <strong>Canada:</strong> Fair Dealing for the purpose of news reporting under Section 29.2 of the Copyright Act (R.S.C., 1985, c. C-42). As required by law, we provide clear attribution to the original source and author for every curated item.
              </li>
              <li>
                <strong>United States:</strong> Fair Use under Section 107 of the Copyright Act of 1976. This portal serves a transformative purpose by aggregating diverse AI news into a specialized interface for public benefit and news reporting.
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-[#EDEDED] mt-6">
              Image Use
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              The Operator does not host or store original publisher images. Any visual thumbnails displayed are served via standard linking protocols (e.g., Open Graph) or are used with permission. Our primary use of content is limited to headlines and short text excerpts.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-[#EDEDED] mt-6">
              Ownership & Linking
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              All copyrights, trademarks, and intellectual property belong to their respective original publishers. The Operator does not claim ownership of any aggregated content. We provide direct outbound links to the original sources for full-text articles and do not "iframe" or host original content in a way that bypasses the publisher's original environment.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-[#EDEDED] mt-6">
              Market Integrity
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              All curated summaries are intentionally brief and designed to provide a high-level overview only. They are not intended to replace the original article. We encourage our readers to click the provided outbound links to access the full-text reporting on the publisher's own platform.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-[#EDEDED] mt-6">
              DMCA Notice & Takedown Procedure
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              We respect the intellectual property rights of others and respond to notices of alleged infringement. If you are a copyright owner or authorized agent and believe your work has been used in a way that constitutes copyright infringement, please submit a written notification to our Designated Copyright Agent at{' '}
              <a 
                href="mailto:contact@aidrivenfuture.ca" 
                className="text-blue-500 hover:text-blue-400 underline"
              >
                contact@aidrivenfuture.ca
              </a>
              {' '}with the following information:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 leading-relaxed space-y-2 ml-4">
              <li>A physical or electronic signature of the authorized person.</li>
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>Identification of the material on our site that is claimed to be infringing (including the specific URL).</li>
              <li>Your contact information (address, phone number, and email).</li>
              <li>A statement of "good faith belief" that the use is not authorized.</li>
              <li>A statement made under penalty of perjury that the information provided is accurate.</li>
            </ul>
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
          <section className="p-6 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 mb-12">
            <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-[#EDEDED]">
              Questions or Concerns?
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              If you have any questions about this Privacy Policy or our data practices, please reach 
              out to us at{' '}
              <a 
                href="mailto:contact@aidrivenfuture.ca" 
                className="text-blue-500 hover:text-blue-400 underline"
              >
                contact@aidrivenfuture.ca
              </a>
            </p>
          </section>

          {/* Governing Law & Jurisdiction */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-[#EDEDED]">
              Governing Law & Jurisdiction
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              This website is managed by The Operator from Quebec, Canada. These Terms and your use of the site are governed by the laws of the Province of Quebec and the federal laws of Canada. You hereby irrevocably submit to the exclusive jurisdiction of the courts located in the District of Montreal for any disputes arising from this site.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}




