import React from 'react';
import type { NavigationTab } from '../types';
import { Icon } from './Icon';

interface BottomNavigationProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onSelectTab
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
            <Icon name="home" size={22} />
          </div>
          <span>Ana Sayfa</span>
        </button>

        <button
          type="button"
          className={`doa-nav-item ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => onSelectTab('map')}
        >
          <div className="doa-nav-icon-wrap">
            <Icon name="map-pin" size={22} />
          </div>
          <span>Atık Haritası</span>
        </button>

        <button
          type="button"
          className={`doa-nav-item ${activeTab === 'assistant' ? 'active' : ''}`}
          onClick={() => onSelectTab('assistant')}
        >
          <div className="doa-nav-icon-wrap">
            <Icon name="chat" size={22} />
          </div>
          <span>Yeşil Asistan</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNavigation;
