#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

async function testFirecrawl() {
  console.log('🧪 Testing Firecrawl API Access\n');
  
  const apiKey = process.env.FIRECRAWL_API_KEY;
  console.log(`API Key: ${apiKey ? '✅ Found' : '❌ Missing'}`);
  
  if (!apiKey) {
    console.error('Please set FIRECRAWL_API_KEY in .env.local');
    return;
  }

  // Test 1: Simple scrape
  console.log('\n📄 Test 1: Simple Scrape');
  try {
    const response = await axios.post(
      'https://api.firecrawl.dev/v1/scrape',
      {
        url: 'https://example.com',
        formats: ['markdown']
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Scrape successful!');
    console.log(`Response status: ${response.status}`);
  } catch (error) {
    console.error('❌ Scrape failed:', error.response?.data || error.message);
  }

  // Test 2: Search
  console.log('\n🔍 Test 2: Search');
  try {
    const response = await axios.post(
      'https://api.firecrawl.dev/v1/search',
      {
        query: 'home inspectors Houston',
        limit: 3
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Search successful!');
    console.log(`Found ${response.data.data.length} results`);
  } catch (error) {
    console.error('❌ Search failed:', error.response?.data || error.message);
  }

  // Test 3: Extract
  console.log('\n🎯 Test 3: Extract');
  try {
    const response = await axios.post(
      'https://api.firecrawl.dev/v1/extract',
      {
        urls: ['https://www.firecrawl.dev'],
        prompt: 'Extract the company name and description',
        schema: {
          type: 'object',
          properties: {
            companyName: { type: 'string' },
            description: { type: 'string' }
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Extract successful!');
    console.log('Data:', response.data.data);
  } catch (error) {
    console.error('❌ Extract failed:', error.response?.data || error.message);
  }
}

testFirecrawl();