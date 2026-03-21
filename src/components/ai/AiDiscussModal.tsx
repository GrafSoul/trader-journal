import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Markdown from "react-markdown";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Textarea,
} from "@heroui/react";
import { Bot, Send, Trash2, Download } from "lucide-react";
import type { AiDiscussContext, AiMessage } from "@/types/ai";
import { streamAiDiscuss } from "@/services/aiService";

// ==================== PROPS ====================
interface AiDiscussModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: AiDiscussContext;
}

// ==================== COMPONENT ====================
export const AiDiscussModal = ({
  isOpen,
  onClose,
  context,
}: AiDiscussModalProps) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [articleLoaded, setArticleLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Reset state when modal opens with new context
  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setInput("");
      setStreamingText("");
      setArticleLoaded(false);
      setError(null);
    }
  }, [isOpen, context.title]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || isLoading) return;

      const newUserMsg: AiMessage = { role: "user", content: userMessage.trim() };
      const updatedMessages = [...messages, newUserMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);
      setStreamingText("");
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      let accumulated = "";

      try {
        await streamAiDiscuss(
          {
            context,
            messages: updatedMessages,
            fetchArticle: !articleLoaded && !!context.url,
          },
          (event) => {
            switch (event.type) {
              case "text":
                accumulated += event.content;
                setStreamingText(accumulated);
                break;
              case "article":
                setArticleLoaded(true);
                break;
              case "error":
                setError(event.content);
                setIsLoading(false);
                break;
              case "done":
                if (accumulated) {
                  setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: accumulated },
                  ]);
                }
                setStreamingText("");
                setIsLoading(false);
                break;
            }
          },
          controller.signal
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsLoading(false);
      }
    },
    [messages, isLoading, context, articleLoaded]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const handleClose = () => {
    abortRef.current?.abort();
    onClose();
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setStreamingText("");
    setError(null);
    setIsLoading(false);
    setArticleLoaded(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[85vh]",
        body: "p-0",
      }}>
      <ModalContent>
        <ModalHeader className="flex items-center gap-2 border-b border-divider pb-3">
          <Bot size={20} className="text-primary" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">
              {t("ai.discussTitle")}
            </div>
            <div className="truncate text-xs font-normal text-default-400">
              {context.title}
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="mr-6"
              onPress={clearChat}
              aria-label={t("ai.clearChat")}>
              <Trash2 size={16} />
            </Button>
          )}
        </ModalHeader>

        <ModalBody>
          <div className="flex flex-col gap-3 p-4" style={{ minHeight: "300px" }}>
            {/* Context card */}
            <div className="rounded-lg border border-divider bg-content2/50 p-3">
              <div className="text-xs font-medium text-default-400">
                {context.type === "news" ? t("ai.newsContext") : t("ai.calendarContext")}
              </div>
              <div className="mt-1 text-sm font-semibold">{context.title}</div>
              {context.description && (
                <div className="mt-1 line-clamp-3 text-xs text-default-500">
                  {context.description}
                </div>
              )}
              <div className="mt-1 text-xs text-primary">{context.source}</div>
              {context.meta && Object.keys(context.meta).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(context.meta).map(([key, value]) => (
                    <span
                      key={key}
                      className="rounded bg-content3 px-2 py-0.5 text-xs text-default-500">
                      {key}: {value}
                    </span>
                  ))}
                </div>
              )}
              {context.url && (
                <div className="mt-1 flex items-center gap-1 text-xs text-default-400">
                  <Download size={10} />
                  {articleLoaded
                    ? t("ai.articleLoaded")
                    : t("ai.articleWillLoad")}
                </div>
              )}
            </div>

            {/* Quick action buttons — always visible when not loading */}
            {!isLoading && (
              <div className="grid grid-cols-3 gap-2">
                {[t("ai.quickTranslate"), t("ai.quickImpact"), t("ai.quickSummary")].map(
                  (hint) => (
                    <Button
                      key={hint}
                      size="sm"
                      variant="flat"
                      className="w-full"
                      onPress={() => void sendMessage(hint)}>
                      {hint}
                    </Button>
                  )
                )}
              </div>
            )}

            {/* Empty state hint */}
            {messages.length === 0 && !streamingText && !isLoading && (
              <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
                <Bot size={32} className="text-default-300" />
                <p className="text-sm text-default-400">{t("ai.emptyHint")}</p>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-content2 text-foreground"
                  }`}>
                  {msg.role === "user" ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div className="ai-markdown">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming response */}
            {streamingText && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-xl bg-content2 px-4 py-2.5 text-sm leading-relaxed">
                  <div className="ai-markdown">
                    <Markdown>{streamingText}</Markdown>
                  </div>
                  <span className="inline-block h-4 w-1 animate-pulse bg-primary" />
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && !streamingText && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-xl bg-content2 px-4 py-2.5">
                  <Spinner size="sm" />
                  <span className="text-xs text-default-400">
                    {t("ai.thinking")}
                  </span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ModalBody>

        <ModalFooter className="border-t border-divider">
          <div className="flex w-full gap-2">
            <Textarea
              value={input}
              onValueChange={setInput}
              onKeyDown={handleKeyDown}
              placeholder={t("ai.inputPlaceholder")}
              minRows={1}
              maxRows={4}
              className="flex-1"
              isDisabled={isLoading}
              autoFocus
            />
            <Button
              isIconOnly
              color="primary"
              isDisabled={!input.trim() || isLoading}
              onPress={() => void sendMessage(input)}
              aria-label={t("ai.send")}>
              <Send size={18} />
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
