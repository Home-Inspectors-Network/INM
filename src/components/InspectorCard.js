import Link from 'next/link';

export default function InspectorCard({ inspector, showCTA = true }) {
  const {
    id,
    business_name,
    owner_name,
    email,
    phone,
    website,
    city,
    state,
    certifications = [],
    services = [],
    detailed_services = [],
    logo_url,
    photo_gallery = [],
    years_in_business,
    insurance_verified,
    reviews_count = 0,
    average_rating = 0,
    rating = 0,
    review_count = 0,
    base_price = null
  } = inspector;

  // Use the correct rating fields from our database
  const displayRating = rating || average_rating || 0;
  const displayReviewCount = review_count || reviews_count || 0;
  
  // Combine basic services with detailed services
  const allServices = detailed_services.length > 0 
    ? detailed_services.map(s => s.name)
    : services;

  const renderRating = () => {
    if (displayReviewCount === 0) {
      return <span className="text-sm text-secondary-500">No reviews yet</span>;
    }

    return (
      <div className="flex items-center">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`w-4 h-4 ${
                i < Math.floor(displayRating) ? 'text-yellow-400' : 'text-secondary-300'
              } fill-current`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="ml-2 text-sm text-secondary-600">
          {displayRating.toFixed(1)} ({displayReviewCount} reviews)
        </span>
      </div>
    );
  };

  return (
    <div className="card p-6 h-full flex flex-col">
      {/* Header with Logo */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start space-x-3 flex-grow">
          {logo_url && (
            <div className="flex-shrink-0">
              <img 
                src={logo_url} 
                alt={`${business_name} logo`}
                className="w-12 h-12 object-contain rounded-lg border border-gray-200"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex-grow">
            <h3 className="text-lg font-semibold text-secondary-900 mb-1">
              <Link href={`/inspectors/${id}`} className="hover:text-primary-600">
                {business_name}
              </Link>
            </h3>
            {owner_name && (
              <p className="text-secondary-600 text-sm">{owner_name}</p>
            )}
            <p className="text-secondary-500 text-sm">
              {city}, {state}
            </p>
          </div>
        </div>
        {base_price && (
          <div className="text-right">
            <p className="text-lg font-semibold text-primary-600">
              ${base_price}
            </p>
            <p className="text-xs text-secondary-500">Starting at</p>
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="mb-4">
        {renderRating()}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
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
      </div>

      {/* Enhanced Services */}
      {allServices.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-secondary-700 mb-2">
            Services ({allServices.length}):
          </p>
          <div className="flex flex-wrap gap-1">
            {allServices.slice(0, 4).map((service, index) => (
              <span key={index} className="text-xs bg-secondary-100 text-secondary-700 px-2 py-1 rounded">
                {service}
              </span>
            ))}
            {allServices.length > 4 && (
              <span className="text-xs text-secondary-500">+{allServices.length - 4} more</span>
            )}
          </div>
        </div>
      )}

      {/* Photo Gallery Preview */}
      {photo_gallery.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-secondary-700 mb-2">Photos:</p>
          <div className="flex space-x-2">
            {photo_gallery.slice(0, 3).map((photo, index) => (
              <div key={index} className="w-16 h-12 rounded overflow-hidden bg-gray-100">
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
            {photo_gallery.length > 3 && (
              <div className="w-16 h-12 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                +{photo_gallery.length - 3}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-secondary-700 mb-2">Certifications:</p>
          <div className="flex flex-wrap gap-1">
            {certifications.slice(0, 2).map((cert, index) => (
              <span key={index} className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                {cert}
              </span>
            ))}
            {certifications.length > 2 && (
              <span className="text-xs text-secondary-500">+{certifications.length - 2} more</span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {showCTA && (
        <div className="mt-auto pt-4 border-t border-secondary-200">
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href={`/inspectors/${id}`} className="btn-primary text-center text-sm flex-1">
              View Profile
            </Link>
            {phone && (
              <a href={`tel:${phone}`} className="btn-outline text-center text-sm flex-1">
                Call Now
              </a>
            )}
          </div>
          {email && (
            <Link
              href={`/contact/${id}`}
              className="block text-center text-sm text-primary-600 hover:text-primary-700 mt-2"
            >
              Get Quote
            </Link>
          )}
        </div>
      )}
    </div>
  );
}