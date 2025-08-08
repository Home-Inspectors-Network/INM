import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { inspectorId, email, planType = 'premium' } = req.body;

    if (!inspectorId || !email) {
      return res.status(400).json({ error: 'Inspector ID and email are required' });
    }

    // Note: Stripe integration placeholder
    // When you add your Stripe secret key to .env.local, uncomment this:
    /*
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        inspectorId: inspectorId.toString()
      }
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price: planType === 'premium' ? 'price_premium_monthly' : 'price_basic_monthly'
      }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    });
    */

    // For demo purposes, create a mock subscription
    const mockCustomer = {
      id: `cus_mock_${Date.now()}`,
      email
    };

    const mockSubscription = {
      id: `sub_mock_${Date.now()}`,
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
    };

    // Store membership in database
    const { data: membership, error } = await supabase
      .from('memberships')
      .insert([
        {
          inspector_id: inspectorId,
          stripe_customer_id: mockCustomer.id,
          stripe_subscription_id: mockSubscription.id,
          status: mockSubscription.status,
          plan_type: planType,
          amount: planType === 'premium' ? 99.00 : 49.00,
          current_period_start: new Date(mockSubscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(mockSubscription.current_period_end * 1000).toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to create membership record' });
    }

    // Update inspector to premium status
    const { error: updateError } = await supabase
      .from('inspectors')
      .update({ 
        is_premium: true, 
        premium_since: new Date().toISOString() 
      })
      .eq('id', inspectorId);

    if (updateError) {
      console.error('Inspector update error:', updateError);
    }

    return res.status(200).json({
      success: true,
      membership,
      subscription: mockSubscription,
      customer: mockCustomer
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    return res.status(500).json({ 
      error: 'Failed to create subscription',
      details: error.message 
    });
  }
}