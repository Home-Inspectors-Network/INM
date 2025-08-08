import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../utils/supabase';

export default function SEOPage({ pageData, meta, notFound }) {
  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-600">The page you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="keywords" content={meta.keywords ? meta.keywords.join(', ') : ''} />
        <link rel="canonical" href={meta.canonical} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:url" content={meta.canonical} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        
        {/* Schema markup */}
        {meta.schema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(meta.schema)
            }}
          />
        )}
      </Head>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="text-2xl font-bold text-blue-600">
              InspectorsNearMe
            </a>
            <div className="hidden md:flex space-x-6">
              <a href="/find-inspectors" className="text-gray-600 hover:text-blue-600">
                Find Inspectors
              </a>
              <a href="/how-it-works" className="text-gray-600 hover:text-blue-600">
                How It Works
              </a>
              <a href="/contact" className="text-gray-600 hover:text-blue-600">
                Contact
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <div 
          dangerouslySetInnerHTML={{ __html: pageData.content }}
        />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">InspectorsNearMe</h3>
              <p className="text-gray-400">
                Connecting homeowners with qualified, licensed home inspectors nationwide.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/pre-purchase-inspection">Pre-Purchase Inspection</a></li>
                <li><a href="/pre-listing-inspection">Pre-Listing Inspection</a></li>
                <li><a href="/specialty-inspections">Specialty Inspections</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/home-inspection-guide">Inspection Guide</a></li>
                <li><a href="/inspector-certification">Certification</a></li>
                <li><a href="/faq">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/about">About Us</a></li>
                <li><a href="/contact">Contact</a></li>
                <li><a href="/privacy">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 InspectorsNearMe. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}

export async function getServerSideProps({ params }) {
  const slug = Array.isArray(params.slug) ? params.slug.join('/') : params.slug;

  try {
    // Import server-side Supabase client
    const { serverSupabase } = await import('../utils/server-supabase');
    
    // Fetch SEO page by slug
    const { data: pageData, error } = await serverSupabase
      .from('seo_pages')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !pageData) {
      return {
        props: {
          notFound: true
        }
      };
    }

    const meta = {
      title: pageData.title || '',
      description: pageData.meta_description || '',
      keywords: pageData.target_keywords || null,
      canonical: pageData.canonical_url || '',
      schema: pageData.schema_markup || null
    };

    return {
      props: {
        pageData,
        meta,
        notFound: false
      }
    };

  } catch (error) {
    console.error('Error fetching SEO page:', error);
    return {
      props: {
        notFound: true
      }
    };
  }
}