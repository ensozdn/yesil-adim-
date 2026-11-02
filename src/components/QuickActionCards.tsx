import React from 'react';
import { Icon } from './Icon';

interface QuickActionCardsProps {
  onStartScan: () => void;
  onOpenAssistant: () => void;
}

export const QuickActionCards: React.FC<QuickActionCardsProps> = ({
  onStartScan,
  onOpenAssistant
}) => {
  return (
    <div className="doa-actions-grid">
      <button
        type="button"
        className="doa-action-card"
        onClick={onStartScan}
        aria-label="Atık kutusu QR kodunu okut"
      >
        <div className="doa-card-text">
          <strong className="doa-card-title">Atık Ayrıştır</strong>
          <span className="doa-card-subtitle">QR Kod Okut (+1)</span>
        </div>

        <div className="doa-card-art">
          <svg width="68" height="46" viewBox="0 0 68 46" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="16" width="13" height="26" rx="4" fill="#a4d7b7" stroke="#368e5d" strokeWidth="1.6" />
            <rect x="9.5" y="8" width="6" height="8" rx="2" fill="#368e5d" />
            <circle cx="12.5" cy="28" r="3.2" fill="#23633f" />

            <rect x="26" y="12" width="15" height="30" rx="5" fill="#bae2fd" stroke="#4a9bd4" strokeWidth="1.6" />
            <rect x="30" y="5" width="7" height="7" rx="2" fill="#4a9bd4" />
            <circle cx="33.5" cy="27" r="3.5" fill="#1d6fa5" />

            <rect x="47" y="18" width="16" height="24" rx="3.5" fill="#e2e8df" stroke="#7e8c81" strokeWidth="1.6" />
            <ellipse cx="55" cy="18" rx="6" ry="2.5" fill="#c7d0c9" />
            <circle cx="55" cy="30" r="3.2" fill="#58675c" />
          </svg>
        </div>
      </button>

      <button
        type="button"
        className="doa-action-card"
        onClick={onOpenAssistant}
        aria-label="AI atık asistanına danış"
      >
        <div className="doa-card-text">
          <strong className="doa-card-title">Nereye Atmalı?</strong>
          <span className="doa-card-subtitle">AI Atık Asistanı</span>
        </div>

        <div className="doa-card-art doa-art-lens">
          <div className="doa-lens-badge">
            <Icon name="camera" size={24} />
          </div>
        </div>
      </button>
    </div>
  );
};

export default QuickActionCards;
