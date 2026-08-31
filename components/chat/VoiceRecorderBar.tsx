"use client";

import { useVoiceRecorder } from "@/lib/useVoiceRecorder";
import { Trash2, Pause, Play, Send } from "@/components/icons/fa";
import { useTranslation } from "@/lib/i18n/useTranslation";
import clsx from "clsx";

export function formatVoiceDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

interface Props {
  recorder: ReturnType<typeof useVoiceRecorder>;
  onCancel: () => void;
  onSend: (blob: Blob, durationSeconds: number) => void;
  uploading?: boolean;
}

/** WhatsApp-style active-recording bar — live oscillation, pause/resume, delete, send. Replaces the text input while recording. */
export default function VoiceRecorderBar({ recorder, onCancel, onSend, uploading }: Props) {
  const { state, duration, levels, pause, resume, stop } = recorder;
  const { t } = useTranslation();

  const handleSend = async () => {
    const result = await stop();
    if (result && result.durationSeconds >= 1) {
      onSend(result.blob, result.durationSeconds);
    } else {
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2 border border-brand-200">
      <button
        onClick={onCancel}
        disabled={uploading}
        title={t("chat.voice.deleteRecording")}
        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 disabled:opacity-40"
      >
        <Trash2 size={16} />
      </button>

      {/* Live oscillation */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {state === "recording" && (
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
        )}
        <div className="flex-1 flex items-center gap-[2px] h-6 overflow-hidden">
          {levels.length === 0 ? (
            <span className="text-xs text-gray-400">{t("chat.voice.listening")}</span>
          ) : (
            levels.map((lvl, i) => (
              <span
                key={i}
                className={clsx("w-[3px] rounded-full flex-shrink-0 transition-all duration-75", state === "paused" ? "bg-gray-300" : "bg-brand-500")}
                style={{ height: `${Math.max(15, lvl * 100)}%` }}
              />
            ))
          )}
        </div>
        <span className="text-xs font-medium text-gray-500 flex-shrink-0 tabular-nums">
          {formatVoiceDuration(duration)}
        </span>
      </div>

      <button
        onClick={state === "paused" ? resume : pause}
        disabled={uploading}
        title={state === "paused" ? t("chat.voice.resume") : t("chat.voice.pause")}
        className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors flex-shrink-0 disabled:opacity-40"
      >
        {state === "paused" ? <Play size={12} /> : <Pause size={12} />}
      </button>

      <button
        onClick={handleSend}
        disabled={uploading}
        title={t("chat.voice.send")}
        className="w-8 h-8 rounded-xl bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-60"
      >
        {uploading ? (
          <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <Send size={14} />
        )}
      </button>
    </div>
  );
}
