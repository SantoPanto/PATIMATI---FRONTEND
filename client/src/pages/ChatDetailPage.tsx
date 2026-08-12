import React, { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";

import { TeamBack, TeamShell } from "../components/TeamUI";
import { useAuth } from "../contexts/AuthContext";

import {
  getMessageHistory,
  markMessageAsRead,
} from "../services/messages";

import {
  connectWebSocket,
  disconnectWebSocket,
  sendMessage,
} from "../services/websocket";

import type { MessageResponse } from "../services/types";

export default function ChatDetailPage() {
  const [, params] = useRoute("/chat/:userId");
  const { user } = useAuth();

  const userId = Number(params?.userId);
  const hasValidUserId = Number.isFinite(userId);
  const currentUserId = Number(user?.id ?? user?.uid);

  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Load conversation history
  useEffect(() => {
    if (!hasValidUserId) return;

    let cancelled = false;

    async function loadMessages() {
      try {
        setLoading(true);
        setError(null);

        const page = await getMessageHistory(userId);

        if (cancelled) return;

        // Backend returns newest first, so display oldest -> newest.
        const history = [...page.content].reverse();

        setMessages(history);

        // Mark received unread messages as read.
        await Promise.allSettled(
          history
            .filter(
              (message) =>
                !message.isRead &&
                message.recipientId === currentUserId,
            )
            .map((message) => markMessageAsRead(message.id)),
        );
      } catch (err) {
        console.error("Mesaj geçmişi yüklenemedi:", err);

        if (!cancelled) {
          setError("Mesajlar yüklenemedi.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, [userId, currentUserId, hasValidUserId]);

  // Connect to STOMP WebSocket
  useEffect(() => {
    if (!hasValidUserId) return;

    try {
      connectWebSocket((message) => {
        /*
         * The WebSocket service subscribes to:
         * /user/queue/messages
         *
         * Only show messages belonging to this conversation.
         */
        const belongsToCurrentChat =
          message.senderId === userId ||
          message.recipientId === userId;

        if (!belongsToCurrentChat) return;

        setMessages((previousMessages) => {
          // Prevent duplicate messages.
          if (
            previousMessages.some(
              (existingMessage) => existingMessage.id === message.id,
            )
          ) {
            return previousMessages;
          }

          return [...previousMessages, message];
        });

        // Mark an incoming message as read.
        if (
          !message.isRead &&
          message.recipientId === currentUserId
        ) {
          void markMessageAsRead(message.id).catch((err) => {
            console.error(
              "Mesaj okundu olarak işaretlenemedi:",
              err,
            );
          });
        }
      });
    } catch (err) {
      console.error("WebSocket bağlantısı kurulamadı:", err);
    }

    return () => {
      disconnectWebSocket();
    };
  }, [userId, currentUserId, hasValidUserId]);

  // Scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  function handleSend() {
    const content = text.trim();

    if (!content || !Number.isFinite(userId)) {
      return;
    }

    try {
      /*
       * Backend expects:
       *
       * {
       *   recipientId: number,
       *   content: string
       * }
       *
       * The backend saves the message and sends the real
       * MessageResponse through WebSocket.
       *
       * Therefore we do NOT create a fake local message here.
       */
      sendMessage(userId, content);

      setText("");
    } catch (err) {
      console.error("Mesaj gönderilemedi:", err);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack href="/chat" />
        <h1>Sohbet</h1>
      </header>

      <section className="chat-messages">
        {!hasValidUserId ? (
          <p>Geçersiz kullanıcı.</p>
        ) : loading ? (
          <p>Mesajlar yükleniyor...</p>
        ) : error ? (
          <p>{error}</p>
        ) : messages.length === 0 ? (
          <p>Henüz mesaj bulunmuyor.</p>
        ) : (
          messages.map((message) => {
            const isMine =
              Number.isFinite(currentUserId) &&
              message.senderId === currentUserId;

            return (
              <article
                key={message.id}
                className={`chat-message ${
                  isMine
                    ? "chat-message--mine"
                    : "chat-message--received"
                }`}
              >
                <strong>
                  {isMine ? "Ben" : message.senderName}
                </strong>

                <p>{message.content}</p>

                <small>
                  {new Date(message.timestamp).toLocaleTimeString(
                    "tr-TR",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </small>
              </article>
            );
          })
        )}

        <div ref={bottomRef} />
      </section>

      <footer className="chat-input">
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Mesaj yaz..."
          maxLength={2000}
          disabled={!Number.isFinite(userId)}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || !Number.isFinite(userId)}
        >
          Gönder
        </button>
      </footer>
    </TeamShell>
  );
}
