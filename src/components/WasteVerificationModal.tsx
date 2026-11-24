import React, { useEffect, useState } from 'react';
import type {
  CampusWasteStation,
  DisposalMotionProof,
  DisposalVerificationScenario,
  WalletState,
  WasteStreamType
} from '../types';
import {
  CAMPUS_WASTE_STATIONS,
  formatWalkingEstimate,
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
import { triggerHaptic } from '../utils/haptics';
import { MotionClipRecorder } from './MotionClipRecorder';
import { Icon } from './Icon';

interface WasteVerificationModalProps {
  isOpen: boolean;
  wallet: WalletState;
  initialStation?: CampusWasteStation | null;
  initialStream?: WasteStreamType | null;
  onClose: () => void;
  onSuccess: (updatedWallet: WalletState) => void;
  onResetTestQuota?: () => void;
}

interface VerifiedTelemetry {
  durationMs: number;
  frameCount: number;
  estimatedSizeKb: number;
}

type ModalView = 'camera' | 'success';

const SCENARIO_OPTIONS: Array<{
  id: DisposalVerificationScenario;
  label: string;
}> = [
  { id: 'normal', label: 'Geçerli' },
  { id: 'wrong_bin', label: 'Yanlış Bölme' },
  { id: 'take_back_fraud', label: 'Geri Çekme' }
];

const SHORT_STREAM_NAMES: Record<WasteStreamType, string> = {
  packaging: 'Sarı · Ambalaj',
  paper: 'Mavi · Kâğıt',
  domestic: 'Gri · Evsel',
  battery: 'Pil Kutusu'
};

export const WasteVerificationModal: React.FC<WasteVerificationModalProps> = ({
  isOpen,
  wallet,
  initialStation,
  initialStream,
  onClose,
  onSuccess,
  onResetTestQuota
}) => {
  const [view, setView] = useState<ModalView>('camera');
  const [simulation, setSimulation] = useState<boolean>(() => getSimulationMode());
  const [showDemoControls, setShowDemoControls] = useState<boolean>(false);
  const [showStationPicker, setShowStationPicker] = useState<boolean>(false);
  const [selectedStation, setSelectedStation] = useState<CampusWasteStation>(
    () => initialStation || CAMPUS_WASTE_STATIONS[0]
  );
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [selectedStream, setSelectedStream] = useState<WasteStreamType>(
    () => initialStream || 'packaging'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [testScenario, setTestScenario] = useState<DisposalVerificationScenario>('normal');
  const [rejectedFrames, setRejectedFrames] = useState<string[]>([]);
  const [verifiedTelemetry, setVerifiedTelemetry] = useState<VerifiedTelemetry | null>(null);

  const handleLocate = React.useCallback(() => {
    if (!navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setUserCoords(coords);
        if (!initialStation) {
          const nearest = findNearestStation(coords.lat, coords.lng);
          setSelectedStation(nearest.station);
        }
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  }, [initialStation]);

  useEffect(() => {
    if (!isOpen || simulation || !navigator.geolocation) return;

    let active = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!active) return;
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setUserCoords(coords);
        if (!initialStation) {
          const nearest = findNearestStation(coords.lat, coords.lng);
          setSelectedStation(nearest.station);
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 7000 }
    );

    return () => {
      active = false;
    };
  }, [isOpen, simulation, initialStation]);

  const handleToggleSimulation = (enabled: boolean) => {
    setSimulation(enabled);
    setSimulationMode(enabled);
    if (!enabled) {
      handleLocate();
    }
  };

  const handleDismissModal = () => {
    setView('camera');
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

  const getDisabledReason = (): string | null => {
    if (eligibility.eligible) return null;
    if (eligibility.reason === 'daily_limit') {
      return 'Bugünkü doğrulama hakkınız doldu (2/2).';
    }
    if (eligibility.reason === 'cooldown') {
      return `Yeni doğrulama için ${eligibility.cooldownRemainingMinutes} dk bekleme süresi kaldı.`;
    }
    return `Kutunun ${GEOFENCE_RADIUS_METERS}m yakınında olmalısınız (${formatWalkingEstimate(effectiveDistance)}).`;
  };

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
        window.setTimeout(resolve, 420);
      })
    ]);

    if (!check.isMatch) {
      triggerHaptic('error');
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

    triggerHaptic('success');
    setVerifiedTelemetry({
      durationMs: proof.durationMs,
      frameCount: proof.frames.length,
      estimatedSizeKb: proof.estimatedSizeKb
    });
    setRejectedFrames([]);
    setIsSubmitting(false);
    setView('success');
    onSuccess(nextWallet);
  };

  const activeStreamMeta = WASTE_STREAM_META[selectedStream];
  const disabledReason = getDisabledReason();

  return (
    <div className="verif-modal-overlay" role="dialog" aria-modal="true">
      <div className="verif-modal-sheet">
        <div className="verif-modal-header">
          <h2 className="verif-modal-title">Atık Doğrula</h2>
          <div className="verif-header-actions">
            {view === 'camera' && (
              <button
                type="button"
                className={`verif-demo-chip ${showDemoControls ? 'open' : ''}`}
                onClick={() => setShowDemoControls((prev) => !prev)}
                aria-label="Demo ayarları"
              >
                <Icon name="spark" size={13} />
                <span>Demo</span>
              </button>
            )}
            <button
              type="button"
              className="verif-modal-close"
              onClick={handleDismissModal}
              aria-label="Kapat"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>

        {view === 'camera' ? (
          <div className="verif-step-content">
            {showDemoControls && (
              <div className="verif-demo-drawer">
                <div className="verif-demo-row">
                  <span className="verif-sim-test-label">Konum:</span>
                  <button
                    type="button"
                    className={`verif-toggle-pill ${simulation ? 'active' : ''}`}
                    onClick={() => handleToggleSimulation(!simulation)}
                  >
                    {simulation ? 'Simülasyon Açık' : 'Gerçek GPS'}
                  </button>
                </div>

                {simulation && (
                  <div className="verif-demo-row">
                    <span className="verif-sim-test-label">Senaryo:</span>
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

                {onResetTestQuota && (
                  <button
                    type="button"
                    className="verif-reset-link"
                    onClick={onResetTestQuota}
                  >
                    Günlük Hak ve Bekleme Süresini Sıfırla ({eligibility.remainingDailyCount}/2)
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              className={`verif-loc-bar ${isAtStation ? 'ok' : 'warn'}`}
              onClick={() => setShowStationPicker((prev) => !prev)}
            >
              <div className="verif-loc-bar-left">
                <Icon name={isAtStation ? 'check' : 'map-pin'} size={15} />
                <span className="verif-loc-station">{selectedStation.title}</span>
              </div>
              <span className="verif-loc-status">
                {isAtStation
                  ? `Hak ${eligibility.remainingDailyCount}/2`
                  : formatWalkingEstimate(effectiveDistance)}
              </span>
            </button>

            {showStationPicker && (
              <div className="verif-inline-picker">
                <select
                  className="verif-select"
                  value={selectedStation.id}
                  onChange={(e) => {
                    const found = CAMPUS_WASTE_STATIONS.find((s) => s.id === e.target.value);
                    if (found) {
                      setSelectedStation(found);
                      setShowStationPicker(false);
                    }
                  }}
                >
                  {CAMPUS_WASTE_STATIONS.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.title}
                    </option>
                  ))}
                </select>
                {!simulation && (
                  <button
                    type="button"
                    className="verif-relocate-btn"
                    onClick={handleLocate}
                    disabled={isLocating}
                  >
                    <Icon name="locate" size={14} />
                    <span>{isLocating ? 'Taranıyor...' : 'GPS Yenile'}</span>
                  </button>
                )}
              </div>
            )}

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
                      triggerHaptic('light');
                      setSelectedStream(streamKey);
                      setAiError(null);
                      setRejectedFrames([]);
                    }}
                  >
                    <span
                      className="verif-stream-dot"
                      style={{ backgroundColor: meta.color }}
                    />
                    <strong className="verif-stream-short">
                      {SHORT_STREAM_NAMES[streamKey]}
                    </strong>
                  </button>
                );
              })}
            </div>

            <MotionClipRecorder
              streamMeta={activeStreamMeta}
              simulationMode={simulation}
              isVerifying={isSubmitting}
              disabledReason={disabledReason}
              onClipReady={(proof) => void handleClipReady(proof)}
            />

            {aiError && (
              <div className="verif-ai-alert error" role="alert">
                <div className="verif-ai-alert-icon">
                  <Icon name="close" size={15} />
                </div>
                <div className="verif-ai-alert-text">
                  <strong>Doğrulama Reddedildi</strong>
                  <p>{aiError}</p>
                </div>
              </div>
            )}

            {rejectedFrames.length > 0 && (
              <div className="clip-storyboard">
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
          </div>
        ) : (
          <div className="verif-success-content">
            <div className="verif-success-icon-wrap">
              <Icon name="shield-check" size={34} />
            </div>
            <h2>Ayrıştırma Onaylandı</h2>
            <p>
              {selectedStation.title} · {WASTE_STREAM_META[selectedStream].bagLabel}
            </p>

            <div className="verif-reward-pill">
              <Icon name="star" size={20} />
              <div>
                <strong>+1 Yeşil Yıldız</strong>
                <small>Bakiye: {wallet.stars} Yıldız</small>
              </div>
            </div>

            {verifiedTelemetry && (
              <div className="clip-privacy-receipt">
                <Icon name="shield-check" size={15} />
                <span>
                  {(verifiedTelemetry.durationMs / 1000).toFixed(1)} sn · ~
                  {verifiedTelemetry.estimatedSizeKb} KB · Bellekten silindi
                </span>
              </div>
            )}

            <button
              type="button"
              className="verif-primary-btn"
              onClick={handleDismissModal}
            >
              Tamam
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
