import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import AppRoutes from './routes';
import IntroScreen from './components/IntroScreen';

export const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <BrowserRouter>
      <AuthProvider>
        <GameProvider>
          {showIntro ? (
            <IntroScreen onComplete={() => setShowIntro(false)} />
          ) : (
            <div className="flex flex-col min-h-svh">
              <AppRoutes />
            </div>
          )}
        </GameProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
