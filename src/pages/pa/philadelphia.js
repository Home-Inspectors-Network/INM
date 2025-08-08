import Layout from '../../components/Layout';
import SearchBar from '../../components/SearchBar';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

export default function PhiladelphiaHomeInspectors() {
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
        .eq('city', 'Philadelphia')
        .eq('state', 'PA')
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
    "name": "Home Inspectors in Philadelphia, PA - Licensed Property Inspectors",
    "description": "Find certified home inspectors in Philadelphia and Greater Philadelphia area. Compare prices, read reviews, and book inspections for properties in the City of Brotherly Love.",
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
            "@id": "https://inspectorsnearme.com/pa",
            "name": "Pennsylvania"
          }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@id": "https://inspectorsnearme.com/pa/philadelphia",
            "name": "Philadelphia"
          }
        }
      ]
    },
    "mainEntity": {
      "@type": "LocalBusiness",
      "name": "Home Inspectors in Philadelphia",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Philadelphia",
        "addressRegion": "PA",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 39.9526,
        "longitude": -75.1652
      },
      "areaServed": [
        "Philadelphia County",
        "Montgomery County",
        "Bucks County",
        "Delaware County",
        "Chester County"
      ]
    }
  };

  return (
    <Layout
      title="Home Inspectors in Philadelphia, PA | Licensed Property Inspectors Near You"
      description="Find certified home inspectors in Philadelphia. Compare prices, read reviews, and book inspections for historic rowhomes, new construction, and everything in between. All inspectors are Pennsylvania licensed and insured."
      keywords="home inspectors Philadelphia, property inspection Philadelphia PA, Philly home inspection, Pennsylvania property inspectors, Philadelphia rowhome inspection, Main Line inspectors"
      jsonLd={jsonLd}
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white">
        <div className="container section-padding">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-4">
                Home Inspectors in Philadelphia, PA
              </h1>
              <p className="text-xl text-secondary-600 mb-6">
                Expert inspectors for Philadelphia's unique mix of historic and modern properties
              </p>
              <SearchBar 
                placeholder="Search by ZIP code or neighborhood" 
                className="max-w-2xl mx-auto"
              />
            </div>

            {/* Local Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary-600">350+</div>
                <div className="text-sm text-secondary-600">Licensed Inspectors</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary-600">$375-625</div>
                <div className="text-sm text-secondary-600">Average Cost</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary-600">4.7/5</div>
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
            <h2 className="text-3xl font-bold mb-8">Why Home Inspections Matter in Philadelphia</h2>
            
            <div className="prose max-w-none text-secondary-600">
              <p className="mb-6">
                Philadelphia's housing stock is among the oldest in the nation, with many rowhomes dating back 
                to the 1800s. From colonial-era buildings in Old City to Victorian twins in West Philly, and 
                modern condos in Northern Liberties, each property type presents unique challenges. The city's 
                age, combined with varying maintenance over centuries, makes thorough inspections essential for 
                protecting your investment.
              </p>

              <h3 className="text-2xl font-semibold mb-4 text-secondary-900">Common Issues in Philadelphia Properties</h3>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h4 className="font-semibold mb-2">Historic Home Concerns</h4>
                  <ul className="list-disc list-inside space-y-1 text-secondary-600">
                    <li>Lead paint (pre-1978 homes)</li>
                    <li>Asbestos in insulation and tiles</li>
                    <li>Knob-and-tube or cloth wiring</li>
                    <li>Deteriorating plaster walls</li>
                    <li>Original wood windows and efficiency</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Structural & System Issues</h4>
                  <ul className="list-disc list-inside space-y-1 text-secondary-600">
                    <li>Foundation settling in rowhomes</li>
                    <li>Shared wall integrity (party walls)</li>
                    <li>Aging cast iron and lead pipes</li>
                    <li>Flat roof drainage problems</li>
                    <li>Outdated electrical panels (fuses)</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-2xl font-semibold mb-4 text-secondary-900">Philadelphia-Specific Inspection Considerations</h3>
              <p className="mb-4">
                Philadelphia properties require specialized knowledge of local building practices and regulations:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-6">
                <li><strong>L&I Compliance:</strong> Licenses and Inspections department requirements for permits and code violations</li>
                <li><strong>Lead Certification:</strong> Required disclosure and testing for pre-1978 properties</li>
                <li><strong>Historic District Rules:</strong> Special considerations for properties in designated historic areas</li>
                <li><strong>Oil Tank Inspection:</strong> Many older homes have buried oil tanks requiring inspection/removal</li>
                <li><strong>Sewer Lateral Inspection:</strong> Critical for properties with clay pipes prone to root intrusion</li>
                <li><strong>Radon Testing:</strong> Recommended throughout southeastern Pennsylvania</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Neighborhoods Section */}
      <section className="section-padding bg-secondary-50">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Areas We Serve in Greater Philadelphia</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Center City & Surrounds</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Rittenhouse Square & Washington Square</li>
                  <li>Old City & Society Hill</li>
                  <li>Fairmount & Spring Garden</li>
                  <li>Graduate Hospital & Point Breeze</li>
                  <li>Queen Village & Bella Vista</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Northwest Philadelphia</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Chestnut Hill & Mt. Airy</li>
                  <li>Germantown & East Mt. Airy</li>
                  <li>Roxborough & Manayunk</li>
                  <li>East Falls & Wissahickon</li>
                  <li>West Oak Lane & East Oak Lane</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Northeast Philadelphia</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Fishtown & Northern Liberties</li>
                  <li>Port Richmond & Bridesburg</li>
                  <li>Fox Chase & Burholme</li>
                  <li>Mayfair & Tacony</li>
                  <li>Bustleton & Somerton</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">South Philadelphia</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Passyunk Square & East Passyunk</li>
                  <li>Italian Market & Bella Vista</li>
                  <li>Pennsport & Whitman</li>
                  <li>Grays Ferry & Southwest Philly</li>
                  <li>Sports Complex Area</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Main Line & Suburbs</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Ardmore & Haverford</li>
                  <li>Bryn Mawr & Villanova</li>
                  <li>Wayne & Radnor</li>
                  <li>Media & Swarthmore</li>
                  <li>West Chester & Downingtown</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Montgomery/Bucks Counties</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>King of Prussia & Conshohocken</li>
                  <li>Ambler & Blue Bell</li>
                  <li>Doylestown & New Hope</li>
                  <li>Lansdale & Montgomeryville</li>
                  <li>Warrington & Warminster</li>
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
            <h2 className="text-3xl font-bold text-center mb-12">Top-Rated Philadelphia Home Inspectors</h2>
            
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
                    <p className="text-secondary-600 mb-4">{inspector.certifications?.join(', ') || 'PA Licensed & Insured'}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-primary-600">${inspector.price_range || '400-600'}</span>
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
              <Link href="/pa/philadelphia/inspectors" className="btn btn-primary">
                View All Philadelphia Inspectors
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
                <h3 className="text-xl font-semibold mb-3">How much does a home inspection cost in Philadelphia?</h3>
                <p className="text-secondary-600">
                  Home inspection costs in Philadelphia typically range from $375 to $625, depending on property 
                  size and type. Rowhomes and condos usually cost $350-450, while larger single-family homes 
                  range from $450-625. Historic properties or those requiring specialized inspections (lead, 
                  asbestos, oil tanks) may cost more. Many inspectors offer package deals including radon 
                  testing ($100-150) and sewer scope inspection ($200-300).
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">What's special about inspecting Philadelphia rowhomes?</h3>
                <p className="text-secondary-600">
                  Philadelphia rowhomes require special attention to shared walls (party walls), which can 
                  transmit water damage between units. Inspectors check for proper firewall separation, 
                  signs of settling that affect multiple homes, and roof/gutter systems that may be shared. 
                  Common issues include deteriorating mortar, sagging joists from removed walls, and 
                  moisture intrusion from neighboring properties.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Is lead paint testing required in Philadelphia?</h3>
                <p className="text-secondary-600">
                  While not required for all transactions, lead paint disclosure is mandatory for homes built 
                  before 1978. Many Philadelphia homes contain lead paint, especially in neighborhoods like 
                  Society Hill and Fairmount. Testing costs $200-400 and is highly recommended if you have 
                  young children. Certified renovators must follow RRP (Renovation, Repair, and Painting) 
                  rules when disturbing lead paint.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Should I get a sewer scope inspection?</h3>
                <p className="text-secondary-600">
                  Yes, especially for properties built before 1950. Philadelphia's aging infrastructure includes 
                  many clay sewer laterals prone to root intrusion, cracks, and collapse. The city's "point of 
                  sale" ordinance doesn't require lateral inspection, but problems are common. A sewer scope 
                  ($200-300) can identify issues before they become expensive emergencies ($3,000-10,000 for 
                  replacement).
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">What about buried oil tanks?</h3>
                <p className="text-secondary-600">
                  Many older Philadelphia homes, particularly in Northwest Philly and the suburbs, have buried 
                  oil tanks from when oil heat was common. These tanks can leak, causing expensive environmental 
                  cleanup ($10,000+). Tank sweep inspection ($200-300) uses ground-penetrating radar to locate 
                  buried tanks. If found, proper decommissioning costs $1,500-2,500.
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
              Ready to Schedule Your Philadelphia Home Inspection?
            </h2>
            <p className="text-xl mb-8 text-primary-100">
              Compare quotes from licensed Pennsylvania inspectors familiar with Philly's unique properties
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/get-quotes" className="btn bg-white text-primary-600 hover:bg-primary-50">
                Get Free Quotes
              </Link>
              <Link href="/pa/philadelphia/inspectors" className="btn border-2 border-white text-white hover:bg-primary-700">
                Browse Inspectors
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}