"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Flower2, Play } from "lucide-react";
import { useState } from "react";
import { resolveVideo, WELCOME_VIDEO_URL } from "@/lib/onboarding/video";

/**
 * Herói das boas-vindas em 16:9. Sem vídeo configurado, mostra uma capa
 * animada da marca (jardim de pétalas). Com a URL preenchida, vira uma capa
 * com play que toca o vídeo (arquivo ou embed) ali mesmo.
 */
export function WelcomeVideo() {
  const reduce = useReducedMotion();
  const video = resolveVideo(WELCOME_VIDEO_URL);
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-primary">
      {/* Fundo: gradiente da marca + pétalas flutuando */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[hsl(var(--clay))]" />
      {!reduce
        ? PETALS.map((p, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-white/15"
              style={{ left: p.left, top: p.top, width: p.size, height: p.size }}
              animate={{ y: [0, -10, 0], opacity: [0.5, 0.9, 0.5] }}
              transition={{
                duration: p.dur,
                repeat: Infinity,
                delay: p.delay,
                ease: "easeInOut",
              }}
            />
          ))
        : null}

      <AnimatePresence mode="wait">
        {video && playing ? (
          <motion.div
            key="player"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {video.kind === "file" ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video
                src={video.src}
                controls
                autoPlay
                className="h-full w-full bg-black object-contain"
              />
            ) : (
              <iframe
                src={video.src}
                title="Boas-vindas ao Floreei"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="cover"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-primary-foreground"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"
              animate={reduce ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Flower2 className="h-7 w-7" />
            </motion.span>

            {video ? (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className="group inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-primary shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Play className="h-4 w-4 fill-primary" />
                Assista em 1 minuto
              </button>
            ) : (
              <p className="max-w-[16rem] text-sm font-medium text-white/90">
                Sua floricultura, organizada num lugar só.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const PETALS = [
  { left: "12%", top: "22%", size: 10, dur: 5, delay: 0 },
  { left: "78%", top: "18%", size: 14, dur: 6, delay: 0.6 },
  { left: "30%", top: "70%", size: 8, dur: 4.5, delay: 1.1 },
  { left: "64%", top: "62%", size: 12, dur: 5.5, delay: 0.3 },
  { left: "46%", top: "34%", size: 7, dur: 5, delay: 1.4 },
];
