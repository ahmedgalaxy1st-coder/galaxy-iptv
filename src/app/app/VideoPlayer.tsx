"use client";

import { useEffect, useRef, useState } from "react";
import { X, Volume2, VolumeX, Maximize, Loader2, AlertCircle } from "lucide-react";

type Props = {
  streamUrl: string;
  title: string;
  onClose: () => void;
};

export default function VideoPlayer({ streamUrl, title, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    const video = videoRef.current;
    setLoading(true);
    setError("");

    const isHls = streamUrl.includes(".m3u8") || streamUrl.includes("/live/") || streamUrl.includes("type=m3u_plus");

    const setupPlayer = async () => {
      if (isHls) {
        // Dynamically import hls.js only in browser
        const Hls = (await import("hls.js")).default;
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setLoading(false);
            video.play().catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (_: any, data: any) => {
            if (data.fatal) {
              setLoading(false);
              setError("تعذر تشغيل البث - " + (data.details || "خطأ غير معروف"));
            }
          });
          return () => hls.destroy();
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          // Native HLS (Safari)
          video.src = streamUrl;
          video.play().catch(() => {});
          setLoading(false);
        }
      } else {
        // Direct MP4 / TS
        video.src = streamUrl;
        video.play().catch(() => {});
        setLoading(false);
      }
    };

    const cleanup = setupPlayer();
    return () => { cleanup.then(fn => fn && fn()); };
  }, [streamUrl]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.95)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center"
    }}>
      {/* Top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "0.75rem 1rem",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)",
        display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10
      }}>
        <span style={{ color: "white", fontSize: "0.95rem", fontWeight: "bold" }}>{title}</span>
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.15)", border: "none",
          borderRadius: "50%", width: 36, height: 36,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "white"
        }}>
          <X size={18} />
        </button>
      </div>

      {/* Video */}
      <video
        ref={videoRef}
        muted={muted}
        controls
        style={{ width: "100%", maxHeight: "100vh", background: "#000" }}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
        onError={() => { setLoading(false); setError("تعذر تشغيل هذا المحتوى"); }}
      />

      {/* Loading overlay */}
      {loading && !error && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "1rem"
        }}>
          <Loader2 size={48} color="#a855f7" style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ color: "#ccc", fontSize: "0.9rem" }}>جاري تحميل البث...</span>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "1rem"
        }}>
          <AlertCircle size={48} color="#f87171" />
          <span style={{ color: "#f87171", fontSize: "0.9rem", textAlign: "center", maxWidth: 300 }}>{error}</span>
          <button onClick={onClose} style={{
            padding: "0.6rem 1.5rem", borderRadius: "8px",
            background: "rgba(168,85,247,0.8)", border: "none",
            color: "white", cursor: "pointer", fontSize: "0.9rem"
          }}>إغلاق</button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
