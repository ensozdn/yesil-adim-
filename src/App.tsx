import React, { useState, useEffect, useRef } from 'react';
import type {
  NavigationTab,
  WalletState,
  WasteBinType,
  ChatMessage,
  RewardTier
} from './types';
import { Icon } from './components/Icon';
import { ImpactCard } from './components/ImpactCard';
import { RewardModal } from './components/RewardModal';
import { QrScannerModal } from './components/QrScannerModal';
import { analyzeWasteInput } from './services/wasteAiService';
import { calculateEcoImpact } from './services/impactService';
import { checkScanEligibility } from './services/cooldownService';
import './styles.css';

const STORAGE_KEY = 'green-step-wallet-v1';

const BIN_LABELS: Record<WasteBinType, string> = {
  paper: 'Kâğıt ve Karton Kutusu',
  plastic: 'Plastik Ambalaj Kutusu',
  glass: 'Cam Atık Kutusu',
  battery: 'Atık Pil Noktası',
  general: 'Kampüs Geri Dönüşüm Noktası'
};

const REWARD_TIERS: RewardTier[] = [
  { id: 'coffee-5', stars: 5, title: 'Kampüs Sıcak İçecek', desc: 'Anlaşmalı kampüs kafelerinde 1 çay veya filtre kahve.' },
  { id: 'meal-12', stars: 12, title: 'Yemekhane Menü İndirimi', desc: 'SAÜ yemekhanesinde veya kantinlerinde tabldot menü indirimi.' },
  { id: 'weekly-20', stars: 20, title: 'Haftalık Yıldız Şampiyonu', desc: '1 sandviç + büyük boy kahve ikramı ve dijital başarı rozeti.' }
];

const getInitialState = (): WalletState => ({
  stars: 2,
  lifetimeStars: 2,
  streak: 1,
  lastScanDate: null,
  history: [
    {
      id: 'init-1',
      binType: 'plastic',
      label: 'Plastik Ambalaj Kutusu',
      timestamp: 'Bugün · 10:15',
      createdAtMs: Date.now() - 3600000,
      starsEarned: 1
    },
    {
      id: 'init-2',
      binType: 'paper',
      label: 'Kâğıt ve Karton Kutusu',
      timestamp: 'Dün · 14:40',
      createdAtMs: Date.now() - 86400000,
      starsEarned: 1
    }
  ],
  redeemedRewards: [],
  profile: {
    studentId: '',
    fullName: '',
    department: 'Finans ve Ekonomi',
    isLoggedIn: false
  },
  apiKey: '',
  geofenceEnabled: false
});

export const App: React.FC = () => {
  const [wallet, setWallet] = useState<WalletState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...getInitialState(), ...JSON.parse(saved) } : getInitialState();
    } catch {
      return getInitialState();
    }
  });

  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [scanToast, setScanToast] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [activeVoucherReward, setActiveVoucherReward] = useState<RewardTier | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: 'Merhaba! Hangi atığı hangi kutuya atacağından emin değilsen fotoğrafını yükleyebilir veya doğrudan bana sorabilirsin. Örneğin: "Yağlı pizza kutusunu nereye atmalıyım?"',
      recommendedBin: 'AI Atık Asistanı Hazır',
      timestamp: 'Şimdi'
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [studentIdInput, setStudentIdInput] = useState<string>(wallet.profile.studentId);
  const [fullNameInput, setFullNameInput] = useState<string>(wallet.profile.fullName);
  const [departmentInput, setDepartmentInput] = useState<string>(wallet.profile.department);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
    } catch {
    }
  }, [wallet]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scannedBin = (params.get('scan') || params.get('task')) as WasteBinType | null;
    if (scannedBin) {
      const validBin: WasteBinType = BIN_LABELS[scannedBin] ? scannedBin : 'general';
      registerQrScan(validBin);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const getLevelData = (lifetimeStars: number) => {
    if (lifetimeStars >= 20) return { level: 4, name: 'Yeşil Öncü', nextTarget: 30 };
    if (lifetimeStars >= 10) return { level: 3, name: 'Kampüs Koruyucusu', nextTarget: 20 };
    if (lifetimeStars >= 5) return { level: 2, name: 'Doğa Dostu', nextTarget: 10 };
    return { level: 1, name: 'Yeşil Başlangıç', nextTarget: 5 };
  };

  const registerQrScan = (binType: WasteBinType) => {
    const eligibility = checkScanEligibility(
      binType,
      wallet.history,
      wallet.geofenceEnabled,
      userLocation
    );

    if (!eligibility.canScan) {
      setScanToast(eligibility.reason || 'Bu kutu şu anda okutulamaz.');
      setTimeout(() => setScanToast(null), 4500);
      return;
    }

    const now = new Date();
    const timeLabel = `Bugün · ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayIso = now.toISOString().split('T')[0];

    setWallet((prev) => {
      const isNewDay = prev.lastScanDate !== todayIso;
      const newRecord = {
        id: `scan-${Date.now()}`,
        binType,
        label: BIN_LABELS[binType],
        timestamp: timeLabel,
        createdAtMs: Date.now(),
        starsEarned: 1
      };
      return {
        ...prev,
        stars: prev.stars + 1,
        lifetimeStars: prev.lifetimeStars + 1,
        streak: isNewDay ? prev.streak + 1 : prev.streak,
        lastScanDate: todayIso,
        history: [newRecord, ...prev.history.slice(0, 19)]
      };
    });

    setShowQrModal(false);
    setScanToast(`${BIN_LABELS[binType]} okutuldu · +1 Yıldız eklendi`);
    setTimeout(() => setScanToast(null), 3800);
  };

  const handleRedeemReward = (rewardId: string, cost: number, title: string) => {
    if (wallet.stars < cost) return;
    setWallet((prev) => ({
      ...prev,
      stars: prev.stars - cost,
      redeemedRewards: [...prev.redeemedRewards, rewardId]
    }));
    setScanToast(`${title} için yıldızların kullanıldı`);
    setTimeout(() => setScanToast(null), 3500);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (presetPrompt?: string) => {
    const textToSend = presetPrompt !== undefined ? presetPrompt : inputText.trim();
    if (!textToSend && !selectedImage) return;

    const currentImage = selectedImage;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend || 'Yüklenen atık fotoğrafı',
      imageUrl: currentImage || undefined,
      timestamp: 'Şimdi'
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setSelectedImage(null);
    setIsAnalyzing(true);

    const analysis = await analyzeWasteInput(textToSend, currentImage, wallet.apiKey);

    const assistantMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'assistant',
      text: analysis.reply,
      recommendedBin: analysis.recommendedBin,
      timestamp: 'Şimdi'
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsAnalyzing(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdInput.trim() || !fullNameInput.trim()) return;
    setWallet((prev) => ({
      ...prev,
      profile: {
        studentId: studentIdInput.trim(),
        fullName: fullNameInput.trim(),
        department: departmentInput.trim() || 'Sakarya Üniversitesi',
        isLoggedIn: true
      }
    }));
    setScanToast('Öğrenci profili bu cihaza bağlandı');
    setTimeout(() => setScanToast(null), 3000);
  };

  const handleLogout = () => {
    setWallet((prev) => ({
      ...prev,
      profile: {
        studentId: '',
        fullName: '',
        department: 'Finans ve Ekonomi',
        isLoggedIn: false
      }
    }));
  };

  const handleToggleGeofence = (enabled: boolean) => {
    setWallet((prev) => ({ ...prev, geofenceEnabled: enabled }));
    if (enabled && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {
          setScanToast('Konum izni alınamadı. Geofence simülasyonu devrede.');
          setTimeout(() => setScanToast(null), 3500);
        }
      );
    }
  };

  const levelInfo = getLevelData(wallet.lifetimeStars);
  const ecoImpact = calculateEcoImpact(wallet.lifetimeStars, wallet.history);
  const weeklyRewardTarget = 20;
  const starProgressPercent = Math.min(100, (wallet.stars / weeklyRewardTarget) * 100);

  return (
    <main className="app">
      <header className="top">
        <div className="brand">
          <div className="brandmark">
            <Icon name="leaf" />
          </div>
          <span>yeşil adım</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="pill" aria-label="Yıldız bakiyesi">
            <Icon name="star" className="ico sm star-accent" size={17} />
            <span>{wallet.stars} Yıldız</span>
          </div>
          <button
            className="pill"
            onClick={() => setActiveTab('profile')}
            aria-label="Öğrenci profili"
          >
            <Icon name="user" className="ico sm" size={17} />
            <span>{wallet.profile.isLoggedIn ? wallet.profile.fullName.split(' ')[0] : 'Giriş'}</span>
          </button>
        </div>
      </header>

      {scanToast && (
        <div className="toast-banner" role="status">
          <Icon name="check" size={18} />
          <span>{scanToast}</span>
        </div>
      )}

      {activeTab === 'home' && (
        <section className="view active">
          <div className="eyebrow">SAKARYA ÜNİVERSİTESİ · SÜRDÜRÜLEBİLİR KAMPÜS</div>
          <h1>
            Her geri dönüşüm
            <br />
            bir yıldız kazandırır.
          </h1>
          <p>
            Kampüsteki kutuların üzerindeki QR kodu okut, yıldız bakiyeni artır ve hangi atığı nereye atacağını AI asistana sor.
          </p>

          <div className="hero">
            <span className="tag">YILDIZ CÜZDANI</span>
            <div className="star-balance-row">
              <span className="star-big-num">{wallet.stars}</span>
              <Icon name="star" size={32} className="star-gold" />
              <span className="star-target-text">/ {weeklyRewardTarget} Haftalık Hedef</span>
            </div>
            <h2>Atığını ayrıştır, QR okut ve haftalık ödülünü topla.</h2>
            <p>
              Haftada 20 yıldıza ulaştığında kampüs kahvesi veya yemekhane indirim kuponu kazanırsın.
            </p>
            <div className="hero-progress-track">
              <div
                className="hero-progress-fill"
                style={{ width: `${starProgressPercent}%` }}
              />
            </div>
            <div className="hero-art">
              <svg
                className="ico"
                style={{ width: 72, height: 72 }}
                viewBox="0 0 64 64"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M51 8C31 7 15 16 13 32c-1 9 6 16 15 14C44 43 51 26 51 8Z" />
                <path d="M8 56c9-15 20-25 34-35" />
                <path d="m26 38-1-11m10 1 10 1" />
              </svg>
            </div>
          </div>

          <div className="action-grid">
            <button className="primary" onClick={() => setShowQrModal(true)}>
              <Icon name="qr" size={20} />
              <span>QR Okut (+1 Yıldız)</span>
            </button>
            <button className="secondary" onClick={() => setActiveTab('assistant')}>
              <Icon name="chat" size={20} />
              <span>AI Atık Asistanına Sor</span>
            </button>
          </div>

          <ImpactCard impact={ecoImpact} />

          <div className="sectionhead">
            <strong>Seviye ve Ödül Durumu</strong>
            <span className="small">Seviye {levelInfo.level}</span>
          </div>
          <div className="panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <strong>{levelInfo.name}</strong>
                <div className="small" style={{ marginTop: 4 }}>
                  Toplam {wallet.lifetimeStars} Yıldız · {wallet.streak} günlük seri
                </div>
              </div>
              <div className="taskicon">
                <Icon name="spark" />
              </div>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, (wallet.lifetimeStars / levelInfo.nextTarget) * 100)}%`
                }}
              />
            </div>
            <div className="small">
              Sonraki seviyeye {Math.max(0, levelInfo.nextTarget - wallet.lifetimeStars)} yıldız kaldı
            </div>
          </div>

          <div className="sectionhead">
            <strong>Yıldız Ödülleri</strong>
            <span className="small">Kampüs Ayrıcalıkları</span>
          </div>
          <div className="task-list">
            {REWARD_TIERS.map((reward) => {
              const canRedeem = wallet.stars >= reward.stars;
              return (
                <div key={reward.id} className="taskrow">
                  <div className="taskicon">
                    <Icon name="coffee" />
                  </div>
                  <div className="taskmeta">
                    <strong>{reward.title}</strong>
                    <span>{reward.desc}</span>
                  </div>
                  <button
                    className={`reward-btn ${canRedeem ? 'ready' : ''}`}
                    disabled={!canRedeem}
                    onClick={() => setActiveVoucherReward(reward)}
                  >
                    {canRedeem ? 'Kupon Aç' : `${reward.stars} Yıldız`}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === 'assistant' && (
        <section className="view active">
          <div className="eyebrow">YAPAY ZEKÂ DESTEKLİ AYRIŞTIRMA</div>
          <h1>
            Hangi kutuya
            <br />
            atmalıyım?
          </h1>
          <p>
            Atığın fotoğrafını çek veya adını yaz; AI asistanımız kampüs kurallarına göre hangi geri dönüşüm kutusuna atman gerektiğini anında söylesin.
          </p>

          <div className="quick-chips">
            <button
              className="chip"
              onClick={() => handleSendMessage('Yağlı bir pizza kutusu atacağım, hangi çöpe atmam lazım?')}
            >
              Yağlı pizza kutusu
            </button>
            <button
              className="chip"
              onClick={() => handleSendMessage('Karton kahve bardağı hangi kutuya atılır?')}
            >
              Karton kahve bardağı
            </button>
            <button
              className="chip"
              onClick={() => handleSendMessage('Bitmiş kalem pil nereye bırakılır?')}
            >
              Bitmiş kalem pil
            </button>
          </div>

          <div className="chat-container">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="Yüklenen atık" className="chat-uploaded-img" />
                )}
                {msg.recommendedBin && (
                  <div className="bin-badge">
                    <Icon name="recycle" size={15} />
                    <span>{msg.recommendedBin}</span>
                  </div>
                )}
                <p className="chat-text">{msg.text}</p>
              </div>
            ))}
            {isAnalyzing && (
              <div className="chat-bubble assistant">
                <p className="chat-text">Atık türü ve kampüs kutu uygunluğu inceleniyor...</p>
              </div>
            )}
          </div>

          {selectedImage && (
            <div className="image-preview-bar">
              <img src={selectedImage} alt="Önizleme" />
              <span>Fotoğraf analize hazır</span>
              <button
                className="remove-img-btn"
                onClick={() => setSelectedImage(null)}
                aria-label="Fotoğrafı kaldır"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          )}

          <div className="chat-input-row">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <button
              className="icon-action-btn"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Fotoğraf yükle veya çek"
            >
              <Icon name="camera" size={22} />
            </button>
            <input
              type="text"
              className="chat-text-input"
              placeholder="Örn: Pizza kutusu hangi çöpe gider?"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
            />
            <button
              className="icon-action-btn send"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() && !selectedImage}
              aria-label="Gönder"
            >
              <Icon name="send" size={20} />
            </button>
          </div>
        </section>
      )}

      {activeTab === 'profile' && (
        <section className="view active">
          <div className="eyebrow">KAMPÜS KİMLİĞİ VE CÜZDAN</div>
          <h1>
            Öğrenci profilin
            <br />
            ve ayarlar.
          </h1>
          <p>
            QR kod okuttuğunda yıldızlarının kaybolmaması için öğrenci numaranla hızlı eşleştirme yapabilirsin.
          </p>

          {wallet.profile.isLoggedIn ? (
            <div className="panel" style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="taskicon">
                  <Icon name="user" />
                </div>
                <div style={{ flex: 1 }}>
                  <strong>{wallet.profile.fullName}</strong>
                  <div className="small">
                    {wallet.profile.studentId} · {wallet.profile.department}
                  </div>
                </div>
                <button className="back" onClick={handleLogout} aria-label="Çıkış yap">
                  <Icon name="logout" size={18} />
                </button>
              </div>
              <div className="stats" style={{ marginTop: 16 }}>
                <div className="stat">
                  <div className="num">{wallet.stars}</div>
                  <div className="label">Mevcut Yıldız</div>
                </div>
                <div className="stat">
                  <div className="num">{wallet.lifetimeStars}</div>
                  <div className="label">Toplam Kazanılan</div>
                </div>
              </div>
            </div>
          ) : (
            <form className="panel login-form" onSubmit={handleSaveProfile} style={{ marginTop: 20 }}>
              <strong>Hızlı Öğrenci Girişi</strong>
              <p className="small" style={{ marginTop: 4, marginBottom: 14 }}>
                Şifre gerektirmez; cüzdanını bu tarayıcıda öğrenci numarana bağlar.
              </p>
              <label className="form-label">
                Öğrenci Numarası
                <input
                  type="text"
                  className="form-input"
                  placeholder="Örn: B231200001"
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  required
                />
              </label>
              <label className="form-label">
                Ad Soyad
                <input
                  type="text"
                  className="form-input"
                  placeholder="Örn: Enes Özden"
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  required
                />
              </label>
              <label className="form-label">
                Bölüm / Fakülte
                <input
                  type="text"
                  className="form-input"
                  placeholder="Örn: Finans ve Ekonomi"
                  value={departmentInput}
                  onChange={(e) => setDepartmentInput(e.target.value)}
                />
              </label>
              <button type="submit" className="primary green" style={{ marginTop: 8 }}>
                Cüzdanı Eşleştir
              </button>
            </form>
          )}

          <div className="panel" style={{ marginTop: 16 }}>
            <div className="toggle-row">
              <div>
                <strong>SAÜ Esentepe Kampüs Doğrulaması</strong>
                <p className="small" style={{ marginTop: 4 }}>
                  Evden okutmayı önlemek için GPS konumunu SAÜ kampüsüyle doğrular. Test veya sunum amaçlı kapatılabilir.
                </p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={wallet.geofenceEnabled}
                  onChange={(e) => handleToggleGeofence(e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>
          </div>

          <div className="panel" style={{ marginTop: 16 }}>
            <strong>Google AI Studio (Gemini) Anahtarı (İsteğe Bağlı)</strong>
            <p className="small" style={{ marginTop: 4, marginBottom: 10 }}>
              Canlı görsel analizi için Gemini API anahtarı girebilirsin. Boş bırakılırsa yerleşik akıllı kampüs asistanı yanıt verir.
            </p>
            <input
              type="password"
              className="form-input"
              placeholder="AIzaSy..."
              value={wallet.apiKey}
              onChange={(e) =>
                setWallet((prev) => ({ ...prev, apiKey: e.target.value }))
              }
            />
          </div>

          <div className="note">
            QR kod bağlantısı testi için adresin sonuna <strong>?scan=plastic</strong>, <strong>?scan=paper</strong> veya <strong>?scan=battery</strong> ekleyerek doğrudan yıldız kazanımını deneyimleyebilirsin.
          </div>
        </section>
      )}

      <QrScannerModal
        isOpen={showQrModal}
        history={wallet.history}
        onClose={() => setShowQrModal(false)}
        onScanSuccess={registerQrScan}
      />

      {activeVoucherReward && (
        <RewardModal
          reward={activeVoucherReward}
          onClose={() => setActiveVoucherReward(null)}
          onConfirmRedeem={handleRedeemReward}
        />
      )}

      <nav className="bottomnav" aria-label="Ana gezinme">
        <button
          className={`navbtn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <Icon name="home" />
          <span>Yıldızlarım</span>
        </button>
        <button
          className={`navbtn ${activeTab === 'assistant' ? 'active' : ''}`}
          onClick={() => setActiveTab('assistant')}
        >
          <Icon name="chat" />
          <span>AI Asistan</span>
        </button>
        <button
          className={`navbtn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <Icon name="user" />
          <span>Profil</span>
        </button>
      </nav>
    </main>
  );
};

export default App;
