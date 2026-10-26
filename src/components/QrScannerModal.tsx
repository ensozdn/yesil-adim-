import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import type { WasteBinType, IconName } from '../types';
import { Icon } from './Icon';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (binType: WasteBinType) => void;
}

interface PresentationCard {
  binType: WasteBinType;
  title: string;
  colorName: string;
  url: string;
  icon: IconName;
}

const PRESENTATION_BINS: PresentationCard[] = [
  { binType: 'plastic', title: 'Plastik Ambalaj', colorName: 'Sarı Kutu', url: '?scan=plastic', icon: 'plastic' },
  { binType: 'paper', title: 'Kâğıt & Karton', colorName: 'Mavi Kutu', url: '?scan=paper', icon: 'paper' },
  { binType: 'glass', title: 'Cam Şişe & Atık', colorName: 'Yeşil Kutu', url: '?scan=glass', icon: 'glass' },
  { binType: 'battery', title: 'Atık Pil & E-Atık', colorName: 'Kırmızı Kutu', url: '?scan=battery', icon: 'battery' }
];

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'cards' | 'quick'>('camera');
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const base = window.location.origin + window.location.pathname;
    const generateAll = async () => {
      const generated: Record<string, string> = {};
      for (const item of PRESENTATION_BINS) {
        try {
          const dataUrl = await QRCode.toDataURL(`${base}${item.url}`, {
            margin: 1,
            width: 220,
            color: {
              dark: '#1c2a21',
              light: '#ffffff'
            }
          });
          generated[item.binType] = dataUrl;
        } catch {
        }
      }
      setQrImages(generated);
    };

    generateAll();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Bu cihazda veya tarayıcıda kamera erişimi desteklenmiyor.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch {
      setCameraError('Kamera izni verilmedi veya kamera bulunamadı. Sunum Kartları sekmesini kullanarak test edebilirsiniz.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleSelectBin = (binType: WasteBinType) => {
    stopCamera();
    onScanSuccess(binType);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet qr-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sectionhead" style={{ marginTop: 0 }}>
          <strong>Kampüs QR Tarayıcı</strong>
          <button className="back" onClick={onClose} aria-label="Kapat">
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="qr-tabs">
          <button
            className={`qr-tab-btn ${activeTab === 'camera' ? 'active' : ''}`}
            onClick={() => setActiveTab('camera')}
          >
            <Icon name="camera" size={16} />
            <span>Kamera ile Tara</span>
          </button>
          <button
            className={`qr-tab-btn ${activeTab === 'cards' ? 'active' : ''}`}
            onClick={() => setActiveTab('cards')}
          >
            <Icon name="qr" size={16} />
            <span>Sunum Kartları</span>
          </button>
          <button
            className={`qr-tab-btn ${activeTab === 'quick' ? 'active' : ''}`}
            onClick={() => setActiveTab('quick')}
          >
            <Icon name="recycle" size={16} />
            <span>Hızlı Seçim</span>
          </button>
        </div>

        {activeTab === 'camera' && (
          <div className="camera-viewfinder-box">
            {cameraError ? (
              <div className="camera-fallback">
                <Icon name="camera" size={32} />
                <p>{cameraError}</p>
                <button
                  className="primary green"
                  style={{ marginTop: 10 }}
                  onClick={() => setActiveTab('cards')}
                >
                  Sunum Kartlarını Göster
                </button>
              </div>
            ) : (
              <div className="video-wrapper">
                <video
                  ref={videoRef}
                  className="scanner-video"
                  playsInline
                  muted
                />
                <div className="reticle">
                  <div className="reticle-corner top-left" />
                  <div className="reticle-corner top-right" />
                  <div className="reticle-corner bottom-left" />
                  <div className="reticle-corner bottom-right" />
                  <div className="laser-line" />
                </div>
                <div className="scanner-hint">
                  Kutu üzerindeki QR kodu çerçeveye hizalayın
                </div>
              </div>
            )}

            <div className="camera-quick-bar">
              <span className="small">Kamerayla okutulacak atık türü simülasyonu:</span>
              <div className="mini-chips">
                {PRESENTATION_BINS.map((item) => (
                  <button
                    key={item.binType}
                    className="chip"
                    onClick={() => handleSelectBin(item.binType)}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cards' && (
          <div className="cards-tab-content">
            <p className="small" style={{ marginBottom: 12 }}>
              Sunum esnasında telefon kameranızı bu ekrandaki QR kodlara doğrultarak gerçek QR okuma deneyimini yaşayabilirsiniz. Dilerseniz karta tıklayarak da doğrudan okutabilirsiniz.
            </p>
            <div className="presentation-grid">
              {PRESENTATION_BINS.map((item) => (
                <div
                  key={item.binType}
                  className="presentation-qr-card"
                  onClick={() => handleSelectBin(item.binType)}
                >
                  {qrImages[item.binType] ? (
                    <img
                      src={qrImages[item.binType]}
                      alt={item.title}
                      className="qr-img"
                    />
                  ) : (
                    <div className="qr-loading">Yükleniyor...</div>
                  )}
                  <strong>{item.title}</strong>
                  <span className="bin-color-tag">{item.colorName}</span>
                  <span className="card-xp-badge">+1 Yıldız</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'quick' && (
          <div className="task-list" style={{ marginTop: 10 }}>
            {PRESENTATION_BINS.map((item) => (
              <button
                key={item.binType}
                className="taskrow"
                onClick={() => handleSelectBin(item.binType)}
              >
                <div className="taskicon">
                  <Icon name={item.icon} />
                </div>
                <div className="taskmeta">
                  <strong>{item.title}</strong>
                  <span>{item.colorName} · Anında okutma</span>
                </div>
                <span className="taskxp">+1 Yıldız</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QrScannerModal;
