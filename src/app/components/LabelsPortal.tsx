import { useState, useEffect } from "react";
import { useLang } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { portalApi, reportesApi, type DashboardData, type Reporte } from "../services/api";
import { T } from "../i18n";

type PortalView = "regalias" | "archivos";

// Colors
const bg     = "#0a0a0a";
const card   = "#111111";
const elev   = "#161616";
const accent = "#d4af37";
const green  = "#f5c842";
const amber  = "#f59e0b";
const t1     = "#f1f5f9";
const t2     = "#94a3b8";
const t3     = "#64748b";
const bd     = "rgba(255,255,255,0.06)";
const bdA    = "rgba(212,175,55,0.3)";

function reportColor(tipo: string) {
  return tipo === "youtube" ? accent : green;
}

function fmtCurrency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const navIds: PortalView[] = ["regalias", "archivos"];

function EyeBrow({ text }: { text: string }) {
  return (
    <span style={{
      display: "inline-block",
      background: "rgba(212,175,55,0.12)",
      color: accent,
      fontSize: "0.65rem",
      fontWeight: 700,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      padding: "3px 10px",
      borderRadius: "999px",
      marginBottom: "0.6rem",
    }}>
      {text}
    </span>
  );
}

export function LabelsPortal() {
  const { lang }  = useLang();
  const { user }  = useAuth();
  const tx = T[lang];

  const [view,        setView]    = useState<PortalView>("regalias");
  const [filterYear,  setFYear]   = useState("all");
  const [downloading, setDl]      = useState<string | null>(null);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [reports,   setReports]   = useState<Reporte[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    Promise.all([portalApi.dashboard(), reportesApi.list()])
      .then(([dash, reps]) => { setDashboard(dash); setReports(reps); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const fileYears = [...new Set(reports.map(r => String(r.anio)))];
  const filteredFiles = reports.filter(r =>
    filterYear === "all" || String(r.anio) === filterYear
  );

  const handleDownload = async (id: string) => {
    setDl(id);
    try {
      const { url } = await reportesApi.download(id);
      window.open(url, "_blank", "noopener");
    } catch {
      // silently fail
    } finally {
      setDl(null);
    }
  };

  const initials = user?.iniciales ?? dashboard?.sello?.iniciales ?? "??";
  const labelName = dashboard?.sello?.nombre ?? user?.nombre ?? "";

  const navLabels: Record<PortalView, string> = {
    regalias: tx.misRegalias,
    archivos: tx.descargarReportes,
  };
  const navIcons: Record<PortalView, string> = {
    regalias: "💰",
    archivos: "📥",
  };

  const Sidebar = (
    <aside className="panel-sidebar-hide-mobile" style={{
      width: 220, flexShrink: 0, backgroundColor: card,
      borderRight: `1px solid ${bd}`, display: "flex", flexDirection: "column",
      position: "sticky", top: 73, height: "calc(100vh - 73px)", overflowY: "auto",
    }}>
      <div style={{ padding: "24px 20px 16px", borderBottom: `1px solid ${bd}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${accent}, ${green})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1rem", flexShrink: 0,
          }}>⚡</div>
          <div>
            <div style={{ color: t1, fontSize: "0.8rem", fontWeight: 600, lineHeight: 1.2 }}>
              {lang === "es" ? "Portal Sello" : "Label Portal"}
            </div>
            <div style={{ color: t3, fontSize: "0.7rem" }}>esongs entertainment</div>
          </div>
        </div>
      </div>

      <nav style={{ padding: "16px 12px", flex: 1 }}>
        <div style={{ marginBottom: 6, paddingLeft: 8 }}>
          <span style={{ color: t3, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {tx.portalMenu}
          </span>
        </div>
        {navIds.map(id => {
          const active = view === id;
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "9px 12px", borderRadius: 8,
                border: "none", cursor: "pointer", fontSize: "0.85rem",
                fontWeight: active ? 600 : 400,
                backgroundColor: active ? "rgba(212,175,55,0.12)" : "transparent",
                color: active ? accent : t2,
                marginBottom: 2, textAlign: "left", transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
            >
              <span style={{
                width: 18, height: 18, borderRadius: 5,
                background: active ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.6rem", flexShrink: 0,
              }}>
                {navIcons[id]}
              </span>
              {navLabels[id]}
              {active && (
                <span style={{
                  marginLeft: "auto", width: 6, height: 6, borderRadius: "50%",
                  backgroundColor: accent, flexShrink: 0,
                }} />
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ margin: "0 12px 16px", padding: "12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${bd}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${amber}40, ${amber}20)`,
            border: `1px solid ${amber}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.75rem", flexShrink: 0,
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: t1, fontSize: "0.78rem", fontWeight: 600, lineHeight: 1.2 }}>{labelName}</div>
            <div style={{ color: t3, fontSize: "0.7rem" }}>{tx.cuentaSello}</div>
          </div>
        </div>
      </div>
    </aside>
  );

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "calc(100vh - 73px)", backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: t3, fontSize: "0.9rem" }}>{lang === "es" ? "Cargando…" : "Loading…"}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", minHeight: "calc(100vh - 73px)", backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#fca5a5", fontSize: "0.9rem" }}>{error}</div>
      </div>
    );
  }

  const resumen = dashboard?.resumen;
  const topSongs = dashboard?.topSongs ?? [];

  const ViewRegalias = (
    <div className="panel-main-padding" style={{ padding: "32px 32px 48px" }}>
      <div style={{ marginBottom: 32 }}>
        <EyeBrow text={tx.eyebrowRegalias} />
        <h1 style={{ color: t1, fontSize: "1.6rem", fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
          {tx.portalWelcome}
        </h1>
        <p style={{ color: t3, fontSize: "0.875rem", marginTop: 6 }}>{tx.portalWelcomeSub}</p>
      </div>

      <div className="rsp-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: tx.streaming, amount: fmtCurrency(resumen?.streaming ?? 0), sub: tx.distDigital,   color: green  },
          { label: tx.youtube,   amount: fmtCurrency(resumen?.youtube   ?? 0), sub: tx.contentId,     color: accent },
          { label: tx.total,     amount: fmtCurrency(resumen?.total     ?? 0), sub: tx.streamingPlus, color: null   },
        ].map(m => (
          <div key={m.label} style={{
            background: m.color === null
              ? "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.05))"
              : card,
            border: `1px solid ${m.color === null ? bdA : bd}`,
            borderRadius: 14, padding: "20px 22px",
          }}>
            <div style={{ color: t3, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              {m.label}
            </div>
            <div style={{
              fontSize: "1.75rem", fontWeight: 700, lineHeight: 1.1,
              background: m.color === null
                ? `linear-gradient(135deg, ${accent}, ${green})`
                : `linear-gradient(135deg, ${m.color}, ${m.color}80)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              {m.amount}
            </div>
            <div style={{ color: t3, fontSize: "0.75rem", marginTop: 6 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="rsp-charts-row" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 28 }}>
        <div style={{ background: card, border: `1px solid ${bd}`, borderRadius: 14, padding: "22px 24px" }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ color: t1, fontSize: "0.95rem", fontWeight: 600 }}>{tx.top5Title}</div>
            <div style={{ color: t3, fontSize: "0.78rem", marginTop: 2 }}>{tx.top5Sub}</div>
          </div>
          {topSongs.length === 0 ? (
            <div style={{ color: t3, fontSize: "0.85rem", textAlign: "center", padding: "24px 0" }}>
              {lang === "es" ? "Sin datos de canciones aún." : "No song data yet."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {topSongs.map((song, i) => (
                <div key={song.titulo + i}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: i === 0 ? amber : t3, fontSize: "0.72rem", fontWeight: 700, width: 16 }}>
                        {i + 1}
                      </span>
                      <div>
                        <div style={{ color: t1, fontSize: "0.82rem", fontWeight: 500 }}>{song.titulo}</div>
                        <div style={{ color: t3, fontSize: "0.7rem" }}>{song.artista}</div>
                      </div>
                    </div>
                    <span style={{ color: t2, fontSize: "0.78rem" }}>{Number(song.reproducciones).toLocaleString()}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${song.pct}%`, borderRadius: 99,
                      background: i === 0
                        ? `linear-gradient(90deg, ${accent}, ${green})`
                        : i === 1
                        ? `linear-gradient(90deg, ${green}, ${green}90)`
                        : `linear-gradient(90deg, ${accent}70, ${accent}40)`,
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: card, border: `1px solid ${bd}`, borderRadius: 14, padding: "22px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ alignSelf: "flex-start", marginBottom: 16 }}>
            <div style={{ color: t1, fontSize: "0.95rem", fontWeight: 600 }}>{tx.distribucion}</div>
            <div style={{ color: t3, fontSize: "0.78rem", marginTop: 2 }}>{tx.distSub}</div>
          </div>
          {(() => {
            const total = resumen?.total ?? 0;
            const ytPct = total > 0 ? ((resumen?.youtube ?? 0) / total) * 100 : 0;
            const stPct = 100 - ytPct;
            return (
              <>
                <div style={{ position: "relative", width: 140, height: 140, marginBottom: 20 }}>
                  <div style={{
                    width: 140, height: 140, borderRadius: "50%",
                    background: `conic-gradient(#3b82f6 0% ${stPct.toFixed(1)}%, ${amber} ${stPct.toFixed(1)}% 100%)`,
                  }} />
                  <div style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%,-50%)",
                    width: 84, height: 84, borderRadius: "50%", background: card,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ color: t1, fontSize: "1rem", fontWeight: 700, lineHeight: 1 }}>{ytPct.toFixed(0)}%</div>
                    <div style={{ color: t3, fontSize: "0.6rem", marginTop: 2 }}>{tx.youtube}</div>
                  </div>
                </div>
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: tx.streaming, pct: `${stPct.toFixed(1)}%`, amount: fmtCurrency(resumen?.streaming ?? 0), color: green  },
                    { label: tx.youtube,   pct: `${ytPct.toFixed(1)}%`, amount: fmtCurrency(resumen?.youtube   ?? 0), color: accent },
                  ].map(item => (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: item.color, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: t2, fontSize: "0.78rem" }}>{item.label}</span>
                          <span style={{ color: t2, fontSize: "0.78rem" }}>{item.pct}</span>
                        </div>
                        <div style={{ color: item.color, fontSize: "0.72rem" }}>{item.amount}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      </div>

      <div className="rsp-cta-wrap" style={{
        background: "linear-gradient(135deg, rgba(212,175,55,0.07), rgba(212,175,55,0.04))",
        border: `1px solid ${bdA}`, borderRadius: 14,
        padding: "20px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ color: t1, fontSize: "0.95rem", fontWeight: 600, marginBottom: 4 }}>{tx.ctaTitle}</div>
          <div style={{ color: t3, fontSize: "0.82rem" }}>
            {reports.length} {tx.ctaSub} · {tx.total} {fmtCurrency(resumen?.total ?? 0)}
          </div>
        </div>
        <button
          onClick={() => setView("archivos")}
          style={{
            padding: "10px 22px", borderRadius: 9, border: "none", cursor: "pointer",
            background: `linear-gradient(135deg, ${accent}, ${green})`,
            color: "#000", fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap",
          }}
        >
          {tx.ctaBtn}
        </button>
      </div>
    </div>
  );

  const ViewArchivos = (
    <div className="panel-main-padding" style={{ padding: "32px 32px 48px" }}>
      <div style={{ marginBottom: 28 }}>
        <EyeBrow text={tx.eyebrowArchivos} />
        <h1 style={{ color: t1, fontSize: "1.6rem", fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
          {tx.archivosTitle}
        </h1>
        <p style={{ color: t3, fontSize: "0.875rem", marginTop: 6 }}>{tx.archivosSub}</p>
      </div>

      <div className="rsp-cta-wrap" style={{
        background: "linear-gradient(135deg, rgba(212,175,55,0.09), rgba(212,175,55,0.05))",
        border: `1px solid ${bdA}`, borderRadius: 14,
        padding: "20px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 24,
      }}>
        <div>
          <div style={{ color: t3, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
            {tx.totalRegalias}
          </div>
          <div style={{
            fontSize: "2rem", fontWeight: 700, lineHeight: 1.1,
            background: `linear-gradient(135deg, ${accent}, ${green})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            {fmtCurrency(resumen?.total ?? 0)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select
            value={filterYear}
            onChange={e => setFYear(e.target.value)}
            style={{
              fontFamily: "inherit", fontSize: "11px",
              background: card, border: `1px solid ${bd}`,
              color: t2, borderRadius: "7px", padding: "6px 10px",
              outline: "none", cursor: "pointer",
            }}
          >
            <option value="all" style={{ backgroundColor: card }}>{tx.allYearsFilter}</option>
            {fileYears.map(y => (
              <option key={y} value={y} style={{ backgroundColor: card }}>{y}</option>
            ))}
          </select>
          <div style={{
            padding: "6px 14px", borderRadius: 99,
            background: "rgba(212,175,55,0.12)", color: accent,
            fontSize: "0.78rem", fontWeight: 600,
          }}>
            {filteredFiles.length} {tx.archivosDispo}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
        {filteredFiles.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: t3, fontSize: "13px" }}>
            {lang === "es" ? "No hay archivos para el año seleccionado." : "No files for the selected year."}
          </div>
        )}
        {filteredFiles.map(file => {
          const isDl  = downloading === file.id;
          const color = reportColor(file.tipo);
          const bgClr = "rgba(212,175,55,0.10)";
          const bdClr = "rgba(212,175,55,0.25)";
          return (
            <div
              key={file.id}
              className="rsp-file-card"
              style={{
                background: card, border: `1px solid ${bd}`, borderRadius: 14,
                padding: "20px 24px",
                display: "flex", alignItems: "center", gap: 16,
                transition: "border-color 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = bdClr; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = bd; }}
            >
              <div style={{
                width: 46, height: 46, borderRadius: 11,
                background: bgClr, border: `1px solid ${bdClr}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.2rem", flexShrink: 0,
              }}>📊</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: t1, fontSize: "0.88rem", fontWeight: 500, marginBottom: 2 }}>{file.nombre_archivo}</div>
                <div style={{ color: t3, fontSize: "0.75rem" }}>
                  {file.tipo} · Q{file.trimestre} {file.anio}
                </div>
              </div>

              <div style={{ textAlign: "right", marginRight: 16, flexShrink: 0 }}>
                <div style={{ color, fontSize: "1.05rem", fontWeight: 700 }}>
                  {fmtCurrency(parseFloat(file.total_regalias))}
                </div>
                <div style={{ color: t3, fontSize: "0.7rem", marginTop: 1 }}>{tx.regalias}</div>
              </div>

              <button
                onClick={() => handleDownload(file.id)}
                disabled={isDl}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "9px 20px", borderRadius: 9,
                  border: `1px solid ${isDl ? "rgba(212,175,55,0.4)" : bdClr}`,
                  background: isDl ? "rgba(212,175,55,0.15)" : bgClr,
                  color: isDl ? accent : color,
                  fontSize: "0.82rem", fontWeight: 600,
                  cursor: isDl ? "not-allowed" : "pointer", transition: "all 0.2s",
                  whiteSpace: "nowrap", flexShrink: 0,
                }}
              >
                {isDl ? tx.descargado : tx.descargarFile}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{
        background: elev, border: `1px solid ${bd}`, borderRadius: 12,
        padding: "16px 20px",
        display: "flex", alignItems: "flex-start", gap: 12,
      }}>
        <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: 1 }}>ℹ️</span>
        <div style={{ color: t2, fontSize: "0.82rem", lineHeight: 1.5 }}>
          {tx.contactNote}{" "}
          <span style={{ color: accent }}>reportes@esongsent.com</span>. {tx.contactNote2}
        </div>
      </div>
    </div>
  );

  const MobileTabBar = (
    <div
      className="rsp-show-mobile"
      style={{
        overflowX: "auto",
        gap: "8px",
        marginBottom: "16px",
        paddingBottom: "4px",
        WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
        scrollbarWidth: "none" as React.CSSProperties["scrollbarWidth"],
      }}
    >
      {navIds.map(id => {
        const active = view === id;
        return (
          <button
            key={id}
            onClick={() => setView(id)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: "4px", padding: "8px 16px", borderRadius: "10px",
              border: active ? `1px solid rgba(212,175,55,0.3)` : `1px solid rgba(255,255,255,0.06)`,
              backgroundColor: active ? "rgba(212,175,55,0.07)" : "transparent",
              color: active ? accent : t2,
              cursor: "pointer", fontFamily: "inherit",
              fontSize: "11px", fontWeight: active ? 600 : 400,
              whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            <span style={{ fontSize: "18px", lineHeight: 1 }}>{navIcons[id]}</span>
            <span>{navLabels[id]}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="panel-outer" style={{ display: "flex", minHeight: "calc(100vh - 73px)", backgroundColor: bg }}>
      {Sidebar}
      <main style={{ flex: 1, overflowY: "auto", minWidth: 0, padding: 0 }}>
        <div style={{ padding: "16px 16px 0" }}>
          {MobileTabBar}
        </div>
        {view === "regalias" && ViewRegalias}
        {view === "archivos" && ViewArchivos}
      </main>
    </div>
  );
}
