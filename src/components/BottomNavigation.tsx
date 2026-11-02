import React from 'react';
import type { NavigationTab } from '../types';
import { Icon } from './Icon';

interface BottomNavigationProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenQrScanner: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onSelectTab,
  onOpenQrScanner
}) => {
  return (
    <nav className="doa-bottom-nav" aria-label="Ana gezinme çubuğu">
      <div className="doa-nav-content">
        <button
          type="button"
          className={`doa-nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => onSelectTab('home')}
        >
          <div className="doa-nav-icon-wrap">
            <Icon name="home" size={21} />
          </div>
          <span>Ana Sayfa</span>
        </button>

        <button
          type="button"
          className={`doa-nav-item ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => onSelectTab('leaderboard')}
        >
          <div className="doa-nav-icon-wrap">
            <Icon name="trophy" size={21} />
          </div>
          <span>Fakülte Ligi</span>
        </button>

        <div className="doa-nav-center-slot">
          <button
            type="button"
            className="doa-floating-fab"
            onClick={onOpenQrScanner}
            aria-label="QR Kod Okut ve Yıldız Kazan"
          >
            <div className="doa-fab-glow" />
            <div className="doa-fab-inner">
              <Icon name="qr" size={26} />
            </div>
            <span className="doa-fab-label">QR Okut</span>
          </button>
        </div>

        <button
          type="button"
          className={`doa-nav-item ${activeTab === 'assistant' ? 'active' : ''}`}
          onClick={() => onSelectTab('assistant')}
        >
          <div className="doa-nav-icon-wrap">
            <Icon name="chat" size={21} />
          </div>
          <span>AI Asistan</span>
        </button>

        <button
          type="button"
          className={`doa-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => onSelectTab('profile')}
        >
          <div className="doa-nav-icon-wrap">
            <Icon name="user" size={21} />
          </div>
          <span>Profil</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNavigation;
