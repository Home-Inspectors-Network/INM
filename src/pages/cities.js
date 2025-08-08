import Layout from '../components/Layout';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export default function Cities() {
  const [citiesByState, setCitiesByState] = useState({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStates: 0,
    totalCities: 0,
    totalInspectors: 0
  });

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      // Get all unique cities with inspector counts
      const { data, error } = await supabase
        .from('inspectors')
        .select('state, city')
        .order('state', { ascending: true })
        .order('city', { ascending: true });

      if (error) throw error;

      // Group cities by state and count inspectors
      const grouped = {};
      const cityInspectorCount = {};
      
      data.forEach(inspector => {
        if (inspector.state && inspector.city) {
          if (!grouped[inspector.state]) {
            grouped[inspector.state] = new Set();
          }
          grouped[inspector.state].add(inspector.city);
          
          const key = `${inspector.state}-${inspector.city}`;
          cityInspectorCount[key] = (cityInspectorCount[key] || 0) + 1;
        }
      });

      // Convert to array format with inspector counts
      const result = {};
      let totalCities = 0;
      
      Object.keys(grouped).sort().forEach(state => {
        const cities = Array.from(grouped[state]).sort().map(city => ({
          name: city,
          count: cityInspectorCount[`${state}-${city}`] || 0,
          slug: `${city.toLowerCase().replace(/\s+/g, '-')}`
        }));
        result[state] = cities;
        totalCities += cities.length;
      });

      setCitiesByState(result);
      setStats({
        totalStates: Object.keys(result).length,
        totalCities: totalCities,
        totalInspectors: data.length
      });
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      setLoading(false);
    }
  };

  // State full names mapping
  const stateNames = {
    'AL': 'Alabama',
    'AZ': 'Arizona',
    'CA': 'California',
    'CO': 'Colorado',
    'DC': 'District of Columbia',
    'FL': 'Florida',
    'GA': 'Georgia',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'NY': 'New York',
    'PA': 'Pennsylvania',
    'TX': 'Texas',
    'WA': 'Washington'
  };

  // Featured metros for hero section
  const featuredMetros = [
    { name: 'New York', state: 'NY', icon: '🗽' },
    { name: 'Los Angeles', state: 'CA', icon: '🌴' },
    { name: 'Chicago', state: 'IL', icon: '🏙️' },
    { name: 'Houston', state: 'TX', icon: '🤠' },
    { name: 'Phoenix', state: 'AZ', icon: '🌵' },
    { name: 'Philadelphia', state: 'PA', icon: '🔔' },
    { name: 'San Francisco', state: 'CA', icon: '🌉' },
    { name: 'Dallas', state: 'TX', icon: '⭐' },
    { name: 'Miami', state: 'FL', icon: '🏖️' },
    { name: 'Boston', state: 'MA', icon: '🦞' },
    { name: 'Atlanta', state: 'GA', icon: '🍑' },
    { name: 'Seattle', state: 'WA', icon: '☕' }
  ];

  return (
    <Layout
      title="Find Home Inspectors by City | All Service Areas"
      description="Browse our complete directory of home inspectors organized by city and state. Find certified property inspectors in your area."
      keywords="home inspectors by city, property inspection locations, find local home inspector"
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white">
        <div className="container section-padding">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-4">
              Home Inspectors Available Nationwide
            </h1>
            <p className="text-xl text-secondary-600 mb-8">
              Browse our directory of certified inspectors across {stats.totalStates} states and {stats.totalCities} cities
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary-600">{stats.totalStates}</div>
                <div className="text-sm text-secondary-600">States</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary-600">{stats.totalCities}</div>
                <div className="text-sm text-secondary-600">Cities</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary-600">{stats.totalInspectors.toLocaleString()}</div>
                <div className="text-sm text-secondary-600">Inspectors</div>
              </div>
            </div>

            {/* Featured Metros */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-6">Popular Metro Areas</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {featuredMetros.map((metro) => (
                  <Link
                    key={`${metro.state}-${metro.name}`}
                    href={`/${metro.state.toLowerCase()}/${metro.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="bg-white p-4 rounded-lg border border-secondary-200 hover:border-primary-500 hover:shadow-md transition-all"
                  >
                    <div className="text-2xl mb-2">{metro.icon}</div>
                    <div className="font-medium text-secondary-900">{metro.name}</div>
                    <div className="text-sm text-secondary-600">{metro.state}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cities by State */}
      <section className="section-padding">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            All Cities by State
          </h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto">
              {Object.entries(citiesByState).map(([state, cities]) => (
                <div key={state} className="mb-10">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b">
                    <h3 className="text-2xl font-semibold text-secondary-800">
                      {stateNames[state] || state}
                    </h3>
                    <Link 
                      href={`/${state.toLowerCase()}-home-inspectors`}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View All {state} Inspectors →
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {cities.map((city) => (
                      <Link
                        key={city.name}
                        href={`/${state.toLowerCase()}/${city.slug}`}
                        className="group"
                      >
                        <div className="p-3 rounded-lg border border-secondary-200 hover:border-primary-500 hover:bg-primary-50 transition-all">
                          <div className="font-medium text-secondary-900 group-hover:text-primary-600">
                            {city.name}
                          </div>
                          <div className="text-sm text-secondary-600">
                            {city.count} inspector{city.count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SEO Content */}
          <div className="max-w-4xl mx-auto mt-16">
            <div className="bg-secondary-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-4">Find Local Home Inspectors</h2>
              <p className="text-secondary-700 mb-4">
                Our directory connects you with certified home inspectors across the United States. 
                Whether you're buying a new home, selling your property, or need a routine inspection, 
                we have qualified professionals in your area.
              </p>
              <p className="text-secondary-700 mb-4">
                All inspectors in our network are licensed, insured, and experienced in residential 
                property inspections. Browse by state and city to find inspectors near you, compare 
                prices, read reviews, and book your inspection online.
              </p>
              <h3 className="text-xl font-semibold mb-3 mt-6">Coverage Areas</h3>
              <p className="text-secondary-700">
                We currently serve {stats.totalCities} cities across {stats.totalStates} states, 
                with coverage expanding regularly. Major metropolitan areas including New York, 
                Los Angeles, Chicago, Houston, and Phoenix have extensive inspector networks, 
                while we're also proud to serve smaller communities throughout the country.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white section-padding">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Can't Find Your City?
            </h2>
            <p className="text-xl mb-8 text-primary-100">
              We're constantly expanding our network. Let us know where you need an inspector!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="btn bg-white text-primary-600 hover:bg-primary-50">
                Request Coverage
              </Link>
              <Link href="/inspectors/join" className="btn border-2 border-white text-white hover:bg-primary-700">
                Inspectors: Join Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}