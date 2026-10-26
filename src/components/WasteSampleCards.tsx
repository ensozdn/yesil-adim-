import React from 'react';
import type { WasteSampleItem } from '../types';
import { SAMPLE_WASTE_ITEMS } from '../services/sampleWasteService';
import { Icon } from './Icon';

interface WasteSampleCardsProps {
  onSelectSample: (item: WasteSampleItem) => void;
  disabled?: boolean;
}

export const WasteSampleCards: React.FC<WasteSampleCardsProps> = ({
  onSelectSample,
  disabled = false
}) => {
  return (
    <div className="sample-cards-section">
      <div className="sectionhead">
        <strong>Örnek Atık Kartları</strong>
        <span className="small">Dokun & Hemen Dene</span>
      </div>

      <div className="sample-cards-carousel" role="region" aria-label="Örnek atık kartları">
        {SAMPLE_WASTE_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="sample-card"
            disabled={disabled}
            onClick={() => onSelectSample(item)}
            aria-label={`${item.title} örneğini AI ile analiz et`}
          >
            <div className="sample-card-media">
              <img
                src={item.imageDataUrl}
                alt={item.title}
                className="sample-card-img"
                loading="lazy"
              />
              <span
                className="sample-card-badge"
                style={{ backgroundColor: `${item.accentColor}18`, color: item.accentColor }}
              >
                {item.badgeText}
              </span>
            </div>

            <div className="sample-card-body">
              <strong>{item.title}</strong>
              <p className="sample-card-subtitle">{item.subtitle}</p>

              <div className="sample-card-action">
                <Icon name="spark" size={14} />
                <span>AI ile Sor</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WasteSampleCards;
