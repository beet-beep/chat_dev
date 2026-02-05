function defaultApiBase() {
  if (typeof window === "undefined") return "http://127.0.0.1:8000/api";
  const proto = window.location.protocol;
  const rawHost = window.location.hostname;
  const host = rawHost === "0.0.0.0" ? "127.0.0.1" : rawHost;
  return `${proto}//${host}:8000/api`;
}

const rawEnvBase = import.meta.env.VITE_API_BASE;
const API_BASE = typeof rawEnvBase === "string" && rawEnvBase.trim().length > 0 ? rawEnvBase.trim() : defaultApiBase();

export type TicketRealtimeEvent =
  | { type: "hello"; ticket_id: number }
  | { type: "reply"; ticket_id: number; reply: any }
  | { type: "typing"; ticket_id: number; author: { id: number | null; name: string; avatar_url?: string; is_staff?: boolean }; is_typing: boolean }
  | { type: "seen"; ticket_id: number; user_seen_at?: string };

function wsBaseFromApiBase(apiBase: string): string {
  // API_BASE is like http://host:8000/api -> ws://host:8000
  const u = new URL(apiBase);
  const isSecure = u.protocol === "https:";
  const wsProto = isSecure ? "wss:" : "ws:";
  return `${wsProto}//${u.host}`;
}

export function connectTicketWS(ticketId: number, tokenKey: "auth_token" | "admin_token"): WebSocket | null {
  const token = localStorage.getItem(tokenKey);
  if (!token) return null;
  const base = wsBaseFromApiBase(API_BASE);
  const url = `${base}/ws/tickets/${ticketId}/?token=${encodeURIComponent(token)}`;
  return new WebSocket(url);
}

export function connectAdminInboxWS(): WebSocket | null {
  const token = localStorage.getItem("admin_token");
  if (!token) return null;
  const base = wsBaseFromApiBase(API_BASE);
  const url = `${base}/ws/admin/inbox/?token=${encodeURIComponent(token)}`;
  return new WebSocket(url);
}

export function sendTyping(ws: WebSocket | null, isTyping: boolean) {
  try {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "typing", is_typing: isTyping }));
  } catch {
    // ignore
  }
}


