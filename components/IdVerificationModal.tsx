import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js'; // L'import correct pour Vite
import { UserProfile } from '../types';

// ---------------------------------------------------------
// CONFIGURATION SUPABASE (Pour Vite)
// Assure-toi que ces variables existent dans ton .env ou sur Vercel
// ---------------------------------------------------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface IdVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSuccess: (updatedUser: UserProfile) => void;
}

export const IdVerificationModal: React.FC<IdVerificationModalProps> = ({ isOpen, onClose, currentUser, onSuccess }) => {
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [stage, setStage] = useState<'IDLE' | 'SCANNING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl(null);
      setFileToUpload(null);
      setStage('IDLE');
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFileToUpload(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!fileToUpload || !currentUser?.id) return;
    setStage('SCANNING');
    setErrorMessage('');
    
    try {
      // 1. Upload dans le bucket 'id_documents'
      const fileExt = fileToUpload.name.split('.').pop();
      const filePath = `${currentUser.id}/recto.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('id_documents')
        .upload(filePath, fileToUpload, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Update de la table users
      const { error: updateError } = await supabase
        .from('users')
        .update({
          id_verification_status: 'PENDING',
          id_card_recto_path: filePath,
        })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      setStage('SUCCESS');
      onSuccess({
        ...currentUser,
        id_verification_status: 'PENDING'
      });

    } catch (error: any) {
      console.error("Erreur upload:", error);
      setErrorMessage(error.message || "Erreur lors de l'envoi.");
      setStage('ERROR');
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-indigo-950/80 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-3xl w-full max-w-lg rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] border border-white/50 overflow-hidden relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-indigo-600 transition-all active:scale-90 z-10">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <div className="p-10">
          {(stage === 'IDLE' || stage === 'ERROR') && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-3xl shadow-2xl mb-6 animate-bounce-slow">🪪</div>
                <h2 className="text-3xl font-black text-indigo-950 italic tracking-tighter">Sécurité Hôte</h2>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2 px-8">Vérification de la CNI requise pour publier</p>
              </div>

              {stage === 'ERROR' && (
                <div className="mb-4 p-3 bg-red-100 text-red-600 text-xs font-bold rounded-xl text-center">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-6">
                {!previewUrl ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video border-4 border-dashed border-indigo-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group relative overflow-hidden"
                  >
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform mb-4">📸</div>
                    <p className="font-black text-indigo-900 text-sm uppercase tracking-widest">Scanner ma carte</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-2 text-center px-6 italic">Utilisez l'appareil photo ou importez un fichier</p>
                    <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                  </div>
                ) : (
                  <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border-2 border-indigo-600 shadow-2xl animate-in zoom-in-95 group">
                    <img src={previewUrl} className="w-full h-full object-cover" alt="ID Preview" />
                    <button 
                      onClick={() => { setPreviewUrl(null); setFileToUpload(null); }}
                      className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white border border-white/30 hover:bg-rose-500 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                )}

                <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 flex items-start gap-4">
                  <span className="text-2xl">🔒</span>
                  <p className="text-[9px] font-black text-indigo-400 leading-relaxed uppercase tracking-tight">
                    Vos documents sont cryptés et stockés dans un coffre-fort numérique sécurisé.
                  </p>
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={!fileToUpload}
                  className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-3 group"
                >
                  DÉMARRER L'ENVOI
                </button>
              </div>
            </div>
          )}

          {stage === 'SCANNING' && (
            <div className="py-20 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
               {/* Animation de scan conservée */}
               <div className="relative w-48 h-48 mb-12">
                 <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                 <div className="absolute inset-4 overflow-hidden rounded-full">
                    <img src={previewUrl!} className="w-full h-full object-cover grayscale opacity-50" alt="Processing" />
                 </div>
              </div>
              <h3 className="text-2xl font-black italic text-indigo-950 uppercase tracking-tighter">Envoi Sécurisé...</h3>
            </div>
          )}

          {stage === 'SUCCESS' && (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-700">
              <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center shadow-2xl mb-8 animate-bounce-slow">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>
              </div>
              <h2 className="text-4xl font-black text-indigo-950 italic tracking-tighter mb-4">Reçu !</h2>
              <p className="text-gray-500 font-bold text-xs uppercase tracking-[0.2em] mb-10 px-8 leading-loose">
                Document transmis. En attente de validation.
              </p>
              <button onClick={onClose} className="w-full py-6 bg-indigo-950 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all">TERMINER</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
