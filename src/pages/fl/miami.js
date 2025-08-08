import Layout from '../../components/Layout';
import SearchBar from '../../components/SearchBar';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

export default function MiamiHomeInspectors() {
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
        .eq('city', 'Miami')
        .eq('state', 'FL')
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
    "name": "Home Inspectors in Miami, FL - Licensed Property Inspectors",
    "description": "Find certified home inspectors in Miami, Florida. Compare prices, read reviews, and book inspections for properties in Miami-Dade County, South Beach, and surrounding areas.",
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
            "@id": "https://inspectorsnearme.com/fl",
            "name": "Florida"
          }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@id": "https://inspectorsnearme.com/fl/miami",
            "name": "Miami"
          }
        }
      ]
    },
    "mainEntity": {
      "@type": "LocalBusiness",
      "name": "Home Inspectors in Miami",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Miami",
        "addressRegion": "FL",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 25.7617,
        "longitude": -80.1918
      },
      "areaServed": [
        "Miami Beach",
        "South Beach",
        "Coral Gables",
        "Coconut Grove",
        "Key Biscayne",
        "Aventura",
        "Kendall",
        "Homestead"
      ]
    }
  };

  return (
    <Layout
      title="Home Inspectors in Miami, FL | Licensed Property Inspectors Near You"
      description="Find certified home inspectors in Miami, Florida. Compare prices, read reviews, and book inspections for properties in Miami-Dade County. All inspectors are licensed and insured."
      keywords="home inspectors Miami, property inspection Miami FL, Miami home inspection, South Florida inspectors, Miami-Dade property inspection, condo inspection Miami"
      jsonLd={jsonLd}
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white">
        <div className="container section-padding">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-4">
                Home Inspectors in Miami, FL
              </h1>
              <p className="text-xl text-secondary-600 mb-6">
                Connect with licensed property inspectors serving Miami-Dade County and South Florida
              </p>
              <SearchBar 
                placeholder="Search by ZIP code or neighborhood" 
                className="max-w-2xl mx-auto"
              />
            </div>

            {/* Local Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary-600">300+</div>
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
            <h2 className="text-3xl font-bold mb-8">Why Home Inspections Matter in Miami</h2>
            
            <div className="prose max-w-none text-secondary-600">
              <p className="mb-6">
                Miami's unique tropical climate and coastal location create specific challenges for property owners. 
                From hurricane-resistant features to salt air corrosion, Miami properties require inspectors with 
                specialized knowledge of South Florida's building requirements and environmental conditions.
              </p>

              <h3 className="text-2xl font-semibold mb-4 text-secondary-900">Common Issues in Miami Properties</h3>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h4 className="font-semibold mb-2">Climate-Related Concerns</h4>
                  <ul className="list-disc list-inside space-y-1 text-secondary-600">
                    <li>Hurricane impact windows and shutters</li>
                    <li>Roof wind mitigation features</li>
                    <li>Moisture and mold issues</li>
                    <li>HVAC system strain from humidity</li>
                    <li>Salt air corrosion on metal components</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Structural Considerations</h4>
                  <ul className="list-disc list-inside space-y-1 text-secondary-600">
                    <li>Foundation settling in sandy soil</li>
                    <li>Concrete spalling in older buildings</li>
                    <li>Seawall and dock conditions</li>
                    <li>Pool and spa equipment</li>
                    <li>Termite and pest damage</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-2xl font-semibold mb-4 text-secondary-900">Miami-Specific Inspection Requirements</h3>
              <p className="mb-4">
                South Florida has unique building codes and inspection requirements:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-6">
                <li><strong>Wind Mitigation Inspection:</strong> Required for insurance discounts, verifies hurricane-resistant features</li>
                <li><strong>4-Point Inspection:</strong> Required for older homes, covers roof, electrical, plumbing, and HVAC</li>
                <li><strong>Condo Association Reviews:</strong> Assessment of building reserves and maintenance for high-rises</li>
                <li><strong>Flood Zone Compliance:</strong> Elevation certificates and flood-resistant features</li>
                <li><strong>40-Year Recertification:</strong> Required structural and electrical inspection for buildings over 40 years</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Neighborhoods Section */}
      <section className="section-padding bg-secondary-50">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Areas We Serve in Miami-Dade County</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Miami Beach</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>South Beach</li>
                  <li>Mid-Beach</li>
                  <li>North Beach</li>
                  <li>Fisher Island</li>
                  <li>Star Island</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Central Miami</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Downtown Miami</li>
                  <li>Brickell</li>
                  <li>Coconut Grove</li>
                  <li>Coral Gables</li>
                  <li>Key Biscayne</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">North Miami</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Aventura</li>
                  <li>Bal Harbour</li>
                  <li>Sunny Isles Beach</li>
                  <li>North Miami Beach</li>
                  <li>Miami Shores</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">South Miami</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Kendall</li>
                  <li>Pinecrest</li>
                  <li>Palmetto Bay</li>
                  <li>Cutler Bay</li>
                  <li>Homestead</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">West Miami</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Doral</li>
                  <li>Westchester</li>
                  <li>West Kendall</li>
                  <li>Country Walk</li>
                  <li>The Hammocks</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Nearby Areas</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Fort Lauderdale</li>
                  <li>Hollywood</li>
                  <li>Pembroke Pines</li>
                  <li>Weston</li>
                  <li>Coral Springs</li>
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
            <h2 className="text-3xl font-bold text-center mb-12">Top-Rated Miami Home Inspectors</h2>
            
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
              <Link href="/fl/miami/inspectors" className="btn btn-primary">
                View All Miami Inspectors
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
                <h3 className="text-xl font-semibold mb-3">How much does a home inspection cost in Miami?</h3>
                <p className="text-secondary-600">
                  Home inspection costs in Miami typically range from $350 to $650 for single-family homes and 
                  $300 to $500 for condos. Prices vary based on property size, age, and additional services like 
                  wind mitigation inspections ($150-300) or 4-point inspections ($75-150). Luxury properties and 
                  waterfront homes may cost more due to additional features like pools, docks, and seawalls.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">What's included in a Miami wind mitigation inspection?</h3>
                <p className="text-secondary-600">
                  A wind mitigation inspection verifies hurricane-resistant features that can qualify you for insurance 
                  discounts. Inspectors check roof covering and deck attachment, roof-to-wall connections, window and 
                  door protection (impact glass or shutters), garage door reinforcement, and secondary water resistance. 
                  This inspection is especially important in Miami due to hurricane risk.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Do I need a 4-point inspection in Miami?</h3>
                <p className="text-secondary-600">
                  Most insurance companies in Florida require a 4-point inspection for homes over 30 years old. This 
                  inspection covers four main systems: roof, electrical, plumbing, and HVAC. It's less comprehensive 
                  than a full home inspection but focuses on the systems most likely to file insurance claims. Many 
                  Miami properties, especially older Art Deco buildings, require this inspection.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">What should I look for in a Miami condo inspection?</h3>
                <p className="text-secondary-600">
                  Miami condo inspections should include the unit interior, balconies/terraces, HVAC systems, and 
                  plumbing/electrical within the unit. Additionally, review the condo association's financial reserves, 
                  40-year recertification status (if applicable), recent structural inspections, and special assessments. 
                  After the Surfside collapse, structural integrity has become a major focus for older buildings.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">How long does a home inspection take in Miami?</h3>
                <p className="text-secondary-600">
                  A typical Miami home inspection takes 2-3 hours for condos and 3-4 hours for single-family homes. 
                  Larger properties, older homes, or those with pools, guest houses, or waterfront features may take 
                  longer. Wind mitigation and 4-point inspections can usually be completed during the same visit, 
                  adding about 30-60 minutes total.
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
              Ready to Schedule Your Miami Home Inspection?
            </h2>
            <p className="text-xl mb-8 text-primary-100">
              Compare quotes from licensed inspectors and book online today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/get-quotes" className="btn bg-white text-primary-600 hover:bg-primary-50">
                Get Free Quotes
              </Link>
              <Link href="/fl/miami/inspectors" className="btn border-2 border-white text-white hover:bg-primary-700">
                Browse Inspectors
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}