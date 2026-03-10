import React, { useEffect, useState } from 'react';
import { LocadzLogo } from './Navbar';
import { UserProfile, AppLanguage } from '../types';

interface WelcomeScreenProps {
  currentUser: UserProfile | null;
  onNavigate: (view: 'EXPLORE' | 'PROFILE' | 'ABOUT') => void;
  currentRole: 'TRAVELER' | 'HOST';
  onSelectRole: (role: 'TRAVELER' | 'HOST') => void;
  language: AppLanguage;
  translations: any;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  currentUser,
  onNavigate,
  currentRole,
  onSelectRole,
  language,
  translations: t,
}) => {
  const [showContent, setShowContent] = useState(false);
  const [hoveredRole, setHoveredRole] = useState<'TRAVELER' | 'HOST' | null>(null);
  const isRTL = language === 'ar';

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Traductions
  const texts = {
    fr: {
      welcome: 'BIENVENUE',
      question: 'Quelle sera votre aventure ?',
      traveler: 'Voyageur',
      travelerDesc: 'Explorez des logements uniques à travers toute l\'Algérie',
      travelerAction: 'Découvrir',
      host: 'Hôte',
      hostDesc: 'Partagez votre espace et accueillez des voyageurs du monde entier',
      hostAction: 'Commencer',
      about: 'Notre histoire',
      aboutDesc: 'Découvrez la vision LOCADZ',
    },
    en: {
      welcome: 'WELCOME',
      question: 'What will your adventure be?',
      traveler: 'Traveler',
      travelerDesc: 'Explore unique stays across Algeria',
      travelerAction: 'Discover',
      host: 'Host',
      hostDesc: 'Share your space and welcome travelers from around the world',
      hostAction: 'Get started',
      about: 'Our story',
      aboutDesc: 'Discover the LOCADZ vision',
    },
    ar: {
      welcome: 'مرحباً',
      question: 'ما هي مغامرتك القادمة؟',
      traveler: 'مسافر',
      travelerDesc: 'اكتشف إقامات فريدة في جميع أنحاء الجزائر',
      travelerAction: 'استكشف',
      host: 'مضيف',
      hostDesc: 'شارك مساحتك واستقبل المسافرين من جميع أنحاء العالم',
      hostAction: 'ابدأ',
      about: 'قصتنا',
      aboutDesc: 'اكتشف رؤية لوكادز',
    },
  };

  const txt = texts[language];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 md:px-6 relative z-10 py-12 overflow-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 z-[-1] overflow-hidden bg-[#050505]">
        {/* Gradient orbs */}
        <div 
          className="absolute top-[5%] left-[5%] w-[70%] h-[70%] rounded-full blur-[180px] transition-all duration-1000"
          style={{
            background: hoveredRole === 'TRAVELER' 
              ? 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)'
              : hoveredRole === 'HOST'
              ? 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)'
          }}
        />
        <div 
          className="absolute bottom-[5%] right-[5%] w-[60%] h-[60%] rounded-full blur-[180px] transition-all duration-1000"
          style={{
            background: hoveredRole === 'HOST' 
              ? 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)'
              : hoveredRole === 'TRAVELER'
              ? 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)'
          }}
        />
        {/* Grain texture */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }} />
      </div>

      {/* Content */}
      <div
        className={`transition-all duration-1000 transform ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        } w-full max-w-4xl`}
      >
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          {/* Logo */}
          <div className="inline-flex items-center justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur-xl opacity-30 animate-pulse" />
              <div className="relative p-1 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl border border-white/10 shadow-2xl">
                <LocadzLogo className="w-14 h-14 md:w-16 md:h-16" />
              </div>
            </div>
          </div>

          {/* Welcome text */}
          <p className="text-[10px] md:text-xs font-black text-indigo-400/70 uppercase tracking-[0.5em] mb-4">
            {txt.welcome}, {currentUser?.full_name.split(' ')[0]}
          </p>
          
          <h1 className="text-3xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
            {txt.question}
          </h1>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-12">
          {/* Voyageur Card */}
          <button
            type="button"
            onClick={() => onSelectRole('TRAVELER')}
            onMouseEnter={() => setHoveredRole('TRAVELER')}
            onMouseLeave={() => setHoveredRole(null)}
            className="group relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-white/10 p-6 md:p-8 text-left transition-all duration-500 hover:border-indigo-500/50 hover:shadow-[0_0_60px_-15px_rgba(99,102,241,0.5)] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            }}
          >
            {/* Hover gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Icon */}
            <div className="relative mb-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl md:rounded-3xl flex items-center justify-center text-3xl md:text-4xl shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                ✈️
              </div>
              {/* Floating particles */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
            </div>

            {/* Text */}
            <div className="relative">
              <h3 className="text-2xl md:text-3xl font-black text-white mb-2 group-hover:text-indigo-300 transition-colors duration-300">
                {txt.traveler}
              </h3>
              <p className="text-white/50 text-sm md:text-base leading-relaxed mb-6 group-hover:text-white/70 transition-colors">
                {txt.travelerDesc}
              </p>
              
              {/* CTA */}
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm uppercase tracking-wider">
                <span>{txt.travelerAction}</span>
                <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
              </div>
            </div>

            {/* Shine effect */}
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 opacity-0 group-hover:opacity-100 group-hover:animate-shine" />
          </button>

          {/* Hôte Card */}
          <button
            type="button"
            onClick={() => onSelectRole('HOST')}
            onMouseEnter={() => setHoveredRole('HOST')}
            onMouseLeave={() => setHoveredRole(null)}
            className="group relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-white/10 p-6 md:p-8 text-left transition-all duration-500 hover:border-amber-500/50 hover:shadow-[0_0_60px_-15px_rgba(245,158,11,0.5)] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            }}
          >
            {/* Hover gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Icon */}
            <div className="relative mb-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl md:rounded-3xl flex items-center justify-center text-3xl md:text-4xl shadow-xl group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                🏡
              </div>
              {/* Floating particles */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
            </div>

            {/* Text */}
            <div className="relative">
              <h3 className="text-2xl md:text-3xl font-black text-white mb-2 group-hover:text-amber-300 transition-colors duration-300">
                {txt.host}
              </h3>
              <p className="text-white/50 text-sm md:text-base leading-relaxed mb-6 group-hover:text-white/70 transition-colors">
                {txt.hostDesc}
              </p>
              
              {/* CTA */}
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wider">
                <span>{txt.hostAction}</span>
                <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
              </div>
            </div>

            {/* Shine effect */}
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 opacity-0 group-hover:opacity-100 group-hover:animate-shine" />
          </button>
        </div>

        {/* About Us Button */}
        <div className="flex justify-center">
          <button
            onClick={() => onNavigate('ABOUT')}
            className="group flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
          >
            <span className="text-lg group-hover:scale-110 transition-transform">🚀</span>
            <span className="text-white/60 group-hover:text-white/90 font-medium text-sm transition-colors">
              {txt.about}
            </span>
            <span className="text-white/30 group-hover:text-white/60 text-xs transition-colors">
              — {txt.aboutDesc}
            </span>
          </button>
        </div>

        {/* Bottom decoration */}
        <div className="mt-16 flex justify-center">
          <div className="flex items-center gap-2 opacity-20">
            <div className="w-1 h-1 rounded-full bg-white" />
            <div className="w-8 h-[1px] bg-gradient-to-r from-white to-transparent" />
            <span className="text-[8px] font-bold text-white uppercase tracking-[0.3em]">LOCADZ</span>
            <div className="w-8 h-[1px] bg-gradient-to-l from-white to-transparent" />
            <div className="w-1 h-1 rounded-full bg-white" />
          </div>
        </div>
      </div>

      {/* CSS for shine animation */}
      <style>{`
        @keyframes shine {
          100% {
            left: 125%;
          }
        }
        .group:hover .group-hover\\:animate-shine {
          animation: shine 0.75s ease-in-out;
        }
      `}</style>
    </div>
  );
};
