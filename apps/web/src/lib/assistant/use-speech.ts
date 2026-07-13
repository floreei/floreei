"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Interface mínima do reconhecimento de fala (Web Speech API, não-padrão em TS). */
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
interface SpeechResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
type SpeechCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechCtor;
    webkitSpeechRecognition?: SpeechCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Ditado por voz via Web Speech API (grátis, pt-BR). Emite o texto PARCIAL a
 * cada trecho reconhecido (`interimResults`) — o chamador escreve isso ao vivo
 * no input, como se estivesse sendo digitado. Some quando não suportado.
 */
export function useSpeech(onTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const cbRef = useRef(onTranscript);
  cbRef.current = onTranscript;

  useEffect(() => {
    setSupported(getCtor() !== null);
    return () => recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "pt-BR";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      // Concatena todos os trechos (parciais + finais) → frase completa até aqui.
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i]?.[0]?.transcript ?? "";
      }
      cbRef.current(text.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  return { supported, listening, start, stop };
}
