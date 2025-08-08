import { useState } from 'react';

export default function PremiumUpgrade({ inspector, onUpgradeSuccess }) {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('premium');

  const plans = {
    premium: {
      name: 'Premium Membership',
      price: '$99',
      interval: 'month',
      features: [
        'Priority listing placement',
        'Unlimited lead notifications',
        'Custom profile page',
        'Review management tools',
        'Analytics dashboard',
        'Direct customer messaging',
        'SEO optimization',
        'Mobile app access'
      ],
      popular: true
    },
    basic: {
      name: 'Basic Membership',
      price: '$49',
      interval: 'month',
      features: [
        'Standard listing placement',
        '10 lead notifications/month',
        'Basic profile page',
        'Customer reviews',
        'Basic analytics'
      ],
      popular: false
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inspectorId: inspector.id,
          email: inspector.email,
          planType: selectedPlan
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // For demo purposes, show success immediately
        // In production, this would redirect to Stripe Checkout
        alert(`Successfully upgraded to ${plans[selectedPlan].name}!`);
        if (onUpgradeSuccess) {
          onUpgradeSuccess(data.membership);
        }
      } else {
        throw new Error(data.error || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to upgrade membership. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Upgrade Your Membership
        </h2>
        <p className="text-lg text-gray-600">
          Get more leads and grow your home inspection business
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {Object.entries(plans).map(([planKey, plan]) => (
          <div
            key={planKey}
            className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all ${
              selectedPlan === planKey
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedPlan(planKey)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <div className="text-3xl font-bold text-gray-900">
                {plan.price}
                <span className="text-lg font-normal text-gray-600">
                  /{plan.interval}
                </span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="text-center">
              <input
                type="radio"
                name="plan"
                value={planKey}
                checked={selectedPlan === planKey}
                onChange={() => setSelectedPlan(planKey)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-600">
                Select this plan
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className={`px-8 py-3 rounded-lg text-white font-semibold text-lg transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Processing...' : `Upgrade to ${plans[selectedPlan].name}`}
        </button>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          • Cancel anytime • 30-day money-back guarantee • No setup fees
        </p>
        <p className="mt-2">
          Need help? Contact us at{' '}
          <a href="mailto:support@inspectorsnearme.com" className="text-blue-600">
            support@inspectorsnearme.com
          </a>
        </p>
      </div>
    </div>
  );
}