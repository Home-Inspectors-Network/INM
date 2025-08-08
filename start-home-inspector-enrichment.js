#!/usr/bin/env node

/**
 * Start Home Inspector Enrichment Process
 * This script kicks off the enrichment for all pending home inspectors
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🏠 HOME INSPECTOR ENRICHMENT LAUNCHER');
console.log('=====================================\n');

console.log('📊 Checking current status...\n');

// First check the status
const statusCheck = spawn('node', [path.join(__dirname, 'scripts', 'check-home-inspector-status.js')], {
  stdio: 'inherit'
});

statusCheck.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Status check failed');
    process.exit(1);
  }
  
  console.log('\n🚀 Starting enrichment process...\n');
  console.log('This will enrich home inspectors in batches of 20.');
  console.log('Progress reports will be shown every 40 inspectors.\n');
  
  // Start the enrichment
  const enrichment = spawn('node', [path.join(__dirname, 'scripts', 'enrich-home-inspectors.js')], {
    stdio: 'inherit'
  });
  
  enrichment.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Enrichment process completed successfully!');
      console.log('📄 Check logs/home-inspector-enrichment.log for details');
      console.log('📊 Check logs/home-inspector-enrichment-report.json for summary');
    } else {
      console.error('\n❌ Enrichment process failed');
      process.exit(1);
    }
  });
  
  enrichment.on('error', (error) => {
    console.error('❌ Failed to start enrichment:', error);
    process.exit(1);
  });
});