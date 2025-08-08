import Layout from '../../components/Layout';
import SearchBar from '../../components/SearchBar';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

export default function DallasHomeInspectors() {
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
        .eq('city', 'Dallas')
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
    "name": "Home Inspectors in Dallas, TX - Licensed Property Inspectors",
    "description": "Find certified home inspectors in Dallas-Fort Worth metroplex. Compare prices, read reviews, and book TREC-licensed inspections for properties throughout DFW.",
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
            "@id": "https://inspectorsnearme.com/tx/dallas",
            "name": "Dallas"
          }
        }
      ]
    },
    "mainEntity": {
      "@type": "LocalBusiness",
      "name": "Home Inspectors in Dallas",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Dallas",
        "addressRegion": "TX",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 32.7767,
        "longitude": -96.7970
      },
      "areaServed": [
        "Dallas County",
        "Tarrant County",
        "Collin County",
        "Denton County",
        "Rockwall County"
      ]
    }
  };

  return (
    <Layout
      title="Home Inspectors in Dallas, TX | TREC Licensed DFW Property Inspectors"
      description="Find TREC-licensed home inspectors in Dallas-Fort Worth. Compare prices, read reviews, and book inspections for properties throughout the DFW metroplex. Experienced with North Texas property conditions."
      keywords="home inspectors Dallas, property inspection Dallas TX, DFW home inspection, TREC licensed inspectors Dallas, Dallas Fort Worth inspectors, North Texas property inspection"
      jsonLd={jsonLd}
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white">
        <div className="container section-padding">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-4">
                Home Inspectors in Dallas, TX
              </h1>
              <p className="text-xl text-secondary-600 mb-6">
                Connect with TREC-licensed inspectors serving Dallas-Fort Worth metroplex
              </p>
              <SearchBar 
                placeholder="Search by ZIP code or neighborhood" 
                className="max-w-2xl mx-auto"
              />
            </div>

            {/* Local Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary-600">750+</div>
                <div className="text-sm text-secondary-600">TREC Licensed</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary-600">$325-575</div>
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
            <h2 className="text-3xl font-bold mb-8">Why Home Inspections Matter in Dallas-Fort Worth</h2>
            
            <div className="prose max-w-none text-secondary-600">
              <p className="mb-6">
                The Dallas-Fort Worth metroplex experiences extreme weather variations, from scorching summers 
                exceeding 100°F to occasional ice storms and tornadoes. The region's expansive clay soil, similar 
                to Houston, creates foundation challenges, while rapid growth means homes range from historic 
                properties in Oak Cliff to brand-new construction in Frisco. Each property type and area presents 
                unique inspection considerations.
              </p>

              <h3 className="text-2xl font-semibold mb-4 text-secondary-900">Common Issues in DFW Properties</h3>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h4 className="font-semibold mb-2">Foundation & Structural</h4>
                  <ul className="list-disc list-inside space-y-1 text-secondary-600">
                    <li>Foundation movement from clay soil</li>
                    <li>Pier and beam foundation issues in older homes</li>
                    <li>Brick veneer cracks and separation</li>
                    <li>Door and window alignment problems</li>
                    <li>Concrete driveway and sidewalk cracks</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Weather-Related Damage</h4>
                  <ul className="list-disc list-inside space-y-1 text-secondary-600">
                    <li>Hail damage to roofs and siding</li>
                    <li>HVAC system strain from temperature extremes</li>
                    <li>Attic ventilation and insulation issues</li>
                    <li>Gutter and drainage problems</li>
                    <li>Tree damage from storms and drought</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-2xl font-semibold mb-4 text-secondary-900">Dallas-Specific Inspection Focus Areas</h3>
              <p className="mb-4">
                North Texas properties require attention to specific regional factors:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-6">
                <li><strong>Cast Iron Plumbing:</strong> Common in homes built before 1980, prone to deterioration</li>
                <li><strong>Polybutylene Pipes:</strong> Used in 1978-1995 construction, known for failures</li>
                <li><strong>CSST Gas Lines:</strong> Require proper bonding for lightning protection</li>
                <li><strong>Aluminum Wiring:</strong> Found in 1960s-70s homes, fire hazard if not properly maintained</li>
                <li><strong>Expansive Soil Reports:</strong> Critical for understanding foundation risks</li>
                <li><strong>Storm Shelters:</strong> Increasingly common, require proper ventilation and access</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Neighborhoods Section */}
      <section className="section-padding bg-secondary-50">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Areas We Serve in DFW Metroplex</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Dallas Proper</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Uptown & Downtown Dallas</li>
                  <li>Highland Park & University Park</li>
                  <li>Lakewood & White Rock Lake</li>
                  <li>Oak Cliff & Bishop Arts</li>
                  <li>Preston Hollow & North Dallas</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">North Dallas/Collin County</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Plano & West Plano</li>
                  <li>Frisco & Little Elm</li>
                  <li>McKinney & Allen</li>
                  <li>Richardson & Garland</li>
                  <li>Carrollton & Farmers Branch</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Fort Worth/Tarrant County</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Downtown Fort Worth & Sundance Square</li>
                  <li>Arlington & Grand Prairie</li>
                  <li>Southlake & Westlake</li>
                  <li>Grapevine & Colleyville</li>
                  <li>Keller & North Richland Hills</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">East Dallas/Rockwall</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Rockwall & Heath</li>
                  <li>Rowlett & Sachse</li>
                  <li>Mesquite & Balch Springs</li>
                  <li>Forney & Terrell</li>
                  <li>Wylie & Murphy</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Mid-Cities Area</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Irving & Las Colinas</li>
                  <li>Coppell & Valley Ranch</li>
                  <li>Euless & Bedford</li>
                  <li>Hurst & Richland Hills</li>
                  <li>Flower Mound & Lewisville</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">South Metro</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>DeSoto & Cedar Hill</li>
                  <li>Duncanville & Lancaster</li>
                  <li>Mansfield & Burleson</li>
                  <li>Waxahachie & Midlothian</li>
                  <li>Red Oak & Glenn Heights</li>
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
            <h2 className="text-3xl font-bold text-center mb-12">Top-Rated Dallas-Fort Worth Home Inspectors</h2>
            
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
                      <span className="font-semibold text-primary-600">${inspector.price_range || '375-525'}</span>
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
              <Link href="/tx/dallas/inspectors" className="btn btn-primary">
                View All DFW Inspectors
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
                <h3 className="text-xl font-semibold mb-3">How much does a home inspection cost in Dallas?</h3>
                <p className="text-secondary-600">
                  Home inspection costs in Dallas typically range from $325 to $575 for average homes (2,000-3,500 sq ft). 
                  Smaller condos and townhomes may start at $275, while larger luxury homes can exceed $700. Additional 
                  services like pool inspection ($125-200), termite inspection ($75-125), or thermal imaging ($150-200) 
                  are often recommended. Many DFW inspectors offer package deals for multiple services.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">What's the deal with foundation issues in Dallas?</h3>
                <p className="text-secondary-600">
                  Dallas sits on expansive clay soil that can shrink or swell by 10% with moisture changes, causing 
                  foundation movement. Signs include diagonal cracks in walls, doors that won't close, and uneven floors. 
                  Most inspectors check for these issues, but serious concerns may require a structural engineer 
                  evaluation ($300-500). Foundation repairs can range from minor ($3,000) to major ($15,000+).
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Should I worry about cast iron pipes in older Dallas homes?</h3>
                <p className="text-secondary-600">
                  Yes, cast iron sewer pipes were commonly used in Dallas homes built before 1980 and have a 50-75 
                  year lifespan. They're prone to corrosion and root intrusion. A sewer scope inspection ($200-350) 
                  can identify problems before they cause backups. Replacement costs vary widely ($4,000-20,000+) 
                  depending on accessibility and extent of damage.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">How important is hail damage inspection in DFW?</h3>
                <p className="text-secondary-600">
                  Critical. North Texas experiences frequent hailstorms, especially March through May. Even small 
                  hail can damage roofs, reducing their lifespan. Inspectors look for dented shingles, exposed mat, 
                  and granule loss. Recent hail damage might be covered by insurance, but older damage could lead 
                  to denied claims. Always get a roof inspection before purchasing.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">What about new construction inspections in Dallas suburbs?</h3>
                <p className="text-secondary-600">
                  New construction inspections are highly recommended, even with builder warranties. Common issues 
                  include improper grading, HVAC problems, electrical issues, and cosmetic defects. Pre-drywall 
                  inspections ($250-350) catch hidden problems, while final inspections ensure everything works 
                  properly. Many buyers in Frisco, McKinney, and other growth areas use third-party inspectors 
                  for peace of mind.
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
              Ready to Schedule Your Dallas Home Inspection?
            </h2>
            <p className="text-xl mb-8 text-primary-100">
              Compare quotes from TREC-licensed inspectors serving all of DFW
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/get-quotes" className="btn bg-white text-primary-600 hover:bg-primary-50">
                Get Free Quotes
              </Link>
              <Link href="/tx/dallas/inspectors" className="btn border-2 border-white text-white hover:bg-primary-700">
                Browse Inspectors
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}