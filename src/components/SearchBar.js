import { useState } from 'react';
import { useRouter } from 'next/router';

export default function SearchBar({ placeholder = "Enter city or ZIP code", className = "", userLocation = null }) {
  const [location, setLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsSearching(true);
    
    // Use detected location if available and no manual input
    if (!location.trim() && userLocation) {
      // Navigate with coordinates for more accurate results
      router.push({
        pathname: '/search',
        query: { 
          ...(userLocation.latitude && { lat: userLocation.latitude }),
          ...(userLocation.longitude && { lng: userLocation.longitude }),
          ...(userLocation.city && { city: userLocation.city }),
          ...(userLocation.state && { state: userLocation.state })
        }
      });
    } else if (location.trim()) {
      // Navigate with manual location input
      router.push({
        pathname: '/search',
        query: { location: location.trim() }
      });
    } else {
      setIsSearching(false);
      return;
    }
  };

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setIsSearching(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // Navigate to search with coordinates
          router.push({
            pathname: '/search',
            query: { lat: latitude, lng: longitude }
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsSearching(false);
          alert('Unable to get your location. Please enter it manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div className="relative flex flex-col sm:flex-row gap-2">
        <div className="relative flex-grow">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 pl-12 pr-4 text-lg border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isSearching}
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSearching || (!location.trim() && !userLocation)}
            className="btn-primary flex-1 sm:flex-initial"
          >
            {isSearching ? 'Searching...' : 
             userLocation && !location.trim() ? `Search Near Me` : 
             'Search'}
          </button>
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={isSearching}
            className="btn-outline px-3"
            title="Use my location"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}