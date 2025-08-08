const fs = require('fs-extra');
const path = require('path');

async function checkProgress() {
  console.log('🔍 Inspector Harvest Progress Check');
  console.log('==================================\n');
  
  const logFile = path.join(__dirname, '..', 'logs', 'quick-harvester.log');
  
  try {
    if (await fs.exists(logFile)) {
      const logContent = await fs.readFile(logFile, 'utf8');
      const logLines = logContent.split('\\n');
      
      // Count successful additions
      const addedInspectors = logLines.filter(line => line.includes('✅ Added:')).length;
      const skippedDuplicates = logLines.filter(line => line.includes('⏭️  Skipped duplicate:')).length;
      const completedCities = logLines.filter(line => line.includes('✅ Completed')).length;
      const errors = logLines.filter(line => line.includes('[ERROR]')).length;
      
      // Get latest progress update
      const progressUpdates = logLines.filter(line => line.includes('📈 Progress:'));
      const latestProgress = progressUpdates[progressUpdates.length - 1];
      
      // Get some examples of collected inspectors
      const addedLines = logLines.filter(line => line.includes('✅ Added:'));
      const examples = addedLines.slice(0, 10).map(line => {
        const match = line.match(/✅ Added: (.+)/);
        return match ? match[1] : '';
      }).filter(Boolean);
      
      console.log('📊 Current Statistics:');
      console.log(`   Inspectors Collected: ${addedInspectors}`);
      console.log(`   Duplicates Skipped: ${skippedDuplicates}`);
      console.log(`   Cities Completed: ${completedCities}`);
      console.log(`   Errors: ${errors}`);
      
      if (latestProgress) {
        console.log(`   Latest Update: ${latestProgress.split('] ')[1]}`);
      }
      
      console.log('\\n🏢 Sample Inspectors Collected:');
      examples.forEach((name, index) => {
        console.log(`   ${index + 1}. ${name}`);
      });
      
      if (examples.length === 0) {
        console.log('   (No inspectors collected yet)');
      }
      
      // Check for any data files
      const logsDir = path.join(__dirname, '..', 'logs');
      const files = await fs.readdir(logsDir);
      const dataFiles = files.filter(f => f.includes('inspector-data-'));
      
      if (dataFiles.length > 0) {
        console.log('\\n📁 Data Files Generated:');
        dataFiles.forEach(file => {
          console.log(`   ${file}`);
        });
      }
      
      console.log('\\n🎯 Target: 10,000 inspectors');
      console.log(`Progress: ${addedInspectors}/10,000 (${(addedInspectors/100).toFixed(1)}%)`);
      
      if (addedInspectors > 0) {
        console.log('\\n✅ Data collection is working!');
        console.log('💡 To continue harvesting, run: npm run harvest-quick');
      } else {
        console.log('\\n⚠️  No inspectors collected yet. Check for API issues.');
      }
      
    } else {
      console.log('❌ No harvest log file found');
      console.log('💡 Start harvesting with: npm run harvest-quick');
    }
    
  } catch (error) {
    console.error('Error checking progress:', error.message);
  }
}

checkProgress();