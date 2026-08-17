import { useEffect, useState } from "react";
import { CheckCircle2, Trash2, Ban, MessageSquare } from "lucide-react";
import { TeamBack, TeamShell } from "../components/TeamUI";
import {
  getAdminAdComplaints,
  getAdminAdoptionComplaints,
  getAdminUserComplaints,
  deleteComplaint,
  suspendAd,
  createAdminChatRoom,
} from "../services/admin";
import type { ComplaintResponse } from "../services/types";
import { getUserErrorMessage } from "../utils/errorMessage";

type AdminComplaint = ComplaintResponse & {
  title: string;
};

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<AdminComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchComplaints = () => {
    setLoading(true);
    Promise.all([
      getAdminAdComplaints({ page: 0, size: 50 }),
      getAdminUserComplaints({ page: 0, size: 50 }),
      getAdminAdoptionComplaints({ page: 0, size: 50 }),
    ])
      .then(([adComplaints, userComplaints, adoptionComplaints]) => {
        const ads: AdminComplaint[] = adComplaints.content.map((item) => ({
          ...item,
          title: item.adTitle || `İlan #${item.reportedAdId ?? "-"}`,
        }));

        const users: AdminComplaint[] = userComplaints.content.map((item) => ({
          ...item,
          title:
            item.reportedUserEmail ||
            `Kullanıcı #${item.reportedUserId ?? "-"}`,
        }));

        const adoptions: AdminComplaint[] =
          adoptionComplaints.content.map((item) => ({
            ...item,
            title:
              item.adoptionTitle ||
              `Sahiplendirme #${item.reportedAdId ?? "-"}`,
          }));

        setComplaints([...ads, ...users, ...adoptions]);
      })
      .catch((err) => {
        setError(
          getUserErrorMessage(err, "Şikayetler yüklenemedi."),
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Şikayeti silme / kaldırma
  const handleDeleteComplaint = async (complaintId: number) => {
    if (!window.confirm("Bu şikayeti silmek/kaldırmak istediğinize emin misiniz?")) return;
    try {
      setActionLoadingId(complaintId);
      await deleteComplaint(complaintId);
      setComplaints((prev) => prev.filter((c) => c.id !== complaintId));
    } catch (err) {
      alert(getUserErrorMessage(err, "Şikayet silinemedi."));
    } finally {
      setActionLoadingId(null);
    }
  };

  // İlanı askıya alma
  const handleSuspendAd = async (adId?: number) => {
    if (!adId) return;
    if (!window.confirm("Bu ilanı askıya almak istediğinize emin misiniz?")) return;
    try {
      await suspendAd(adId);
      alert("İlan başarıyla askıya alındı.");
    } catch (err) {
      alert(getUserErrorMessage(err, "İlan askıya alınamadı."));
    }
  };

  // Kullanıcı ile admin sohbeti başlatma
  const handleStartChat = async (userId?: number) => {
    if (!userId) return;
    try {
      const res = await createAdminChatRoom(userId);
      const chatId = res?.chatId || res?.roomId || res?.id;
      if (chatId) {
        window.location.href = `/chats/${chatId}`;
      } else {
        window.location.href = `/chats`;
      }
    } catch (err) {
      alert(getUserErrorMessage(err, "Sohbet odası oluşturulamadı."));
    }
  };

  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack href="/admin" />
        <h1>Şikayet Yönetimi</h1>
      </header>

      <section className="card-stack">
        {loading && <p className="muted">Şikayetler yükleniyor...</p>}

        {error && <p className="muted">{error}</p>}

        {!loading && !error && complaints.length === 0 && (
          <p className="muted">Şikayet bulunamadı.</p>
        )}

        {complaints.map((item) => (
          <article key={item.id} className="content-card">
            <div className="content-card__top">
              <div className="pill pill--warning">{item.status}</div>

              <span className="muted">
                {new Date(item.createdAt).toLocaleDateString("tr-TR")}
              </span>
            </div>

            <h3>{item.title}</h3>

            <p>{item.description}</p>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
              {/* Şikayeti Sil / Kaldır */}
              <button
                className="button button--outline"
                type="button"
                onClick={() => handleDeleteComplaint(item.id)}
                disabled={actionLoadingId === item.id}
              >
                <Trash2 size={16} />
                Şikayeti Kaldır
              </button>

              {/* İlan şikayetiyse Askıya Al */}
              {item.reportedAdId && (
                <button
                  className="button button--outline"
                  type="button"
                  onClick={() => handleSuspendAd(item.reportedAdId)}
                >
                  <Ban size={16} />
                  İlanı Askıya Al
                </button>
              )}

              {/* Kullanıcı ile Sohbet Başlat (Şikayet eden veya edilen üzerinden) */}
              {item.reportedUserId && (
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => handleStartChat(item.reportedUserId)}
                >
                  <MessageSquare size={16} />
                  Kullanıcıyla Sohbet Et
                </button>
              )}
            </div>
          </article>
        ))}
      </section>
    </TeamShell>
  );
}