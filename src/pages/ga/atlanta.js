import Layout from '../../components/Layout';
import SearchBar from '../../components/SearchBar';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

export default function AtlantaHomeInspectors() {
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
        .eq('city', 'Atlanta')
        .eq('state', 'GA')
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
    "name": "Home Inspectors in Atlanta, GA - Licensed Property Inspectors",
    "description": "Find certified home inspectors in Atlanta, Georgia. Compare prices, read reviews, and book inspections for properties in Metro Atlanta, Fulton, DeKalb, and surrounding counties.",
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
            "@id": "https://inspectorsnearme.com/ga",
            "name": "Georgia"
          }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@id": "https://inspectorsnearme.com/ga/atlanta",
            "name": "Atlanta"
          }
        }
      ]
    },
    "mainEntity": {
      "@type": "LocalBusiness",
      "name": "Home Inspectors in Atlanta",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Atlanta",
        "addressRegion": "GA",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 33.7490,
        "longitude": -84.3880
      },
      "areaServed": [
        "Buckhead",
        "Midtown",
        "Decatur",
        "Sandy Springs",
        "Marietta",
        "Alpharetta",
        "Roswell",
        "Johns Creek"
      ]
    }
  };

  return (
    <Layout
      title="Home Inspectors in Atlanta, GA | Licensed Property Inspectors Near You"
      description="Find certified home inspectors in Atlanta, Georgia. Compare prices, read reviews, and book inspections for properties in Metro Atlanta. All inspectors are licensed and insured."
      keywords="home inspectors Atlanta, property inspection Atlanta GA, Atlanta home inspection, Metro Atlanta inspectors, Georgia property inspection, Fulton County inspectors"
      jsonLd={jsonLd}
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white">
        <div className="container section-padding">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-4">
                Home Inspectors in Atlanta, GA
              </h1>
              <p className="text-xl text-secondary-600 mb-6">
                Connect with licensed property inspectors serving Metro Atlanta and North Georgia
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
            <h2 className="text-3xl font-bold mb-8">Why Home Inspections Matter in Atlanta</h2>
            
            <div className="prose max-w-none text-secondary-600">
              <p className="mb-6">
                Atlanta's diverse housing market spans from historic neighborhoods with century-old homes to 
                rapidly developing suburbs with new construction. The city's humid subtropical climate, clay soil, 
                and mature tree canopy create unique challenges that require experienced local inspectors who 
                understand Georgia's specific building requirements and environmental conditions.
              </p>

              <h3 className="text-2xl font-semibold mb-4 text-secondary-900">Common Issues in Atlanta Properties</h3>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h4 className="font-semibold mb-2">Climate & Environmental Concerns</h4>
                  <ul className="list-disc list-inside space-y-1 text-secondary-600">
                    <li>High humidity causing mold and mildew</li>
                    <li>Foundation issues from expansive clay soil</li>
                    <li>Tree root damage to foundations and pipes</li>
                    <li>Termite and pest infestations</li>
                    <li>Storm damage from severe weather</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Structural Considerations</h4>
                  <ul className="list-disc list-inside space-y-1 text-secondary-600">
                    <li>Older home electrical systems (knob-and-tube)</li>
                    <li>Polybutylene plumbing in 1980s-90s homes</li>
                    <li>HVAC efficiency in hot summers</li>
                    <li>Roof damage from storms and debris</li>
                    <li>Deck and porch structural integrity</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-2xl font-semibold mb-4 text-secondary-900">Atlanta-Specific Inspection Focus Areas</h3>
              <p className="mb-4">
                Professional inspectors in Atlanta pay special attention to:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-6">
                <li><strong>Foundation & Grading:</strong> Clay soil expansion/contraction causing settlement and cracks</li>
                <li><strong>Moisture Control:</strong> Proper ventilation in crawl spaces and attics to prevent mold</li>
                <li><strong>Tree Assessment:</strong> Proximity of large trees to structures and underground utilities</li>
                <li><strong>Historic Home Features:</strong> Lead paint, asbestos, outdated wiring in older neighborhoods</li>
                <li><strong>Energy Efficiency:</strong> Insulation and HVAC performance for hot, humid summers</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Neighborhoods Section */}
      <section className="section-padding bg-secondary-50">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Areas We Serve in Metro Atlanta</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Atlanta Proper</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Buckhead</li>
                  <li>Midtown</li>
                  <li>Virginia-Highland</li>
                  <li>Grant Park</li>
                  <li>West End</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">North Metro</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Sandy Springs</li>
                  <li>Roswell</li>
                  <li>Alpharetta</li>
                  <li>Johns Creek</li>
                  <li>Dunwoody</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">East Metro</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Decatur</li>
                  <li>Stone Mountain</li>
                  <li>Tucker</li>
                  <li>Lithonia</li>
                  <li>Clarkston</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">West Metro</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Marietta</li>
                  <li>Smyrna</li>
                  <li>Vinings</li>
                  <li>Austell</li>
                  <li>Powder Springs</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">South Metro</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>East Point</li>
                  <li>College Park</li>
                  <li>Union City</li>
                  <li>Fairburn</li>
                  <li>Palmetto</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Nearby Counties</h3>
                <ul className="space-y-2 text-secondary-600">
                  <li>Gwinnett County</li>
                  <li>Cobb County</li>
                  <li>DeKalb County</li>
                  <li>Fulton County</li>
                  <li>Clayton County</li>
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
            <h2 className="text-3xl font-bold text-center mb-12">Top-Rated Atlanta Home Inspectors</h2>
            
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
                      <span className="font-semibold text-primary-600">${inspector.price_range || '300-500'}</span>
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
              <Link href="/ga/atlanta/inspectors" className="btn btn-primary">
                View All Atlanta Inspectors
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
                <h3 className="text-xl font-semibold mb-3">How much does a home inspection cost in Atlanta?</h3>
                <p className="text-secondary-600">
                  Home inspection costs in Atlanta typically range from $300 to $550 for most single-family homes. 
                  Condos and townhomes usually cost $250-$400. Prices vary based on the property's size, age, and 
                  additional services requested. Larger homes over 3,500 sq ft or historic properties may cost $600 
                  or more. Many inspectors offer bundled services including radon testing ($125-150) or termite 
                  inspections ($75-125).
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">What are the most common issues found in Atlanta homes?</h3>
                <p className="text-secondary-600">
                  Common issues in Atlanta homes include foundation problems due to expansive clay soil, moisture 
                  intrusion leading to mold and wood rot, outdated electrical systems in older homes, polybutylene 
                  plumbing in homes built between 1978-1995, and HVAC systems struggling with humidity control. 
                  Tree-related damage to roofs and foundations is also common due to Atlanta's extensive tree canopy.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Should I get a termite inspection in Atlanta?</h3>
                <p className="text-secondary-600">
                  Yes, termite inspections are highly recommended in Atlanta due to the warm, humid climate that's 
                  ideal for termite activity. Georgia has one of the highest termite infestation rates in the US. 
                  Many lenders require a termite inspection (Wood Destroying Organism report) before closing. The 
                  inspection typically costs $75-125 and can often be scheduled alongside your home inspection.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Do I need a radon test in Atlanta?</h3>
                <p className="text-secondary-600">
                  Radon testing is recommended in North Georgia, including parts of Metro Atlanta. While Georgia 
                  isn't considered a high-risk state overall, certain areas have elevated radon levels due to 
                  granite bedrock. The EPA recommends testing all homes below the third floor. Radon tests cost 
                  $125-150 and can be conducted during the inspection period.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">How long does an Atlanta home inspection take?</h3>
                <p className="text-secondary-600">
                  Most Atlanta home inspections take 3-4 hours for an average single-family home (2,000-3,000 sq ft). 
                  Smaller condos may only take 2-2.5 hours, while larger or older homes can take 4-5 hours. Historic 
                  homes in neighborhoods like Grant Park or Inman Park often require extra time due to their unique 
                  features and potential issues. You'll receive the full report within 24-48 hours.
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
              Ready to Schedule Your Atlanta Home Inspection?
            </h2>
            <p className="text-xl mb-8 text-primary-100">
              Compare quotes from licensed Georgia inspectors and book online today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/get-quotes" className="btn bg-white text-primary-600 hover:bg-primary-50">
                Get Free Quotes
              </Link>
              <Link href="/ga/atlanta/inspectors" className="btn border-2 border-white text-white hover:bg-primary-700">
                Browse Inspectors
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}