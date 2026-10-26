import React from 'react';
import type { ScanRecord } from '../types';
import { calculateRecyclingBreakdown } from '../services/recyclingStatsService';
import { Icon } from './Icon';

interface RecyclingBreakdownProps {
  history: ScanRecord[];
}

export const RecyclingBreakdown: React.FC<RecyclingBreakdownProps> = ({ history }) => {
  const { totalCount, categories } = calculateRecyclingBreakdown(history);

  return (
    <div className="breakdown-container">
      <div className="sectionhead">
        <strong>Atık Ayrıştırma Karnen</strong>
        <span className="small">{totalCount} Adet Kayıt</span>
      </div>

      <div className="panel breakdown-panel">
        <div className="multi-segment-track">
          {categories.map((cat) => {
            if (cat.percent === 0) return null;
            return (
              <div
                key={cat.binType}
                className="multi-segment-fill"
                style={{
                  width: `${cat.percent}%`,
                  backgroundColor: cat.color
                }}
              />
            );
          })}
        </div>

        <div className="breakdown-list">
          {categories.map((cat) => (
            <div key={cat.binType} className="breakdown-row">
              <div
                className="breakdown-icon-box"
                style={{ color: cat.color, backgroundColor: `${cat.color}15` }}
              >
                <Icon name={cat.icon} size={18} />
              </div>

              <div className="breakdown-meta">
                <div className="breakdown-title-row">
                  <strong>{cat.label}</strong>
                  <span className="breakdown-count-val">{cat.count} Adet</span>
                </div>
                <div className="breakdown-bar-bg">
                  <div
                    className="breakdown-mini-fill"
                    style={{
                      width: `${cat.percent}%`,
                      backgroundColor: cat.color
                    }}
                  />
                </div>
              </div>

              <span className="breakdown-percent-badge">%{cat.percent}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecyclingBreakdown;
