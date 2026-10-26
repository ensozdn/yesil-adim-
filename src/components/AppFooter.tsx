import React from 'react';
import { Icon } from './Icon';

interface AppFooterProps {
  minimal?: boolean;
}

export const AppFooter: React.FC<AppFooterProps> = ({ minimal = false }) => {
  if (minimal) {
    return (
      <footer className="app-footer-minimal">
        <p className="app-footer-minimal-text">Developed by Enes Özden · Tüm Hakları Saklıdır</p>
        <span className="app-footer-minimal-sub">Sakarya Üniversitesi · Yeşil Adım 2026</span>
      </footer>
    );
  }

  return (
    <footer className="app-footer-full">
      <div className="app-footer-brand">
        <div className="app-footer-icon-badge">
          <Icon name="leaf" size={20} />
        </div>
        <div>
          <strong>Yeşil Adım</strong>
          <p className="small">SAÜ Sürdürülebilir Kampüs İnisiyatifi</p>
        </div>
      </div>

      <div className="app-footer-signature-card">
        <div className="app-footer-signature-head">
          <Icon name="check" size={15} />
          <span>PROJE GELİŞTİRİCİSİ</span>
        </div>
        <div className="app-footer-dev-name">Developed by Enes Özden</div>
        <div className="app-footer-rights">Tüm Hakları Saklıdır · Sakarya Üniversitesi</div>
      </div>

      <div className="app-footer-meta">
        <span>Sürüm 1.0.0 (PWA)</span>
        <span>·</span>
        <span>Esentepe Kampüsü</span>
      </div>
    </footer>
  );
};

export default AppFooter;
