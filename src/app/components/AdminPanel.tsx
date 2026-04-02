import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { useLang } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { sellosApi, reportesApi, type Sello, type Reporte } from "../services/api";
import { T } from "../i18n";

type AdminView  = "inicio" | "subir" | "sellos" | "reportes";
type UploadStep = 1 | 2 | 3;
type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

const bg    = "#0a0a0a";
const card  = "#111111";
const elev  = "#161616";
const accent = "#d4af37";
const green  = "#f5c842";
const amber  = "#f59e0b";
const t1    = "#f1f3f9";
const t2    = "#94a3b8";
const t3    = "#64748b";
const bd    = "rgba(255,255,255,0.06)";
const bdA   = "rgba(212,175,55,0.2)";
const ggl   = "rgba(212,175,55,0.07)";

const cardStyle = { backgroundColor: card, border: `1px solid ${bd}`, borderRadius: "14px" };

function labelGrad(iniciales: string) {
  const colors = [
    `linear-gradient(135deg,${accent},#0090b0)`,
    "linear-gradient(135deg,#1E8EFA,#0D4F8C)",
    "linear-gradient(135deg,#7C3AED,#4F1D96)",
    "linear-gradient(135deg,#00C6FF,#0D4F8C)",
    "linear-gradient(135deg,#F5A623,#9A5C00)",
    "linear-gradient(135deg,#FF5C5C,#8C1010)",
  ];
  const idx = (iniciales?.charCodeAt(0) ?? 0) % colors.length;
  return colors[idx];
}

function fmtCurrency(n: number | string) {
  return Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function EyeBrow({ text }: { text: string }) {
  return (
    <div style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: ".14em", textTransform: "uppercase" as const, color: accent, marginBottom: "6px", display: "flex", alignItems: "center", gap: "7px" }}>
      <span style={{ width: "13px", height: "1px", background: accent, display: "inline-block" }} />
      {text}
    </div>
  );
}

export function AdminPanel() {
  const { lang } = useLang();
  const { user } = useAuth();
  const tx = T[lang];

  // Navigation
  const [view, setView] = useState<AdminView>("inicio");
  const navTo = (v: AdminView) => setView(v);

  // Data state
  const [sellos,      setSellos]   = useState<Sello[]>([]);
  const [allReports,  setReports]  = useState<Reporte[]>([]);
  const [loadingData, setLoading]  = useState(true);

  // Upload wizard state
  const [step,     setStep]    = useState<UploadStep>(1);
  const [selSello, setSelSello] = useState<Sello | null>(null);
  const [selType,  setSelType]  = useState<"streaming" | "youtube" | null>(null);
  const [selTrimestre, setTrimestre]   = useState("1");
  const [selAnio,      setAnio]        = useState(String(new Date().getFullYear()));
  const [upResult,  setUpResult]  = useState<Reporte | null>(null);
  const [upState,  setUpState]  = useState<UploadState>("idle");
  const [upFile,   setUpFile]   = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [upError,  setUpError]  = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Report filters
  const [filterType,      setFilterType]   = useState("all");
  const [filterYear,      setFilterYear]   = useState("all");
  const [filterLabelName, setFilterLabel]  = useState("all");
  const [search,          setSearch]       = useState("");

  // New sello form
  const [showNewSello, setShowNewSello] = useState(false);
  const [newSello, setNewSello] = useState({ nombre: "", email: "", password: "", iniciales: "", representante: "" });
  const [newSelloErr, setNewSelloErr] = useState<string | null>(null);
  const [newSelloLoading, setNewSelloLoading] = useState(false);

  useEffect(() => {
    Promise.all([sellosApi.list(), reportesApi.list()])
      .then(([s, r]) => { setSellos(s); setReports(r); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const refreshData = () => {
    Promise.all([sellosApi.list(), reportesApi.list()])
      .then(([s, r]) => { setSellos(s); setReports(r); })
      .catch(console.error);
  };

  const goSt = (n: UploadStep) => setStep(n);

  const resetUp = () => {
    setSelSello(null); setSelType(null);
    setUpState("idle"); setUpFile(null); setProgress(0);
    setUpError(null); setStep(1); setUpResult(null);
  };

  const doUpload = async (file: File) => {
    if (!selSello || !selType) return;
    setUpFile(file);
    setUpState("uploading");
    setProgress(0);
    setUpError(null);

    // Simulate progress while uploading
    const iv = setInterval(() => {
      setProgress(p => p < 80 ? p + 10 : p);
    }, 150);

    try {
      const fd = new FormData();
      fd.append("file",          file);
      fd.append("sello_id",      selSello.id);
      fd.append("tipo",          selType);
      fd.append("trimestre",     selTrimestre);
      fd.append("anio",          selAnio);
      const result = await reportesApi.upload(fd);
      clearInterval(iv);
      setProgress(100);
      setUpResult(result);
      setUpState("success");
      refreshData();
    } catch (err: unknown) {
      clearInterval(iv);
      setUpState("error");
      setUpError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleCreateSello = async () => {
    if (!newSello.nombre || !newSello.email || !newSello.password) {
      setNewSelloErr(lang === "es" ? "Nombre, email y contraseña son requeridos." : "Name, email, and password are required.");
      return;
    }
    setNewSelloLoading(true);
    setNewSelloErr(null);
    try {
      await sellosApi.create(newSello);
      setShowNewSello(false);
      setNewSello({ nombre: "", email: "", password: "", iniciales: "", representante: "" });
      refreshData();
    } catch (err: unknown) {
      setNewSelloErr(err instanceof Error ? err.message : "Error");
    } finally {
      setNewSelloLoading(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm(lang === "es" ? "¿Eliminar este reporte?" : "Delete this report?")) return;
    try {
      await reportesApi.remove(id);
      setReports(r => r.filter(x => x.id !== id));
    } catch { /* ignore */ }
  };

  const handleDownloadReport = async (id: string) => {
    try {
      const { url } = await reportesApi.download(id);
      window.open(url, "_blank", "noopener");
    } catch { /* ignore */ }
  };

  const reportYears  = [...new Set(allReports.map(r => String(r.anio)))];
  const reportLabels = [...new Set(allReports.map(r => r.sello_nombre))];

  const filteredReports = allReports.filter(r => {
    const mt = filterType      === "all" || r.tipo        === filterType;
    const my = filterYear      === "all" || String(r.anio) === filterYear;
    const ml = filterLabelName === "all" || r.sello_nombre === filterLabelName;
    const ms = r.nombre_archivo.toLowerCase().includes(search.toLowerCase()) ||
               r.sello_nombre.toLowerCase().includes(search.toLowerCase());
    return mt && my && ml && ms;
  });

  const statusBadge = (s: "activo" | "inactivo") =>
    s === "activo"
      ? <span style={{ fontFamily: "monospace", fontSize: "8px", padding: "3px 8px", borderRadius: "8px", background: `rgba(212,175,55,0.08)`, color: accent, border: `1px solid rgba(212,175,55,0.2)` }}>{tx.activo}</span>
      : <span style={{ fontFamily: "monospace", fontSize: "8px", padding: "3px 8px", borderRadius: "8px", background: `rgba(245,158,11,0.08)`, color: amber, border: `1px solid rgba(245,158,11,0.2)` }}>{tx.pendiente}</span>;

  const navItems = [
    { id: "inicio"   as AdminView, icon: "🏠", label: tx.inicio,   desc: tx.inicioDesc },
    { id: "subir"    as AdminView, icon: "📤", label: tx.subir,    desc: tx.subirDesc },
    { id: "sellos"   as AdminView, icon: "🎵", label: tx.sellos,   desc: tx.sellosDesc,   badge: { text: String(sellos.length), type: "green" } },
    { id: "reportes" as AdminView, icon: "📂", label: tx.reportes, desc: tx.reportesDesc },
  ] as const;

  const selectStyle: React.CSSProperties = {
    fontFamily: "inherit", fontSize: "11px",
    background: card, border: `1px solid ${bd}`,
    color: t2, borderRadius: "7px",
    padding: "6px 10px", outline: "none", cursor: "pointer",
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: "inherit", fontSize: "12px",
    background: elev, border: `1px solid ${bd}`,
    color: t1, borderRadius: "7px",
    padding: "8px 12px", outline: "none", width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div className="panel-outer" style={{ display: "flex", minHeight: "calc(100vh - 73px)", backgroundColor: bg }}>

      {/* SIDEBAR */}
      <aside className="panel-sidebar-hide-mobile" style={{ width: "220px", minWidth: "220px", backgroundColor: bg, borderRight: `1px solid ${bd}`, display: "flex", flexDirection: "column", padding: "20px 11px 16px", position: "sticky", top: "73px", height: "calc(100vh - 73px)", overflowY: "auto" }}>
        <div style={{ fontFamily: "monospace", fontSize: "8px", letterSpacing: ".14em", textTransform: "uppercase", color: t3, padding: "0 9px", marginBottom: "5px" }}>{tx.menuTitle}</div>

        {navItems.map(item => {
          const on = view === item.id;
          return (
            <div
              key={item.id}
              onClick={() => navTo(item.id)}
              style={{ display: "flex", alignItems: "center", gap: "9px", padding: "9px 10px", borderRadius: "8px", cursor: "pointer", border: on ? `1px solid ${bdA}` : "1px solid transparent", backgroundColor: on ? ggl : "transparent", marginBottom: "2px", transition: "all .15s", color: on ? accent : t2 }}
              onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.backgroundColor = elev; }}
              onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
            >
              <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: on ? "rgba(212,175,55,0.12)" : elev, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", flexShrink: 0 }}>{item.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "12.5px", fontWeight: 500, lineHeight: 1.2 }}>{item.label}</div>
                <div style={{ fontSize: "10px", color: on ? "rgba(212,175,55,0.45)" : t3, fontWeight: 300, marginTop: "1px" }}>{item.desc}</div>
              </div>
              {"badge" in item && item.badge && (
                <span style={{ fontFamily: "monospace", fontSize: "9px", fontWeight: 700, background: item.badge.type === "amber" ? amber : accent, color: "#010e06", padding: "2px 6px", borderRadius: "6px", flexShrink: 0 }}>
                  {item.badge.text}
                </span>
              )}
            </div>
          );
        })}

        <div style={{ marginTop: "auto", paddingTop: "13px", borderTop: `1px solid ${bd}` }}>
          <div style={{ background: ggl, border: `1px solid ${bdA}`, borderRadius: "8px", padding: "12px", marginBottom: "9px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: accent, marginBottom: "3px" }}>{tx.tipTitle}</div>
            <div style={{ fontSize: "10.5px", color: t2, lineHeight: 1.5, fontWeight: 300 }}>{tx.tipBody}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "8px", backgroundColor: elev }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: `linear-gradient(135deg,${accent},${green})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 800, color: "#010e06", flexShrink: 0 }}>
              {user?.nombre?.slice(0, 2).toUpperCase() ?? "AD"}
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: t1 }}>{user?.nombre ?? "Admin"}</div>
              <div style={{ fontFamily: "monospace", fontSize: "8.5px", color: t3, letterSpacing: ".04em" }}>{tx.adminUser}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="panel-main-padding" style={{ flex: 1, overflowY: "auto", padding: "28px 34px" }}>

        {/* MOBILE TAB BAR */}
        <div className="rsp-show-mobile" style={{ overflowX: "auto", gap: "6px", marginBottom: "16px", paddingBottom: "4px", WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"], scrollbarWidth: "none" as React.CSSProperties["scrollbarWidth"] }}>
          {navItems.map(item => {
            const on = view === item.id;
            return (
              <button key={item.id} onClick={() => navTo(item.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "8px 14px", borderRadius: "10px", border: on ? `1px solid ${bdA}` : `1px solid ${bd}`, backgroundColor: on ? ggl : "transparent", color: on ? accent : t2, cursor: "pointer", fontFamily: "inherit", fontSize: "10px", fontWeight: on ? 600 : 400, whiteSpace: "nowrap", flexShrink: 0 }}>
                <span style={{ fontSize: "18px", lineHeight: 1 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* === INICIO === */}
        {view === "inicio" && (
          <div>
            <EyeBrow text="Panel Principal" />
            <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-.035em", marginBottom: "3px", color: t1 }}>{tx.inicioTitle}</div>
            <div style={{ fontSize: "12px", color: t2, fontWeight: 300, marginBottom: "22px" }}>{tx.inicioSub}</div>

            <div className="rsp-wrap" style={{ background: `linear-gradient(135deg,rgba(212,175,55,0.07),rgba(212,175,55,0.03))`, border: `1px solid ${bdA}`, borderRadius: "14px", padding: "26px 30px", marginBottom: "22px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: "-44px", top: "-44px", width: "180px", height: "180px", borderRadius: "50%", background: "radial-gradient(circle,rgba(212,175,55,0.1),transparent 70%)" }} />
              <div>
                <div style={{ fontSize: "19px", fontWeight: 800, letterSpacing: "-.03em", marginBottom: "5px", color: t1 }}>{tx.welcomeTitle}</div>
                <div style={{ fontSize: "12.5px", color: t2, fontWeight: 300, lineHeight: 1.6, maxWidth: "380px" }}>{tx.welcomeDesc}</div>
              </div>
              <div style={{ textAlign: "right", position: "relative", zIndex: 1 }}>
                <div style={{ fontFamily: "monospace", fontSize: "32px", fontWeight: 800, color: accent, lineHeight: 1 }}>
                  {loadingData ? "—" : sellos.length}
                </div>
                <div style={{ fontSize: "10px", color: t2, fontWeight: 300 }}>{tx.sellosActivos}</div>
              </div>
            </div>

            <div className="rsp-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "11px", marginBottom: "22px" }}>
              {[
                { icon: "📤", title: tx.qaUpload,  desc: tx.qaUploadDesc,  v: "subir"    as AdminView },
                { icon: "🎵", title: tx.qaLabels,  desc: tx.qaLabelsDesc,  v: "sellos"   as AdminView },
                { icon: "📂", title: tx.qaReports, desc: tx.qaReportsDesc, v: "reportes" as AdminView },
              ].map(qa => (
                <div key={qa.title} onClick={() => navTo(qa.v)} style={{ ...cardStyle, padding: "20px", cursor: "pointer", display: "flex", flexDirection: "column", gap: "10px", position: "relative", overflow: "hidden", transition: "all .22s" }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = bdA; el.style.transform = "translateY(-3px)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = bd; el.style.transform = "translateY(0)"; }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: ggl, border: `1px solid ${bdA}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "19px" }}>{qa.icon}</div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: t1 }}>{qa.title}</div>
                  <div style={{ fontSize: "11.5px", color: t2, lineHeight: 1.6, fontWeight: 300 }}>{qa.desc}</div>
                  <div style={{ marginTop: "auto", fontSize: "17px", color: accent, alignSelf: "flex-end" }}>→</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: "13.5px", fontWeight: 700, marginBottom: "9px", display: "flex", alignItems: "center", gap: "7px", color: t1 }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: amber, display: "inline-block" }} />
              {tx.pendingTitle}
            </div>
            {[
              { icon: "📤", title: tx.pendingItem1, desc: tx.pendingItem1Desc },
              { icon: "⚠️", title: tx.pendingItem2, desc: tx.pendingItem2Desc },
            ].map(p => (
              <div key={p.title} onClick={() => navTo("subir")} style={{ backgroundColor: card, border: "1px solid rgba(245,158,11,0.2)", borderRadius: "10px", padding: "13px 16px", display: "flex", alignItems: "center", gap: "13px", marginBottom: "7px", cursor: "pointer", transition: "all .18s" }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(245,158,11,0.42)"; el.style.backgroundColor = elev; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(245,158,11,0.2)"; el.style.backgroundColor = card; }}>
                <div style={{ fontSize: "19px", flexShrink: 0 }}>{p.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 600, marginBottom: "2px", color: t1 }}>{p.title}</div>
                  <div style={{ fontSize: "11px", color: t2, fontWeight: 300 }}>{p.desc}</div>
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: amber, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", padding: "5px 12px", borderRadius: "5px", flexShrink: 0, whiteSpace: "nowrap" }}>
                  {tx.uploadNow}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === SUBIR === */}
        {view === "subir" && (
          <div>
            <EyeBrow text={tx.subir} />
            <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-.035em", marginBottom: "3px", color: t1 }}>{tx.subirTitle}</div>
            <div style={{ fontSize: "12px", color: t2, fontWeight: 300, marginBottom: "22px" }}>{tx.subirSub}</div>

            {/* Steps */}
            <div className="rsp-steps" style={{ display: "flex", alignItems: "center", marginBottom: "26px" }}>
              {([1, 2, 3] as UploadStep[]).map((n, i) => {
                const stepLabels = [
                  { label: tx.step1, desc: tx.step1Desc },
                  { label: tx.step2, desc: tx.step2Desc },
                  { label: tx.step3, desc: tx.step3Desc },
                ];
                const on   = step === n;
                const done = step > n;
                return (
                  <>
                    {i > 0 && <div key={`sep-${n}`} style={{ width: "16px", height: "1px", background: bd, flexShrink: 0 }} />}
                    <div key={n} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "8px", flex: 1, border: on ? `1px solid ${bdA}` : done ? `1px solid rgba(212,175,55,0.14)` : `1px solid ${bd}`, background: on ? ggl : done ? "rgba(212,175,55,0.03)" : card, opacity: step < n ? 0.65 : 1 }}>
                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: "10px", flexShrink: 0, background: on ? accent : done ? "rgba(212,175,55,0.14)" : elev, color: on ? "#010e06" : done ? accent : t3, border: on ? `1px solid ${accent}` : `1px solid ${bd}`, fontWeight: on || done ? 700 : 500 }}>
                        {done ? "✓" : n}
                      </div>
                      <div>
                        <div style={{ fontSize: "11.5px", fontWeight: 600, color: on ? accent : t2 }}>{stepLabels[i].label}</div>
                        <div style={{ fontSize: "9.5px", color: on ? "rgba(212,175,55,0.5)" : t3, fontWeight: 300 }}>{stepLabels[i].desc}</div>
                      </div>
                    </div>
                  </>
                );
              })}
            </div>

            {/* STEP 1: Select label */}
            {step === 1 && (
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "5px", color: t1 }}>{tx.paso1Title}</div>
                <div style={{ fontSize: "12px", color: t2, fontWeight: 300, marginBottom: "17px" }}>{tx.paso1Sub}</div>
                {sellos.length === 0 ? (
                  <div style={{ color: t3, textAlign: "center", padding: "32px" }}>
                    {loadingData ? (lang === "es" ? "Cargando sellos…" : "Loading labels…") : (lang === "es" ? "No hay sellos registrados." : "No labels registered.")}
                  </div>
                ) : (
                  <div className="rsp-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "20px" }}>
                    {sellos.filter(s => s.estado === "activo").map(s => {
                      const picked = selSello?.id === s.id;
                      return (
                        <div key={s.id} onClick={() => setSelSello(s)}
                          style={{ backgroundColor: picked ? ggl : card, border: `2px solid ${picked ? accent : bd}`, borderRadius: "12px", padding: "16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "7px", textAlign: "center", transition: "all .2s" }}
                          onMouseEnter={e => { if (!picked) (e.currentTarget as HTMLElement).style.borderColor = bdA; }}
                          onMouseLeave={e => { if (!picked) (e.currentTarget as HTMLElement).style.borderColor = bd; }}>
                          <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: labelGrad(s.iniciales ?? "?"), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 800, color: "#fff" }}>{s.iniciales ?? "?"}</div>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: t1 }}>{s.nombre}</div>
                          <div style={{ fontSize: "9.5px", color: t3, fontWeight: 300 }}>{s.email}</div>
                          <div style={{ width: "19px", height: "19px", borderRadius: "50%", border: `2px solid ${picked ? accent : bd}`, background: picked ? accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: picked ? "#010e06" : "transparent", transition: "all .2s" }}>✓</div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button disabled={!selSello} onClick={() => goSt(2)}
                    style={{ fontFamily: "inherit", fontSize: "13.5px", fontWeight: 600, padding: "11px 24px", borderRadius: "8px", border: "none", cursor: selSello ? "pointer" : "not-allowed", background: selSello ? accent : elev, color: selSello ? "#020a04" : t3, boxShadow: selSello ? "0 0 22px rgba(212,175,55,0.25)" : "none" }}>
                    {tx.continuar}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Type + quarter/year/total */}
            {step === 2 && (
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "5px", color: t1 }}>{tx.paso2Title}</div>
                <div style={{ fontSize: "12px", color: t2, fontWeight: 300, marginBottom: "17px" }}>{tx.paso2Sub}</div>
                <div className="rsp-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }}>
                  {([
                    { key: "streaming" as const, icon: "🎵", label: "Streaming", desc: tx.streamingPlatDesc },
                    { key: "youtube"   as const, icon: "▶️", label: "YouTube",   desc: tx.youtubePlatDesc  },
                  ]).map(t => {
                    const picked = selType === t.key;
                    return (
                      <div key={t.key} onClick={() => setSelType(t.key)}
                        style={{ backgroundColor: picked ? ggl : card, border: `2px solid ${picked ? accent : bd}`, borderRadius: "12px", padding: "18px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "13px", transition: "all .2s" }}
                        onMouseEnter={e => { if (!picked) (e.currentTarget as HTMLElement).style.borderColor = bdA; }}
                        onMouseLeave={e => { if (!picked) (e.currentTarget as HTMLElement).style.borderColor = bd; }}>
                        <div style={{ fontSize: "26px", flexShrink: 0 }}>{t.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "2px", color: t1 }}>{t.label}</div>
                          <div style={{ fontSize: "11px", color: t2, fontWeight: 300 }}>{t.desc}</div>
                        </div>
                        <div style={{ width: "19px", height: "19px", borderRadius: "50%", border: `2px solid ${picked ? accent : bd}`, background: picked ? accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: picked ? "#010e06" : "transparent", flexShrink: 0, transition: "all .2s" }}>✓</div>
                      </div>
                    );
                  })}
                </div>

                {/* Quarter / Year */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                  <div>
                    <label style={{ fontSize: "10px", color: t3, letterSpacing: ".08em", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>
                      {lang === "es" ? "Trimestre" : "Quarter"}
                    </label>
                    <select value={selTrimestre} onChange={e => setTrimestre(e.target.value)} style={{ ...selectStyle, width: "100%" }}>
                      {["1","2","3","4"].map(q => <option key={q} value={q} style={{ backgroundColor: card }}>Q{q}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", color: t3, letterSpacing: ".08em", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>
                      {lang === "es" ? "Año" : "Year"}
                    </label>
                    <input type="number" value={selAnio} onChange={e => setAnio(e.target.value)} min="2000" max="2099" style={inputStyle} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button onClick={() => goSt(1)} style={{ fontFamily: "inherit", fontSize: "13px", fontWeight: 500, padding: "10px 20px", background: "transparent", color: t2, border: `1px solid ${bd}`, borderRadius: "8px", cursor: "pointer" }}>{tx.atras}</button>
                  <button disabled={!selType} onClick={() => goSt(3)}
                    style={{ fontFamily: "inherit", fontSize: "13.5px", fontWeight: 600, padding: "11px 24px", borderRadius: "8px", border: "none", cursor: selType ? "pointer" : "not-allowed", background: selType ? accent : elev, color: selType ? "#020a04" : t3, boxShadow: selType ? "0 0 22px rgba(212,175,55,0.25)" : "none" }}>
                    {tx.continuar}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Upload file */}
            {step === 3 && (
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "4px", color: t1 }}>{tx.paso3Title}</div>
                <div style={{ fontSize: "12px", color: t2, fontWeight: 300, marginBottom: "17px" }}>
                  {lang === "es" ? "Para" : "For"}: <strong style={{ color: t1 }}>{selSello?.nombre}</strong> · {lang === "es" ? "Tipo" : "Type"}: <strong style={{ color: t1 }}>{selType === "streaming" ? "🎵 Streaming" : "▶️ YouTube"}</strong> · Q{selTrimestre} {selAnio}
                </div>

                {(upState === "idle" || upState === "dragging") && (
                  <>
                    <div
                      onDragOver={e => { e.preventDefault(); setUpState("dragging"); }}
                      onDragLeave={() => setUpState("idle")}
                      onDrop={e => { e.preventDefault(); setUpState("idle"); const f = e.dataTransfer.files[0]; if (f) doUpload(f); }}
                      onClick={() => fileRef.current?.click()}
                      className="rsp-upload-zone"
                      style={{ border: `2.5px dashed ${upState === "dragging" ? accent : "rgba(212,175,55,0.28)"}`, borderRadius: "16px", padding: "50px 32px", textAlign: "center", cursor: "pointer", background: upState === "dragging" ? "rgba(212,175,55,0.044)" : "rgba(212,175,55,0.013)", transition: "all .25s", marginBottom: "13px" }}>
                      <input ref={fileRef} type="file" accept=".xlsx" style={{ display: "none" }}
                        onChange={e => { if (e.target.files?.[0]) doUpload(e.target.files[0]); }} />
                      <div style={{ fontSize: "46px", marginBottom: "12px", lineHeight: 1 }}>📂</div>
                      <div style={{ fontSize: "19px", fontWeight: 800, marginBottom: "6px", color: t1 }}>{upState === "dragging" ? tx.dropActive : tx.dropTitle}</div>
                      <div style={{ fontSize: "12.5px", color: t2, fontWeight: 300, maxWidth: "360px", margin: "0 auto 16px" }}>{tx.dropSub}</div>
                      <button onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                        style={{ fontFamily: "inherit", fontSize: "14px", fontWeight: 600, padding: "12px 30px", background: accent, color: "#020a04", border: "none", borderRadius: "8px", cursor: "pointer", boxShadow: "0 0 22px rgba(212,175,55,0.25)" }}>
                        {tx.seleccionar}
                      </button>
                      <div style={{ fontFamily: "monospace", fontSize: "8.5px", color: t3, letterSpacing: ".1em", textTransform: "uppercase", marginTop: "12px" }}>.xlsx · Máx 20MB</div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button onClick={() => goSt(2)} style={{ fontFamily: "inherit", fontSize: "13px", fontWeight: 500, padding: "10px 20px", background: "transparent", color: t2, border: `1px solid ${bd}`, borderRadius: "8px", cursor: "pointer" }}>{tx.atras}</button>
                    </div>
                  </>
                )}

                {upState === "uploading" && (
                  <div style={{ background: "rgba(212,175,55,0.05)", border: `1px solid rgba(212,175,55,0.15)`, borderRadius: "12px", padding: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                      <div style={{ fontSize: "20px" }}>📗</div>
                      <div style={{ flex: 1, fontSize: "12.5px", fontWeight: 500, color: t1 }}>{upFile?.name}</div>
                      <span style={{ fontFamily: "monospace", fontSize: "12px", color: accent }}>{progress}%</span>
                    </div>
                    <div style={{ width: "100%", height: "3px", borderRadius: "2px", background: elev, overflow: "hidden", marginBottom: "8px" }}>
                      <div style={{ height: "100%", width: `${progress}%`, borderRadius: "2px", background: `linear-gradient(90deg,${accent},${green})`, transition: "width .2s" }} />
                    </div>
                    <div style={{ fontSize: "11px", color: t3 }}>{tx.uploading}</div>
                  </div>
                )}

                {upState === "error" && (
                  <div style={{ background: "rgba(239,68,68,0.07)", border: `1px solid rgba(239,68,68,0.2)`, borderRadius: "12px", padding: "28px", textAlign: "center" }}>
                    <div style={{ fontSize: "36px", marginBottom: "10px" }}>❌</div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: t1, marginBottom: "6px" }}>{lang === "es" ? "Error al subir" : "Upload failed"}</div>
                    <div style={{ fontSize: "12px", color: "#fca5a5", marginBottom: "18px" }}>{upError}</div>
                    <button onClick={() => { setUpState("idle"); setUpError(null); }}
                      style={{ fontFamily: "inherit", fontSize: "13px", fontWeight: 600, padding: "10px 24px", background: accent, color: "#020a04", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                      {lang === "es" ? "Reintentar" : "Try again"}
                    </button>
                  </div>
                )}

                {upState === "success" && (
                  <div style={{ background: "rgba(212,175,55,0.06)", border: `1.5px solid ${bdA}`, borderRadius: "14px", padding: "40px", textAlign: "center" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
                    <div style={{ fontSize: "21px", fontWeight: 800, marginBottom: "6px", color: t1 }}>{tx.successTitle}</div>
                    <div style={{ fontSize: "13px", color: t2, fontWeight: 300, lineHeight: 1.65, maxWidth: "340px", margin: "0 auto 14px" }}>
                      {upFile?.name} {tx.successSub1} <strong style={{ color: t1 }}>{selSello?.nombre}</strong>. {tx.successSub2}
                    </div>
                    {upResult && (
                      <div style={{ display: "inline-block", background: "rgba(212,175,55,0.08)", border: `1px solid ${bdA}`, borderRadius: "10px", padding: "10px 22px", marginBottom: "22px" }}>
                        <div style={{ fontSize: "10px", color: t3, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: "3px" }}>
                          {lang === "es" ? "Total regalías calculado" : "Calculated royalties"}
                        </div>
                        <div style={{ fontSize: "22px", fontWeight: 800, color: accent, fontFamily: "monospace" }}>
                          {fmtCurrency(upResult.total_regalias)}
                        </div>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "9px", justifyContent: "center", flexWrap: "wrap" }}>
                      <button onClick={resetUp} style={{ fontFamily: "inherit", fontSize: "13.5px", fontWeight: 600, padding: "11px 24px", background: accent, color: "#020a04", border: "none", borderRadius: "8px", cursor: "pointer" }}>{tx.subirMas}</button>
                      <button onClick={() => navTo("sellos")} style={{ fontFamily: "inherit", fontSize: "13px", fontWeight: 500, padding: "10px 20px", background: "transparent", color: t2, border: `1px solid ${bd}`, borderRadius: "8px", cursor: "pointer" }}>{tx.verSellos}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* === SELLOS === */}
        {view === "sellos" && (
          <div>
            <div className="rsp-wrap rsp-sellos-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <EyeBrow text={lang === "es" ? "Gestión de Sellos" : "Label Management"} />
                <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-.035em", marginBottom: "3px", color: t1 }}>{tx.sellosTitle}</div>
                <div style={{ fontSize: "12px", color: t2, fontWeight: 300 }}>{tx.sellosSub}</div>
              </div>
              <button onClick={() => setShowNewSello(v => !v)}
                style={{ fontFamily: "inherit", fontSize: "13.5px", fontWeight: 600, padding: "11px 24px", background: showNewSello ? elev : accent, color: showNewSello ? t2 : "#020a04", border: showNewSello ? `1px solid ${bd}` : "none", borderRadius: "8px", cursor: "pointer", marginTop: "4px", boxShadow: showNewSello ? "none" : "0 0 22px rgba(212,175,55,0.25)" }}>
                {showNewSello ? (lang === "es" ? "Cancelar" : "Cancel") : tx.agregarSello}
              </button>
            </div>

            {/* New sello inline form */}
            {showNewSello && (
              <div style={{ ...cardStyle, padding: "20px", marginBottom: "20px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: t1, marginBottom: "14px" }}>
                  {lang === "es" ? "Nuevo Sello" : "New Label"}
                </div>
                {newSelloErr && (
                  <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", padding: "8px 12px", color: "#fca5a5", fontSize: "11px", marginBottom: "12px" }}>{newSelloErr}</div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                  {[
                    { label: lang === "es" ? "Nombre *" : "Name *",           key: "nombre",        placeholder: "Discos Relámpago" },
                    { label: "Email *",                                        key: "email",         placeholder: "info@sello.com" },
                    { label: lang === "es" ? "Contraseña *" : "Password *",   key: "password",      placeholder: "••••••••" },
                    { label: lang === "es" ? "Iniciales" : "Initials",        key: "iniciales",     placeholder: "DR" },
                    { label: lang === "es" ? "Representante" : "Representative", key: "representante", placeholder: "John Doe" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: "9px", color: t3, letterSpacing: ".08em", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>{f.label}</label>
                      <input
                        type={f.key === "password" ? "password" : "text"}
                        placeholder={f.placeholder}
                        value={(newSello as Record<string, string>)[f.key]}
                        onChange={e => setNewSello(prev => ({ ...prev, [f.key]: e.target.value }))}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={handleCreateSello} disabled={newSelloLoading}
                    style={{ fontFamily: "inherit", fontSize: "13px", fontWeight: 600, padding: "10px 24px", background: accent, color: "#020a04", border: "none", borderRadius: "8px", cursor: newSelloLoading ? "not-allowed" : "pointer" }}>
                    {newSelloLoading ? "…" : (lang === "es" ? "Crear Sello" : "Create Label")}
                  </button>
                </div>
              </div>
            )}

            {loadingData ? (
              <div style={{ color: t3, textAlign: "center", padding: "32px" }}>{lang === "es" ? "Cargando…" : "Loading…"}</div>
            ) : (
              <div className="rsp-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
                {sellos.map(s => (
                  <div key={s.id}
                    style={{ ...cardStyle, overflow: "hidden", transition: "all .22s" }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = bdA; el.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = bd; el.style.transform = "translateY(0)"; }}>
                    <div style={{ padding: "18px 18px 12px", display: "flex", alignItems: "flex-start", gap: "11px" }}>
                      <div style={{ width: "42px", height: "42px", borderRadius: "10px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, color: "#fff", background: labelGrad(s.iniciales ?? "?") }}>{s.iniciales ?? "?"}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "14.5px", fontWeight: 700, marginBottom: "2px", color: t1 }}>{s.nombre}</div>
                        <div style={{ fontSize: "10.5px", color: t3, fontWeight: 300 }}>{s.email}</div>
                      </div>
                      {statusBadge(s.estado)}
                    </div>
                    <div style={{ padding: "0 18px 15px", borderTop: `1px solid ${bd}` }}>
                      <div style={{ display: "flex", gap: "16px", paddingTop: "11px", marginBottom: "12px" }}>
                        <div>
                          <div style={{ fontSize: "17px", fontWeight: 800, color: accent }}>{s.total_reportes}</div>
                          <div style={{ fontSize: "9px", color: t3, fontWeight: 300 }}>{tx.archivosSubidos}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "17px", fontWeight: 800, color: t1 }}>{fmtCurrency(s.total_regalias)}</div>
                          <div style={{ fontSize: "9px", color: t3, fontWeight: 300 }}>{tx.total2025}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => { setSelSello(s); navTo("subir"); }}
                          style={{ flex: 1, fontFamily: "inherit", fontSize: "11px", fontWeight: 600, padding: "8px 9px", borderRadius: "6px", cursor: "pointer", border: "none", background: accent, color: "#020a04", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                          {tx.subirArchivos}
                        </button>
                        <Link to="/portal" style={{ flex: 1, fontFamily: "inherit", fontSize: "11px", fontWeight: 600, padding: "8px 9px", borderRadius: "6px", cursor: "pointer", background: elev, color: t2, border: `1px solid ${bd}`, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {tx.verPortal}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                <div
                  onClick={() => setShowNewSello(true)}
                  style={{ ...cardStyle, border: `2px dashed ${bd}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", padding: "26px", cursor: "pointer", transition: "all .22s", minHeight: "180px" }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = bdA; el.style.background = ggl; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = bd; el.style.background = card; }}>
                  <div style={{ fontSize: "26px" }}>＋</div>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: t1 }}>{tx.agregarNuevo}</div>
                  <div style={{ fontSize: "11px", color: t3, fontWeight: 300, textAlign: "center" }}>{tx.agregarNuevoDesc}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === REPORTES === */}
        {view === "reportes" && (
          <div>
            <EyeBrow text={lang === "es" ? "Historial" : "History"} />
            <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-.035em", marginBottom: "3px", color: t1 }}>{tx.reportesTitle}</div>
            <div style={{ fontSize: "12px", color: t2, fontWeight: 300, marginBottom: "22px" }}>{tx.reportesSub}</div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              <input type="text" placeholder={tx.buscarPlaceholder} value={search} onChange={e => setSearch(e.target.value)}
                style={{ fontFamily: "inherit", fontSize: "12px", background: card, border: `1px solid ${bd}`, color: t1, borderRadius: "7px", padding: "7px 12px", width: "185px", outline: "none" }} />

              <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={selectStyle}>
                <option value="all" style={{ backgroundColor: card }}>{tx.allYears}</option>
                {reportYears.map(y => <option key={y} value={y} style={{ backgroundColor: card }}>{y}</option>)}
              </select>

              <select value={filterLabelName} onChange={e => setFilterLabel(e.target.value)} style={selectStyle}>
                <option value="all" style={{ backgroundColor: card }}>{tx.allLabels}</option>
                {reportLabels.map(l => <option key={l} value={l} style={{ backgroundColor: card }}>{l}</option>)}
              </select>

              {[{ k: "all", l: tx.todos }, { k: "streaming", l: "Streaming" }, { k: "youtube", l: "YouTube" }].map(f => (
                <button key={f.k} onClick={() => setFilterType(f.k)}
                  style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: ".07em", padding: "6px 13px", borderRadius: "16px", cursor: "pointer", border: filterType === f.k ? `1px solid ${accent}` : `1px solid ${bd}`, color: filterType === f.k ? accent : t3, background: filterType === f.k ? ggl : "none", transition: "all .18s" }}>
                  {f.l}
                </button>
              ))}
            </div>

            {loadingData ? (
              <div style={{ color: t3, textAlign: "center", padding: "32px" }}>{lang === "es" ? "Cargando…" : "Loading…"}</div>
            ) : filteredReports.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: t3, fontSize: "13px" }}>
                {lang === "es" ? "No se encontraron reportes." : "No reports found."}
              </div>
            ) : (
              filteredReports.map(r => (
                <div key={r.id}
                  style={{ backgroundColor: card, border: `1px solid ${bd}`, borderRadius: "10px", display: "flex", alignItems: "center", gap: "13px", padding: "13px 17px", marginBottom: "6px", transition: "all .18s" }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(212,175,55,0.14)"; el.style.backgroundColor = elev; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = bd; el.style.backgroundColor = card; }}>
                  <div style={{ fontSize: "22px", flexShrink: 0 }}>📗</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="rsp-report-name" style={{ fontSize: "12.5px", fontWeight: 500, marginBottom: "3px", color: t1 }}>{r.nombre_archivo}</div>
                    <div style={{ display: "flex", gap: "7px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "8px", padding: "2px 7px", borderRadius: "4px", background: r.tipo === "streaming" ? "rgba(212,175,55,0.1)" : "rgba(255,96,96,0.08)", color: r.tipo === "streaming" ? accent : "#ff8888", border: r.tipo === "streaming" ? `1px solid rgba(212,175,55,0.2)` : "1px solid rgba(255,96,96,0.18)" }}>
                        {r.tipo === "streaming" ? "Streaming" : "YouTube"}
                      </span>
                      <span style={{ fontSize: "10.5px", color: t2 }}>{r.sello_nombre}</span>
                      <span style={{ fontFamily: "monospace", fontSize: "8.5px", color: t3, background: elev, padding: "2px 6px", borderRadius: "4px" }}>Q{r.trimestre} {r.anio}</span>
                    </div>
                  </div>
                  <div className="hide-on-mobile" style={{ fontFamily: "monospace", fontSize: "12.5px", color: t1, whiteSpace: "nowrap" }}>{fmtCurrency(r.total_regalias)}</div>
                  <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                    <button onClick={() => handleDownloadReport(r.id)}
                      style={{ fontFamily: "monospace", fontSize: "9px", padding: "5px 10px", background: "transparent", border: `1px solid ${bd}`, color: t2, borderRadius: "5px", cursor: "pointer", transition: "all .18s" }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = bdA; el.style.color = accent; el.style.background = ggl; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = bd; el.style.color = t2; el.style.background = "transparent"; }}>
                      {tx.descargar}
                    </button>
                    <button onClick={() => handleDeleteReport(r.id)}
                      style={{ fontFamily: "monospace", fontSize: "9px", padding: "5px 10px", background: "transparent", border: `1px solid ${bd}`, color: t2, borderRadius: "5px", cursor: "pointer", transition: "all .18s" }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(255,96,96,0.3)"; el.style.color = "#ff6060"; el.style.background = "rgba(255,96,96,0.06)"; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = bd; el.style.color = t2; el.style.background = "transparent"; }}>
                      {tx.eliminar}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </main>
    </div>
  );
}
