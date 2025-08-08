import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    // Note: Stripe webhook verification placeholder
    // When you add your Stripe webhook secret to .env.local, uncomment this:
    /*
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }
    */

    // For demo purposes, parse the request body
    let event;
    try {
      event = JSON.parse(buf.toString());
    } catch (parseError) {
      console.error('Failed to parse webhook body:', parseError);
      return res.status(400).json({ error: 'Invalid request body' });
    }
    
    // Ensure event has required properties
    if (!event || !event.type) {
      return res.status(400).json({ error: 'Invalid event format' });
    }

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleSubscriptionUpdate(subscription) {
  try {
    const { error } = await supabase
      .from('memberships')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Failed to update subscription:', error);
    }
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionCancellation(subscription) {
  try {
    // Update membership status
    const { error: membershipError } = await supabase
      .from('memberships')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (membershipError) {
      console.error('Failed to update membership:', membershipError);
      return;
    }

    // Get inspector ID and update premium status
    const { data: membership } = await supabase
      .from('memberships')
      .select('inspector_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (membership) {
      const { error: inspectorError } = await supabase
        .from('inspectors')
        .update({ 
          is_premium: false, 
          premium_since: null 
        })
        .eq('id', membership.inspector_id);

      if (inspectorError) {
        console.error('Failed to update inspector status:', inspectorError);
      }
    }
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

async function handlePaymentSucceeded(invoice) {
  try {
    console.log(`Payment succeeded for subscription: ${invoice.subscription}`);
    // Add any additional logic for successful payments
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(invoice) {
  try {
    console.log(`Payment failed for subscription: ${invoice.subscription}`);
    // Add logic for failed payments (e.g., send reminder emails)
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}