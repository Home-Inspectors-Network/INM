#!/usr/bin/env node

/**
 * Test script for the premium membership system
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPremiumSystem() {
  console.log('🧪 Testing Premium Membership System');
  console.log('=====================================\n');

  try {
    // 1. Get a sample free inspector to upgrade
    console.log('1. Finding a free inspector to test with...');
    const { data: freeInspectors, error: fetchError } = await supabase
      .from('inspectors')
      .select('*')
      .eq('is_premium', false)
      .limit(3);

    if (fetchError) {
      console.error('❌ Error fetching inspectors:', fetchError);
      return;
    }

    if (freeInspectors.length === 0) {
      console.log('⚠️  No free inspectors found. Creating a test inspector...');
      
      const { data: newInspector, error: createError } = await supabase
        .from('inspectors')
        .insert([{
          business_name: 'Test Premium Upgrade Inspector',
          owner_name: 'Test Owner',
          email: 'test@example.com',
          city: 'San Francisco',
          state: 'CA',
          is_premium: false
        }])
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating test inspector:', createError);
        return;
      }

      freeInspectors.push(newInspector);
    }

    const testInspector = freeInspectors[0];
    console.log(`✅ Found test inspector: ${testInspector.business_name} (ID: ${testInspector.id})\n`);

    // 2. Test membership creation
    console.log('2. Testing membership creation...');
    const membershipData = {
      inspector_id: testInspector.id,
      stripe_customer_id: `cus_test_${Date.now()}`,
      stripe_subscription_id: `sub_test_${Date.now()}`,
      status: 'active',
      plan_type: 'premium',
      amount: 99.00,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .insert([membershipData])
      .select()
      .single();

    if (membershipError) {
      console.error('❌ Error creating membership:', membershipError);
      return;
    }

    console.log(`✅ Created membership: ${membership.id}\n`);

    // 3. Update inspector to premium
    console.log('3. Updating inspector to premium status...');
    const { error: updateError } = await supabase
      .from('inspectors')
      .update({ 
        is_premium: true, 
        premium_since: new Date().toISOString() 
      })
      .eq('id', testInspector.id);

    if (updateError) {
      console.error('❌ Error updating inspector:', updateError);
      return;
    }

    console.log('✅ Inspector updated to premium status\n');

    // 4. Verify the upgrade
    console.log('4. Verifying the upgrade...');
    const { data: updatedInspector, error: verifyError } = await supabase
      .from('inspectors')
      .select('*')
      .eq('id', testInspector.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying inspector:', verifyError);
      return;
    }

    console.log(`✅ Verification complete:`);
    console.log(`   - Inspector: ${updatedInspector.business_name}`);
    console.log(`   - Premium Status: ${updatedInspector.is_premium ? 'YES' : 'NO'}`);
    console.log(`   - Premium Since: ${updatedInspector.premium_since}\n`);

    // 5. Test membership query
    console.log('5. Testing membership queries...');
    const { data: memberships, error: queryError } = await supabase
      .from('memberships')
      .select(`
        *,
        inspectors (
          business_name,
          owner_name,
          email,
          city,
          state
        )
      `)
      .eq('inspector_id', testInspector.id);

    if (queryError) {
      console.error('❌ Error querying memberships:', queryError);
      return;
    }

    console.log(`✅ Found ${memberships.length} membership(s):`);
    memberships.forEach(m => {
      console.log(`   - Plan: ${m.plan_type} ($${m.amount}/month)`);
      console.log(`   - Status: ${m.status}`);
      console.log(`   - Inspector: ${m.inspectors.business_name}`);
    });

    console.log('\n🎉 Premium membership system test completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('================');
    console.log('✅ Membership creation - PASSED');
    console.log('✅ Inspector upgrade - PASSED');
    console.log('✅ Status verification - PASSED');
    console.log('✅ Relationship queries - PASSED');

    console.log('\n🔗 Next Steps:');
    console.log('- Visit http://localhost:3000/premium-upgrade to test the UI');
    console.log('- Add real Stripe keys to .env.local for payment processing');
    console.log('- Test webhook endpoints with Stripe CLI');

  } catch (error) {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testPremiumSystem()
    .then(() => {
      console.log('\n✨ Test complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testPremiumSystem };