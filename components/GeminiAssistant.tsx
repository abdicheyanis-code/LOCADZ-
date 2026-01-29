import React, { useState, useRef, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";

// --------------------
// CONFIG GEMINI
// --------------------

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

// On ne crée le client que si la clé existe
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

if (!apiKey) {
  console.warn(
    "VITE_GEMINI_API_KEY est manquante. Le concierge LOCADZ sera désactivé (mais l'app continuera de fonctionner)."
  );
}

type LocationContext = { lat: number; lng: number };

// --------------------
// FONCTIONS UTILITAIRES
// --------------------

export const getTravelAdvice = async (
  userPrompt: string,
  locationContext?: LocationContext
) => {
  if (!ai) {
    return {
      text:
        "Le concierge LOCADZ n'est pas disponible pour le moment (clé API manquante).",
      sources: [],
    };
  }

  try {
    const config: any = {
      tools: [{ googleSearch: {} }],
      // IMPORTANT : limiter la taille + rendre la réponse plus contrôlée
      generationConfig: {
        maxOutputTokens: 180, // évite les pavés de texte
        temperature: 0.4, // plus logique, moins créatif
      },
    };

    if (locationContext) {
      config.tools.push({ googleMaps: {} });
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: locationContext.lat,
            longitude: locationContext.lng,
          },
        },
      };
    }

    const response: any = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
Tu es le Concierge Elite de LOCADZ en Algérie.

Requête utilisateur (en français) :
"${userPrompt}"

Contexte géographique : ${
        locationContext
          ? `Latitude ${locationContext.lat}, Longitude ${locationContext.lng}`
          : "Algérie (sans précision)"
      }.

CONSIGNES STRICTES :
1. Réponds UNIQUEMENT à la demande de l'utilisateur, ne pars pas hors-sujet.
2. Réponse courte : 3 à 5 phrases maximum, pas de grands paragraphes.
3. Si tu proposes des lieux (restaurants, banques, services...), donne des recommandations RÉALISTES pour l'Algérie.
4. Si tu n'es pas sûr, dis-le clairement plutôt que d'inventer.
5. Si possible, structure avec des tirets ou une petite liste très courte.
`,
      config,
    });

    const text = response.text;
    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return {
      text,
      sources: groundingChunks
        .map((chunk: any) => {
          if (chunk.web) return { title: chunk.web.title, uri: chunk.web.uri };
          if (chunk.maps)
            return { title: chunk.maps.title, uri: chunk.maps.uri };
          return null;
        })
        .filter(Boolean),
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: "Désolé, je rencontre une difficulté technique.",
      sources: [],
    };
  }
};

export const parseSmartSearch = async (
  query: string,
  categories: string[]
) => {
  if (!ai) {
    return "trending";
  }

  try {
    const response: any = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyse cette recherche : "${query}". 
Catégories possibles : [${categories.join(
        ", "
      )}]. Retourne uniquement l'ID de catégorie la plus pertinente. 
Réponds par un seul mot (l'ID), en minuscules.`,
    });

    return response.text?.trim().toLowerCase();
  } catch (error) {
    console.error("SmartSearch error:", error);
    return "trending";
  }
};

// --------------------
// COMPOSANT REACT : CHAT ASSISTANT
// --------------------

type ChatMessage = {
  from: "user" | "assistant";
  text: string;
  sources?: { title: string; uri: string }[];
};

type GeminiAssistantProps = {
  currentProperty?: any;
};

export const GeminiAssistant: React.FC<GeminiAssistantProps> = ({
  currentProperty,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const hasAi = !!apiKey;

  // Scroll auto vers le bas quand un nouveau message arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Essaie d'extraire des coords si dispo dans currentProperty
  const deriveLocation = (): LocationContext | undefined => {
    if (!currentProperty) return undefined;

    if (
      typeof currentProperty.lat === "number" &&
      typeof currentProperty.lng === "number"
    ) {
      return { lat: currentProperty.lat, lng: currentProperty.lng };
    }

    if (
      currentProperty.location &&
      typeof currentProperty.location.lat === "number" &&
      typeof currentProperty.location.lng === "number"
    ) {
      return {
        lat: currentProperty.location.lat,
        lng: currentProperty.location.lng,
      };
    }

    return undefined;
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Ajoute le message utilisateur
    setMessages((prev) => [...prev, { from: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const locationContext = deriveLocation();
      const result = await getTravelAdvice(trimmed, locationContext);

      setMessages((prev) => [
        ...prev,
        {
          from: "assistant",
          text: result.text,
          sources: result.sources as { title: string; uri: string }[],
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          from: "assistant",
          text: "Désolé, je rencontre une difficulté technique.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <div className="flex flex-col text-sm text-white max-h-[60vh]">
      {/* ZONE MESSAGES */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-xs text-white/60">
            Pose une question claire sur le bien, le quartier, la sécurité,
            les services à proximité, les transports, etc.
          </div>
        )}

        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${
              m.from === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                m.from === "user"
                  ? "bg-indigo-500 text-white"
                  : "bg-white/10 text-white"
              }`}
            >
              <div className="whitespace-pre-wrap leading-snug">{m.text}</div>

              {m.sources && m.sources.length > 0 && (
                <div className="mt-2 space-y-1 text-[11px] text-indigo-200">
                  {m.sources.map((s, i) => (
                    <div key={i}>
                      <a
                        href={s.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        {s.title || s.uri}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-xs text-white/60">L’assistant rédige...</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* BARRE DE SAISIE */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-white/10 bg-black/40 p-3 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            hasAi
              ? "Pose une question précise (ex : sécurité, commerces, transports...)"
              : "Assistant désactivé : clé API manquante."
          }
          disabled={!hasAi || loading}
          className="flex-1 rounded-full bg-black/40 border border-white/20 px-3 py-2 text-xs outline-none placeholder:text-white/40"
        />
        <button
          type="submit"
          disabled={!hasAi || loading || !input.trim()}
          className="rounded-full bg-indigo-500 hover:bg-indigo-400 disabled:bg-white/10 px-3 py-2 text-xs font-medium"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
};
