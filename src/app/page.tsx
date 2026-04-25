"use client";

import { useState, useEffect } from "react";
import "./globals.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [serverCode, setServerCode] = useState("");
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username || !password || !serverCode) {
      setError("يرجى ملء جميع الحقول");
      setLoading(false);
      return;
    }

    try {
      // 1. Get host from server code
      const serversRes = await fetch("/api/servers");
      const servers = await serversRes.json();
      const server = servers.find(
        (s: any) => s.code.toLowerCase() === serverCode.toLowerCase()
      );
      if (!server) {
        setError("كود السيرفر غير صحيح");
        setLoading(false);
        return;
      }

      // 2. Verify credentials against Xtream API via proxy
      const xtreamRes = await fetch(
        `/api/xtream?host=${encodeURIComponent(server.host)}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
      );

      if (!xtreamRes.ok) {
        const errData = await xtreamRes.json().catch(() => ({}));
        setError(errData.error || "تعذر الاتصال بالسيرفر");
        setLoading(false);
        return;
      }

      const xtreamData = await xtreamRes.json();

      // Check if login was successful (Xtream returns user_info)
      if (!xtreamData.user_info) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة");
        setLoading(false);
        return;
      }

      // Check account status
      if (xtreamData.user_info.status === "Disabled") {
        setError("الحساب موقوف، يرجى التواصل مع الدعم الفني");
        setLoading(false);
        return;
      }

      // 3. Save session data
      sessionStorage.setItem("user", username);
      sessionStorage.setItem("pass", password);
      sessionStorage.setItem("host", server.host);
      sessionStorage.setItem(
        "expiry",
        xtreamData.user_info.exp_date
          ? new Date(Number(xtreamData.user_info.exp_date) * 1000).toLocaleDateString("ar-EG")
          : "غير محدد"
      );
      sessionStorage.setItem("user_info", JSON.stringify(xtreamData.user_info));

      window.location.href = "/app";
    } catch (err: any) {
      setError("حدث خطأ أثناء الاتصال، تحقق من الإنترنت");
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div
        className="login-bg"
        style={{
          backgroundImage: settings.backgroundUrl
            ? `url(${settings.backgroundUrl})`
            : "linear-gradient(135deg, #0d0d18 0%, #1a1030 50%, #0d0d18 100%)",
        }}
      />

      <div className="glass-panel">
        <div className="logo-container">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="Galaxy Logo"
              style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "linear-gradient(135deg, #a855f7, #6366f1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "2rem", margin: "0 auto",
              }}
            >
              📺
            </div>
          )}
          <h2 style={{ marginTop: "1rem", color: "white", fontSize: "1.4rem" }}>
            {settings.appName || "Galaxy IPTV"}
          </h2>
          <p style={{ color: "#888", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
            أدخل بياناتك للمتابعة
          </p>
        </div>

        <form onSubmit={handleLogin}>
          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
                padding: "0.75rem 1rem", borderRadius: "10px",
                color: "#f87171", marginBottom: "1rem",
                textAlign: "center", fontSize: "0.9rem",
              }}
            >
              {error}
            </div>
          )}

          <div className="input-group">
            <label className="input-label">اسم المستخدم</label>
            <input
              type="text"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoComplete="off"
            />
          </div>

          <div className="input-group">
            <label className="input-label">كلمة المرور</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>

          <div className="input-group">
            <label className="input-label">كود السيرفر</label>
            <input
              type="text"
              className="input-field"
              value={serverCode}
              onChange={(e) => setServerCode(e.target.value)}
              placeholder="مثال: galaxy1"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <span>
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite", marginLeft: "0.5rem" }}>⏳</span>
                جاري التحقق...
              </span>
            ) : (
              "تسجيل الدخول"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
