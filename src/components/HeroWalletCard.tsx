import React, { useState } from 'react';
import { Icon } from './Icon';

interface HeroWalletCardProps {
  stars: number;
  levelName: string;
  levelNumber: number;
  onOpenRewards: () => void;
}

export const HeroWalletCard: React.FC<HeroWalletCardProps> = ({
  stars,
  levelName,
  levelNumber,
  onOpenRewards
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  return (
    <div className="doa-hero-card">
      <div className="doa-hero-art" aria-hidden="true">
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="110" cy="80" r="70" stroke="rgba(255,255,255,0.12)" strokeWidth="18" />
          <circle cx="110" cy="80" r="46" stroke="rgba(255,255,255,0.16)" strokeWidth="12" />
          <circle cx="110" cy="80" r="24" stroke="rgba(255,255,255,0.22)" strokeWidth="6" />
        </svg>
      </div>

      <div className="doa-hero-content">
        <div className="doa-hero-eyebrow">
          <span className="doa-hero-brand-tag">YEŞİL ADIM</span>
          <span className="doa-hero-subtitle">Güncel Yıldız Bakiyesi</span>
        </div>

        <div className="doa-hero-balance-row">
          <span className="doa-hero-balance-val">
            {isVisible ? `${stars} Yıldız` : '•••••'}
          </span>
          <button
            type="button"
            className="doa-hero-eye-btn"
            onClick={() => setIsVisible((prev) => !prev)}
            aria-label={isVisible ? 'Bakiyeyi Gizle' : 'Bakiyeyi Göster'}
          >
            <Icon name={isVisible ? 'eye' : 'eye-off'} size={18} />
          </button>
        </div>

        <div className="doa-hero-footer">
          <div className="doa-hero-level-badge">
            <Icon name="spark" size={13} />
            <span>Seviye {levelNumber} · {levelName}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="doa-hero-action-btn"
        onClick={onOpenRewards}
        aria-label="Ödülleri ve kuponları görüntüle"
      >
        <Icon name="arrow-right" size={20} />
      </button>
    </div>
  );
};

export default HeroWalletCard;

