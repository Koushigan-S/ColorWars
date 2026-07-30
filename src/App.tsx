import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { FriendsProvider } from './contexts/FriendsContext';
import { DrawerProvider, useDrawer } from './contexts/DrawerContext';
import AppRoutes from './routes';
import IntroScreen from './components/IntroScreen';
import SidebarDrawer from './components/SidebarDrawer';
import FriendActionModal from './components/FriendActionModal';
import DirectChatModal from './components/DirectChatModal';
import GameInviteToast from './components/GameInviteToast';

const AppContent: React.FC<{ showIntro: boolean; onIntroComplete: () => void }> = ({ showIntro, onIntroComplete }) => {
  const { isDrawerOpen, closeDrawer } = useDrawer();

  if (showIntro) {
    return <IntroScreen onComplete={onIntroComplete} />;
  }

  return (
    <div className="flex flex-col min-h-svh relative">
      <SidebarDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />
      <FriendActionModal />
      <DirectChatModal />
      <GameInviteToast />
      <AppRoutes />
    </div>
  );
};

export const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <BrowserRouter>
      <AuthProvider>
        <GameProvider>
          <FriendsProvider>
            <DrawerProvider>
              <AppContent showIntro={showIntro} onIntroComplete={() => setShowIntro(false)} />
            </DrawerProvider>
          </FriendsProvider>
        </GameProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
