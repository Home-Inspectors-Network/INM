import { db } from '../../utils/supabase';
const { utils } = require('../../utils/supabase');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      inspector_id,
      customer_name,
      customer_email,
      customer_phone,
      service_needed,
      property_address,
      preferred_date,
      message
    } = req.body;

    // Validate required fields
    if (!inspector_id || !customer_name || !customer_email || !property_address) {
      return res.status(400).json({
        message: 'Inspector ID, customer name, email, and property address are required'
      });
    }

    // Validate email format
    if (!utils.isValidEmail(customer_email)) {
      return res.status(400).json({
        message: 'Invalid email format'
      });
    }

    // Validate phone if provided
    if (customer_phone && !utils.isValidPhone(customer_phone)) {
      return res.status(400).json({
        message: 'Invalid phone number format'
      });
    }

    const leadData = {
      inspector_id: parseInt(inspector_id),
      customer_name,
      customer_email,
      customer_phone,
      service_needed,
      property_address,
      preferred_date: preferred_date ? new Date(preferred_date).toISOString().split('T')[0] : null,
      message,
      status: 'new'
    };

    const lead = await db.leads.create(leadData);

    // TODO: Send notification email to inspector
    // TODO: Send confirmation email to customer

    return res.status(201).json({
      message: 'Lead submitted successfully',
      lead_id: lead.id
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}