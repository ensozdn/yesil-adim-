import React, { useState, useEffect } from 'react';
import type { RewardTier } from '../types';
import { Icon } from './Icon';

interface RewardModalProps {
  reward: RewardTier | null;
  onClose: () => void;
  onConfirmRedeem: (rewardId: string, stars: number, title: string) => void;
}

export const RewardModal: React.FC<RewardModalProps> = ({
  reward,
  onClose,
  onConfirmRedeem
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [voucherCode] = useState<string>(() => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `SAU-KAFE-${randomSuffix}`;
  });

  useEffect(() => {
    if (!reward) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [reward]);

  if (!reward) return null;

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');

  const handleComplete = () => {
    onConfirmRedeem(reward.id, reward.stars, reward.title);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet voucher-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sectionhead" style={{ marginTop: 0 }}>
          <strong>Kampüs Dijital Kuponu</strong>
          <button className="back" onClick={onClose} aria-label="Kapat">
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="voucher-card">
          <div className="voucher-badge">
            <Icon name="coffee" size={16} />
            <span>{reward.stars} Yıldız Kullanımı</span>
          </div>

          <h3 className="voucher-title">{reward.title}</h3>
          <p className="voucher-desc">{reward.desc}</p>

          <div className="barcode-box">
            <svg
              className="barcode-svg"
              viewBox="0 0 200 60"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <rect x="10" y="5" width="4" height="50" fill="currentColor" />
              <rect x="18" y="5" width="2" height="50" fill="currentColor" />
              <rect x="24" y="5" width="6" height="50" fill="currentColor" />
              <rect x="34" y="5" width="2" height="50" fill="currentColor" />
              <rect x="40" y="5" width="5" height="50" fill="currentColor" />
              <rect x="49" y="5" width="3" height="50" fill="currentColor" />
              <rect x="56" y="5" width="7" height="50" fill="currentColor" />
              <rect x="67" y="5" width="3" height="50" fill="currentColor" />
              <rect x="74" y="5" width="5" height="50" fill="currentColor" />
              <rect x="83" y="5" width="2" height="50" fill="currentColor" />
              <rect x="89" y="5" width="6" height="50" fill="currentColor" />
              <rect x="99" y="5" width="4" height="50" fill="currentColor" />
              <rect x="107" y="5" width="2" height="50" fill="currentColor" />
              <rect x="113" y="5" width="5" height="50" fill="currentColor" />
              <rect x="122" y="5" width="7" height="50" fill="currentColor" />
              <rect x="133" y="5" width="3" height="50" fill="currentColor" />
              <rect x="140" y="5" width="4" height="50" fill="currentColor" />
              <rect x="148" y="5" width="6" height="50" fill="currentColor" />
              <rect x="158" y="5" width="2" height="50" fill="currentColor" />
              <rect x="164" y="5" width="5" height="50" fill="currentColor" />
              <rect x="173" y="5" width="4" height="50" fill="currentColor" />
              <rect x="181" y="5" width="6" height="50" fill="currentColor" />
            </svg>
            <div className="voucher-code">{voucherCode}</div>
          </div>

          <div className="timer-pill">
            <Icon name="timer" size={17} />
            <span>Kalan Süre: {minutes}:{seconds}</span>
          </div>

          <div className="voucher-instructions">
            SAÜ kampüs kafelerinde veya kantinlerinde bu ekranı görevliye göstererek ödülünüzü teslim alabilirsiniz.
          </div>
        </div>

        <button className="primary green" onClick={handleComplete} style={{ marginTop: 14 }}>
          Siparişi Teslim Aldım (Kullanıldı)
        </button>
      </div>
    </div>
  );
};

export default RewardModal;
