import React from 'react';
import type { RewardTier } from '../types';
import { Icon } from './Icon';

interface FeaturedRewardsBannerProps {
  rewards: RewardTier[];
  currentStars: number;
  onSelectReward: (reward: RewardTier) => void;
  onViewAll: () => void;
}

export const FeaturedRewardsBanner: React.FC<FeaturedRewardsBannerProps> = ({
  rewards,
  currentStars,
  onSelectReward,
  onViewAll
}) => {
  const featured = rewards[0] || {
    id: 'coffee-5',
    stars: 5,
    title: 'Kampüs Sıcak İçecek',
    desc: 'Anlaşmalı kampüs kafelerinde 1 çay veya filtre kahve.'
  };

  const canRedeem = currentStars >= featured.stars;

  return (
    <div className="doa-featured-section">
      <div className="doa-section-header">
        <strong className="doa-section-title">ÖNE ÇIKAN FIRSATLAR</strong>
        <button
          type="button"
          className="doa-section-link"
          onClick={onViewAll}
        >
          <span>Tümünü Gör</span>
          <Icon name="arrow-right" size={15} />
        </button>
      </div>

      <div className="doa-featured-banner">
        <div className="doa-banner-art-bg" aria-hidden="true" />

        <div className="doa-banner-content">
          <div className="doa-banner-tag">
            <Icon name="coffee" size={14} />
            <span>KAMPÜS AYRICALIĞI</span>
          </div>

          <h3 className="doa-banner-title">{featured.title}</h3>
          <p className="doa-banner-desc">{featured.desc}</p>

          <button
            type="button"
            className={`doa-banner-btn ${canRedeem ? 'ready' : ''}`}
            onClick={() => onSelectReward(featured)}
          >
            {canRedeem ? 'Kupon Aç' : `${featured.stars} Yıldız Gerekli`}
          </button>
        </div>

        <div className="doa-banner-illustration" aria-hidden="true">
          <div className="doa-banner-badge-circle">
            <Icon name="star" size={28} className="star-gold" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedRewardsBanner;
