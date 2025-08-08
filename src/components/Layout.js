import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

export default function Layout({ children, title, description }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'InspectorsNearMe.com';

  return (
    <>
      <Head>
        <title>{title ? `${title} | ${siteName}` : siteName}</title>
        <meta name="description" content={description || 'Find certified home inspectors near you. Compare prices, read reviews, and book inspections online.'} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={title || siteName} />
        <meta property="og:description" content={description || 'Find certified home inspectors near you'} />
        <meta property="og:type" content="website" />
      </Head>

      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-secondary-200">
          <nav className="container">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="text-xl font-bold text-primary-600">
                  InspectorsNearMe
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <Link href="/search" className="text-secondary-600 hover:text-primary-600">
                  Find Inspectors
                </Link>
                <Link href="/for-inspectors" className="text-secondary-600 hover:text-primary-600">
                  For Inspectors
                </Link>
                <Link href="/resources" className="text-secondary-600 hover:text-primary-600">
                  Resources
                </Link>
                <Link href="/contact" className="text-secondary-600 hover:text-primary-600">
                  Contact
                </Link>
                <Link href="/inspectors/join" className="btn-primary text-sm">
                  List Your Business
                </Link>
              </div>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg text-secondary-600 hover:bg-secondary-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-secondary-200">
                <div className="flex flex-col space-y-4">
                  <Link href="/search" className="text-secondary-600 hover:text-primary-600">
                    Find Inspectors
                  </Link>
                  <Link href="/for-inspectors" className="text-secondary-600 hover:text-primary-600">
                    For Inspectors
                  </Link>
                  <Link href="/resources" className="text-secondary-600 hover:text-primary-600">
                    Resources
                  </Link>
                  <Link href="/contact" className="text-secondary-600 hover:text-primary-600">
                    Contact
                  </Link>
                  <Link href="/inspectors/join" className="btn-primary text-sm text-center">
                    List Your Business
                  </Link>
                </div>
              </div>
            )}
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-secondary-900 text-white">
          <div className="container py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">About</h3>
                <p className="text-secondary-400 text-sm">
                  InspectorsNearMe connects homeowners with certified property inspectors across the United States.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/search" className="text-secondary-400 hover:text-white">Find Inspectors</Link></li>
                  <li><Link href="/inspectors/join" className="text-secondary-400 hover:text-white">List Your Business</Link></li>
                  <li><Link href="/resources" className="text-secondary-400 hover:text-white">Resources</Link></li>
                  <li><Link href="/blog" className="text-secondary-400 hover:text-white">Blog</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Popular Cities</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/ca/san-francisco" className="text-secondary-400 hover:text-white">San Francisco, CA</Link></li>
                  <li><Link href="/ca/san-jose" className="text-secondary-400 hover:text-white">San Jose, CA</Link></li>
                  <li><Link href="/ca/oakland" className="text-secondary-400 hover:text-white">Oakland, CA</Link></li>
                  <li><Link href="/ca/palo-alto" className="text-secondary-400 hover:text-white">Palo Alto, CA</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact</h3>
                <ul className="space-y-2 text-sm text-secondary-400">
                  <li>support@inspectorsnearme.com</li>
                  <li>1-800-INSPECT</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-secondary-800 text-center text-sm text-secondary-400">
              <p>&copy; {new Date().getFullYear()} InspectorsNearMe.com. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}