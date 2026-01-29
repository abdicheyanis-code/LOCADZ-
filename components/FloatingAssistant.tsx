import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { GeminiAssistant } from './GeminiAssistant';

type Props = {
  currentProperty?: any;
};

export const FloatingAssistant: React.FC<Props> = ({ currentProperty }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* FLOATING BUBBLE */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999]
                   w-12 h-12 rounded-full bg-indigo-500/90
                   hover:bg-indigo-400 transition-all
                   shadow-[0_10px_30px_rgba(0,0,0,0.4)]
                   backdrop-blur-xl flex items-center justify-center
                   text-white"
        aria-label="Assistant DZ"
      >
        <Sparkles size={20} />
      </button>

      {/* OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* PANEL */}
      {open && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999]
                     w-[95vw] max-w-xl max-h-[80vh]
                     bg-black/70 backdrop-blur-3xl
                     border border-white/10
                     rounded-3xl shadow-[0_40px_120px_rgba(0,0,0,0.6)]
                     animate-in fade-in zoom-in-95 duration-300
                     overflow-hidden flex flex-col"
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-sm font-semibold tracking-wide uppercase opacity-80">
              Assistant DZ
            </span>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-full hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-hidden">
            <GeminiAssistant currentProperty={currentProperty} />
          </div>
        </div>
      )}
    </>
  );
};
