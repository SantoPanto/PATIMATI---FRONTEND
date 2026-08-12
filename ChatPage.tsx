import { MessageCirclePlus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { TeamLogo, TeamShell } from "../components/TeamUI";
import { useEffect } from "react";
import { Link } from "wouter";
import { getUserList } from "../services/auth";
import type { UserResponseDTO } from "../services/types";

export default function ChatPage() {
const [query, setQuery] = useState("");
const [users, setUsers] = useState<UserResponseDTO[]>([]);
 useEffect(() => {
    async function loadUsers() {
      try {
        const data = await getUserList();
        setUsers(data);
      } catch (err) {
        console.error(err);
      }
    }

    loadUsers();
  }, []);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return chatThreads;
    return chatThreads.filter((thread) => `${thread.name} ${thread.preview}`.toLowerCase().includes(search));
  }, [query]);

  return (
    <TeamShell className="screen">
      <header className="topbar">
        <TeamLogo />
        <button className="icon-button" aria-label="Yeni sohbet"><MessageCirclePlus size={23} /></button>
      </header>
      <h1 className="big-title">Sohbetler</h1>
      <label className="search">
        <Search size={24} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sohbet ara..." />
      </label>

      <section className="chat-list">
        {filtered.map((thread) => (
          <article key={thread.id}>
            <img src={thread.image} alt={thread.name} />
            <div>
              <h2>{thread.name}</h2>
              <h3>{thread.role}</h3>
              <p>{thread.preview}</p>
            </div>
            <aside>
              <span>{thread.time}</span>
              {thread.unread > 0 ? <b>{thread.unread}</b> : null}
            </aside>
          </article>
        ))}
      </section>
    </TeamShell>
  );
}
