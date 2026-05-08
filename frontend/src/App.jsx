import React, { useState } from 'react';
import TrialRoom from './components/TrialRoom';
import LandingPage from './components/LandingPage';

function App() {
  const [currentPage, setCurrentPage] = useState('landing');

  return (
    <div className="antialiased">
      {currentPage === 'landing' ? (
        <LandingPage onLaunch={() => setCurrentPage('trialroom')} />
      ) : (
        <TrialRoom onBack={() => setCurrentPage('landing')} />
      )}
    </div>
  );
}

export default App;
