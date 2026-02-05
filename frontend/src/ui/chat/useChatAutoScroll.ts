import { useEffect, useMemo, useRef, useState } from "react";

export function useChatAutoScroll<T extends { created_at: string; id?: string | number }>(items: T[]) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unread, setUnread] = useState(0);

  const lastKey = useMemo(() => {
    const last = items?.[items.length - 1];
    return last ? `${last.id ?? ""}_${last.created_at}` : "";
  }, [items]);

  // track scroll position
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
      setIsAtBottom(nearBottom);
      if (nearBottom) setUnread(0);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll as any);
  }, []);

  // when new messages arrive
  useEffect(() => {
    if (!lastKey) return;
    if (isAtBottom) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      setUnread(0);
    } else {
      setUnread((n) => n + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastKey]);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    setUnread(0);
    setIsAtBottom(true);
  };

  return { scrollerRef, endRef, isAtBottom, unread, scrollToBottom };
}






