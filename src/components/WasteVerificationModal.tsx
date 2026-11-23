import React, { useState } from 'react';
import type {
  CampusWasteStation,
  DisposalMotionProof,
  DisposalVerificationScenario,
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
import { verifyDisposalClipWithAi } from '../services/wasteAiService';
import { MotionClipRecorder } from './MotionClipRecorder';
import { Icon } from './Icon';

interface WasteVerificationModalProps {
  isOpen: boolean;
  wallet: WalletState;
  initialStation?: CampusWasteStation | null;
  initialStream?: WasteStreamType | null;
  onClose: () => void;
  onSuccess: (updatedWallet: WalletState) => void;
}

interface VerifiedTelemetry {
  durationMs: number;
  frameCount: number;
  estimatedSizeKb: number;
  summaryText: string;
}

type ModalStep = 'location' | 'disposal' | 'success';

const SCENARIO_OPTIONS: Array<{
  id: DisposalVerificationScenario;
  label: string;
}> = [
  { id: 'normal', label: 'Normal' },
  { id: 'wrong_bin', label: 'Yanlış Kutu' },
  { id: 'take_back_fraud', label: 'Atıp Geri Alma' }
];

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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [testScenario, setTestScenario] = useState<DisposalVerificationScenario>('normal');
  const [rejectedFrames, setRejectedFrames] = useState<string[]>([]);
  const [verifiedTelemetry, setVerifiedTelemetry] = useState<VerifiedTelemetry | null>(null);

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
    setIsSubmitting(false);
    setAiError(null);
    setRejectedFrames([]);
    setVerifiedTelemetry(null);
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

  const handleClipReady = async (proof: DisposalMotionProof) => {
    setIsSubmitting(true);
    setAiError(null);
    setRejectedFrames([]);

    const [check] = await Promise.all([
      verifyDisposalClipWithAi(
        proof,
        selectedStream,
        wallet.apiKey,
        simulation ? testScenario : 'normal'
      ),
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, 480);
      })
    ]);

    if (!check.isMatch) {
      setIsSubmitting(false);
      setAiError(check.message);
      setRejectedFrames(proof.frames.slice(0, 3));
      return;
    }

    const { nextWallet } = recordDisposalVerification(
      wallet,
      selectedStation,
      selectedStream,
      proof
    );

    setVerifiedTelemetry({
      durationMs: proof.durationMs,
      frameCount: proof.frames.length,
      estimatedSizeKb: proof.estimatedSizeKb,
      summaryText: check.message
    });
    setRejectedFrames([]);
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
                  ? `Simülasyon devrede: ${selectedStation.title} yanındasınız kabul edildi.`
                  : isAtStation
                  ? `İstasyona mesafe: ${effectiveDistance}m (Maksimum sınır: ${GEOFENCE_RADIUS_METERS}m)`
                  : `Seçili noktaya mesafe: ${effectiveDistance}m. Ayrıştırma teyidi için kutunun yanına gitmelisiniz.`}
              </p>
            </div>
          </div>

          {!simulation && !isAtStation && nearestAutoCheck && (
            <div className="verif-nearest-hint">
              <span>Şu anki konumunuza en yakın:</span>
              <strong>
                {nearestAutoCheck.station.title} ({nearestAutoCheck.distanceMeters}m)
              </strong>
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
          <span>3 sn Hareket Kaydına Geç</span>
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
    const activeStreamMeta = WASTE_STREAM_META[selectedStream];

    return (
      <div className="verif-step-content">
        <div className="verif-step-badge">2. AŞAMA · 3 SN HAREKET DOĞRULAMASI</div>
        <h3 className="verif-sub-title">Bölmeni Seç, Basılı Tut ve Bırak</h3>
        <p className="verif-sub-desc">
          Kayıt 360p sessiz alınır, atığın bırakıldığı teyit edilince anında onaylanır ve bellekten silinir.
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
                onClick={() => {
                  setSelectedStream(streamKey);
                  setAiError(null);
                  setRejectedFrames([]);
                }}
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

        {simulation && (
          <div className="verif-scenario-box">
            <span className="verif-sim-test-label">Sunum & Güvenlik Senaryosu:</span>
            <div className="verif-scenario-pills">
              {SCENARIO_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`verif-toggle-pill ${
                    testScenario === opt.id
                      ? opt.id === 'normal'
                        ? 'active'
                        : 'active-alert'
                      : ''
                  }`}
                  onClick={() => {
                    setTestScenario(opt.id);
                    setAiError(null);
                    setRejectedFrames([]);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <MotionClipRecorder
          streamMeta={activeStreamMeta}
          simulationMode={simulation}
          isVerifying={isSubmitting}
          onClipReady={(proof) => void handleClipReady(proof)}
        />

        {aiError && (
          <div className="verif-ai-alert error" role="alert">
            <div className="verif-ai-alert-icon">
              <Icon name="close" size={16} />
            </div>
            <div className="verif-ai-alert-text">
              <strong>AI Hareket Kilidi Reddi</strong>
              <p>{aiError}</p>
            </div>
          </div>
        )}

        {rejectedFrames.length > 0 && (
          <div className="clip-storyboard">
            <span className="clip-storyboard-label">İncelenen 3 Kilit Kare (Reddedildi)</span>
            <div className="clip-storyboard-grid">
              {rejectedFrames.map((frameSrc, idx) => (
                <div key={idx} className="clip-storyboard-item">
                  <img src={frameSrc} alt={`Kare ${idx + 1}`} />
                  <span>{idx === 0 ? '0.5 sn' : idx === 1 ? '1.5 sn' : '2.5 sn'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          className="verif-secondary-btn verif-full-width"
          onClick={() => {
            setAiError(null);
            setRejectedFrames([]);
            setStep('location');
          }}
        >
          Konum Adımına Dön
        </button>
      </div>
    );
  };

  const renderSuccessStep = () => {
    return (
      <div className="verif-success-content">
        <div className="verif-success-icon-wrap">
          <Icon name="shield-check" size={38} />
        </div>
        <div className="eyebrow">HAREKET KANITI DOĞRULANDI</div>
        <h2>Ayrıştırma Onaylandı!</h2>
        <p>
          Atığınız <strong>{selectedStation.title}</strong> noktasında{' '}
          <strong>{WASTE_STREAM_META[selectedStream].bagLabel}</strong> bölmesine bırakılırken
          doğrulandı.
        </p>

        <div className="verif-reward-pill">
          <Icon name="star" size={22} />
          <div>
            <strong>+1 Yeşil Yıldız Kazanıldı</strong>
            <small>Güncel bakiye: {wallet.stars} Yıldız</small>
          </div>
        </div>

        {verifiedTelemetry && (
          <div className="clip-privacy-receipt">
            <Icon name="video" size={16} />
            <div className="clip-privacy-receipt-text">
              <strong>
                360p Sessiz · {(verifiedTelemetry.durationMs / 1000).toFixed(1)} sn ·{' '}
                {verifiedTelemetry.frameCount} Kare · ~{verifiedTelemetry.estimatedSizeKb} KB
              </strong>
              <small>KVKK & Sıfır Depolama: Kayıt doğrulama sonrası bellekten silindi.</small>
            </div>
          </div>
        )}

        <div className="verif-quota-info">
          <span>Bugünkü kalan doğrulama hakkınız:</span>
          <strong>{Math.max(0, 2 - (wallet.dailyVerificationsCount || 0))} / 2</strong>
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
