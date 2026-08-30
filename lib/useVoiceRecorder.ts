"use client";

import { useCallback, useRef, useState } from "react";

export type RecorderState = "idle" | "recording" | "paused" | "stopped";

const MAX_LEVEL_SAMPLES = 40;

/**
 * Drives a WhatsApp-style voice recorder: mic capture via MediaRecorder,
 * live amplitude samples (for an animated oscillation bar while recording)
 * via a Web Audio AnalyserNode, and pause/resume/discard controls.
 */
export function useVoiceRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [duration, setDuration] = useState(0);
  const [levels, setLevels] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedBeforePauseRef = useRef(0);
  const segmentStartRef = useRef(0);

  const tickLevels = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(data);
    let sumSquares = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sumSquares += v * v;
    }
    const rms = Math.sqrt(sumSquares / data.length);
    setLevels((prev) => {
      const next = [...prev, Math.min(1, rms * 4.5)];
      return next.length > MAX_LEVEL_SAMPLES ? next.slice(next.length - MAX_LEVEL_SAMPLES) : next;
    });
    rafRef.current = requestAnimationFrame(tickLevels);
  }, []);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const cleanup = () => {
    stopTimer();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
  };

  const start = useCallback(async () => {
    setError(null);
    setLevels([]);
    setDuration(0);
    elapsedBeforePauseRef.current = 0;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : undefined;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      recorderRef.current = recorder;

      const AudioCtxCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtxCtor();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      tickLevels();

      segmentStartRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(elapsedBeforePauseRef.current + (Date.now() - segmentStartRef.current) / 1000);
      }, 200);

      setState("recording");
    } catch {
      setError("Microphone access denied — allow it in your browser settings to record a voice message.");
      setState("idle");
    }
  }, [tickLevels]);

  const pause = useCallback(() => {
    if (recorderRef.current?.state !== "recording") return;
    recorderRef.current.pause();
    elapsedBeforePauseRef.current += (Date.now() - segmentStartRef.current) / 1000;
    stopTimer();
    setState("paused");
  }, []);

  const resume = useCallback(() => {
    if (recorderRef.current?.state !== "paused") return;
    recorderRef.current.resume();
    segmentStartRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setDuration(elapsedBeforePauseRef.current + (Date.now() - segmentStartRef.current) / 1000);
    }, 200);
    tickLevels();
    setState("recording");
  }, [tickLevels]);

  /** Finalizes the recording and resolves with the audio blob + its duration in seconds. */
  const stop = useCallback((): Promise<{ blob: Blob; durationSeconds: number } | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }
      const finalDuration = elapsedBeforePauseRef.current + (recorder.state === "recording" ? (Date.now() - segmentStartRef.current) / 1000 : 0);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        cleanup();
        setState("stopped");
        resolve({ blob, durationSeconds: finalDuration });
      };
      recorder.stop();
    });
  }, []);

  /** Cancels the in-progress recording and discards everything captured so far. */
  const discard = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    cleanup();
    chunksRef.current = [];
    setLevels([]);
    setDuration(0);
    setState("idle");
  }, []);

  /** Resets back to idle after a completed send, ready to record again. */
  const reset = useCallback(() => {
    chunksRef.current = [];
    setLevels([]);
    setDuration(0);
    setState("idle");
  }, []);

  return { state, duration, levels, error, start, pause, resume, stop, discard, reset };
}
