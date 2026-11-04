import React, { useState, useRef } from 'react';
import type {
  CampusWasteStation,
  WalletState,
  WasteStreamType
} from '../types';
import {
  CAMPUS_WASTE_STATIONS,
  WASTE_STREAM_META
} from '../services/campusWasteLocationsService';
import {
  calculateDistanceMeters,
  checkVerificationEligibility,
  findNearestStation,
  getSimulationMode,
  GEOFENCE_RADIUS_METERS,
  recordDisposalVerification,
  setSimulationMode
} from '../services/wasteVerificationService';
import { verifyDisposalPhotoWithAi } from '../services/wasteAiService';
import { Icon } from './Icon';

interface WasteVerificationModalProps {
  isOpen: boolean;
  wallet: WalletState;
  initialStation?: CampusWasteStation | null;
  initialStream?: WasteStreamType | null;
  onClose: () => void;
  onSuccess: (updatedWallet: WalletState) => void;
}

type ModalStep = 'location' | 'disposal' | 'success';

export const WasteVerificationModal: React.FC<WasteVerificationModalProps> = ({
  isOpen,
  wallet,
  initialStation,
  initialStream,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<ModalStep>('location');
  const [simulation, setSimulation] = useState<boolean>(() => getSimulationMode());
  const [selectedStation, setSelectedStation] = useState<CampusWasteStation>(
    () => initialStation || CAMPUS_WASTE_STATIONS[0]
  );
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<WasteStreamType>(
    () => initialStream || 'packaging'
  );
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [simulateMismatch, setSimulateMismatch] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleLocate = React.useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Tarayıcınız konum servisini desteklemiyor.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      () => {
        setIsLocating(false);
        setLocationError('Konum izni alınamadı. Simülasyon modunu açarak test edebilirsiniz.');
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  }, []);

  const handleToggleSimulation = (enabled: boolean) => {
    setSimulation(enabled);
    setSimulationMode(enabled);
    if (!enabled) {
      handleLocate();
    } else {
      setLocationError(null);
    }
  };

  const handleDismissModal = () => {
    setStep('location');
    setProofImage(null);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  const effectiveDistance = simulation
    ? 0
    : userCoords
    ? calculateDistanceMeters(
        userCoords.lat,
        userCoords.lng,
        selectedStation.lat,
        selectedStation.lng
      )
    : 999;

  const isAtStation = simulation || effectiveDistance <= GEOFENCE_RADIUS_METERS;
  const eligibility = checkVerificationEligibility(wallet, isAtStation);

  const nearestAutoCheck = userCoords
    ? findNearestStation(userCoords.lat, userCoords.lng)
    : null;

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProofImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmDisposal = async () => {
    if (!proofImage && !simulation) {
      setAiError('Lütfen atığı kutunun bölmesine bırakırken tek bir kare fotoğraf çekiniz.');
      return;
    }

    setIsSubmitting(true);
    setAiError(null);

    const check = await verifyDisposalPhotoWithAi(
      proofImage || 'simulated',
      selectedStream,
      wallet.apiKey,
      simulateMismatch
    );

    if (!check.isMatch) {
      setIsSubmitting(false);
      setAiError(check.message);
      return;
    }

    const { nextWallet } = recordDisposalVerification(
      wallet,
      selectedStation,
      selectedStream,
      proofImage || undefined
    );
    setIsSubmitting(false);
    setStep('success');
    onSuccess(nextWallet);
  };

  const renderLocationStep = () => {
    return (
      <div className="verif-step-content">
        <div className="verif-sim-banner">
          <div className="verif-sim-info">
            <Icon name="spark" size={17} />
            <div>
              <strong>Geliştirici & Test Modu</strong>
              <small>Kampüs dışından testi simüle et</small>
            </div>
          </div>
          <button
            type="button"
            className={`verif-toggle-pill ${simulation ? 'active' : ''}`}
            onClick={() => handleToggleSimulation(!simulation)}
          >
            {simulation ? 'Simülasyon Açık' : 'GPS Aktif'}
          </button>
        </div>

        <div className="verif-station-selector">
          <label className="verif-label">Bulunduğunuz Atık İstasyonu</label>
          <select
            className="verif-select"
            value={selectedStation.id}
            onChange={(e) => {
              const found = CAMPUS_WASTE_STATIONS.find((s) => s.id === e.target.value);
              if (found) setSelectedStation(found);
            }}
          >
            {CAMPUS_WASTE_STATIONS.map((station) => (
              <option key={station.id} value={station.id}>
                {station.title} ({station.zone})
              </option>
            ))}
          </select>
          <p className="verif-helper-text">{selectedStation.locationDetail}</p>
        </div>

        <div className={`verif-geofence-card ${isAtStation ? 'in-zone' : 'out-zone'}`}>
          <div className="verif-geofence-header">
            <Icon name={isAtStation ? 'check' : 'map-pin'} size={20} />
            <div>
              <strong>
                {isAtStation
                  ? 'Konum Doğrulandı: Kutu Başındasınız'
                  : 'Kutuya Yeterince Yakın Değilsiniz'}
              </strong>
              <p>
                {simulation
                  ? 'Simülasyon devrede: Süleyman Demirel Kütüphanesi yanındasınız kabul edildi.'
                  : isAtStation
                  ? `İstasyona mesafe: ${effectiveDistance}m (Maksimum sınır: ${GEOFENCE_RADIUS_METERS}m)`
                  : `Seçili noktaya mesafe: ${effectiveDistance}m. Ayrıştırma teyidi için kutunun yanına gitmelisiniz.`}
              </p>
            </div>
          </div>

          {!simulation && !isAtStation && nearestAutoCheck && (
            <div className="verif-nearest-hint">
              <span>Şu anki konumunuza en yakın:</span>
              <strong>{nearestAutoCheck.station.title} ({nearestAutoCheck.distanceMeters}m)</strong>
            </div>
          )}

          {!simulation && (
            <button
              type="button"
              className="verif-relocate-btn"
              onClick={handleLocate}
              disabled={isLocating}
            >
              <Icon name="locate" size={15} />
              <span>{isLocating ? 'Konum Alınıyor...' : 'Konumumu Yeniden Tara'}</span>
            </button>
          )}

          {locationError && <p className="verif-error-msg">{locationError}</p>}
        </div>

        <div className="verif-limits-strip">
          <div className="verif-limit-col">
            <span className="verif-limit-label">Bugünkü Hak</span>
            <strong className="verif-limit-val">
              {eligibility.remainingDailyCount} / 2 Kalan
            </strong>
          </div>
          <div className="verif-limit-col">
            <span className="verif-limit-label">Güvenlik Durumu</span>
            <strong className="verif-limit-val">
              {eligibility.reason === 'daily_limit'
                ? 'Günlük Kota Doldu'
                : eligibility.reason === 'cooldown'
                ? `${eligibility.cooldownRemainingMinutes} dk bekleme`
                : isAtStation
                ? 'Doğrulamaya Hazır'
                : 'Mesafe Kısıtlı'}
            </strong>
          </div>
        </div>

        <button
          type="button"
          className="verif-primary-btn"
          disabled={!eligibility.eligible}
          onClick={() => setStep('disposal')}
        >
          <span>Atık Teyidi Aşamasına Geç</span>
          <Icon name="arrow-right" size={17} />
        </button>

        {!isAtStation && (
          <p className="verif-foot-note">
            Test için yukarıdaki <strong>Geliştirici & Test Modu</strong> butonundan simülasyonu açabilirsiniz.
          </p>
        )}
      </div>
    );
  };

  const renderDisposalStep = () => {
    return (
      <div className="verif-step-content">
        <div className="verif-step-badge">2. AŞAMA · KUTU BAŞINDA TEYİT</div>
        <h3 className="verif-sub-title">Ayrıştırdığınız Atık Türü</h3>
        <p className="verif-sub-desc">
          SAÜ Sıfır Atık Yönetmeliği uyarınca kutudaki doğru bölmeyi seçiniz.
        </p>

        <div className="verif-streams-grid">
          {selectedStation.streams.map((streamKey) => {
            const meta = WASTE_STREAM_META[streamKey];
            const isSelected = selectedStream === streamKey;
            return (
              <button
                key={streamKey}
                type="button"
                className={`verif-stream-chip ${isSelected ? 'selected' : ''}`}
                style={{
                  borderColor: isSelected ? meta.color : undefined,
                  backgroundColor: isSelected ? meta.bgColor : undefined
                }}
                onClick={() => setSelectedStream(streamKey)}
              >
                <span
                  className="verif-stream-dot"
                  style={{ backgroundColor: meta.color }}
                />
                <span className="verif-stream-texts">
                  <strong>{meta.label}</strong>
                  <small style={{ color: meta.color }}>{meta.bagLabel}</small>
                </span>
              </button>
            );
          })}
        </div>

        <div className="verif-camera-box">
          <label className="verif-label">Kutu Başında Atık Fotoğrafı (AI Görsel Eşleştirme)</label>

          {simulation && (
            <div className="verif-sim-test-bar">
              <span className="verif-sim-test-label">Hoca & Güvenlik Testi:</span>
              <button
                type="button"
                className={`verif-toggle-pill ${simulateMismatch ? 'active-alert' : ''}`}
                onClick={() => {
                  setSimulateMismatch(!simulateMismatch);
                  setAiError(null);
                }}
              >
                {simulateMismatch ? 'Yanlış Kutu Senaryosu Aktif' : 'Normal Eşleşme'}
              </button>
            </div>
          )}

          {proofImage ? (
            <div className="verif-preview-wrapper">
              <img src={proofImage} alt="Kutu başında atık teyidi" className="verif-preview-img" />
              <button
                type="button"
                className="verif-retake-btn"
                onClick={() => {
                  setProofImage(null);
                  setAiError(null);
                }}
              >
                <Icon name="close" size={14} />
                <span>Fotoğrafı Değiştir</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="verif-cam-trigger"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="verif-cam-icon-circle">
                <Icon name="camera" size={24} />
              </div>
              <strong>Kutunun Başında Fotoğraf Çek</strong>
              <small>Atığı kutunun bölmesine bırakırken tek bir kare çekin</small>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handlePhotoCapture}
          />

          {aiError && (
            <div className="verif-ai-alert error" role="alert">
              <div className="verif-ai-alert-icon">
                <Icon name="close" size={16} />
              </div>
              <div className="verif-ai-alert-text">
                <strong>AI Görsel Doğrulama Reddi</strong>
                <p>{aiError}</p>
              </div>
            </div>
          )}
        </div>

        <div className="verif-actions-row">
          <button
            type="button"
            className="verif-secondary-btn"
            onClick={() => setStep('location')}
          >
            Geri
          </button>
          <button
            type="button"
            className="verif-primary-btn"
            disabled={isSubmitting}
            onClick={handleConfirmDisposal}
          >
            <Icon name="shield-check" size={18} />
            <span>{isSubmitting ? 'Doğrulanıyor...' : 'Ayrıştırmayı Onayla & Yıldız Kazan'}</span>
          </button>
        </div>
      </div>
    );
  };

  const renderSuccessStep = () => {
    return (
      <div className="verif-success-content">
        <div className="verif-success-icon-wrap">
          <Icon name="shield-check" size={38} />
        </div>
        <div className="eyebrow">İŞLEM TAMAMLANDI</div>
        <h2>Ayrıştırma Doğrulandı!</h2>
        <p>
          Atığınız <strong>{selectedStation.title}</strong> noktasında doğru bölmeyle eşleştirildi. Kampüs çevresel katkınız sisteme kaydedildi.
        </p>

        <div className="verif-reward-pill">
          <Icon name="star" size={22} />
          <div>
            <strong>+1 Yeşil Yıldız Kazanıldı</strong>
            <small>Güncel bakiye: {wallet.stars + 1} Yıldız</small>
          </div>
        </div>

        <div className="verif-quota-info">
          <span>Bugünkü kalan doğrulama hakkınız:</span>
          <strong>{Math.max(0, 2 - ((wallet.dailyVerificationsCount || 0) + 1))} / 2</strong>
        </div>

        <button
          type="button"
          className="verif-primary-btn"
          onClick={handleDismissModal}
        >
          Haritaya Dön
        </button>
      </div>
    );
  };

  return (
    <div className="verif-modal-overlay" role="dialog" aria-modal="true">
      <div className="verif-modal-sheet">
        <div className="verif-modal-header">
          <div className="verif-title-group">
            <span className="verif-eyebrow">GÜVENLİ GERİ DÖNÜŞÜM DOĞRULAMA</span>
            <h2 className="verif-modal-title">Doğrulanmış Atık Ayrıştırma</h2>
          </div>
          <button
            type="button"
            className="verif-modal-close"
            onClick={handleDismissModal}
            aria-label="Kapat"
          >
            <Icon name="close" size={17} />
          </button>
        </div>

        {step === 'location' && renderLocationStep()}
        {step === 'disposal' && renderDisposalStep()}
        {step === 'success' && renderSuccessStep()}
      </div>
    </div>
  );
};
