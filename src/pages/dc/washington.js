import Layout from '../../components/Layout';
import SearchBar from '../../components/SearchBar';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

export default function WashingtonDCHomeInspectors() {
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
        .eq('city', 'Washington')
        .eq('state', 'DC')
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
    "name": "Home Inspectors in Washington, DC - Licensed Property Inspectors",
    "description": "Find certified home inspectors in Washington DC and the DMV area. Compare prices, read reviews, and book inspections for properties in the nation's capital.",
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
            "@id": "https://inspectorsnearme.com/dc",
            "name": "Washington DC"
          }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@id": "https://inspectorsnearme.com/dc/washington",
            "name": "Washington"
          }
        }
      ]
    },
    "mainEntity": {
      "@type": "LocalBusiness",
      "name": "Home Inspectors in Washington DC",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Washington",
        "addressRegion": "DC",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 38.9072,
        "longitude": -77.0369
      },
      "areaServed": [
        "Washington DC",
        "Arlington County",
        "Alexandria",
        "Montgomery County",
        "Prince George's County",
        "Fairfax County"
      ]
    }
  };

  return (
    <Layout
      title="Home Inspectors in Washington, DC | Licensed DMV Property Inspectors"
      description="Find certified home inspectors in Washington DC and the DMV metro area. Compare prices, read reviews, and book inspections for historic rowhomes, condos, and suburban properties. Licensed inspectors serving DC, MD, and VA."
      keywords="home inspectors Washington DC, property inspection DC, DMV home inspection, DC property inspectors, Capitol Hill inspectors, Georgetown home inspection"
      jsonLd={jsonLd}
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white">
        <div className="container section-padding">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-4">
                Home Inspectors in Washington, DC
              </h1>
              <p className="text-xl text-secondary-600 mb-6">
                Expert inspectors for DC's historic neighborhoods and modern developments
              </p>
              <SearchBar 
                placeholder="Search by ZIP code or neighborhood" 
                className="max-w-2xl mx-auto"
              />
            </div>

            {/* Local Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary-600">400+</div>
                <div className="text-sm text-secondary-600">Licensed Inspectors</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary-600">$400-750</div>
                <div className="text-sm text-secondary-600">Average Cost</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary-600">4.8/5</div>
                <div className="text-sm text-secondary-600">Average Rating</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary-600">2-4 hrs</div>
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
            <h2 className="text-3xl font-bold mb-8">Why Home Inspections Are Essential in Washington DC</h2>
            
            <div className="prose max-w-none text-secondary-600">
              <p className="mb-6">
                Washington DC's housing market features an extraordinary mix of historic Federal and Victorian 
                rowhomes, mid-century apartment buildings, and modern luxury condos. Many properties date back 
                to the 1800s, particularly in neighborhoods like Georgetown, Capitol Hill, and Dupont Circle. 
                The city's unique position as the nation's capital also means dealing with strict historic 
                preservation requirements and complex ownership structures in many buildings.
              </p>

              <h3 className="text-2xl font-semibold mb-4 text-secondary-900">Common Issues in DC Properties</h3>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h4 className="font-semibold mb-2">Historic Property Concerns</h4>
                  <ul className="list-disc list-inside space-y-1 text-secondary-600">
                    <li>Lead paint and pipes (pre-1978)</li>
                    <li>Asbestos in older buildings</li>
                    <li>Knob-and-tube electrical wiring</li>
                    <li>Deteriorating brick and mortar</li>
                    <li>Original single-pane windows</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Structural & Environmental</h4>
                  <ul className="list-disc list-inside space-y-1 text-secondary-600">
                    <li>Foundation settling in rowhomes</li>
                    <li>Basement water infiltration</li>
                    <li>Aging HVAC and radiator systems</li>
                    <li>Flat roof drainage issues</li>
                    <li>Termite damage in older frames</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-2xl font-semibold mb-4 text-secondary-900">DC-Specific Inspection Requirements</h3>
              <p className="mb-4">
                Washington DC has unique regulations and considerations for property inspections:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-6">
                <li><strong>DCRA Compliance:</strong> DC Department of Consumer and Regulatory Affairs requirements</li>
                <li><strong>Historic Preservation:</strong> Special rules for properties in historic districts</li>
                <li><strong>Lead-Safe Certification:</strong> Required for rental properties built before 1978</li>
                <li><strong>Energy Benchmarking:</strong> Required for buildings over 50,000 sq ft</li>
                <li><strong>Condo/Co-op Documents:</strong> Review of association financials and reserves</li>
                <li><strong>Rent Control Status:</strong> Important for investment properties</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Neighborhoods Section */}
      <section className="section-padding bg-secondary-50">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Areas We Serve in the DMV</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Northwest DC</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Georgetown & Glover Park</li>
                  <li>Cleveland Park & Woodley Park</li>
                  <li>Dupont Circle & Logan Circle</li>
                  <li>Adams Morgan & Columbia Heights</li>
                  <li>Chevy Chase & Friendship Heights</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Capitol Hill & Northeast</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Capitol Hill & Eastern Market</li>
                  <li>H Street Corridor & Atlas District</li>
                  <li>Brookland & Catholic University</li>
                  <li>Shaw & U Street Corridor</li>
                  <li>NoMa & Union Market</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Southwest & Southeast</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Navy Yard & Capitol Riverfront</li>
                  <li>Southwest Waterfront & The Wharf</li>
                  <li>Anacostia & Congress Heights</li>
                  <li>Hill East & Barracks Row</li>
                  <li>Petworth & Park View</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Northern Virginia</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Arlington & Crystal City</li>
                  <li>Alexandria & Old Town</li>
                  <li>McLean & Great Falls</li>
                  <li>Fairfax & Vienna</li>
                  <li>Reston & Herndon</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Maryland Suburbs</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Bethesda & Chevy Chase</li>
                  <li>Silver Spring & Takoma Park</li>
                  <li>Rockville & Gaithersburg</li>
                  <li>College Park & Hyattsville</li>
                  <li>Potomac & North Potomac</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Outer Suburbs</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Loudoun County & Leesburg</li>
                  <li>Prince William County</li>
                  <li>Frederick County, MD</li>
                  <li>Anne Arundel County</li>
                  <li>Howard County & Columbia</li>
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
            <h2 className="text-3xl font-bold text-center mb-12">Top-Rated DC Metro Home Inspectors</h2>
            
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
                    <p className="text-secondary-600 mb-4">{inspector.certifications?.join(', ') || 'Licensed DC/MD/VA'}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-primary-600">${inspector.price_range || '450-650'}</span>
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
              <Link href="/dc/washington/inspectors" className="btn btn-primary">
                View All DC Area Inspectors
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
                <h3 className="text-xl font-semibold mb-3">How much does a home inspection cost in Washington DC?</h3>
                <p className="text-secondary-600">
                  Home inspection costs in DC typically range from $400 to $750. Condos and smaller rowhomes 
                  start around $400-500, while larger rowhomes and single-family homes cost $550-750. Historic 
                  properties may cost more due to their complexity. Additional services like radon testing 
                  ($125-175), lead testing ($200-400), or sewer scope inspection ($250-350) add to the total.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">What's unique about inspecting DC rowhomes?</h3>
                <p className="text-secondary-600">
                  DC rowhomes, especially in historic neighborhoods, require special attention to party walls, 
                  which can transmit water and structural issues between units. Common concerns include 
                  deteriorating brick facades, outdated electrical systems, lead service lines, and basement 
                  moisture issues. Many have been renovated multiple times, so inspectors check for proper 
                  permits and quality of work.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Do I need a lead inspection in DC?</h3>
                <p className="text-secondary-600">
                  Lead inspections are highly recommended for properties built before 1978, which includes most 
                  of DC's historic housing stock. The District requires lead-safe certification for rental 
                  properties. Lead can be found in paint, pipes, and soil. Testing costs $200-400 and is 
                  especially important if you have young children or plan to renovate.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Should I get a condo inspection in DC?</h3>
                <p className="text-secondary-600">
                  Yes, condo inspections are important even though the HOA maintains common areas. Inspectors 
                  check your unit's HVAC, plumbing, electrical systems, appliances, and windows. They also 
                  review building documents for financial health, upcoming assessments, and building-wide 
                  issues. This is crucial given DC's many converted buildings with aging infrastructure.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">What about historic district restrictions?</h3>
                <p className="text-secondary-600">
                  Properties in DC's historic districts (Georgetown, Capitol Hill, Dupont Circle, etc.) face 
                  strict renovation restrictions. While this doesn't directly affect inspection, it impacts 
                  repair options and costs. For example, window replacement may require historically accurate 
                  materials. Your inspector should note features subject to historic preservation review.
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
              Ready to Schedule Your DC Home Inspection?
            </h2>
            <p className="text-xl mb-8 text-primary-100">
              Compare quotes from inspectors licensed in DC, Maryland, and Virginia
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/get-quotes" className="btn bg-white text-primary-600 hover:bg-primary-50">
                Get Free Quotes
              </Link>
              <Link href="/dc/washington/inspectors" className="btn border-2 border-white text-white hover:bg-primary-700">
                Browse Inspectors
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}