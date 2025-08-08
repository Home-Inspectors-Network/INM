import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import InspectorCard from '../components/InspectorCard';
import SearchBar from '../components/SearchBar';
import Link from 'next/link';

export default function Search() {
  const router = useRouter();
  const { location, lat, lng, services } = router.query;
  const [inspectors, setInspectors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState('rating');
  const [serviceFilter, setServiceFilter] = useState(services || '');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (location || (lat && lng)) {
      performSearch();
    }
  }, [location, lat, lng, sortBy, serviceFilter]);

  const performSearch = async () => {
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const params = new URLSearchParams();
      
      if (location) params.append('location', location);
      if (lat) params.append('lat', lat);
      if (lng) params.append('lng', lng);
      if (serviceFilter) params.append('services', serviceFilter);
      if (sortBy) params.append('sort', sortBy);

      const response = await fetch(`/api/inspectors/search?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setInspectors(data.inspectors || []);
      } else {
        console.error('Search failed');
        setInspectors([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setInspectors([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Comprehensive inspector types - matching our complete city buildout
  const availableServices = [
    // Home Inspectors (Foundation coverage)
    'General Home Inspection',
    'Pre-Purchase Inspection', 
    'Pre-Listing Inspection',
    'New Construction Inspection',
    
    // Termite & Pest Inspectors
    'Termite & Pest Inspection',
    'WDO (Wood Destroying Organism) Inspection',
    'Pest Control Services',
    
    // Foundation & Structural Inspectors  
    'Foundation & Structural Inspection',
    'Seismic Retrofitting Inspection',
    'Structural Engineering Assessment',
    
    // Specialty Testing Inspectors
    'Mold Inspection & Testing',
    'Radon Testing',
    'Asbestos Testing',
    'Indoor Air Quality Testing',
    'Pool & Spa Inspection',
    'Well Water Testing',
    'Septic System Inspection',
    
    // Commercial Building Inspectors
    'Commercial Building Inspection',
    'Multi-Family Property Inspection',
    
    // Advanced Services
    'Thermal Imaging',
    'Drone Inspection',
    'Energy Audit'
  ];

  const sortOptions = [
    { value: 'rating', label: 'Highest Rated' },
    { value: 'reviews', label: 'Most Reviews' },
    { value: 'experience', label: 'Most Experience' },
    { value: 'name', label: 'Name (A-Z)' }
  ];

  return (
    <Layout
      title="Search Home Inspectors"
      description="Find qualified home inspectors in your area. Compare prices, read reviews, and book inspections online."
    >
      {/* Search Header */}
      <section className="bg-primary-50 py-8">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-center mb-6">
              Find Home Inspectors
            </h1>
            <SearchBar />
          </div>
        </div>
      </section>

      <div className="container py-8">
        {/* Search Controls */}
        {hasSearched && (
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1">
              <label className="form-label">Service Type</label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full"
              >
                <option value="">All Services</option>
                {availableServices.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="form-label">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-secondary-600">Searching for inspectors...</p>
          </div>
        ) : hasSearched ? (
          <>
            {/* Results Header */}
            {inspectors.length > 0 && (
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  {inspectors.length} Inspector{inspectors.length !== 1 ? 's' : ''} Found
                  {location && ` in ${location}`}
                </h2>
                <div className="text-sm text-secondary-600">
                  Sorted by {sortOptions.find(opt => opt.value === sortBy)?.label}
                </div>
              </div>
            )}

            {/* Results Grid */}
            {inspectors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inspectors.map((inspector) => (
                  <InspectorCard key={inspector.id} inspector={inspector} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-secondary-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  No inspectors found
                </h3>
                <p className="text-secondary-600 mb-6">
                  Try searching a different location or adjusting your criteria.
                </p>
                <Link href="/" className="btn-primary">
                  Start New Search
                </Link>
              </div>
            )}
          </>
        ) : (
          // No search performed yet
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-secondary-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              Search for Home Inspectors
            </h3>
            <p className="text-secondary-600 mb-6">
              Enter your location above to find qualified inspectors in your area.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <Link href="/ca/san-francisco" className="card p-4 text-center hover:shadow-md transition-shadow">
                <h4 className="font-semibold mb-2">San Francisco, CA</h4>
                <p className="text-sm text-secondary-600">22 certified inspectors</p>
              </Link>
              <Link href="/ca/oakland" className="card p-4 text-center hover:shadow-md transition-shadow">
                <h4 className="font-semibold mb-2">Oakland, CA</h4>
                <p className="text-sm text-secondary-600">Browse inspectors</p>
              </Link>
              <Link href="/ca/san-jose" className="card p-4 text-center hover:shadow-md transition-shadow">
                <h4 className="font-semibold mb-2">San Jose, CA</h4>
                <p className="text-sm text-secondary-600">Browse inspectors</p>
              </Link>
            </div>
          </div>
        )}

        {/* Popular Searches */}
        {!hasSearched && (
          <section className="mt-16 pt-8 border-t border-secondary-200">
            <h2 className="text-2xl font-bold text-center mb-8">
              Popular Searches
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {availableServices.slice(0, 8).map((service) => (
                <button
                  key={service}
                  onClick={() => setServiceFilter(service)}
                  className="text-center p-3 rounded-lg border border-secondary-200 hover:border-primary-500 hover:bg-primary-50 transition-all"
                >
                  <span className="text-sm text-secondary-700 hover:text-primary-600">
                    {service}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}