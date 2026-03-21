// ==================== AI DISCUSSION TYPES ====================

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiDiscussContext {
  title: string;
  description: string;
  source: string;
  url: string | null;
  type: "news" | "calendar";
  /** Extra metadata: currency, impact, actual/forecast/previous for calendar */
  meta?: Record<string, string>;
}

export interface AiDiscussRequest {
  context: AiDiscussContext;
  messages: AiMessage[];
  /** Fetch full article text from URL before sending to AI */
  fetchArticle?: boolean;
}

export interface AiDiscussStreamEvent {
  type: "text" | "done" | "error" | "article";
  content: string;
}
