import { useState } from 'react';
import ReportForm from './ReportForm';
import Matches from './Matches';

function App() {
  const [view, setView] = useState('home');
  const [reportType, setReportType] = useState(null);

  const handleReportClick = (type) => {
    setReportType(type);
    setView('report');
  };

  const handleBack = () => {
    setView('home');
    setReportType(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-indigo-900 mb-2">Campus Lost & Found</h1>
        </header>

        {view === 'home' && (
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <button
                onClick={() => handleReportClick('lost')}
                className="bg-red-500 hover:bg-red-600 text-white p-12 rounded-2xl shadow-xl transform hover:scale-105 transition"
              >
                <div className="text-6xl mb-4"></div>
                <h2 className="text-3xl font-bold mb-2">I Lost Something</h2>
                <p className="text-red-100">Report a lost item</p>
              </button>

              <button
                onClick={() => handleReportClick('found')}
                className="bg-green-500 hover:bg-green-600 text-white p-12 rounded-2xl shadow-xl transform hover:scale-105 transition"
              >
                <div className="text-6xl mb-4"></div>
                <h2 className="text-3xl font-bold mb-2">I Found Something</h2>
                <p className="text-green-100">Report a found item</p>
              </button>
            </div>

            <button
              onClick={() => setView('matches')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 px-6 rounded-xl shadow-lg text-xl font-semibold"
            >
              View All Matches
            </button>
          </div>
        )}

        {view === 'report' && (
          <div>
            <button
              onClick={handleBack}
              className="mb-6 text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              ← Back to Home
            </button>
            <ReportForm type={reportType} onComplete={handleBack} />
          </div>
        )}

        {view === 'matches' && (
          <div>
            <button
              onClick={handleBack}
              className="mb-6 text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              ← Back to Home
            </button>
            <Matches />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;