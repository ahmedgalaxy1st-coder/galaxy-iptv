"use client";
import { useEffect, useState, useCallback } from "react";
import { Tv, Film, MonitorPlay, Settings, LogOut, MessageCircle, Home, ChevronLeft, Play, Star, Save, CheckCircle, Loader2, Clock, User, AlertCircle } from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import SeriesDetail from "./SeriesDetail";
import "../globals.css";

type ContentType = "live"|"movies"|"series";
type Category = { category_id: string; category_name: string };
type StreamItem = { stream_id?: number; series_id?: number; name: string; stream_icon?: string; cover?: string; rating?: any; year?: string; container_extension?: string };
type View = "home"|"content"|"settings";

const LS = {
  get: (k: string, def: any) => { try { return JSON.parse(localStorage.getItem(k)||"null")||def; } catch { return def; } },
  set: (k: string, v: any) => localStorage.setItem(k, JSON.stringify(v))
};
const actionMap: Record<ContentType, string> = { live:"get_live_categories", movies:"get_vod_categories", series:"get_series_categories" };
const itemActionMap: Record<ContentType, string> = { live:"get_live_streams", movies:"get_vod_streams", series:"get_series" };
const GRADS = ["linear-gradient(135deg,#667eea,#764ba2)","linear-gradient(135deg,#f093fb,#f5576c)","linear-gradient(135deg,#4facfe,#00f2fe)","linear-gradient(135deg,#43e97b,#38f9d7)","linear-gradient(135deg,#fa709a,#fee140)","linear-gradient(135deg,#a18cd1,#fbc2eb)"];

// ── Translations
const TR = {
  ar: { home:"الرئيسية", live:"مباشر", movies:"أفلام", series:"مسلسلات", settings:"إعدادات", logout:"خروج", support:"دعم واتساب", expiry:"انتهاء الاشتراك", lang:"لغة التطبيق", streamFmt:"نمط البث", saveBtn:"حفظ الإعدادات", saved:"تم الحفظ!", accountInfo:"معلومات الحساب", noContent:"لا يوجد محتوى", loading:"جاري التحميل...", selectCat:"اختر قسماً من القائمة", liveLabel:"البث المباشر", moviesLabel:"الأفلام", seriesLabel:"المسلسلات", liveDesc:"قنوات عربية ورياضية وإخبارية", moviesDesc:"أحدث الأفلام العربية والأجنبية", seriesDesc:"مسلسلات عربية وتركية وكورية" },
  en: { home:"Home", live:"Live", movies:"Movies", series:"Series", settings:"Settings", logout:"Logout", support:"WhatsApp Support", expiry:"Subscription Expiry", lang:"App Language", streamFmt:"Stream Format", saveBtn:"Save Settings", saved:"Saved!", accountInfo:"Account Info", noContent:"No content available", loading:"Loading...", selectCat:"Select a category from the list", liveLabel:"Live TV", moviesLabel:"Movies", seriesLabel:"Series", liveDesc:"Arabic, Sports & News channels", moviesDesc:"Latest Arabic & foreign movies", seriesDesc:"Arabic, Turkish & Korean series" },
};

function buildStreamUrl(host: string, user: string, pass: string, type: ContentType, item: StreamItem) {
  const id = item.stream_id || item.series_id;
  if (type === "live") return `${host}/live/${user}/${pass}/${id}.m3u8`;
  if (type === "movies") return `${host}/movie/${user}/${pass}/${id}.${item.container_extension||"mp4"}`;
  return `${host}/series/${user}/${pass}/${id}.${item.container_extension||"mkv"}`;
}

export default function App() {
  const [view, setView] = useState<View>("home");
  const [ct, setCt] = useState<ContentType>("live");
  const [selCat, setSelCat] = useState<Category|null>(null);
  const [appCfg, setAppCfg] = useState<any>({});
  const [userCfg, setUserCfg] = useState<{lang:"ar"|"en"; streamFormat:string}>({ lang:"ar", streamFormat:"m3u8" });
  const [selSeries, setSelSeries] = useState<StreamItem|null>(null);
  const [saved, setSaved] = useState(false);
  const [cats, setCats] = useState<Category[]>([]);
  const [items, setItems] = useState<StreamItem[]>([]);
  const [loadCat, setLoadCat] = useState(false);
  const [loadItem, setLoadItem] = useState(false);
  const [catErr, setCatErr] = useState("");
  const [itemErr, setItemErr] = useState("");
  const [expiry, setExpiry] = useState("");
  const [user, setUser] = useState("");
  const [host, setHost] = useState("");
  const [pass, setPass] = useState("");
  const [playerUrl, setPlayerUrl] = useState("");
  const [playerTitle, setPlayerTitle] = useState("");

  const lang = userCfg.lang;
  const t = TR[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    const u = sessionStorage.getItem("user"); if (!u) { window.location.href = "/"; return; }
    setUser(u);
    setPass(sessionStorage.getItem("pass")||"" );
    setHost(sessionStorage.getItem("host")||"" );
    setExpiry(sessionStorage.getItem("expiry")||"" );
    // load saved user settings
    const saved = LS.get("galaxy_user_settings", { lang:"ar", streamFormat:"m3u8" });
    setUserCfg(saved);
    fetch("/api/settings").then(r=>r.json()).then(setAppCfg).catch(()=>{});
  }, []);

  const xtream = (action: string, extra = "") =>
    `/api/xtream?host=${encodeURIComponent(host)}&username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}&action=${action}${extra}`;

  const openSection = useCallback(async (type: ContentType) => {
    setCt(type); setView("content"); setSelCat(null); setItems([]);
    setCats([]); setCatErr(""); setLoadCat(true);
    try {
      const d = await fetch(xtream(actionMap[type])).then(r=>r.json());
      setCats(Array.isArray(d) ? d : []);
    } catch (e: any) { setCatErr(e.message||"خطأ"); }
    finally { setLoadCat(false); }
  }, [host, user, pass]);

  const openItems = useCallback(async (cat: Category) => {
    setSelCat(cat); setSelSeries(null); setItems([]); setItemErr(""); setLoadItem(true);
    try {
      const d = await fetch(xtream(itemActionMap[ct], `&category_id=${cat.category_id}`)).then(r=>r.json());
      setItems(Array.isArray(d) ? d : []);
    } catch (e: any) { setItemErr(e.message||"خطأ"); }
    finally { setLoadItem(false); }
  }, [host, user, pass, ct]);

  const playItem = (item: StreamItem) => {
    if (ct === "series") {
      setSelSeries(item);
    } else {
      setPlayerUrl(buildStreamUrl(host, user, pass, ct, item));
      setPlayerTitle(item.name);
    }
  };

  const saveSettings = () => { LS.set("galaxy_user_settings", userCfg); setSaved(true); setTimeout(()=>setSaved(false),3000); };
  const logout = () => { sessionStorage.clear(); window.location.href = "/"; };

  const Spin = () => (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"3rem",gap:"0.75rem"}}>
      <Loader2 size={32} color="#a855f7" style={{animation:"spin 1s linear infinite"}}/>
      <span style={{color:"#888",fontSize:"0.85rem"}}>{t.loading}</span>
    </div>
  );
  const Err = ({msg}: {msg:string}) => (
    <div style={{margin:"1.5rem",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:"10px",padding:"1rem",display:"flex",alignItems:"center",gap:"0.6rem",color:"#f87171",fontSize:"0.85rem"}}>
      <AlertCircle size={18}/>{msg}
    </div>
  );

  const navItems = [
    { id:"home" as const, icon:<Home size={19}/>, label:t.home, action:()=>setView("home") },
    { id:"live" as ContentType, icon:<Tv size={19}/>, label:t.live, action:()=>openSection("live") },
    { id:"movies" as ContentType, icon:<Film size={19}/>, label:t.movies, action:()=>openSection("movies") },
    { id:"series" as ContentType, icon:<MonitorPlay size={19}/>, label:t.series, action:()=>openSection("series") },
    { id:"settings" as const, icon:<Settings size={19}/>, label:t.settings, action:()=>setView("settings") },
  ];

  const isNavActive = (id: string) => {
    if (id==="home") return view==="home";
    if (id==="settings") return view==="settings";
    return view==="content" && ct===id;
  };

  return (
    <div style={{minHeight:"100vh",background:"#0d0d18",color:"white",fontFamily:"'Segoe UI',Tahoma,Arial,sans-serif",direction:dir,display:"flex"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#a855f7;border-radius:3px}`}</style>

      {playerUrl && <VideoPlayer streamUrl={playerUrl} title={playerTitle} onClose={()=>setPlayerUrl("")}/>}

      {/* ── Nav Sidebar */}
      <aside style={{width:200,flexShrink:0,background:"rgba(255,255,255,0.03)",borderLeft: dir==="rtl"?"none":"1px solid rgba(168,85,247,0.12)",borderRight: dir==="rtl"?"1px solid rgba(168,85,247,0.12)":"none",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
        {/* Logo */}
        <div style={{padding:"1.25rem 1rem",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",flexDirection:"column",alignItems:"center",gap:"0.5rem"}}>
          {appCfg.logoUrl ? (
            <img src={appCfg.logoUrl} alt="logo" style={{width:56,height:56,objectFit:"contain"}}/>
          ) : (
            <div style={{width:56,height:56,background:"linear-gradient(135deg,#a855f7,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"12px",fontSize:"1.5rem"}}>📺</div>
          )}
          <div style={{fontWeight:"700",fontSize:"0.88rem",textAlign:"center"}}>{appCfg.appName||"Galaxy IPTV"}</div>
          <div style={{fontSize:"0.68rem",color:"#555",display:"flex",alignItems:"center",gap:"0.25rem"}}><User size={9}/>{user}</div>
        </div>

        {/* Nav */}
        <nav style={{flex:1,padding:"0.75rem",display:"flex",flexDirection:"column",gap:"0.25rem"}}>
          {navItems.map(n=>(
            <button key={n.id} onClick={n.action} style={{width:"100%",padding:"0.65rem 0.85rem",display:"flex",alignItems:"center",gap:"0.6rem",background:isNavActive(n.id)?"rgba(168,85,247,0.2)":"transparent",border:isNavActive(n.id)?"1px solid rgba(168,85,247,0.35)":"1px solid transparent",borderRadius:"9px",color:isNavActive(n.id)?"#c084fc":"#666",cursor:"pointer",fontSize:"0.85rem",textAlign:dir==="rtl"?"right":"left",transition:"all 0.2s"}}>
              {n.icon}{n.label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{padding:"0.75rem",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",flexDirection:"column",gap:"0.4rem"}}>
          {expiry && <div style={{fontSize:"0.68rem",color:"#555",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.25rem"}}><Clock size={9}/>{t.expiry}: <span style={{color:"#a855f7"}}>{expiry}</span></div>}
          {appCfg.whatsappVisible && appCfg.whatsappNumber && (
            <a href={`https://wa.me/${appCfg.whatsappNumber}`} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.5rem 0.75rem",background:"rgba(37,211,102,0.1)",border:"1px solid rgba(37,211,102,0.2)",borderRadius:"8px",color:"#4ade80",textDecoration:"none",fontSize:"0.78rem",justifyContent:"center"}}>
              <MessageCircle size={13}/>{t.support}
            </a>
          )}
          <button onClick={logout} style={{padding:"0.5rem",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:"8px",color:"#f87171",cursor:"pointer",fontSize:"0.78rem",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem"}}>
            <LogOut size={13}/>{t.logout}
          </button>
        </div>
      </aside>

      {/* ── Categories Panel (visible only in content view) */}
      {view==="content" && (
        <div style={{width:210,flexShrink:0,borderLeft: dir==="rtl"?"none":"1px solid rgba(255,255,255,0.06)",borderRight: dir==="rtl"?"1px solid rgba(255,255,255,0.06)":"none",background:"rgba(0,0,0,0.2)",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
          <div style={{padding:"0.85rem 1rem",borderBottom:"1px solid rgba(255,255,255,0.06)",fontSize:"0.8rem",color:"#9ca3af",fontWeight:"600",display:"flex",alignItems:"center",gap:"0.4rem"}}>
            {ct==="live"?<Tv size={14}/>:ct==="movies"?<Film size={14}/>:<MonitorPlay size={14}/>}
            {ct==="live"?t.liveLabel:ct==="movies"?t.moviesLabel:t.seriesLabel}
          </div>
          {loadCat ? <Spin/> : catErr ? <Err msg={catErr}/> : (
            <div style={{flex:1,overflowY:"auto",padding:"0.5rem"}}>
              {cats.length===0 && <div style={{color:"#555",fontSize:"0.82rem",padding:"1.5rem",textAlign:"center"}}>لا توجد أقسام</div>}
              {cats.map(cat=>(
                <button key={cat.category_id} onClick={()=>openItems(cat)} style={{width:"100%",padding:"0.6rem 0.85rem",background:selCat?.category_id===cat.category_id?"rgba(168,85,247,0.2)":"transparent",border:selCat?.category_id===cat.category_id?"1px solid rgba(168,85,247,0.35)":"1px solid transparent",borderRadius:"8px",color:selCat?.category_id===cat.category_id?"#c084fc":"#bbb",cursor:"pointer",fontSize:"0.82rem",textAlign:dir==="rtl"?"right":"left",marginBottom:"0.15rem",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all 0.15s"}}
                  onMouseEnter={e=>{if(selCat?.category_id!==cat.category_id){e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.color="#fff";}}}
                  onMouseLeave={e=>{if(selCat?.category_id!==cat.category_id){e.currentTarget.style.background="transparent";e.currentTarget.style.color="#bbb";}}}>
                  <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cat.category_name}</span>
                  <ChevronLeft size={13} color="#555" style={{flexShrink:0,transform:dir==="rtl"?"none":"rotate(180deg)"}}/>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Main Content */}
      <main style={{flex:1,display:"flex",flexDirection:"column",minHeight:"100vh",overflowY:"auto"}}>
        {/* Top bar */}
        <div style={{padding:"0.85rem 1.25rem",borderBottom:"1px solid rgba(255,255,255,0.06)",position:"sticky",top:0,background:"rgba(13,13,24,0.97)",backdropFilter:"blur(20px)",zIndex:10,display:"flex",alignItems:"center",gap:"0.75rem"}}>
          <h1 style={{margin:0,fontSize:"1rem",fontWeight:"700",color:"white",flex:1}}>
            {view==="home" ? (appCfg.appName||"Galaxy IPTV")
              : view==="settings" ? t.settings
              : selSeries ? selSeries.name
              : selCat ? selCat.category_name
              : (ct==="live"?t.liveLabel:ct==="movies"?t.moviesLabel:t.seriesLabel)}
          </h1>
          {view==="content" && selCat && items.length>0 && <span style={{fontSize:"0.75rem",color:"#555"}}>{items.length}</span>}
        </div>

        <div style={{padding:"1.25rem",flex:1}}>

          {/* HOME */}
          {view==="home" && (
            <div>
              <div style={{background:"rgba(168,85,247,0.08)",border:"1px solid rgba(168,85,247,0.2)",borderRadius:"12px",padding:"0.85rem 1.1rem",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.75rem"}}>
                <span style={{color:"#9ca3af",fontSize:"0.82rem",display:"flex",alignItems:"center",gap:"0.35rem"}}><Clock size={13}/>{t.expiry}</span>
                <span style={{color:"#a855f7",fontWeight:"bold",fontSize:"0.88rem"}}>{expiry||"..."}</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"1.1rem"}}>
                {([
                  {type:"live" as ContentType,label:t.liveLabel,sub:t.liveDesc,icon:"📡",grad:"linear-gradient(135deg,#667eea,#764ba2)"},
                  {type:"movies" as ContentType,label:t.moviesLabel,sub:t.moviesDesc,icon:"🎬",grad:"linear-gradient(135deg,#f093fb,#f5576c)"},
                  {type:"series" as ContentType,label:t.seriesLabel,sub:t.seriesDesc,icon:"🎭",grad:"linear-gradient(135deg,#4facfe,#00f2fe)"},
                ]).map(c=>(
                  <button key={c.type} onClick={()=>openSection(c.type)} style={{background:c.grad,border:"none",borderRadius:"18px",padding:"1.75rem 1.25rem",cursor:"pointer",textAlign:"center",boxShadow:"0 8px 25px rgba(0,0,0,0.35)",transition:"transform 0.15s"}}
                    onMouseEnter={e=>(e.currentTarget.style.transform="scale(1.03)")} onMouseLeave={e=>(e.currentTarget.style.transform="scale(1)")}>
                    <div style={{fontSize:"2.2rem",marginBottom:"0.6rem"}}>{c.icon}</div>
                    <div style={{color:"white",fontWeight:"bold",fontSize:"1rem"}}>{c.label}</div>
                    <div style={{color:"rgba(255,255,255,0.75)",fontSize:"0.78rem",marginTop:"0.25rem"}}>{c.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SERIES DETAIL */}
          {view==="content" && selSeries && ct==="series" && (
            <SeriesDetail
              seriesId={selSeries.series_id!}
              seriesName={selSeries.name}
              host={host} user={user} pass={pass}
              onBack={()=>setSelSeries(null)}
              onPlay={(url,title)=>{ setPlayerUrl(url); setPlayerTitle(title); }}
            />
          )}

          {/* CONTENT */}
          {view==="content" && !(selSeries && ct==="series") && (
            !selCat ? (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:"1rem",color:"#444"}}>
                {ct==="live"?<Tv size={48} color="#333"/>:ct==="movies"?<Film size={48} color="#333"/>:<MonitorPlay size={48} color="#333"/>}
                <span style={{fontSize:"0.9rem"}}>{t.selectCat}</span>
              </div>
            ) : loadItem ? <Spin/> : itemErr ? <Err msg={itemErr}/> : (
              <div style={{display:"grid",gridTemplateColumns:ct==="live"?"repeat(auto-fill,minmax(180px,1fr))":"repeat(auto-fill,minmax(130px,1fr))",gap:"1rem"}}>
                {items.length===0 && <div style={{color:"#555",padding:"3rem",gridColumn:"1/-1",textAlign:"center"}}>{t.noContent}</div>}
                {items.map((item,i)=>{
                  const poster=item.stream_icon||item.cover||"";
                  return (
                    <div key={item.stream_id||item.series_id||i} onClick={()=>playItem(item)} style={{cursor:"pointer"}}>
                      <div style={{borderRadius:"10px",aspectRatio:ct==="live"?"16/9":"2/3",background:poster?"#111":GRADS[i%GRADS.length],overflow:"hidden",position:"relative",boxShadow:"0 4px 14px rgba(0,0,0,0.4)",transition:"transform 0.15s"}}
                        onMouseEnter={e=>(e.currentTarget.style.transform="scale(1.04)")} onMouseLeave={e=>(e.currentTarget.style.transform="scale(1)")}>
                        {poster && <img src={poster} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>(e.currentTarget.style.display="none")}/>}
                        {!poster && <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:"1.6rem"}}>{ct==="live"?"📡":ct==="movies"?"🎬":"🎭"}</div>}
                        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0)",display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.2s"}}
                          onMouseEnter={e=>{e.currentTarget.style.background="rgba(0,0,0,0.55)"}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(0,0,0,0)"}}>
                          <div style={{width:38,height:38,borderRadius:"50%",background:"rgba(168,85,247,0.85)",display:"flex",alignItems:"center",justifyContent:"center"}}><Play size={16} color="white"/></div>
                        </div>
                        {item.rating && Number(item.rating)>0 && <div style={{position:"absolute",top:5,left:5,background:"rgba(0,0,0,0.75)",borderRadius:"5px",padding:"0.1rem 0.35rem",fontSize:"0.65rem",color:"#facc15",display:"flex",alignItems:"center",gap:"0.2rem"}}><Star size={8} fill="#facc15"/>{Number(item.rating).toFixed(1)}</div>}
                      </div>
                      <div style={{marginTop:"0.35rem",fontSize:"0.76rem",color:"#d1d5db",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                      {item.year && <div style={{fontSize:"0.66rem",color:"#6b7280"}}>{item.year}</div>}
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* SETTINGS */}
          {view==="settings" && (
            <div style={{maxWidth:480}}>
              <div style={{display:"flex",flexDirection:"column",gap:"0.9rem"}}>
                {([
                  {label:t.lang,key:"lang",opts:[{v:"ar",l:"العربية"},{v:"en",l:"English"}]},
                  {label:t.streamFmt,key:"streamFormat",opts:[{v:"m3u8",l:"M3U8 (HLS)"},{v:"ts",l:"TS"},{v:"rtmp",l:"RTMP"}]},
                ]).map(f=>(
                  <div key={f.key} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"11px",padding:"0.9rem 1.1rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{color:"#e2e8f0",fontSize:"0.88rem"}}>{f.label}</span>
                    <select value={(userCfg as any)[f.key]} onChange={e=>setUserCfg((p:any)=>({...p,[f.key]:e.target.value}))} style={{background:"rgba(168,85,247,0.15)",border:"1px solid rgba(168,85,247,0.3)",borderRadius:"7px",padding:"0.35rem 0.65rem",color:"#c084fc",fontSize:"0.82rem",outline:"none",cursor:"pointer"}}>
                      {f.opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                ))}
                <button onClick={saveSettings} style={{padding:"0.85rem",borderRadius:"11px",border:"none",background:saved?"linear-gradient(135deg,#4ade80,#22c55e)":"linear-gradient(135deg,#a855f7,#6366f1)",color:"white",cursor:"pointer",fontSize:"0.92rem",fontWeight:"bold",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",transition:"background 0.3s"}}>
                  {saved?<><CheckCircle size={16}/>{t.saved}</>:<><Save size={16}/>{t.saveBtn}</>}
                </button>
                <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"11px",padding:"1rem 1.1rem"}}>
                  <div style={{color:"#9ca3af",fontSize:"0.75rem",marginBottom:"0.65rem"}}>{t.accountInfo}</div>
                  {[{l:t.live.replace("مباشر","المستخدم").replace("Live","User"),v:user,lx:"المستخدم",le:"User"},{l:"",v:expiry,lx:"انتهاء الاشتراك",le:"Expiry",hi:true}].map((r,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:"0.45rem"}}>
                      <span style={{color:"#6b7280",fontSize:"0.82rem"}}>{lang==="ar"?r.lx:r.le}</span>
                      <span style={{color:(r as any).hi?"#a855f7":"#e2e8f0",fontSize:"0.82rem",fontWeight:(r as any).hi?"bold":"normal"}}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
