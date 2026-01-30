import React from 'react';
import { AppLanguage } from '../types';

interface AboutUsProps {
  language: AppLanguage;
  translations: any;
}

export const AboutUs: React.FC<AboutUsProps> = ({ language, translations: t }) => {
  const isRTL = language === 'ar';

  return (
    <div
      className="space-y-20 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-32"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* HERO SECTION */}
      <div className="relative h-[60vh] rounded-[4rem] overflow-hidden flex items-center justify-center border border-white/20 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-indigo-950/60 backdrop-blur-[2px]" />

        <div className="relative z-10 text-center px-6">
          <div className="inline-block px-6 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-[10px] font-black text-white uppercase tracking-[0.5em] mb-8 animate-pulse">
            L&apos;Odyssée Technologique
          </div>
          <h1 className="text-6xl md:text-9xl font-black text-white italic tracking-tighter uppercase drop-shadow-2xl">
            LOCA<span className="text-indigo-400">DZ</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/70 font-bold max-w-2xl mx-auto mt-6 italic">
            &quot;Là où le futur rencontre l&apos;Algérie éternelle.&quot;
          </p>
        </div>
      </div>

      {/* CORE CONTENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto px-6">
        <div className="bg-white/10 backdrop-blur-3xl p-12 rounded-[4rem] border border-white/20 shadow-2xl hover:scale-[1.02] transition-transform duration-700">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-3xl shadow-xl mb-8">
            🎯
          </div>
          <h2 className="text-4xl font-black text-white italic tracking-tight mb-6">
            {t.missionTitle}
          </h2>
          <p className="text-lg text-white/60 font-medium leading-relaxed">
            {t.missionText}
          </p>
          <div className="mt-8 pt-8 border-t border-white/5 flex items-center gap-4">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">
              Excellence • Algérie • Innovation
            </p>
          </div>
        </div>

        <div className="bg-indigo-950/50 backdrop-blur-3xl p-12 rounded-[4rem] border border-white/10 shadow-2xl hover:scale-[1.02] transition-transform duration-700">
          <div className="w-16 h-16 bg-violet-600 rounded-3xl flex items-center justify-center text-3xl shadow-xl mb-8">
            👁️
          </div>
          <h2 className="text-4xl font-black text-white italic tracking-tight mb-6">
            {t.visionTitle}
          </h2>
          <p className="text-lg text-white/60 font-medium leading-relaxed">
            {t.visionText}
          </p>
          <div className="mt-8 pt-8 border-t border-white/5 flex items-center gap-4">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <p className="text-[9px] font-black text-violet-300 uppercase tracking-widest">
              Confiance • Prestige • Futur
            </p>
          </div>
        </div>
      </div>

      {/* MANIFESTO */}
      <div className="max-w-4xl mx-auto px-6 text-center space-y-10">
        <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em]">
          Le Manifeste LOCADZ
        </h3>
        <p className="text-3xl md:text-5xl font-black text-white italic tracking-tighter leading-tight">
          &quot;Nous ne louons pas des murs, nous créons des{' '}
          <span className="animate-shine-text">portails vers l&apos;exceptionnel</span>.&quot;
        </p>

        {/* LIGNE CHIFFRES – version honnête / ambition, pas mensonges */}
        <div className="flex justify-center items-center gap-8 pt-10">
          <div className="text-center">
            <p className="text-4xl font-black text-white">48</p>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">
              Wilayas (notre terrain de jeu)
            </p>
          </div>
          <div className="w-[1px] h-12 bg-white/10" />
          <div className="text-center">
            <p className="text-4xl font-black text-white">1</p>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">
              Plateforme dédiée à l&apos;Algérie
            </p>
          </div>
          <div className="w-[1px] h-12 bg-white/10" />
          <div className="text-center">
            <p className="text-4xl font-black text-white">∞</p>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">
              Expériences à construire ensemble
            </p>
          </div>
        </div>

        {/* CONTACT OFFICIEL */}
        <div className="pt-10 text-xs text-white/60 leading-relaxed">
          Pour toute question, suggestion ou partenariat autour de LOCA DZ :{' '}
          <a
            href="mailto:loca.dz@hotmail.com"
            className="underline text-indigo-300 hover:text-indigo-200"
          >
            loca.dz@hotmail.com
          </a>
        </div>
      </div>
    </div>
  );
};
