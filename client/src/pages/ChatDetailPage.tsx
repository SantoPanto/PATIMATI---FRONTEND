import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";

import { TeamBack, TeamShell } from "../components/TeamUI";

import { getMessageHistory } from "../services/messages";
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

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadMessages() {
      const page = await getMessageHistory(userId);

      setMessages(page.content.reverse());
    }

    loadMessages();
  }, [userId]);

  useEffect(() => {
    const client = connectWebSocket((message) => {
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
    if (!text.trim()) return;

    sendMessage(userId, text);

    setText("");
  }

  return (
    <TeamShell>

      <header className="center-header">
        <TeamBack href="/chat" />
        <h1>Sohbet</h1>
      </header>

      <div className="chat-messages">

        {messages.map((message) => (
          <div key={message.id}>
            {message.content}
          </div>
        ))}

        <div ref={bottomRef} />

      </div>

      <footer className="chat-input">

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mesaj yaz..."
        />

        <button onClick={handleSend}>
          Gönder
        </button>

      </footer>

    </TeamShell>
  );
}
