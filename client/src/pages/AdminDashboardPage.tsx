import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  AtSign,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ExternalLink,
  Flag,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Shield,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  banUser,
  deleteAdminAd,
  getAdminAdComplaints,
  getAdminAdoptionComplaints,
  getAdminAds,
  getAdminExternalPosts,
  getAdminUserComplaints,
  getAdminUsers,
  suspendAd,
  unhideAd,
  unbanUser,
} from "../services/admin";
import type {
  AdComplaintAdminResponse,
  AdResponse,
  AdoptionComplaintAdminResponse,
  ExternalPostAdminResponse,
  Page,
  UserComplaintAdminResponse,
  UserDetailForAdminDTO,
} from "../services/types";

type AdminTab = "users" | "ads" | "complaints" | "instagram";
type ComplaintSubTab = "ads" | "users" | "adoptions";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [complaintSubTab, setComplaintSubTab] =
    useState<ComplaintSubTab>("ads");

  // State for Users
  const [usersPage, setUsersPage] = useState<Page<UserDetailForAdminDTO> | null>(
    null,
  );
  const [usersPageIndex, setUsersPageIndex] = useState(0);

  // State for Ads
  const [adsPage, setAdsPage] = useState<Page<AdResponse> | null>(null);
  const [adsPageIndex, setAdsPageIndex] = useState(0);

  // State for Complaints
  const [adComplaintsPage, setAdComplaintsPage] =
    useState<Page<AdComplaintAdminResponse> | null>(null);
  const [userComplaintsPage, setUserComplaintsPage] =
    useState<Page<UserComplaintAdminResponse> | null>(null);
  const [adoptionComplaintsPage, setAdoptionComplaintsPage] =
    useState<Page<AdoptionComplaintAdminResponse> | null>(null);
  const [complaintsPageIndex, setComplaintsPageIndex] = useState(0);

  // State for Instagram (external) posts
  const [externalPostsPage, setExternalPostsPage] =
    useState<Page<ExternalPostAdminResponse> | null>(null);
  const [externalPostsPageIndex, setExternalPostsPageIndex] = useState(0);

  // General state
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Her fetch akışının kendi son isteğini izleyen AbortController referansı.
  // Aynı akış (ör. sayfa/sekme hızlı değiştirilirken) yeniden tetiklendiğinde
  // önceki istek iptal edilir, böylece geç dönen eski bir cevap state'i
  // ezmez. Akışlar birbirinden bağımsız state'e yazdığı için (usersPage,
  // adsPage, ...) her biri kendi ref'ine sahip -- bir sekmenin isteği
  // diğerini iptal etmez.
  const usersAbortRef = useRef<AbortController | null>(null);
  const adsAbortRef = useRef<AbortController | null>(null);
  const complaintsAbortRef = useRef<AbortController | null>(null);
  const externalPostsAbortRef = useRef<AbortController | null>(null);

  // Bileşen unmount olduğunda hâlâ süren istekleri iptal et (unmount sonrası
  // state güncellemesini önler).
  useEffect(() => {
    return () => {
      usersAbortRef.current?.abort();
      adsAbortRef.current?.abort();
      complaintsAbortRef.current?.abort();
      externalPostsAbortRef.current?.abort();
    };
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(async (pageIndex: number) => {
    usersAbortRef.current?.abort();
    const controller = new AbortController();
    usersAbortRef.current = controller;
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminUsers({
        page: pageIndex,
        size: 10,
        signal: controller.signal,
      });
      setUsersPage(res);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Kullanıcılar yüklenemedi:", err);
      setError("Kullanıcı listesi alınamadı.");
    } finally {
      // Bu istek hâlâ bu akışın en güncel isteğiyse yükleniyor durumunu
      // kapat -- iptal edilmiş (üzerine yenisi başlamış) bir isteğin
      // finally'si, yeni isteğin loading=true'sunu yanlışlıkla kapatmasın.
      if (usersAbortRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  // Fetch Ads
  const fetchAds = useCallback(async (pageIndex: number) => {
    adsAbortRef.current?.abort();
    const controller = new AbortController();
    adsAbortRef.current = controller;
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminAds({
        page: pageIndex,
        size: 10,
        signal: controller.signal,
      });
      setAdsPage(res);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("İlanlar yüklenemedi:", err);
      setError("İlan listesi alınamadı.");
    } finally {
      if (adsAbortRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  // Fetch Complaints
  const fetchComplaints = useCallback(
    async (subTab: ComplaintSubTab, pageIndex: number) => {
      complaintsAbortRef.current?.abort();
      const controller = new AbortController();
      complaintsAbortRef.current = controller;
      try {
        setLoading(true);
        setError(null);
        if (subTab === "ads") {
          const res = await getAdminAdComplaints({
            page: pageIndex,
            size: 10,
            signal: controller.signal,
          });
          setAdComplaintsPage(res);
        } else if (subTab === "users") {
          const res = await getAdminUserComplaints({
            page: pageIndex,
            size: 10,
            signal: controller.signal,
          });
          setUserComplaintsPage(res);
        } else {
          const res = await getAdminAdoptionComplaints({
            page: pageIndex,
            size: 10,
            signal: controller.signal,
          });
          setAdoptionComplaintsPage(res);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Şikayetler yüklenemedi:", err);
        setError("Şikayet listesi alınamadı.");
      } finally {
        if (complaintsAbortRef.current === controller) {
          setLoading(false);
        }
      }
    },
    [],
  );

  // Fetch Instagram (external) posts
  const fetchExternalPosts = useCallback(async (pageIndex: number) => {
    externalPostsAbortRef.current?.abort();
    const controller = new AbortController();
    externalPostsAbortRef.current = controller;
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminExternalPosts({
        page: pageIndex,
        size: 10,
        signal: controller.signal,
      });
      setExternalPostsPage(res);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Instagram kayıtları yüklenemedi:", err);
      setError("Instagram kayıtları alınamadı.");
    } finally {
      if (externalPostsAbortRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  // Effect to load data based on active tab
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect --
       sekme/sayfa degistiginde sunucudan veri cekmek (dis sistemle
       senkronizasyon) useEffect'in var olma sebebi; fetchUsers/fetchAds/
       fetchComplaints kendi ici setLoading/setError cagrilarini yapiyor. */
    if (activeTab === "users") {
      fetchUsers(usersPageIndex);
    } else if (activeTab === "ads") {
      fetchAds(adsPageIndex);
    } else if (activeTab === "complaints") {
      fetchComplaints(complaintSubTab, complaintsPageIndex);
    } else if (activeTab === "instagram") {
      fetchExternalPosts(externalPostsPageIndex);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [
    activeTab,
    complaintSubTab,
    usersPageIndex,
    adsPageIndex,
    complaintsPageIndex,
    externalPostsPageIndex,
    fetchUsers,
    fetchAds,
    fetchComplaints,
    fetchExternalPosts,
  ]);

  // Action handlers
  const handleBanUser = async (userId: number, currentBanned?: boolean) => {
    try {
      setActionLoadingId(`user-${userId}`);
      setFeedback(null);

      if (currentBanned) {
        await unbanUser(userId);
        setFeedback(`Kullanıcı #${userId} engeli kaldırıldı.`);
      } else {
        await banUser(userId);
        setFeedback(`Kullanıcı #${userId} engellendi.`);
      }

      // Sunucudan yeniden çek. Eskiden burada AYRICA optimistic bir
      // setUsersPage güncellemesi vardı -- kaldırıldı, çünkü hemen ardından
      // gelen bu fetchUsers zaten aynı satırı sunucudan gelen gerçek veriyle
      // eziyordu; optimistic yazının tek gözlemlenebilir etkisi bir sonraki
      // satırda üzerine yazılmadan önceki tek bir render'lık kısa bir
      // yanıp-sönmeydi, hiçbir gerçek fayda sağlamıyordu. Bu dosyadaki tüm
      // eylem handler'ları (bkz. handleToggleAdSuspend, handleDeleteAd) artık
      // aynı tek desende: mutasyon -> feedback -> sunucudan yeniden çek. Tek
      // doğruluk kaynağı sunucu; iki kopyayı senkron tutmaya çalışmak yerine
      // (ve aralarında tutarsızlık riski almak yerine) her zaman tazesini
      // isteriz.
      await fetchUsers(usersPageIndex);
    } catch (err) {
      console.error("Kullanıcı durumu değiştirilemedi:", err);
      setError("İşlem gerçekleştirilemedi.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleAdSuspend = async (adId: number, isCurrentlySuspended: boolean) => {
    try {
      setActionLoadingId(`ad-suspend-${adId}`);
      setFeedback(null);

      if (isCurrentlySuspended) {
        await unhideAd(adId);
        setFeedback(`İlan #${adId} yayına alındı.`);
      } else {
        await suspendAd(adId);
        setFeedback(`İlan #${adId} askıya alındı.`);
      }

      // Sunucudan yeniden çek -- handleBanUser/handleDeleteAd ile aynı desen
      // (bkz. handleBanUser'daki not). Eskiden burada refetch YOKTU, yalnızca
      // optimistic bir setAdsPage vardı: sayfa değiştirilip geri dönüldüğünde
      // ya da başka bir yönetici aynı ilanı değiştirdiğinde bu satır sunucudan
      // hiç doğrulanmadan ekranda kalıyordu.
      await fetchAds(adsPageIndex);
    } catch (err) {
      console.error("İlan durumu değiştirilemedi:", err);
      setError("İşlem gerçekleştirilemedi.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteAd = async (adId: number) => {
    if (!window.confirm(`İlan #${adId} kalıcı olarak silinecek. Onaylıyor musunuz?`)) {
      return;
    }

    try {
      setActionLoadingId(`ad-delete-${adId}`);
      setFeedback(null);

      await deleteAdminAd(adId);
      setFeedback(`İlan #${adId} silindi.`);

      await fetchAds(adsPageIndex);
    } catch (err) {
      console.error("İlan silinemedi:", err);
      setError("İlan silinirken bir hata oluştu.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getExternalCategoryLabel = (category: string | null) => {
    switch (category) {
      case "LOST":
        return "Kayıp";
      case "FOUND":
        return "Bulunan";
      case "ADOPTION":
        return "Sahiplendirme";
      case "IRRELEVANT":
        return "İlgisiz";
      default:
        return "Belirsiz";
    }
  };

  const getExternalCategoryBadgeClass = (category: string | null) => {
    switch (category) {
      case "LOST":
        return "bg-rose-100 text-rose-700 border border-rose-200";
      case "FOUND":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      case "ADOPTION":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  const getExternalStatusLabel = (status: string) => {
    switch (status) {
      case "DISCOVERED":
        return "Tespit edildi";
      case "COLLECTED":
        return "Toplandı";
      case "MEDIA_STORED":
        return "Medya depolandı";
      case "ANALYZING":
        return "Analiz ediliyor";
      case "ANALYZED":
        return "Analiz edildi";
      case "MATCHING":
        return "Eşleştiriliyor";
      case "COMPLETED":
        return "Tamamlandı";
      case "FAILED":
        return "Başarısız";
      case "NEEDS_REVIEW":
        return "İncelenmeli";
      default:
        return status;
    }
  };

  const getExternalStatusBadgeClass = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "FAILED":
        return "bg-rose-100 text-rose-700 border border-rose-200";
      case "NEEDS_REVIEW":
        return "bg-amber-100 text-amber-700 border border-amber-200";
      default:
        return "bg-blue-100 text-blue-700 border border-blue-200";
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "SAHTE_ILAN":
        return "Sahte İlan";
      case "UYGUNSUZ_ICERIK":
        return "Uygunsuz İçerik";
      case "DOLANDIRICILIK":
        return "Dolandırıcılık";
      case "KOTU_DIL_KULLANIMI":
        return "Kötü Dil";
      default:
        return reason || "Diğer";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl">
                <Shield size={26} />
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Yönetim Paneli
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Sistem kullanıcılarını, ilanları ve gelen şikayetleri yönetin.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (activeTab === "users") fetchUsers(usersPageIndex);
              if (activeTab === "ads") fetchAds(adsPageIndex);
              if (activeTab === "complaints")
                fetchComplaints(complaintSubTab, complaintsPageIndex);
              if (activeTab === "instagram")
                fetchExternalPosts(externalPostsPageIndex);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>Yenile</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-semibold text-emerald-800 animate-in fade-in">
            <CheckCircle size={20} className="text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm font-semibold text-rose-800 animate-in fade-in">
            <AlertTriangle size={20} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Tabs Navigation */}
        <div className="flex border-b border-slate-200 mb-6 gap-2 sm:gap-4 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab("users");
              setError(null);
              setFeedback(null);
            }}
            className={`flex items-center gap-2 px-5 py-3 font-extrabold text-sm border-b-2 transition-all whitespace-nowrap ${
              activeTab === "users"
                ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <Users size={18} />
            <span>Kullanıcılar</span>
            {usersPage?.totalElements !== undefined && (
              <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                {usersPage.totalElements}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("ads");
              setError(null);
              setFeedback(null);
            }}
            className={`flex items-center gap-2 px-5 py-3 font-extrabold text-sm border-b-2 transition-all whitespace-nowrap ${
              activeTab === "ads"
                ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <LayoutGrid size={18} />
            <span>İlanlar</span>
            {adsPage?.totalElements !== undefined && (
              <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                {adsPage.totalElements}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("complaints");
              setError(null);
              setFeedback(null);
            }}
            className={`flex items-center gap-2 px-5 py-3 font-extrabold text-sm border-b-2 transition-all whitespace-nowrap ${
              activeTab === "complaints"
                ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <Flag size={18} />
            <span>Şikayetler</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("instagram");
              setError(null);
              setFeedback(null);
            }}
            className={`flex items-center gap-2 px-5 py-3 font-extrabold text-sm border-b-2 transition-all whitespace-nowrap ${
              activeTab === "instagram"
                ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <AtSign size={18} />
            <span>Instagram Kayıtları</span>
            {externalPostsPage?.totalElements !== undefined && (
              <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                {externalPostsPage.totalElements}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* 1. USERS TAB */}
          {activeTab === "users" && (
            <div>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Sistem Kullanıcıları
                </h2>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Sayfa {usersPageIndex + 1} / {usersPage?.totalPages || 1}
                </span>
              </div>

              {loading && !usersPage ? (
                <div className="p-12 flex justify-center items-center text-slate-400 gap-2">
                  <Loader2 size={24} className="animate-spin text-blue-600" />
                  <span>Kullanıcılar yükleniyor...</span>
                </div>
              ) : !usersPage?.content.length ? (
                <div className="p-12 text-center text-slate-500 font-medium">
                  Kayıtlı kullanıcı bulunamadı.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Ad Soyad</th>
                        <th className="px-6 py-4">E-Posta</th>
                        <th className="px-6 py-4">Telefon</th>
                        <th className="px-6 py-4">Rol</th>
                        <th className="px-6 py-4">Durum</th>
                        <th className="px-6 py-4 text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {usersPage.content.map((usr) => {
                        const uid = usr.uid || usr.id || 0;
                        const isBanned = usr.banned === true || usr.enabled === false;
                        const isActionLoading =
                          actionLoadingId === `user-${uid}`;

                        return (
                          <tr
                            key={uid}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="px-6 py-4 font-bold text-slate-900">
                              #{uid}
                            </td>
                            <td className="px-6 py-4 font-semibold text-slate-900">
                              {usr.firstName} {usr.lastName}
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {usr.email}
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {usr.phone || usr.phoneNumber || "-"}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                                  usr.role === "ADMIN"
                                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {usr.role}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {isBanned ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-700 border border-rose-200">
                                  <Ban size={13} />
                                  <span>Engelli</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200">
                                  <UserCheck size={13} />
                                  <span>Aktif</span>
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {usr.role !== "ADMIN" && (
                                <button
                                  type="button"
                                  disabled={isActionLoading}
                                  onClick={() => handleBanUser(uid, isBanned)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                    isBanned
                                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                      : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                  }`}
                                >
                                  {isActionLoading ? (
                                    <Loader2
                                      size={14}
                                      className="animate-spin"
                                    />
                                  ) : isBanned ? (
                                    <>
                                      <UserCheck size={14} />
                                      <span>Engeli Kaldır</span>
                                    </>
                                  ) : (
                                    <>
                                      <Ban size={14} />
                                      <span>Banla</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {usersPage && usersPage.totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <button
                    type="button"
                    disabled={usersPageIndex <= 0 || loading}
                    onClick={() => setUsersPageIndex((prev) => prev - 1)}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                    <span>Önceki</span>
                  </button>

                  <span className="text-xs font-bold text-slate-600">
                    Sayfa {usersPageIndex + 1} / {usersPage.totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      usersPageIndex >= usersPage.totalPages - 1 || loading
                    }
                    onClick={() => setUsersPageIndex((prev) => prev + 1)}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <span>Sonraki</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. ADS TAB */}
          {activeTab === "ads" && (
            <div>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-slate-900">
                  İlan Yönetimi
                </h2>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Sayfa {adsPageIndex + 1} / {adsPage?.totalPages || 1}
                </span>
              </div>

              {loading && !adsPage ? (
                <div className="p-12 flex justify-center items-center text-slate-400 gap-2">
                  <Loader2 size={24} className="animate-spin text-blue-600" />
                  <span>İlanlar yükleniyor...</span>
                </div>
              ) : !adsPage?.content.length ? (
                <div className="p-12 text-center text-slate-500 font-medium">
                  Sistemde ilan bulunamadı.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Başlık</th>
                        <th className="px-6 py-4">İlan Türü</th>
                        <th className="px-6 py-4">İlan Sahibi</th>
                        <th className="px-6 py-4">Durum</th>
                        <th className="px-6 py-4 text-right">Eylemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {adsPage.content.map((ad) => {
                        const isSuspended = !ad.active;
                        const isSuspendLoading =
                          actionLoadingId === `ad-suspend-${ad.id}`;
                        const isDeleteLoading =
                          actionLoadingId === `ad-delete-${ad.id}`;

                        return (
                          <tr
                            key={ad.id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="px-6 py-4 font-bold text-slate-900">
                              #{ad.id}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900 max-w-xs truncate">
                              {ad.title}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                                  ad.adType === "LOST"
                                    ? "bg-rose-100 text-rose-700 border border-rose-200"
                                    : ad.adType === "FOUND"
                                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                                    : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                }`}
                              >
                                {ad.adType === "LOST"
                                  ? "Kayıp"
                                  : ad.adType === "FOUND"
                                  ? "Buldum"
                                  : "Sahiplendirme"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {ad.ownerDisplayName || `Kullanıcı #${ad.ownerId}`}
                            </td>
                            <td className="px-6 py-4">
                              {isSuspended ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-700 border border-amber-200">
                                  <EyeOff size={13} />
                                  <span>Askıda</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200">
                                  <Eye size={13} />
                                  <span>Yayında</span>
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button
                                type="button"
                                disabled={isSuspendLoading || isDeleteLoading}
                                onClick={() =>
                                  handleToggleAdSuspend(ad.id, isSuspended)
                                }
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                  isSuspended
                                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                    : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                                }`}
                              >
                                {isSuspendLoading ? (
                                  <Loader2
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : isSuspended ? (
                                  <>
                                    <Eye size={14} />
                                    <span>Yayına Al</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff size={14} />
                                    <span>Askıya Al</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                disabled={isSuspendLoading || isDeleteLoading}
                                onClick={() => handleDeleteAd(ad.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all"
                              >
                                {isDeleteLoading ? (
                                  <Loader2
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <>
                                    <Trash2 size={14} />
                                    <span>Sil</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {adsPage && adsPage.totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <button
                    type="button"
                    disabled={adsPageIndex <= 0 || loading}
                    onClick={() => setAdsPageIndex((prev) => prev - 1)}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                    <span>Önceki</span>
                  </button>

                  <span className="text-xs font-bold text-slate-600">
                    Sayfa {adsPageIndex + 1} / {adsPage.totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      adsPageIndex >= adsPage.totalPages - 1 || loading
                    }
                    onClick={() => setAdsPageIndex((prev) => prev + 1)}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <span>Sonraki</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. COMPLAINTS TAB */}
          {activeTab === "complaints" && (
            <div>
              {/* Complaints Sub-Tabs */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setComplaintSubTab("ads");
                      setComplaintsPageIndex(0);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      complaintSubTab === "ads"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    İlan Şikayetleri
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setComplaintSubTab("users");
                      setComplaintsPageIndex(0);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      complaintSubTab === "users"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Kullanıcı Şikayetleri
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setComplaintSubTab("adoptions");
                      setComplaintsPageIndex(0);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      complaintSubTab === "adoptions"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Sahiplendirme Şikayetleri
                  </button>
                </div>
              </div>

              {/* Sub tab content list */}
              {loading ? (
                <div className="p-12 flex justify-center items-center text-slate-400 gap-2">
                  <Loader2 size={24} className="animate-spin text-blue-600" />
                  <span>Şikayetler yükleniyor...</span>
                </div>
              ) : complaintSubTab === "ads" ? (
                !adComplaintsPage?.content.length ? (
                  <div className="p-12 text-center text-slate-500 font-medium">
                    Henüz bir ilan şikayeti yok.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4">Şikayet Edilen İlan</th>
                          <th className="px-6 py-4">Şikayet Eden</th>
                          <th className="px-6 py-4">Sebep</th>
                          <th className="px-6 py-4">Açıklama</th>
                          <th className="px-6 py-4">Tarih</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {adComplaintsPage.content.map((c) => (
                          <tr
                            key={c.id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="px-6 py-4 font-bold text-slate-900">
                              #{c.id}
                            </td>
                            <td className="px-6 py-4 font-bold text-blue-600">
                              {c.adTitle || `İlan #${c.reportedAdId}`}
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {c.reporterEmail}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-700 border border-rose-200">
                                {getReasonLabel(c.reason)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-700 max-w-xs truncate">
                              {c.description}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500">
                              {new Date(c.createdAt).toLocaleDateString(
                                "tr-TR",
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : complaintSubTab === "users" ? (
                !userComplaintsPage?.content.length ? (
                  <div className="p-12 text-center text-slate-500 font-medium">
                    Henüz bir kullanıcı şikayeti yok.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4">Şikayet Edilen Kullanıcı</th>
                          <th className="px-6 py-4">Şikayet Eden</th>
                          <th className="px-6 py-4">Sebep</th>
                          <th className="px-6 py-4">Açıklama</th>
                          <th className="px-6 py-4">Tarih</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {userComplaintsPage.content.map((c) => (
                          <tr
                            key={c.id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="px-6 py-4 font-bold text-slate-900">
                              #{c.id}
                            </td>
                            <td className="px-6 py-4 font-bold text-blue-600">
                              {c.reportedUserEmail ||
                                `Kullanıcı #${c.reportedUserId}`}
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {c.reporterEmail}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-700 border border-rose-200">
                                {getReasonLabel(c.reason)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-700 max-w-xs truncate">
                              {c.description}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500">
                              {new Date(c.createdAt).toLocaleDateString(
                                "tr-TR",
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : !adoptionComplaintsPage?.content.length ? (
                <div className="p-12 text-center text-slate-500 font-medium">
                  Henüz bir sahiplendirme şikayeti yok.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Sahiplendirme İlanı</th>
                        <th className="px-6 py-4">Şikayet Eden</th>
                        <th className="px-6 py-4">Sebep</th>
                        <th className="px-6 py-4">Açıklama</th>
                        <th className="px-6 py-4">Tarih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {adoptionComplaintsPage.content.map((c) => (
                        <tr
                          key={c.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-6 py-4 font-bold text-slate-900">
                            #{c.id}
                          </td>
                          <td className="px-6 py-4 font-bold text-blue-600">
                            {c.adoptionTitle || `Sahiplendirme #${c.reportedAdId}`}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {c.reporterEmail}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-700 border border-rose-200">
                              {getReasonLabel(c.reason)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-700 max-w-xs truncate">
                            {c.description}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {new Date(c.createdAt).toLocaleDateString("tr-TR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 4. INSTAGRAM (EXTERNAL) POSTS TAB */}
          {activeTab === "instagram" && (
            <div>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Instagram'da Etiketlenen Gönderiler
                </h2>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Sayfa {externalPostsPageIndex + 1} /{" "}
                  {externalPostsPage?.totalPages || 1}
                </span>
              </div>

              {loading && !externalPostsPage ? (
                <div className="p-12 flex justify-center items-center text-slate-400 gap-2">
                  <Loader2 size={24} className="animate-spin text-blue-600" />
                  <span>Instagram kayıtları yükleniyor...</span>
                </div>
              ) : !externalPostsPage?.content.length ? (
                <div className="p-12 text-center text-slate-500 font-medium">
                  Henüz hesap hiçbir gönderide etiketlenmedi.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Fotoğraf</th>
                        <th className="px-6 py-4">Yazar</th>
                        <th className="px-6 py-4">Kategori / Tür</th>
                        <th className="px-6 py-4">İşleme Durumu</th>
                        <th className="px-6 py-4">Eşleşme</th>
                        <th className="px-6 py-4">Tespit Tarihi</th>
                        <th className="px-6 py-4 text-right">Bağlantı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {externalPostsPage.content.map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-6 py-4">
                            {p.photoUrl ? (
                              <img
                                src={p.photoUrl}
                                alt=""
                                className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200" />
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {p.authorUsername ? `@${p.authorUsername}` : "-"}
                            {p.caption && (
                              <p className="text-xs text-slate-400 max-w-xs truncate mt-0.5">
                                {p.caption}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg ${getExternalCategoryBadgeClass(
                                p.category,
                              )}`}
                            >
                              {getExternalCategoryLabel(p.category)}
                            </span>
                            {(p.species || p.breed) && (
                              <p className="text-xs text-slate-500 mt-1">
                                {[p.species, p.breed]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg ${getExternalStatusBadgeClass(
                                p.processingStatus,
                              )}`}
                            >
                              {getExternalStatusLabel(p.processingStatus)}
                            </span>
                            {p.failureReason && (
                              <p className="text-xs text-rose-500 max-w-xs truncate mt-1">
                                {p.failureReason}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {p.hasMatch ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200">
                                <CheckCircle size={13} />
                                <span>Eşleşti</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
                                <span>Yok</span>
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {new Date(p.detectedAt).toLocaleString("tr-TR")}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <a
                              href={p.canonicalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all"
                            >
                              <ExternalLink size={14} />
                              <span>Instagram</span>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {externalPostsPage && externalPostsPage.totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <button
                    type="button"
                    disabled={externalPostsPageIndex <= 0 || loading}
                    onClick={() =>
                      setExternalPostsPageIndex((prev) => prev - 1)
                    }
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                    <span>Önceki</span>
                  </button>

                  <span className="text-xs font-bold text-slate-600">
                    Sayfa {externalPostsPageIndex + 1} /{" "}
                    {externalPostsPage.totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      externalPostsPageIndex >=
                        externalPostsPage.totalPages - 1 || loading
                    }
                    onClick={() =>
                      setExternalPostsPageIndex((prev) => prev + 1)
                    }
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <span>Sonraki</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}