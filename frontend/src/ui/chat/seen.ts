const KEY = "joody_chat_seen_v1";

type SeenMap = Record<string, string>; // ticketId -> ISO timestamp

function load(): SeenMap {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as SeenMap) : {};
  } catch {
    return {};
  }
}

function save(map: SeenMap) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function getSeenAt(ticketId: number) {
  const map = load();
  return map[String(ticketId)] || "";
}

export function markSeen(ticketId: number, iso: string) {
  const map = load();
  map[String(ticketId)] = iso;
  save(map);
}






