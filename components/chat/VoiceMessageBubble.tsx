"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause } from "@/components/icons/fa";
import { formatVoiceDuration } from "@/components/chat/VoiceRecorderBar";
import clsx from "clsx";

const BAR_COUNT = 32;

/** Deterministic pseudo-waveform seeded by message id — real per-sample decoding isn't possible cross-origin from MinIO, but a stable per-message shape still reads as a genuine voice note. */
function seededBars(seed: string): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const bars: number[] = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    bars.push(0.25 + (h % 1000) / 1000 * 0.75);
  }
  return bars;
}

interface Props {
  url: string;
  durationSeconds?: number | null;
  messageId: string;
  variant: "sent" | "received";
}

/** WhatsApp-style voice message playback bubble — waveform, play/pause, elapsed/total time. */
export default function VoiceMessageBubble({ url, durationSeconds, messageId, variant }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const bars = useMemo(() => seededBars(messageId), [messageId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setCurrentTime(0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => {});
      setPlaying(true);
    }
  };

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const playedBars = Math.round(progress * BAR_COUNT);
  const sent = variant === "sent";

  return (
    <div className="flex items-center gap-2 min-w-[190px]">
      <audio ref={audioRef} src={url} preload="metadata" />
      <button
        onClick={toggle}
        className={clsx(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
          sent ? "bg-white/25 text-white hover:bg-white/35" : "bg-brand-500 text-white hover:bg-brand-600"
        )}
      >
        {playing ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
      </button>

      <div className="flex-1 flex items-center gap-[2px] h-6">
        {bars.map((h, i) => (
          <span
            key={i}
            className={clsx(
              "w-[3px] rounded-full flex-shrink-0",
              i < playedBars
                ? sent ? "bg-white" : "bg-brand-500"
                : sent ? "bg-white/40" : "bg-gray-300"
            )}
            style={{ height: `${Math.max(15, h * 100)}%` }}
          />
        ))}
      </div>

      <span className={clsx("text-[10px] tabular-nums flex-shrink-0", sent ? "text-white/80" : "text-gray-400")}>
        {formatVoiceDuration(playing || currentTime > 0 ? currentTime : duration)}
      </span>
    </div>
  );
}
