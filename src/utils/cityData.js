/**
 * City data management for keeping UI in sync with database
 */

import { db } from './supabase';

// Bay Area cities with their URL-friendly slugs
export const BAY_AREA_CITIES = [
  {
    name: 'San Francisco',
    state: 'CA',
    slug: 'san-francisco',
    priority: 1
  },
  {
    name: 'Oakland',
    state: 'CA', 
    slug: 'oakland',
    priority: 2
  },
  {
    name: 'San Jose',
    state: 'CA',
    slug: 'san-jose', 
    priority: 3
  },
  {
    name: 'Palo Alto',
    state: 'CA',
    slug: 'palo-alto',
    priority: 4
  },
  {
    name: 'Berkeley',
    state: 'CA',
    slug: 'berkeley',
    priority: 5
  },
  {
    name: 'Fremont',
    state: 'CA',
    slug: 'fremont',
    priority: 6
  }
];

/**
 * Get current inspector counts for each city
 */
export async function getCityCounts() {
  try {
    const cities = await Promise.all(
      BAY_AREA_CITIES.map(async (city) => {
        const inspectors = await db.inspectors.getAll({ 
          city: city.name,
          state: 'CA' 
        });
        
        return {
          ...city,
          count: inspectors.length,
          hasInspectors: inspectors.length > 0
        };
      })
    );
    
    return cities.sort((a, b) => a.priority - b.priority);
  } catch (error) {
    console.error('Error fetching city counts:', error);
    return BAY_AREA_CITIES.map(city => ({ ...city, count: 0, hasInspectors: false }));
  }
}

/**
 * Get top 3 cities for search page display
 */
export async function getTopCitiesForSearch() {
  const cities = await getCityCounts();
  return cities
    .filter(city => city.hasInspectors)
    .slice(0, 3)
    .map(city => ({
      name: city.name,
      state: city.state,
      slug: city.slug,
      count: city.count,
      href: `/ca/${city.slug}`,
      display: `${city.name}, ${city.state}`,
      subtitle: city.count > 0 ? `${city.count} certified inspectors` : 'Browse inspectors'
    }));
}

/**
 * All inspector types we collect data for
 */
export const INSPECTOR_TYPES = [
  {
    category: 'Home Inspectors',
    services: [
      'General Home Inspection',
      'Pre-Purchase Inspection', 
      'Pre-Listing Inspection',
      'New Construction Inspection',
      '11th Month Warranty Inspection'
    ],
    phase: 1
  },
  {
    category: 'Pest & Termite Inspectors',
    services: [
      'Termite & Pest Inspection',
      'WDO (Wood Destroying Organism) Inspection',
      'Pest Control Services'
    ],
    phase: 2
  },
  {
    category: 'Structural Specialists', 
    services: [
      'Foundation & Structural Inspection',
      'Structural Engineering Assessment',
      'Foundation Repair Evaluation'
    ],
    phase: 3
  },
  {
    category: 'Environmental & Specialty Testing',
    services: [
      'Mold Inspection & Testing',
      'Radon Testing',
      'Asbestos Testing',
      'Lead Paint Testing',
      'Indoor Air Quality Testing'
    ],
    phase: 4
  },
  {
    category: 'System Specialists',
    services: [
      'HVAC Inspection',
      'Electrical Inspection', 
      'Plumbing Inspection',
      'Pool & Spa Inspection',
      'Well Water Testing',
      'Septic System Inspection'
    ],
    phase: 4
  },
  {
    category: 'Commercial & Advanced Services',
    services: [
      'Commercial Inspection',
      'Multi-Family Property Inspection',
      'Thermal Imaging',
      'Drone Inspection',
      'Energy Audit'
    ],
    phase: 5
  }
];

/**
 * Get all available services as flat array for filters
 */
export function getAllServices() {
  return INSPECTOR_TYPES.reduce((services, type) => {
    return services.concat(type.services);
  }, []);
}

/**
 * Get services by collection phase
 */
export function getServicesByPhase(phase) {
  return INSPECTOR_TYPES
    .filter(type => type.phase === phase)
    .reduce((services, type) => services.concat(type.services), []);
}