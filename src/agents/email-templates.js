/**
 * Email Templates for Backlink Outreach Campaigns
 * InspectorsNearMe.com
 */

const emailTemplates = {
    guestPost: {
        initial: {
            name: 'Guest Post - Initial Outreach',
            subject: 'Content Collaboration Opportunity - {domain}',
            body: `Hi {first_name},

I hope this email finds you well! I came across {website} while researching valuable resources in the home inspection and real estate space, and I'm genuinely impressed by your content quality and audience engagement.

My name is [Your Name], and I represent InspectorsNearMe.com, the fastest-growing directory of certified home inspectors in the United States. We've helped thousands of homebuyers connect with qualified inspection professionals, and our expertise in this niche runs deep.

I'd love to contribute a high-quality, original article to {domain} that would provide real value to your readers. Here are some article ideas that might resonate with your audience:

• "The Hidden Costs of Skipping a Home Inspection: What Every Homebuyer Should Know"
• "10 Red Flags Your Home Inspector Should Catch Before You Sign"
• "Seasonal Home Maintenance Checklist: A Month-by-Month Guide"
• "How to Choose the Right Home Inspector: A Comprehensive Guide"

Each article would be:
✓ 1,500+ words of original, well-researched content
✓ Include actionable tips and insights from industry professionals
✓ Properly formatted with headers, bullet points, and engaging structure
✓ Include relevant, high-quality images or infographics
✓ Feature just one contextual link back to our inspector directory

I understand you likely receive many collaboration requests, so I want to emphasize that this isn't about us—it's about providing your readers with content that genuinely helps them make better decisions about home inspections and property purchases.

Would you be interested in seeing a detailed outline for any of these topics? I'm happy to write a custom piece that aligns perfectly with your content strategy and audience interests.

Best regards,
[Your Name]
[Your Title]
InspectorsNearMe.com
[Email] | [Phone]

P.S. I noticed your recent article about [specific article topic] - excellent insights on [specific detail]. It's clear you understand what homebuyers need to know.`,
            variables: ['first_name', 'domain', 'website'],
            category: 'guest_post'
        },

        followup1: {
            name: 'Guest Post - Follow-up 1',
            subject: 'Re: Content Collaboration - Quick Question',
            body: `Hi {first_name},

I wanted to follow up on my previous email about contributing a guest article to {domain}. I understand you're probably busy managing your content calendar and reviewing submissions.

To make this easier for you, I've prepared a detailed outline for one of the article topics I mentioned:

**Article: "The Hidden Costs of Skipping a Home Inspection"**

I. Introduction: The $20,000 mistake many homebuyers make
II. Statistical overview of inspection findings
III. Five most common (and expensive) issues missed without inspection
IV. Real case studies from our network of 10,000+ inspectors
V. Cost-benefit analysis: Inspection fee vs. potential savings
VI. Actionable checklist for homebuyers

This would be approximately 1,800 words with original research, expert quotes, and actionable insights your readers can immediately apply.

Would you like to see the full outline or a sample section? I'm confident this would be valuable content for your audience.

Best regards,
[Your Name]`,
            variables: ['first_name', 'domain'],
            category: 'guest_post'
        }
    },

    resourcePage: {
        initial: {
            name: 'Resource Page - Initial Request',
            subject: 'Valuable Resource for Your {domain} Readers',
            body: `Hello {first_name},

I discovered your excellent resource page at {website} and wanted to reach out with a suggestion that might benefit your visitors.

I'm [Your Name] from InspectorsNearMe.com, and I noticed you have a great collection of home buying and real estate resources. Our platform might be a valuable addition to that list.

InspectorsNearMe.com is a comprehensive directory that helps homebuyers find qualified, certified inspectors in their area. Here's what makes it valuable for your audience:

• Verified credentials for all listed inspectors
• Real customer reviews and ratings
• Detailed service area maps
• Direct booking capabilities
• Educational resources about the inspection process

We've helped over 50,000 homebuyers connect with trusted inspectors, and our platform is completely free for consumers to use.

Given your focus on providing valuable resources to homebuyers and real estate professionals, I believe our directory would be a useful addition to your resource page.

Would you consider including InspectorsNearMe.com in your resource list? I'm happy to provide any additional information about our platform or services.

Thank you for maintaining such a valuable resource for the community!

Best regards,
[Your Name]
[Title]
InspectorsNearMe.com`,
            variables: ['first_name', 'domain', 'website'],
            category: 'resource_page'
        }
    },

    brokenLink: {
        initial: {
            name: 'Broken Link Outreach',
            subject: 'Broken Link Found on {domain} - Quick Fix Available',
            body: `Hi {first_name},

I hope you're having a great day! I'm reaching out because I found a small issue on your website that I thought you'd want to know about.

I was browsing through your excellent content on {domain}, particularly your article "{article_title}", when I noticed that one of the links appears to be broken:

Broken link: {broken_url}
Location: {page_url}

I know how important it is to maintain a good user experience, and broken links can be frustrating for visitors and potentially impact SEO rankings.

I actually have a resource that might serve as a suitable replacement for that broken link. InspectorsNearMe.com offers comprehensive information about home inspections, which seems to align with the context of your original link.

Our resource provides:
• State-by-state inspector directories
• Educational guides about the inspection process
• Consumer protection information
• Comprehensive FAQ section

Would you like me to send you the specific URL that would work best as a replacement? I'm happy to help you fix this quickly.

Best regards,
[Your Name]
InspectorsNearMe.com

P.S. Thank you for creating such valuable content for homebuyers - your work really makes a difference!`,
            variables: ['first_name', 'domain', 'article_title', 'broken_url', 'page_url'],
            category: 'broken_link'
        }
    },

    directory: {
        initial: {
            name: 'Directory Submission Request',
            subject: 'Directory Listing Request - InspectorsNearMe.com',
            body: `Hello,

I hope this message finds you well. I'm writing to inquire about submitting our business to your directory at {domain}.

InspectorsNearMe.com is a comprehensive directory of certified home inspectors serving customers across the United States. We help homebuyers, real estate agents, and property investors connect with qualified inspection professionals in their local areas.

Our platform features:
• Over 10,000 verified inspector profiles
• Comprehensive coverage across all 50 states
• Customer review and rating system
• Educational resources for consumers
• Free inspector matching service

Company Details:
- Business Name: InspectorsNearMe.com
- Website: https://inspectorsnearme.com
- Category: Home Services / Real Estate Services
- Geographic Coverage: Nationwide (United States)
- Established: 2023
- Description: The premier directory connecting homebuyers with certified home inspectors

We believe our service would be a valuable addition to your directory, as we serve the same community of homebuyers and real estate professionals that your audience represents.

Could you please provide information about:
1. The submission process for new listings
2. Any fees associated with directory inclusion
3. Requirements for listing approval
4. Timeline for review and publication

I'm happy to provide any additional information or documentation you might need for the application process.

Thank you for your time and consideration. I look forward to hearing from you.

Best regards,
[Your Name]
[Title]
InspectorsNearMe.com
[Email] | [Phone]`,
            variables: ['domain'],
            category: 'directory'
        }
    },

    partnership: {
        initial: {
            name: 'Partnership Opportunity',
            subject: 'Partnership Opportunity - {domain} x InspectorsNearMe.com',
            body: `Hi {first_name},

I hope this email finds you well! I'm reaching out because I see a fantastic opportunity for a mutually beneficial partnership between {domain} and InspectorsNearMe.com.

After reviewing your content and services, it's clear that we serve overlapping audiences - homebuyers, real estate professionals, and property investors who all need access to reliable home inspection services.

**About InspectorsNearMe.com:**
We're the fastest-growing directory of certified home inspectors in the US, with over 10,000 verified professionals and 50,000+ successful inspector-client connections. Our platform helps consumers find qualified inspectors while providing valuable educational resources about the inspection process.

**Partnership Opportunities:**
1. **Content Collaboration** - Co-create valuable resources for both our audiences
2. **Cross-Promotion** - Feature each other's services where relevant
3. **Referral Program** - Mutual referral benefits for aligned services
4. **Resource Sharing** - Combine our expertise for comprehensive user guides

**What's in it for you:**
• Access to our network of 10,000+ inspection professionals
• Co-marketing opportunities to expand your reach
• Additional revenue stream through referral partnerships
• Enhanced value for your existing customers

**What we're looking for:**
• Strategic partner in the real estate/home services space
• Opportunity to provide inspection services to your audience
• Cross-promotional opportunities
• Long-term collaborative relationship

I'd love to schedule a brief 15-minute call to discuss how we might work together. Are you available for a quick conversation this week or next?

Looking forward to exploring this opportunity together!

Best regards,
[Your Name]
[Title]
InspectorsNearMe.com
[Email] | [Phone]

P.S. I particularly enjoyed your recent content about [specific topic] - it shows you really understand the challenges homebuyers face.`,
            variables: ['first_name', 'domain'],
            category: 'partnership'
        }
    },

    thankYou: {
        placement: {
            name: 'Thank You - Successful Placement',
            subject: 'Thank you for featuring InspectorsNearMe.com!',
            body: `Hi {first_name},

I wanted to personally thank you for including our content/link on {domain}. We really appreciate your willingness to work with us and provide value to your readers.

The {placement_type} at {page_url} looks fantastic and fits perfectly with your content. I know your audience will find it valuable.

A few things I wanted to mention:

1. **Performance Tracking**: I'll monitor how this performs and share any insights that might be helpful for your content strategy.

2. **Future Collaboration**: If you ever need expert insights on home inspections, real estate market trends, or consumer protection topics, please don't hesitate to reach out. Our network of professionals is always happy to contribute expertise.

3. **Reciprocal Value**: If there's ever anything we can do to support your content or business goals, please let me know. We believe in building genuine, long-term relationships.

Thanks again for the collaboration. I look forward to potentially working together again in the future!

Best regards,
[Your Name]
InspectorsNearMe.com

P.S. I'll be sure to share your excellent content with our network when it's relevant to their interests.`,
            variables: ['first_name', 'domain', 'placement_type', 'page_url'],
            category: 'thank_you'
        }
    }
};

/**
 * Template utility functions
 */
const templateUtils = {
    /**
     * Get template by category and type
     */
    getTemplate(category, type = 'initial') {
        if (emailTemplates[category] && emailTemplates[category][type]) {
            return emailTemplates[category][type];
        }
        throw new Error(`Template not found: ${category}.${type}`);
    },

    /**
     * Get all templates for a category
     */
    getCategoryTemplates(category) {
        if (emailTemplates[category]) {
            return emailTemplates[category];
        }
        throw new Error(`Category not found: ${category}`);
    },

    /**
     * Replace variables in template
     */
    processTemplate(template, variables) {
        let subject = template.subject;
        let body = template.body;

        // Replace each variable
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{${key}}`, 'g');
            subject = subject.replace(regex, value || `{${key}}`);
            body = body.replace(regex, value || `{${key}}`);
        });

        return {
            name: template.name,
            subject: subject,
            body: body,
            category: template.category,
            variables: template.variables
        };
    },

    /**
     * Validate required variables
     */
    validateVariables(template, variables) {
        const missing = [];
        
        if (template.variables) {
            template.variables.forEach(variable => {
                if (!variables[variable]) {
                    missing.push(variable);
                }
            });
        }

        return {
            isValid: missing.length === 0,
            missing: missing
        };
    },

    /**
     * Get all available template categories
     */
    getCategories() {
        return Object.keys(emailTemplates);
    },

    /**
     * Get template statistics
     */
    getTemplateStats() {
        const stats = {};
        
        Object.entries(emailTemplates).forEach(([category, templates]) => {
            stats[category] = {
                count: Object.keys(templates).length,
                types: Object.keys(templates)
            };
        });

        return stats;
    },

    /**
     * Create custom template
     */
    createCustomTemplate(category, type, templateData) {
        if (!emailTemplates[category]) {
            emailTemplates[category] = {};
        }

        emailTemplates[category][type] = {
            name: templateData.name,
            subject: templateData.subject,
            body: templateData.body,
            variables: templateData.variables || [],
            category: category,
            custom: true
        };

        return emailTemplates[category][type];
    }
};

module.exports = {
    emailTemplates,
    templateUtils
};