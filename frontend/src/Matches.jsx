import { useState, useEffect } from 'react';

const API_URL = 'https://campus-lost-found-pi.vercel.app/api';

function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await fetch(`${API_URL}/matches`);
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-xl text-gray-600">Loading matches...</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-12 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Matches Yet</h2>
        <p className="text-gray-600">Start reporting lost or found items to see matches!</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">
        🔗 All Matches ({matches.length})
      </h2>

      <div className="space-y-6">
        {matches.map((match) => {
          const lostTags = JSON.parse(match.lost_tags);
          const foundTags = JSON.parse(match.found_tags);
          
          return (
            <div key={match.id} className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Match #{match.id}</h3>
                <span className="bg-green-500 text-white px-6 py-2 rounded-full text-xl font-bold">
                  {match.confidence}% Confidence
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="border-2 border-red-200 rounded-xl p-4 bg-red-50">
                  <h4 className="text-xl font-bold text-red-700 mb-3">😢 Lost Item</h4>
                  <img 
                    src={match.lost_image} 
                    alt="Lost item"
                    className="w-full h-64 object-cover rounded-lg mb-3"
                  />
                  <p className="text-gray-700 mb-2"><strong>Location:</strong> {match.lost_location}</p>
                  <div className="bg-white rounded p-3 text-sm">
                    <strong>AI Tags:</strong>
                    <pre className="mt-1 overflow-x-auto">{JSON.stringify(lostTags, null, 2)}</pre>
                  </div>
                </div>

                <div className="border-2 border-green-200 rounded-xl p-4 bg-green-50">
                  <h4 className="text-xl font-bold text-green-700 mb-3">🎉 Found Item</h4>
                  <img 
                    src={match.found_image} 
                    alt="Found item"
                    className="w-full h-64 object-cover rounded-lg mb-3"
                  />
                  <p className="text-gray-700 mb-2"><strong>Location:</strong> {match.found_location}</p>
                  <div className="bg-white rounded p-3 text-sm">
                    <strong>AI Tags:</strong>
                    <pre className="mt-1 overflow-x-auto">{JSON.stringify(foundTags, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Matches;