"use client";
import { useState, useEffect } from "react";
import { ChevronLeft, Loader2, Play, AlertCircle } from "lucide-react";

type Episode = { id: string; title: string; container_extension: string; episode_num: number; info?: { plot?: string; releasedate?: string; rating?: string; movie_image?: string } };
type SeasonEpisodes = Record<string, Episode[]>;

interface Props {
  seriesId: number;
  seriesName: string;
  host: string;
  user: string;
  pass: string;
  onBack: () => void;
  onPlay: (url: string, title: string) => void;
}

export default function SeriesDetail({ seriesId, seriesName, host, user, pass, onBack, onPlay }: Props) {
  const [seasons, setSeasons] = useState<SeasonEpisodes>({});
  const [selSeason, setSelSeason] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load on mount
  useEffect(() => {
    const load = async () => {
      try {
        const url = `/api/xtream?host=${encodeURIComponent(host)}&username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}&action=get_series_info&series_id=${seriesId}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`فشل الاتصال (${res.status})`);
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        let eps: SeasonEpisodes = {};
        if (data.episodes && typeof data.episodes === 'object' && !Array.isArray(data.episodes)) {
          eps = data.episodes;
        } else if (Array.isArray(data.episodes)) {
          (data.episodes as Episode[]).forEach(ep => {
            const s = String((ep as any).season || 1);
            if (!eps[s]) eps[s] = [];
            eps[s].push(ep);
          });
        }

        setSeasons(eps);
        const keys = Object.keys(eps).sort((a, b) => Number(a) - Number(b));
        if (keys.length > 0) setSelSeason(keys[0]);
        else setError('هذا المسلسل لا يحتوي على حلقات متاحة من السيرفر');
      } catch (e: any) {
        setError(e.message || 'خطأ في تحميل الحلقات');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [seriesId, host, user, pass]);

  const playEpisode = (ep: Episode) => {
    const url = `${host}/series/${user}/${pass}/${ep.id}.${ep.container_extension || "mkv"}`;
    onPlay(url, `${seriesName} - الحلقة ${ep.episode_num}`);
  };

  const seasonKeys = Object.keys(seasons).sort((a, b) => Number(a) - Number(b));
  const currentEps = (seasons[selSeason] || []).sort((a, b) => a.episode_num - b.episode_num);

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "1rem" }}>
      <Loader2 size={36} color="#a855f7" style={{ animation: "spin 1s linear infinite" }} />
      <span style={{ color: "#888", fontSize: "0.9rem" }}>جاري تحميل الحلقات...</span>
    </div>
  );

  if (error) return (
    <div style={{ margin: "2rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem", color: "#f87171" }}>
      <AlertCircle size={20} />{error}
    </div>
  );

  return (
    <div>
      {/* Back + Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <button onClick={onBack} style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "8px", padding: "0.35rem 0.65rem", cursor: "pointer", color: "#c084fc", display: "flex", alignItems: "center" }}>
          <ChevronLeft size={18} />
        </button>
        <h2 style={{ margin: 0, fontSize: "1.05rem", color: "white" }}>{seriesName}</h2>
      </div>

      {/* Season Tabs */}
      {seasonKeys.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          {seasonKeys.map(s => (
            <button key={s} onClick={() => setSelSeason(s)} style={{
              padding: "0.45rem 1rem", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "0.85rem",
              background: selSeason === s ? "linear-gradient(135deg,#a855f7,#6366f1)" : "rgba(255,255,255,0.07)",
              color: selSeason === s ? "white" : "#888", fontWeight: selSeason === s ? "bold" : "normal",
              transition: "all 0.2s"
            }}>
              الموسم {s}
            </button>
          ))}
        </div>
      )}

      {/* Episodes */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {currentEps.length === 0 && <div style={{ color: "#555", padding: "2rem", textAlign: "center" }}>لا توجد حلقات</div>}
        {currentEps.map(ep => (
          <button key={ep.id} onClick={() => playEpisode(ep)} style={{
            display: "flex", alignItems: "center", gap: "1rem",
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px", padding: "0.85rem 1rem", cursor: "pointer",
            textAlign: "right", transition: "all 0.2s"
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(168,85,247,0.15)"; e.currentTarget.style.borderColor = "rgba(168,85,247,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
            {ep.info?.movie_image ? (
              <img src={ep.info.movie_image} alt="" style={{ width: 80, height: 50, objectFit: "cover", borderRadius: "6px", flexShrink: 0 }} onError={e => (e.currentTarget.style.display = "none")} />
            ) : (
              <div style={{ width: 80, height: 50, background: "rgba(168,85,247,0.2)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Play size={18} color="#a855f7" />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ color: "white", fontSize: "0.88rem", fontWeight: "600" }}>الحلقة {ep.episode_num}{ep.title && ep.title !== String(ep.episode_num) ? ` - ${ep.title}` : ""}</div>
              {ep.info?.plot && <div style={{ color: "#777", fontSize: "0.75rem", marginTop: "0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "400px" }}>{ep.info.plot}</div>}
              {ep.info?.releasedate && <div style={{ color: "#555", fontSize: "0.7rem", marginTop: "0.1rem" }}>{ep.info.releasedate}</div>}
            </div>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(168,85,247,0.8)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Play size={15} color="white" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
