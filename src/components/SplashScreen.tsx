import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface SplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  durationMs = 4000
}) => {
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, durationMs - 500);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, durationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onFinish]);

  return (
    <div
      className={`splash-overlay ${isFadingOut ? 'fade-out' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Yeşil Adım Yükleniyor"
    >
      <div className="splash-ambient-circle" />
      <div className="splash-ambient-circle secondary" />

      <div className="splash-container">
        <div className="splash-logo-box">
          <div className="splash-halo" />
          <div className="splash-iris">
            <Icon name="leaf" size={48} />
          </div>
        </div>

        <div className="splash-brand-text">
          <h1 className="splash-title">yeşil adım</h1>
          <p className="splash-subtitle">Sakarya Üniversitesi · Sürdürülebilir Kampüs</p>
        </div>

        <div className="splash-loader-bar">
          <div
            className="splash-loader-progress"
            style={{ animationDuration: `${durationMs - 600}ms` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
