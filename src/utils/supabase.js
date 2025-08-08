import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing required environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env file.'
  );
  // Return a dummy client that will fail gracefully
  if (typeof window !== 'undefined') {
    // Client-side: show error to user
    console.error('Supabase configuration error. Please contact support.');
  }
}

// Client for browser usage (public operations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations with full permissions
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase; // Fallback to regular client if no service key

// Database utility functions
export const db = {
  // Inspector operations
  inspectors: {
    async getAll(filters = {}) {
      let query = supabase
        .from('inspectors')
        .select('*');

      // Apply filters
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters.state) {
        query = query.eq('state', filters.state.toUpperCase());
      }
      if (filters.services && filters.services.length > 0) {
        query = query.overlaps('services', filters.services);
      }
      if (filters.certifications && filters.certifications.length > 0) {
        query = query.overlaps('certifications', filters.certifications);
      }
      if (filters.insuranceVerified) {
        query = query.eq('insurance_verified', true);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Map data to expected format
      return data.map(inspector => ({
        ...inspector,
        reviews_count: inspector.review_count || 0,
        average_rating: parseFloat(inspector.rating) || 0
      }));
    },

    async getById(id) {
      const { data, error } = await supabase
        .from('inspectors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        average_rating: parseFloat(data.rating) || 0,
        reviews_count: data.review_count || 0
      };
    },

    async search(params) {
      const { location, lat, lng, services, sort = 'rating', limit = 20, offset = 0 } = params;
      
      let query = supabase
        .from('inspectors')
        .select('*')
        .limit(limit)
        .range(offset, offset + limit - 1);

      // Location-based filtering
      if (location) {
        // Parse location for city/state
        const parts = location.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          const city = parts[0];
          const state = parts[1];
          query = query
            .ilike('city', `%${city}%`)
            .ilike('state', `%${state}%`);
        } else {
          // Search in both city and state
          query = query.or(`city.ilike.%${location}%,state.ilike.%${location}%`);
        }
      }

      // Coordinate-based search (for geolocation)
      if (lat && lng) {
        // For now, we'll do a basic bounding box search
        // In production, you'd want to use PostGIS for proper distance calculations
        const latDelta = 0.1; // ~7 miles
        const lngDelta = 0.1;
        query = query
          .gte('latitude', lat - latDelta)
          .lte('latitude', lat + latDelta)
          .gte('longitude', lng - lngDelta)
          .lte('longitude', lng + lngDelta);
      }

      // Service filtering
      if (services && services.length > 0) {
        query = query.overlaps('services', services);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Process results
      let results = data.map(inspector => ({
        ...inspector,
        reviews_count: inspector.review_count || 0,
        average_rating: parseFloat(inspector.rating) || 0
      }));

      // Sort results
      switch (sort) {
        case 'rating':
          results.sort((a, b) => b.average_rating - a.average_rating);
          break;
        case 'reviews':
          results.sort((a, b) => b.reviews_count - a.reviews_count);
          break;
        case 'experience':
          results.sort((a, b) => (b.years_in_business || 0) - (a.years_in_business || 0));
          break;
        case 'name':
          results.sort((a, b) => a.business_name.localeCompare(b.business_name));
          break;
      }

      return {
        inspectors: results,
        total: results.length,
        hasMore: results.length === limit
      };
    },

    async create(inspectorData) {
      const { data, error } = await supabaseAdmin
        .from('inspectors')
        .insert([inspectorData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabaseAdmin
        .from('inspectors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // Review operations
  reviews: {
    async getByInspectorId(inspectorId) {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('inspector_id', inspectorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    async create(reviewData) {
      const { data, error } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // Lead operations
  leads: {
    async create(leadData) {
      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async getByInspectorId(inspectorId) {
      const { data, error } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('inspector_id', inspectorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  },

  // Membership operations
  memberships: {
    async getByInspectorId(inspectorId) {
      const { data, error } = await supabaseAdmin
        .from('memberships')
        .select('*')
        .eq('inspector_id', inspectorId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async create(membershipData) {
      const { data, error } = await supabaseAdmin
        .from('memberships')
        .insert([membershipData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabaseAdmin
        .from('memberships')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // SEO page operations
  seoPages: {
    async getBySlug(slug) {
      const { data, error } = await supabase
        .from('seo_pages')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async create(pageData) {
      const { data, error } = await supabaseAdmin
        .from('seo_pages')
        .insert([pageData])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }
};

// Utility functions
export const utils = {
  // Calculate distance between two coordinates
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  // Format address for display
  formatAddress(inspector) {
    const { address, city, state, zip } = inspector;
    const parts = [];
    if (address) parts.push(address);
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (zip) parts.push(zip);
    return parts.join(', ');
  },

  // Generate SEO-friendly slug
  generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  },

  // Validate email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate phone number
  isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }
};