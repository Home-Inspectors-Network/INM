import { db } from '../../../../utils/supabase';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const reviews = await db.reviews.getByInspectorId(id);
      return res.status(200).json(reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { reviewer_name, reviewer_email, rating, comment } = req.body;

      // Validate required fields
      if (!reviewer_name || !rating) {
        return res.status(400).json({ 
          message: 'Reviewer name and rating are required' 
        });
      }

      // Validate rating range
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ 
          message: 'Rating must be between 1 and 5' 
        });
      }

      const reviewData = {
        inspector_id: id,
        reviewer_name,
        reviewer_email,
        rating: parseInt(rating),
        comment,
        verified: false // Reviews start as unverified
      };

      const review = await db.reviews.create(reviewData);
      
      return res.status(201).json(review);
    } catch (error) {
      console.error('Error creating review:', error);
      return res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}