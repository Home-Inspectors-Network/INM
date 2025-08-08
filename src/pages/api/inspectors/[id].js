import { db } from '../../../utils/supabase';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const inspector = await db.inspectors.getById(id);
      
      if (!inspector) {
        return res.status(404).json({ message: 'Inspector not found' });
      }

      return res.status(200).json(inspector);
    } catch (error) {
      console.error('Error fetching inspector:', error);
      return res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      const updates = req.body;
      
      // Remove fields that shouldn't be updated directly
      delete updates.id;
      delete updates.created_at;
      
      // Add updated timestamp
      updates.updated_at = new Date().toISOString();

      const inspector = await db.inspectors.update(id, updates);
      
      return res.status(200).json(inspector);
    } catch (error) {
      console.error('Error updating inspector:', error);
      return res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}