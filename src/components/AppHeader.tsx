import React from 'react';
import type { StudentProfile } from '../types';
import { Icon } from './Icon';

interface AppHeaderProps {
  profile: StudentProfile;
  stars: number;
  streak: number;
  onOpenProfile: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  profile,
  stars,
  streak,
  onOpenProfile
}) => {
  const initials = profile.fullName
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <header className="doa-header">
      <button
        type="button"
        className="doa-header-avatar"
        onClick={onOpenProfile}
        aria-label="Öğrenci profiline git"
      >
        {initials ? (
          <span className="doa-avatar-initials">{initials}</span>
        ) : (
          <div className="doa-avatar-icon">
            <Icon name="user" size={19} />
          </div>
        )}
      </button>

      <div className="doa-header-brand">
        <div className="doa-brand-iris">
          <Icon name="leaf" size={17} />
        </div>
        <span className="doa-brand-title">yeşil adım</span>
      </div>

      <div className="doa-header-right">
        <div className="doa-header-streak" aria-label="Günlük Seri">
          <Icon name="spark" size={15} />
          <span>{streak} Gün</span>
        </div>
        <div className="doa-header-pill" aria-label="Yıldız Sayısı">
          <Icon name="star" size={15} className="star-accent" />
          <span>{stars}</span>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
