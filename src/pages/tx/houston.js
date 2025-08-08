import Layout from '../../components/Layout';
import SearchBar from '../../components/SearchBar';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

export default function HoustonHomeInspectors() {
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
        .eq('city', 'Houston')
        .eq('state', 'TX')
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
    "name": "Home Inspectors in Houston, TX - Licensed Property Inspectors",
    "description": "Find certified home inspectors in Houston and Greater Houston area. Compare prices, read reviews, and book inspections for properties in Harris County and surrounding areas.",
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
            "@id": "https://inspectorsnearme.com/tx",
            "name": "Texas"
          }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@id": "https://inspectorsnearme.com/tx/houston",
            "name": "Houston"
          }
        }
      ]
    },
    "mainEntity": {
      "@type": "LocalBusiness",
      "name": "Home Inspectors in Houston",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Houston",
        "addressRegion": "TX",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 29.7604,
        "longitude": -95.3698
      },
      "areaServed": [
        "Harris County",
        "Fort Bend County",
        "Montgomery County",
        "Brazoria County",
        "Galveston County"
      ]
    }
  };

  return (
    <Layout
      title="Home Inspectors in Houston, TX | TREC Licensed Property Inspectors"
      description="Find TREC-licensed home inspectors in Houston and Greater Houston area. Compare prices, read reviews, and book inspections for properties throughout Harris County. Experienced with Houston's unique climate challenges."
      keywords="home inspectors Houston, property inspection Houston TX, TREC licensed inspectors, Houston home inspection, Harris County inspectors, Texas property inspectors"
      jsonLd={jsonLd}
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white">
        <div className="container section-padding">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-4">
                Home Inspectors in Houston, TX
              </h1>
              <p className="text-xl text-secondary-600 mb-6">
                Connect with TREC-licensed inspectors experienced in Houston's unique property challenges
              </p>
              <SearchBar 
                placeholder="Search by ZIP code or neighborhood" 
                className="max-w-2xl mx-auto"
              />
            </div>

            {/* Local Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary-600">600+</div>
                <div className="text-sm text-secondary-600">TREC Licensed</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary-600">$300-550</div>
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
            <h2 className="text-3xl font-bold mb-8">Why Home Inspections Are Critical in Houston</h2>
            
            <div className="prose max-w-none text-secondary-600">
              <p className="mb-6">
                Houston's subtropical climate, with high humidity, heavy rainfall, and hurricane risk, creates 
                unique challenges for homeowners. The city's expansive clay soil leads to foundation issues, 
                while the Gulf Coast location means properties face threats from flooding, wind damage, and 
                extreme heat. Whether buying in The Heights, Sugar Land, or The Woodlands, understanding these 
                regional factors is essential.
              </p>

              <h3 className="text-2xl font-semibold mb-4 text-secondary-900">Common Issues in Houston Properties</h3>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h4 className="font-semibold mb-2">Climate-Related Concerns</h4>
                  <ul className="list-disc list-inside space-y-1 text-secondary-600">
                    <li>Foundation movement from clay soil expansion</li>
                    <li>HVAC system strain from extreme heat/humidity</li>
                    <li>Roof damage from hurricanes and storms</li>
                    <li>Mold and mildew from high humidity</li>
                    <li>Termite and pest infestations</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Structural Issues</h4>
                  <ul className="list-disc list-inside space-y-1 text-secondary-600">
                    <li>Slab foundation cracks and settling</li>
                    <li>Plumbing leaks under slab (common in 1960s-80s homes)</li>
                    <li>Stucco and siding moisture intrusion</li>
                    <li>Window and door alignment problems</li>
                    <li>Drainage and grading issues</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-2xl font-semibold mb-4 text-secondary-900">Houston-Specific Inspection Requirements</h3>
              <p className="mb-4">
                Texas Real Estate Commission (TREC) standards and Houston's unique conditions require specialized inspection focus:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-6">
                <li><strong>TREC License:</strong> All inspectors must be licensed by the Texas Real Estate Commission</li>
                <li><strong>WDI Inspection:</strong> Wood Destroying Insect inspection crucial due to termite prevalence</li>
                <li><strong>Flood History:</strong> Review of FEMA flood maps and flood disclosure requirements</li>
                <li><strong>Pool/Spa Inspection:</strong> Common in Houston, requires specialized certification</li>
                <li><strong>Windstorm Certification:</strong> Important for insurance in coastal counties</li>
                <li><strong>Foundation Evaluation:</strong> Often requires separate structural engineer assessment</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Neighborhoods Section */}
      <section className="section-padding bg-secondary-50">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Areas We Serve in Greater Houston</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Central Houston</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Downtown & Midtown</li>
                  <li>The Heights & Garden Oaks</li>
                  <li>Montrose & River Oaks</li>
                  <li>Museum District & Medical Center</li>
                  <li>Rice Village & West University</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">West Houston</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Sugar Land & Missouri City</li>
                  <li>Katy & Cinco Ranch</li>
                  <li>Memorial & Energy Corridor</li>
                  <li>Richmond & Rosenberg</li>
                  <li>Bellaire & Meyerland</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">North Houston</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>The Woodlands & Spring</li>
                  <li>Cypress & Tomball</li>
                  <li>Conroe & Montgomery</li>
                  <li>Kingwood & Atascocita</li>
                  <li>Humble & Porter</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">South Houston</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Pearland & Friendswood</li>
                  <li>Clear Lake & League City</li>
                  <li>Webster & Seabrook</li>
                  <li>Pasadena & Deer Park</li>
                  <li>Texas City & La Marque</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">East Houston</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Baytown & La Porte</li>
                  <li>Channelview & Crosby</li>
                  <li>Galena Park & Jacinto City</li>
                  <li>Sheldon & Barrett</li>
                  <li>Highlands & Mont Belvieu</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Inner Loop Areas</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Galleria & Uptown</li>
                  <li>Washington Avenue & Rice Military</li>
                  <li>East End & Second Ward</li>
                  <li>Third Ward & University of Houston</li>
                  <li>Sharpstown & Gulfton</li>
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
            <h2 className="text-3xl font-bold text-center mb-12">Top-Rated Houston Home Inspectors</h2>
            
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
                    <p className="text-secondary-600 mb-4">{inspector.certifications?.join(', ') || 'TREC Licensed & Insured'}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-primary-600">${inspector.price_range || '350-500'}</span>
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
              <Link href="/tx/houston/inspectors" className="btn btn-primary">
                View All Houston Inspectors
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
                <h3 className="text-xl font-semibold mb-3">How much does a home inspection cost in Houston?</h3>
                <p className="text-secondary-600">
                  Home inspection costs in Houston typically range from $300 to $550 for average-sized homes 
                  (1,500-3,000 sq ft). Larger homes over 3,500 sq ft may cost $600-800. Additional services 
                  like termite inspection ($75-150), pool inspection ($150-250), or thermal imaging ($150-200) 
                  increase the total cost. Many inspectors offer bundled packages for comprehensive coverage.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Why are foundation inspections so important in Houston?</h3>
                <p className="text-secondary-600">
                  Houston's expansive clay soil expands when wet and contracts when dry, causing significant 
                  foundation movement. This can lead to cracks, uneven floors, and structural damage. Most 
                  Houston homes are built on slab foundations, making early detection crucial. If foundation 
                  issues are suspected, a structural engineer evaluation ($300-500) may be recommended.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Should I get a termite inspection in Houston?</h3>
                <p className="text-secondary-600">
                  Absolutely. Houston's warm, humid climate makes it a high-risk area for termites, particularly 
                  Formosan and subterranean species. A Wood Destroying Insect (WDI) report is often required 
                  by lenders and costs $75-150. Many inspectors are licensed to perform both home and termite 
                  inspections, saving time and money.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">What about flood risk assessment?</h3>
                <p className="text-secondary-600">
                  Given Houston's flooding history (Harvey, Tax Day floods, etc.), understanding flood risk is 
                  essential. Inspectors will note the property's location relative to flood zones, check for 
                  proper drainage, and identify any previous flood damage. They'll recommend reviewing FEMA 
                  flood maps and obtaining elevation certificates for properties in or near flood zones.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">What's included in a standard TREC inspection?</h3>
                <p className="text-secondary-600">
                  TREC-licensed inspectors follow standardized protocols covering: structural systems, electrical 
                  systems, HVAC, plumbing, roof, attic, interior/exterior walls, windows/doors, fireplaces, and 
                  appliances. The report uses TREC's format with four ratings: Inspected (I), Not Inspected (NI), 
                  Not Present (NP), and Deficient (D). You'll receive a detailed report within 24-48 hours.
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
              Ready to Schedule Your Houston Home Inspection?
            </h2>
            <p className="text-xl mb-8 text-primary-100">
              Compare quotes from TREC-licensed inspectors and protect your investment
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/get-quotes" className="btn bg-white text-primary-600 hover:bg-primary-50">
                Get Free Quotes
              </Link>
              <Link href="/tx/houston/inspectors" className="btn border-2 border-white text-white hover:bg-primary-700">
                Browse Inspectors
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}