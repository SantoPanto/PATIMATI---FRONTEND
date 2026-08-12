import { MessageCirclePlus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

import { TeamLogo, TeamShell } from "../components/TeamUI";
import { getUserList } from "../services/auth";
import type { UserResponseDTO } from "../services/types";

export default function ChatPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await getUserList();
        setUsers(data);
      } catch (error) {
        console.error("Kullanıcılar yüklenemedi:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) return users;

    return users.filter((user) =>
      `${user.firstName} ${user.lastName} ${user.email}`
        .toLowerCase()
        .includes(search)
    );
  }, [query, users]);

  return (
    <TeamShell className="screen">
      <header className="topbar">
        <TeamLogo />
        <button
          className="icon-button"
          aria-label="Yeni sohbet"
        >
          <MessageCirclePlus size={23} />
        </button>
      </header>

      <h1 className="big-title">Sohbetler</h1>

      <label className="search">
        <Search size={24} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sohbet ara..."
        />
      </label>

      <section className="chat-list">
        {loading ? (
          <p>Kullanıcılar yükleniyor...</p>
        ) : filtered.length === 0 ? (
          <p>Kullanıcı bulunamadı.</p>
        ) : (
          filtered.map((user) => (
            <Link
              key={user.uid}
              href={`/chat/${user.uid}`}
            >
              <article className="chat-item">
                <div className="chat-avatar">
                  {user.firstName?.charAt(0).toUpperCase() ?? "?"}
                </div>

                <div>
                  <h2>
                    {user.firstName} {user.lastName}
                  </h2>

                  <p>{user.email}</p>
                </div>
              </article>
            </Link>
          ))
        )}
      </section>
    </TeamShell>
  );
}
