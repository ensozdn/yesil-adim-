import React from 'react';
import type { ScanRecord } from '../types';
import { calculateRecyclingBreakdown } from '../services/recyclingStatsService';
import { Icon } from './Icon';

interface GainsOverviewCardProps {
  stars: number;
  targetStars?: number;
  history: ScanRecord[];
  onViewDetails: () => void;
}

export const GainsOverviewCard: React.FC<GainsOverviewCardProps> = ({
  stars,
  targetStars = 20,
  history,
  onViewDetails
}) => {
  const { totalCount, categories } = calculateRecyclingBreakdown(history);
  const progressRatio = Math.min(1, stars / targetStars);
  const strokeDashoffset = 251.3 * (1 - progressRatio);

  const getCategoryCount = (binType: string) => {
    const found = categories.find((c) => c.binType === binType);
    return found ? found.count : 0;
  };

  return (
    <div className="doa-gains-section">
      <div className="doa-section-header">
        <strong className="doa-section-title">ÇEVRESEL KAZANIMLARIM</strong>
        <button
          type="button"
          className="doa-section-link"
          onClick={onViewDetails}
        >
          <span>Tümünü Gör</span>
          <Icon name="arrow-right" size={15} />
        </button>
      </div>

      <div className="doa-gains-card">
        <div className="doa-gauge-col">
          <div className="doa-gauge-box">
            <svg width="108" height="108" viewBox="0 0 108 108" className="doa-gauge-svg">
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
          <span className="doa-gauge-bottom-label">Toplam {totalCount} Atık</span>
        </div>

        <div className="doa-gains-items-row">
          <div className="doa-gain-item">
            <div className="doa-gain-art">
              <svg width="22" height="42" viewBox="0 0 22 42" fill="none">
                <rect x="7" y="2" width="8" height="6" rx="2" fill="#2e7d32" />
                <path d="M7 8 C5 14 3 18 3 24 L3 38 C3 40 5 41 8 41 L14 41 C17 41 19 40 19 38 L19 24 C19 18 17 14 15 8 Z" fill="#a5d6a7" stroke="#2e7d32" strokeWidth="1.5" />
                <circle cx="11" cy="28" r="3.2" fill="#1b5e20" />
              </svg>
            </div>
            <strong className="doa-gain-count">{getCategoryCount('glass')}</strong>
            <span className="doa-gain-name">Cam</span>
          </div>

          <div className="doa-gain-item">
            <div className="doa-gain-art">
              <svg width="22" height="42" viewBox="0 0 22 42" fill="none">
                <rect x="7.5" y="2" width="7" height="5" rx="1.5" fill="#1976d2" />
                <rect x="4" y="8" width="14" height="31" rx="4" fill="#bbdefb" stroke="#1976d2" strokeWidth="1.5" />
                <line x1="4" y1="16" x2="18" y2="16" stroke="#90caf9" strokeWidth="1.2" />
                <line x1="4" y1="24" x2="18" y2="24" stroke="#90caf9" strokeWidth="1.2" />
                <circle cx="11" cy="30" r="3" fill="#0d47a1" />
              </svg>
            </div>
            <strong className="doa-gain-count">{getCategoryCount('plastic')}</strong>
            <span className="doa-gain-name">Pet</span>
          </div>

          <div className="doa-gain-item">
            <div className="doa-gain-art">
              <svg width="22" height="42" viewBox="0 0 22 42" fill="none">
                <rect x="4" y="6" width="14" height="33" rx="3.5" fill="#e8eaed" stroke="#5f6368" strokeWidth="1.5" />
                <ellipse cx="11" cy="6" rx="5.5" ry="2" fill="#dadce0" />
                <circle cx="11" cy="22" r="3.2" fill="#3c4043" />
              </svg>
            </div>
            <strong className="doa-gain-count">{getCategoryCount('paper')}</strong>
            <span className="doa-gain-name">Kâğıt</span>
          </div>

          <div className="doa-gain-item">
            <div className="doa-gain-art">
              <svg width="22" height="42" viewBox="0 0 22 42" fill="none">
                <rect x="8" y="2" width="6" height="4" rx="1" fill="#757575" />
                <rect x="4" y="6" width="14" height="33" rx="3" fill="#ffcdd2" stroke="#d32f2f" strokeWidth="1.5" />
                <rect x="4" y="6" width="14" height="10" rx="2" fill="#ef5350" />
                <line x1="11" y1="22" x2="11" y2="30" stroke="#b71c1c" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="7" y1="26" x2="15" y2="26" stroke="#b71c1c" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <strong className="doa-gain-count">{getCategoryCount('battery')}</strong>
            <span className="doa-gain-name">Pil</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GainsOverviewCard;

