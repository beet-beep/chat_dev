function defaultApiBase() {
  // Use the same host as the current page to avoid IPv4/IPv6 or LAN hostname mismatches.
  // Fallback to 127.0.0.1 for non-browser contexts (e.g. build).
  if (typeof window === "undefined") return "http://127.0.0.1:8000/api";
  
  // Use relative path to leverage Vite proxy
  return "/api";
}

const rawEnvBase = import.meta.env.VITE_API_BASE;
const API_BASE = typeof rawEnvBase === "string" && rawEnvBase.trim().length > 0 ? rawEnvBase.trim() : defaultApiBase();

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

function getToken(tokenKey: "auth_token" | "admin_token"): string | null {
  return localStorage.getItem(tokenKey);
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  tokenKey: "auth_token" | "admin_token" = "auth_token"
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  const token = getToken(tokenKey);
  if (token) headers.set("Authorization", `Token ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const text = await res.text();
  const payload = text ? safeJson(text) : null;

  if (!res.ok) {
    // Safety: if a shared URL is opened without valid auth, never keep/assume previous session.
    if (res.status === 401 || res.status === 403) {
      try {
        localStorage.removeItem(tokenKey);
      } catch {
        // ignore
      }
    }
    throw new ApiError(`API ${res.status}`, res.status, payload);
  }
  return payload as T;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}


