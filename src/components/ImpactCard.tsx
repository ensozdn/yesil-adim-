import React from 'react';
import type { EcoImpactData } from '../types';
import { Icon } from './Icon';

interface ImpactCardProps {
  impact: EcoImpactData;
}

export const ImpactCard: React.FC<ImpactCardProps> = ({ impact }) => {
  return (
    <div className="impact-container">
      <div className="sectionhead">
        <strong>Sürdürülebilirlik Etkisi</strong>
        <span className="small">Doğaya Katkın</span>
      </div>

      <div className="impact-grid">
        <div className="impact-item">
          <div className="impact-icon-box">
            <Icon name="cloud" size={18} />
          </div>
          <div className="impact-data">
            <div className="impact-val">{impact.co2PreventedKg} kg</div>
            <div className="impact-label">Önlenen CO2</div>
          </div>
        </div>

        <div className="impact-item">
          <div className="impact-icon-box water">
            <Icon name="water" size={18} />
          </div>
          <div className="impact-data">
            <div className="impact-val">{impact.waterSavedLiters} L</div>
            <div className="impact-label">Tasarruf Su</div>
          </div>
        </div>

        <div className="impact-item">
          <div className="impact-icon-box leaf">
            <Icon name="leaf" size={18} />
          </div>
          <div className="impact-data">
            <div className="impact-val">{impact.treesConserved}</div>
            <div className="impact-label">Kurtarılan Ağaç</div>
          </div>
        </div>
      </div>

      <div className="campus-badge-row">
        <Icon name="recycle" size={16} />
        <span>SAÜ Kampüsünde Bu Ay {impact.campusMonthlyTotal} Atık Geri Dönüştürüldü</span>
      </div>
    </div>
  );
};

export default ImpactCard;
