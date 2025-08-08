import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const CityRoadmap = ({ title = "Bay Area Expansion", showProgress = true }) => {
  const [cityStatuses, setCityStatuses] = useState([]);
  const [notifyEmails, setNotifyEmails] = useState({});

  // Bay Area expansion roadmap
  const EXPANSION_WAVES = {
    wave1: {
      title: "Phase 1 - Core Cities",
      cities: ['San Francisco', 'Oakland', 'San Jose'],
      status: 'completed'
    },
    wave2: {
      title: "Phase 2 - Peninsula & East Bay",
      cities: ['Palo Alto', 'Berkeley', 'Fremont'],
      status: 'in_progress'
    },
    wave3: {
      title: "Phase 3 - South Bay Expansion", 
      cities: ['Mountain View', 'Hayward', 'Sunnyvale', 'Daly City'],
      status: 'planned'
    },
    wave4: {
      title: "Phase 4 - Extended Bay Area",
      cities: ['Santa Clara', 'Redwood City', 'San Mateo', 'Richmond'],
      status: 'planned'
    },
    wave5: {
      title: "Phase 5 - Outer Bay",
      cities: ['Concord', 'Vallejo', 'Livermore', 'Union City'],
      status: 'planned'
    }
  };

  // City status configuration
  const getCityConfig = (cityName, waveStatus) => {
    // Mock data - in production, this would come from API
    const mockData = {
      'San Francisco': { count: 22, status: 'active', completion: 100 },
      'Oakland': { count: 8, status: 'active', completion: 100 },
      'San Jose': { count: 16, status: 'active', completion: 100 },
      'Palo Alto': { count: 0, status: 'in_progress', completion: 45 },
      'Berkeley': { count: 0, status: 'in_progress', completion: 30 },
      'Fremont': { count: 0, status: 'in_progress', completion: 15 },
      'Mountain View': { count: 0, status: 'planned', completion: 0 },
      'Hayward': { count: 0, status: 'planned', completion: 0 },
      'Sunnyvale': { count: 0, status: 'planned', completion: 0 },
      'Daly City': { count: 0, status: 'planned', completion: 0 }
    };

    return mockData[cityName] || { count: 0, status: 'planned', completion: 0 };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-300';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'planned': return 'bg-gray-100 text-gray-500 border-gray-300';
      default: return 'bg-gray-100 text-gray-500 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return (
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'in_progress':
        return (
          <svg className="w-4 h-4 text-yellow-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'planned':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleNotifyClick = (cityName) => {
    const email = prompt(`Get notified when ${cityName} launches!\n\nEnter your email:`);
    if (email && email.includes('@')) {
      setNotifyEmails(prev => ({ ...prev, [cityName]: email }));
      // In production, this would make an API call to save the email
      alert(`Thanks! We'll notify you when ${cityName} inspectors are available.`);
    }
  };

  const CityCard = ({ cityName, config, wave }) => {
    const isClickable = config.status === 'active';
    const citySlug = cityName.toLowerCase().replace(/\s+/g, '-');

    if (isClickable) {
      return (
        <Link href={`/ca/${citySlug}`} className="block">
          <div className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md cursor-pointer ${getStatusColor(config.status)}`}>
            <CityCardContent cityName={cityName} config={config} />
          </div>
        </Link>
      );
    }

    return (
      <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${getStatusColor(config.status)} ${config.status === 'planned' ? 'opacity-60' : ''}`}>
        <CityCardContent cityName={cityName} config={config} />
        {config.status === 'planned' && (
          <button
            onClick={() => handleNotifyClick(cityName)}
            className="mt-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
          >
            📧 Notify Me
          </button>
        )}
      </div>
    );
  };

  const CityCardContent = ({ cityName, config }) => (
    <>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">{cityName}</h3>
        {getStatusIcon(config.status)}
      </div>
      
      {config.status === 'active' && (
        <p className="text-xs mb-2">{config.count} inspectors</p>
      )}
      
      {config.status === 'in_progress' && showProgress && (
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span>Progress</span>
            <span>{config.completion}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${config.completion}%` }}
            ></div>
          </div>
        </div>
      )}
      
      <div className="text-xs opacity-75">
        {config.status === 'active' && 'Available now'}
        {config.status === 'in_progress' && 'Coming soon'}
        {config.status === 'planned' && 'Planned'}
      </div>
    </>
  );

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-gray-600">
          We're expanding across the Bay Area. Active cities have inspectors ready to help, 
          while planned cities are coming soon.
        </p>
      </div>

      {Object.entries(EXPANSION_WAVES).map(([waveKey, wave]) => (
        <div key={waveKey} className="mb-8">
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-semibold mr-3">{wave.title}</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${
              wave.status === 'completed' ? 'bg-green-100 text-green-800' :
              wave.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-600'
            }`}>
              {wave.status === 'completed' ? '✅ Complete' :
               wave.status === 'in_progress' ? '🔄 In Progress' :
               '📅 Planned'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {wave.cities.map(cityName => {
              const config = getCityConfig(cityName, wave.status);
              return (
                <CityCard 
                  key={cityName}
                  cityName={cityName}
                  config={config}
                  wave={wave}
                />
              );
            })}
          </div>
        </div>
      ))}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">🚀 Expansion Timeline</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <p>• <strong>Phase 2</strong>: Peninsula & East Bay (This Week)</p>
          <p>• <strong>Phase 3</strong>: South Bay Expansion (Next Week)</p>
          <p>• <strong>Phase 4-5</strong>: Complete Bay Area Coverage (This Month)</p>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Want us to prioritize your city? Contact us at expansion@inspectorsnearme.com
        </p>
      </div>
    </div>
  );
};

export default CityRoadmap;