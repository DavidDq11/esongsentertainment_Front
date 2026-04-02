const BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:4000";

function getToken(): string | null {
  try {
    const s = localStorage.getItem("esongs_auth");
    return s ? JSON.parse(s).token : null;
  } catch {
    return null;
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json() as Promise<T>;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  role: "admin" | "sello";
  nombre: string;
  iniciales?: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>("POST", "/api/auth/login", { email, password }),
};

// ── Sellos ───────────────────────────────────────────────────────────────────

export interface Sello {
  id: string;
  nombre: string;
  representante: string | null;
  email: string;
  pais: string | null;
  telefono: string | null;
  iniciales: string | null;
  estado: "activo" | "inactivo";
  total_reportes: number;
  total_regalias: string;
}

export const sellosApi = {
  list: () => request<Sello[]>("GET", "/api/sellos"),
  create: (data: {
    nombre: string;
    representante?: string;
    email: string;
    password: string;
    pais?: string;
    telefono?: string;
    iniciales?: string;
  }) => request<Sello>("POST", "/api/sellos", data),
  update: (id: string, data: Partial<Sello & { password?: string }>) =>
    request<Sello>("PUT", `/api/sellos/${id}`, data),
  remove: (id: string) => request<{ ok: boolean }>("DELETE", `/api/sellos/${id}`),
};

// ── Reportes ─────────────────────────────────────────────────────────────────

export interface Reporte {
  id: string;
  sello_id: string;
  tipo: "streaming" | "youtube";
  nombre_archivo: string;
  r2_key: string;
  trimestre: number;
  anio: number;
  total_regalias: string;
  created_at: string;
  sello_nombre: string;
  iniciales: string;
}

export const reportesApi = {
  list: (params?: { sello_id?: string; tipo?: string; anio?: string }) => {
    const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return request<Reporte[]>("GET", `/api/reportes${qs}`);
  },
  upload: (formData: FormData) =>
    fetch(`${BASE}/api/reportes`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || res.statusText);
      }
      return res.json() as Promise<Reporte>;
    }),
  download: (id: string) => request<{ url: string }>("GET", `/api/reportes/${id}/download`),
  remove: (id: string) => request<{ ok: boolean }>("DELETE", `/api/reportes/${id}`),
};

// ── Portal ───────────────────────────────────────────────────────────────────

export interface DashboardData {
  sello: { nombre: string; iniciales: string };
  resumen: {
    streaming: number;
    youtube: number;
    total: number;
    trimestre: number | null;
    anio: number | null;
  };
  topSongs: Array<{
    titulo: string;
    artista: string;
    reproducciones: number;
    regalias: number;
    posicion: number;
    pct: number;
  }>;
}

export const portalApi = {
  dashboard: () => request<DashboardData>("GET", "/api/portal/dashboard"),
};
