import React from 'react';
import type { AchievementBadge } from '../types';
import { Icon } from './Icon';

interface AchievementBadgesProps {
  badges: AchievementBadge[];
}

export const AchievementBadges: React.FC<AchievementBadgesProps> = ({ badges }) => {
  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  return (
    <div className="badges-container">
      <div className="sectionhead">
        <strong>Başarı Rozetlerin</strong>
        <span className="small">{unlockedCount}/{badges.length} Kazanıldı</span>
      </div>

      <div className="badges-grid">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`badge-card ${badge.isUnlocked ? 'unlocked' : 'locked'}`}
          >
            <div className={`badge-icon-box ${badge.isUnlocked ? 'active' : ''}`}>
              <Icon name={badge.icon} size={20} />
            </div>
            <div className="badge-meta">
              <div className="badge-title">{badge.title}</div>
              <div className="badge-desc">{badge.desc}</div>
              <span className={`badge-pill ${badge.isUnlocked ? 'unlocked' : 'locked'}`}>
                {badge.progressText}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementBadges;
