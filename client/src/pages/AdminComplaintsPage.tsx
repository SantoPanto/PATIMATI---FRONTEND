import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Trash2, Ban, MessageSquare, CheckCircle } from "lucide-react";
import { TeamBack, TeamShell } from "../components/TeamUI";
import { resolveAdoptionComplaint } from "../services/complaints";
import {
  getAdminAdComplaints,
  getAdminAdoptionComplaints,
  getAdminUserComplaints,
  deleteComplaint,
  suspendAd,
} from "../services/admin";
import type {
  AdComplaintAdminResponse,
  AdoptionComplaintAdminResponse,
  UserComplaintAdminResponse,
} from "../services/types";
import { getUserErrorMessage } from "../utils/errorMessage";

/**
 * Üç ayrı uçtan gelen şikayetler tek listede gösteriliyor ama alanları
 * FARKLI: ilan/sahiplendirme kaydında `adId`+`adTitle`, kullanıcı kaydında
 * `reportedUserId` var. Eskiden hepsi tek bir tipe eziliyordu ve ekran
 * ikisinde de olmayan `reportedAdId`'yi okuyordu.
 *
 * `tur` alanı ayırt edici: hangi düğmenin çizileceğine tip düzeyinde karar
 * verilebiliyor, "alan var mı" tahminine gerek kalmıyor.
 */
type AdminComplaint =
  | ({ tur: "ilan"; title: string } & AdComplaintAdminResponse)
  | ({ tur: "sahiplendirme"; title: string } & AdoptionComplaintAdminResponse)
  | ({ tur: "kullanici"; title: string } & UserComplaintAdminResponse);

export default function AdminComplaintsPage() {
  const [, navigate] = useLocation();
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
          tur: "ilan",
          title: item.adTitle || `İlan #${item.adId}`,
        }));

        const users: AdminComplaint[] = userComplaints.content.map((item) => ({
          ...item,
          tur: "kullanici",
          title:
            item.reportedUserFullName ||
            item.reportedUserEmail ||
            `Kullanıcı #${item.reportedUserId}`,
        }));

        const adoptions: AdminComplaint[] =
          adoptionComplaints.content.map((item) => ({
            ...item,
            tur: "sahiplendirme",
            title: item.adTitle || `Sahiplendirme #${item.adId}`,
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

  // Şikayeti Çözme (Sahiplendirme Şikayeti)
  const handleResolveComplaint = async (complaintId: number) => {
    // Optimistic UI güncellemesi: Yerel state'teki statüyü anında COZULDU yap
    const previousComplaints = complaints;
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === complaintId ? { ...c, status: "COZULDU" } : c,
      ),
    );

    try {
      setActionLoadingId(complaintId);
      await resolveAdoptionComplaint(complaintId);
    } catch (err) {
      // Hata durumunda yerel state'i eski haline getir ve kullanıcıyı bilgilendir
      setComplaints(previousComplaints);
      alert(getUserErrorMessage(err, "Şikayet çözülürken bir hata oluştu."));
    } finally {
      setActionLoadingId(null);
    }
  };

  /**
   * Kullanıcı ile yönetici sohbetini açar.
   *
   * Eskiden `POST /api/admin/chats/create-with-user/{userId}` çağrılıyordu —
   * backend'de böyle bir uç HİÇ YOK (`/api/admin` altında 10 uç var, hiçbiri
   * sohbet değil). Sonra `/chats/{chatId}` adresine gidiliyordu; öyle bir rota
   * da yok (rota `/chat/:userId`, TEKİL ve KULLANICI kimliğiyle) ⇒ düğme iki
   * kere birden 404'e düşüyordu.
   *
   * Ayrı bir uca gerek yok: `/chat/:userId` ekranı odayı kendisi açıyor
   * (`POST /api/messages/rooms/{partnerId}`). Yöneticinin o çağrıyı
   * yapabilmesi için gereken ADMIN muafiyeti backend PR'ında eklendi.
   */
  const handleStartChat = (userId: number) => {
    navigate(`/chat/${userId}`);
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

              {/* Sahiplendirme şikayetleri için Çözüldü yapma butonu */}
              {item.tur === "sahiplendirme" && item.status !== "COZULDU" && (
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => handleResolveComplaint(item.id)}
                  disabled={actionLoadingId === item.id}
                >
                  <CheckCircle size={16} />
                  Şikayeti Çöz
                </button>
              )}

              {/* İlan ya da sahiplendirme şikayetiyse Askıya Al.
                  Sahiplendirme ilanları da `ads` tablosunda (V13 göçündeki
                  yabancı anahtar oraya bakıyor), aynı uç ikisini de askıya alır. */}
              {item.tur !== "kullanici" && (
                <button
                  className="button button--outline"
                  type="button"
                  onClick={() => handleSuspendAd(item.adId)}
                >
                  <Ban size={16} />
                  İlanı Askıya Al
                </button>
              )}

              {/* Kullanıcı şikayetiyse şikayet edilen kişiyle sohbet */}
              {item.tur === "kullanici" && (
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