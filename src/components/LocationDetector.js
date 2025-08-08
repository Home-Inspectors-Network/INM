import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LocationDetector({ onLocationDetected, showPermissionPrompt = true, autoDetect = false }) {
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, detecting, success, error, denied
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Auto-detect location on component mount if enabled
    if (autoDetect && locationStatus === 'idle') {
      detectLocation();
    }
  }, [autoDetect]);

  useEffect(() => {
    // Show permission prompt after a delay if location not detected and prompt enabled
    if (showPermissionPrompt && locationStatus === 'idle') {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [showPermissionPrompt, locationStatus]);

  const detectLocation = async () => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('error');
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLocationStatus('detecting');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        try {
          // Reverse geocode to get readable location
          const geocodeResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
          );
          const geocodeData = await geocodeResponse.json();
          
          let locationData = {
            latitude,
            longitude,
            accuracy,
            timestamp: new Date(),
            city: null,
            state: null,
            zipCode: null,
            neighborhood: null,
            fullAddress: null
          };

          if (geocodeData.results && geocodeData.results.length > 0) {
            const result = geocodeData.results[0];
            const components = result.address_components;
            
            locationData.fullAddress = result.formatted_address;
            locationData.city = components.find(c => c.types.includes('locality'))?.long_name;
            locationData.state = components.find(c => c.types.includes('administrative_area_level_1'))?.short_name;
            locationData.zipCode = components.find(c => c.types.includes('postal_code'))?.long_name;
            locationData.neighborhood = components.find(c => c.types.includes('neighborhood'))?.long_name;
          }

          setLocation(locationData);
          setLocationStatus('success');
          setShowPrompt(false);
          
          // Save to localStorage for future use
          localStorage.setItem('userLocation', JSON.stringify(locationData));
          
          if (onLocationDetected) {
            onLocationDetected(locationData);
          }
        } catch (geocodeError) {
          console.error('Geocoding error:', geocodeError);
          // Still provide coordinates even if geocoding fails
          const basicLocationData = {
            latitude,
            longitude,
            accuracy,
            timestamp: new Date(),
            city: 'your area',
            state: null
          };
          
          setLocation(basicLocationData);
          setLocationStatus('success');
          
          if (onLocationDetected) {
            onLocationDetected(basicLocationData);
          }
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationStatus('error');
        
        let errorMessage = 'Unable to detect your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationStatus('denied');
            errorMessage = 'Location access denied. Please enable location permissions in your browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred while detecting location.';
            break;
        }
        setError(errorMessage);
        setShowPrompt(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const requestLocationPermission = () => {
    detectLocation();
    setShowPrompt(false);
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    setLocationStatus('denied');
    localStorage.setItem('locationPermissionDenied', 'true');
  };

  const getLocationDisplayName = () => {
    if (!location) return null;
    
    if (location.neighborhood && location.city) {
      return `${location.neighborhood}, ${location.city}${location.state ? `, ${location.state}` : ''}`;
    }
    
    if (location.city) {
      return `${location.city}${location.state ? `, ${location.state}` : ''}`;
    }
    
    return location.fullAddress || 'your area';
  };

  // Check if we should show the prompt (not if user previously denied)
  const shouldShowPrompt = showPrompt && 
    locationStatus === 'idle' && 
    !localStorage.getItem('locationPermissionDenied');

  return (
    <div className="location-detector">
      {/* Location Permission Prompt */}
      {shouldShowPrompt && (
        <div className="fixed top-0 left-0 right-0 bg-primary-600 text-white p-3 z-50 shadow-lg">
          <div className="container flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p className="font-medium text-sm">Find inspectors near you</p>
                <p className="text-xs text-primary-200">Allow location access for personalized results</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={requestLocationPermission}
                className="bg-white text-primary-600 px-3 py-1 rounded text-sm font-medium hover:bg-primary-50 transition-colors"
                disabled={locationStatus === 'detecting'}
              >
                {locationStatus === 'detecting' ? 'Detecting...' : 'Allow'}
              </button>
              <button
                onClick={dismissPrompt}
                className="text-primary-200 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Status Display */}
      {locationStatus === 'success' && location && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-800">
                Location detected: {getLocationDisplayName()}
              </p>
              <p className="text-xs text-green-600">
                Showing inspectors within {Math.round((location.accuracy || 1000) / 1000)}km
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Location Error Display */}
      {locationStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800">Location Detection Failed</p>
                <p className="text-xs text-red-600">{error}</p>
              </div>
            </div>
            <button
              onClick={detectLocation}
              className="text-red-600 hover:text-red-800 text-xs font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Location Denied Message */}
      {locationStatus === 'denied' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">Location Access Denied</p>
              <p className="text-xs text-yellow-600">
                You can still search by entering your city or ZIP code manually
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Location Button */}
      {(locationStatus === 'idle' || locationStatus === 'error' || locationStatus === 'denied') && (
        <div className="text-center">
          <button
            onClick={detectLocation}
            disabled={locationStatus === 'detecting'}
            className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>
              {locationStatus === 'detecting' ? 'Detecting location...' : 'Use my current location'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}