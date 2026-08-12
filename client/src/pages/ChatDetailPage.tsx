import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";

import { TeamBack, TeamShell } from "../components/TeamUI";

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

  const userId = Number(params?.userId);

  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadMessages() {
      try {
        const page = await getMessageHistory(userId);

        const history = [...page.content].reverse();

        setMessages(history);

        history.forEach((message) => {
          if (!message.isRead) {
            markMessageAsRead(message.id).catch(console.error);
          }
        });
      } catch (error) {
        console.error("Mesajlar yüklenemedi:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!isNaN(userId)) {
      loadMessages();
    }
  }, [userId]);

  useEffect(() => {
    connectWebSocket((message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      disconnectWebSocket();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  function handleSend() {
    const content = text.trim();

    if (!content) return;

    try {
      sendMessage(userId, content);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          senderId: 0,
          senderName: "Ben",
          recipientId: userId,
          recipientName: "",
          content,
          timestamp: new Date().toISOString(),
          isRead: false,
        },
      ]);

      setText("");
    } catch (error) {
      console.error("Mesaj gönderilemedi:", error);
    }
  }

  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack href="/chat" />
        <h1>Sohbet</h1>
      </header>

      <section className="chat-messages">
        {loading ? (
          <p>Mesajlar yükleniyor...</p>
        ) : messages.length === 0 ? (
          <p>Henüz mesaj bulunmuyor.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="chat-message"
            >
              <strong>{message.senderName}</strong>

              <p>{message.content}</p>

              <small>
                {new Date(message.timestamp).toLocaleTimeString()}
              </small>
            </div>
          ))
        )}

        <div ref={bottomRef} />
      </section>

      <footer className="chat-input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
          placeholder="Mesaj yaz..."
        />

        <button onClick={handleSend}>
          Gönder
        </button>
      </footer>
    </TeamShell>
  );
}
