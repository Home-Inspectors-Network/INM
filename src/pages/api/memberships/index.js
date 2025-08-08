import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get all memberships with inspector details
      const { data: memberships, error } = await supabase
        .from('memberships')
        .select(`
          *,
          inspectors (
            id,
            business_name,
            owner_name,
            email,
            city,
            state,
            is_premium,
            premium_since
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Failed to fetch memberships' });
      }

      return res.status(200).json({ memberships });
    }

    if (req.method === 'POST') {
      // Create a new membership
      const { inspector_id, plan_type, amount } = req.body;

      if (!inspector_id || !plan_type || !amount) {
        return res.status(400).json({ 
          error: 'Inspector ID, plan type, and amount are required' 
        });
      }

      const { data: membership, error } = await supabase
        .from('memberships')
        .insert([
          {
            inspector_id,
            plan_type,
            amount,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Failed to create membership' });
      }

      // Update inspector to premium status
      const { error: updateError } = await supabase
        .from('inspectors')
        .update({ 
          is_premium: true, 
          premium_since: new Date().toISOString() 
        })
        .eq('id', inspector_id);

      if (updateError) {
        console.error('Inspector update error:', updateError);
      }

      return res.status(201).json({ membership });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}