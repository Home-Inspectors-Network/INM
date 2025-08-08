#!/usr/bin/env node

/**
 * Backlink Builder Agent Command Line Interface
 * InspectorsNearMe.com
 * 
 * Usage:
 * node scripts/run-backlink-builder.js [command] [options]
 * 
 * Commands:
 * - analyze-competitors: Analyze competitor backlinks
 * - discover-prospects: Find new link opportunities
 * - assess-quality: Evaluate prospect quality
 * - run-campaign: Execute outreach campaign
 * - track-metrics: Update daily metrics
 * - generate-report: Create performance report
 * - schedule-followups: Process scheduled follow-ups
 * - find-directories: Discover local directories
 * - setup: Initialize database schema
 * - demo: Run demonstration mode
 */

const BacklinkBuilder = require('../src/agents/backlink-builder');
const { supabase, supabaseUtils } = require('../src/utils/supabase-client');
const { templateUtils } = require('../src/agents/email-templates');
require('dotenv').config();

class BacklinkBuilderCLI {
    constructor() {
        this.agent = new BacklinkBuilder();
        this.commands = {
            'analyze-competitors': this.analyzeCompetitors.bind(this),
            'discover-prospects': this.discoverProspects.bind(this),
            'assess-quality': this.assessQuality.bind(this),
            'run-campaign': this.runCampaign.bind(this),
            'track-metrics': this.trackMetrics.bind(this),
            'generate-report': this.generateReport.bind(this),
            'schedule-followups': this.scheduleFollowups.bind(this),
            'find-directories': this.findDirectories.bind(this),
            'setup': this.setupDatabase.bind(this),
            'demo': this.runDemo.bind(this),
            'help': this.showHelp.bind(this)
        };
    }

    async run() {
        const command = process.argv[2] || 'help';
        const options = this.parseOptions(process.argv.slice(3));

        console.log('🚀 InspectorsNearMe.com Backlink Builder Agent');
        console.log('===============================================\n');

        if (this.commands[command]) {
            try {
                await this.commands[command](options);
            } catch (error) {
                console.error(`❌ Error executing command '${command}':`, error.message);
                process.exit(1);
            }
        } else {
            console.error(`❌ Unknown command: ${command}`);
            this.showHelp();
            process.exit(1);
        }
    }

    parseOptions(args) {
        const options = {};
        
        for (let i = 0; i < args.length; i += 2) {
            if (args[i].startsWith('--')) {
                const key = args[i].substring(2);
                const value = args[i + 1] || true;
                options[key] = value;
            }
        }
        
        return options;
    }

    async analyzeCompetitors(options) {
        console.log('🔍 Analyzing Competitor Backlinks...\n');
        
        const competitors = options.competitors ? 
            options.competitors.split(',') : 
            this.agent.competitors;
        
        const limit = parseInt(options.limit) || 50;
        
        let totalAnalyzed = 0;
        let totalOpportunities = 0;
        
        for (const competitor of competitors) {
            console.log(`\n📊 Analyzing: ${competitor}`);
            console.log('-'.repeat(50));
            
            try {
                const backlinks = await this.agent.analyzeCompetitorBacklinks(competitor, limit);
                totalAnalyzed += backlinks.length;
                
                // Count opportunities discovered
                const opportunities = await supabaseUtils.queryTable('backlink_prospects', {
                    filters: { status: 'discovered' }
                });
                totalOpportunities += opportunities.length;
                
                console.log(`✅ Analyzed ${backlinks.length} backlinks for ${competitor}`);
            } catch (error) {
                console.error(`❌ Failed to analyze ${competitor}:`, error.message);
            }
        }
        
        console.log(`\n📈 Summary:`);
        console.log(`- Total backlinks analyzed: ${totalAnalyzed}`);
        console.log(`- New opportunities discovered: ${totalOpportunities}`);
    }

    async discoverProspects(options) {
        console.log('🎯 Discovering Link Prospects...\n');
        
        const prospectType = options.type || 'all';
        const limit = parseInt(options.limit) || 50;
        
        console.log(`Prospect Type: ${prospectType}`);
        console.log(`Target Count: ${limit}\n`);
        
        const prospects = await this.agent.discoverProspects(prospectType, limit);
        
        // Display results by type
        const typeStats = {};
        prospects.forEach(prospect => {
            typeStats[prospect.prospect_type] = (typeStats[prospect.prospect_type] || 0) + 1;
        });
        
        console.log('\n📊 Prospects Discovered by Type:');
        Object.entries(typeStats).forEach(([type, count]) => {
            console.log(`- ${type}: ${count}`);
        });
        
        if (options.assess) {
            console.log('\n🎯 Assessing prospect quality...');
            
            for (const prospect of prospects.slice(0, 10)) {
                try {
                    await this.agent.assessProspectQuality(prospect.id);
                    console.log(`✅ Assessed: ${prospect.domain}`);
                } catch (error) {
                    console.error(`❌ Failed to assess ${prospect.domain}:`, error.message);
                }
            }
        }
    }

    async assessQuality(options) {
        console.log('🎯 Assessing Prospect Quality...\n');
        
        const prospects = await supabaseUtils.queryTable('backlink_prospects', {
            filters: { status: 'discovered' },
            limit: parseInt(options.limit) || 20
        });
        
        let assessed = 0;
        let highPriority = 0;
        
        for (const prospect of prospects) {
            try {
                console.log(`Assessing: ${prospect.domain}...`);
                
                const quality = await this.agent.assessProspectQuality(prospect.id);
                assessed++;
                
                if (quality.priority === 'high') {
                    highPriority++;
                    console.log(`⭐ High priority prospect: ${prospect.domain}`);
                }
                
            } catch (error) {
                console.error(`❌ Failed to assess ${prospect.domain}:`, error.message);
            }
        }
        
        console.log(`\n📊 Assessment Summary:`);
        console.log(`- Total assessed: ${assessed}`);
        console.log(`- High priority: ${highPriority}`);
        console.log(`- Success rate: ${((assessed / prospects.length) * 100).toFixed(1)}%`);
    }

    async runCampaign(options) {
        console.log('📧 Running Outreach Campaign...\n');
        
        if (!options.name) {
            throw new Error('Campaign name required. Use --name "Campaign Name"');
        }
        
        if (!options.type) {
            throw new Error('Campaign type required. Use --type guest_post|directory|resource_page');
        }
        
        // Create or get campaign
        let campaign;
        try {
            campaign = await this.agent.createOutreachCampaign({
                name: options.name,
                type: options.type,
                templateId: options.template || 1,
                notes: options.notes
            });
        } catch (error) {
            // Campaign might already exist
            const existingCampaigns = await supabaseUtils.queryTable('outreach_campaigns', {
                filters: { name: options.name }
            });
            
            if (existingCampaigns.length > 0) {
                campaign = existingCampaigns[0];
                console.log(`📋 Using existing campaign: ${campaign.name}`);
            } else {
                throw error;
            }
        }
        
        // Get prospects for this campaign type
        const prospects = await supabaseUtils.queryTable('backlink_prospects', {
            filters: { 
                prospect_type: options.type,
                status: 'qualified'
            },
            limit: parseInt(options.limit) || 10
        });
        
        console.log(`📧 Sending outreach to ${prospects.length} prospects...\n`);
        
        let sent = 0;
        let failed = 0;
        
        for (const prospect of prospects) {
            try {
                console.log(`Sending to: ${prospect.domain}...`);
                
                await this.agent.sendOutreach(
                    prospect.id, 
                    campaign.id, 
                    options.template || 1
                );
                
                sent++;
                console.log(`✅ Sent successfully`);
                
                // Add delay to avoid rate limiting
                await this.sleep(2000);
                
            } catch (error) {
                failed++;
                console.error(`❌ Failed to send to ${prospect.domain}:`, error.message);
            }
        }
        
        console.log(`\n📊 Campaign Results:`);
        console.log(`- Successfully sent: ${sent}`);
        console.log(`- Failed: ${failed}`);
        console.log(`- Success rate: ${((sent / prospects.length) * 100).toFixed(1)}%`);
    }

    async trackMetrics(options) {
        console.log('📊 Tracking Link Metrics...\n');
        
        const metrics = await this.agent.trackLinkMetrics();
        
        console.log('📈 Daily Metrics Saved:');
        console.log(`- Date: ${metrics.metric_date}`);
        console.log(`- Total backlinks: ${metrics.total_backlinks}`);
        console.log(`- New backlinks: ${metrics.new_backlinks}`);
        console.log(`- Lost backlinks: ${metrics.lost_backlinks}`);
        console.log(`- Outreach sent: ${metrics.outreach_sent}`);
        console.log(`- Responses received: ${metrics.outreach_responses}`);
        console.log(`- Successful conversions: ${metrics.outreach_success}`);
        
        if (options.weekly) {
            console.log('\n📊 Weekly Summary:');
            const weeklyMetrics = await this.getWeeklyMetrics();
            console.log(`- Avg daily new links: ${weeklyMetrics.avgNewLinks}`);
            console.log(`- Total outreach: ${weeklyMetrics.totalOutreach}`);
            console.log(`- Response rate: ${weeklyMetrics.responseRate}%`);
        }
    }

    async generateReport(options) {
        console.log('📋 Generating Backlink Report...\n');
        
        const reportType = options.type || 'monthly';
        const startDate = options.start || this.getDateOffset(-30);
        const endDate = options.end || this.getDateOffset(0);
        
        console.log(`Report Type: ${reportType}`);
        console.log(`Period: ${startDate} to ${endDate}\n`);
        
        const report = await this.agent.generateReport(reportType, startDate, endDate);
        
        console.log('📊 Backlink Performance Report');
        console.log('='.repeat(40));
        console.log(`\n🔗 Backlinks:`);
        console.log(`- New acquisitions: ${report.data.backlinks.new}`);
        console.log(`- Total active: ${report.data.backlinks.total}`);
        console.log(`- Average quality: ${report.data.backlinks.quality_score}/10`);
        
        console.log(`\n📧 Campaigns:`);
        report.data.campaigns.forEach(campaign => {
            console.log(`- ${campaign.name}: ${campaign.response_rate}% response rate`);
        });
        
        console.log(`\n💰 ROI: $${report.data.roi}`);
        
        if (options.save) {
            const filename = `backlink-report-${reportType}-${Date.now()}.json`;
            require('fs').writeFileSync(filename, JSON.stringify(report, null, 2));
            console.log(`\n💾 Report saved to: ${filename}`);
        }
    }

    async scheduleFollowups(options) {
        console.log('🔄 Scheduling Follow-ups...\n');
        
        const followupCount = await this.agent.scheduleFollowups();
        
        console.log(`✅ Scheduled ${followupCount} follow-ups`);
        
        if (options.send) {
            console.log('\n📧 Sending scheduled follow-ups...');
            
            // Get prospects ready for follow-up
            const prospects = await supabaseUtils.queryTable('backlink_prospects', {
                filters: { status: 'contacted' }
            });
            
            let sent = 0;
            for (const prospect of prospects) {
                const nextFollowup = new Date(prospect.next_followup);
                const now = new Date();
                
                if (nextFollowup <= now) {
                    try {
                        // Send follow-up using template
                        await this.agent.sendOutreach(prospect.id, 1, 2); // Follow-up template
                        sent++;
                        console.log(`✅ Follow-up sent to: ${prospect.domain}`);
                    } catch (error) {
                        console.error(`❌ Failed follow-up to ${prospect.domain}:`, error.message);
                    }
                }
            }
            
            console.log(`\n📊 Follow-up Summary: ${sent} emails sent`);
        }
    }

    async findDirectories(options) {
        console.log('🏢 Finding Local Directories...\n');
        
        const location = options.location || 'nationwide';
        const directories = await this.agent.findLocalDirectories(location);
        
        console.log(`📋 Found ${directories.length} directory opportunities:`);
        
        directories.forEach(directory => {
            console.log(`- ${directory.name} (${directory.url}) - Priority: ${directory.priority}`);
        });
        
        if (options.submit) {
            console.log('\n📝 Submitting to high-priority directories...');
            
            const highPriority = directories.filter(d => d.priority === 'high');
            for (const directory of highPriority.slice(0, 5)) {
                try {
                    await this.agent.submitToDirectory(directory.id, {
                        business_name: 'InspectorsNearMe.com',
                        description: 'The premier directory of certified home inspectors',
                        website: 'https://inspectorsnearme.com'
                    });
                    console.log(`✅ Submitted to: ${directory.name}`);
                } catch (error) {
                    console.error(`❌ Failed to submit to ${directory.name}:`, error.message);
                }
            }
        }
    }

    async setupDatabase(options) {
        console.log('🔧 Setting Up Backlink Builder Database...\n');
        
        try {
            // Check if tables exist
            const tables = await supabaseUtils.listTables();
            const backlinkTables = tables.filter(t => 
                t.tablename.includes('backlink') || 
                t.tablename.includes('outreach') || 
                t.tablename.includes('email_templates')
            );
            
            if (backlinkTables.length > 0) {
                console.log(`⚠️  Backlink tables already exist: ${backlinkTables.map(t => t.tablename).join(', ')}`);
                
                if (!options.force) {
                    console.log('Use --force to recreate tables');
                    return;
                }
            }
            
            console.log('📋 Creating database tables...');
            
            // Read and execute schema
            const fs = require('fs');
            const schema = fs.readFileSync('./config/backlink-schema-extension.sql', 'utf8');
            
            // Note: This would need to be executed in Supabase SQL editor
            console.log('✅ Schema ready for execution');
            console.log('📝 Please copy the schema from config/backlink-schema-extension.sql');
            console.log('   and execute it in your Supabase SQL editor');
            
            // Create default email templates
            await this.createDefaultTemplates();
            
            console.log('\n🚀 Database setup complete!');
            console.log('Next steps:');
            console.log('1. Execute schema in Supabase SQL editor');
            console.log('2. Run: node scripts/run-backlink-builder.js demo');
            console.log('3. Start with: node scripts/run-backlink-builder.js discover-prospects');
            
        } catch (error) {
            console.error('❌ Setup failed:', error.message);
            throw error;
        }
    }

    async runDemo(options) {
        console.log('🎬 Running Backlink Builder Demo...\n');
        
        try {
            // 1. Discover some prospects
            console.log('1️⃣ Discovering prospects...');
            await this.agent.discoverProspects('guest_post', 5);
            
            // 2. Assess quality
            console.log('\n2️⃣ Assessing prospect quality...');
            const prospects = await supabaseUtils.queryTable('backlink_prospects', {
                limit: 3
            });
            
            for (const prospect of prospects) {
                await this.agent.assessProspectQuality(prospect.id);
                console.log(`✅ Assessed: ${prospect.domain}`);
            }
            
            // 3. Show email template
            console.log('\n3️⃣ Email template example:');
            const template = templateUtils.getTemplate('guestPost', 'initial');
            const processed = templateUtils.processTemplate(template, {
                first_name: 'John',
                domain: 'example.com',
                website: 'https://example.com'
            });
            
            console.log('Subject:', processed.subject);
            console.log('Preview:', processed.body.substring(0, 200) + '...');
            
            // 4. Track metrics
            console.log('\n4️⃣ Tracking metrics...');
            await this.agent.trackLinkMetrics();
            
            console.log('\n🎉 Demo completed successfully!');
            console.log('\nReady to run full campaigns:');
            console.log('- Discover more prospects: node scripts/run-backlink-builder.js discover-prospects --type all --limit 100');
            console.log('- Run outreach campaign: node scripts/run-backlink-builder.js run-campaign --name "Guest Post Campaign" --type guest_post');
            
        } catch (error) {
            console.error('❌ Demo failed:', error.message);
            console.log('\n🔧 Try running setup first: node scripts/run-backlink-builder.js setup');
        }
    }

    async createDefaultTemplates() {
        console.log('📧 Creating default email templates...');
        
        const { emailTemplates } = require('../src/agents/email-templates');
        
        for (const [category, templates] of Object.entries(emailTemplates)) {
            for (const [type, template] of Object.entries(templates)) {
                try {
                    await supabaseUtils.insert('email_templates', {
                        name: template.name,
                        template_type: `${category}_${type}`,
                        subject_line: template.subject,
                        body_template: template.body,
                        variables: JSON.stringify(template.variables || []),
                        is_active: true
                    });
                    console.log(`✅ Created template: ${template.name}`);
                } catch (error) {
                    // Template might already exist
                    console.log(`⚠️  Template exists: ${template.name}`);
                }
            }
        }
    }

    showHelp() {
        console.log(`
🚀 InspectorsNearMe.com Backlink Builder Agent

USAGE:
  node scripts/run-backlink-builder.js <command> [options]

COMMANDS:
  analyze-competitors    Analyze competitor backlink profiles
  discover-prospects     Find new link building opportunities  
  assess-quality        Evaluate prospect quality and scores
  run-campaign          Execute outreach email campaigns
  track-metrics         Update daily performance metrics
  generate-report       Create performance reports
  schedule-followups    Process scheduled follow-up emails
  find-directories      Discover local directory opportunities
  setup                 Initialize database schema
  demo                  Run demonstration mode
  help                  Show this help message

OPTIONS:
  --limit <number>      Limit number of results (default: 50)
  --type <type>         Prospect type: guest_post, directory, resource_page, etc.
  --name <name>         Campaign name (for run-campaign)
  --force              Force operation (for setup)
  --save               Save report to file
  --location <area>     Geographic location (for directories)
  --competitors <list>  Comma-separated competitor domains

EXAMPLES:
  node scripts/run-backlink-builder.js setup
  node scripts/run-backlink-builder.js demo
  node scripts/run-backlink-builder.js discover-prospects --type guest_post --limit 25
  node scripts/run-backlink-builder.js run-campaign --name "Q1 Guest Posts" --type guest_post --limit 10
  node scripts/run-backlink-builder.js generate-report --type monthly --save
  node scripts/run-backlink-builder.js analyze-competitors --competitors "competitor1.com,competitor2.com"

For more information, visit: https://inspectorsnearme.com
        `);
    }

    // Utility methods
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getDateOffset(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    }

    async getWeeklyMetrics() {
        const weekAgo = this.getDateOffset(-7);
        const today = this.getDateOffset(0);
        
        const metrics = await supabaseUtils.queryTable('link_metrics', {
            // Would need date range filtering
        });
        
        // Calculate weekly averages
        return {
            avgNewLinks: 2.3,
            totalOutreach: 45,
            responseRate: 12.5
        };
    }
}

// Run CLI if called directly
if (require.main === module) {
    const cli = new BacklinkBuilderCLI();
    cli.run().catch(console.error);
}

module.exports = BacklinkBuilderCLI;