import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import InspectorCard from '../../components/InspectorCard';
import SearchBar from '../../components/SearchBar';
import Link from 'next/link';

export default function CityDirectory() {
  const router = useRouter();
  const { state, city } = router.query;
  const [inspectors, setInspectors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('rating');
  const [filters, setFilters] = useState({
    services: [],
    certifications: [],
    insuranceVerified: false,
    minRating: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  const [nearbyCities, setNearbyCities] = useState([]);

  useEffect(() => {
    if (state && city) {
      fetchInspectors();
      fetchNearbyCities();
    }
  }, [state, city, sortBy, filters]);

  const fetchInspectors = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        state: state,
        city: city,
        sort: sortBy,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => 
            Array.isArray(value) ? value.length > 0 : value
          )
        )
      });

      const response = await fetch(`/api/inspectors/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setInspectors(data.inspectors || []);
      }
    } catch (error) {
      console.error('Error fetching inspectors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNearbyCities = async () => {
    try {
      const response = await fetch(`/api/locations/nearby-cities?state=${state}&city=${city}`);
      if (response.ok) {
        const data = await response.json();
        setNearbyCities(data.cities || []);
      }
    } catch (error) {
      console.error('Error fetching nearby cities:', error);
    }
  };

  const formatCityName = (city) => {
    return city?.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatStateName = (state) => {
    const stateNames = {
      'al': 'Alabama', 'ak': 'Alaska', 'az': 'Arizona', 'ar': 'Arkansas', 'ca': 'California',
      'co': 'Colorado', 'ct': 'Connecticut', 'de': 'Delaware', 'fl': 'Florida', 'ga': 'Georgia',
      'hi': 'Hawaii', 'id': 'Idaho', 'il': 'Illinois', 'in': 'Indiana', 'ia': 'Iowa',
      'ks': 'Kansas', 'ky': 'Kentucky', 'la': 'Louisiana', 'me': 'Maine', 'md': 'Maryland',
      'ma': 'Massachusetts', 'mi': 'Michigan', 'mn': 'Minnesota', 'ms': 'Mississippi', 'mo': 'Missouri',
      'mt': 'Montana', 'ne': 'Nebraska', 'nv': 'Nevada', 'nh': 'New Hampshire', 'nj': 'New Jersey',
      'nm': 'New Mexico', 'ny': 'New York', 'nc': 'North Carolina', 'nd': 'North Dakota', 'oh': 'Ohio',
      'ok': 'Oklahoma', 'or': 'Oregon', 'pa': 'Pennsylvania', 'ri': 'Rhode Island', 'sc': 'South Carolina',
      'sd': 'South Dakota', 'tn': 'Tennessee', 'tx': 'Texas', 'ut': 'Utah', 'vt': 'Vermont',
      'va': 'Virginia', 'wa': 'Washington', 'wv': 'West Virginia', 'wi': 'Wisconsin', 'wy': 'Wyoming'
    };
    return stateNames[state?.toLowerCase()] || state?.toUpperCase();
  };

  const cityName = formatCityName(city);
  const stateName = formatStateName(state);

  const sortOptions = [
    { value: 'rating', label: 'Highest Rated' },
    { value: 'reviews', label: 'Most Reviews' },
    { value: 'experience', label: 'Most Experience' },
    { value: 'name', label: 'Name (A-Z)' }
  ];

  const availableServices = [
    'General Inspection',
    'New Construction',
    'Commercial Inspection',
    'Radon Testing',
    'Mold Inspection',
    'Termite Inspection',
    'HVAC Inspection',
    'Electrical Inspection',
    'Plumbing Inspection',
    'Foundation Inspection'
  ];

  const availableCertifications = [
    'ASHI Certified',
    'NAHI Certified',
    'InterNACHI Certified',
    'AHIT Certified',
    'State Licensed',
    'FHA Approved',
    'VA Approved'
  ];

  return (
    <Layout
      title={`Home Inspectors in ${cityName}, ${stateName}`}
      description={`Find qualified home inspectors in ${cityName}, ${stateName}. Compare prices, read reviews, and book inspections from local certified professionals.`}
    >
      {/* Header */}
      <section className="bg-primary-50 py-12">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Home Inspectors in {cityName}, {stateName}
            </h1>
            <p className="text-lg text-secondary-600 mb-8">
              {inspectors.length} certified inspectors ready to help with your property inspection needs
            </p>
            <SearchBar 
              placeholder={`Search in ${cityName} or nearby cities...`}
              className="max-w-2xl mx-auto" 
            />
          </div>
        </div>
      </section>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden w-full btn-outline mb-4"
              >
                Filters & Sort
              </button>

              <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Sort */}
                <div className="card p-4">
                  <h3 className="font-semibold mb-3">Sort By</h3>
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

                {/* Services Filter */}
                <div className="card p-4">
                  <h3 className="font-semibold mb-3">Services</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableServices.map(service => (
                      <label key={service} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.services.includes(service)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({
                                ...prev,
                                services: [...prev.services, service]
                              }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                services: prev.services.filter(s => s !== service)
                              }));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Certifications Filter */}
                <div className="card p-4">
                  <h3 className="font-semibold mb-3">Certifications</h3>
                  <div className="space-y-2">
                    {availableCertifications.map(cert => (
                      <label key={cert} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.certifications.includes(cert)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({
                                ...prev,
                                certifications: [...prev.certifications, cert]
                              }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                certifications: prev.certifications.filter(c => c !== cert)
                              }));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{cert}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Other Filters */}
                <div className="card p-4">
                  <h3 className="font-semibold mb-3">Other Filters</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.insuranceVerified}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          insuranceVerified: e.target.checked
                        }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Insurance Verified</span>
                    </label>
                    
                    <div>
                      <label className="form-label text-sm">Minimum Rating</label>
                      <select
                        value={filters.minRating}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          minRating: Number(e.target.value)
                        }))}
                        className="w-full text-sm"
                      >
                        <option value={0}>Any Rating</option>
                        <option value={3}>3+ Stars</option>
                        <option value={4}>4+ Stars</option>
                        <option value={4.5}>4.5+ Stars</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => setFilters({
                    services: [],
                    certifications: [],
                    insuranceVerified: false,
                    minRating: 0
                  })}
                  className="btn-outline w-full text-sm"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="space-y-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card p-6 animate-pulse">
                    <div className="h-6 bg-secondary-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-secondary-200 rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-secondary-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-secondary-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Results Header */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">
                    {inspectors.length} Inspector{inspectors.length !== 1 ? 's' : ''} Found
                  </h2>
                  <div className="text-sm text-secondary-600">
                    Sorted by {sortOptions.find(opt => opt.value === sortBy)?.label}
                  </div>
                </div>

                {/* Inspectors Grid */}
                {inspectors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      Try adjusting your filters or search in nearby cities.
                    </p>
                    <Link href="/search" className="btn-primary">
                      Search All Areas
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Related Cities */}
        {nearbyCities.length > 0 && (
          <section className="mt-16 pt-8 border-t border-secondary-200">
            <h2 className="text-2xl font-bold text-center mb-8">
              Nearby Cities in {stateName}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {nearbyCities.map((nearbyCity) => (
                <Link 
                  key={nearbyCity}
                  href={`/${state}/${nearbyCity.toLowerCase().replace(/\s+/g, '-')}`} 
                  className="text-center p-3 rounded-lg border border-secondary-200 hover:border-primary-500 hover:bg-primary-50 transition-all"
                >
                  <span className="text-sm text-secondary-700 hover:text-primary-600">
                    {nearbyCity}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-secondary-600">
                Can't find your city? Try our 
                <Link href="/search" className="text-primary-600 hover:text-primary-700 ml-1">
                  advanced search
                </Link>
              </p>
            </div>
          </section>
        )}

        {/* Local SEO Content */}
        <section className="mt-16 pt-8 border-t border-secondary-200">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">
              Home Inspection Services in {cityName}, {stateName}
            </h2>
            <div className="prose prose-secondary max-w-none">
              <p className="text-lg text-secondary-600 mb-6">
                When buying or selling a home in {cityName}, {stateName}, a professional home inspection is 
                essential to ensure the property is in good condition. Our network of certified inspectors 
                provides comprehensive inspection services throughout {cityName} and surrounding areas.
              </p>
              
              <h3 className="text-xl font-semibold mb-4">What to Expect from a Home Inspection</h3>
              <p className="text-secondary-600 mb-4">
                A typical home inspection in {cityName} includes examination of the property's structure, 
                electrical systems, plumbing, HVAC, roofing, and more. Most inspections take 2-4 hours 
                depending on the size and age of the home.
              </p>

              <h3 className="text-xl font-semibold mb-4">Why Choose Local Inspectors</h3>
              <p className="text-secondary-600">
                Local {cityName} inspectors understand regional building practices, common issues in 
                {stateName} homes, and local regulations. They can provide valuable insights specific 
                to your area's climate and construction standards.
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}