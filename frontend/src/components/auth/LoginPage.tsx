import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Phone,
  Lock,
  User,
  ArrowRight,
  Globe
} from 'lucide-react';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, register } = useAuth();
  const { lang, toggleLang, t } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone.trim() || !password.trim()) {
      setError(lang === 'mr' ? 'मोबाईल नंबर आणि पासवर्ड टाका' : 'Phone and password are required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(phone.trim(), password.trim());
      } else {
        if (!name.trim()) {
          setError(lang === 'mr' ? 'कृपया तुमचे नाव टाका' : 'Name is required');
          setIsSubmitting(false);
          return;
        }
        await register(phone.trim(), name.trim(), password.trim());
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex flex-col justify-center items-center p-4">
      {/* Top Language Toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-orange-200 text-xs font-bold text-orange-950 shadow-xs hover:bg-orange-50 transition cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-orange-600" />
          <span>{lang === 'mr' ? 'English' : 'मराठी'}</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-orange-100 overflow-hidden animate-scale-up">
        {/* Brand Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-500 p-6 text-white text-center relative overflow-hidden">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-xs rounded-2xl mx-auto flex items-center justify-center p-2 shadow-inner mb-3">
            <img src="/logo.svg" alt="GharPoch" className="w-full h-full" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">GharPoch • घरपोच</h1>
          <p className="text-xs text-orange-100 font-medium mt-1">
            {t('brand.tagline', 'ऑर्डर तुमची, डिलिव्हरी आमची!')}
          </p>
          <p className="text-[11px] text-white/80 mt-0.5">
            {lang === 'mr' ? 'करोडी, आसेगाव, साजापूर व परिसर' : 'Hyperlocal delivery in Karodi, Asegaon, Sajapur'}
          </p>
        </div>

        {/* Tab Buttons (Login vs Register) */}
        <div className="flex border-b border-orange-100 bg-orange-50/50">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-3 text-xs font-black transition cursor-pointer ${
              mode === 'login'
                ? 'text-orange-600 border-b-2 border-orange-600 bg-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {lang === 'mr' ? 'साइन इन (Sign In)' : 'Sign In'}
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-3 text-xs font-black transition cursor-pointer ${
              mode === 'register'
                ? 'text-orange-600 border-b-2 border-orange-600 bg-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {lang === 'mr' ? 'नवीन खाते (Sign Up)' : 'Register'}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium animate-shake">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lang === 'mr' ? 'तुमचे संपूर्ण नाव' : 'Full Name'} *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="उदा. राहुल देशमुख"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-hidden"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'mr' ? 'मोबाईल नंबर (१० अंक)' : '10-digit Mobile Number'} *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                placeholder="उदा. 9890055555"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'mr' ? 'पासवर्ड' : 'Password'} *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white py-3 rounded-2xl font-black text-xs shadow-md transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <span>{lang === 'mr' ? 'प्रक्रिया सुरू आहे...' : 'Processing...'}</span>
            ) : (
              <>
                <span>{mode === 'login' ? (lang === 'mr' ? 'साइन इन करा' : 'Sign In') : (lang === 'mr' ? 'खाते तयार करा' : 'Create Account')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
