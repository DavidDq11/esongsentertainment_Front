import { useState, useEffect } from "react";
import { Music, TrendingUp, Shield, BarChart3, ArrowRight, Plus, CheckCircle2, Globe, FileText } from "lucide-react";
import { useLang } from "../contexts/LanguageContext";
import { LP } from "../i18n";

// ── Color tokens ──────────────────────────────────────────────────────────────
const G1   = "#d4af37";          // gold primary
const G2   = "#f5c842";          // gold bright
const BG   = "#120a06";          // main background (dark espresso/walnut)
const BG2  = "#170d07";          // alternate section bg
const CARD = "#201208";          // card background
const CARD2= "#281608";          // card hover / elevated
const BD   = "rgba(255,255,255,0.05)";
const BDA  = `rgba(212,175,55,0.3)`;
const GGL  = `rgba(212,175,55,0.07)`;
const T1   = "#f1f5f9";
const T2   = "#94a3b8";
const T3   = "#64748b";

const rg = (a: number) => `rgba(212,175,55,${a})`;

// ── Platforms with brand colors ───────────────────────────────────────────────
const PLATFORM_LIST = [
  { name: "Apple Music",  color: "#fc3c44", icon: "🎵" },
  { name: "Spotify",      color: "#1db954", icon: "🎧" },
  { name: "Amazon Music", color: "#00a8e1", icon: "🎼" },
  { name: "Google Play",  color: "#4285f4", icon: "▶️" },
  { name: "Pandora",      color: "#3668ff", icon: "📻" },
  { name: "Rhapsody",     color: "#e6001a", icon: "🎶" },
  { name: "7Digital",     color: "#d4af37", icon: "🎵" },
  { name: "Napster",      color: "#009bdb", icon: "🎧" },
  { name: "eMusic",       color: "#ff6600", icon: "🎼" },
  { name: "MediaNet",     color: "#8b5cf6", icon: "📻" },
  { name: "YouTube",      color: "#ff0000", icon: "🎬" },
  { name: "VEVO",         color: "#e60026", icon: "▶️" },
  { name: "TikTok",       color: "#ff0050", icon: "🎤" },
  { name: "SoundCloud",   color: "#ff5500", icon: "☁️" },
  { name: "Instagram",    color: "#e1306c", icon: "📸" },
  { name: "iHeartRadio",  color: "#cc2128", icon: "❤️" },
  { name: "Deezer",       color: "#a238ff", icon: "🎙️" },
  { name: "Facebook",     color: "#1877f2", icon: "👍" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const eyebrow = (text: string) => (
  <p style={{ display: "flex", alignItems: "center", gap: "8px", color: G1, letterSpacing: "0.18em", textTransform: "uppercase", fontSize: "0.875rem", fontWeight: 600, marginBottom: "12px" }}>
    <span style={{ width: "14px", height: "1px", backgroundColor: G1, flexShrink: 0 }} />
    {text}
  </p>
);

const eyebrowCenter = (text: string) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: G1, letterSpacing: "0.18em", textTransform: "uppercase", fontSize: "0.875rem", fontWeight: 600, marginBottom: "12px" }}>
    <span style={{ width: "14px", height: "1px", backgroundColor: G1 }} />
    {text}
    <span style={{ width: "14px", height: "1px", backgroundColor: G1 }} />
  </div>
);

const sectionH2: React.CSSProperties = {
  color: T1,
  fontSize: "clamp(2.2rem, 4vw, 3.3rem)",
  fontWeight: 800,
  letterSpacing: "-0.035em",
  lineHeight: 1.02,
  marginBottom: "12px",
};

// ── Component ─────────────────────────────────────────────────────────────────
export function LandingPage() {
  const { lang } = useLang();
  const lp = LP[lang];
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [contactSent, setContactSent] = useState(false);
  const [expandedSvc, setExpandedSvc] = useState<number | null>(null);

  // ── Scroll animations ──────────────────────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("is-visible"); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll("[data-animate]").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const stats = [
    { value: lp.stat1v, label: lp.stat1l },
    { value: lp.stat2v, label: lp.stat2l },
    { value: lp.stat3v, label: lp.stat3l },
    { value: lp.stat4v, label: lp.stat4l },
  ];

  // ── 6 Servicios reales de la clienta ──────────────────────────────────
  const services6 = [
    {
      icon: Music,
      color: G1,
      title: lang === "es" ? "Distribución Digital & YouTube" : "Digital Distribution & YT Assets",
      desc:  lang === "es" ? "Distribuimos su catálogo mundialmente sin costo inicial, con monetización total en YouTube." : "Worldwide catalog distribution with zero upfront cost, plus full YouTube monetization.",
      items: lang === "es" ? [
        "Distribución mundial de catálogo sin costo inicial",
        "Pagos por depósito directo de ventas y streaming",
        "Distribución en todas las plataformas + monetización YouTube completa",
        "Equipo dedicado de gestión de derechos YouTube",
        "Reclamo automático de contenido: Content ID + Art Tracks",
        "Modelo transparente — usted retiene el 100% de sus derechos, siempre",
        "Código UPC e ISRC incluidos gratis en cada lanzamiento",
      ] : [
        "Worldwide catalog distribution with zero upfront cost",
        "Direct Deposit Payments for all sales and streaming revenue",
        "Distribution across all major platforms + full YouTube monetization",
        "Dedicated YouTube Rights Management team to claim and protect content",
        "Automatic content claiming: Content ID + Art Tracks",
        "Transparent model — you keep 100% of your rights, always",
        "Free UPC and ISRC included with every release",
      ],
    },
    {
      icon: BarChart3,
      color: G2,
      title: lang === "es" ? "Portal de Distribución para Clientes" : "Client Distribution Portal",
      desc:  lang === "es" ? "Portal seguro con reportes de ventas personalizados y análisis estadístico detallado." : "Secure portal with personalized sales reports and detailed statistical analysis.",
      items: lang === "es" ? [
        "Portal de acceso seguro para clientes de distribución",
        "Reportes de ventas trimestrales personalizados",
        "Análisis estadístico detallado de todos sus lanzamientos",
        "Gestión de datos históricos de ventas para precisión y transparencia a largo plazo",
      ] : [
        "Secure financial login portal for easy and protected account access",
        "Quarterly personalized sales reports tailored for each distribution client",
        "Detailed statistical sales analysis for all your releases",
        "Historical sales data management for long-term accuracy and transparency",
      ],
    },
    {
      icon: Shield,
      color: "#f59e0b",
      title: lang === "es" ? "Gestión Empresarial & Contabilidad" : "Business Management & Accounting",
      desc:  lang === "es" ? "Servicios completos de contabilidad personal, empresarial y cumplimiento fiscal." : "Full personal and corporate accounting, bookkeeping, payroll, and tax services.",
      items: lang === "es" ? [
        "Contabilidad y archivo de registros anuales",
        "Gestión de cuenta personal: supervisión y pago de facturas",
        "Gestión de cuentas por pagar — control, procesamiento y pagos",
        "Gestión de cuentas por cobrar — facturación, cobros y contabilidad",
        "Preparación y análisis de estados financieros",
        "Procesamiento de nóminas y cumplimiento (cuando se requiera)",
        "Planificación fiscal y cumplimiento de obligaciones",
        "Servicios de impuestos: personal y corporativo",
      ] : [
        "Annual bookkeeping and recordkeeping services",
        "Personal account management, including oversight and payment of bills",
        "Accounts Payable Management — monitoring, processing, and banking",
        "Accounts Receivable Management — invoicing, collections, and full accounting",
        "Financial statement preparation and analysis",
        "Payroll processing and compliance (when required)",
        "Tax planning and compliance assistance",
        "Personal & Corporate Income Tax Services",
      ],
    },
    {
      icon: TrendingUp,
      color: "#7c3aed",
      title: lang === "es" ? "Contabilidad de Regalías" : "Royalty Accounting Services",
      desc:  lang === "es" ? "Para sellos independientes, editores y titulares de derechos. Impulsado por la plataforma Curve." : "For Independent Labels, Publishers, and Rights Holders. Powered by the Curve platform.",
      items: lang === "es" ? [
        "Gestión de reportes de ventas — recepción, organización y procesamiento",
        "Configuración de portal digital de regalías para cada cliente",
        "Preparación de estados de regalías para artistas, artistas secundarios y productores",
        "Acceso digital directo para todos los receptores de regalías",
        "Mantenimiento de datos y sistema de contabilidad actualizado",
        "Impulsado por Curve — la plataforma de contabilidad de regalías líder",
      ] : [
        "Sales Report Management — receive, organize, and process all distributor reports",
        "Digital Royalty Portal Setup for each client and all royalty recipients",
        "Royalty Statement Preparation for Artists, Side Artists, and Producers",
        "Direct digital access for all royalty recipients via website and mobile app",
        "Data & System Maintenance — royalty data kept accessible and up to date",
        "Powered by Curve — the prestigious royalty accounting platform",
      ],
    },
    {
      icon: Globe,
      color: "#0ea5e9",
      title: lang === "es" ? "Administración Editorial" : "Publishing Administration",
      desc:  lang === "es" ? "Administración editorial mundial. Usted retiene el 100% de sus derechos siempre." : "Worldwide publishing administration. You always retain 100% of your rights.",
      items: lang === "es" ? [
        "Administración editorial mundial — usted retiene el 100% de sus derechos",
        "Cobro integral de regalías: mecánicas, actuación, sincronización, YouTube y más",
        "Inscripciones globales con PROs, MLC, sub-editores y organizaciones de derechos",
        "Reportes digitales periódicos de regalías a través de la plataforma Curve",
        "Pagos por depósito directo de todas las regalías editoriales",
      ] : [
        "Worldwide publishing administration — you always retain 100% of your rights",
        "Comprehensive royalty collection: mechanical, performance, sync, YouTube, and more",
        "Global registrations with PROs, the MLC, sub-publishers, and rights organizations",
        "Periodic digital royalty reporting for all clients through the Curve platform",
        "Direct Deposit payments for all publishing royalties, delivered on schedule",
      ],
    },
    {
      icon: FileText,
      color: "#10b981",
      title: lang === "es" ? "Servicios Adicionales de la Industria" : "Additional Music Business Services",
      desc:  lang === "es" ? "Metadatos, derechos de autor, licencias y auditorías de regalías para su catálogo." : "Metadata, copyright, licensing, and royalty audits to protect your catalog.",
      items: lang === "es" ? [
        "Gestión de metadatos y archivo electrónico completo de registros",
        "Preparación de metadatos y archivo digital de todas las grabaciones",
        "Solicitud, negociación y gestión de licencias de sincronización y uso",
        "Registro de derechos de autor en EE.UU. para masters, videos y composiciones",
        "Inscripciones en sociedades de autores y compositores de EE.UU.",
        "Inscripciones en SoundExchange para cobro de regalías de actuación digital",
        "Auditorías de regalías para verificar exactitud de estados y pagos",
        "Seguimiento de pagos de contratos y cobro de regalías pendientes",
      ] : [
        "Catalog organization and complete electronic archive of registrations",
        "Metadata preparation and digital archiving for all sound recordings",
        "Request, negotiation, and management of sync and master-use licenses",
        "Copyright registrations in the United States for Masters, Videos, and Compositions",
        "Registrations with U.S. Authors & Composers societies",
        "SoundExchange registrations for digital performance royalty collection",
        "Royalty audit services to examine accuracy of statements and payments",
        "Contract payment monitoring & royalty collection",
      ],
    },
  ];

  const artItems = [lp.svcArt1, lp.svcArt2, lp.svcArt3, lp.svcArt4, lp.svcArt5, lp.svcArt6];
  const pubItems = [lp.svcPub1, lp.svcPub2, lp.svcPub3, lp.svcPub4, lp.svcPub5, lp.svcPub6];

  const faqs = [
    { q: lp.faq1q, a: lp.faq1a }, { q: lp.faq2q, a: lp.faq2a },
    { q: lp.faq3q, a: lp.faq3a }, { q: lp.faq4q, a: lp.faq4a },
    { q: lp.faq5q, a: lp.faq5a }, { q: lp.faq6q, a: lp.faq6a },
    { q: lp.faq7q, a: lp.faq7a }, { q: lp.faq8q, a: lp.faq8a },
    { q: lp.faq9q, a: lp.faq9a }, { q: lp.faq10q, a: lp.faq10a },
    { q: lp.faq11q, a: lp.faq11a },
  ];

  const benefits = [lp.aboutBen1, lp.aboutBen2, lp.aboutBen3, lp.aboutBen4, lp.aboutBen5, lp.aboutBen6];
  const ctaBenefits = [lp.ctaBen1, lp.ctaBen2, lp.ctaBen3, lp.ctaBen4, lp.ctaBen5, lp.ctaBen6];
  const ctaExtras = [lp.ctaExtra1, lp.ctaExtra2, lp.ctaExtra3, lp.ctaExtra4, lp.ctaExtra5, lp.ctaExtra6];

  const inputStyle: React.CSSProperties = {
    backgroundColor: CARD, border: `1px solid ${BD}`,
    color: T1, fontSize: "1rem", padding: "10px 14px",
    width: "100%", borderRadius: "8px", outline: "none",
  };
  const onFocusIn  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { (e.currentTarget as HTMLElement).style.borderColor = G1; };
  const onFocusOut = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { (e.currentTarget as HTMLElement).style.borderColor = BD; };

  const cardStyle: React.CSSProperties = { backgroundColor: CARD, border: `1px solid ${BD}`, borderRadius: "12px" };

  const goldBtn = (label: string, href: string) => (
    <a href={href} className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-black transition-all duration-300"
      style={{ background: `linear-gradient(135deg, ${G1}, ${G2})`, boxShadow: `0 8px 30px ${rg(0.35)}`, fontSize: "1.05rem", fontWeight: 700, textDecoration: "none" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${rg(0.5)}`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 30px ${rg(0.35)}`; }}>
      {label} <ArrowRight size={18} />
    </a>
  );

  const outlineBtn = (label: string, href: string) => (
    <a href={href} className="inline-flex items-center gap-2 px-8 py-4 rounded-full transition-all duration-300"
      style={{ border: `1px solid ${rg(0.3)}`, color: T1, fontSize: "1.05rem", textDecoration: "none" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = G1; (e.currentTarget as HTMLElement).style.color = G1; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = rg(0.3); (e.currentTarget as HTMLElement).style.color = T1; }}>
      {label}
    </a>
  );

  return (
    <div style={{ backgroundColor: BG }}>

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1760780567530-389d8a3fba75?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMHN0dWRpbyUyMHJlY29yZGluZyUyMGFydGlzdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NzI3NjE1NDB8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Music Studio" className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-[#120a06]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
        </div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ backgroundColor: G1 }} />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: G2, opacity: 0.07 }} />

        {/* Gold particles */}
        {[...Array(10)].map((_, i) => (
          <div key={i} className="absolute rounded-full animate-pulse" style={{ backgroundColor: rg(0.25), width: `${(i % 3) + 2}px`, height: `${(i % 3) + 2}px`, left: `${(i * 11) % 100}%`, top: `${(i * 13 + 7) % 100}%`, animationDelay: `${i * 0.4}s` }} />
        ))}

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-14 md:py-24 grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Left: text */}
          <div data-animate="left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ backgroundColor: rg(0.12), border: `1px solid ${rg(0.3)}`, color: G1, fontSize: "0.9rem" }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: G1 }} />
              {lp.heroEyebrow}
            </div>

            <h1 className="mb-6" style={{ color: T1, lineHeight: 1.05 }}>
              <span style={{ fontSize: "clamp(2.6rem, 5vw, 4.2rem)", display: "block", fontWeight: 800, letterSpacing: "-0.035em" }}>
                {lp.heroH1}
              </span>
              <span style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.9rem)", display: "block", fontWeight: 600, marginTop: "8px", background: `linear-gradient(135deg, ${G1}, ${G2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {lp.heroSub1}
              </span>
            </h1>

            <div className="flex flex-wrap gap-4 mb-10">
              {goldBtn(lp.heroCta1, "#contacto")}
              {outlineBtn(lp.heroCta2, "#servicios")}
            </div>

            <div className="flex gap-4 md:gap-8 flex-wrap">
              {stats.map((s) => (
                <div key={s.label}>
                  <p style={{ fontSize: "1.65rem", fontWeight: 800, letterSpacing: "-0.03em", color: T1, lineHeight: 1.2 }}>{s.value}</p>
                  <p style={{ color: T3, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "2px" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: service preview grid */}
          <div className="hidden md:block" data-animate="right">
            <p style={{ fontSize: "0.75rem", letterSpacing: "0.18em", textTransform: "uppercase", color: rg(0.6), marginBottom: "16px", fontWeight: 600 }}>
              {lang === "es" ? "— Nuestros Servicios" : "— Our Services"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {services6.map((svc, i) => (
                <div key={i} className="hero-svc-card rounded-xl p-5"
                  style={{ backgroundColor: CARD, border: `1px solid ${svc.color}22`, cursor: "default" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: `${svc.color}18`, border: `1px solid ${svc.color}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svc.icon size={18} style={{ color: svc.color }} />
                    </div>
                    <span style={{ fontSize: "0.7rem", color: svc.color, fontWeight: 700, letterSpacing: "0.1em" }}>0{i + 1}</span>
                  </div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 700, color: T1, lineHeight: 1.3 }}>{svc.title}</p>
                  <div style={{ marginTop: "8px", height: "2px", borderRadius: "1px", background: `linear-gradient(90deg, ${svc.color}55, transparent)` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ PLATFORM STRIP ══════════════════ */}
      <section style={{ borderTop: `1px solid ${BD}`, borderBottom: `1px solid ${BD}`, backgroundColor: "#1c1008", padding: "36px 0 28px", overflow: "hidden" }}>
        <div data-animate="zoom" className="max-w-7xl mx-auto px-4 md:px-6 text-center" style={{ marginBottom: "20px" }}>
          {eyebrowCenter(lp.platEyebrow)}
          <h2 style={{ ...sectionH2, textAlign: "center", marginBottom: "6px" }}>{lp.platH2}</h2>
          <p style={{ color: G1, fontSize: "1rem", fontWeight: 600 }}>{lp.platSub}</p>
        </div>
        <div style={{ overflow: "hidden", marginTop: "24px" }}>
          <div className="flex gap-0 animate-scroll" style={{ width: "max-content" }}>
            {[...PLATFORM_LIST, ...PLATFORM_LIST].map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", padding: "0 20px" }}>
                <span style={{ fontSize: "14px" }}>{p.icon}</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: p.color, letterSpacing: "0.05em" }}>{p.name}</span>
                <span style={{ marginLeft: "20px", color: "#4a2e1a", fontSize: "14px" }}>·</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ textAlign: "center", marginTop: "14px", color: T3, fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>{lp.platMore}</p>
      </section>

      {/* ══════════════════ SERVICES — 6 hover-expand cards ══════════════════ */}
      <section id="servicios" className="max-w-7xl mx-auto px-4 md:px-6 py-14 md:py-24">
        <div data-animate className="mb-12" style={{ textAlign: "center" }}>
          {eyebrowCenter(lang === "es" ? "Lo que ofrecemos" : "What we offer")}
          <h2 style={{ ...sectionH2, textAlign: "center" }}>
            {lang === "es" ? "Nuestros Servicios" : "Our Services"}
          </h2>
          <p style={{ color: T2, fontSize: "1rem", marginTop: "8px", maxWidth: "580px", lineHeight: 1.72, fontWeight: 300, margin: "8px auto 0" }}>
            {lang === "es"
              ? "Ofrecemos soluciones integrales para artistas independientes, sellos y editores: distribución digital, gestión de regalías, contabilidad y más — todo bajo un mismo equipo de confianza con más de 25 años en la industria."
              : "We provide end-to-end solutions for independent artists, labels, and publishers: digital distribution, royalty management, accounting, and more — all under one trusted team with over 25 years in the industry."}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px rounded-2xl overflow-hidden"
          style={{ backgroundColor: BD, border: `1px solid ${BD}` }}>
          {services6.map((svc, i) => (
            <div
              key={i}
              data-animate
              data-delay={String(i + 1)}
              className="group relative cursor-default p-5 md:p-8"
              style={{ backgroundColor: expandedSvc === i ? CARD2 : CARD, transition: "background-color 0.3s" }}
              onMouseEnter={() => setExpandedSvc(i)}
              onMouseLeave={() => setExpandedSvc(null)}
            >
              <div style={{ fontSize: "0.8rem", letterSpacing: "0.14em", color: T3, marginBottom: "20px" }}>0{i + 1} ——</div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${svc.color}18`, border: `1px solid ${svc.color}35` }}>
                <svc.icon size={22} style={{ color: svc.color }} />
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: T1, marginBottom: "10px", lineHeight: 1.3 }}>
                {svc.title}
              </h3>
              <p style={{ fontSize: "0.95rem", color: T2, lineHeight: 1.65 }}>
                {svc.desc}
              </p>

              {/* Expand on hover */}
              <div style={{
                overflow: "hidden",
                maxHeight: expandedSvc === i ? "600px" : "0px",
                transition: "max-height 0.45s ease",
              }}>
                <div style={{ borderTop: `1px solid ${BD}`, paddingTop: "14px", marginTop: "14px" }}>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                    {svc.items.map((item, j) => (
                      <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.9rem", color: T2, lineHeight: 1.55 }}>
                        <span style={{ color: svc.color, flexShrink: 0, marginTop: "3px", fontWeight: 700 }}>→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 transition-transform duration-300 origin-left scale-x-0 group-hover:scale-x-100"
                style={{ background: `linear-gradient(90deg, ${svc.color}, ${G1})` }} />
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: "20px", color: T3, fontSize: "1rem" }}>{lp.svcMore}</p>
      </section>

      {/* ══════════════════ NUESTROS CLIENTES ══════════════════ */}
      <section id="clientes" style={{ borderTop: `1px solid ${BD}`, backgroundColor: BG2 }} className="py-14 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div data-animate className="mb-12">
            {eyebrowCenter(lang === "es" ? "A quiénes servimos" : "Who we serve")}
            <h2 style={{ ...sectionH2, textAlign: "center" }}>
              {lang === "es" ? "Nuestros Clientes" : "Our Clients"}
            </h2>
            <p style={{ color: T2, fontSize: "1rem", textAlign: "center", marginTop: "8px", maxWidth: "560px", margin: "8px auto 0" }}>
              {lang === "es"
                ? "Trabajamos con artistas, sellos independientes y editores musicales para maximizar su presencia y sus ingresos en la industria musical."
                : "We work with artists, independent labels, and music publishers to maximize their presence and income in the music industry."}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Para Artistas */}
            <div data-animate="left" data-delay="1" className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: CARD, border: `1px solid ${rg(0.15)}` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `linear-gradient(135deg, ${rg(0.15)}, ${rg(0.05)})`, border: `1px solid ${rg(0.2)}` }}>
                <Music size={22} style={{ color: G1 }} />
              </div>
              {eyebrow(lp.svcArtEyebrow)}
              <h3 style={{ color: T1, fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.3, marginBottom: "10px" }}>{lp.svcArtTitle}</h3>
              <p style={{ color: T3, fontSize: "0.95rem", lineHeight: 1.7, fontWeight: 300, marginBottom: "20px" }}>{lp.svcArtDesc}</p>
              <ul className="space-y-2.5">
                {artItems.map((item) => (
                  <li key={item} className="flex items-start gap-3" style={{ fontSize: "0.95rem", color: T2, lineHeight: 1.55 }}>
                    <CheckCircle2 size={16} style={{ color: G1, flexShrink: 0, marginTop: "2px" }} />{item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Para Editores */}
            <div data-animate="right" data-delay="2" className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: CARD, border: `1px solid ${rg(0.12)}` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `linear-gradient(135deg, ${rg(0.15)}, ${rg(0.05)})`, border: `1px solid ${rg(0.2)}` }}>
                <TrendingUp size={22} style={{ color: G2 }} />
              </div>
              {eyebrow(lp.svcPubEyebrow)}
              <h3 style={{ color: T1, fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.3, marginBottom: "10px" }}>{lp.svcPubTitle}</h3>
              <ul className="space-y-2.5 mt-6">
                {pubItems.map((item) => (
                  <li key={item} className="flex items-start gap-3" style={{ fontSize: "0.95rem", color: T2, lineHeight: 1.55 }}>
                    <CheckCircle2 size={16} style={{ color: G1, flexShrink: 0, marginTop: "2px" }} />{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ FAQ ══════════════════ */}
      <section id="preguntas" style={{ borderTop: `1px solid ${BD}`, borderBottom: `1px solid ${BD}` }} className="py-14 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div data-animate className="mb-12">
            {eyebrow(lp.faqEyebrow)}
            <h2 style={sectionH2}>{lp.faqH2}</h2>
            <p style={{ color: T2, fontSize: "1rem" }}>{lp.faqSub}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-2.5">
            {faqs.map((faq, index) => (
              <div key={index} data-animate data-delay={String((index % 4) + 1)} className="rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
                style={{ backgroundColor: CARD, border: openFaq === index ? `1px solid ${rg(0.35)}` : `1px solid ${BD}` }}
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                onMouseEnter={(e) => { if (openFaq !== index) (e.currentTarget as HTMLElement).style.borderColor = rg(0.2); }}
                onMouseLeave={(e) => { if (openFaq !== index) (e.currentTarget as HTMLElement).style.borderColor = BD; }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "20px 22px" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 500, lineHeight: 1.4, color: T1 }}>{faq.q}</div>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: `1px solid ${openFaq === index ? G1 : "rgba(255,255,255,0.15)"}`, backgroundColor: openFaq === index ? G1 : "transparent", color: openFaq === index ? "#000" : T2, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", transform: openFaq === index ? "rotate(45deg)" : "rotate(0deg)" }}>
                    <Plus size={13} />
                  </div>
                </div>
                <div style={{ overflow: "hidden", maxHeight: openFaq === index ? "300px" : "0", transition: "max-height 0.35s ease" }}>
                  <div style={{ padding: "0 22px 18px", paddingTop: "12px", fontSize: "0.9rem", color: T2, lineHeight: 1.72, fontWeight: 300, borderTop: `1px solid ${BD}` }}>
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CONTACT — Beneficios ══════════════════ */}
      <section style={{ borderBottom: `1px solid ${BD}`, backgroundColor: BG2 }} className="py-14 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
            <div data-animate="left">
              {eyebrow(lp.ctaBenEyebrow)}
              <h2 style={sectionH2}>{lp.ctaBenTitle}</h2>
              <p style={{ fontSize: "1rem", color: T2, lineHeight: 1.75, fontWeight: 300, marginBottom: "28px" }}>{lp.ctaBenP1}</p>
              <ul className="space-y-3">
                {ctaBenefits.map((b) => (
                  <li key={b} className="flex items-start gap-3" style={{ fontSize: "0.95rem", color: T2, lineHeight: 1.55 }}>
                    <CheckCircle2 size={17} style={{ color: G1, flexShrink: 0, marginTop: "1px" }} />{b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-5 md:p-8" style={{ backgroundColor: CARD, border: `1px solid ${rg(0.15)}` }}>
              <h3 style={{ color: T1, fontSize: "1.1rem", fontWeight: 700, marginBottom: "20px" }}>{lp.ctaExtraTitle}</h3>
              <ul className="space-y-3">
                {ctaExtras.map((item) => (
                  <li key={item} className="flex items-start gap-3" style={{ fontSize: "0.95rem", color: T2, lineHeight: 1.55 }}>
                    <span style={{ color: G1, fontSize: "0.875rem", marginTop: "3px", flexShrink: 0 }}>→</span>{item}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: "28px", padding: "18px", borderRadius: "10px", backgroundColor: rg(0.06), border: `1px solid ${rg(0.12)}` }}>
                <p style={{ fontSize: "0.9rem", color: T3, lineHeight: 1.65 }}>
                  {lang === "es" ? "Estamos para servirles y con gusto puede contactarnos para consulta." : "We are here to serve you and are happy to answer any inquiry."}
                </p>
                <div className="flex flex-col gap-1 mt-3">
                  {["shirley@esongsentertainment.com", "rosemary@esongsentertainment.com"].map((email) => (
                    <a key={email} href={`mailto:${email}`} style={{ fontSize: "0.9rem", color: G1, textDecoration: "none" }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.textDecoration = "underline"; }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.textDecoration = "none"; }}>
                      {email}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ CONTACT — Formulario ══════════════════ */}
      <section id="contacto" className="py-14 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <div>
              {eyebrow(lp.ctaEyebrow)}
              <h2 style={sectionH2}>{lp.ctaH2}</h2>
              <p style={{ fontSize: "1rem", color: T2, lineHeight: 1.75, fontWeight: 300, marginBottom: "24px" }}>{lp.ctaSub}</p>
              <div className="space-y-2.5">
                {[
                  { icon: "✉️", label: "Email", value: "shirley@esongsentertainment.com" },
                  { icon: "✉️", label: "Email", value: "rosemary@esongsentertainment.com" },
                  { icon: "🌎", label: lang === "es" ? "Ubicación" : "Location", value: "United States of America" },
                  { icon: "🌐", label: "Website", value: "esongsentertainment.com" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", borderRadius: "8px", padding: "14px", ...cardStyle, transition: "border-color 0.2s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = rg(0.25); }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = BD; }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: rg(0.08), border: `1px solid ${rg(0.2)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: T3, marginBottom: "2px" }}>{item.label}</div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 500, color: T1, wordBreak: "break-all" }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {contactSent ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "16px", padding: "48px", backgroundColor: CARD, border: `1px solid ${rg(0.2)}`, textAlign: "center" }}>
                <div>
                  <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>✅</div>
                  <p style={{ color: G1, fontWeight: 600, fontSize: "1.05rem" }}>{lp.ctaSent}</p>
                </div>
              </div>
            ) : (
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); setContactSent(true); }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label style={{ fontSize: "0.75rem", letterSpacing: "0.11em", textTransform: "uppercase", color: T3, display: "block", marginBottom: "5px" }}>{lp.ctaName}</label>
                    <input type="text" placeholder={lp.ctaName} style={inputStyle} onFocus={onFocusIn} onBlur={onFocusOut} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", letterSpacing: "0.11em", textTransform: "uppercase", color: T3, display: "block", marginBottom: "5px" }}>{lp.ctaEmail}</label>
                    <input type="email" placeholder={lp.ctaEmail} style={inputStyle} onFocus={onFocusIn} onBlur={onFocusOut} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", letterSpacing: "0.11em", textTransform: "uppercase", color: T3, display: "block", marginBottom: "5px" }}>
                    {lang === "es" ? "Mensaje" : "Message"}
                  </label>
                  <textarea placeholder={lp.ctaMsg} style={{ ...inputStyle, height: "110px", resize: "none" }}
                    onFocus={onFocusIn as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
                    onBlur={onFocusOut as unknown as React.FocusEventHandler<HTMLTextAreaElement>} />
                </div>
                <button type="submit" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-black transition-all duration-300"
                  style={{ background: `linear-gradient(135deg, ${G1}, ${G2})`, boxShadow: `0 6px 25px ${rg(0.3)}`, fontSize: "1rem", fontWeight: 700, border: "none", cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 30px ${rg(0.45)}`; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 25px ${rg(0.3)}`; }}>
                  {lp.ctaBtn}
                </button>
                <p style={{ fontSize: "0.875rem", color: T3, marginTop: "8px" }}>
                  {lp.ctaOr} <span style={{ color: T2 }}>shirley@esongsentertainment.com</span>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer style={{ borderTop: `1px solid ${BD}`, backgroundColor: "#0c0603", padding: "40px 0 28px" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 pb-8 md:pb-10 border-b mb-6" style={{ borderColor: BD }}>
            <div className="md:col-span-2">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: `linear-gradient(135deg, ${G1}, ${G2})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "black", fontSize: "13px", fontWeight: 900, fontStyle: "italic" }}>e</span>
                </div>
                <span style={{ fontSize: "1rem", fontWeight: 800, color: T1 }}>
                  e<span style={{ color: G1 }}>Songs</span> Entertainment
                </span>
              </div>
              <p style={{ fontSize: "0.9rem", color: T3, lineHeight: 1.7, fontWeight: 300, maxWidth: "260px", marginBottom: "16px" }}>
                {lp.footerTagline}
              </p>
              {/* Social */}
              <div style={{ display: "flex", gap: "10px" }}>
                {[
                  { href: "https://www.facebook.com/esongsentertainment",  label: "Facebook",  icon: "f" },
                  { href: "https://www.youtube.com/@esongsentertainment",  label: "YouTube",   icon: "▶" },
                  { href: "https://www.instagram.com/esongsentertainment", label: "Instagram", icon: "◉" },
                ].map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: CARD, border: `1px solid ${BD}`, display: "flex", alignItems: "center", justifyContent: "center", color: T3, fontSize: "0.85rem", fontWeight: 700, textDecoration: "none", transition: "all 0.2s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = rg(0.3); (e.currentTarget as HTMLElement).style.color = G1; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = BD; (e.currentTarget as HTMLElement).style.color = T3; }}>
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#4a3020", marginBottom: "14px" }}>
                {lang === "es" ? "Navegación" : "Navigation"}
              </div>
              <div className="space-y-2">
                {[
                  { href: "/",           label: lang === "es" ? "Inicio"      : "Home"     },
                  { href: "/#servicios", label: lang === "es" ? "Servicios"   : "Services" },
                  { href: "/#preguntas", label: lang === "es" ? "Preguntas"   : "FAQ"      },
                  { href: "/#contacto",  label: lang === "es" ? "Contáctenos" : "Contact"  },
                ].map((link) => (
                  <a key={link.label} href={link.href} style={{ display: "block", fontSize: "0.9rem", color: T3, fontWeight: 300, textDecoration: "none", transition: "color 0.15s" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = G1)}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = T3)}>
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#4a3020", marginBottom: "14px" }}>
                {lang === "es" ? "Servicios" : "Services"}
              </div>
              <div className="space-y-2">
                {[lp.svc1title, lp.svc2title, lp.svc3title, lp.svc4title].map((label) => (
                  <a key={label} href="/#servicios" style={{ display: "block", fontSize: "0.9rem", color: T3, fontWeight: 300, textDecoration: "none", transition: "color 0.15s" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = G1)}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = T3)}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ fontSize: "0.8rem", color: "#4a3020", letterSpacing: "0.06em" }}>
              © 2026 esongsentertainment.com · {lp.footerRights}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#4a3020" }}>shirley@esongsentertainment.com</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
