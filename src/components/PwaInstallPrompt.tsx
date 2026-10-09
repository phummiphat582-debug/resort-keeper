import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running as installed PWA standalone
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // If iOS and not standalone, show prompt after a short delay
    if (isIosDevice) {
      const dismissed = localStorage.getItem('pwa_ios_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    }

    // Android / Chrome / Edge BeforeInstallPrompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('pwa_banner_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) {
      alert('หากต้องการติดตั้งแอป กรุณาแตะที่เมนู 3 จุดของเบราว์เซอร์ แล้วเลือก "ติดตั้งแอป" หรือ "เพิ่มลงในหน้าจอหลัก"');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    if (isIos) {
      localStorage.setItem('pwa_ios_dismissed', 'true');
    } else {
      localStorage.setItem('pwa_banner_dismissed', 'true');
    }
  };

  if (isStandalone || !showBanner) return null;

  return (
    <>
      {/* Top Banner on Mobile */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 text-xs shadow-md flex items-center justify-between gap-3 sticky top-0 z-40 animate-in slide-in-from-top duration-200">
        <div className="flex items-center gap-2.5">
          <img src="./icon-192.png" alt="App Logo" className="w-8 h-8 rounded-lg shadow-sm border border-white/20" />
          <div>
            <div className="font-bold flex items-center gap-1.5">
              <span>ติดตั้งแอปแม่บ้านรีสอร์ท</span>
              <span className="bg-emerald-500/80 text-[10px] px-1.5 py-0.2 rounded font-medium">PWA</span>
            </div>
            <p className="text-[11px] text-emerald-100 hidden sm:block">
              เปิดใช้งานได้เร็วเหมือนแอปทั่วไป ไม่ต้องเปิดเบราว์เซอร์
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ติดตั้งลงเครื่อง</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 text-white/80 hover:text-white rounded-lg transition"
            title="ปิดข้อความ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <Smartphone className="w-5 h-5" />
                <span>วิธีติดตั้งบน iPhone / iPad</span>
              </div>
              <button onClick={() => setShowIosGuide(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">1</span>
                <div>
                  แตะที่ปุ่ม <b>แชร์ (Share)</b> <Share className="w-4 h-4 inline text-blue-500 mx-1" /> ที่แถบเมนูด้านล่างของ Safari
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">2</span>
                <div>
                  เลื่อนลงมาแล้วเลือกเมนู <b>"เพิ่มไปยังหน้าจอโฮม"</b> <PlusSquare className="w-4 h-4 inline text-slate-700 mx-1" />
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">3</span>
                <div>
                  แตะที่คำว่า <b>"เพิ่ม" (Add)</b> ที่มุมขวาบน จะมีไอคอนแอปปรากฏบนหน้าจอมือถือของคุณทันที!
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}
    </>
  );
};
