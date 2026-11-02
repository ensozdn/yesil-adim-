import React from 'react';

interface GainsOverviewCardProps {
  stars: number;
  targetStars?: number;
}

export const GainsOverviewCard: React.FC<GainsOverviewCardProps> = ({
  stars,
  targetStars = 20
}) => {
  const progressRatio = Math.min(1, stars / targetStars);
  const strokeDashoffset = 251.3 * (1 - progressRatio);
  const remainingStars = Math.max(0, targetStars - stars);

  return (
    <div className="doa-gains-section">
      <div className="doa-section-header">
        <strong className="doa-section-title">ÇEVRESEL KAZANIMLARIM</strong>
      </div>

      <div className="doa-gains-card">
        <div className="doa-gauge-box">
          <svg width="104" height="104" viewBox="0 0 108 108" className="doa-gauge-svg">
            <circle
              cx="54"
              cy="54"
              r="40"
              fill="none"
              stroke="#e5ebe2"
              strokeWidth="8.5"
              strokeLinecap="round"
            />
            <circle
              cx="54"
              cy="54"
              r="40"
              fill="none"
              stroke="#23633f"
              strokeWidth="8.5"
              strokeLinecap="round"
              strokeDasharray="251.3"
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 54 54)"
            />
          </svg>
          <div className="doa-gauge-inner">
            <span className="doa-gauge-caption">HAFTALIK HEDEF</span>
            <strong className="doa-gauge-num">{stars} / {targetStars}</strong>
          </div>
        </div>

        <div className="doa-gains-summary">
          <strong className="doa-gains-summary-title">
            {remainingStars > 0 ? `${remainingStars} yıldız kaldı` : 'Hedefe ulaştın'}
          </strong>
          <span className="doa-gains-summary-text">
            {remainingStars > 0
              ? 'Haftalık hedefini tamamladığında yeni kampüs fırsatlarını açabilirsin.'
              : 'Tebrikler, haftalık yıldız hedefini tamamladın.'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GainsOverviewCard;
