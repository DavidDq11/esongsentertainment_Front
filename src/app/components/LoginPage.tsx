import { useState, FormEvent } from "react";
import { useNavigate } from "react-router";
import { useLang } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { authApi } from "../services/api";
import logoImg from "../../assets/logo.webp";

const G1   = "#d4af37";
const G2   = "#f5c842";
const BG   = "#120a06";
const CARD = "#201208";
const BD   = "rgba(255,255,255,0.08)";
const T1   = "#f1f5f9";
const T2   = "#94a3b8";
const T3   = "#64748b";
const rg   = (a: number) => `rgba(212,175,55,${a})`;

export function LoginPage() {
  const { lang } = useLang();
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const t = {
    es: {
      title:   "Iniciar Sesión",
      sub:     "Accede a tu portal de regalías o panel administrativo",
      emailLbl:"Correo electrónico",
      passLbl: "Contraseña",
      btn:     "Entrar",
      loading: "Verificando…",
      back:    "← Volver al inicio",
      hint:    "Sellos: usen las credenciales enviadas por eSongs.",
    },
    en: {
      title:   "Sign In",
      sub:     "Access your royalty portal or admin panel",
      emailLbl:"Email address",
      passLbl: "Password",
      btn:     "Sign In",
      loading: "Verifying…",
      back:    "← Back to home",
      hint:    "Labels: use the credentials sent by eSongs.",
    },
  }[lang];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login(email.trim(), password);
      login({ token: res.token, role: res.role, nombre: res.nombre, iniciales: res.iniciales, email: email.trim() });
      navigate(res.role === "admin" ? "/admin" : "/portal", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    backgroundColor: "rgba(0,0,0,0.3)",
    border: `1px solid ${BD}`,
    borderRadius: "8px",
    color: T1,
    fontSize: "1rem",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      {/* Background glows */}
      <div
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "300px",
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${rg(0.07)}, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", maxWidth: "420px", position: "relative" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <img
              src={logoImg}
              alt="eSongs Entertainment"
              style={{ height: "64px", width: "auto", marginBottom: "16px", display: "inline-block" }}
            />
          </a>
          <h1 style={{ color: T1, fontSize: "1.6rem", fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>
            {t.title}
          </h1>
          <p style={{ color: T3, fontSize: "0.9rem", marginTop: "8px" }}>{t.sub}</p>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: CARD,
            border: `1px solid ${BD}`,
            borderRadius: "16px",
            padding: "32px",
          }}
        >
          {error && (
            <div
              style={{
                backgroundColor: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "8px",
                padding: "12px 14px",
                marginBottom: "20px",
                color: "#fca5a5",
                fontSize: "0.875rem",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: T3,
                  marginBottom: "6px",
                }}
              >
                {t.emailLbl}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = G1; }}
                onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = BD; }}
                autoComplete="email"
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: T3,
                  marginBottom: "6px",
                }}
              >
                {t.passLbl}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = G1; }}
                onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = BD; }}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "8px",
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                background: loading
                  ? "rgba(212,175,55,0.4)"
                  : `linear-gradient(135deg, ${G1}, ${G2})`,
                color: "#000",
                fontWeight: 700,
                fontSize: "1rem",
                transition: "all 0.2s",
              }}
            >
              {loading ? t.loading : t.btn}
            </button>
          </form>

          <p style={{ color: T3, fontSize: "0.8rem", marginTop: "20px", textAlign: "center", lineHeight: 1.5 }}>
            {t.hint}
          </p>
        </div>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <a
            href="/"
            style={{ color: T2, fontSize: "0.875rem", textDecoration: "none" }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.color = G1; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.color = T2; }}
          >
            {t.back}
          </a>
        </div>
      </div>
    </div>
  );
}
