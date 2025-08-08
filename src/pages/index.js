import Layout from '../components/Layout';
import SearchBar from '../components/SearchBar';
import AIChatbot from '../components/AIChatbot';
import LocationDetector from '../components/LocationDetector';
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [userLocation, setUserLocation] = useState(null);

  const handleLocationDetected = (location) => {
    setUserLocation(location);
  };

  // Organized by region for better UX
  const citiesByRegion = {
    'West Coast': [
      { name: 'San Francisco, CA', href: '/ca/san-francisco', state: 'CA' },
      { name: 'San Jose, CA', href: '/ca/san-jose', state: 'CA' },
      { name: 'Oakland, CA', href: '/ca/oakland', state: 'CA' },
      { name: 'Seattle, WA', href: '/wa/seattle', state: 'WA' },
      { name: 'Palo Alto, CA', href: '/ca/palo-alto', state: 'CA' },
      { name: 'Berkeley, CA', href: '/ca/berkeley', state: 'CA' },
      { name: 'Fremont, CA', href: '/ca/fremont', state: 'CA' },
      { name: 'Sunnyvale, CA', href: '/ca/sunnyvale', state: 'CA' },
      { name: 'Mountain View, CA', href: '/ca/mountain-view', state: 'CA' },
    ],
    'Southwest': [
      { name: 'Phoenix, AZ', href: '/az/phoenix', state: 'AZ' },
      { name: 'Houston, TX', href: '/tx/houston', state: 'TX' },
      { name: 'Dallas, TX', href: '/tx/dallas', state: 'TX' },
    ],
    'Southeast': [
      { name: 'Miami, FL', href: '/fl/miami', state: 'FL' },
      { name: 'Atlanta, GA', href: '/ga/atlanta', state: 'GA' },
    ],
    'Northeast': [
      { name: 'New York, NY', href: '/ny/new-york', state: 'NY' },
      { name: 'Philadelphia, PA', href: '/pa/philadelphia', state: 'PA' },
      { name: 'Boston, MA', href: '/ma/boston', state: 'MA' },
      { name: 'Washington, DC', href: '/dc/washington', state: 'DC' },
    ],
    'Midwest': [
      { name: 'Chicago, IL', href: '/il/chicago', state: 'IL' },
    ],
  };

  const features = [
    {
      title: 'Verified Inspectors',
      description: 'All inspectors are licensed, insured, and background checked',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: 'Instant Quotes',
      description: 'Compare prices from multiple inspectors in your area',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Read Reviews',
      description: 'Browse verified reviews from real customers',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
    {
      title: 'Book Online',
      description: 'Schedule your inspection with just a few clicks',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const stats = [
    { number: '50,000+', label: 'Inspections Completed' },
    { number: '10,000+', label: 'Verified Inspectors' },
    { number: '11', label: 'States Covered' },
    { number: '4.8/5', label: 'Average Rating' },
  ];

  return (
    <Layout
      title="Find Certified Home Inspectors Near You"
      description="Connect with licensed and insured property inspectors in your area. Compare prices, read reviews, and book inspections online."
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white">
        <div className="container section-padding">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary-900 mb-6">
              Find Trusted Home Inspectors Near You
            </h1>
            <p className="text-xl text-secondary-600 mb-8">
              Connect with certified professionals for thorough property inspections. 
              Compare prices, read reviews, and book online.
            </p>
            <div className="max-w-2xl mx-auto">
              <LocationDetector 
                onLocationDetected={handleLocationDetected} 
                showPermissionPrompt={true}
                autoDetect={false}
              />
              <SearchBar 
                className="mt-4"
                userLocation={userLocation}
                placeholder={userLocation?.city 
                  ? `Find inspectors in ${userLocation.city}${userLocation.state ? `, ${userLocation.state}` : ''}`
                  : "Enter city or ZIP code"
                }
              />
            </div>
            <p className="mt-4 text-sm text-secondary-500">
              Over 10,000+ verified inspectors nationwide
              {userLocation?.city && (
                <span className="block text-primary-600 font-medium">
                  📍 Showing results for {userLocation.city}{userLocation.state ? `, ${userLocation.state}` : ''}
                </span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-secondary-900 text-white">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-secondary-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-secondary-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose InspectorsNearMe?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 text-primary-600 rounded-lg mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-secondary-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cities by Region */}
      <section className="section-padding">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-4">
            Available in Major Cities Nationwide
          </h2>
          <p className="text-center text-secondary-600 mb-12 max-w-2xl mx-auto">
            We've expanded from California to serve 11 states across the country. 
            Find certified inspectors in these major metropolitan areas.
          </p>
          
          <div className="max-w-6xl mx-auto">
            {Object.entries(citiesByRegion).map(([region, cities]) => (
              <div key={region} className="mb-10">
                <h3 className="text-xl font-semibold mb-4 text-secondary-800 border-b pb-2">
                  {region}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {cities.map((city) => (
                    <Link
                      key={city.name}
                      href={city.href}
                      className="text-center p-3 rounded-lg border border-secondary-200 hover:border-primary-500 hover:bg-primary-50 transition-all group"
                    >
                      <span className="text-secondary-700 group-hover:text-primary-600 font-medium">
                        {city.name}
                      </span>
                      <span className="block text-xs text-secondary-500 mt-1">
                        View Inspectors
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/cities" className="btn btn-primary">
              View All Cities
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-secondary-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Search Your Area</h3>
                <p className="text-secondary-600">
                  Enter your city or ZIP code to find licensed inspectors near you
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">Compare & Choose</h3>
                <p className="text-secondary-600">
                  Review profiles, prices, and customer reviews to find the right fit
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">Book Online</h3>
                <p className="text-secondary-600">
                  Schedule your inspection and receive a detailed report
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
              Are You a Home Inspector?
            </h2>
            <p className="text-xl mb-8 text-primary-100">
              Join thousands of inspectors growing their business with InspectorsNearMe
            </p>
            <Link href="/inspectors/join" className="btn bg-white text-primary-600 hover:bg-primary-50">
              List Your Business
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="section-padding bg-secondary-50">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              What Our Users Say
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-secondary-600 mb-4">
                  "Found a great inspector within minutes. The booking process was seamless!"
                </p>
                <p className="font-semibold">- Sarah M., San Francisco</p>
              </div>
              <div className="card p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-secondary-600 mb-4">
                  "Comparing prices from multiple inspectors saved me over $200!"
                </p>
                <p className="font-semibold">- Michael R., New York</p>
              </div>
              <div className="card p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-secondary-600 mb-4">
                  "The verified reviews helped me choose the perfect inspector for my needs."
                </p>
                <p className="font-semibold">- Jennifer L., Chicago</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Chatbot */}
      <AIChatbot />
    </Layout>
  );
}