import { useState } from 'react';

const API_URL = 'https://campus-lost-found-pi.vercel.app/api';

function ReportForm({ type, onComplete }) {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const locations = ['Library', 'Hostel', 'SARC', 'Acad Blocks', 'Arcade', 'Parking', 'Other'];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!image || !location) {
      alert('Please upload an image and select a location');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          image,
          location,
          note
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-green-600 mb-6">✅ Item Reported Successfully!</h2>
          
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-blue-900 mb-3">🤖 AI Analysis (Google Gemini Vision)</h3>
            <div className="bg-white rounded-lg p-4 font-mono text-sm">
              <pre>{JSON.stringify(result.aiTags, null, 2)}</pre>
            </div>
          </div>

          {result.matchesFound > 0 ? (
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 mb-6">
              <h3 className="text-2xl font-bold text-green-700 mb-4">
                🎯 {result.matchesFound} Potential Match{result.matchesFound > 1 ? 'es' : ''} Found!
              </h3>
              {result.matches.map((match, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 mb-4 border-2 border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">Match #{idx + 1}</span>
                    <span className="bg-green-500 text-white px-4 py-1 rounded-full font-bold">
                      {match.confidence}% Match
                    </span>
                  </div>
                  <img 
                    src={match.item.image_base64} 
                    alt="Matched item"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <p className="mt-2 text-gray-600">Location: {match.item.location}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-6">
              <p className="text-lg text-yellow-800">
                No matches found yet. We'll notify others about your {type} item!
              </p>
            </div>
          )}

          <button
            onClick={onComplete}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-xl text-lg font-semibold"
          >
            Report Another Item
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">
          {type === 'lost' ? 'Report Lost Item' : 'Report Found Item'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Upload Photo *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full border-2 border-gray-300 rounded-lg p-3"
              required
            />
            {imagePreview && (
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="mt-4 w-full h-64 object-cover rounded-lg border-2 border-indigo-200"
              />
            )}
          </div>

          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Location *
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg"
              required
            >
              <option value="">Select location...</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg p-3 h-24"
              placeholder="Any additional details..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-6 rounded-xl text-xl font-bold text-white ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading ? '🤖 AI Analyzing Image...' : `Submit ${type === 'lost' ? 'Lost' : 'Found'} Item`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ReportForm;