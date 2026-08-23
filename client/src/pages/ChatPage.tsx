import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import {
  AlertCircle,
  Check,
  CheckCheck,
  Flag,
  Loader2,
  MessageSquare,
  MessageSquareOff,
  Send,
  User,
} from "lucide-react";

import Header from "../components/Header";
import ReportUserModal from "../components/ReportUserModal";
import { useAuth } from "../contexts/AuthContext";
import { useChatWebSocket } from "../hooks/useChatWebSocket";
import {
  createOrGetChatRoom,
  getChatRooms,
  getMessageHistory,
  getUserStatus,
  markMessageAsRead,
} from "../services/messages";
import type { ChatRoomResponse, MessageResponse, UserStatusEvent, UserStatusResponse } from "../services/types";

interface ChatContact {
  userId: number;
  userName: string;
  lastMessage?: string;
  lastTimestamp?: string;
  unreadCount?: number;
}

export default function ChatPage() {
  const [, params] = useRoute("/chat/:userId");
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const currentUserId = Number(user?.id ?? user?.uid);
  const activeUserId = params?.userId ? Number(params.userId) : null;

  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [text, setText] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatusResponse | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeUserIdRef = useRef<number | null>(activeUserId);
  const currentUserIdRef = useRef<number>(currentUserId);
  const initialScrollDoneRef = useRef(false);

  useEffect(() => {
    activeUserIdRef.current = activeUserId;
  }, [activeUserId]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    initialScrollDoneRef.current = false;
  }, [activeUserId]);

  // Helper to format last seen timestamp
  const formatLastSeen = useCallback((lastSeenStr?: string | null): string => {
    if (!lastSeenStr) return "Çevrim dışı";
    try {
      const date = new Date(lastSeenStr);
      if (isNaN(date.getTime())) return "Çevrim dışı";
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const timePart = date.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return isToday
        ? `Bugün ${timePart}`
        : date.toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          });
    } catch {
      return "Çevrim dışı";
    }
  }, []);

  // Helper to upsert a contact room in contacts list
  const upsertContact = useCallback(
    (contactUserId: number, contactName: string, lastMsg: string, timestamp: string) => {
      setContacts((prev) => {
        const index = prev.findIndex((c) => c.userId === contactUserId);
        const resolvedName =
          contactName && !contactName.startsWith("Kullanıcı #")
            ? contactName
            : index >= 0 && prev[index].userName && !prev[index].userName.startsWith("Kullanıcı #")
            ? prev[index].userName
            : contactName || `Kullanıcı #${contactUserId}`;

        if (index >= 0) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            userName: resolvedName,
            lastMessage: lastMsg || updated[index].lastMessage,
            lastTimestamp: timestamp || updated[index].lastTimestamp,
          };
          // Move active contact room to top of list
          const [moved] = updated.splice(index, 1);
          return [moved, ...updated];
        }
        return [
          {
            userId: contactUserId,
            userName: resolvedName,
            lastMessage: lastMsg,
            lastTimestamp: timestamp,
          },
          ...prev,
        ];
      });
    },
    [],
  );

  // 3. WebSocket incoming message handler
  const handleIncomingMessage = useCallback(
    (incomingMessage: MessageResponse) => {
      const senderId = Number(incomingMessage.senderId);
      const recipientId = Number(incomingMessage.recipientId);
      const currentId = currentUserIdRef.current;
      const activeId = activeUserIdRef.current;

      const otherId = senderId === currentId ? recipientId : senderId;
      const otherName =
        senderId === currentId
          ? incomingMessage.recipientName
          : incomingMessage.senderName;

      // Update contacts sidebar room list
      upsertContact(
        otherId,
        otherName,
        incomingMessage.content,
        incomingMessage.timestamp,
      );

      // If incoming message belongs to active chat, append to messages state
      if (activeId && (senderId === activeId || recipientId === activeId)) {
        console.log(`[CHAT INCOMING] activeUserId=${activeId}, senderId=${senderId}, messageId=${incomingMessage.id}, content="${incomingMessage.content}"`);
        setMessages((prev) => {
          console.log(`[CHAT SETMESSAGES] Source=INCOMING_WS, activeUserId=${activeId}, incomingId=${incomingMessage.id}, prevLength=${prev.length}`);
          // If exact ID exists, ignore duplicate
          if (prev.some((m) => Number(m.id) === Number(incomingMessage.id))) {
            console.log(`[CHAT SETMESSAGES] Message id=${incomingMessage.id} already exists in state, ignoring duplicate.`);
            return prev;
          }

          // Replace matching optimistic message if present (ONLY if m.isOptimistic === true)
          const optIndex = prev.findIndex(
            (m) =>
              m.isOptimistic === true &&
              Number(m.senderId) === senderId &&
              Number(m.recipientId) === recipientId &&
              m.content === incomingMessage.content,
          );

          if (optIndex !== -1) {
            console.log(`[CHAT SETMESSAGES] Replacing optimistic message at index ${optIndex} with real message id=${incomingMessage.id}`);
            const updated = [...prev];
            updated[optIndex] = incomingMessage;
            return updated;
          }

          console.log(`[CHAT SETMESSAGES] Appending new message id=${incomingMessage.id} to state. New length: ${prev.length + 1}`);
          return [...prev, incomingMessage];
        });

        // Mark as read if received from active partner
        if (senderId === activeId && !incomingMessage.isRead) {
          void markMessageAsRead(incomingMessage.id).catch(console.error);
        }
      } else if (senderId !== currentId) {
        console.log(`[CHAT INCOMING] Message from non-active partner (${otherName}): content="${incomingMessage.content}"`);
        setToastMessage(`${otherName}: ${incomingMessage.content}`);
        setTimeout(() => setToastMessage(null), 4000);
      }
    },
    [upsertContact],
  );

  // Real-time STOMP status event handler for /topic/user-status
  const handleUserStatusUpdate = useCallback(
    (event: UserStatusEvent) => {
      const activeId = activeUserIdRef.current;
      if (activeId && Number(event.userId) === Number(activeId)) {
        const isOnline =
          event.online === true ||
          event.status?.toUpperCase() === "ONLINE";
        setUserStatus({
          userId: Number(event.userId),
          online: isOnline,
          status: isOnline ? "ONLINE" : "OFFLINE",
          lastSeen: event.lastSeen ?? null,
        });
      }
    },
    [],
  );

  // Encapsulated Custom Hook for WebSocket status, messaging, and online status topic subscription
  const { status: wsStatus, sendMessage: sendStompMessage } = useChatWebSocket(
    handleIncomingMessage,
    handleUserStatusUpdate,
  );

  // Fetch initial online status for active partner via GET /api/users/{userId}/status
  useEffect(() => {
    if (!activeUserId || !Number.isFinite(activeUserId)) {
      setUserStatus(null);
      return;
    }

    const targetUserId = activeUserId;
    let isMounted = true;

    async function fetchUserStatus() {
      try {
        const statusData = await getUserStatus(targetUserId);
        if (isMounted) {
          setUserStatus(statusData);
        }
      } catch (err) {
        console.error("Kullanıcı durumu alınamadı:", err);
      }
    }

    void fetchUserStatus();

    return () => {
      isMounted = false;
    };
  }, [activeUserId]);

  // 1. Oda Listesi Fetch İşlemi (GET /api/messages/rooms)
  useEffect(() => {
    if (!currentUserId || !Number.isFinite(currentUserId)) return;

    let isMounted = true;

    async function fetchRooms() {
      try {
        setLoadingRooms(true);
        const roomsData: ChatRoomResponse[] = await getChatRooms();

        if (!isMounted) return;

        const formattedContacts: ChatContact[] = (roomsData || []).map((room) => ({
          userId: room.partnerId,
          userName: room.partnerName || `Kullanıcı #${room.partnerId}`,
          lastMessage: room.lastMessage || "",
          lastTimestamp: room.lastMessageTimestamp || "",
          unreadCount: room.unreadCount || 0,
        }));

        setContacts(formattedContacts);
      } catch (err) {
        console.error("Sohbet odaları yüklenemedi:", err);
      } finally {
        if (isMounted) setLoadingRooms(false);
      }
    }

    void fetchRooms();

    return () => {
      isMounted = false;
    };
  }, [currentUserId]);

  // 1. Oda Listesi Fetch İşlemi (GET /api/messages/rooms)
  useEffect(() => {
    if (!activeUserId || !Number.isFinite(activeUserId)) {
      setMessages([]);
      return;
    }

    const currentActiveUserId = activeUserId;
    let cancelled = false;

    // Self-chat guard
    if (currentUserId && Number(currentUserId) === Number(currentActiveUserId)) {
      setError("Kendinizle sohbet odası oluşturamazsınız.");
      setMessages([]);
      return;
    }

    async function loadChatHistory() {
      try {
        setLoadingHistory(true);
        setError(null);

        // Ensure room is created/fetched via POST /api/messages/rooms/{partnerId}
        const room = await createOrGetChatRoom(currentActiveUserId);
        if (cancelled) return;

        if (room.partnerName) {
          upsertContact(currentActiveUserId, room.partnerName, "", "");
        }

        const page = await getMessageHistory(currentActiveUserId, {
          page: 0,
          size: 50,
        });

        if (cancelled) return;

        // 2. Mesaj Sıralaması: Timestamp bazlı kronolojik sıralama (Eskiler üstte, yeniler en altta)
        const sortedHistory = [...page.content].sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );

        console.log(`[CHAT HISTORY LOAD] activeUserId=${currentActiveUserId}, loadedCount=${sortedHistory.length}`);
        setMessages(sortedHistory);

        // Add or update active partner in contacts list
        if (sortedHistory.length > 0) {
          const last = sortedHistory[sortedHistory.length - 1];
          const otherName =
            last.senderId === currentUserId
              ? last.recipientName
              : last.senderName;
          upsertContact(
            currentActiveUserId,
            otherName,
            last.content,
            last.timestamp,
          );
        } else {
          upsertContact(currentActiveUserId, room.partnerName || "", "", "");
        }

        // Mark unread messages as read
        const unreadMsgs = sortedHistory.filter(
          (m) => !m.isRead && m.senderId === currentActiveUserId,
        );
        await Promise.allSettled(unreadMsgs.map((m) => markMessageAsRead(m.id)));
      } catch (err) {
        console.error("Mesaj geçmişi yüklenemedi:", err);
        if (!cancelled) {
          setError("Mesaj geçmişi yüklenemedi.");
        }
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    }

    void loadChatHistory();

    return () => {
      cancelled = true;
    };
  }, [activeUserId, currentUserId, upsertContact]);

  // Initial & updates auto-scroll logic
  useEffect(() => {
    if (messages.length > 0) {
      const isInitial = !initialScrollDoneRef.current;
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: isInitial ? "auto" : "smooth",
          block: "end",
        });
        if (isInitial) {
          initialScrollDoneRef.current = true;
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [messages, activeUserId]);

  // Determine active contact partner name dynamically
  const activeContact = contacts.find((c) => c.userId === activeUserId);
  const activePartnerName =
    activeContact?.userName && !activeContact.userName.startsWith("Kullanıcı #")
      ? activeContact.userName
      : messages.length > 0
      ? messages[0].senderId === currentUserId
        ? messages[0].recipientName
        : messages[0].senderName
      : activeContact?.userName || `Kullanıcı #${activeUserId}`;

  // Always sync refs during render for immediate availability
  activeUserIdRef.current = activeUserId;
  currentUserIdRef.current = currentUserId;

  // Send message via WebSocket with Optimistic UI update (Instant state update)
  const handleSend = () => {
    const content = text.trim();
    const targetUserId = activeUserId ?? activeUserIdRef.current;

    if (!content) {
      console.warn("Gönderim iptal edildi: Mesaj içeriği boş.");
      return;
    }
    if (!targetUserId || !Number.isFinite(targetUserId)) {
      console.warn("Gönderim iptal edildi: Alıcı kullanıcı ID tanımlı değil.", {
        activeUserId,
        refUserId: activeUserIdRef.current,
      });
      return;
    }

    // Optimistic message object for instant UI reactivity
    const optimisticMsg: MessageResponse = {
      id: Date.now(),
      senderId: currentUserId,
      senderName: user?.firstName
        ? `${user.firstName} ${user.lastName || ""}`.trim()
        : "Ben",
      recipientId: targetUserId,
      recipientName: activePartnerName,
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
      isOptimistic: true,
    };

    // Instant UI State Update (Reaktivite & F5 Çözümü)
    console.log(`[CHAT HANDLE SEND] activeUserId=${targetUserId}, optimisticId=${optimisticMsg.id}, content="${content}"`);
    setMessages((prev) => [...prev, optimisticMsg]);
    upsertContact(
      targetUserId,
      activePartnerName,
      content,
      optimisticMsg.timestamp,
    );
    setText("");

    try {
      sendStompMessage(targetUserId, content);
    } catch (err) {
      console.error("Mesaj gönderilirken WebSocket hatası oluştu:", err);
      setError("Mesaj gönderilirken bağlantı hatası oluştu.");
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Connection status badge
  const getStatusBadge = () => {
    switch (wsStatus) {
      case "CONNECTED":
        return {
          label: "Canlı",
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dotClass: "bg-emerald-500",
        };
      case "CONNECTING":
        return {
          label: "Bağlanıyor...",
          badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
          dotClass: "bg-amber-500 animate-pulse",
        };
      case "ERROR":
        return {
          label: "Bağlantı Hatası",
          badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
          dotClass: "bg-rose-500",
        };
      default:
        return {
          label: "Bağlantı Kesildi",
          badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
          dotClass: "bg-slate-400",
        };
    }
  };

  const { label: wsLabel, badgeClass: wsBadgeClass, dotClass: wsDotClass } =
    getStatusBadge();

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col h-[calc(100vh-80px)] min-h-0 overflow-hidden">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md flex-1 min-h-0 h-full overflow-hidden flex flex-col md:flex-row">
          {/* Left Contacts / Rooms Sidebar */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-slate-100 flex flex-col bg-slate-50/50 min-h-0 h-full overflow-hidden ${
              activeUserId ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Sidebar Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <MessageSquare size={20} />
                </span>
                <h1 className="text-lg font-extrabold text-slate-900">
                  Mesajlarım
                </h1>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border ${wsBadgeClass}`}
              >
                <span className={`w-2 h-2 rounded-full ${wsDotClass}`} />
                <span>{wsLabel}</span>
              </span>
            </div>

            {/* Contacts / Chat Rooms List */}
            <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-100/80">
              {loadingRooms ? (
                <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin text-blue-600" />
                  <span className="text-sm font-medium">Odalar yükleniyor...</span>
                </div>
              ) : contacts.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <MessageSquareOff size={36} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-slate-600">
                    Henüz sohbetiniz yok
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    İlan detay sayfalarından kullanıcılarla sohbet başlatabilirsiniz.
                  </p>
                </div>
              ) : (
                contacts.map((c) => {
                  const isActive = c.userId === activeUserId;
                  return (
                    <button
                      type="button"
                      key={c.userId}
                      onClick={() => navigate(`/chat/${c.userId}`)}
                      className={`w-full p-4 flex items-start gap-3 text-left transition-all ${
                        isActive
                          ? "bg-blue-50/80 border-l-4 border-blue-600"
                          : "hover:bg-slate-100/80 bg-white md:bg-transparent"
                      }`}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 font-extrabold text-blue-700">
                        {c.userName ? c.userName.charAt(0).toUpperCase() : "U"}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {c.userName || `Kullanıcı #${c.userId}`}
                          </h3>
                          {c.lastTimestamp && (
                            <span className="text-[11px] font-medium text-slate-400 shrink-0">
                              {new Date(c.lastTimestamp).toLocaleTimeString(
                                "tr-TR",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-medium text-slate-500 truncate">
                          {c.lastMessage || "Sohbeti görüntülemek için tıklayın"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Active Chat Window */}
          <div
            className={`flex-1 flex flex-col bg-white min-h-0 h-full overflow-hidden ${
              !activeUserId ? "hidden md:flex" : "flex"
            }`}
          >
            {activeUserId ? (
              <>
                {/* Active Chat Header */}
                <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => navigate("/chat")}
                      className="md:hidden p-2 text-slate-500 hover:text-slate-900"
                    >
                      &larr;
                    </button>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 font-bold text-white shadow-xs">
                      <User size={20} />
                    </span>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">
                        {activePartnerName}
                      </h2>
                      {userStatus?.online ? (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Çevrim içi
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          {userStatus?.lastSeen
                            ? `Son görülme ${formatLastSeen(userStatus.lastSeen)}`
                            : "Çevrim dışı"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Report User Button */}
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/60 hover:border-rose-300 transition-all shadow-2xs"
                    title="Kullanıcıyı Şikayet Et"
                  >
                    <Flag size={14} />
                    <span>Şikayet Et</span>
                  </button>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto min-h-0 space-y-4 bg-slate-50/30">
                  {loadingHistory ? (
                    <div className="h-full flex items-center justify-center text-slate-400 gap-2">
                      <Loader2 size={24} className="animate-spin text-blue-600" />
                      <span className="text-sm font-medium">
                        Mesaj geçmişi yükleniyor...
                      </span>
                    </div>
                  ) : error ? (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-2xl flex items-center gap-2">
                      <AlertCircle size={18} />
                      <span>{error}</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                      <MessageSquare size={40} className="mb-2 opacity-40" />
                      <p className="text-sm font-bold text-slate-700">
                        Henüz mesajınız yok
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Aşağıdaki alandan ilk mesajınızı yazıp gönderebilirsiniz.
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMine = m.senderId === currentUserId;
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${
                            isMine ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] sm:max-w-[70%] px-4 py-3 rounded-2xl text-sm font-medium shadow-xs ${
                              isMine
                                ? "bg-blue-600 text-white rounded-br-none"
                                : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words leading-relaxed">
                              {m.content}
                            </p>
                            <div
                              className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${
                                isMine ? "text-blue-100" : "text-slate-400"
                              }`}
                            >
                              <span>
                                {new Date(m.timestamp).toLocaleTimeString(
                                  "tr-TR",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>
                              {isMine &&
                                (m.isRead ? (
                                  <CheckCheck size={14} className="text-blue-200" />
                                ) : (
                                  <Check size={14} className="text-blue-200/80" />
                                ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {/* Anchor element for auto-scroll */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Bar */}
                <form
                  onSubmit={handleFormSubmit}
                  className="p-4 border-t border-slate-100 bg-white shrink-0"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Bir mesaj yazın..."
                      maxLength={2000}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all"
                    />

                    <button
                      type="submit"
                      disabled={!text.trim()}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-all shrink-0 shadow-md shadow-blue-600/20"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-4">
                  <MessageSquare size={32} />
                </div>
                <h2 className="text-xl font-extrabold text-slate-800">
                  Sohbet Başlatın
                </h2>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">
                  Sol taraftaki kişilerden birini seçin veya ilan detay sayfalarından doğrudan mesaj gönderin.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Report User Modal */}

      {/* Report User Modal */}
      {activeUserId && (
        <ReportUserModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          reportedUserId={activeUserId}
          reportedUserName={activePartnerName}
          onSuccess={() => {
            setToastMessage("Kullanıcı başarıyla şikayet edildi.");
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[300] flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-xl animate-in slide-in-from-bottom-5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
