import { db } from '../../../utils/supabase';
import { supabase } from '../../../utils/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { state, city } = req.query;

    if (!state) {
      return res.status(400).json({ message: 'State parameter is required' });
    }

    // Get all unique cities that inspectors serve in this state
    const { data: inspectors, error } = await supabase
      .from('inspectors')
      .select('city, service_areas, service_cities')
      .eq('state', state.toUpperCase());

    if (error) throw error;

    // Collect all unique cities
    const allCities = new Set();
    
    inspectors.forEach(inspector => {
      // Add primary city
      if (inspector.city) {
        allCities.add(inspector.city);
      }
      
      // Add service areas
      if (inspector.service_areas && Array.isArray(inspector.service_areas)) {
        inspector.service_areas.forEach(area => allCities.add(area));
      }
      
      // Add service cities if available
      if (inspector.service_cities && Array.isArray(inspector.service_cities)) {
        inspector.service_cities.forEach(city => allCities.add(city));
      }
    });

    // Convert to array and sort
    let cities = Array.from(allCities).sort();

    // If a specific city is provided, filter out that city and limit results
    if (city) {
      const normalizedCity = city.replace(/-/g, ' ');
      cities = cities.filter(c => c.toLowerCase() !== normalizedCity.toLowerCase());
      
      // For nearby cities, prioritize based on geographic proximity
      // This is a simplified version - in production you'd use actual distance calculations
      const geographicClusters = {
        'San Francisco': ['Oakland', 'Berkeley', 'San Mateo', 'Daly City', 'South San Francisco'],
        'Oakland': ['Berkeley', 'San Francisco', 'Alameda', 'San Leandro', 'Hayward'],
        'San Jose': ['Palo Alto', 'Mountain View', 'Santa Clara', 'Sunnyvale', 'Cupertino'],
        'Berkeley': ['Oakland', 'San Francisco', 'Richmond', 'Albany', 'El Cerrito'],
        'Palo Alto': ['Mountain View', 'San Jose', 'Menlo Park', 'Stanford', 'East Palo Alto'],
        'Fremont': ['Newark', 'Union City', 'Hayward', 'Milpitas', 'San Jose']
      };
      
      const cluster = geographicClusters[normalizedCity] || [];
      const nearbyCities = [];
      
      // Add cities from the cluster first
      cluster.forEach(clusteredCity => {
        if (cities.includes(clusteredCity)) {
          nearbyCities.push(clusteredCity);
        }
      });
      
      // Add remaining cities
      cities.forEach(c => {
        if (!nearbyCities.includes(c)) {
          nearbyCities.push(c);
        }
      });
      
      cities = nearbyCities.slice(0, 12); // Limit to 12 nearby cities
    }

    return res.status(200).json({
      cities,
      total: cities.length,
      state: state.toUpperCase()
    });

  } catch (error) {
    console.error('Nearby cities error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}