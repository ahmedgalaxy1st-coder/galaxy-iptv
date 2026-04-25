"use client";

import { useState, useEffect } from "react";
import { Shield, Server, Settings, Key, Plus, Trash2, Save, LogOut, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";

type Server = { id: number; name: string; code: string; host: string };
type AppSettings = {
  appName: string;
  logoUrl: string;
  backgroundUrl: string;
  whatsappNumber: string;
  whatsappVisible: boolean;
  primaryColor: string;
  streamFormat: string;
};

export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState("servers");

  // Servers
  const [servers, setServers] = useState<Server[]>([]);
  const [newServer, setNewServer] = useState({ name: "", code: "", host: "" });
  const [serverMsg, setServerMsg] = useState({ text: "", ok: true });

  // Settings
  const [settings, setSettings] = useState<AppSettings>({
    appName: "Galaxy IPTV", logoUrl: "", backgroundUrl: "",
    whatsappNumber: "", whatsappVisible: true, primaryColor: "#a855f7", streamFormat: "m3u8",
  });
  const [settingsMsg, setSettingsMsg] = useState({ text: "", ok: true });

  // Admin credentials
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [credMsg, setCredMsg] = useState({ text: "", ok: true });

  // ---- Login ----
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: loginUser, password: loginPass }),
    });
    if (res.ok) {
      sessionStorage.setItem("admin_logged", "1");
      setIsLoggedIn(true);
    } else {
      setLoginError("اسم المستخدم أو كلمة المرور غير صحيحة");
    }
  };

  // ---- Load data ----
  useEffect(() => {
    if (sessionStorage.getItem("admin_logged") === "1") setIsLoggedIn(true);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/servers").then(r => r.json()).then(setServers).catch(() => {});
    fetch("/api/settings").then(r => r.json()).then(setSettings).catch(() => {});
  }, [isLoggedIn]);

  // ---- Servers ----
  const addServer = async () => {
    if (!newServer.code || !newServer.host) {
      setServerMsg({ text: "يرجى إدخال الكود والرابط على الأقل", ok: false });
      return;
    }
    const res = await fetch("/api/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newServer),
    });
    if (res.ok) {
      const data = await res.json();
      setServers(prev => [...prev, data.server]);
      setNewServer({ name: "", code: "", host: "" });
      setServerMsg({ text: "تم إضافة السيرفر بنجاح ✓", ok: true });
    } else {
      setServerMsg({ text: "فشل في الإضافة", ok: false });
    }
    setTimeout(() => setServerMsg({ text: "", ok: true }), 3000);
  };

  const deleteServer = async (id: number) => {
    const res = await fetch("/api/servers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setServers(prev => prev.filter(s => s.id !== id));
  };

  // ---- Settings ----
  const saveSettings = async () => {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      setSettingsMsg({ text: "تم حفظ الإعدادات بنجاح ✓", ok: true });
    } else {
      setSettingsMsg({ text: "فشل في الحفظ", ok: false });
    }
    setTimeout(() => setSettingsMsg({ text: "", ok: true }), 3000);
  };

  // ---- Credentials ----
  const saveCredentials = async () => {
    if (!newUsername && !newPassword) {
      setCredMsg({ text: "يرجى إدخال بيانات جديدة", ok: false });
      setTimeout(() => setCredMsg({ text: "", ok: true }), 3000);
      return;
    }
    const body: any = {};
    if (newUsername) body.username = newUsername;
    if (newPassword) body.password = newPassword;
    const res = await fetch("/api/admin/credentials", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setCredMsg({ text: "تم تحديث بيانات الدخول بنجاح ✓", ok: true });
      setNewUsername("");
      setNewPassword("");
    } else {
      setCredMsg({ text: "فشل في التحديث", ok: false });
    }
    setTimeout(() => setCredMsg({ text: "", ok: true }), 3000);
  };

  const logout = () => {
    sessionStorage.removeItem("admin_logged");
    setIsLoggedIn(false);
  };

  // ==================== LOGIN SCREEN ====================
  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #0f0f1a 0%, #1a1030 50%, #0f0f1a 100%)",
        fontFamily: "'Segoe UI', Tahoma, sans-serif", direction: "rtl"
      }}>
        <div style={{
          width: "100%", maxWidth: "400px", padding: "2.5rem",
          background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)",
          borderRadius: "20px", border: "1px solid rgba(168,85,247,0.3)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
        }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "linear-gradient(135deg, #a855f7, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1rem"
            }}>
              <Shield size={30} color="white" />
            </div>
            <h1 style={{ color: "white", margin: 0, fontSize: "1.5rem" }}>لوحة تحكم المدير</h1>
            <p style={{ color: "#888", margin: "0.5rem 0 0", fontSize: "0.9rem" }}>Galaxy IPTV Admin Panel</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {loginError && (
              <div style={{
                background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
                padding: "0.75rem 1rem", borderRadius: "10px", color: "#f87171", fontSize: "0.9rem", textAlign: "center"
              }}>{loginError}</div>
            )}
            <div>
              <label style={{ color: "#ccc", fontSize: "0.85rem", display: "block", marginBottom: "0.4rem" }}>اسم المستخدم</label>
              <input
                type="text" value={loginUser} onChange={e => setLoginUser(e.target.value)}
                placeholder="admin"
                style={{
                  width: "100%", padding: "0.75rem 1rem", borderRadius: "10px",
                  background: "rgba(0,0,0,0.3)", border: "1px solid rgba(168,85,247,0.3)",
                  color: "white", fontSize: "1rem", outline: "none", boxSizing: "border-box"
                }}
              />
            </div>
            <div style={{ position: "relative" }}>
              <label style={{ color: "#ccc", fontSize: "0.85rem", display: "block", marginBottom: "0.4rem" }}>كلمة المرور</label>
              <input
                type={showPass ? "text" : "password"} value={loginPass} onChange={e => setLoginPass(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "0.75rem 3rem 0.75rem 1rem", borderRadius: "10px",
                  background: "rgba(0,0,0,0.3)", border: "1px solid rgba(168,85,247,0.3)",
                  color: "white", fontSize: "1rem", outline: "none", boxSizing: "border-box"
                }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: "absolute", left: "0.75rem", bottom: "0.75rem", background: "none", border: "none", cursor: "pointer", color: "#888" }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button type="submit" style={{
              padding: "0.85rem", borderRadius: "10px", border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #a855f7, #6366f1)", color: "white",
              fontSize: "1rem", fontWeight: "bold", marginTop: "0.5rem",
              transition: "opacity 0.2s"
            }}>دخول</button>
          </form>
        </div>
      </div>
    );
  }

  // ==================== ADMIN DASHBOARD ====================
  const tabs = [
    { id: "servers", label: "إدارة السيرفرات", icon: <Server size={18} /> },
    { id: "settings", label: "إعدادات التطبيق", icon: <Settings size={18} /> },
    { id: "credentials", label: "بيانات الدخول", icon: <Key size={18} /> },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#0d0d18",
      fontFamily: "'Segoe UI', Tahoma, sans-serif", direction: "rtl", color: "white"
    }}>
      {/* Sidebar */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "240px",
        background: "rgba(255,255,255,0.03)", borderLeft: "1px solid rgba(168,85,247,0.15)",
        display: "flex", flexDirection: "column", padding: "1.5rem 0"
      }}>
        <div style={{ textAlign: "center", padding: "0 1rem 2rem" }}>
          <div style={{
            width: 50, height: 50, borderRadius: "50%",
            background: "linear-gradient(135deg, #a855f7, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem"
          }}>
            <Shield size={24} color="white" />
          </div>
          <div style={{ fontSize: "0.95rem", fontWeight: "bold" }}>Galaxy Admin</div>
          <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.25rem" }}>لوحة التحكم</div>
        </div>

        <nav style={{ flex: 1, padding: "0 0.75rem" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                width: "100%", padding: "0.8rem 1rem", marginBottom: "0.3rem",
                display: "flex", alignItems: "center", gap: "0.75rem",
                background: activeTab === tab.id ? "rgba(168,85,247,0.2)" : "transparent",
                border: activeTab === tab.id ? "1px solid rgba(168,85,247,0.4)" : "1px solid transparent",
                borderRadius: "10px", color: activeTab === tab.id ? "#c084fc" : "#888",
                cursor: "pointer", fontSize: "0.9rem", textAlign: "right",
                transition: "all 0.2s"
              }}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <button onClick={logout} style={{
          margin: "0 0.75rem",
          padding: "0.8rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem",
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: "10px", color: "#f87171", cursor: "pointer", fontSize: "0.9rem"
        }}>
          <LogOut size={18} />
          تسجيل الخروج
        </button>
      </div>

      {/* Main Content */}
      <div style={{ marginRight: "240px", padding: "2rem" }}>

        {/* ===== SERVERS TAB ===== */}
        {activeTab === "servers" && (
          <div>
            <h1 style={{ fontSize: "1.6rem", marginBottom: "2rem", color: "#c084fc" }}>
              إدارة السيرفرات والأكواد
            </h1>

            {/* Add new server */}
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.2)",
              borderRadius: "16px", padding: "1.5rem", marginBottom: "2rem"
            }}>
              <h2 style={{ fontSize: "1rem", marginBottom: "1.25rem", color: "#e2e8f0" }}>
                <Plus size={16} style={{ marginLeft: "0.5rem", verticalAlign: "middle" }} />
                إضافة سيرفر جديد
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "1rem", marginBottom: "1rem" }}>
                {[
                  { label: "اسم السيرفر", key: "name", placeholder: "مثال: سيرفر جلاكسي" },
                  { label: "كود الدخول", key: "code", placeholder: "مثال: galaxy1" },
                  { label: "رابط الهوست", key: "host", placeholder: "http://host.com:8080" },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ fontSize: "0.8rem", color: "#888", display: "block", marginBottom: "0.4rem" }}>{field.label}</label>
                    <input
                      type="text"
                      value={(newServer as any)[field.key]}
                      onChange={e => setNewServer(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      style={{
                        width: "100%", padding: "0.65rem 0.9rem", borderRadius: "8px",
                        background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                        color: "white", fontSize: "0.9rem", outline: "none", boxSizing: "border-box"
                      }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <button onClick={addServer} style={{
                  padding: "0.65rem 1.5rem", borderRadius: "8px", border: "none",
                  background: "linear-gradient(135deg, #a855f7, #6366f1)",
                  color: "white", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold",
                  display: "flex", alignItems: "center", gap: "0.5rem"
                }}>
                  <Plus size={16} /> إضافة
                </button>
                {serverMsg.text && (
                  <span style={{ color: serverMsg.ok ? "#4ade80" : "#f87171", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {serverMsg.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {serverMsg.text}
                  </span>
                )}
              </div>
            </div>

            {/* Servers table */}
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px", overflow: "hidden"
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(168,85,247,0.1)" }}>
                    {["الاسم", "الكود", "رابط الهوست", "حذف"].map(h => (
                      <th key={h} style={{ padding: "1rem", textAlign: "right", fontSize: "0.85rem", color: "#9ca3af", fontWeight: "600" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {servers.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#555" }}>لا توجد سيرفرات مضافة</td>
                    </tr>
                  ) : servers.map((s, i) => (
                    <tr key={s.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                      <td style={{ padding: "0.9rem 1rem", fontSize: "0.9rem" }}>{s.name || "-"}</td>
                      <td style={{ padding: "0.9rem 1rem" }}>
                        <span style={{
                          background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.3)",
                          padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.85rem", color: "#c084fc"
                        }}>{s.code}</span>
                      </td>
                      <td style={{ padding: "0.9rem 1rem", fontSize: "0.85rem", color: "#888", fontFamily: "monospace" }}>{s.host}</td>
                      <td style={{ padding: "0.9rem 1rem" }}>
                        <button onClick={() => deleteServer(s.id)} style={{
                          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                          borderRadius: "8px", padding: "0.4rem 0.7rem", cursor: "pointer", color: "#f87171"
                        }}>
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== SETTINGS TAB ===== */}
        {activeTab === "settings" && (
          <div>
            <h1 style={{ fontSize: "1.6rem", marginBottom: "2rem", color: "#c084fc" }}>إعدادات التطبيق</h1>
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.2)",
              borderRadius: "16px", padding: "2rem"
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                {[
                  { label: "اسم التطبيق", key: "appName", type: "text", placeholder: "Galaxy IPTV" },
                  { label: "رقم واتساب الدعم الفني", key: "whatsappNumber", type: "text", placeholder: "00201050501080" },
                  { label: "رابط الشعار (Logo URL)", key: "logoUrl", type: "text", placeholder: "https://..." },
                  { label: "رابط الخلفية (Background URL)", key: "backgroundUrl", type: "text", placeholder: "https://..." },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ fontSize: "0.85rem", color: "#9ca3af", display: "block", marginBottom: "0.5rem" }}>{field.label}</label>
                    <input
                      type={field.type}
                      value={(settings as any)[field.key] || ""}
                      onChange={e => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      style={{
                        width: "100%", padding: "0.75rem 1rem", borderRadius: "10px",
                        background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                        color: "white", fontSize: "0.9rem", outline: "none", boxSizing: "border-box"
                      }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: "0.85rem", color: "#9ca3af", display: "block", marginBottom: "0.5rem" }}>نمط البث الافتراضي</label>
                  <select
                    value={settings.streamFormat}
                    onChange={e => setSettings(prev => ({ ...prev, streamFormat: e.target.value }))}
                    style={{
                      width: "100%", padding: "0.75rem 1rem", borderRadius: "10px",
                      background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                      color: "white", fontSize: "0.9rem", outline: "none"
                    }}>
                    <option value="m3u8">M3U8 (HLS)</option>
                    <option value="ts">TS</option>
                    <option value="rtmp">RTMP</option>
                  </select>
                </div>
              </div>

              {/* WhatsApp Toggle */}
              <div style={{ marginTop: "0.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.2)", borderRadius: "12px", padding: "1rem 1.25rem" }}>
                <div>
                  <div style={{ fontSize: "0.9rem", color: "#e2e8f0", marginBottom: "0.2rem" }}>إظهار زر واتساب للعميل</div>
                  <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>{settings.whatsappVisible ? "الزر ظاهر حالياً للعميل ✓" : "الزر مخفي حالياً"}</div>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, whatsappVisible: !prev.whatsappVisible }))}
                  style={{
                    width: 52, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
                    background: settings.whatsappVisible ? "#25d366" : "rgba(255,255,255,0.15)",
                    position: "relative", transition: "background 0.3s", flexShrink: 0
                  }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", background: "white",
                    position: "absolute", top: 3,
                    left: settings.whatsappVisible ? 27 : 3,
                    transition: "left 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)"
                  }}/>
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1rem" }}>
                <button onClick={saveSettings} style={{
                  padding: "0.75rem 2rem", borderRadius: "10px", border: "none",
                  background: "linear-gradient(135deg, #a855f7, #6366f1)",
                  color: "white", cursor: "pointer", fontSize: "0.95rem", fontWeight: "bold",
                  display: "flex", alignItems: "center", gap: "0.5rem"
                }}>
                  <Save size={17} /> حفظ الإعدادات
                </button>
                {settingsMsg.text && (
                  <span style={{ color: settingsMsg.ok ? "#4ade80" : "#f87171", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {settingsMsg.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {settingsMsg.text}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== CREDENTIALS TAB ===== */}
        {activeTab === "credentials" && (
          <div>
            <h1 style={{ fontSize: "1.6rem", marginBottom: "2rem", color: "#c084fc" }}>تغيير بيانات الدخول</h1>
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.2)",
              borderRadius: "16px", padding: "2rem", maxWidth: "500px"
            }}>
              <p style={{ color: "#888", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                أدخل البيانات الجديدة. يمكنك تغيير اليوزر فقط أو الباسورد فقط أو كليهما.
              </p>
              {[
                { label: "اسم المستخدم الجديد", val: newUsername, set: setNewUsername, ph: "admin" },
                { label: "كلمة المرور الجديدة", val: newPassword, set: setNewPassword, ph: "••••••••" },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: "1.25rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "#9ca3af", display: "block", marginBottom: "0.5rem" }}>{f.label}</label>
                  <input
                    type="text" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                    style={{
                      width: "100%", padding: "0.75rem 1rem", borderRadius: "10px",
                      background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                      color: "white", fontSize: "0.9rem", outline: "none", boxSizing: "border-box"
                    }}
                  />
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.5rem" }}>
                <button onClick={saveCredentials} style={{
                  padding: "0.75rem 2rem", borderRadius: "10px", border: "none",
                  background: "linear-gradient(135deg, #a855f7, #6366f1)",
                  color: "white", cursor: "pointer", fontSize: "0.95rem", fontWeight: "bold",
                  display: "flex", alignItems: "center", gap: "0.5rem"
                }}>
                  <Save size={17} /> تحديث البيانات
                </button>
                {credMsg.text && (
                  <span style={{ color: credMsg.ok ? "#4ade80" : "#f87171", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {credMsg.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {credMsg.text}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
