import React, { useState, useEffect, useRef } from 'react';
import type {
  NavigationTab,
  WalletState,
  ChatMessage,
  RewardTier,
  CampusWasteStation,
  WasteStreamType
} from './types';
import { Icon } from './components/Icon';
import { RewardModal } from './components/RewardModal';
import { StudentIdCard } from './components/StudentIdCard';
import { AppFooter } from './components/AppFooter';
import { AppHeader } from './components/AppHeader';
import { HeroWalletCard } from './components/HeroWalletCard';
import { GainsOverviewCard } from './components/GainsOverviewCard';
import { FeaturedOffersCarousel } from './components/FeaturedOffersCarousel';
import { BottomNavigation } from './components/BottomNavigation';
import { SplashScreen } from './components/SplashScreen';
import { CampusWasteMap } from './components/CampusWasteMap';
import { WasteVerificationModal } from './components/WasteVerificationModal';
import { analyzeWasteInput } from './services/wasteAiService';
import { CAMPUS_OFFERS } from './services/campusOffersService';
import { WASTE_STREAM_META } from './services/campusWasteLocationsService';
import { checkVerificationEligibility } from './services/wasteVerificationService';
import './styles.css';

const STORAGE_KEY = 'green-step-wallet-v1';
const WEEKLY_REWARD_TARGET = 20;

const getInitialState = (): WalletState => ({
  stars: 2,
  lifetimeStars: 2,
  streak: 1,
  redeemedRewards: [],
  profile: {
    studentId: '',
    fullName: '',
    department: 'Finans ve Ekonomi',
    isLoggedIn: false
  },
  apiKey: ''
});

const getLevelData = (lifetimeStars: number) => {
  if (lifetimeStars >= 20) return { level: 4, name: 'Yeşil Öncü' };
  if (lifetimeStars >= 10) return { level: 3, name: 'Kampüs Koruyucusu' };
  if (lifetimeStars >= 5) return { level: 2, name: 'Doğa Dostu' };
  return { level: 1, name: 'Yeşil Başlangıç' };
};

export const App: React.FC = () => {
  const [wallet, setWallet] = useState<WalletState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...getInitialState(), ...JSON.parse(saved) } : getInitialState();
    } catch {
      return getInitialState();
    }
  });

  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeVoucherReward, setActiveVoucherReward] = useState<RewardTier | null>(null);
  const [isVerificationOpen, setIsVerificationOpen] = useState<boolean>(false);
  const [verificationStation, setVerificationStation] = useState<CampusWasteStation | null>(null);
  const [verificationStream, setVerificationStream] = useState<WasteStreamType | null>(null);

  const detectStreamFromText = (text: string): WasteStreamType => {
    const lower = text.toLocaleLowerCase('tr-TR');
    if (lower.includes('pil') || lower.includes('batarya')) return 'battery';
    if (lower.includes('kağıt') || lower.includes('karton') || lower.includes('mavi')) return 'paper';
    if (
      lower.includes('diğer') ||
      lower.includes('evsel') ||
      lower.includes('genel çöp') ||
      lower.includes('gri')
    ) {
      return 'domestic';
    }
    return 'packaging';
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: 'Merhaba! Hangi atığı hangi kutuya atacağından emin değilsen fotoğrafını çekip gönderebilir veya doğrudan bana sorabilirsin. Örneğin: "Yağlı pizza kutusunu nereye atmalıyım?"',
      recommendedBin: 'Yeşil Asistan Hazır',
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

  const showToast = (message: string, durationMs = 3500) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), durationMs);
  };

  const handleRedeemReward = (rewardId: string, cost: number, title: string) => {
    if (wallet.stars < cost) return;
    setWallet((prev) => ({
      ...prev,
      stars: prev.stars - cost,
      redeemedRewards: [...prev.redeemedRewards, rewardId]
    }));
    showToast(`${title} için yıldızların kullanıldı`);
  };

  const handleOpenFirstOffer = () => {
    const affordable = CAMPUS_OFFERS.find((offer) => wallet.stars >= offer.stars);
    setActiveVoucherReward(affordable || CAMPUS_OFFERS[0]);
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

  const handleSendMessage = async () => {
    const textToSend = inputText.trim();
    const currentImage = selectedImage;
    if (!textToSend && !currentImage) return;

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
    showToast('Öğrenci profili bu cihaza bağlandı', 3000);
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

  const levelInfo = getLevelData(wallet.lifetimeStars);

  return (
    <main className="app">
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} durationMs={2000} />
      )}

      <AppHeader
        profile={wallet.profile}
        stars={wallet.stars}
        streak={wallet.streak}
        onOpenProfile={() => setActiveTab('profile')}
      />

      {toastMessage && (
        <div className="toast-banner" role="status">
          <Icon name="check" size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {activeTab === 'home' && (
        <section className="view active">
          <HeroWalletCard
            stars={wallet.stars}
            levelName={levelInfo.name}
            levelNumber={levelInfo.level}
            onOpenRewards={handleOpenFirstOffer}
          />

          {(() => {
            const homeEligibility = checkVerificationEligibility(wallet, true);
            return (
              <div
                className="home-verification-trigger"
                onClick={() => {
                  setVerificationStation(null);
                  setVerificationStream(null);
                  setIsVerificationOpen(true);
                }}
                role="button"
                tabIndex={0}
              >
                <div className="home-verif-icon-circle">
                  <Icon name="shield-check" size={22} />
                </div>
                <div className="home-verif-content">
                  <div className="home-verif-top-row">
                    <strong>Kutu Başında Doğrulanmış Ayrıştırma</strong>
                    <span className="home-verif-badge">
                      {homeEligibility.remainingDailyCount} / 2 Günlük Hak
                    </span>
                  </div>
                  <small>
                    {homeEligibility.reason === 'cooldown'
                      ? `${homeEligibility.cooldownRemainingMinutes} dk bekleme süresinde · Kutu başında teyit et`
                      : 'Kampüs atık kutusunun yanındayken teyit et, +1 Yeşil Yıldız kazan.'}
                  </small>
                </div>
                <Icon name="arrow-right" size={18} className="home-verif-arrow" />
              </div>
            );
          })()}

          <GainsOverviewCard stars={wallet.stars} targetStars={WEEKLY_REWARD_TARGET} />

          <FeaturedOffersCarousel
            offers={CAMPUS_OFFERS}
            currentStars={wallet.stars}
            onSelectOffer={(offer) => setActiveVoucherReward(offer)}
          />

          <AppFooter minimal />
        </section>
      )}

      {activeTab === 'map' && (
        <section className="view active">
          <CampusWasteMap
            onStartVerification={(station) => {
              setVerificationStation(station);
              setIsVerificationOpen(true);
            }}
          />
          <AppFooter minimal />
        </section>
      )}

      {activeTab === 'assistant' && (
        <section className="view active">
          <div className="eyebrow">YEŞİL ASİSTAN · AKILLI AYRIŞTIRMA</div>
          <h1>
            Hangi kutuya
            <br />
            atmalıyım?
          </h1>
          <p>
            Atığın fotoğrafını çek veya adını yaz; Yeşil Asistan hangi geri dönüşüm kutusuna atman gerektiğini anında söylesin.
          </p>

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
                {msg.sender === 'assistant' && msg.id !== 'welcome-msg' && (
                  <button
                    type="button"
                    className="chat-msg-action-btn"
                    onClick={() => {
                      const detected = detectStreamFromText(
                        msg.text + ' ' + (msg.recommendedBin || '')
                      );
                      setVerificationStream(detected);
                      setVerificationStation(null);
                      setIsVerificationOpen(true);
                    }}
                  >
                    <Icon name="shield-check" size={15} />
                    <span>Kutuda Doğrula & Puan Kazan</span>
                  </button>
                )}
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
                type="button"
                className="remove-img-btn"
                onClick={() => setSelectedImage(null)}
                aria-label="Fotoğrafı kaldır"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          )}

          <div className="chat-verify-banner">
            <div className="chat-verify-texts">
              <div className="chat-verify-title">
                <Icon name="shield-check" size={16} />
                <strong>Atığı Kutuya Bırakırken Doğrula</strong>
              </div>
              <small>Yalnızca kutu başında teyit edilen ayrıştırmalar Yeşil Yıldız kazandırır.</small>
            </div>
            <button
              type="button"
              className="chat-verify-pill-btn"
              onClick={() => {
                setVerificationStation(null);
                setIsVerificationOpen(true);
              }}
            >
              <span>Teyit Et</span>
              <Icon name="arrow-right" size={13} />
            </button>
          </div>

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
              type="button"
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
              type="button"
              className="icon-action-btn send"
              onClick={handleSendMessage}
              disabled={!inputText.trim() && !selectedImage}
              aria-label="Gönder"
            >
              <Icon name="send" size={20} />
            </button>
          </div>

          <AppFooter minimal />
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
            Yıldızlarının kaybolmaması için cüzdanını öğrenci numaranla bu cihaza eşleştirebilirsin.
          </p>

          <StudentIdCard
            profile={wallet.profile}
            stars={wallet.stars}
            levelName={levelInfo.name}
            levelNumber={levelInfo.level}
          />

          {wallet.profile.isLoggedIn ? (
            <div className="panel" style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <strong>Bağlı Kampüs Kimliği</strong>
                  <div className="small" style={{ marginTop: 3 }}>
                    {wallet.profile.studentId} · {wallet.profile.department}
                  </div>
                </div>
                <button type="button" className="back" onClick={handleLogout} aria-label="Çıkış yap">
                  <Icon name="logout" size={18} />
                </button>
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

          {wallet.recentVerifications && wallet.recentVerifications.length > 0 && (
            <div className="panel" style={{ marginTop: 14 }}>
              <strong>Son Doğrulanan Ayrıştırmalar</strong>
              <p className="small" style={{ marginTop: 4, marginBottom: 12 }}>
                Kutu başında teyit edilerek onaylanan kampüs geri dönüşüm kayıtların.
              </p>
              <div className="profile-verifs-list">
                {wallet.recentVerifications.map((item, idx) => {
                  const meta = WASTE_STREAM_META[item.stream];
                  const dateStr = new Date(item.timestamp).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  return (
                    <div key={`${item.timestamp}-${idx}`} className="profile-verif-row">
                      <div
                        className="profile-verif-icon"
                        style={{ backgroundColor: meta.bgColor }}
                      >
                        <span
                          className="profile-verif-dot"
                          style={{ backgroundColor: meta.color }}
                        />
                      </div>
                      <div className="profile-verif-info">
                        <strong>{item.stationTitle}</strong>
                        <small>
                          {meta.label} · {dateStr}
                        </small>
                      </div>
                      <span className="profile-verif-badge">+1 Yıldız</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <AppFooter />
        </section>
      )}

      {activeVoucherReward && (
        <RewardModal
          reward={activeVoucherReward}
          onClose={() => setActiveVoucherReward(null)}
          onConfirmRedeem={handleRedeemReward}
        />
      )}

      <WasteVerificationModal
        isOpen={isVerificationOpen}
        wallet={wallet}
        initialStation={verificationStation}
        initialStream={verificationStream}
        onClose={() => {
          setIsVerificationOpen(false);
          setVerificationStream(null);
        }}
        onSuccess={(updated) => {
          setWallet(updated);
          showToast('Doğrulanmış ayrıştırma tamamlandı! +1 Yıldız eklendi.', 3500);
        }}
      />

      <BottomNavigation activeTab={activeTab} onSelectTab={setActiveTab} />
    </main>
  );
};

export default App;
