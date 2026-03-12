// components/AuthLanding.tsx

import React from 'react';
import { AppLanguage } from '../types';

interface AuthLandingProps {
  onOpenAuth: () => void;
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  translations: any;
}

// ✅ NOUVEAU : Traductions pour la section "Pourquoi LocaDZ"
const WHY_LOCADZ: Record<AppLanguage, { title: string; points: { icon: string; title: string; desc: string }[] }> = {
  fr: {
    title: "Pourquoi LocaDZ ?",
    points: [
     
      { icon: "🔒", title: "Paiement sécurisé", desc: "Réservez en toute confiance" },
      { icon: "🇩🇿", title: "100% Algérien", desc: "Du Sahara à la Méditerranée" }
    ]
  },
  en: {
    title: "Why LocaDZ?",
    points: [
    
      { icon: "🔒", title: "Secure payment", desc: "Book with confidence" },
      { icon: "🇩🇿", title: "100% Algerian", desc: "From Sahara to Mediterranean" }
    ]
  },
  ar: {
    title: "لماذا LocaDZ؟",
    points: [
   
      { icon: "🔒", title: "دفع آمن", desc: "احجز بكل ثقة" },
      { icon: "🇩🇿", title: "100% جزائري", desc: "من الصحراء إلى البحر المتوسط" }
    ]
  }
};

export const AuthLanding: React.FC<AuthLandingProps> = ({ 
  onOpenAuth, 
  language, 
  onLanguageChange, 
  translations: t 
}) => {
  const isRTL = language === 'ar';
  const whyContent = WHY_LOCADZ[language];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 md:px-6 relative z-10 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* ========== BACKGROUND ========== */}
      <div className="absolute inset-0 z-[-1] overflow-hidden bg-[#030308]">
        {/* Gradient orbs */}
        <div className="absolute top-[-30%] left-[-20%] w-[80vw] h-[80vw] rounded-full opacity-30 blur-[120px] animate-pulse"
          style={{ background: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)' }} 
        />
        <div className="absolute bottom-[-30%] right-[-20%] w-[70vw] h-[70vw] rounded-full opacity-20 blur-[100px] animate-pulse"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', animationDelay: '1s' }} 
        />
        <div className="absolute top-[40%] right-[10%] w-[40vw] h-[40vw] rounded-full opacity-10 blur-[80px]"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }} 
        />
        
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.03]" 
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} 
        />
        
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#030308_70%)]" />
      </div>

      {/* ========== LANGUAGE SELECTOR ========== */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-[100] bg-white/[0.03] backdrop-blur-2xl p-1.5 rounded-full border border-white/10 shadow-2xl">
        {(['fr', 'en', 'ar'] as const).map((lang) => (
          <button 
            key={lang}
            onClick={() => onLanguageChange(lang)} 
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
              language === lang 
                ? 'bg-white text-indigo-950 shadow-lg scale-105' 
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            {lang === 'fr' ? '🇫🇷 FR' : lang === 'en' ? '🇬🇧 EN' : '🇩🇿 AR'}
          </button>
        ))}
      </div>

      {/* ========== MAIN CONTENT ========== */}
      <div className="w-full max-w-4xl relative">
        
        {/* Badge */}
        <div className="flex justify-center mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
          <span className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 backdrop-blur-xl border border-indigo-500/20 px-6 py-2.5 rounded-full text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em] shadow-lg shadow-indigo-500/10">
            ✨ {t.privateAccess}
          </span>
        </div>

        {/* ========== LOGO LOCADZ ========== */}
        <div className="mb-6 animate-in fade-in zoom-in-50 duration-1000 delay-200">
          <h1 className="text-[4rem] md:text-[8rem] lg:text-[10rem] font-black tracking-tighter leading-none select-none">
            <span className="text-white drop-shadow-2xl">LOCA</span>
            <span className="relative inline-block">
              <span 
                className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 italic"
                style={{
                  backgroundSize: '200% auto',
                  animation: 'gradient-shift 3s ease-in-out infinite'
                }}
              >
                DZ
              </span>
              {/* Glow effect */}
              <span 
                className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 italic blur-2xl opacity-50"
                aria-hidden="true"
              >
                DZ
              </span>
            </span>
          </h1>
          
          {/* Tagline sous le logo */}
          <p className="text-white/30 text-xs md:text-sm font-medium tracking-[0.3em] uppercase mt-2">
            {language === 'fr' ? "L'Algérie comme jamais" : language === 'en' ? "Algeria like never before" : "الجزائر كما لم ترها من قبل"}
          </p>
        </div>

        {/* ========== CARD PRINCIPALE ========== */}
        <div className="relative animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          {/* Card glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-indigo-500/20 rounded-[3rem] blur-xl opacity-50" />
          
          <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-8 md:p-12 rounded-[3rem] shadow-2xl">
            
            {/* Slogan */}
            <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
              {t.authSlogan}
            </h2>
            
            {/* Description */}
            <p className="text-white/40 text-sm md:text-base leading-relaxed max-w-lg mx-auto mb-8">
              {t.authSub}
            </p>

            {/* ========== BOUTON CTA ========== */}
            <button 
              onClick={onOpenAuth}
              className="group relative px-10 md:px-14 py-5 md:py-6 bg-white text-indigo-950 rounded-full font-black uppercase tracking-[0.2em] text-[10px] md:text-xs transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] active:scale-95 flex items-center gap-4 mx-auto"
            >
              <span>{t.authBtn}</span>
              <div className={`bg-indigo-600 p-2 rounded-full text-white transition-all duration-300 group-hover:bg-indigo-500 ${isRTL ? 'group-hover:-translate-x-1 rotate-180' : 'group-hover:translate-x-1'}`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* ========== POURQUOI LOCADZ ========== */}
        <div className="mt-12 md:mt-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700">
          
          {/* Titre de section */}
          <h3 className="text-white/50 text-xs font-black uppercase tracking-[0.3em] mb-6">
            {whyContent.title}
          </h3>
          
          {/* 3 Points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {whyContent.points.map((point, index) => (
              <div 
                key={index}
                className="group bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-indigo-500/20 rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="text-2xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {point.icon}
                </div>
                <h4 className="text-white font-bold text-sm mb-1">
                  {point.title}
                </h4>
                <p className="text-white/30 text-xs leading-relaxed">
                  {point.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ========== FOOTER DISCRET ========== */}
        <div className="mt-16 md:mt-20 flex flex-col items-center gap-4 opacity-20 pb-20 md:pb-8">
          <div className="h-12 w-px bg-gradient-to-b from-white/50 to-transparent" />
          <p className="text-white text-[8px] font-bold uppercase tracking-[0.4em]">
            {t.securityVerify}
          </p>
        </div>
      </div>

      {/* ========== CSS ANIMATION ========== */}
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
};
