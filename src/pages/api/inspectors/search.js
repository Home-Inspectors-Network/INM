import { db } from '../../../utils/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      location,
      lat,
      lng,
      services,
      certifications,
      state,
      city,
      sort = 'rating',
      insuranceVerified,
      minRating,
      limit = 20,
      offset = 0
    } = req.query;

    // Build search parameters
    const searchParams = {
      location,
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
      services: services ? (Array.isArray(services) ? services : [services]) : undefined,
      sort,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    // Additional filters for city directory pages
    const filters = {};
    if (state) filters.state = state;
    if (city) {
      // Convert URL-friendly city name back to proper format
      filters.city = city.replace(/-/g, ' ');
    }
    if (certifications) {
      filters.certifications = Array.isArray(certifications) ? certifications : [certifications];
    }
    if (insuranceVerified === 'true') {
      filters.insuranceVerified = true;
    }

    // Get inspectors
    let inspectors;
    if (Object.keys(filters).length > 0) {
      // Use filtered search for city pages
      // Get ALL inspectors first to check service areas
      let allInspectors = await db.inspectors.getAll({ state: filters.state });
      
      // Filter by city (primary location OR service areas)
      if (filters.city) {
        const cityName = filters.city;
        inspectors = allInspectors.filter(inspector => {
          // Check primary city
          if (inspector.city && inspector.city.toLowerCase() === cityName.toLowerCase()) {
            return true;
          }
          
          // Check service areas
          if (inspector.service_areas && Array.isArray(inspector.service_areas)) {
            return inspector.service_areas.some(area => 
              area.toLowerCase() === cityName.toLowerCase()
            );
          }
          
          return false;
        });
      } else {
        inspectors = allInspectors;
      }
      
      // Apply other filters
      if (filters.certifications && filters.certifications.length > 0) {
        inspectors = inspectors.filter(inspector => 
          inspector.certifications && 
          filters.certifications.some(cert => inspector.certifications.includes(cert))
        );
      }
      
      if (filters.insuranceVerified) {
        inspectors = inspectors.filter(inspector => inspector.insurance_verified === true);
      }
      
      // Apply additional filters
      if (minRating) {
        const minRatingValue = parseFloat(minRating);
        inspectors = inspectors.filter(inspector => 
          inspector.average_rating >= minRatingValue
        );
      }

      // Sort results
      switch (sort) {
        case 'rating':
          inspectors.sort((a, b) => b.average_rating - a.average_rating);
          break;
        case 'reviews':
          inspectors.sort((a, b) => b.reviews_count - a.reviews_count);
          break;
        case 'experience':
          inspectors.sort((a, b) => (b.years_in_business || 0) - (a.years_in_business || 0));
          break;
        case 'name':
          inspectors.sort((a, b) => a.business_name.localeCompare(b.business_name));
          break;
      }

      // Apply pagination
      const startIndex = parseInt(offset);
      const endIndex = startIndex + parseInt(limit);
      const paginatedInspectors = inspectors.slice(startIndex, endIndex);

      return res.status(200).json({
        inspectors: paginatedInspectors,
        total: inspectors.length,
        hasMore: endIndex < inspectors.length
      });
    } else {
      // Use general search
      const result = await db.inspectors.search(searchParams);
      return res.status(200).json(result);
    }
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}