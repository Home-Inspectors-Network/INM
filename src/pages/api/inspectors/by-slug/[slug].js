import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { slug } = req.query;
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!slug) {
    return res.status(400).json({ message: 'Slug is required' });
  }

  try {
    const { data: inspector, error } = await supabase
      .from('inspectors')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return res.status(404).json({ message: 'Inspector not found' });
      }
      console.error('Database error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (!inspector) {
      return res.status(404).json({ message: 'Inspector not found' });
    }

    // Transform the data if needed
    const transformedInspector = {
      ...inspector,
      // Ensure arrays are properly parsed if stored as JSON strings
      services: Array.isArray(inspector.services) ? inspector.services : [],
      certifications: Array.isArray(inspector.certifications) ? inspector.certifications : [],
      service_areas: Array.isArray(inspector.service_areas) ? inspector.service_areas : [],
      // Parse JSONB fields if they're strings
      detailed_services: inspector.detailed_services || [],
      photo_gallery: inspector.photo_gallery || [],
      business_hours: inspector.business_hours || {},
      team_members: inspector.team_members || {},
      social_media: inspector.social_media || {}
    };

    return res.status(200).json(transformedInspector);
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}