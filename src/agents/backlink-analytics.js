const { supabase, supabaseUtils } = require('../utils/supabase-client');

/**
 * Backlink Analytics and Reporting System
 * InspectorsNearMe.com
 * 
 * Provides comprehensive analytics, reporting, and performance tracking
 * for backlink building campaigns and link portfolio health.
 */
class BacklinkAnalytics {
    constructor() {
        this.domain = 'inspectorsnearme.com';
    }

    /**
     * PERFORMANCE DASHBOARDS
     */

    async getDashboardOverview(period = '30d') {
        console.log(`📊 Generating dashboard overview for ${period}...`);

        try {
            const dateRange = this.getDateRange(period);
            
            const overview = {
                period: period,
                generated_at: new Date().toISOString(),
                summary: {},
                charts: {},
                insights: []
            };

            // Core metrics
            overview.summary = await this.getCoreMetrics(dateRange);
            
            // Chart data
            overview.charts = {
                linkAcquisition: await this.getLinkAcquisitionChart(dateRange),
                campaignPerformance: await this.getCampaignPerformanceChart(dateRange),
                qualityDistribution: await this.getQualityDistributionChart(),
                anchorTextDistribution: await this.getAnchorTextChart(),
                prospectFunnel: await this.getProspectFunnelChart(dateRange)
            };

            // Insights and recommendations
            overview.insights = await this.generateInsights(overview.summary, overview.charts);

            return overview;

        } catch (error) {
            console.error('Error generating dashboard overview:', error);
            throw error;
        }
    }

    async getCoreMetrics(dateRange) {
        console.log('📈 Calculating core metrics...');

        try {
            // Backlink metrics
            const totalBacklinks = await this.getTotalBacklinks();
            const newBacklinks = await this.getNewBacklinks(dateRange);
            const lostBacklinks = await this.getLostBacklinks(dateRange);
            const avgDomainAuthority = await this.getAverageDomainAuthority();

            // Campaign metrics
            const activeCampaigns = await this.getActiveCampaigns();
            const totalOutreach = await this.getTotalOutreach(dateRange);
            const responseRate = await this.getResponseRate(dateRange);
            const conversionRate = await this.getConversionRate(dateRange);

            // Quality metrics
            const qualityScore = await this.getAverageQualityScore();
            const riskLevel = await this.getRiskAssessment();
            
            // ROI metrics
            const totalCost = await this.getTotalCost(dateRange);
            const estimatedValue = await this.getEstimatedValue(dateRange);
            const roi = totalCost > 0 ? ((estimatedValue - totalCost) / totalCost * 100) : 0;

            return {
                backlinks: {
                    total: totalBacklinks,
                    new: newBacklinks,
                    lost: lostBacklinks,
                    net_growth: newBacklinks - lostBacklinks,
                    avg_domain_authority: avgDomainAuthority,
                    quality_score: qualityScore
                },
                campaigns: {
                    active: activeCampaigns,
                    total_outreach: totalOutreach,
                    response_rate: responseRate,
                    conversion_rate: conversionRate
                },
                performance: {
                    total_cost: totalCost,
                    estimated_value: estimatedValue,
                    roi: roi,
                    risk_level: riskLevel
                }
            };

        } catch (error) {
            console.error('Error calculating core metrics:', error);
            throw error;
        }
    }

    async getLinkAcquisitionChart(dateRange) {
        console.log('📅 Building link acquisition chart...');

        try {
            const query = `
                SELECT 
                    DATE(date_acquired) as date,
                    COUNT(*) as new_links,
                    AVG(value_score) as avg_quality
                FROM backlinks 
                WHERE date_acquired BETWEEN $1 AND $2
                    AND is_active = true
                GROUP BY DATE(date_acquired)
                ORDER BY date
            `;

            const { data, error } = await supabase.rpc('execute_query', {
                query,
                params: [dateRange.start, dateRange.end]
            });

            if (error) throw error;

            return {
                type: 'line',
                title: 'Daily Link Acquisitions',
                data: data.map(row => ({
                    date: row.date,
                    new_links: row.new_links,
                    avg_quality: parseFloat(row.avg_quality) || 0
                })),
                metrics: {
                    total_days: data.length,
                    avg_daily: data.reduce((sum, row) => sum + row.new_links, 0) / data.length,
                    best_day: data.reduce((max, row) => row.new_links > max.new_links ? row : max, { new_links: 0 })
                }
            };

        } catch (error) {
            console.error('Error building acquisition chart:', error);
            return { type: 'line', data: [], error: error.message };
        }
    }

    async getCampaignPerformanceChart(dateRange) {
        console.log('📊 Building campaign performance chart...');

        try {
            const campaigns = await supabaseUtils.queryTable('campaign_performance', {});

            const chartData = campaigns.map(campaign => ({
                name: campaign.name,
                sent: campaign.total_attempts || 0,
                opened: campaign.opens || 0,
                responded: campaign.responses || 0,
                converted: campaign.positive_responses || 0,
                open_rate: campaign.open_rate || 0,
                response_rate: campaign.response_rate || 0,
                conversion_rate: campaign.positive_responses > 0 ? 
                    (campaign.positive_responses / campaign.total_attempts * 100) : 0
            }));

            return {
                type: 'bar',
                title: 'Campaign Performance Comparison',
                data: chartData,
                metrics: {
                    total_campaigns: chartData.length,
                    avg_response_rate: chartData.reduce((sum, c) => sum + c.response_rate, 0) / chartData.length,
                    best_performer: chartData.reduce((max, c) => c.response_rate > max.response_rate ? c : max, { response_rate: 0 })
                }
            };

        } catch (error) {
            console.error('Error building campaign chart:', error);
            return { type: 'bar', data: [], error: error.message };
        }
    }

    async getQualityDistributionChart() {
        console.log('🎯 Building quality distribution chart...');

        try {
            const backlinks = await supabaseUtils.queryTable('backlinks', {
                columns: 'value_score, domain_authority'
            });

            const qualityBuckets = {
                'High (8-10)': 0,
                'Medium (5-7)': 0,
                'Low (1-4)': 0,
                'Unscored': 0
            };

            const daBuckets = {
                '70+': 0,
                '50-69': 0,
                '30-49': 0,
                '10-29': 0,
                'Unknown': 0
            };

            backlinks.forEach(link => {
                // Quality score distribution
                if (link.value_score >= 8) qualityBuckets['High (8-10)']++;
                else if (link.value_score >= 5) qualityBuckets['Medium (5-7)']++;
                else if (link.value_score >= 1) qualityBuckets['Low (1-4)']++;
                else qualityBuckets['Unscored']++;

                // Domain authority distribution
                if (link.domain_authority >= 70) daBuckets['70+']++;
                else if (link.domain_authority >= 50) daBuckets['50-69']++;
                else if (link.domain_authority >= 30) daBuckets['30-49']++;
                else if (link.domain_authority >= 10) daBuckets['10-29']++;
                else daBuckets['Unknown']++;
            });

            return {
                type: 'pie',
                title: 'Link Quality Distribution',
                data: {
                    quality: Object.entries(qualityBuckets).map(([label, count]) => ({
                        label,
                        count,
                        percentage: (count / backlinks.length * 100).toFixed(1)
                    })),
                    domain_authority: Object.entries(daBuckets).map(([label, count]) => ({
                        label,
                        count,
                        percentage: (count / backlinks.length * 100).toFixed(1)
                    }))
                },
                metrics: {
                    total_links: backlinks.length,
                    avg_quality: backlinks.reduce((sum, link) => sum + (link.value_score || 0), 0) / backlinks.length,
                    high_quality_percent: (qualityBuckets['High (8-10)'] / backlinks.length * 100).toFixed(1)
                }
            };

        } catch (error) {
            console.error('Error building quality chart:', error);
            return { type: 'pie', data: [], error: error.message };
        }
    }

    async getAnchorTextChart() {
        console.log('🔗 Building anchor text distribution chart...');

        try {
            const anchorData = await supabaseUtils.queryTable('anchor_text_analysis', {
                orderBy: 'usage_count',
                ascending: false,
                limit: 20
            });

            const typeDistribution = {};
            let totalUsage = 0;

            anchorData.forEach(anchor => {
                const type = anchor.anchor_type || 'unknown';
                typeDistribution[type] = (typeDistribution[type] || 0) + anchor.usage_count;
                totalUsage += anchor.usage_count;
            });

            return {
                type: 'doughnut',
                title: 'Anchor Text Distribution',
                data: {
                    top_anchors: anchorData.slice(0, 10).map(anchor => ({
                        text: anchor.anchor_text,
                        count: anchor.usage_count,
                        type: anchor.anchor_type,
                        risk_level: anchor.risk_level
                    })),
                    type_distribution: Object.entries(typeDistribution).map(([type, count]) => ({
                        type,
                        count,
                        percentage: (count / totalUsage * 100).toFixed(1)
                    }))
                },
                metrics: {
                    total_unique_anchors: anchorData.length,
                    total_usage: totalUsage,
                    diversity_score: this.calculateAnchorDiversity(anchorData),
                    risk_anchors: anchorData.filter(a => a.risk_level === 'high').length
                }
            };

        } catch (error) {
            console.error('Error building anchor text chart:', error);
            return { type: 'doughnut', data: [], error: error.message };
        }
    }

    async getProspectFunnelChart(dateRange) {
        console.log('🎯 Building prospect funnel chart...');

        try {
            const funnelStages = await Promise.all([
                supabaseUtils.queryTable('backlink_prospects', { 
                    filters: { status: 'discovered' } 
                }),
                supabaseUtils.queryTable('backlink_prospects', { 
                    filters: { status: 'qualified' } 
                }),
                supabaseUtils.queryTable('backlink_prospects', { 
                    filters: { status: 'contacted' } 
                }),
                supabaseUtils.queryTable('backlink_prospects', { 
                    filters: { status: 'responded' } 
                }),
                supabaseUtils.queryTable('backlinks', { 
                    filters: { is_active: true } 
                })
            ]);

            const funnelData = [
                { stage: 'Discovered', count: funnelStages[0].length, color: '#3B82F6' },
                { stage: 'Qualified', count: funnelStages[1].length, color: '#10B981' },
                { stage: 'Contacted', count: funnelStages[2].length, color: '#F59E0B' },
                { stage: 'Responded', count: funnelStages[3].length, color: '#EF4444' },
                { stage: 'Acquired', count: funnelStages[4].length, color: '#8B5CF6' }
            ];

            // Calculate conversion rates
            const conversions = [];
            for (let i = 1; i < funnelData.length; i++) {
                const rate = funnelData[i-1].count > 0 ? 
                    (funnelData[i].count / funnelData[i-1].count * 100) : 0;
                conversions.push({
                    from: funnelData[i-1].stage,
                    to: funnelData[i].stage,
                    rate: rate.toFixed(1)
                });
            }

            return {
                type: 'funnel',
                title: 'Prospect Conversion Funnel',
                data: funnelData,
                conversions: conversions,
                metrics: {
                    total_prospects: funnelData[0].count,
                    overall_conversion: funnelData[0].count > 0 ? 
                        (funnelData[4].count / funnelData[0].count * 100).toFixed(1) : 0,
                    biggest_dropoff: conversions.reduce((min, conv) => 
                        parseFloat(conv.rate) < parseFloat(min.rate) ? conv : min, conversions[0] || { rate: 100 })
                }
            };

        } catch (error) {
            console.error('Error building funnel chart:', error);
            return { type: 'funnel', data: [], error: error.message };
        }
    }

    /**
     * INSIGHTS AND RECOMMENDATIONS
     */

    async generateInsights(summary, charts) {
        console.log('🧠 Generating insights and recommendations...');

        const insights = [];

        try {
            // Link acquisition insights
            if (summary.backlinks.net_growth > 0) {
                insights.push({
                    type: 'positive',
                    category: 'growth',
                    title: 'Positive Link Growth',
                    message: `You acquired ${summary.backlinks.new} new links and lost ${summary.backlinks.lost} links, resulting in a net growth of ${summary.backlinks.net_growth} links.`,
                    recommendation: 'Continue current acquisition strategies while monitoring link health to minimize losses.'
                });
            } else if (summary.backlinks.net_growth < 0) {
                insights.push({
                    type: 'warning',
                    category: 'growth',
                    title: 'Negative Link Growth',
                    message: `You lost more links (${summary.backlinks.lost}) than you gained (${summary.backlinks.new}).`,
                    recommendation: 'Focus on link quality and relationship building. Investigate why links are being lost and implement retention strategies.'
                });
            }

            // Campaign performance insights
            if (summary.campaigns.response_rate < 10) {
                insights.push({
                    type: 'warning',
                    category: 'outreach',
                    title: 'Low Response Rate',
                    message: `Your current response rate of ${summary.campaigns.response_rate.toFixed(1)}% is below industry average.`,
                    recommendation: 'Review email templates for personalization, improve subject lines, and ensure you\'re targeting relevant prospects.'
                });
            } else if (summary.campaigns.response_rate > 20) {
                insights.push({
                    type: 'positive',
                    category: 'outreach',
                    title: 'Excellent Response Rate',
                    message: `Your response rate of ${summary.campaigns.response_rate.toFixed(1)}% is well above industry average.`,
                    recommendation: 'Scale successful templates and strategies. Document what\'s working for future campaigns.'
                });
            }

            // Quality insights
            if (summary.backlinks.avg_domain_authority > 50) {
                insights.push({
                    type: 'positive',
                    category: 'quality',
                    title: 'High-Quality Link Profile',
                    message: `Your average domain authority of ${summary.backlinks.avg_domain_authority.toFixed(1)} indicates strong link quality.`,
                    recommendation: 'Maintain high standards while looking for opportunities to scale without compromising quality.'
                });
            }

            // ROI insights
            if (summary.performance.roi > 200) {
                insights.push({
                    type: 'positive',
                    category: 'roi',
                    title: 'Strong ROI Performance',
                    message: `Your link building ROI of ${summary.performance.roi.toFixed(1)}% shows excellent returns.`,
                    recommendation: 'Consider increasing budget allocation to scale successful strategies.'
                });
            } else if (summary.performance.roi < 50) {
                insights.push({
                    type: 'warning',
                    category: 'roi',
                    title: 'ROI Needs Improvement',
                    message: `Current ROI of ${summary.performance.roi.toFixed(1)}% may not justify continued investment.`,
                    recommendation: 'Review cost efficiency and focus on higher-value link opportunities. Consider adjusting strategy mix.'
                });
            }

            // Anchor text diversity insights
            if (charts.anchorTextDistribution && charts.anchorTextDistribution.metrics) {
                const diversity = charts.anchorTextDistribution.metrics.diversity_score;
                if (diversity < 0.7) {
                    insights.push({
                        type: 'warning',
                        category: 'risk',
                        title: 'Low Anchor Text Diversity',
                        message: 'Your anchor text distribution may appear unnatural to search engines.',
                        recommendation: 'Diversify anchor text usage with more branded and generic anchors. Avoid over-optimization.'
                    });
                }
            }

            // Prospect funnel insights
            if (charts.prospectFunnel && charts.prospectFunnel.conversions) {
                const biggestDropoff = charts.prospectFunnel.metrics.biggest_dropoff;
                if (parseFloat(biggestDropoff.rate) < 30) {
                    insights.push({
                        type: 'info',
                        category: 'optimization',
                        title: 'Conversion Bottleneck Identified',
                        message: `Biggest conversion drop is from ${biggestDropoff.from} to ${biggestDropoff.to} (${biggestDropoff.rate}%).`,
                        recommendation: `Focus on improving the ${biggestDropoff.from.toLowerCase()} to ${biggestDropoff.to.toLowerCase()} conversion process.`
                    });
                }
            }

            return insights;

        } catch (error) {
            console.error('Error generating insights:', error);
            return [{
                type: 'error',
                category: 'system',
                title: 'Insights Generation Error',
                message: 'Unable to generate insights due to data processing error.',
                recommendation: 'Check data integrity and try again.'
            }];
        }
    }

    /**
     * COMPETITIVE ANALYSIS
     */

    async analyzeCompetitiveGaps() {
        console.log('🔍 Analyzing competitive gaps...');

        try {
            const competitorLinks = await supabaseUtils.queryTable('competitor_backlinks', {
                filters: { is_opportunity: true },
                orderBy: 'opportunity_score',
                ascending: false,
                limit: 50
            });

            const gaps = {
                high_value_opportunities: [],
                domain_gaps: {},
                content_gaps: [],
                industry_leaders: {}
            };

            // High-value opportunities we haven't pursued
            gaps.high_value_opportunities = competitorLinks
                .filter(link => link.opportunity_score > 8)
                .map(link => ({
                    domain: link.source_domain,
                    url: link.source_url,
                    opportunity_score: link.opportunity_score,
                    competitor_count: 1, // Could aggregate multiple competitors
                    estimated_value: this.estimateOpportunityValue(link)
                }));

            // Domain authority gaps
            const ourBacklinks = await supabaseUtils.queryTable('backlinks', {});
            const ourDomains = new Set(ourBacklinks.map(link => new URL(link.source_url).hostname));
            
            competitorLinks.forEach(link => {
                if (!ourDomains.has(link.source_domain)) {
                    if (!gaps.domain_gaps[link.source_domain]) {
                        gaps.domain_gaps[link.source_domain] = {
                            domain: link.source_domain,
                            competitor_links: 0,
                            our_links: 0,
                            gap_score: 0
                        };
                    }
                    gaps.domain_gaps[link.source_domain].competitor_links++;
                }
            });

            return {
                generated_at: new Date().toISOString(),
                summary: {
                    total_opportunities: gaps.high_value_opportunities.length,
                    avg_opportunity_score: gaps.high_value_opportunities.reduce((sum, opp) => sum + opp.opportunity_score, 0) / gaps.high_value_opportunities.length,
                    domain_gaps: Object.keys(gaps.domain_gaps).length,
                    estimated_total_value: gaps.high_value_opportunities.reduce((sum, opp) => sum + opp.estimated_value, 0)
                },
                opportunities: gaps.high_value_opportunities.slice(0, 20),
                domain_gaps: Object.values(gaps.domain_gaps).sort((a, b) => b.competitor_links - a.competitor_links).slice(0, 20)
            };

        } catch (error) {
            console.error('Error analyzing competitive gaps:', error);
            throw error;
        }
    }

    /**
     * FORECASTING AND PREDICTIONS
     */

    async generateForecast(months = 3) {
        console.log(`📈 Generating ${months}-month forecast...`);

        try {
            // Get historical data
            const historicalMetrics = await supabaseUtils.queryTable('link_metrics', {
                orderBy: 'metric_date',
                ascending: false,
                limit: 90 // Last 90 days
            });

            if (historicalMetrics.length < 30) {
                throw new Error('Insufficient historical data for forecasting (minimum 30 days required)');
            }

            // Calculate trends
            const trends = this.calculateTrends(historicalMetrics);
            
            // Generate predictions
            const forecast = {
                period: `${months} months`,
                generated_at: new Date().toISOString(),
                assumptions: [
                    'Current growth trends continue',
                    'No major algorithm changes',
                    'Consistent resource allocation',
                    'Market conditions remain stable'
                ],
                predictions: {}
            };

            // Link acquisition forecast
            forecast.predictions.link_acquisition = {
                monthly_new_links: Math.max(0, Math.round(trends.newLinksPerDay * 30)),
                total_new_links: Math.max(0, Math.round(trends.newLinksPerDay * 30 * months)),
                confidence: this.calculateConfidence(trends.newLinksVariance)
            };

            // Campaign performance forecast
            forecast.predictions.campaign_performance = {
                monthly_outreach: Math.max(0, Math.round(trends.outreachPerDay * 30)),
                expected_responses: Math.max(0, Math.round(trends.outreachPerDay * 30 * trends.responseRate)),
                expected_conversions: Math.max(0, Math.round(trends.outreachPerDay * 30 * trends.conversionRate)),
                confidence: this.calculateConfidence(trends.responseRateVariance)
            };

            // Quality forecast
            forecast.predictions.quality_trends = {
                expected_avg_da: trends.avgDomainAuthority + (trends.daGrowthRate * months),
                expected_quality_score: Math.min(10, Math.max(1, trends.avgQualityScore + (trends.qualityGrowthRate * months))),
                confidence: this.calculateConfidence(trends.qualityVariance)
            };

            // ROI forecast
            forecast.predictions.roi = {
                monthly_cost: trends.avgMonthlyCost,
                expected_value: trends.avgMonthlyValue * (1 + trends.valueGrowthRate) ** months,
                projected_roi: ((trends.avgMonthlyValue * (1 + trends.valueGrowthRate) ** months - trends.avgMonthlyCost) / trends.avgMonthlyCost * 100),
                confidence: this.calculateConfidence(trends.roiVariance)
            };

            return forecast;

        } catch (error) {
            console.error('Error generating forecast:', error);
            throw error;
        }
    }

    /**
     * UTILITY METHODS
     */

    getDateRange(period) {
        const end = new Date();
        const start = new Date();

        switch (period) {
            case '7d':
                start.setDate(start.getDate() - 7);
                break;
            case '30d':
                start.setDate(start.getDate() - 30);
                break;
            case '90d':
                start.setDate(start.getDate() - 90);
                break;
            case '1y':
                start.setFullYear(start.getFullYear() - 1);
                break;
            default:
                start.setDate(start.getDate() - 30);
        }

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    }

    calculateAnchorDiversity(anchorData) {
        if (anchorData.length === 0) return 0;

        const totalUsage = anchorData.reduce((sum, anchor) => sum + anchor.usage_count, 0);
        const entropy = anchorData.reduce((sum, anchor) => {
            const p = anchor.usage_count / totalUsage;
            return sum - (p * Math.log2(p));
        }, 0);

        const maxEntropy = Math.log2(anchorData.length);
        return maxEntropy > 0 ? entropy / maxEntropy : 0;
    }

    estimateOpportunityValue(opportunity) {
        const baseValue = 100;
        const daMultiplier = (opportunity.domain_authority || 30) / 30;
        const opportunityMultiplier = opportunity.opportunity_score / 10;
        
        return Math.round(baseValue * daMultiplier * opportunityMultiplier);
    }

    calculateTrends(metrics) {
        // Implement trend calculation logic
        const avgNewLinks = metrics.reduce((sum, m) => sum + (m.new_backlinks || 0), 0) / metrics.length;
        const avgOutreach = metrics.reduce((sum, m) => sum + (m.outreach_sent || 0), 0) / metrics.length;
        
        return {
            newLinksPerDay: avgNewLinks,
            outreachPerDay: avgOutreach,
            responseRate: 0.15, // Default 15%
            conversionRate: 0.05, // Default 5%
            avgDomainAuthority: 45,
            avgQualityScore: 6.5,
            avgMonthlyCost: 2500,
            avgMonthlyValue: 7500,
            // Variance calculations would be more complex
            newLinksVariance: 0.2,
            responseRateVariance: 0.1,
            qualityVariance: 0.15,
            roiVariance: 0.25
        };
    }

    calculateConfidence(variance) {
        // Convert variance to confidence percentage
        return Math.max(50, Math.min(95, 100 - (variance * 100)));
    }

    // Placeholder methods for metrics calculation
    async getTotalBacklinks() {
        const backlinks = await supabaseUtils.queryTable('backlinks', { filters: { is_active: true } });
        return backlinks.length;
    }

    async getNewBacklinks(dateRange) {
        const backlinks = await supabaseUtils.queryTable('backlinks', {
            filters: { is_active: true }
            // Would need date filtering
        });
        return backlinks.filter(link => link.date_acquired >= dateRange.start).length;
    }

    async getLostBacklinks(dateRange) {
        const backlinks = await supabaseUtils.queryTable('backlinks', {});
        return backlinks.filter(link => link.date_lost && link.date_lost >= dateRange.start).length;
    }

    async getAverageDomainAuthority() {
        const backlinks = await supabaseUtils.queryTable('backlinks', { filters: { is_active: true } });
        const total = backlinks.reduce((sum, link) => sum + (link.domain_authority || 0), 0);
        return backlinks.length > 0 ? total / backlinks.length : 0;
    }

    async getActiveCampaigns() {
        const campaigns = await supabaseUtils.queryTable('outreach_campaigns', {
            filters: { status: 'active' }
        });
        return campaigns.length;
    }

    async getTotalOutreach(dateRange) {
        const attempts = await supabaseUtils.queryTable('outreach_attempts', {});
        return attempts.filter(attempt => attempt.sent_date >= dateRange.start).length;
    }

    async getResponseRate(dateRange) {
        const attempts = await supabaseUtils.queryTable('outreach_attempts', {});
        const recentAttempts = attempts.filter(attempt => attempt.sent_date >= dateRange.start);
        const responses = recentAttempts.filter(attempt => attempt.responded_date);
        
        return recentAttempts.length > 0 ? (responses.length / recentAttempts.length * 100) : 0;
    }

    async getConversionRate(dateRange) {
        const attempts = await supabaseUtils.queryTable('outreach_attempts', {});
        const recentAttempts = attempts.filter(attempt => attempt.sent_date >= dateRange.start);
        const conversions = recentAttempts.filter(attempt => attempt.response_type === 'positive');
        
        return recentAttempts.length > 0 ? (conversions.length / recentAttempts.length * 100) : 0;
    }

    async getAverageQualityScore() {
        const backlinks = await supabaseUtils.queryTable('backlinks', { filters: { is_active: true } });
        const total = backlinks.reduce((sum, link) => sum + (link.value_score || 0), 0);
        return backlinks.length > 0 ? total / backlinks.length : 0;
    }

    async getRiskAssessment() {
        const backlinks = await supabaseUtils.queryTable('backlinks', { filters: { is_active: true } });
        const highRisk = backlinks.filter(link => link.risk_level === 'high').length;
        const totalLinks = backlinks.length;
        
        if (totalLinks === 0) return 'low';
        
        const riskPercent = (highRisk / totalLinks) * 100;
        
        if (riskPercent > 15) return 'high';
        if (riskPercent > 5) return 'medium';
        return 'low';
    }

    async getTotalCost(dateRange) {
        const backlinks = await supabaseUtils.queryTable('backlinks', {});
        const recentLinks = backlinks.filter(link => link.date_acquired >= dateRange.start);
        return recentLinks.reduce((sum, link) => sum + (link.cost || 0), 0);
    }

    async getEstimatedValue(dateRange) {
        const backlinks = await supabaseUtils.queryTable('backlinks', { filters: { is_active: true } });
        const recentLinks = backlinks.filter(link => link.date_acquired >= dateRange.start);
        
        // Estimate value based on quality score and domain authority
        return recentLinks.reduce((sum, link) => {
            const baseValue = 150;
            const qualityMultiplier = (link.value_score || 5) / 5;
            const daMultiplier = Math.min((link.domain_authority || 30) / 50, 2);
            return sum + (baseValue * qualityMultiplier * daMultiplier);
        }, 0);
    }
}

module.exports = BacklinkAnalytics;