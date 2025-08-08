import Layout from '../../components/Layout';
import SearchBar from '../../components/SearchBar';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

export default function ChicagoHomeInspectors() {
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
        .eq('city', 'Chicago')
        .eq('state', 'IL')
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
    "name": "Home Inspectors in Chicago, IL - Licensed Property Inspectors",
    "description": "Find certified home inspectors in Chicago and Chicagoland. Compare prices, read reviews, and book inspections for properties in Cook County and surrounding areas.",
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
            "@id": "https://inspectorsnearme.com/il",
            "name": "Illinois"
          }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@id": "https://inspectorsnearme.com/il/chicago",
            "name": "Chicago"
          }
        }
      ]
    },
    "mainEntity": {
      "@type": "LocalBusiness",
      "name": "Home Inspectors in Chicago",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Chicago",
        "addressRegion": "IL",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 41.8781,
        "longitude": -87.6298
      },
      "areaServed": [
        "Loop",
        "North Side",
        "South Side",
        "West Side",
        "Cook County",
        "DuPage County",
        "Lake County",
        "Will County"
      ]
    }
  };

  return (
    <Layout
      title="Home Inspectors in Chicago, IL | Licensed Property Inspectors Near You"
      description="Find certified home inspectors in Chicago and Chicagoland. Compare prices, read reviews, and book inspections for properties throughout Cook County. All inspectors are Illinois licensed and insured."
      keywords="home inspectors Chicago, property inspection Chicago IL, Chicagoland home inspection, Cook County inspectors, Chicago condo inspection, Illinois property inspectors"
      jsonLd={jsonLd}
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white">
        <div className="container section-padding">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-4">
                Home Inspectors in Chicago, IL
              </h1>
              <p className="text-xl text-secondary-600 mb-6">
                Connect with Illinois-licensed inspectors serving Chicago and Chicagoland
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
                <div className="text-3xl font-bold text-primary-600">$350-650</div>
                <div className="text-sm text-secondary-600">Average Cost</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary-600">4.7/5</div>
                <div className="text-sm text-secondary-600">Average Rating</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary-600">2-3 hrs</div>
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
            <h2 className="text-3xl font-bold mb-8">Why Home Inspections Matter in Chicago</h2>
            
            <div className="prose max-w-none text-secondary-600">
              <p className="mb-6">
                Chicago's diverse architectural landscape, from historic greystone buildings to modern high-rises, 
                presents unique challenges for property buyers. The city's extreme weather conditions, with harsh 
                winters and humid summers, can significantly impact building systems and structures. Whether you're 
                buying a vintage bungalow in Jefferson Park or a condo in the Loop, a thorough inspection is essential.
              </p>

              <h3 className="text-2xl font-semibold mb-4 text-secondary-900">Common Issues in Chicago Properties</h3>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h4 className="font-semibold mb-2">Weather-Related Concerns</h4>
                  <ul className="list-disc list-inside space-y-1 text-secondary-600">
                    <li>Ice dam formation and roof damage</li>
                    <li>Foundation cracks from freeze-thaw cycles</li>
                    <li>Basement water infiltration</li>
                    <li>HVAC system strain and efficiency</li>
                    <li>Window and door seal deterioration</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Building-Specific Issues</h4>
                  <ul className="list-disc list-inside space-y-1 text-secondary-600">
                    <li>Aging electrical systems in vintage homes</li>
                    <li>Galvanized plumbing replacement needs</li>
                    <li>Brick and mortar deterioration (tuckpointing)</li>
                    <li>Flat roof drainage problems</li>
                    <li>Outdated boiler and radiator systems</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-2xl font-semibold mb-4 text-secondary-900">Chicago-Specific Inspection Considerations</h3>
              <p className="mb-4">
                Chicago has specific building codes and environmental factors that inspectors must address:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-6">
                <li><strong>Radon Testing:</strong> Essential in Illinois, especially for basement and first-floor units</li>
                <li><strong>Lead Paint Disclosure:</strong> Required for homes built before 1978</li>
                <li><strong>Chicago Building Code:</strong> Stricter requirements for electrical and plumbing systems</li>
                <li><strong>Flood Risk Assessment:</strong> Important for properties near the Chicago River and Lake Michigan</li>
                <li><strong>Energy Efficiency:</strong> Critical due to extreme temperature variations</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Neighborhoods Section */}
      <section className="section-padding bg-secondary-50">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Areas We Serve in Chicagoland</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">North Side</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Lincoln Park & Lakeview</li>
                  <li>Wicker Park & Bucktown</li>
                  <li>Logan Square & Avondale</li>
                  <li>Ravenswood & Lincoln Square</li>
                  <li>Rogers Park & Edgewater</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Downtown & Near North</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>The Loop & River North</li>
                  <li>Gold Coast & Old Town</li>
                  <li>West Loop & Fulton Market</li>
                  <li>South Loop & Printer's Row</li>
                  <li>Streeterville & Magnificent Mile</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">South Side</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Hyde Park & Kenwood</li>
                  <li>Bronzeville & Oakland</li>
                  <li>Beverly & Mount Greenwood</li>
                  <li>Bridgeport & Chinatown</li>
                  <li>South Shore & Chatham</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">West Side</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Oak Park & River Forest</li>
                  <li>Humboldt Park & West Town</li>
                  <li>Austin & Garfield Park</li>
                  <li>Little Village & Pilsen</li>
                  <li>Forest Park & Berwyn</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Northwest Suburbs</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Evanston & Skokie</li>
                  <li>Arlington Heights & Palatine</li>
                  <li>Schaumburg & Hoffman Estates</li>
                  <li>Des Plaines & Park Ridge</li>
                  <li>Mount Prospect & Elk Grove</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">South & West Suburbs</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Naperville & Aurora</li>
                  <li>Orland Park & Tinley Park</li>
                  <li>Downers Grove & Westmont</li>
                  <li>Joliet & Plainfield</li>
                  <li>Elmhurst & Villa Park</li>
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
            <h2 className="text-3xl font-bold text-center mb-12">Top-Rated Chicago Home Inspectors</h2>
            
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
                      <span className="font-semibold text-primary-600">${inspector.price_range || '350-550'}</span>
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
              <Link href="/il/chicago/inspectors" className="btn btn-primary">
                View All Chicago Inspectors
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
                <h3 className="text-xl font-semibold mb-3">How much does a home inspection cost in Chicago?</h3>
                <p className="text-secondary-600">
                  Home inspection costs in Chicago typically range from $350 to $650 for single-family homes, 
                  with condos and smaller properties starting around $300. Larger homes or those requiring 
                  additional services like radon testing ($100-150) or sewer scope inspection ($200-300) will 
                  cost more. Prices vary based on property size, age, and location within Chicagoland.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Is radon testing necessary in Chicago?</h3>
                <p className="text-secondary-600">
                  Yes, radon testing is highly recommended in Illinois. The EPA classifies many Chicago-area 
                  counties as Zone 1 (highest radon potential). About 40% of Illinois homes test above the 
                  EPA action level of 4.0 pCi/L. Testing typically costs $100-150 and can be done during 
                  the inspection or separately.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">What's unique about inspecting Chicago bungalows?</h3>
                <p className="text-secondary-600">
                  Chicago bungalows, typically built between 1910-1940, require special attention to: original 
                  knob-and-tube wiring, galvanized plumbing, basement moisture issues, outdated electrical 
                  panels, and brick/mortar condition. Many have been renovated, so inspectors also check for 
                  proper permits and code compliance on updates.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Do I need a separate condo inspection in Chicago?</h3>
                <p className="text-secondary-600">
                  Yes, condo inspections are important even though the HOA maintains common areas. Inspectors 
                  will check your unit's HVAC system, plumbing, electrical, appliances, windows, and any 
                  exclusive-use areas like balconies. They'll also review HOA documents for building issues 
                  and upcoming assessments.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">When is the best time to schedule an inspection?</h3>
                <p className="text-secondary-600">
                  Schedule your inspection as soon as your offer is accepted, during the inspection contingency 
                  period (typically 5-10 days in Chicago). Avoid scheduling immediately after heavy rain or snow, 
                  which can hide or create temporary issues. Spring and fall are ideal for identifying both 
                  heating and cooling system performance.
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
              Ready to Schedule Your Chicago Home Inspection?
            </h2>
            <p className="text-xl mb-8 text-primary-100">
              Compare quotes from licensed Illinois inspectors and book online today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/get-quotes" className="btn bg-white text-primary-600 hover:bg-primary-50">
                Get Free Quotes
              </Link>
              <Link href="/il/chicago/inspectors" className="btn border-2 border-white text-white hover:bg-primary-700">
                Browse Inspectors
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}