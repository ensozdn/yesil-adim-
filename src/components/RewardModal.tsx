import React, { useState, useEffect } from 'react';
import type { CampusOffer, RewardTier } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { Icon } from './Icon';

interface RewardModalProps {
  reward: (RewardTier & Partial<CampusOffer>) | null;
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
    return `SAU-${randomSuffix}`;
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
  const gradientFrom = reward.gradientFrom || '#1f6a43';
  const gradientTo = reward.gradientTo || '#3d8655';
  const partnerName = reward.partner || 'SAÜ Kampüs';

  const handleComplete = () => {
    triggerHaptic('success');
    onConfirmRedeem(reward.id, reward.stars, reward.title);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet voucher-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="verif-modal-header">
          <h2 className="verif-modal-title">Dijital Kupon</h2>
          <button
            type="button"
            className="verif-modal-close"
            onClick={onClose}
            aria-label="Kapat"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="wallet-pass-card">
          <div
            className="wallet-pass-head"
            style={{
              background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`
            }}
          >
            <div className="wallet-pass-top">
              <span className="wallet-pass-partner">{partnerName}</span>
              <span className="wallet-pass-stars">
                <Icon name="star" size={13} />
                <span>{reward.stars} Yıldız</span>
              </span>
            </div>
            <h3 className="wallet-pass-title">{reward.title}</h3>
            <p className="wallet-pass-desc">{reward.desc}</p>
          </div>

          <div className="wallet-pass-cut" aria-hidden="true" />

          <div className="wallet-pass-body">
            <div className="barcode-box">
              <svg
                className="barcode-svg"
                viewBox="0 0 200 54"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <rect x="10" y="4" width="4" height="46" fill="currentColor" />
                <rect x="18" y="4" width="2" height="46" fill="currentColor" />
                <rect x="24" y="4" width="6" height="46" fill="currentColor" />
                <rect x="34" y="4" width="2" height="46" fill="currentColor" />
                <rect x="40" y="4" width="5" height="46" fill="currentColor" />
                <rect x="49" y="4" width="3" height="46" fill="currentColor" />
                <rect x="56" y="4" width="7" height="46" fill="currentColor" />
                <rect x="67" y="4" width="3" height="46" fill="currentColor" />
                <rect x="74" y="4" width="5" height="46" fill="currentColor" />
                <rect x="83" y="4" width="2" height="46" fill="currentColor" />
                <rect x="89" y="4" width="6" height="46" fill="currentColor" />
                <rect x="99" y="4" width="4" height="46" fill="currentColor" />
                <rect x="107" y="4" width="2" height="46" fill="currentColor" />
                <rect x="113" y="4" width="5" height="46" fill="currentColor" />
                <rect x="122" y="4" width="7" height="46" fill="currentColor" />
                <rect x="133" y="4" width="3" height="46" fill="currentColor" />
                <rect x="140" y="4" width="4" height="46" fill="currentColor" />
                <rect x="148" y="4" width="6" height="46" fill="currentColor" />
                <rect x="158" y="4" width="2" height="46" fill="currentColor" />
                <rect x="164" y="4" width="5" height="46" fill="currentColor" />
                <rect x="173" y="4" width="4" height="46" fill="currentColor" />
                <rect x="181" y="4" width="6" height="46" fill="currentColor" />
              </svg>
              <div className="voucher-code">{voucherCode}</div>
            </div>

            <div className="timer-pill">
              <Icon name="timer" size={15} />
              <span>Geçerlilik: {minutes}:{seconds}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="verif-primary-btn"
          style={{ marginTop: 14 }}
          onClick={handleComplete}
        >
          Kullanıldı Olarak İşaretle
        </button>
      </div>
    </div>
  );
};

export default RewardModal;
