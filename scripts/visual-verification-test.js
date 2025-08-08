#!/usr/bin/env node

/**
 * Visual Verification Test Suite
 * Tests all UI changes and verifies California Bay Area focus
 */

const { chromium } = require('playwright');
const fs = require('fs-extra');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');

// Test configuration
const TESTS = [
  {
    name: 'homepage-bay-area-cities',
    url: '/',
    description: 'Homepage shows Bay Area cities in popular cities section',
    checks: [
      { selector: 'main >> text=San Francisco, CA', description: 'San Francisco link exists in main section' },
      { selector: 'main >> text=San Jose, CA', description: 'San Jose link exists in main section' },
      { selector: 'main >> text=Oakland, CA', description: 'Oakland link exists in main section' },
      { selector: 'main >> text=Palo Alto, CA', description: 'Palo Alto link exists in main section' }
    ]
  },
  {
    name: 'homepage-testimonials',
    url: '/',
    description: 'Homepage testimonials show Bay Area customer names',
    checks: [
      { selector: 'text=Sarah M., San Francisco', description: 'Sarah from San Francisco testimonial' },
      { selector: 'text=Michael R., San Jose', description: 'Michael from San Jose testimonial' },
      { selector: 'text=Jennifer L., Oakland', description: 'Jennifer from Oakland testimonial' }
    ]
  },
  {
    name: 'footer-bay-area-cities',
    url: '/',
    description: 'Footer shows Bay Area cities instead of Texas cities',
    checks: [
      { selector: 'footer >> text=San Francisco, CA', description: 'Footer has San Francisco' },
      { selector: 'footer >> text=San Jose, CA', description: 'Footer has San Jose' },
      { selector: 'footer >> text=Oakland, CA', description: 'Footer has Oakland' },
      { selector: 'footer >> text=Palo Alto, CA', description: 'Footer has Palo Alto' }
    ]
  },
  {
    name: 'san-francisco-city-page',
    url: '/ca/san-francisco',
    description: 'San Francisco city page shows actual inspector count and listings',
    checks: [
      { selector: 'h1:has-text("Home Inspectors in San Francisco, California")', description: 'Correct page title' },
      { selector: 'text=/\\d+ certified inspectors/', description: 'Shows actual inspector count' },
      { selector: '[data-testid="inspector-card"], .card:has(h3)', description: 'Inspector cards are displayed', multiple: true }
    ]
  },
  {
    name: 'inspector-profile-golden-gate',
    url: '/inspectors/2',
    description: 'Golden Gate Home Inspections profile shows enriched data',
    checks: [
      { selector: 'h1:has-text("Golden Gate Home Inspections")', description: 'Correct inspector name' },
      { selector: 'text=/5\\.0 \\(\\d+ reviews\\)/', description: 'Shows rating and review count' },
      { selector: 'button:has-text("services")', description: 'Shows services tab' }
    ]
  },
  {
    name: 'enriched-services-display',
    url: '/ca/san-francisco',
    description: 'Enriched services display correctly on city page',
    checks: [
      { selector: 'text=Golden Gate Home Inspections', description: 'Golden Gate inspector listed' },
      { selector: 'text=Services (7):', description: 'Golden Gate shows 7 services' },
      { selector: 'text=California Healthy Home Inspections', description: 'California Healthy inspector listed' },
      { selector: 'text=Services (6):', description: 'California Healthy shows 6 services' }
    ]
  }
];

async function runVisualTests() {
  console.log('🧪 Starting Visual Verification Tests');
  console.log('=====================================\n');

  // Ensure screenshot directory exists
  await fs.ensureDir(SCREENSHOT_DIR);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = [];

  for (const test of TESTS) {
    console.log(`📋 Testing: ${test.description}`);
    console.log(`🔗 URL: ${BASE_URL}${test.url}`);

    try {
      // Navigate to the page
      await page.goto(`${BASE_URL}${test.url}`, { waitUntil: 'networkidle' });
      
      // Wait a bit for dynamic content to load
      await page.waitForTimeout(2000);

      // Take a screenshot
      const screenshotPath = path.join(SCREENSHOT_DIR, `${test.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Screenshot saved: ${screenshotPath}`);

      // Run checks
      for (const check of test.checks) {
        totalTests++;
        try {
          if (check.multiple) {
            // For multiple elements, just check if at least one exists  
            const elements = await page.locator(check.selector).count();
            if (elements > 0) {
              console.log(`  ✅ PASS: ${check.description} (${elements} elements found)`);
              passedTests++;
            } else {
              console.log(`  ❌ FAIL: ${check.description} (no elements found)`);
              failedTests.push(`${test.name}: ${check.description}`);
            }
          } else {
            // For single elements
            const element = page.locator(check.selector);
            await element.waitFor({ timeout: 5000 });
            console.log(`  ✅ PASS: ${check.description}`);
            passedTests++;
          }
        } catch (error) {
          console.log(`  ❌ FAIL: ${check.description} - ${error.message}`);
          failedTests.push(`${test.name}: ${check.description}`);
        }
      }

    } catch (error) {
      console.log(`  🚨 ERROR: Failed to load page - ${error.message}`);
      failedTests.push(`${test.name}: Page load failed`);
    }

    console.log(''); // Empty line between tests
  }

  await browser.close();

  // Print summary
  console.log('📊 Test Summary');
  console.log('===============');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (failedTests.length > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(test => console.log(`  - ${test}`));
  }

  const successRate = (passedTests / totalTests * 100).toFixed(1);
  console.log(`\n🎯 Success Rate: ${successRate}%`);

  if (successRate >= 95) {
    console.log('\n🎉 EXCELLENT! All major UI changes verified successfully!');
  } else if (successRate >= 80) {
    console.log('\n✅ GOOD! Most UI changes working correctly, minor issues to address.');
  } else {
    console.log('\n⚠️  NEEDS ATTENTION! Several UI issues need to be fixed.');
  }

  // Exit with appropriate code
  process.exit(failedTests.length > 0 ? 1 : 0);
}

// Additional function to test specific inspector data
async function testInspectorData() {
  console.log('\n🔍 Testing Inspector Data Quality');
  console.log('=================================');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Test API directly
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/inspectors/search?state=CA&city=san-francisco');
      return await res.json();
    });

    console.log(`📊 Found ${response.inspectors?.length || 0} inspectors in San Francisco`);
    
    if (response.inspectors?.length > 0) {
      // Check for enriched data
      const enrichedCount = response.inspectors.filter(i => 
        i.detailed_services?.length > 0 || i.enrichment_status === 'completed'
      ).length;
      
      console.log(`🔍 ${enrichedCount} inspectors have enriched data`);
      console.log(`📈 Enrichment rate: ${(enrichedCount / response.inspectors.length * 100).toFixed(1)}%`);

      // Sample some inspector data
      console.log('\n📋 Sample Inspector Data:');
      response.inspectors.slice(0, 3).forEach((inspector, i) => {
        console.log(`  ${i + 1}. ${inspector.business_name}`);
        console.log(`     - Rating: ${inspector.rating} (${inspector.review_count} reviews)`);
        console.log(`     - Services: ${inspector.detailed_services?.length || inspector.services?.length || 0}`);
        console.log(`     - Enriched: ${inspector.enrichment_status || 'No'}`);
      });
    }

  } catch (error) {
    console.log(`❌ Error testing inspector data: ${error.message}`);
  }

  await browser.close();
}

// Run all tests
if (require.main === module) {
  runVisualTests()
    .then(() => testInspectorData())
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runVisualTests, testInspectorData };