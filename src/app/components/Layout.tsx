import { Outlet, useLocation, useNavigate } from "react-router";
import logoImg from "../../assets/logo.webp";
import { Link } from "react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useLang } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { T, LP } from "../i18n";

export function Layout() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang, setLang } = useLang();
  const { user, logout } = useAuth();
  const tx = T[lang];
  const lp = LP[lang];

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const navLinks = [
    { href: "/",           label: tx.navInicio,    anchor: false },
    { href: "/#servicios", label: lp.navServicios, anchor: true  },
    { href: "/#clientes",  label: lp.navClientes,  anchor: true  },
    { href: "/#preguntas", label: lp.navPreguntas, anchor: true  },
    { href: "/#contacto",  label: lp.navContacto,  anchor: true  },
  ];

  const linkColor = (href: string, anchor: boolean) => {
    if (anchor) return "#94a3b8";
    return location.pathname === href ? "#d4af37" : "#94a3b8";
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#120a06", color: "#e2e8f0" }}>
      {/* Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{
          backgroundColor: "#120a06",
          borderColor: "rgba(212,175,55,0.12)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group" style={{ textDecoration: "none" }}>
            <div className="relative">
              <div className="flex items-center justify-center">
                <img src={logoImg} alt="eSongs" style={{ width: 58, height: 58, objectFit: "contain" }} className="md:!w-[76px] md:!h-[76px]" />
              </div>
              <div
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ boxShadow: "0 0 30px rgba(212,175,55,0.6)" }}
              />
            </div>
            <span className="text-base md:text-xl tracking-tight" style={{ color: "#e2e8f0" }}>
              <span style={{ color: "#d4af37" }}>esongs</span>entertainment
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors duration-200"
                style={{ fontSize: "1rem", color: linkColor(link.href, link.anchor), textDecoration: "none" }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "#e2e8f0"; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = linkColor(link.href, link.anchor); }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right side: lang toggle + CTA */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {(["es", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  style={{
                    fontFamily: "monospace",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    padding: "5px 11px",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    backgroundColor: lang === l ? "#d4af37" : "transparent",
                    color: lang === l ? "#010e06" : "#64748b",
                  }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {user ? (
              <>
                <Link
                  to={user.role === "admin" ? "/admin" : "/portal"}
                  className="px-5 py-2 rounded-lg text-sm transition-all duration-200"
                  style={{ border: "1px solid rgba(212,175,55,0.3)", color: "#d4af37", textDecoration: "none" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(212,175,55,0.1)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                >
                  {user.nombre}
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-5 py-2 rounded-lg text-sm transition-all duration-200"
                  style={{ border: "1px solid rgba(255,255,255,0.12)", color: "#64748b", background: "none", cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f1f5f9"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
                >
                  {lang === "es" ? "Salir" : "Log out"}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2 rounded-lg text-sm transition-all duration-200"
                style={{ border: "1px solid rgba(212,175,55,0.3)", color: "#d4af37", textDecoration: "none" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(212,175,55,0.1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
              >
                {tx.btnLogin}
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2"
            style={{ color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className="md:hidden border-t px-4 py-4 flex flex-col gap-4"
            style={{ borderColor: "rgba(212,175,55,0.12)", backgroundColor: "#120a06" }}
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm py-2"
                style={{ color: linkColor(link.href, link.anchor), textDecoration: "none" }}
              >
                {link.label}
              </a>
            ))}
            {user ? (
              <>
                <Link
                  to={user.role === "admin" ? "/admin" : "/portal"}
                  onClick={() => setMenuOpen(false)}
                  style={{ color: "#d4af37", fontSize: "0.875rem", textDecoration: "none" }}
                >
                  {user.nombre}
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); handleLogout(); }}
                  style={{ background: "none", border: "none", color: "#64748b", fontSize: "0.875rem", cursor: "pointer", textAlign: "left", padding: 0 }}
                >
                  {lang === "es" ? "Cerrar sesión" : "Log out"}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                style={{ color: "#d4af37", fontSize: "0.875rem", textDecoration: "none" }}
              >
                {tx.btnLogin}
              </Link>
            )}
            {/* Mobile lang toggle */}
            <div style={{ display: "flex", gap: 6, paddingTop: 4 }}>
              {(["es", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  style={{
                    fontFamily: "monospace",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "5px 14px",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: lang === l ? "#d4af37" : "rgba(255,255,255,0.06)",
                    color: lang === l ? "#010e06" : "#64748b",
                  }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Page content */}
      <main className="pt-[73px]">
        <Outlet />
      </main>
    </div>
  );
}
