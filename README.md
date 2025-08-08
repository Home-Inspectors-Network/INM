# InspectorsNearMe.com

The premier directory for residential property inspectors in the United States.

## Quick Start

1. Copy `.env.example` to `.env` and fill in your credentials
2. Set up your database with `psql -f config/schema.sql`
3. Install dependencies: `npm install`
4. Run data collection: `npm run scrape`
5. Generate SEO pages: `npm run seo`
6. Start development server: `npm run dev`

## Business Model

- **Free Listings**: Basic inspector information
- **Premium Listings**: $79-149/month for enhanced features
- **Lead Generation**: $25-50 per qualified lead

## Agent System

This project uses an AI agent system for automation:
- Data collection and enrichment
- SEO content generation
- Outreach campaigns
- Customer success

See `.claude/agents/` for all available agents.

## Customization Points

1. **Design**: Modify `tailwind.config.js` for branding
2. **Pricing**: Update tiers in `config/pricing.js`
3. **Email Templates**: Edit templates in `templates/emails/`
4. **SEO Content**: Customize templates in `templates/seo/`

## Human Tasks Required

1. Create accounts listed in setup documentation
2. Verify Stripe account for payments
3. Set up Google Analytics and Search Console
4. Register business entity (LLC recommended)
5. Create initial blog content for link building

## Support

For questions or issues, consult the agent system or review documentation in `docs/`.
