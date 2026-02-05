export type FaqCategory = {
  id: number;
  name: string;
  name_i18n?: Record<string, string>;
  order: number;
  guide_url: string;
  kind: "GUIDE" | "GENERAL";
  is_guide_link?: boolean;
};

export type FaqAttachment = { id: number; url: string; original_name: string; content_type: string; created_at: string };

export type FaqBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "callout"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "numbered"; items: string[] }
  | { type: "divider" }
  | { type: "image"; url: string }
  | { type: "video"; url: string }
  | { type: "file"; url: string; name?: string };

export type Faq = {
  id: number;
  title: string;
  title_i18n?: Record<string, string>;
  body: string;
  body_i18n?: Record<string, string>;
  blocks: FaqBlock[];
  attachments: FaqAttachment[];
  is_popular: boolean;
  is_hidden?: boolean;
  order: number;
  lang?: string;
  created_at: string;
  category: FaqCategory | null;
};

export type TicketCategory = {
  id: number;
  name: string;
  name_i18n?: Record<string, string>;
  order: number;
  guide_description?: string;
  guide_description_i18n?: Record<string, string>;
  bot_enabled?: boolean;
  bot_title?: string;
  bot_title_i18n?: Record<string, string>;
  bot_blocks?: any[];
  bot_blocks_i18n?: Record<string, any[]>;
  form_enabled?: boolean;
  form_button_label?: string;
  form_button_label_i18n?: Record<string, string>;
  form_template?: string;
  form_template_i18n?: Record<string, string>;
  form_title_template?: string;
  form_title_template_i18n?: Record<string, string>;
  form_checklist?: string[];
  form_checklist_i18n?: Record<string, string[]>;
  form_checklist_required?: boolean;
  platform?: string;
  form_default_content?: string;
};

export type TicketReply = {
  id: number;
  body: string;
  author_name: string;
  author?: { id: number | null; name: string; avatar_url?: string; is_staff?: boolean };
  author_is_staff?: boolean;
  created_at: string;
};

export type Attachment = { id: number; url: string; original_name: string; content_type: string };

export type Ticket = {
  id: number;
  title: string;
  body: string;
  status: "PENDING" | "ANSWERED" | "CLOSED";
  status_label: string;
  created_at: string;
  category: TicketCategory | null;
  replies: (TicketReply & { attachments?: Attachment[] })[];
  attachments?: Attachment[];
  entry_source?: string;
  team?: string;
  user_device?: string;
  user_locale?: string;
  user_location?: string;
  client_meta?: any;
};

export type Me = {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  profile: {
    display_name: string;
    avatar_url: string;
    phone_number?: string;
    status_message?: string;
    game_uuid?: string;
    member_code?: string;
    login_provider?: string;
    payment_info?: any;
    login_info?: any;
  };
};


