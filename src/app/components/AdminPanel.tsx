import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { useLang } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { authApi, sellosApi, reportesApi, storageApi, type Sello, type Reporte, type StorageInfo, type BulkUploadResult, type BulkUploadResponse } from "../services/api";
import { T } from "../i18n";

type AdminView  = "inicio" | "subir" | "sellos" | "reportes" | "bulk";
type UploadStep = 1 | 2 | 3;
type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";
type BulkState  = "idle" | "dragging" | "previewing" | "uploading" | "processing" | "done";

interface BulkPreviewItem {
  file: File;
  sello: string;
  tipo: "streaming" | "youtube" | "unknown";
  trimestre: number;
  anio: number;
  isDuplicate: boolean;
}

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

function parseBulkFilename(filename: string, defaultTrimestre: string, defaultAnio: string): BulkPreviewItem {
  // Streaming pattern: {year}-{month}_{Label}[_{extra}].xlsx
  const streamingMatch = filename.match(/^(\d{4})-(\d{2})_(.+?)(?:\.xlsx)?$/i);
  if (streamingMatch) {
    const anio = parseInt(streamingMatch[1]);
    const month = parseInt(streamingMatch[2]);
    const base = (streamingMatch[3] ?? "");
    const parts = base.split("_");
    const sello = (parts[0] ?? "").trim().replace(/^[-\s]+/, "");
    const trimestre = Math.min(4, Math.ceil(month / 3)) || 1;
    return { file: null as unknown as File, sello, tipo: "streaming", trimestre, anio, isDuplicate: false };
  }
  // YouTube pattern: {Q}Q-{year} Youtube[ _-]{Label}.xlsx
  const youtubeMatch = filename.match(/^(\d+)Q-(\d{4})\s+Youtube[\s_-]+(.+?)(?:\.xlsx)?$/i);
  if (youtubeMatch) {
    const trimestre = Math.min(4, parseInt(youtubeMatch[1])) || 1;
    const anio = parseInt(youtubeMatch[2]);
    const sello = youtubeMatch[3].trim();
    return { file: null as unknown as File, sello, tipo: "youtube", trimestre, anio, isDuplicate: false };
  }
  return {
    file: null as unknown as File,
    sello: "",
    tipo: "unknown",
    trimestre: parseInt(defaultTrimestre) || 1,
    anio: parseInt(defaultAnio) || new Date().getFullYear(),
    isDuplicate: false,
  };
}

export function AdminPanel() {
  const { lang } = useLang();
  const { user } = useAuth();
  const tx = T[lang];

  // Add CSS animation for indeterminate progress
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Navigation
  const [view, setView] = useState<AdminView>("inicio");
  const navTo = (v: AdminView) => setView(v);

  // Data state
  const [sellos,      setSellos]   = useState<Sello[]>([]);
  const [allReports,  setReports]  = useState<Reporte[]>([]);
  const [loadingData, setLoading]  = useState(true);
  const [storage,     setStorage]  = useState<StorageInfo | null>(null);

  // Edit sello modal state
  const [editSello,   setEditSello]   = useState<Sello | null>(null);
  const [editForm,    setEditForm]    = useState({ nombre: "", representante: "", email: "", pais: "", telefono: "", iniciales: "", password: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editErr,     setEditErr]     = useState<string | null>(null);

  // Delete confirm modal state
  const [deleteSello,     setDeleteSello]     = useState<Sello | null>(null);
  const [deletePassword,  setDeletePassword]  = useState("");
  const [deleteLoading,   setDeleteLoading]   = useState(false);
  const [deleteErr,       setDeleteErr]       = useState<string | null>(null);

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
  const [reportPage,      setReportPage]   = useState(1);
  const REPORTS_PER_PAGE = 15;

  // New sello form
  const [showNewSello, setShowNewSello] = useState(false);
  const [newSello, setNewSello] = useState({ nombre: "", email: "", password: "", iniciales: "", representante: "" });
  const [newSelloErr, setNewSelloErr] = useState<string | null>(null);
  const [newSelloLoading, setNewSelloLoading] = useState(false);

  // Bulk upload state
  const [bulkState,     setBulkState]    = useState<BulkState>("idle");
  const [bulkTrimestre, setBulkTrimestre] = useState("1");
  const [bulkAnio,      setBulkAnio]     = useState(String(new Date().getFullYear()));
  const [bulkPreviews,  setBulkPreviews] = useState<BulkPreviewItem[]>([]);
  const [bulkResponse,  setBulkResponse] = useState<BulkUploadResponse | null>(null);
  const [bulkError,     setBulkError]    = useState<string | null>(null);
  const [bulkProgress,  setBulkProgress] = useState(0);
  const bulkFileRef = useRef<HTMLInputElement>(null);

  const resetBulk = () => {
    setBulkState("idle");
    setBulkPreviews([]);
    setBulkResponse(null);
    setBulkError(null);
    setBulkProgress(0);
    if (bulkFileRef.current) bulkFileRef.current.value = "";
  };

  const handleBulkFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const xlsx = Array.from(files).filter(f => f.name.endsWith(".xlsx")).slice(0, 30);
    if (xlsx.length === 0) return;
    const previews = xlsx.map(f => {
      const parsed = parseBulkFilename(f.name, bulkTrimestre, bulkAnio);
      const isDuplicate = parsed.tipo !== "unknown" && allReports.some(r =>
        r.sello_nombre.trim().toLowerCase() === parsed.sello.trim().toLowerCase() &&
        r.tipo === parsed.tipo &&
        r.trimestre === parsed.trimestre &&
        r.anio === parsed.anio
      );
      return { ...parsed, file: f, isDuplicate };
    });
    setBulkPreviews(previews);
    setBulkState("previewing");
  };

  const doBulkUpload = async () => {
    setBulkState("uploading");
    setBulkError(null);
    setBulkProgress(0);
    try {
      const fd = new FormData();
      bulkPreviews.forEach(p => fd.append("files[]", p.file));
      fd.append("trimestre", bulkTrimestre);
      fd.append("anio", bulkAnio);
      const result = await reportesApi.bulkUpload(
        fd,
        (progress) => setBulkProgress(progress),
        () => setBulkState("processing")
      );
      setBulkResponse(result);
      setBulkState("done");
      refreshData();
    } catch (err: unknown) {
      setBulkError(err instanceof Error ? err.message : "Error");
      setBulkState("previewing");
    }
  };

  useEffect(() => {
    Promise.all([sellosApi.list(), reportesApi.list(), storageApi.usage()])
      .then(([s, r, st]) => { setSellos(s); setReports(r); setStorage(st); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const refreshData = () => {
    Promise.all([sellosApi.list(), reportesApi.list(), storageApi.usage()])
      .then(([s, r, st]) => { setSellos(s); setReports(r); setStorage(st); })
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
      storageApi.usage().then(setStorage).catch(() => {});
    } catch { /* ignore */ }
  };

  const handleToggleEstado = async (s: Sello) => {
    const nuevoEstado = s.estado === "activo" ? "inactivo" : "activo";
    const msg = lang === "es"
      ? `¿${nuevoEstado === "inactivo" ? "Desactivar" : "Activar"} "${s.nombre}"?`
      : `${nuevoEstado === "inactivo" ? "Deactivate" : "Activate"} "${s.nombre}"?`;
    if (!window.confirm(msg)) return;
    try {
      const updated = await sellosApi.toggleEstado(s.id, nuevoEstado);
      setSellos(prev => prev.map(x => x.id === updated.id ? { ...x, estado: updated.estado } : x));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  };

  const handleHardDelete = (s: Sello) => {
    setDeleteSello(s);
    setDeletePassword("");
    setDeleteErr(null);
  };

  const confirmHardDelete = async () => {
    if (!deleteSello || !user?.email) return;
    setDeleteLoading(true);
    setDeleteErr(null);
    try {
      await authApi.login(user.email, deletePassword);
    } catch {
      setDeleteErr(lang === "es" ? "Contraseña incorrecta." : "Incorrect password.");
      setDeleteLoading(false);
      return;
    }
    try {
      await sellosApi.remove(deleteSello.id);
      setSellos(prev => prev.filter(x => x.id !== deleteSello.id));
      setDeleteSello(null);
      refreshData();
    } catch (err) {
      setDeleteErr(err instanceof Error ? err.message : "Error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOpenEdit = (s: Sello) => {
    setEditSello(s);
    setEditForm({
      nombre: s.nombre,
      representante: s.representante ?? "",
      email: s.email,
      pais: s.pais ?? "",
      telefono: s.telefono ?? "",
      iniciales: s.iniciales ?? "",
      password: "",
    });
    setEditErr(null);
  };

  const handleSaveEdit = async () => {
    if (!editSello) return;
    setEditLoading(true);
    setEditErr(null);
    try {
      const payload: Record<string, string> = { ...editForm, estado: editSello.estado };
      if (!payload.password) delete payload.password;
      await sellosApi.update(editSello.id, payload);
      setEditSello(null);
      refreshData();
    } catch (err) {
      setEditErr(err instanceof Error ? err.message : "Error");
    } finally {
      setEditLoading(false);
    }
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
  const totalReportPages = Math.max(1, Math.ceil(filteredReports.length / REPORTS_PER_PAGE));
  const pagedReports = filteredReports.slice((reportPage - 1) * REPORTS_PER_PAGE, reportPage * REPORTS_PER_PAGE);

  const statusBadge = (s: "activo" | "inactivo") =>
    s === "activo"
      ? <span style={{ fontFamily: "monospace", fontSize: "8px", padding: "3px 8px", borderRadius: "8px", background: `rgba(212,175,55,0.08)`, color: accent, border: `1px solid rgba(212,175,55,0.2)` }}>{tx.activo}</span>
      : <span style={{ fontFamily: "monospace", fontSize: "8px", padding: "3px 8px", borderRadius: "8px", background: `rgba(245,158,11,0.08)`, color: amber, border: `1px solid rgba(245,158,11,0.2)` }}>{tx.pendiente}</span>;

  const navItems = [
    { id: "inicio"   as AdminView, icon: "🏠", label: tx.inicio,   desc: tx.inicioDesc },
    { id: "subir"    as AdminView, icon: "📤", label: tx.subir,    desc: tx.subirDesc },
    { id: "bulk"     as AdminView, icon: "📦", label: tx.bulk,     desc: tx.bulkDesc },
    { id: "sellos"   as AdminView, icon: "🎵", label: tx.sellos,   desc: tx.sellosDesc,   badge: { text: String(sellos.length), type: "green" } },
    { id: "reportes" as AdminView, icon: "📂", label: tx.reportes, desc: tx.reportesDesc },
  ] as const;

  const selectStyle: React.CSSProperties = {
    fontFamily: "inherit", fontSize: "14px",
    background: card, border: `1px solid ${bd}`,
    color: t2, borderRadius: "7px",
    padding: "8px 12px", outline: "none", cursor: "pointer",
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: "inherit", fontSize: "15px",
    background: elev, border: `1px solid ${bd}`,
    color: t1, borderRadius: "7px",
    padding: "10px 14px", outline: "none", width: "100%",
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
                <div style={{ fontSize: "15px", fontWeight: 500, lineHeight: 1.2 }}>{item.label}</div>
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
          {storage && (() => {
            const FILE_LIMIT = 1000;
            const filePct = Math.min(100, Math.round((storage.total_files / FILE_LIMIT) * 100));
            return (
              <div style={{ background: ggl, border: `1px solid ${filePct >= 90 ? "rgba(239,68,68,0.3)" : filePct >= 75 ? "rgba(245,158,11,0.3)" : bdA}`, borderRadius: "8px", padding: "10px 12px", marginBottom: "9px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: filePct >= 90 ? "#ef4444" : filePct >= 75 ? amber : accent }}>
                    {lang === "es" ? "Archivos en R2" : "Files in R2"}
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: "9px", color: filePct >= 90 ? "#ef4444" : filePct >= 75 ? amber : t3 }}>
                    {storage.total_files} / {FILE_LIMIT}
                  </div>
                </div>
                <div style={{ height: "3px", borderRadius: "2px", background: elev, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${filePct}%`, borderRadius: "2px", background: filePct >= 90 ? "#ef4444" : filePct >= 75 ? amber : accent, transition: "width .3s" }} />
                </div>
                <div style={{ fontSize: "9px", color: t3, marginTop: "4px" }}>
                  {filePct}% {lang === "es" ? "del límite" : "of limit"}
                  {filePct >= 90 && <span style={{ color: "#ef4444", fontWeight: 600 }}> · {lang === "es" ? "¡Límite próximo!" : "Limit near!"}</span>}
                </div>
              </div>
            );
          })()}
          <div style={{ background: ggl, border: `1px solid ${bdA}`, borderRadius: "8px", padding: "12px", marginBottom: "9px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: accent, marginBottom: "3px" }}>{tx.tipTitle}</div>
            <div style={{ fontSize: "13px", color: t2, lineHeight: 1.5, fontWeight: 300 }}>{tx.tipBody}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "8px", backgroundColor: elev }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: `linear-gradient(135deg,${accent},${green})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 800, color: "#010e06", flexShrink: 0 }}>
              {user?.nombre?.slice(0, 2).toUpperCase() ?? "AD"}
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: t1 }}>{user?.nombre ?? "Admin"}</div>
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
            <div style={{ fontSize: "14px", color: t2, fontWeight: 300, marginBottom: "22px" }}>{tx.inicioSub}</div>

            <div className="rsp-wrap" style={{ background: `linear-gradient(135deg,rgba(212,175,55,0.07),rgba(212,175,55,0.03))`, border: `1px solid ${bdA}`, borderRadius: "14px", padding: "26px 30px", marginBottom: "22px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: "-44px", top: "-44px", width: "180px", height: "180px", borderRadius: "50%", background: "radial-gradient(circle,rgba(212,175,55,0.1),transparent 70%)" }} />
              <div>
                <div style={{ fontSize: "19px", fontWeight: 800, letterSpacing: "-.03em", marginBottom: "5px", color: t1 }}>
                  {tx.welcomeTitle}
                </div>
                <div style={{ fontSize: "15px", color: t2, fontWeight: 300, lineHeight: 1.6, maxWidth: "380px" }}>{tx.welcomeDesc}</div>
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

          </div>
        )}

        {/* === SUBIR === */}
        {view === "subir" && (
          <div>
            <EyeBrow text={tx.subir} />
            <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-.035em", marginBottom: "3px", color: t1 }}>{tx.subirTitle}</div>
            <div style={{ fontSize: "14px", color: t2, fontWeight: 300, marginBottom: "22px" }}>{tx.subirSub}</div>

            {storage && storage.total_files >= 1000 && (
              <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "12px", padding: "28px", textAlign: "center", marginBottom: "22px" }}>
                <div style={{ fontSize: "36px", marginBottom: "10px" }}>🚫</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: t1, marginBottom: "8px" }}>
                  {lang === "es" ? "Límite de archivos alcanzado (1,000)" : "File Limit Reached (1,000)"}
                </div>
                <div style={{ fontSize: "14px", color: t2, lineHeight: 1.6 }}>
                  {lang === "es"
                    ? "Se ha alcanzado el límite de almacenamiento gratuito de Cloudflare R2. Elimina reportes antiguos en la sección Reportes antes de subir nuevos archivos."
                    : "The Cloudflare R2 free storage limit has been reached. Delete old reports in the Reports section before uploading new files."}
                </div>
                <button onClick={() => navTo("reportes")} style={{ fontFamily: "inherit", fontSize: "13px", fontWeight: 600, padding: "10px 24px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", marginTop: "16px" }}>
                  {lang === "es" ? "Ir a Reportes" : "Go to Reports"}
                </button>
              </div>
            )}

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
                <div style={{ fontSize: "14px", color: t2, fontWeight: 300, marginBottom: "17px" }}>{tx.paso1Sub}</div>
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
                    style={{ fontFamily: "inherit", fontSize: "15px", fontWeight: 600, padding: "11px 24px", borderRadius: "8px", border: "none", cursor: selSello ? "pointer" : "not-allowed", background: selSello ? accent : elev, color: selSello ? "#020a04" : t3, boxShadow: selSello ? "0 0 22px rgba(212,175,55,0.25)" : "none" }}>
                    {tx.continuar}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Type + quarter/year/total */}
            {step === 2 && (
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "5px", color: t1 }}>{tx.paso2Title}</div>
                <div style={{ fontSize: "14px", color: t2, fontWeight: 300, marginBottom: "17px" }}>{tx.paso2Sub}</div>
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
                          <div style={{ fontSize: "13px", color: t2, fontWeight: 300 }}>{t.desc}</div>
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
                    style={{ fontFamily: "inherit", fontSize: "15px", fontWeight: 600, padding: "11px 24px", borderRadius: "8px", border: "none", cursor: selType ? "pointer" : "not-allowed", background: selType ? accent : elev, color: selType ? "#020a04" : t3, boxShadow: selType ? "0 0 22px rgba(212,175,55,0.25)" : "none" }}>
                    {tx.continuar}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Upload file */}
            {step === 3 && (
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "4px", color: t1 }}>{tx.paso3Title}</div>
                <div style={{ fontSize: "14px", color: t2, fontWeight: 300, marginBottom: "17px" }}>
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
                      <div style={{ fontSize: "15px", color: t2, fontWeight: 300, maxWidth: "360px", margin: "0 auto 16px" }}>{tx.dropSub}</div>
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
                      <div style={{ flex: 1, fontSize: "15px", fontWeight: 500, color: t1 }}>{upFile?.name}</div>
                      <span style={{ fontFamily: "monospace", fontSize: "14px", color: accent }}>{progress}%</span>
                    </div>
                    <div style={{ width: "100%", height: "3px", borderRadius: "2px", background: elev, overflow: "hidden", marginBottom: "8px" }}>
                      <div style={{ height: "100%", width: `${progress}%`, borderRadius: "2px", background: `linear-gradient(90deg,${accent},${green})`, transition: "width .2s" }} />
                    </div>
                    <div style={{ fontSize: "13px", color: t3 }}>{tx.uploading}</div>
                  </div>
                )}

                {upState === "error" && (
                  <div style={{ background: "rgba(239,68,68,0.07)", border: `1px solid rgba(239,68,68,0.2)`, borderRadius: "12px", padding: "28px", textAlign: "center" }}>
                    <div style={{ fontSize: "36px", marginBottom: "10px" }}>❌</div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: t1, marginBottom: "6px" }}>{lang === "es" ? "Error al subir" : "Upload failed"}</div>
                    <div style={{ fontSize: "14px", color: "#fca5a5", marginBottom: "18px" }}>{upError}</div>
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
                      <button onClick={resetUp} style={{ fontFamily: "inherit", fontSize: "15px", fontWeight: 600, padding: "11px 24px", background: accent, color: "#020a04", border: "none", borderRadius: "8px", cursor: "pointer" }}>{tx.subirMas}</button>
                      <button onClick={() => navTo("sellos")} style={{ fontFamily: "inherit", fontSize: "13px", fontWeight: 500, padding: "10px 20px", background: "transparent", color: t2, border: `1px solid ${bd}`, borderRadius: "8px", cursor: "pointer" }}>{tx.verSellos}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* === BULK UPLOAD === */}
        {view === "bulk" && (
          <div>
            <EyeBrow text={tx.bulk} />
            <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-.035em", marginBottom: "3px", color: t1 }}>{tx.bulkTitle}</div>
            <div style={{ fontSize: "14px", color: t2, fontWeight: 300, marginBottom: "22px" }}>{tx.bulkSub}</div>

            {/* IDLE / DRAGGING: drop zone */}
            {(bulkState === "idle" || bulkState === "dragging") && (
              <div>
                {/* Default quarter + year */}
                <div style={{ ...cardStyle, padding: "16px 20px", marginBottom: "18px" }}>
                  <div style={{ fontSize: "13px", color: t3, letterSpacing: ".06em", textTransform: "uppercase" as const, marginBottom: "10px" }}>{tx.bulkDefaultsLabel}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "9px", color: t3, letterSpacing: ".08em", textTransform: "uppercase" as const, display: "block", marginBottom: "4px" }}>{tx.bulkTrimLabel}</label>
                      <select value={bulkTrimestre} onChange={e => setBulkTrimestre(e.target.value)} style={{ ...selectStyle, width: "100%" }}>
                        {["1","2","3","4"].map(q => <option key={q} value={q} style={{ backgroundColor: card }}>Q{q}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "9px", color: t3, letterSpacing: ".08em", textTransform: "uppercase" as const, display: "block", marginBottom: "4px" }}>{tx.bulkAnioLabel}</label>
                      <input type="number" value={bulkAnio} onChange={e => setBulkAnio(e.target.value)} min="2000" max="2099" style={inputStyle} />
                    </div>
                  </div>
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setBulkState("dragging"); }}
                  onDragLeave={() => setBulkState("idle")}
                  onDrop={e => { e.preventDefault(); setBulkState("idle"); handleBulkFiles(e.dataTransfer.files); }}
                  onClick={() => bulkFileRef.current?.click()}
                  style={{ border: `2.5px dashed ${bulkState === "dragging" ? accent : "rgba(212,175,55,0.28)"}`, borderRadius: "16px", padding: "50px 32px", textAlign: "center", cursor: "pointer", background: bulkState === "dragging" ? "rgba(212,175,55,0.044)" : "rgba(212,175,55,0.013)", transition: "all .25s", marginBottom: "13px" }}>
                  <input ref={bulkFileRef} type="file" accept=".xlsx" multiple style={{ display: "none" }}
                    onChange={e => { setBulkState("idle"); handleBulkFiles(e.target.files); }} />
                  <div style={{ fontSize: "46px", marginBottom: "12px", lineHeight: 1 }}>📦</div>
                  <div style={{ fontSize: "19px", fontWeight: 800, marginBottom: "6px", color: t1 }}>{bulkState === "dragging" ? tx.bulkDropActive : tx.bulkDropTitle}</div>
                  <div style={{ fontSize: "15px", color: t2, fontWeight: 300, maxWidth: "400px", margin: "0 auto 16px" }}>{tx.bulkDropSub}</div>
                  <button onClick={e => { e.stopPropagation(); bulkFileRef.current?.click(); }}
                    style={{ fontFamily: "inherit", fontSize: "14px", fontWeight: 600, padding: "12px 30px", background: accent, color: "#020a04", border: "none", borderRadius: "8px", cursor: "pointer", boxShadow: "0 0 22px rgba(212,175,55,0.25)" }}>
                    {tx.bulkSelectBtn}
                  </button>
                  <div style={{ fontFamily: "monospace", fontSize: "8.5px", color: t3, letterSpacing: ".1em", textTransform: "uppercase" as const, marginTop: "12px" }}>.xlsx · Máx 30 archivos</div>
                </div>
                <div style={{ fontSize: "10px", color: t3, textAlign: "center", fontFamily: "monospace", letterSpacing: ".02em" }}>{tx.bulkPatternHint}</div>
              </div>
            )}

            {/* PREVIEWING: confirmation table */}
            {bulkState === "previewing" && (
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: t1, marginBottom: "4px" }}>{tx.bulkPreviewTitle}</div>
                <div style={{ fontSize: "14px", color: t2, fontWeight: 300, marginBottom: "14px" }}>
                  {bulkPreviews.length} {tx.bulkDropSub.split(" ").slice(-3).join(" ")}
                </div>
                {bulkPreviews.some(p => p.isDuplicate) && (
                  <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "8px", padding: "10px 14px", color: amber, fontSize: "11.5px", marginBottom: "14px" }}>
                    ⚠️ {lang === "es"
                      ? `${bulkPreviews.filter(p => p.isDuplicate).length} archivo(s) ya existen en el sistema (sello + tipo + trimestre + año coinciden). El backend los marcará como "skipped".`
                      : `${bulkPreviews.filter(p => p.isDuplicate).length} file(s) already exist in the system (label + type + quarter + year match). The backend will mark them as "skipped".`}
                  </div>
                )}
                {bulkError && (
                  <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "10px 14px", color: "#fca5a5", fontSize: "11.5px", marginBottom: "14px" }}>{bulkError}</div>
                )}
                <div style={{ ...cardStyle, overflow: "hidden", marginBottom: "16px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${bd}` }}>
                        {[tx.bulkColFile, tx.bulkColSello, tx.bulkColTipo, tx.bulkColQ, tx.bulkColAnio].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "9px 14px", fontFamily: "monospace", fontSize: "8px", letterSpacing: ".1em", textTransform: "uppercase" as const, color: t3, fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bulkPreviews.map((p, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${bd}`, background: p.isDuplicate ? "rgba(245,158,11,0.04)" : "transparent" }}>
                          <td style={{ padding: "9px 14px", fontSize: "13px", color: t1, maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                            {p.isDuplicate && <span title={lang === "es" ? "Ya existe en el sistema" : "Already exists"} style={{ marginRight: "6px", cursor: "help" }}>⚠️</span>}
                            {p.file.name}
                          </td>
                          <td style={{ padding: "9px 14px", fontSize: "13px", color: p.sello ? t1 : "#ef4444" }}>{p.sello || tx.bulkUnknown}</td>
                          <td style={{ padding: "9px 14px" }}>
                            {p.tipo === "unknown" ? (
                              <span style={{ fontFamily: "monospace", fontSize: "8px", padding: "2px 7px", borderRadius: "4px", background: "rgba(239,68,68,0.08)", color: "#ff8888", border: "1px solid rgba(239,68,68,0.2)" }}>{tx.bulkUnknown}</span>
                            ) : (
                              <span style={{ fontFamily: "monospace", fontSize: "8px", padding: "2px 7px", borderRadius: "4px", background: p.tipo === "streaming" ? "rgba(212,175,55,0.1)" : "rgba(255,96,96,0.08)", color: p.tipo === "streaming" ? accent : "#ff8888", border: p.tipo === "streaming" ? `1px solid rgba(212,175,55,0.2)` : "1px solid rgba(255,96,96,0.18)" }}>
                                {p.tipo === "streaming" ? "Streaming" : "YouTube"}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "9px 14px", fontFamily: "monospace", fontSize: "13px", color: t2 }}>Q{p.trimestre}</td>
                          <td style={{ padding: "9px 14px", fontFamily: "monospace", fontSize: "13px", color: t2 }}>{p.anio}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: "flex", gap: "9px", justifyContent: "flex-end" }}>
                  <button onClick={resetBulk}
                    style={{ fontFamily: "inherit", fontSize: "13px", fontWeight: 500, padding: "10px 20px", background: "transparent", color: t2, border: `1px solid ${bd}`, borderRadius: "8px", cursor: "pointer" }}>
                    {tx.bulkCancelBtn}
                  </button>
                  <button onClick={doBulkUpload}
                    style={{ fontFamily: "inherit", fontSize: "15px", fontWeight: 600, padding: "11px 26px", background: accent, color: "#020a04", border: "none", borderRadius: "8px", cursor: "pointer", boxShadow: "0 0 22px rgba(212,175,55,0.25)" }}>
                    {tx.bulkConfirmBtn.replace("{n}", String(bulkPreviews.length))}
                  </button>
                </div>
              </div>
            )}

            {/* UPLOADING */}
            {(bulkState === "uploading" || bulkState === "processing") && (
              <div style={{ background: "rgba(212,175,55,0.05)", border: `1px solid rgba(212,175,55,0.15)`, borderRadius: "12px", padding: "36px", textAlign: "center" }}>
                <div style={{ fontSize: "38px", marginBottom: "14px" }}>{bulkState === "uploading" ? "📤" : "⚙️"}</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: t1, marginBottom: "6px" }}>
                  {bulkState === "uploading" ? tx.bulkUploading : tx.bulkProcessing}
                </div>
                <div style={{ fontSize: "14px", color: t2, marginBottom: "20px" }}>{bulkPreviews.length} {lang === "es" ? "archivos en cola…" : "files in queue…"}</div>
                <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden", marginBottom: "10px" }}>
                  {bulkState === "processing" ? (
                    <div style={{
                      height: "100%", width: "100%",
                      background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                      borderRadius: "4px",
                      animation: "shimmer 1.5s infinite",
                    }} />
                  ) : (
                    <div style={{
                      height: "100%", width: `${bulkProgress}%`,
                      background: `linear-gradient(90deg, ${accent}, ${green})`,
                      transition: "width 0.3s ease",
                      borderRadius: "4px"
                    }} />
                  )}
                </div>
                <div style={{ fontSize: "12px", color: t3 }}>{bulkState === "processing" ? (lang === "es" ? "Procesando…" : "Processing…") : `${bulkProgress}% ${lang === "es" ? "completado" : "completed"}`}</div>
              </div>
            )}

            {/* DONE: results */}
            {bulkState === "done" && bulkResponse && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "20px" }}>
                  {[
                    { label: tx.bulkResultOk,      value: bulkResponse.ok,      color: accent },
                    { label: tx.bulkResultErrors,   value: bulkResponse.errors,  color: "#ef4444" },
                    { label: tx.bulkResultSkipped,  value: bulkResponse.skipped, color: amber },
                  ].map(s => (
                    <div key={s.label} style={{ ...cardStyle, padding: "18px 20px", textAlign: "center" }}>
                      <div style={{ fontFamily: "monospace", fontSize: "28px", fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: "4px" }}>{s.value}</div>
                      <div style={{ fontSize: "10px", color: t3 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ ...cardStyle, overflow: "hidden", marginBottom: "18px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${bd}` }}>
                        {[tx.bulkColFile, tx.bulkColSello, tx.bulkColTipo, tx.bulkColStatus, tx.bulkColRegalias].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "9px 14px", fontFamily: "monospace", fontSize: "8px", letterSpacing: ".1em", textTransform: "uppercase" as const, color: t3, fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bulkResponse.results.map((r: BulkUploadResult, i: number) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${bd}` }}>
                          <td style={{ padding: "9px 14px", fontSize: "13px", color: t1, maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{r.filename}</td>
                          <td style={{ padding: "9px 14px", fontSize: "13px", color: t2 }}>{r.sello ?? "—"}</td>
                          <td style={{ padding: "9px 14px" }}>
                            {r.tipo ? (
                              <span style={{ fontFamily: "monospace", fontSize: "8px", padding: "2px 7px", borderRadius: "4px", background: r.tipo === "streaming" ? "rgba(212,175,55,0.1)" : "rgba(255,96,96,0.08)", color: r.tipo === "streaming" ? accent : "#ff8888", border: r.tipo === "streaming" ? `1px solid rgba(212,175,55,0.2)` : "1px solid rgba(255,96,96,0.18)" }}>
                                {r.tipo === "streaming" ? "Streaming" : "YouTube"}
                              </span>
                            ) : <span style={{ color: t3 }}>—</span>}
                          </td>
                          <td style={{ padding: "9px 14px" }}>
                            {r.status === "ok" && <span style={{ fontFamily: "monospace", fontSize: "9px", padding: "3px 8px", borderRadius: "5px", background: "rgba(212,175,55,0.08)", color: accent, border: `1px solid rgba(212,175,55,0.2)` }}>{tx.bulkStatusOk}</span>}
                            {r.status === "error" && <span title={r.error} style={{ fontFamily: "monospace", fontSize: "9px", padding: "3px 8px", borderRadius: "5px", background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", cursor: "help" }}>{tx.bulkStatusError}</span>}
                            {r.status === "skipped" && <span style={{ fontFamily: "monospace", fontSize: "9px", padding: "3px 8px", borderRadius: "5px", background: "rgba(245,158,11,0.07)", color: amber, border: "1px solid rgba(245,158,11,0.2)" }}>{tx.bulkStatusSkipped}</span>}
                          </td>
                          <td style={{ padding: "9px 14px", fontFamily: "monospace", fontSize: "13px", color: r.status === "ok" ? t1 : t3 }}>
                            {r.status === "ok" && r.total_regalias != null ? fmtCurrency(r.total_regalias) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={resetBulk}
                    style={{ fontFamily: "inherit", fontSize: "15px", fontWeight: 600, padding: "11px 26px", background: accent, color: "#020a04", border: "none", borderRadius: "8px", cursor: "pointer", boxShadow: "0 0 22px rgba(212,175,55,0.25)" }}>
                    {tx.bulkResetBtn}
                  </button>
                </div>
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
                <div style={{ fontSize: "14px", color: t2, fontWeight: 300 }}>{tx.sellosSub}</div>
              </div>
              <button onClick={() => setShowNewSello(v => !v)}
                style={{ fontFamily: "inherit", fontSize: "15px", fontWeight: 600, padding: "11px 24px", background: showNewSello ? elev : accent, color: showNewSello ? t2 : "#020a04", border: showNewSello ? `1px solid ${bd}` : "none", borderRadius: "8px", cursor: "pointer", marginTop: "4px", boxShadow: showNewSello ? "none" : "0 0 22px rgba(212,175,55,0.25)" }}>
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
                  <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", padding: "8px 12px", color: "#fca5a5", fontSize: "13px", marginBottom: "12px" }}>{newSelloErr}</div>
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
                        <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "2px", color: t1 }}>{s.nombre}</div>
                        <div style={{ fontSize: "13px", color: t3, fontWeight: 300 }}>{s.email}</div>
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
                      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                        <button onClick={() => { setSelSello(s); navTo("subir"); }}
                          style={{ flex: 1, fontFamily: "inherit", fontSize: "13px", fontWeight: 600, padding: "7px 8px", borderRadius: "6px", cursor: "pointer", border: "none", background: accent, color: "#020a04", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", minWidth: "60px" }}>
                          📤 {tx.subirArchivos}
                        </button>
                        <button onClick={() => handleOpenEdit(s)}
                          style={{ fontFamily: "inherit", fontSize: "13px", fontWeight: 600, padding: "7px 9px", borderRadius: "6px", cursor: "pointer", background: elev, color: t2, border: `1px solid ${bd}` }}>
                          ✏️
                        </button>
                        <button onClick={() => handleToggleEstado(s)}
                          style={{ fontFamily: "inherit", fontSize: "13px", fontWeight: 600, padding: "7px 9px", borderRadius: "6px", cursor: "pointer", background: s.estado === "activo" ? "rgba(245,158,11,0.1)" : "rgba(212,175,55,0.1)", color: s.estado === "activo" ? amber : accent, border: `1px solid ${s.estado === "activo" ? "rgba(245,158,11,0.25)" : bdA}` }}>
                          {s.estado === "activo" ? "⏸" : "▶"}
                        </button>
                        <button onClick={() => handleHardDelete(s)}
                          style={{ fontFamily: "inherit", fontSize: "13px", fontWeight: 600, padding: "7px 9px", borderRadius: "6px", cursor: "pointer", background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                          🗑
                        </button>
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
                  <div style={{ fontSize: "15px", fontWeight: 700, color: t1 }}>{tx.agregarNuevo}</div>
                  <div style={{ fontSize: "13px", color: t3, fontWeight: 300, textAlign: "center" }}>{tx.agregarNuevoDesc}</div>
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
            <div style={{ fontSize: "14px", color: t2, fontWeight: 300, marginBottom: "22px" }}>{tx.reportesSub}</div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              <input type="text" placeholder={tx.buscarPlaceholder} value={search} onChange={e => { setSearch(e.target.value); setReportPage(1); }}
                style={{ fontFamily: "inherit", fontSize: "14px", background: card, border: `1px solid ${bd}`, color: t1, borderRadius: "7px", padding: "7px 12px", width: "185px", outline: "none" }} />

              <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setReportPage(1); }} style={selectStyle}>
                <option value="all" style={{ backgroundColor: card }}>{tx.allYears}</option>
                {reportYears.map(y => <option key={y} value={y} style={{ backgroundColor: card }}>{y}</option>)}
              </select>

              <select value={filterLabelName} onChange={e => { setFilterLabel(e.target.value); setReportPage(1); }} style={selectStyle}>
                <option value="all" style={{ backgroundColor: card }}>{tx.allLabels}</option>
                {reportLabels.map(l => <option key={l} value={l} style={{ backgroundColor: card }}>{l}</option>)}
              </select>

              {[{ k: "all", l: tx.todos }, { k: "streaming", l: "Streaming" }, { k: "youtube", l: "YouTube" }].map(f => (
                <button key={f.k} onClick={() => { setFilterType(f.k); setReportPage(1); }}
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
              <>
                {pagedReports.map(r => (
                  <div key={r.id}
                    style={{ backgroundColor: card, border: `1px solid ${bd}`, borderRadius: "10px", display: "flex", alignItems: "center", gap: "13px", padding: "13px 17px", marginBottom: "6px", transition: "all .18s" }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(212,175,55,0.14)"; el.style.backgroundColor = elev; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = bd; el.style.backgroundColor = card; }}>
                    <div style={{ fontSize: "22px", flexShrink: 0 }}>📗</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="rsp-report-name" style={{ fontSize: "15px", fontWeight: 500, marginBottom: "3px", color: t1 }}>{r.nombre_archivo}</div>
                      <div style={{ display: "flex", gap: "7px", alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "8px", padding: "2px 7px", borderRadius: "4px", background: r.tipo === "streaming" ? "rgba(212,175,55,0.1)" : "rgba(255,96,96,0.08)", color: r.tipo === "streaming" ? accent : "#ff8888", border: r.tipo === "streaming" ? `1px solid rgba(212,175,55,0.2)` : "1px solid rgba(255,96,96,0.18)" }}>
                          {r.tipo === "streaming" ? "Streaming" : "YouTube"}
                        </span>
                        <span style={{ fontSize: "13px", color: t2 }}>{r.sello_nombre}</span>
                        <span style={{ fontFamily: "monospace", fontSize: "8.5px", color: t3, background: elev, padding: "2px 6px", borderRadius: "4px" }}>Q{r.trimestre} {r.anio}</span>
                      </div>
                    </div>
                    <div className="hide-on-mobile" style={{ fontFamily: "monospace", fontSize: "15px", color: t1, whiteSpace: "nowrap" }}>{fmtCurrency(r.total_regalias)}</div>
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
                ))}

                {/* Paginación */}
                {totalReportPages > 1 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px", padding: "12px 4px" }}>
                    <div style={{ fontFamily: "monospace", fontSize: "10px", color: t3 }}>
                      {lang === "es"
                        ? `${(reportPage - 1) * REPORTS_PER_PAGE + 1}–${Math.min(reportPage * REPORTS_PER_PAGE, filteredReports.length)} de ${filteredReports.length}`
                        : `${(reportPage - 1) * REPORTS_PER_PAGE + 1}–${Math.min(reportPage * REPORTS_PER_PAGE, filteredReports.length)} of ${filteredReports.length}`}
                    </div>
                    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                      <button onClick={() => setReportPage(1)} disabled={reportPage === 1}
                        style={{ fontFamily: "monospace", fontSize: "10px", padding: "5px 9px", background: "transparent", border: `1px solid ${bd}`, color: reportPage === 1 ? t3 : t2, borderRadius: "5px", cursor: reportPage === 1 ? "not-allowed" : "pointer", opacity: reportPage === 1 ? 0.4 : 1 }}>
                        «
                      </button>
                      <button onClick={() => setReportPage(p => Math.max(1, p - 1))} disabled={reportPage === 1}
                        style={{ fontFamily: "monospace", fontSize: "10px", padding: "5px 9px", background: "transparent", border: `1px solid ${bd}`, color: reportPage === 1 ? t3 : t2, borderRadius: "5px", cursor: reportPage === 1 ? "not-allowed" : "pointer", opacity: reportPage === 1 ? 0.4 : 1 }}>
                        ‹
                      </button>
                      {Array.from({ length: totalReportPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalReportPages || Math.abs(p - reportPage) <= 1)
                        .reduce<(number | "…")[]>((acc, p, i, arr) => {
                          if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p, i) => p === "…"
                          ? <span key={`el-${i}`} style={{ fontFamily: "monospace", fontSize: "10px", color: t3, padding: "0 4px" }}>…</span>
                          : <button key={p} onClick={() => setReportPage(p as number)}
                              style={{ fontFamily: "monospace", fontSize: "10px", padding: "5px 9px", border: `1px solid ${reportPage === p ? accent : bd}`, background: reportPage === p ? ggl : "transparent", color: reportPage === p ? accent : t2, borderRadius: "5px", cursor: "pointer", fontWeight: reportPage === p ? 700 : 400 }}>
                              {p}
                            </button>
                        )}
                      <button onClick={() => setReportPage(p => Math.min(totalReportPages, p + 1))} disabled={reportPage === totalReportPages}
                        style={{ fontFamily: "monospace", fontSize: "10px", padding: "5px 9px", background: "transparent", border: `1px solid ${bd}`, color: reportPage === totalReportPages ? t3 : t2, borderRadius: "5px", cursor: reportPage === totalReportPages ? "not-allowed" : "pointer", opacity: reportPage === totalReportPages ? 0.4 : 1 }}>
                        ›
                      </button>
                      <button onClick={() => setReportPage(totalReportPages)} disabled={reportPage === totalReportPages}
                        style={{ fontFamily: "monospace", fontSize: "10px", padding: "5px 9px", background: "transparent", border: `1px solid ${bd}`, color: reportPage === totalReportPages ? t3 : t2, borderRadius: "5px", cursor: reportPage === totalReportPages ? "not-allowed" : "pointer", opacity: reportPage === totalReportPages ? 0.4 : 1 }}>
                        »
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </main>

      {/* DELETE CONFIRM MODAL */}
      {deleteSello && (
        <div
          onClick={e => { if (e.target === e.currentTarget) { setDeleteSello(null); setDeletePassword(""); setDeleteErr(null); } }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#161616", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "460px", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}>

            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "42px", marginBottom: "12px" }}>⚠️</div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#ef4444", marginBottom: "8px" }}>
                {lang === "es" ? "Eliminar sello permanentemente" : "Permanently delete label"}
              </div>
              <div style={{ fontSize: "14px", color: t2, lineHeight: 1.6 }}>
                {lang === "es"
                  ? <>Se eliminarán <strong style={{ color: t1 }}>todos los reportes y archivos</strong> de <strong style={{ color: "#ef4444" }}>{deleteSello.nombre}</strong>. Esta acción no se puede deshacer.</>
                  : <>All reports and files for <strong style={{ color: "#ef4444" }}>{deleteSello.nombre}</strong> will be <strong style={{ color: t1 }}>permanently erased</strong>. This cannot be undone.</>}
              </div>
            </div>

            <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "10px", padding: "16px 18px", marginBottom: "20px" }}>
              <label style={{ fontSize: "11px", color: "#fca5a5", letterSpacing: ".08em", textTransform: "uppercase" as const, display: "block", marginBottom: "8px", fontWeight: 600 }}>
                {lang === "es" ? "Confirma tu contraseña para continuar" : "Enter your password to confirm"}
              </label>
              <input
                type="password"
                autoFocus
                value={deletePassword}
                onChange={e => { setDeletePassword(e.target.value); setDeleteErr(null); }}
                onKeyDown={e => { if (e.key === "Enter" && deletePassword) confirmHardDelete(); }}
                placeholder="••••••••"
                style={{ fontFamily: "inherit", fontSize: "15px", background: "#0a0a0a", border: `1px solid ${deleteErr ? "rgba(239,68,68,0.5)" : "rgba(239,68,68,0.2)"}`, color: t1, borderRadius: "7px", padding: "10px 14px", outline: "none", width: "100%", boxSizing: "border-box" as const }}
              />
              {deleteErr && (
                <div style={{ fontSize: "12px", color: "#fca5a5", marginTop: "7px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span>✕</span> {deleteErr}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => { setDeleteSello(null); setDeletePassword(""); setDeleteErr(null); }}
                style={{ flex: 1, fontFamily: "inherit", fontSize: "14px", fontWeight: 500, padding: "11px 16px", background: "transparent", color: t2, border: `1px solid ${bd}`, borderRadius: "8px", cursor: "pointer" }}>
                {lang === "es" ? "Cancelar" : "Cancel"}
              </button>
              <button
                onClick={confirmHardDelete}
                disabled={!deletePassword || deleteLoading}
                style={{ flex: 1, fontFamily: "inherit", fontSize: "14px", fontWeight: 700, padding: "11px 16px", background: !deletePassword || deleteLoading ? "rgba(239,68,68,0.3)" : "#ef4444", color: "#fff", border: "none", borderRadius: "8px", cursor: !deletePassword || deleteLoading ? "not-allowed" : "pointer", transition: "all .2s" }}>
                {deleteLoading ? "…" : (lang === "es" ? "🗑 Eliminar definitivamente" : "🗑 Delete permanently")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SELLO MODAL */}
      {editSello && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setEditSello(null); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#161616", border: `1px solid ${bdA}`, borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "540px", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: t1 }}>
                  {lang === "es" ? "Editar Sello" : "Edit Label"}
                </div>
                <div style={{ fontSize: "13px", color: t3, marginTop: "2px" }}>{editSello.nombre}</div>
              </div>
              <button onClick={() => setEditSello(null)}
                style={{ background: "transparent", border: "none", color: t3, fontSize: "20px", cursor: "pointer", lineHeight: 1 }}>✕</button>
            </div>

            {editErr && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", padding: "8px 12px", color: "#fca5a5", fontSize: "13px", marginBottom: "14px" }}>{editErr}</div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
              {[
                { label: lang === "es" ? "Nombre" : "Name",             key: "nombre",        type: "text" },
                { label: lang === "es" ? "Representante" : "Representative", key: "representante", type: "text" },
                { label: "Email",                                        key: "email",         type: "email" },
                { label: lang === "es" ? "País" : "Country",            key: "pais",          type: "text" },
                { label: lang === "es" ? "Teléfono" : "Phone",          key: "telefono",      type: "text" },
                { label: lang === "es" ? "Iniciales" : "Initials",      key: "iniciales",     type: "text" },
                { label: lang === "es" ? "Nueva Contraseña (opcional)" : "New Password (optional)", key: "password", type: "password" },
              ].map(f => (
                <div key={f.key} style={f.key === "password" ? { gridColumn: "1 / -1" } : {}}>
                  <label style={{ fontSize: "9px", color: t3, letterSpacing: ".08em", textTransform: "uppercase" as const, display: "block", marginBottom: "4px" }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={(editForm as Record<string, string>)[f.key]}
                    onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ fontFamily: "inherit", fontSize: "14px", background: "#0a0a0a", border: `1px solid ${bd}`, color: t1, borderRadius: "7px", padding: "8px 12px", outline: "none", width: "100%", boxSizing: "border-box" as const }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={() => setEditSello(null)}
                style={{ fontFamily: "inherit", fontSize: "13px", fontWeight: 500, padding: "10px 20px", background: "transparent", color: t2, border: `1px solid ${bd}`, borderRadius: "8px", cursor: "pointer" }}>
                {lang === "es" ? "Cancelar" : "Cancel"}
              </button>
              <button onClick={handleSaveEdit} disabled={editLoading}
                style={{ fontFamily: "inherit", fontSize: "13px", fontWeight: 600, padding: "10px 24px", background: accent, color: "#020a04", border: "none", borderRadius: "8px", cursor: editLoading ? "not-allowed" : "pointer", opacity: editLoading ? 0.7 : 1 }}>
                {editLoading ? "…" : (lang === "es" ? "Guardar cambios" : "Save changes")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
