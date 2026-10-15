import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Download, X } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const { lang } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show banner after 3 seconds for mobile devices if not installed
    const timer = setTimeout(() => {
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setIsVisible(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      alert(lang === 'mr'
        ? 'GharPoch ॲप इन्स्टॉल करण्यासाठी ब्राउझरच्या मेनूमध्ये (⋮) जाऊन "Add to Home screen" किंवा "Install App" वर क्लिक करा.'
        : 'To install GharPoch, open browser menu (⋮) and tap "Add to Home screen" or "Install App".');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-orange-600 text-white p-3.5 rounded-2xl shadow-xl border border-orange-400/40 flex items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-center gap-3">
        <img src="/logo.svg" alt="GharPoch" className="w-10 h-10 rounded-xl bg-white/10 p-1" />
        <div>
          <p className="font-bold text-xs text-amber-300">
            {lang === 'mr' ? 'GharPoch ॲप इन्स्टॉल करा' : 'Install GharPoch App'}
          </p>
          <p className="text-[11px] text-white/80 line-clamp-1">
            {lang === 'mr' ? 'जलद ऑर्डर आणि थेट ट्रॅकिंगसाठी' : 'For faster orders & instant tracking'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={handleInstallClick}
          className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{lang === 'mr' ? 'इन्स्टॉल' : 'Install'}</span>
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 text-white/60 hover:text-white rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
