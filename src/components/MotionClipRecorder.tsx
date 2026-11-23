import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { DisposalMotionProof, WasteStreamMeta } from '../types';
import {
  buildMotionProof,
  captureFrameFromVideo,
  CLIP_MAX_DURATION_MS,
  CLIP_MIN_DURATION_MS,
  extractFramesFromVideoFile,
  generateSimulatedMotionProof,
  isLiveCameraSupported,
  requestLowResSilentCamera,
  stopCameraStream,
  type CapturedMotionFrame
} from '../services/motionClipService';
import { Icon } from './Icon';

interface MotionClipRecorderProps {
  streamMeta: WasteStreamMeta;
  simulationMode: boolean;
  isVerifying: boolean;
  onClipReady: (proof: DisposalMotionProof) => void;
}

type CameraStatus = 'initializing' | 'ready' | 'unavailable';

const RING_RADIUS = 31;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const AUTO_RECORD_DURATION_MS = 2600;

export const MotionClipRecorder: React.FC<MotionClipRecorderProps> = ({
  streamMeta,
  simulationMode,
  isVerifying,
  onClipReady
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement | null>(null);

  const rafRef = useRef<number | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const isAutoModeRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(0);
  const capturedFramesRef = useRef<CapturedMotionFrame[]>([]);
  const nextCaptureIdxRef = useRef<number>(0);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('initializing');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAutoRecording, setIsAutoRecording] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [statusHint, setStatusHint] = useState<string | null>(null);
  const [isExtractingFile, setIsExtractingFile] = useState<boolean>(false);

  const cancelAnimationLoop = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCameraStream(mediaStreamRef.current);
    mediaStreamRef.current = null;

    if (!isLiveCameraSupported()) {
      setCameraStatus('unavailable');
      return;
    }

    setCameraStatus('initializing');
    try {
      const stream = await requestLowResSilentCamera();
      mediaStreamRef.current = stream;
      setCameraStatus('ready');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      setCameraStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    let active = true;

    const init = async () => {
      if (!isLiveCameraSupported()) {
        if (active) setCameraStatus('unavailable');
        return;
      }

      try {
        const stream = await requestLowResSilentCamera();
        if (!active) {
          stopCameraStream(stream);
          return;
        }
        mediaStreamRef.current = stream;
        setCameraStatus('ready');
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        if (active) setCameraStatus('unavailable');
      }
    };

    void init();

    return () => {
      active = false;
      cancelAnimationLoop();
      isRecordingRef.current = false;
      stopCameraStream(mediaStreamRef.current);
      mediaStreamRef.current = null;
    };
  }, [cancelAnimationLoop]);

  useEffect(() => {
    if (cameraStatus === 'ready' && videoRef.current && mediaStreamRef.current) {
      if (videoRef.current.srcObject !== mediaStreamRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
        void videoRef.current.play().catch(() => {});
      }
    }
  }, [cameraStatus]);

  const finalizeRecording = useCallback(
    (finalDurationMs: number) => {
      cancelAnimationLoop();
      isRecordingRef.current = false;
      isAutoModeRef.current = false;
      setIsRecording(false);
      setIsAutoRecording(false);
      setProgress(0);
      setElapsedMs(0);

      if (finalDurationMs < CLIP_MIN_DURATION_MS) {
        setStatusHint(
          'Doğrulama için en az 1.5 sn kayıt alın veya Otomatik 3 sn Kayıt seçeneğini kullanın.'
        );
        return;
      }

      setStatusHint(null);

      if (cameraStatus === 'ready' && videoRef.current) {
        const finalFrame = captureFrameFromVideo(videoRef.current);
        if (finalFrame) {
          if (capturedFramesRef.current.length >= 3) {
            capturedFramesRef.current[2] = finalFrame;
          } else {
            capturedFramesRef.current.push(finalFrame);
          }
        }

        if (capturedFramesRef.current.length > 0) {
          const proof = buildMotionProof(
            capturedFramesRef.current,
            finalDurationMs,
            'live_motion_clip'
          );
          capturedFramesRef.current = [];
          onClipReady(proof);
          return;
        }
      }

      if (simulationMode) {
        const simulated = generateSimulatedMotionProof(
          streamMeta.label,
          streamMeta.bagLabel,
          streamMeta.color,
          finalDurationMs
        );
        onClipReady(simulated);
      } else {
        setStatusHint('Kamera akışı okunamadı. Alttan cihaz kamerası ile video seçebilirsiniz.');
      }
    },
    [cancelAnimationLoop, cameraStatus, onClipReady, simulationMode, streamMeta]
  );

  const beginRecording = useCallback(
    (autoMode: boolean) => {
      if (isVerifying || isExtractingFile || isRecordingRef.current) return;
      if (cameraStatus !== 'ready' && !simulationMode) {
        setStatusHint('Canlı kamera kullanılamıyor. Alttan cihaz kamerasıyla kayıt alabilirsiniz.');
        return;
      }

      setStatusHint(null);
      isRecordingRef.current = true;
      isAutoModeRef.current = autoMode;
      startTimeRef.current = performance.now();
      capturedFramesRef.current = [];
      nextCaptureIdxRef.current = 0;

      setIsRecording(true);
      setIsAutoRecording(autoMode);
      setProgress(0);
      setElapsedMs(0);

      const targetMaxMs = autoMode ? AUTO_RECORD_DURATION_MS : CLIP_MAX_DURATION_MS;
      const captureMarksMs = [250, 1150, 2100];

      const tick = (now: number) => {
        if (!isRecordingRef.current) return;

        const elapsed = now - startTimeRef.current;
        const pct = Math.min(1, elapsed / targetMaxMs);
        setElapsedMs(elapsed);
        setProgress(pct);

        if (
          cameraStatus === 'ready' &&
          videoRef.current &&
          nextCaptureIdxRef.current < captureMarksMs.length &&
          elapsed >= captureMarksMs[nextCaptureIdxRef.current]
        ) {
          const snap = captureFrameFromVideo(videoRef.current);
          if (snap) {
            capturedFramesRef.current.push(snap);
          }
          nextCaptureIdxRef.current += 1;
        }

        if (elapsed >= targetMaxMs) {
          finalizeRecording(targetMaxMs);
          return;
        }

        rafRef.current = window.requestAnimationFrame(tick);
      };

      rafRef.current = window.requestAnimationFrame(tick);
    },
    [cameraStatus, finalizeRecording, isExtractingFile, isVerifying, simulationMode]
  );

  const handleHoldStart = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isAutoModeRef.current) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    beginRecording(false);
  };

  const handleHoldEnd = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}
    if (!isRecordingRef.current || isAutoModeRef.current) return;
    const elapsed = performance.now() - startTimeRef.current;
    finalizeRecording(elapsed);
  };

  const handleFallbackVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsExtractingFile(true);
    setStatusHint(null);
    try {
      const proof = await extractFramesFromVideoFile(file);
      onClipReady(proof);
    } catch {
      setStatusHint('Video okunamadı. Lütfen 2-3 saniyelik kısa bir kayıt deneyin.');
    } finally {
      setIsExtractingFile(false);
    }
  };

  const getPhaseLabel = (): string => {
    if (!isRecording) return 'Hazır · Kutu bölmesini kadraja alın';
    if (elapsedMs < 950) return '1/3 · Başlangıç';
    if (elapsedMs < 1900) return '2/3 · Bırakma Anı';
    return '3/3 · Doğrulama';
  };

  const strokeOffset = RING_CIRCUMFERENCE * (1 - progress);
  const canUseShutter = cameraStatus === 'ready' || simulationMode;

  return (
    <div className="clip-recorder">
      <div className="clip-viewport">
        {cameraStatus === 'ready' ? (
          <video
            ref={videoRef}
            className="clip-video-feed"
            playsInline
            muted
            autoPlay
          />
        ) : (
          <div className="clip-placeholder-feed">
            <div className="clip-placeholder-icon">
              <Icon name="video" size={26} />
            </div>
            {cameraStatus === 'initializing' ? (
              <>
                <strong>Canlı 360p kamera açılıyor...</strong>
                <small>Sessiz ve düşük veri modunda hazırlanıyor</small>
              </>
            ) : simulationMode ? (
              <>
                <strong>Test Vizörü Hazır</strong>
                <small>
                  Kamera izni olmadan 3 saniyelik hareket doğrulamasını deneyebilirsiniz.
                </small>
              </>
            ) : (
              <>
                <strong>Canlı Kamera Erişilemedi</strong>
                <small>Tarayıcı kamera izni kapalı veya cihazda kamera bulunamadı</small>
                <button
                  type="button"
                  className="clip-retry-cam-btn"
                  onClick={() => void startCamera()}
                >
                  Kamerayı Tekrar Dene
                </button>
              </>
            )}
          </div>
        )}

        <div className="clip-hud-top">
          <span className={`clip-hud-pill ${isRecording ? 'recording' : ''}`}>
            <i className={`clip-rec-dot ${isRecording ? 'pulse' : ''}`} />
            {isRecording
              ? `KAYIT · ${(elapsedMs / 1000).toFixed(1)} sn`
              : '360p · SESSİZ'}
          </span>
          <span className="clip-hud-pill privacy">
            <Icon name="shield-check" size={12} />
            <span>SUNUCUDA SAKLANMAZ</span>
          </span>
        </div>

        <div className="clip-hud-bottom">
          <div className="clip-target-chip">
            <span
              className="clip-target-dot"
              style={{ backgroundColor: streamMeta.color }}
            />
            <span>
              {streamMeta.bagLabel} · {streamMeta.label}
            </span>
          </div>
          <span className="clip-phase-label">{getPhaseLabel()}</span>
        </div>

        {(isVerifying || isExtractingFile) && (
          <div className="clip-analyzing-overlay">
            <div className="clip-spinner" />
            <strong>
              {isExtractingFile
                ? '360p kareler çıkarılıyor...'
                : '3 kare hareket kanıtı AI ile doğrulanıyor...'}
            </strong>
            <small>Doğrulama bitince kayıt cihaz belleğinden anında silinir</small>
          </div>
        )}
      </div>

      <div className="clip-controls-bar">
        <div className="clip-shutter-wrap">
          <button
            type="button"
            className={`clip-shutter-btn ${isRecording ? 'recording' : ''}`}
            disabled={!canUseShutter || isVerifying || isExtractingFile}
            onPointerDown={handleHoldStart}
            onPointerUp={handleHoldEnd}
            onPointerCancel={handleHoldEnd}
            onContextMenu={(e) => e.preventDefault()}
            aria-label="Basılı tutarak 3 saniyelik doğrulama kaydı al"
          >
            <svg className="clip-ring-svg" viewBox="0 0 72 72" aria-hidden="true">
              <circle
                className="clip-ring-track"
                cx="36"
                cy="36"
                r={RING_RADIUS}
              />
              <circle
                className="clip-ring-progress"
                cx="36"
                cy="36"
                r={RING_RADIUS}
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={strokeOffset}
              />
            </svg>
            <span className="clip-shutter-core" />
          </button>
          <div className="clip-shutter-caption">
            <strong>
              {isRecording
                ? isAutoRecording
                  ? 'Otomatik kayıt sürüyor...'
                  : 'Kaydediliyor, atığı bırakın...'
                : 'Basılı Tut ve Kaydet'}
            </strong>
            <small>2-3 sn kayıt sonunda otomatik doğrulanır.</small>
          </div>
        </div>

        <div className="clip-alt-actions">
          <button
            type="button"
            className="clip-alt-btn clip-alt-btn-accent"
            disabled={!canUseShutter || isRecording || isVerifying || isExtractingFile}
            onClick={() => beginRecording(true)}
          >
            <Icon name="timer" size={14} />
            <span>Otomatik 3 sn Kayıt</span>
          </button>

          <button
            type="button"
            className="clip-alt-btn"
            disabled={isRecording || isVerifying || isExtractingFile}
            onClick={() => fallbackInputRef.current?.click()}
          >
            <Icon name="video" size={14} />
            <span>Video Yükle</span>
          </button>
        </div>

        <input
          ref={fallbackInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => void handleFallbackVideoChange(e)}
        />
      </div>

      {statusHint && <p className="clip-status-hint">{statusHint}</p>}
    </div>
  );
};
