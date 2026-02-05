import { ApiError, apiFetch } from "./client";
import type { Faq, FaqCategory, Me, Ticket, TicketCategory } from "./types";

function getClientMeta() {
  try {
    const ua = typeof navigator !== "undefined" ? String(navigator.userAgent || "") : "";
    const lang = typeof navigator !== "undefined" ? String((navigator as any).language || "") : "";
    const tz =
      typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function"
        ? String(Intl.DateTimeFormat().resolvedOptions().timeZone || "")
        : "";
    return { ua, lang, tz };
  } catch {
    return { ua: "", lang: "", tz: "" };
  }
}

function unwrapList<T>(data: any): T[] {
  // DRF pagination returns {count, next, previous, results}
  if (Array.isArray(data)) return data as T[];
  if (data && Array.isArray(data.results)) return data.results as T[];
  return [];
}

export function listFaqCategories() {
  return apiFetch<any>("/faq-categories/").then((d) => unwrapList<FaqCategory>(d));
}

export function listFaqs(params: { is_popular?: boolean; category_id?: number; q?: string; lang?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.is_popular !== undefined) qs.set("is_popular", params.is_popular ? "true" : "false");
  if (params.category_id !== undefined) qs.set("category_id", String(params.category_id));
  if (params.q) qs.set("q", params.q);
  if (params.lang) qs.set("lang", params.lang);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<any>(`/faqs/${suffix}`).then((d) => unwrapList<Faq>(d));
}

export function getFaq(faqId: number) {
  return apiFetch<Faq>(`/faqs/${faqId}/`);
}

export function listTicketCategories() {
  return apiFetch<any>("/ticket-categories/").then((d) => unwrapList<TicketCategory>(d));
}

export function listTickets(params: { page?: number; page_size?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.page_size) qs.set("page_size", String(params.page_size));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<{ count: number; next: string | null; previous: string | null; results: Ticket[] }>(`/tickets/${suffix}`);
}

export function getTicket(ticketId: number) {
  return apiFetch<Ticket>(`/tickets/${ticketId}/`);
}

export function createTicket(input: { category_id?: number | null; title: string; body: string }) {
  const { category_id, title, body } = input;
  const fd = new FormData();
  if (category_id !== undefined && category_id !== null) fd.append("category_id", String(category_id));
  fd.append("title", title);
  fd.append("body", body);
  const meta = getClientMeta();
  if (meta.ua) fd.append("user_device", meta.ua);
  if (meta.lang) fd.append("user_locale", meta.lang);
  if (meta.tz) fd.append("client_tz", meta.tz);
  return apiFetch<Ticket>("/tickets/", { method: "POST", body: fd });
}

export function createTicketWithFiles(input: {
  category_id?: number | null;
  title: string;
  body: string;
  files?: File[];
  entry_source?: string;
  client_meta?: any;
}) {
  const fd = new FormData();
  if (input.category_id !== undefined && input.category_id !== null) fd.append("category_id", String(input.category_id));
  fd.append("title", input.title);
  fd.append("body", input.body);
  if (input.entry_source) fd.append("entry_source", input.entry_source);
  if (input.client_meta !== undefined) {
    try {
      fd.append("client_meta", JSON.stringify(input.client_meta));
    } catch {
      // ignore
    }
  }
  const meta = getClientMeta();
  if (meta.ua) fd.append("user_device", meta.ua);
  if (meta.lang) fd.append("user_locale", meta.lang);
  if (meta.tz) fd.append("client_tz", meta.tz);
  for (const f of input.files ?? []) fd.append("files", f);
  return apiFetch<Ticket>("/tickets/", { method: "POST", body: fd });
}

export function addTicketReply(ticketId: number, input: { body: string; files?: File[]; client_meta?: any }) {
  const fd = new FormData();
  fd.append("body", input.body);
  if (input.client_meta !== undefined) {
    try {
      fd.append("client_meta", JSON.stringify(input.client_meta));
    } catch {
      // ignore
    }
  }
  for (const f of input.files ?? []) fd.append("files", f);
  return apiFetch<{ id: number; body: string; author_name: string; created_at: string }>(
    `/tickets/${ticketId}/replies/`,
    {
      method: "POST",
      body: fd,
    }
  );
}

export function markTicketSeen(ticketId: number) {
  return apiFetch<{ user_seen_at: string }>(`/tickets/${ticketId}/seen/`, { method: "POST" });
}

export function getMe() {
  return apiFetch<Me>("/me/");
}

export function login(input: { email: string; password: string }) {
  return apiFetch<{ token: string; user: Me }>("/auth/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function testLogin(input: { nickname?: string; member_code?: string } = {}) {
  return apiFetch<{ token: string; user: Me; credentials?: { email: string; password: string } }>("/auth/test-login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function adminTestLogin(input: { email?: string; password?: string; nickname?: string } = {}) {
  return apiFetch<{ token: string; user: Me; credentials?: { email: string; password: string } }>(
    "/auth/admin-test-login/",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "auth_token"
  );
}

export function updateMe(input: Partial<{ first_name: string; last_name: string; profile: { display_name?: string; avatar_url?: string; phone_number?: string } }>) {
  return apiFetch<Me>("/me/", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
}

export function uploadMeAvatar(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  return apiFetch<Me>("/me/avatar/", { method: "POST", body: fd });
}

export function adminMe() {
  return apiFetch<Me>("/me/", {}, "admin_token");
}

export function adminUpdateMe(input: Partial<{ first_name: string; last_name: string; profile: { display_name?: string; avatar_url?: string; status_message?: string; job_title?: string } }>) {
  return apiFetch<Me>(
    "/me/",
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "admin_token"
  );
}

export function adminUploadMeAvatar(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  return apiFetch<Me>("/me/avatar/", { method: "POST", body: fd }, "admin_token");
}

export function register(input: { email: string; password: string; name?: string }) {
  return apiFetch<{ token: string; user: Me }>("/auth/register/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

// Admin APIs (IsAdminUser)
export function adminListTickets() {
  return apiFetch<{ count: number; next: string | null; previous: string | null; results: (Ticket & { user_email: string; user_name: string; user_id: number })[] }>(
    "/admin/tickets/",
    {},
    "admin_token"
  );
}

export function adminGetTicket(ticketId: number) {
  return apiFetch<any>(`/admin/tickets/${ticketId}/`, {}, "admin_token");
}

export function adminStaffReply(ticketId: number, input: { body: string }) {
  const fd = new FormData();
  fd.append("body", input.body);
  return apiFetch<{ id: number; body: string; author_name: string; created_at: string }>(
    `/admin/tickets/${ticketId}/staff_reply/`,
    {
      method: "POST",
      body: fd,
    },
    "admin_token"
  );
}

export function adminStaffReplyWithFiles(ticketId: number, input: { body: string; files?: File[] }) {
  const fd = new FormData();
  fd.append("body", input.body);
  for (const f of input.files ?? []) fd.append("files", f);
  return apiFetch<{ id: number; body: string; author_name: string; created_at: string }>(
    `/admin/tickets/${ticketId}/staff_reply/`,
    { method: "POST", body: fd },
    "admin_token"
  );
}

export function adminMarkTicketSeen(ticketId: number) {
  return apiFetch<{ staff_seen_at: string }>(`/admin/tickets/${ticketId}/seen/`, { method: "POST" }, "admin_token");
}

export function adminSetTicketStatus(ticketId: number, status: "PENDING" | "ANSWERED" | "CLOSED") {
  return apiFetch<Ticket & { user_email: string; user_name: string }>(`/admin/tickets/${ticketId}/set_status/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }, "admin_token");
}

export function adminBulkSetTicketStatus(ids: number[], status: "PENDING" | "ANSWERED" | "CLOSED") {
  return apiFetch<{ updated: number; status: "PENDING" | "ANSWERED" | "CLOSED" }>(
    `/admin/tickets/bulk_set_status/`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, status }) },
    "admin_token"
  );
}

export function adminSetTicketMeta(
  ticketId: number,
  input: Partial<{ assignee_id: number | null; priority: string; tags: string[]; channel: string; team: string }>
) {
  return apiFetch<any>(`/admin/tickets/${ticketId}/set_meta/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }, "admin_token");
}

export function adminDeleteTicket(ticketId: number) {
  return apiFetch<{}>(`/admin/tickets/${ticketId}/`, { method: "DELETE" }, "admin_token");
}

export function adminListTicketNotes(ticketId: number) {
  return apiFetch<any[]>(`/admin/tickets/${ticketId}/notes/`, {}, "admin_token");
}

export function adminAddTicketNote(ticketId: number, body: string) {
  return apiFetch<any>(
    `/admin/tickets/${ticketId}/note/`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) },
    "admin_token"
  );
}

export function adminAiGenerateReply(ticketId: number) {
  // Prefer the viewset action (more reliable) and fall back to legacy URL.
  return apiFetch<{ reply: string; source?: "openrouter" | "gemini" | "heuristic" }>(`/admin/tickets/${ticketId}/ai_generate_reply/`, { method: "POST" }, "admin_token").catch((e) => {
    if (e instanceof ApiError && e.status === 404) {
      return apiFetch<{ reply: string; source?: "openrouter" | "gemini" | "heuristic" }>(
        "/admin/ai-generate-reply/",
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticket_id: ticketId }) },
        "admin_token"
      );
    }
    throw e;
  });
}

export function adminListAgents() {
  return apiFetch<{ id: number; email: string; name: string; avatar_url?: string; status_message?: string }[]>(`/admin/agents/`, {}, "admin_token");
}

export function adminListInboxViews() {
  return apiFetch<{ id: number; name: string; config: any; scope: "PERSONAL" | "TEAM"; created_at: string; updated_at: string }[]>(
    `/admin/inbox-views/`,
    {},
    "admin_token"
  );
}

export function adminCreateInboxView(input: { name: string; config: any; scope?: "PERSONAL" | "TEAM" }) {
  return apiFetch<{ id: number; name: string; config: any; scope: "PERSONAL" | "TEAM"; created_at: string; updated_at: string }>(
    `/admin/inbox-views/`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "admin_token"
  );
}

export function adminPatchInboxView(viewId: number, input: Partial<{ name: string; config: any }>) {
  return apiFetch<{ id: number; name: string; config: any; scope: "PERSONAL" | "TEAM"; created_at: string; updated_at: string }>(
    `/admin/inbox-views/${viewId}/`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "admin_token"
  );
}

export function adminDeleteInboxView(viewId: number) {
  return apiFetch<{}>(`/admin/inbox-views/${viewId}/`, { method: "DELETE" }, "admin_token");
}

export function adminListPresetTags() {
  return apiFetch<{ id: number; name: string; color: string; order: number; is_active: boolean }[]>(
    `/admin/presets/tags/`,
    {},
    "admin_token"
  );
}

export function adminCreatePresetTag(input: { name: string; color?: string; order?: number; is_active?: boolean }) {
  return apiFetch<{ id: number; name: string; color: string; order: number; is_active: boolean }>(
    `/admin/presets/tags/`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "admin_token"
  );
}

export function adminDeletePresetTag(tagId: number) {
  return apiFetch<{}>(`/admin/presets/tags/${tagId}/`, { method: "DELETE" }, "admin_token");
}

export function adminPatchPresetTag(tagId: number, input: Partial<{ name: string; color: string; order: number; is_active: boolean }>) {
  return apiFetch<{ id: number; name: string; color: string; order: number; is_active: boolean }>(
    `/admin/presets/tags/${tagId}/`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "admin_token"
  );
}

export function adminListPresetChannels() {
  return apiFetch<{ id: number; key: string; label: string; order: number; is_active: boolean }[]>(
    `/admin/presets/channels/`,
    {},
    "admin_token"
  );
}

export function adminListPresetTeams() {
  return apiFetch<{ id: number; key: string; label: string; order: number; is_active: boolean }[]>(
    `/admin/presets/teams/`,
    {},
    "admin_token"
  );
}

export type AiLibraryItem = {
  id: number;
  ticket: number | null;
  title: string;
  context: string;
  generated_reply: string;
  final_reply: string;
  tags: string[];
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
};

export function adminListAiLibrary(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  return apiFetch<AiLibraryItem[]>(`/admin/ai-library/${qs}`, {}, "admin_token");
}

export function adminCreateAiLibraryItem(input: Partial<Pick<AiLibraryItem, "ticket" | "title" | "context" | "generated_reply" | "final_reply" | "tags">>) {
  return apiFetch<AiLibraryItem>(
    `/admin/ai-library/`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "admin_token"
  );
}

export function adminPatchAiLibraryItem(id: number, input: Partial<Pick<AiLibraryItem, "title" | "context" | "generated_reply" | "final_reply" | "tags">>) {
  return apiFetch<AiLibraryItem>(
    `/admin/ai-library/${id}/`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "admin_token"
  );
}

export function adminDeleteAiLibraryItem(id: number) {
  return apiFetch<{}>(`/admin/ai-library/${id}/`, { method: "DELETE" }, "admin_token");
}

export function adminAiEnhanceLibraryItem(input: { context: string; generated_reply: string; final_reply: string }) {
  return apiFetch<{
    success: boolean;
    enhanced: {
      category?: string;
      customer_intent?: string;
      answer_pattern?: string;
      keywords?: string[];
      quality_score?: number;
      raw?: string;
    };
    source: "openrouter" | "fallback";
  }>(
    `/admin/ai-library/ai_enhance/`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "admin_token"
  );
}

// Admin: Ticket Categories (SupportBot)
export function adminListTicketCategories() {
  return apiFetch<any[]>(`/admin/ticket-categories/`, {}, "admin_token");
}

export function adminPatchTicketCategory(
  categoryId: number,
  input: Partial<{
    name: string;
    name_i18n: Record<string, string>;
    order: number;
    platform: string;
    guide_description: string;
    guide_description_i18n: Record<string, string>;
    bot_enabled: boolean;
    bot_title: string;
    bot_title_i18n: Record<string, string>;
    bot_blocks: any[];
    bot_blocks_i18n: Record<string, any[]>;
    form_enabled: boolean;
    form_button_label: string;
    form_button_label_i18n: Record<string, string>;
    form_template: string;
    form_template_i18n: Record<string, string>;
    form_title_template: string;
    form_title_template_i18n: Record<string, string>;
    form_checklist: string[];
    form_checklist_i18n: Record<string, string[]>;
    form_checklist_required: boolean;
  }>
) {
  return apiFetch<any>(`/admin/ticket-categories/${categoryId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }, "admin_token");
}

export function adminCreateTicketCategory(input: { name: string; name_i18n?: Record<string, string>; order?: number; bot_enabled?: boolean; bot_title?: string; bot_blocks?: any[] }) {
  return apiFetch<any>(
    `/admin/ticket-categories/`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "admin_token"
  );
}

export function adminDeleteTicketCategory(categoryId: number) {
  return apiFetch<{}>(`/admin/ticket-categories/${categoryId}/`, { method: "DELETE" }, "admin_token");
}

export function adminCreatePresetChannel(input: { key: string; label?: string; order?: number; is_active?: boolean }) {
  return apiFetch<{ id: number; key: string; label: string; order: number; is_active: boolean }>(
    `/admin/presets/channels/`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "admin_token"
  );
}

export function adminCreatePresetTeam(input: { key: string; label?: string; order?: number; is_active?: boolean }) {
  return apiFetch<{ id: number; key: string; label: string; order: number; is_active: boolean }>(
    `/admin/presets/teams/`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "admin_token"
  );
}

export function adminDeletePresetChannel(channelId: number) {
  return apiFetch<{}>(`/admin/presets/channels/${channelId}/`, { method: "DELETE" }, "admin_token");
}

export function adminDeletePresetTeam(teamId: number) {
  return apiFetch<{}>(`/admin/presets/teams/${teamId}/`, { method: "DELETE" }, "admin_token");
}

export function adminPatchPresetChannel(
  channelId: number,
  input: Partial<{ key: string; label: string; order: number; is_active: boolean }>
) {
  return apiFetch<{ id: number; key: string; label: string; order: number; is_active: boolean }>(
    `/admin/presets/channels/${channelId}/`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "admin_token"
  );
}

export function adminPatchPresetTeam(teamId: number, input: Partial<{ key: string; label: string; order: number; is_active: boolean }>) {
  return apiFetch<{ id: number; key: string; label: string; order: number; is_active: boolean }>(
    `/admin/presets/teams/${teamId}/`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "admin_token"
  );
}

export function adminListCustomers(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  return apiFetch<
    {
      id: number;
      email: string;
      name: string;
      uuid: string;
      display_name: string;
      member_code: string;
      game_uuid: string;
      login_provider: string;
      avatar_url: string;
      phone_number: string;
      is_vip: boolean;
      tags: string[];
      notes: string;
      total_spend_krw: number;
      ticket_count: number;
      joined_at: string;
      last_ticket_at: string;
      last_channel: string;
      last_entry_source: string;
      device: string;
      locale: string;
      location: string;
      last_purchase_at: string;
    }[]
  >(`/admin/customers/${qs}`, {}, "admin_token");
}

export function adminGetCustomer(customerId: number) {
  return apiFetch<
    {
      id: number;
      email: string;
      name: string;
      uuid: string;
      display_name: string;
      member_code: string;
      game_uuid: string;
      login_provider: string;
      avatar_url: string;
      phone_number: string;
      is_vip: boolean;
      tags: string[];
      notes: string;
      total_spend_krw: number;
      ticket_count: number;
      joined_at: string;
      last_ticket_at: string;
      last_channel: string;
      last_entry_source: string;
      device: string;
      locale: string;
      location: string;
      last_purchase_at: string;
    }
  >(`/admin/customers/${customerId}/`, {}, "admin_token");
}

export function adminPatchCustomer(
  customerId: number,
  input: Partial<{ phone_number: string; is_vip: boolean; tags: string[]; notes: string }>
) {
  return apiFetch<
    {
      id: number;
      email: string;
      name: string;
      uuid: string;
      display_name: string;
      member_code: string;
      game_uuid: string;
      login_provider: string;
      avatar_url: string;
      phone_number: string;
      is_vip: boolean;
      tags: string[];
      notes: string;
      total_spend_krw: number;
      ticket_count: number;
      joined_at: string;
      last_ticket_at: string;
      last_channel: string;
      last_entry_source: string;
      device: string;
      locale: string;
      location: string;
      last_purchase_at: string;
    }
  >(
    `/admin/customers/${customerId}/`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "admin_token"
  );
}

export function adminListFaqCategories() {
  return apiFetch<any>("/admin/faq-categories/", {}, "admin_token").then((d) => unwrapList<FaqCategory>(d));
}

export function adminCreateFaqCategory(input: { name: string; order?: number; guide_url?: string; kind?: "GUIDE" | "GENERAL" }) {
  return apiFetch<FaqCategory>(
    `/admin/faq-categories/`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "admin_token"
  );
}

export function adminPatchFaqCategory(
  categoryId: number,
  input: Partial<{ name: string; name_i18n: Record<string, string>; order: number; guide_url: string; kind: "GUIDE" | "GENERAL"; is_guide_link: boolean }>
) {
  return apiFetch<FaqCategory>(
    `/admin/faq-categories/${categoryId}/`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "admin_token"
  );
}

export function adminDeleteFaqCategory(categoryId: number) {
  return apiFetch<void>(`/admin/faq-categories/${categoryId}/`, { method: "DELETE" }, "admin_token");
}

export function adminListFaqs(params: { lang?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.lang) qs.set("lang", params.lang);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<any>(`/admin/faqs/${suffix}`, {}, "admin_token").then((d) => unwrapList<Faq>(d));
}

export function adminCreateFaq(input: {
  category_id?: number | null;
  title: string;
  title_i18n?: Record<string, string>;
  body: string;
  body_i18n?: Record<string, string>;
  blocks?: any[];
  is_popular?: boolean;
  is_hidden?: boolean;
  order?: number;
  lang?: string;
}) {
  return apiFetch<Faq>(
    `/admin/faqs/`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_hidden: false, ...input }) },
    "admin_token"
  );
}

export function adminPatchFaq(
  faqId: number,
  input: Partial<{
    category_id: number | null;
    title: string;
    title_i18n: Record<string, string>;
    body: string;
    body_i18n: Record<string, string>;
    blocks: any[];
    is_popular: boolean;
    is_hidden: boolean;
    order: number;
    lang: string;
  }>
) {
  return apiFetch<Faq>(
    `/admin/faqs/${faqId}/`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
    "admin_token"
  );
}

export function adminDeleteFaq(faqId: number) {
  return apiFetch<void>(`/admin/faqs/${faqId}/`, { method: "DELETE" }, "admin_token");
}

export function adminUploadFaqFiles(faqId: number, files: File[]) {
  const fd = new FormData();
  for (const f of files) fd.append("files", f);
  return apiFetch<{ attachments: { id: number; url: string; original_name: string; content_type: string; created_at: string }[] }>(
    `/admin/faqs/${faqId}/upload/`,
    { method: "POST", body: fd },
    "admin_token"
  );
}

// FAQ view tracking
export function trackFaqView(faqId: number, sessionId?: string) {
  return apiFetch<{ success: boolean; view_count: number }>(
    `/faqs/${faqId}/track_view/`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: sessionId || "" }) }
  );
}

// Admin analytics
export type AdminAnalyticsResponse = {
  date_range: { start_date: string; end_date: string };
  tickets: {
    total: number;
    pending: number;
    answered: number;
    closed: number;
    unassigned: number;
    avg_response_time_min: number;
    avg_processing_time_min: number;
    resolution_rate: number;
  };
  faq: {
    total_views: number;
    top_faqs: { id: number; title: string; category: string | null; views: number; total_views: number }[];
  };
  trends: {
    daily_tickets: { date: string; count: number }[];
    daily_faq_views: { date: string; count: number }[];
  };
};

export function adminGetAnalytics(startDate?: string, endDate?: string) {
  const qs = new URLSearchParams();
  if (startDate) qs.set("start_date", startDate);
  if (endDate) qs.set("end_date", endDate);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<AdminAnalyticsResponse>(`/admin/analytics/${suffix}`, {}, "admin_token");
}

// ---------------------------------------------------------------------------
// VOC Studio
// ---------------------------------------------------------------------------
export type VocEntry = {
  id: number;
  ticket: number;
  ticket_title: string;
  ticket_status: string;
  voc_type: "BUG" | "SUGGESTION" | "COMPLAINT" | "PRAISE" | "OTHER";
  voc_type_label: string;
  status: "NEW" | "REVIEWING" | "PLANNED" | "DONE" | "REJECTED";
  status_label: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  severity_label: string;
  summary: string;
  keywords: string[];
  sentiment: string;
  sentiment_score: number;
  category: string;
  impact_score: number;
  ai_analysis: any;
  action_items: string[];
  admin_note: string;
  user_name: string;
  created_by: number | null;
  created_by_name: string;
  created_at: string;
  updated_at: string;
};

export type VocDashboard = {
  total: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  by_severity: Record<string, number>;
  avg_impact: number;
  avg_sentiment: number;
  sentiment_dist: Record<string, number>;
  daily_trend: { date: string; count: number }[];
  top_keywords: { keyword: string; count: number }[];
  top_categories: Record<string, number>;
  days: number;
};

export function adminListVoc(params: { voc_type?: string; status?: string; severity?: string; q?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.voc_type) qs.set("voc_type", params.voc_type);
  if (params.status) qs.set("status", params.status);
  if (params.severity) qs.set("severity", params.severity);
  if (params.q) qs.set("q", params.q);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<any>(`/admin/voc/${suffix}`, {}, "admin_token").then((d) => unwrapList<VocEntry>(d));
}

export function adminCreateVoc(input: Partial<Pick<VocEntry, "ticket" | "voc_type" | "severity" | "summary" | "admin_note">>) {
  return apiFetch<VocEntry>(`/admin/voc/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }, "admin_token");
}

export function adminPatchVoc(id: number, input: Partial<Pick<VocEntry, "voc_type" | "status" | "severity" | "summary" | "admin_note" | "action_items" | "keywords">>) {
  return apiFetch<VocEntry>(`/admin/voc/${id}/`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }, "admin_token");
}

export function adminDeleteVoc(id: number) {
  return apiFetch<void>(`/admin/voc/${id}/`, { method: "DELETE" }, "admin_token");
}

export function adminAnalyzeVoc(id: number) {
  return apiFetch<{ success: boolean; analysis?: any; raw?: string; source: string }>(`/admin/voc/${id}/analyze/`, { method: "POST" }, "admin_token");
}

export function adminVocDashboard(days?: number) {
  const qs = days ? `?days=${days}` : "";
  return apiFetch<VocDashboard>(`/admin/voc/dashboard/${qs}`, {}, "admin_token");
}

// ---------------------------------------------------------------------------
// Translation
// ---------------------------------------------------------------------------
export type TranslateItem = { key: string; text: string; is_html?: boolean };
export type TranslateResult = Record<string, Record<string, string>>;

export function adminTranslate(items: TranslateItem[], targetLangs: string[] = ["en", "ja", "zh-TW"]) {
  return apiFetch<{ results: TranslateResult; source: string }>(
    "/admin/translate/",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, source_lang: "ko", target_langs: targetLangs }) },
    "admin_token"
  );
}

