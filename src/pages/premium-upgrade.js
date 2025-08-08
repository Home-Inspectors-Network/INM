import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PremiumUpgrade from '../components/PremiumUpgrade';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PremiumUpgradePage() {
  const [inspector, setInspector] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // For demo purposes, search for an inspector to upgrade
  const searchInspectors = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('inspectors')
        .select('*')
        .or(`business_name.ilike.%${searchTerm}%,owner_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .eq('is_premium', false)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchInspectors();
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const handleInspectorSelect = (selectedInspector) => {
    setInspector(selectedInspector);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleUpgradeSuccess = (membership) => {
    // Update the inspector's premium status
    setInspector(prev => ({ ...prev, is_premium: true }));
    alert('Upgrade successful! The inspector is now a premium member.');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {!inspector ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Premium Membership Upgrade
                </h1>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search for Inspector to Upgrade
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by business name, owner name, or email..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">
                      Select Inspector:
                    </h3>
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        onClick={() => handleInspectorSelect(result)}
                        className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          {result.business_name}
                        </div>
                        {result.owner_name && (
                          <div className="text-sm text-gray-600">
                            Owner: {result.owner_name}
                          </div>
                        )}
                        <div className="text-sm text-gray-500">
                          {result.email} • {result.city}, {result.state}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchTerm && searchResults.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No non-premium inspectors found matching "{searchTerm}"
                  </div>
                )}

                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">
                    Demo Instructions:
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Search for any inspector in our database</li>
                    <li>• Only non-premium inspectors can be upgraded</li>
                    <li>• The upgrade process is simulated for demo purposes</li>
                    <li>• Real Stripe integration requires API keys in .env.local</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6 text-center">
                <button
                  onClick={() => setInspector(null)}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  ← Back to Search
                </button>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Upgrading Membership For:
                </h2>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {inspector.business_name}
                    </div>
                    {inspector.owner_name && (
                      <div className="text-gray-600">{inspector.owner_name}</div>
                    )}
                    <div className="text-sm text-gray-500">
                      {inspector.email} • {inspector.city}, {inspector.state}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Current Status</div>
                    <div className="font-medium text-gray-900">
                      {inspector.is_premium ? 'Premium Member' : 'Free Listing'}
                    </div>
                  </div>
                </div>
              </div>

              <PremiumUpgrade 
                inspector={inspector} 
                onUpgradeSuccess={handleUpgradeSuccess}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}