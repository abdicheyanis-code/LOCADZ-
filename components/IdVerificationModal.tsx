import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';

interface IdVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSuccess: (updatedUser: UserProfile) => void;
}

export const IdVerificationModal: React.FC<IdVerificationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}) => {
  const [rectoPreview, setRectoPreview] = useState<string | null>(null);
  const [versoPreview, setVersoPreview] = useState<string | null>(null);
  const [rectoFile, setRectoFile] = useState<File | null>(null);
  const [versoFile, setVersoFile] = useState<File | null>(null);
  const [stage, setStage] = useState<'IDLE' | 'SCANNING' | 'SUCCESS' | 'ERROR'>(
    'IDLE'
  );
  const [errorMessage, setErrorMessage] = useState<string>('');

  const rectoInputRef = useRef<HTMLInputElement>(null);
  const versoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setRectoPreview(null);
      setVersoPreview(null);
      setRectoFile(null);
      setVersoFile(null);
      setStage('IDLE');
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const loadPreview = (file: File, setPreview: (url: string | null) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRectoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setRectoFile(f);
      loadPreview(f, setRectoPreview);
    }
  };

  const handleVersoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setVersoFile(f);
      loadPreview(f, setVersoPreview);
    }
  };

  const handleSubmit = async () => {
    if (!rectoFile || !versoFile || !currentUser?.id) return;

    setStage('SCANNING');
    setErrorMessage('');

    try {
      const rectoExt = rectoFile.name.split('.').pop() || 'jpg';
      const versoExt = versoFile.name.split('.').pop() || 'jpg';

      const rectoPath = `${currentUser.id}/recto.${rectoExt}`;
      const versoPath = `${currentUser.id}/verso.${versoExt}`;

      // Upload recto
      const { error: uploadRectoError } = await supabase.storage
        .from('id_documents')
        .upload(rectoPath, rectoFile, { upsert: true });
      if (uploadRectoError) throw uploadRectoError;

      // Upload verso
      const { error: uploadVersoError } = await supabase.storage
        .from('id_documents')
        .upload(versoPath, versoFile, { upsert: true });
      if (uploadVersoError) throw uploadVersoError;

      // Mettre à jour users avec les chemins + statut PENDING
      const { data: updatedRow, error: updateError } = await supabase
        .from('users')
        .update({
          id_verification_status: 'PENDING',
          id_card_recto_path: rectoPath,
          id_card_verso_path: versoPath,
        })
        .eq('id', currentUser.id)
        .select('*')
        .single();

      if (updateError) throw updateError;

      setStage('SUCCESS');

      onSuccess({
        ...currentUser,
        id_verification_status: 'PENDING',
        // @ts-ignore si tes types n'ont pas encore ces champs
        id_card_recto_path: rectoPath,
        // @ts-ignore
        id_card_verso_path: versoPath,
      });
    } catch (err: any) {
      console.error('Erreur upload ID:', err);
      setErrorMessage(err.message || "Erreur lors de l'envoi.");
      setStage('ERROR');
    }
  };

  const canSubmit = !!rectoFile && !!versoFile;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-indigo-950/80 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-3xl w-full max-w-lg rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] border border-white/50 overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-indigo-600 transition-all active:scale-90 z-10"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="p-10">
          {(stage === 'IDLE' || stage === 'ERROR') && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-3xl shadow-2xl mb-6 animate-bounce-slow">
                  🪪
                </div>
                <h2 className="text-3xl font-black text-indigo-950 italic tracking-tighter">
                  Sécurité Hôte
                </h2>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2 px-8">
                  Vérification de la CNI requise pour publier
                </p>
              </div>

              {stage === 'ERROR' && (
                <div className="mb-4 p-3 bg-red-100 text-red-600 text-xs font-bold rounded-xl text-center">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-6">
                {/* Zone Recto */}
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-indigo-300 uppercase text-left ml-1">
                    RECTO de la carte
                  </p>
                  {!rectoPreview ? (
                    <div
                      onClick={() => rectoInputRef.current?.click()}
                      className="aspect-video border-4 border-dashed border-indigo-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group relative overflow-hidden"
                    >
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform mb-2">
                        📸
                      </div>
                      <p className="font-black text-indigo-900 text-xs uppercase tracking-widest">
                        Scanner recto
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1 text-center px-6 italic">
                        Utilisez l&apos;appareil photo ou importez un fichier
                      </p>
                      <input
                        ref={rectoInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleRectoChange}
                      />
                    </div>
                  ) : (
                    <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border-2 border-indigo-600 shadow-2xl animate-in zoom-in-95 group">
                      <img
                        src={rectoPreview}
                        className="w-full h-full object-cover"
                        alt="Recto ID Preview"
                      />
                      <button
                        onClick={() => {
                          setRectoPreview(null);
                          setRectoFile(null);
                        }}
                        className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white border border-white/30 hover:bg-rose-500 transition-all"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Zone Verso */}
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-indigo-300 uppercase text-left ml-1">
                    VERSO de la carte
                  </p>
                  {!versoPreview ? (
                    <div
                      onClick={() => versoInputRef.current?.click()}
                      className="aspect-video border-4 border-dashed border-indigo-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group relative overflow-hidden"
                    >
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform mb-2">
                        📸
                      </div>
                      <p className="font-black text-indigo-900 text-xs uppercase tracking-widest">
                        Scanner verso
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1 text-center px-6 italic">
                        Utilisez l&apos;appareil photo ou importez un fichier
                      </p>
                      <input
                        ref={versoInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleVersoChange}
                      />
                    </div>
                  ) : (
                    <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border-2 border-indigo-600 shadow-2xl animate-in zoom-in-95 group">
                      <img
                        src={versoPreview}
                        className="w-full h-full object-cover"
                        alt="Verso ID Preview"
                      />
                      <button
                        onClick={() => {
                          setVersoPreview(null);
                          setVersoFile(null);
                        }}
                        className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white border border-white/30 hover:bg-rose-500 transition-all"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 flex items-start gap-4">
                  <span className="text-2xl">🔒</span>
                  <p className="text-[9px] font-black text-indigo-400 leading-relaxed uppercase tracking-tight">
                    Vos documents sont stockés dans un coffre-fort numérique
                    sécurisé. Seule l&apos;équipe LOCADZ (admin) peut les
                    examiner pour validation.
                  </p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-3 group"
                >
                  DÉMARRER L&apos;ENVOI
                </button>
              </div>
            </div>
          )}

          {stage === 'SCANNING' && (
            <div className="py-20 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
              <div className="relative w-48 h-48 mb-12">
                <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-4 overflow-hidden rounded-full">
                  {rectoPreview && (
                    <img
                      src={rectoPreview}
                      className="w-full h-full object-cover grayscale opacity-50"
                      alt="Processing"
                    />
                  )}
                </div>
              </div>
              <h3 className="text-2xl font-black italic text-indigo-950 uppercase tracking-tighter">
                Envoi Sécurisé...
              </h3>
            </div>
          )}

          {stage === 'SUCCESS' && (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-700">
              <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center shadow-2xl mb-8 animate-bounce-slow">
                <svg
                  className="w-16 h-16 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="4"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-4xl font-black text-indigo-950 italic tracking-tighter mb-4">
                Reçu !
              </h2>
              <p className="text-gray-500 font-bold text-xs uppercase tracking-[0.2em] mb-10 px-8 leading-loose">
                Document transmis. En attente de validation.
              </p>
              <button
                onClick={onClose}
                className="w-full py-6 bg-indigo-950 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all"
              >
                TERMINER
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
