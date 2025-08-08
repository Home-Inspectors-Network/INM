import Layout from '../../components/Layout';
import SearchBar from '../../components/SearchBar';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

export default function NewYorkHomeInspectors() {
  const [inspectors, setInspectors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInspectors();
  }, []);

  const loadInspectors = async () => {
    try {
      const { data, error } = await supabase
        .from('inspectors')
        .select('*')
        .eq('city', 'New York')
        .eq('state', 'NY')
        .limit(6);

      if (error) throw error;
      setInspectors(data || []);
    } catch (error) {
      console.error('Error loading inspectors:', error);
    } finally {
      setLoading(false);
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Home Inspectors in New York, NY - Licensed Property Inspectors",
    "description": "Find certified home inspectors in New York City. Compare prices, read reviews, and book inspections for Manhattan, Brooklyn, Queens, Bronx, and Staten Island properties.",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@id": "https://inspectorsnearme.com/",
            "name": "Home"
          }
        },
        {
          "@type": "ListItem",
          "position": 2,
          "item": {
            "@id": "https://inspectorsnearme.com/ny",
            "name": "New York"
          }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@id": "https://inspectorsnearme.com/ny/new-york",
            "name": "New York City"
          }
        }
      ]
    },
    "mainEntity": {
      "@type": "LocalBusiness",
      "name": "Home Inspectors in New York City",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "New York",
        "addressRegion": "NY",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "areaServed": [
        "Manhattan",
        "Brooklyn",
        "Queens",
        "Bronx",
        "Staten Island"
      ]
    }
  };

  return (
    <Layout
      title="Home Inspectors in New York, NY | Licensed Property Inspectors Near You"
      description="Find certified home inspectors in New York City. Compare prices, read reviews, and book inspections for Manhattan, Brooklyn, Queens, Bronx, and Staten Island properties. All inspectors are licensed and insured."
      keywords="home inspectors New York, property inspection NYC, Manhattan home inspection, Brooklyn inspectors, Queens home inspectors, Bronx property inspection, Staten Island inspectors"
      jsonLd={jsonLd}
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white">
        <div className="container section-padding">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-4">
                Home Inspectors in New York, NY
              </h1>
              <p className="text-xl text-secondary-600 mb-6">
                Connect with licensed property inspectors serving all five boroughs of NYC
              </p>
              <SearchBar 
                placeholder="Search by ZIP code or neighborhood" 
                className="max-w-2xl mx-auto"
              />
            </div>

            {/* Local Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary-600">500+</div>
                <div className="text-sm text-secondary-600">Licensed Inspectors</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary-600">$450-850</div>
                <div className="text-sm text-secondary-600">Average Cost</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary-600">4.8/5</div>
                <div className="text-sm text-secondary-600">Average Rating</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary-600">3-4 hrs</div>
                <div className="text-sm text-secondary-600">Inspection Time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Local Market Info */}
      <section className="section-padding">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Why Home Inspections Matter in New York City</h2>
            
            <div className="prose max-w-none text-secondary-600">
              <p className="mb-6">
                New York City's diverse housing stock, ranging from pre-war brownstones to modern high-rises, 
                presents unique challenges for property buyers. With buildings dating back to the 1800s in 
                neighborhoods like Greenwich Village and the Upper West Side, and newer developments in Long 
                Island City and Downtown Brooklyn, each property type requires specialized inspection expertise.
              </p>

              <h3 className="text-2xl font-semibold mb-4 text-secondary-900">Common Issues in NYC Properties</h3>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h4 className="font-semibold mb-2">Pre-War Buildings (Built before 1940)</h4>
                  <ul className="list-disc list-inside space-y-1 text-secondary-600">
                    <li>Lead paint and asbestos concerns</li>
                    <li>Outdated electrical systems (knob-and-tube wiring)</li>
                    <li>Aging cast iron plumbing</li>
                    <li>Structural settlement issues</li>
                    <li>Steam heating system maintenance</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Modern Construction</h4>
                  <ul className="list-disc list-inside space-y-1 text-secondary-600">
                    <li>HVAC system performance</li>
                    <li>Water infiltration in glass curtain walls</li>
                    <li>Balcony and terrace waterproofing</li>
                    <li>Fire safety system compliance</li>
                    <li>Building envelope issues</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-2xl font-semibold mb-4 text-secondary-900">NYC-Specific Inspection Requirements</h3>
              <p className="mb-4">
                New York City has strict building codes and regulations that inspectors must be familiar with:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-6">
                <li><strong>Local Law 11/98:</strong> Facade inspection requirements for buildings over 6 stories</li>
                <li><strong>HPD Violations:</strong> Review of housing preservation violations</li>
                <li><strong>Certificate of Occupancy:</strong> Verification of legal use and occupancy</li>
                <li><strong>Flood Zone Considerations:</strong> Especially important in coastal areas of Queens and Brooklyn</li>
                <li><strong>Rent Stabilization Status:</strong> For multi-family properties</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Neighborhoods Section */}
      <section className="section-padding bg-secondary-50">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Areas We Serve in New York City</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Manhattan</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Upper East Side & Upper West Side</li>
                  <li>Midtown & Chelsea</li>
                  <li>Greenwich Village & SoHo</li>
                  <li>Financial District & Tribeca</li>
                  <li>Harlem & Washington Heights</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Brooklyn</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Park Slope & Prospect Heights</li>
                  <li>Williamsburg & Greenpoint</li>
                  <li>Brooklyn Heights & DUMBO</li>
                  <li>Bed-Stuy & Crown Heights</li>
                  <li>Bay Ridge & Bensonhurst</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Queens</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Long Island City & Astoria</li>
                  <li>Forest Hills & Rego Park</li>
                  <li>Flushing & Bayside</li>
                  <li>Jackson Heights & Elmhurst</li>
                  <li>Jamaica & Queens Village</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">The Bronx</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Riverdale & Fieldston</li>
                  <li>Fordham & University Heights</li>
                  <li>Pelham Bay & Throgs Neck</li>
                  <li>South Bronx & Mott Haven</li>
                  <li>Bronx Park & Norwood</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Staten Island</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>St. George & Stapleton</li>
                  <li>Tottenville & Great Kills</li>
                  <li>New Springville & Eltingville</li>
                  <li>Port Richmond & Mariners Harbor</li>
                  <li>Todt Hill & Emerson Hill</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Nearby Areas</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Westchester County</li>
                  <li>Nassau County</li>
                  <li>Bergen County, NJ</li>
                  <li>Hudson County, NJ</li>
                  <li>Fairfield County, CT</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Inspectors */}
      <section className="section-padding">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Top-Rated NYC Home Inspectors</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : inspectors.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inspectors.map((inspector) => (
                  <div key={inspector.id} className="card p-6 hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold mb-2">{inspector.business_name}</h3>
                    <div className="flex items-center mb-3">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-5 h-5 ${i < Math.floor(inspector.rating || 4.5) ? 'fill-current' : 'fill-gray-300'}`} viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 text-secondary-600">({inspector.review_count || 0} reviews)</span>
                    </div>
                    <p className="text-secondary-600 mb-4">{inspector.certifications?.join(', ') || 'Licensed & Insured'}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-primary-600">${inspector.price_range || '450-750'}</span>
                      <Link href={`/inspectors/${inspector.id}`} className="btn btn-sm">
                        View Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-secondary-600">No inspectors found. Please try a different search.</p>
            )}
            
            <div className="text-center mt-8">
              <Link href="/ny/new-york/inspectors" className="btn btn-primary">
                View All NYC Inspectors
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding bg-secondary-50">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">How much does a home inspection cost in NYC?</h3>
                <p className="text-secondary-600">
                  Home inspection costs in New York City typically range from $450 to $850 for apartments and condos, 
                  and $600 to $1,200 for single-family homes. Prices vary based on property size, age, and additional 
                  services like radon testing, mold inspection, or thermal imaging. Manhattan properties tend to be 
                  on the higher end due to complexity and parking costs.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">How long does a typical NYC home inspection take?</h3>
                <p className="text-secondary-600">
                  Most home inspections in NYC take 2-4 hours. Studio and one-bedroom apartments typically take 2-2.5 hours, 
                  while larger apartments or townhouses may require 3-4 hours. Pre-war buildings often take longer due to 
                  their complex systems. The inspector will provide a detailed report within 24-48 hours.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Do I need a home inspection for a co-op or condo?</h3>
                <p className="text-secondary-600">
                  Yes, home inspections are highly recommended for co-ops and condos in NYC. While the building management 
                  handles exterior and common areas, you're responsible for everything within your unit. Inspectors will 
                  check plumbing, electrical, HVAC, appliances, and interior conditions that could affect your investment.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">What's unique about inspecting NYC brownstones?</h3>
                <p className="text-secondary-600">
                  NYC brownstones require specialized inspection knowledge due to their age (often 100+ years) and unique 
                  construction. Common issues include foundation settling, outdated electrical systems, lead paint, and 
                  deteriorating brownstone facades. Inspectors familiar with historic properties can identify these 
                  period-specific concerns.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Should I get additional testing in NYC?</h3>
                <p className="text-secondary-600">
                  Additional testing often recommended in NYC includes: lead paint testing (for pre-1978 buildings), 
                  asbestos testing (common in pre-1980s construction), mold inspection (especially in basements), and 
                  radon testing (primarily for ground-floor units and houses). Your inspector can advise based on the 
                  property's age and condition.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white section-padding">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Schedule Your NYC Home Inspection?
            </h2>
            <p className="text-xl mb-8 text-primary-100">
              Compare quotes from licensed inspectors in your borough and book online
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/get-quotes" className="btn bg-white text-primary-600 hover:bg-primary-50">
                Get Free Quotes
              </Link>
              <Link href="/ny/new-york/inspectors" className="btn border-2 border-white text-white hover:bg-primary-700">
                Browse Inspectors
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}