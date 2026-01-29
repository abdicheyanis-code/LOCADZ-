import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSuccess: (updatedUser: UserProfile) => void;
}

export const IdVerificationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}) => {
  const [rectoFile, setRectoFile] = useState<File | null>(null);
  const [versoFile, setVersoFile] = useState<File | null>(null);
  const [rectoPreview, setRectoPreview] = useState<string | null>(null);
  const [versoPreview, setVersoPreview] = useState<string | null>(null);
  const [stage, setStage] = useState<'IDLE' | 'UPLOADING' | 'SUCCESS' | 'ERROR'>(
    'IDLE'
  );
  const [errorMessage, setErrorMessage] = useState('');

  const rectoInputRef = useRef<HTMLInputElement>(null);
  const versoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setRectoFile(null);
      setVersoFile(null);
      setRectoPreview(null);
      setVersoPreview(null);
      setStage('IDLE');
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'recto' | 'verso'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (side === 'recto') setRectoPreview(reader.result as string);
      else setVersoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    if (side === 'recto') setRectoFile(file);
    else setVersoFile(file);
  };

  const uploadOne = async (file: File, path: string) => {
    const { error } = await supabase.storage
      .from('id_documents')
      .upload(path, file, { upsert: true });

    if (error) throw error;
  };

  const handleSubmit = async () => {
    if (!rectoFile || !versoFile || !currentUser?.id) return;

    setStage('UPLOADING');
    setErrorMessage('');

    try {
      const rectoExt = rectoFile.name.split('.').pop() || 'jpg';
      const versoExt = versoFile.name.split('.').pop() || 'jpg';

      const rectoPath = `${currentUser.id}/cni_recto.${rectoExt}`;
      const versoPath = `${currentUser.id}/cni_verso.${versoExt}`;

      // 1️⃣ Upload images
      await uploadOne(rectoFile, rectoPath);
      await uploadOne(versoFile, versoPath);

      // 2️⃣ Update DB
      const { error: updateError } = await supabase
        .from('users')
        .update({
          id_verification_status: 'PENDING',
          id_card_recto_path: rectoPath,
          id_card_verso_path: versoPath,
        })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      setStage('SUCCESS');

      onSuccess({
        ...currentUser,
        id_verification_status: 'PENDING',
        id_card_recto_path: rectoPath,
        id_card_verso_path: versoPath,
      });
    } catch (err: any) {
      console.error('Erreur upload CNI:', err);
      setErrorMessage(err.message || "Erreur lors de l'envoi.");
      setStage('ERROR');
    }
  };

  const canSubmit = !!rectoFile && !!versoFile;

  return (
    <div className="fixed inset-0 z-[250] bg-indigo-950/80 backdrop-blur-2xl flex justify-center p-4 overflow-y-auto">
      <div className="bg-white/95 w-full max-w-lg rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] border border-white/50 overflow-hidden relative my-8">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-indigo-600 transition-all active:scale-90 z-10"
        >
          ✕
        </button>

        <div className="p-10">
          {(stage === 'IDLE' || stage === 'ERROR') && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-3xl shadow-2xl mb-6">
                  🪪
                </div>
                <h2 className="text-3xl font-black text-indigo-950 italic tracking-tighter">
                  Vérification d’identité
                </h2>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2 px-8">
                  Carte nationale recto & verso
                </p>
              </div>

              {stage === 'ERROR' && (
                <div className="mb-2 p-3 bg-red-100 text-red-600 text-xs font-bold rounded-xl text-center">
                  {errorMessage}
                </div>
              )}

              {/* RECTO */}
              {!rectoPreview ? (
                <div
                  onClick={() => rectoInputRef.current?.click()}
                  className="aspect-video border-4 border-dashed border-indigo-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
                >
                  📸 Scanner le recto
                  <input
                    ref={rectoInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFile(e, 'recto')}
                  />
                </div>
              ) : (
                <img
                  src={rectoPreview}
                  className="w-full aspect-video object-cover rounded-[2rem] border"
                />
              )}

              {/* VERSO */}
              {!versoPreview ? (
                <div
                  onClick={() => versoInputRef.current?.click()}
                  className="aspect-video border-4 border-dashed border-indigo-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
                >
                  📸 Scanner le verso
                  <input
                    ref={versoInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFile(e, 'verso')}
                  />
                </div>
              ) : (
                <img
                  src={versoPreview}
                  className="w-full aspect-video object-cover rounded-[2rem] border"
                />
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 rounded-[2rem] border border-gray-200 text-gray-500 font-black uppercase tracking-[0.2em] text-[10px]"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="flex-1 py-4 bg-indigo-600 disabled:opacity-40 text-white rounded-[2rem] font-black uppercase tracking-[0.2em]"
                >
                  Envoyer
                </button>
              </div>
            </div>
          )}

          {stage === 'UPLOADING' && (
            <div className="py-20 text-center font-black text-indigo-950">
              Envoi sécurisé en cours...
            </div>
          )}

          {stage === 'SUCCESS' && (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white text-4xl mb-6">
                ✓
              </div>
              <h2 className="text-3xl font-black text-indigo-950 mb-3">
                Documents reçus
              </h2>
              <p className="text-gray-500 font-bold text-xs uppercase tracking-[0.2em] mb-8">
                En attente de validation
              </p>
              <button
                onClick={onClose}
                className="w-full py-4 bg-indigo-950 text-white rounded-[2rem] font-black uppercase tracking-[0.2em]"
              >
                Terminer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
