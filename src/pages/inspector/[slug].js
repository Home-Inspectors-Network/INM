import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function InspectorProfileSlug() {
  const router = useRouter();
  const { slug } = router.query;
  const [inspector, setInspector] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchInspectorBySlug();
      // Only fetch reviews after we have the inspector
    }
  }, [slug]);

  useEffect(() => {
    if (inspector?.id) {
      fetchReviews();
    }
  }, [inspector]);

  const fetchInspectorBySlug = async () => {
    try {
      const response = await fetch(`/api/inspectors/by-slug/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setInspector(data);
      } else {
        setInspector(null);
      }
    } catch (error) {
      console.error('Error fetching inspector:', error);
      setInspector(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!inspector?.id) return;
    
    try {
      const response = await fetch(`/api/inspectors/${inspector.id}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const renderRating = (rating, count) => {
    if (count === 0) {
      return <span className="text-secondary-500">No reviews yet</span>;
    }

    return (
      <div className="flex items-center">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`w-5 h-5 ${
                i < Math.floor(rating) ? 'text-yellow-400' : 'text-secondary-300'
              } fill-current`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="ml-2 text-lg font-medium">{rating.toFixed(1)}</span>
        <span className="ml-1 text-secondary-600">({count} reviews)</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Layout title="Loading...">
        <div className="container py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-secondary-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-secondary-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-64 bg-secondary-200 rounded"></div>
              </div>
              <div className="h-96 bg-secondary-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!inspector) {
    return (
      <Layout 
        title="Inspector Not Found"
        description="The inspector profile you're looking for could not be found."
      >
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Inspector Not Found</h1>
          <p className="text-secondary-600 mb-8">
            The inspector you're looking for doesn't exist or may have been moved.
          </p>
          <Link href="/search" className="btn-primary">
            Find Other Inspectors
          </Link>
        </div>
      </Layout>
    );
  }

  const {
    business_name,
    owner_name,
    email,
    phone,
    website,
    address,
    city,
    state,
    zip,
    certifications = [],
    services = [],
    detailed_services = [],
    logo_url,
    company_description,
    photo_gallery = [],
    years_in_business,
    insurance_verified,
    license_number,
    rating,
    review_count,
    average_rating = 0,
    reviews_count = 0,
    service_areas = []
  } = inspector;

  // Use the correct rating field
  const displayRating = parseFloat(rating) || average_rating || 0;
  const displayReviewCount = review_count || reviews_count || 0;

  // Create breadcrumb data
  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: `${city} Inspectors`, href: `/${state?.toLowerCase()}/${city?.toLowerCase()?.replace(/\s+/g, '-')}` },
    { name: business_name, href: `/inspector/${slug}` }
  ];

  return (
    <Layout
      title={`${business_name} - Professional Home Inspector in ${city}, ${state}`}
      description={`${business_name} provides professional home inspection services in ${city}, ${state}${service_areas.length > 0 ? ` and ${service_areas.slice(0,3).join(', ')}` : ''}. ${years_in_business ? `${years_in_business}+ years experience. ` : ''}Licensed, insured, and certified.`}
    >
      {/* Breadcrumbs */}
      <div className="bg-secondary-50 border-b border-secondary-200">
        <div className="container py-3">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.href}>
                  <div className="flex items-center">
                    {index > 0 && (
                      <svg className="flex-shrink-0 h-4 w-4 text-secondary-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {index < breadcrumbs.length - 1 ? (
                      <Link href={crumb.href} className="text-secondary-500 hover:text-secondary-700 text-sm font-medium">
                        {crumb.name}
                      </Link>
                    ) : (
                      <span className="text-secondary-900 text-sm font-medium">{crumb.name}</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      <div className="container py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-4 flex-grow">
              {/* Logo */}
              {logo_url && (
                <div className="flex-shrink-0">
                  <img 
                    src={logo_url} 
                    alt={`${business_name} logo`}
                    className="w-16 h-16 object-contain rounded-lg border border-gray-200"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="flex-grow">
                <h1 className="text-3xl font-bold text-secondary-900 mb-2">
                  {business_name}
                </h1>
                {owner_name && (
                  <p className="text-lg text-secondary-600 mb-2">{owner_name}</p>
                )}
                <p className="text-secondary-600 mb-4">
                  {address && `${address}, `}
                  {city}, {state} {zip}
                </p>
                
                {/* Rating */}
                <div className="mb-4">
                  {renderRating(displayRating, displayReviewCount)}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {insurance_verified && (
                    <span className="badge-success">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Insured
                    </span>
                  )}
                  {years_in_business && (
                    <span className="badge-primary">
                      {years_in_business}+ years experience
                    </span>
                  )}
                  {license_number && (
                    <span className="badge badge-secondary">
                      Licensed: {license_number}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-primary-50 rounded-lg p-6 lg:w-80">
              <h3 className="text-lg font-semibold mb-4">Contact Inspector</h3>
              <div className="space-y-3">
                {phone && (
                  <a href={`tel:${phone}`} className="btn-primary w-full text-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call {phone}
                  </a>
                )}
                {email && (
                  <button 
                    onClick={() => setShowContactForm(true)}
                    className="btn-outline w-full"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Get Quote
                  </button>
                )}
                {website && (
                  <a 
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary w-full text-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Visit Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Service Areas */}
        {service_areas.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">Service Areas</h2>
            <p className="text-blue-800 mb-3">
              We provide home inspection services throughout:
            </p>
            <div className="flex flex-wrap gap-2">
              {service_areas.map((area, index) => (
                <Link 
                  key={index} 
                  href={`/${state?.toLowerCase()}/${area.toLowerCase().replace(/\s+/g, '-')}`}
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900 px-3 py-1 rounded-full text-sm font-medium transition-colors"
                >
                  {area}, {state}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-secondary-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'services', 'reviews', 'locations'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
              >
                {tab === 'locations' ? `Service Areas (${service_areas.length})` : tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="card p-6">
                  <h2 className="text-xl font-semibold mb-4">About {business_name}</h2>
                  <p className="text-secondary-600">
                    {company_description || (
                      `Professional home inspection services in ${city}, ${state}${service_areas.length > 0 ? ` and surrounding areas including ${service_areas.slice(0,3).join(', ')}` : ''}.
                      ${years_in_business ? ` With over ${years_in_business} years of experience, ` : ''}
                      we provide thorough and reliable property inspections for homebuyers and sellers.`
                    )}
                  </p>
                </div>

                {/* Photo Gallery */}
                {photo_gallery.length > 0 && (
                  <div className="card p-6">
                    <h2 className="text-xl font-semibold mb-4">Gallery</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {photo_gallery.slice(0, 6).map((photo, index) => (
                        <div key={index} className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={photo.url} 
                            alt={photo.caption || 'Inspector photo'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.parentElement.style.display = 'none';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {certifications.length > 0 && (
                  <div className="card p-6">
                    <h2 className="text-xl font-semibold mb-4">Certifications</h2>
                    <div className="flex flex-wrap gap-2">
                      {certifications.map((cert, index) => (
                        <span key={index} className="badge-primary">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'services' && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4">Services Offered</h2>
                {(detailed_services.length > 0 || services.length > 0) ? (
                  <div className="space-y-4">
                    {(detailed_services.length > 0 ? detailed_services : services.map(s => ({ name: s, description: '', price_range: 'Contact for pricing' }))).map((service, index) => (
                      <div key={index} className="border border-secondary-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <div className="flex-grow">
                            <h3 className="font-medium text-secondary-900 mb-1">{service.name}</h3>
                            {service.description && service.description !== service.name && (
                              <p className="text-sm text-secondary-600 mb-2">{service.description}</p>
                            )}
                            {service.price_range && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                {service.price_range}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-secondary-600">No services listed yet.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="card p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{review.reviewer_name}</h3>
                          <div className="flex items-center mt-1">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating ? 'text-yellow-400' : 'text-secondary-300'
                                  } fill-current`}
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            {review.verified && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-secondary-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-secondary-700">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="card p-6 text-center">
                    <p className="text-secondary-600">No reviews yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'locations' && (
              <div className="space-y-6">
                <div className="card p-6">
                  <h2 className="text-xl font-semibold mb-4">Service Areas</h2>
                  <p className="text-secondary-600 mb-6">
                    {business_name} provides professional home inspection services to {service_areas.length} areas in {state}.
                    Click on any location below to find more inspectors in that area.
                  </p>
                  
                  {/* Service Areas Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service_areas.map((area, index) => (
                      <Link
                        key={index}
                        href={`/${state?.toLowerCase()}/${area.toLowerCase().replace(/\s+/g, '-')}`}
                        className="border border-secondary-200 rounded-lg p-4 hover:border-primary-500 hover:bg-primary-50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-secondary-900">{area}</h3>
                            <p className="text-sm text-secondary-600">
                              {state === 'CA' ? 'California' : state}
                            </p>
                          </div>
                          <svg className="w-5 h-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                  
                  {/* Coverage Map Placeholder */}
                  <div className="mt-8 p-6 bg-secondary-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Coverage Map</h3>
                    <p className="text-secondary-600 text-sm">
                      Interactive coverage map coming soon. For now, we service all areas listed above with typical response times of 24-48 hours.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-secondary-600">Experience</dt>
                  <dd className="font-medium">{years_in_business || 'N/A'} years</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-secondary-600">Reviews</dt>
                  <dd className="font-medium">{displayReviewCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-secondary-600">Rating</dt>
                  <dd className="font-medium">{displayReviewCount > 0 ? `${displayRating.toFixed(1)}/5` : 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-secondary-600">Insurance</dt>
                  <dd className="font-medium">{insurance_verified ? 'Verified' : 'Not verified'}</dd>
                </div>
              </dl>
            </div>

            {/* Find Similar */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Find Similar Inspectors</h3>
              <Link 
                href={`/search?location=${city}, ${state}`}
                className="btn-outline w-full text-center"
              >
                View More in {city}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Contact {business_name}</h3>
              <button 
                onClick={() => setShowContactForm(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="form-label">Your Name</label>
                <input type="text" required />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input type="email" required />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input type="tel" />
              </div>
              <div>
                <label className="form-label">Property Address</label>
                <input type="text" required />
              </div>
              <div>
                <label className="form-label">Message</label>
                <textarea rows="4" placeholder="Tell us about your inspection needs..."></textarea>
              </div>
              <button type="submit" className="btn-primary w-full">
                Send Message
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}