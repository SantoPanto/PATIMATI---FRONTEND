import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Trash2, Ban, MessageSquare, CheckCircle } from "lucide-react";
import { TeamBack, TeamShell } from "../components/TeamUI";
import AdminFilterBar from "../components/admin/AdminFilterBar";
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
import { translateEnum } from "../utils/enumTranslator";

type AdminComplaint =
  | ({ tur: "ilan"; title: string } & AdComplaintAdminResponse)
  | ({ tur: "sahiplendirme"; title: string } & AdoptionComplaintAdminResponse)
  | ({ tur: "kullanici"; title: string } & UserComplaintAdminResponse);

type ComplaintTab = "all" | "ads" | "users" | "adoptions";

export default function AdminComplaintsPage() {
  const [, navigate] = useLocation();
  const [complaints, setComplaints] = useState<AdminComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("createdAt,desc");
  const [activeTab, setActiveTab] = useState<ComplaintTab>("all");
  const [page, setPage] = useState(0);

  const fetchComplaints = useCallback(() => {
    setLoading(true);
    setError("");

    const params = {
      page,
      size: 50,
      search: searchQuery,
      sort: sortOrder,
    };

    const promises = [
      activeTab === "all" || activeTab === "ads"
        ? getAdminAdComplaints(params)
        : Promise.resolve({ content: [] }),
      activeTab === "all" || activeTab === "users"
        ? getAdminUserComplaints(params)
        : Promise.resolve({ content: [] }),
      activeTab === "all" || activeTab === "adoptions"
        ? getAdminAdoptionComplaints(params)
        : Promise.resolve({ content: [] }),
    ] as const;

    Promise.all(promises)
      .then(([adComplaints, userComplaints, adoptionComplaints]) => {
        const ads: AdminComplaint[] = (adComplaints?.content || []).map((item) => ({
          ...item,
          tur: "ilan",
          title: item.adTitle || `İlan #${item.adId}`,
        }));

        const users: AdminComplaint[] = (userComplaints?.content || []).map((item) => ({
          ...item,
          tur: "kullanici",
          title:
            item.reportedUserFullName ||
            item.reportedUserEmail ||
            `Kullanıcı #${item.reportedUserId}`,
        }));

        const adoptions: AdminComplaint[] = (adoptionComplaints?.content || []).map(
          (item) => ({
            ...item,
            tur: "sahiplendirme",
            title: item.adTitle || `Sahiplendirme #${item.adId}`,
          }),
        );

        setComplaints([...ads, ...users, ...adoptions]);
      })
      .catch((err) => {
        setError(getUserErrorMessage(err, "Şikayetler yüklenemedi."));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeTab, page, searchQuery, sortOrder]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(0);
  };

  const handleSortChange = (sort: string) => {
    setSortOrder(sort);
    setPage(0);
  };

  const handleTabChange = (tab: ComplaintTab) => {
    setActiveTab(tab);
    setPage(0);
  };

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
      setComplaints(previousComplaints);
      alert(getUserErrorMessage(err, "Şikayet çözülürken bir hata oluştu."));
    } finally {
      setActionLoadingId(null);
    }
  };

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
        {/* Sub-tabs */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
          <button
            type="button"
            onClick={() => handleTabChange("all")}
            className={`button ${activeTab === "all" ? "button--primary" : "button--outline"}`}
          >
            Tümü
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("ads")}
            className={`button ${activeTab === "ads" ? "button--primary" : "button--outline"}`}
          >
            İlan Şikayetleri
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("users")}
            className={`button ${activeTab === "users" ? "button--primary" : "button--outline"}`}
          >
            Kullanıcı Şikayetleri
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("adoptions")}
            className={`button ${activeTab === "adoptions" ? "button--primary" : "button--outline"}`}
          >
            Sahiplendirme Şikayetleri
          </button>
        </div>

        {/* Filter Bar */}
        <AdminFilterBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          placeholder="Şikayetlerde ara..."
          className="mb-4"
        />

        {loading && <p className="muted">Şikayetler yükleniyor...</p>}

        {error && <p className="muted">{error}</p>}

        {!loading && !error && complaints.length === 0 && (
          <p className="muted">Şikayet bulunamadı.</p>
        )}

        {complaints.map((item) => (
          <article key={item.id} className="content-card">
            <div className="content-card__top">
              <div className="pill pill--warning">{translateEnum(item.status, "complaintStatus")}</div>

              <span className="muted">
                {new Date(item.createdAt).toLocaleDateString("tr-TR")}
              </span>
            </div>

            <h3>{item.title}</h3>

            <p>{item.description}</p>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
              <button
                className="button button--outline"
                type="button"
                onClick={() => handleDeleteComplaint(item.id)}
                disabled={actionLoadingId === item.id}
              >
                <Trash2 size={16} />
                Şikayeti Kaldır
              </button>

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