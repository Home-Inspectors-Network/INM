#!/usr/bin/env node

/**
 * Enhanced Multi-City Enrichment System Executor
 * Coordinates the entire enrichment process for all inspectors
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

async function executeEnrichmentSystem() {
  console.log('🚀 ENHANCED MULTI-CITY ENRICHMENT SYSTEM');
  console.log('========================================');
  console.log('Target: Process all inspectors with 0/100 quality scores');
  console.log('Goal: Achieve 80+ inspectors with excellent scores (85+)');
  console.log('');

  try {
    // Ensure logs directory exists
    await fs.ensureDir(path.join(__dirname, 'logs'));

    // Step 1: Generate baseline progress report
    console.log('📊 Step 1: Generating baseline progress report...');
    await runScript('enrichment-progress-monitor.js');
    
    console.log('');
    console.log('⏳ Starting enrichment process...');

    // Step 2: Execute comprehensive enrichment
    console.log('🔍 Step 2: Starting comprehensive enrichment system...');
    console.log('⏱️  Processing inspectors with 3-second delays between requests');
    console.log('💾 Progress logged to: logs/comprehensive-enrichment.log');
    console.log('');

    await runScript('execute-comprehensive-enrichment.js');

    console.log('');
    console.log('✅ ENRICHMENT COMPLETED!');
    console.log('======================');

    // Step 3: Generate final progress report
    console.log('📊 Step 3: Generating final progress report...');
    await runScript('enrichment-progress-monitor.js');

    console.log('');
    console.log('🎉 ENRICHMENT SYSTEM COMPLETE!');
    console.log('=============================');
    console.log('📄 Check detailed reports in the logs/ directory');
    console.log('🌟 Review top performers and quality improvements');

  } catch (error) {
    console.error('💥 Enrichment system failed:', error.message);
    process.exit(1);
  }
}

function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'scripts', scriptName);
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      cwd: __dirname
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script ${scriptName} exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Execute if run directly
if (require.main === module) {
  executeEnrichmentSystem()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Execution failed:', error);
      process.exit(1);
    });
}

module.exports = { executeEnrichmentSystem };