import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  AtSign,
  Ban,
  Briefcase,
  Check,
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
  Send,
  Shield,
  Trash2,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AdminFilterBar from "../components/admin/AdminFilterBar";
import InstagramPublishModal from "../components/InstagramPublishModal";
import RoleBadge from "../components/RoleBadge";
import { ApiError } from "../services/api";
import {
  banUser,
  deleteAdminAd,
  getAdminAdComplaints,
  getAdminAdoptionComplaints,
  getAdminAds,
  getAdminExternalPosts,
  getAdminInstagramQueue,
  getAdminUserComplaints,
  getAdminUsers,
  skipInstagramQueueItem,
  suspendAd,
  unhideAd,
  unbanUser,
} from "../services/admin";
import {
  approveBusinessApplication,
  deleteBusinessApplication,
  getBusinessApplications,
  rejectBusinessApplication,
} from "../services/businessApplications";
import type {
  AdComplaintAdminResponse,
  AdResponse,
  AdoptionComplaintAdminResponse,
  BusinessApplicationResponse,
  BusinessApplicationStatus,
  ExternalPostAdminResponse,
  InstagramQueueItemResponse,
  Page,
  UserComplaintAdminResponse,
  UserDetailForAdminDTO,
} from "../services/types";

type AdminTab =
  | "users"
  | "ads"
  | "complaints"
  | "instagram"
  | "businessApplications";
type ComplaintSubTab = "ads" | "users" | "adoptions";
type InstagramSubTab = "posts" | "queue";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [complaintSubTab, setComplaintSubTab] =
    useState<ComplaintSubTab>("ads");
  const [instagramSubTab, setInstagramSubTab] =
    useState<InstagramSubTab>("posts");

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("createdAt,desc");

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
  const [lightboxPhotoUrl, setLightboxPhotoUrl] = useState<string | null>(
    null,
  );

  // State for Instagram publish queue (outbound -- ilanları Instagram'a gönderme)
  const [instagramQueuePage, setInstagramQueuePage] =
    useState<Page<InstagramQueueItemResponse> | null>(null);
  const [instagramQueuePageIndex, setInstagramQueuePageIndex] = useState(0);
  const [publishModalItem, setPublishModalItem] =
    useState<InstagramQueueItemResponse | null>(null);

  // State for Kurum Başvuruları (işletme sahibi olma başvuruları)
  const [businessApplicationsPage, setBusinessApplicationsPage] =
    useState<Page<BusinessApplicationResponse> | null>(null);
  const [businessApplicationsPageIndex, setBusinessApplicationsPageIndex] = useState(0);
  const [businessApplicationsStatusFilter, setBusinessApplicationsStatusFilter] =
    useState<BusinessApplicationStatus>("BEKLEMEDE");

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
  const instagramQueueAbortRef = useRef<AbortController | null>(null);
  const businessApplicationsAbortRef = useRef<AbortController | null>(null);

  // Bileşen unmount olduğunda hâlâ süren istekleri iptal et (unmount sonrası
  // state güncellemesini önler).
  useEffect(() => {
    return () => {
      usersAbortRef.current?.abort();
      adsAbortRef.current?.abort();
      complaintsAbortRef.current?.abort();
      externalPostsAbortRef.current?.abort();
      instagramQueueAbortRef.current?.abort();
      businessApplicationsAbortRef.current?.abort();
    };
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(async (pageIndex: number, search?: string, sort?: string) => {
    usersAbortRef.current?.abort();
    const controller = new AbortController();
    usersAbortRef.current = controller;
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminUsers({
        page: pageIndex,
        size: 10,
        search,
        sort,
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
  const fetchAds = useCallback(async (pageIndex: number, search?: string, sort?: string) => {
    adsAbortRef.current?.abort();
    const controller = new AbortController();
    adsAbortRef.current = controller;
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminAds({
        page: pageIndex,
        size: 10,
        search,
        sort,
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
    async (subTab: ComplaintSubTab, pageIndex: number, search?: string, sort?: string) => {
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
            search,
            sort,
            signal: controller.signal,
          });
          setAdComplaintsPage(res);
        } else if (subTab === "users") {
          const res = await getAdminUserComplaints({
            page: pageIndex,
            size: 10,
            search,
            sort,
            signal: controller.signal,
          });
          setUserComplaintsPage(res);
        } else {
          const res = await getAdminAdoptionComplaints({
            page: pageIndex,
            size: 10,
            search,
            sort,
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

  // Fetch Instagram publish queue (outbound)
  const fetchInstagramQueue = useCallback(async (pageIndex: number) => {
    instagramQueueAbortRef.current?.abort();
    const controller = new AbortController();
    instagramQueueAbortRef.current = controller;
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminInstagramQueue({
        page: pageIndex,
        size: 10,
        signal: controller.signal,
      });
      setInstagramQueuePage(res);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Instagram kuyruğu yüklenemedi:", err);
      setError("Instagram kuyruğu alınamadı.");
    } finally {
      if (instagramQueueAbortRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  // Fetch Business Applications (Kurum Başvuruları)
  const fetchBusinessApplications = useCallback(
    async (pageIndex: number, status: BusinessApplicationStatus) => {
      businessApplicationsAbortRef.current?.abort();
      const controller = new AbortController();
      businessApplicationsAbortRef.current = controller;
      try {
        setLoading(true);
        setError(null);
        const res = await getBusinessApplications({ page: pageIndex, size: 10, status });
        setBusinessApplicationsPage(res);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Kurum başvuruları yüklenemedi:", err);
        setError("Kurum başvuruları alınamadı.");
      } finally {
        if (businessApplicationsAbortRef.current === controller) {
          setLoading(false);
        }
      }
    },
    [],
  );

  // Effect to load data based on active tab & filters
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers(usersPageIndex, searchQuery, sortOrder);
    } else if (activeTab === "ads") {
      fetchAds(adsPageIndex, searchQuery, sortOrder);
    } else if (activeTab === "complaints") {
      fetchComplaints(complaintSubTab, complaintsPageIndex, searchQuery, sortOrder);
    } else if (activeTab === "instagram") {
      if (instagramSubTab === "posts") {
        fetchExternalPosts(externalPostsPageIndex);
      } else {
        fetchInstagramQueue(instagramQueuePageIndex);
      }
    } else if (activeTab === "businessApplications") {
      fetchBusinessApplications(businessApplicationsPageIndex, businessApplicationsStatusFilter);
    }
  }, [
    activeTab,
    complaintSubTab,
    instagramSubTab,
    usersPageIndex,
    adsPageIndex,
    complaintsPageIndex,
    externalPostsPageIndex,
    instagramQueuePageIndex,
    businessApplicationsPageIndex,
    businessApplicationsStatusFilter,
    searchQuery,
    sortOrder,
    fetchUsers,
    fetchAds,
    fetchComplaints,
    fetchExternalPosts,
    fetchInstagramQueue,
    fetchBusinessApplications,
  ]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setUsersPageIndex(0);
    setAdsPageIndex(0);
    setComplaintsPageIndex(0);
  };

  const handleSortChange = (sort: string) => {
    setSortOrder(sort);
    setUsersPageIndex(0);
    setAdsPageIndex(0);
    setComplaintsPageIndex(0);
  };

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

  const handleApproveBusinessApplication = async (id: number) => {
    try {
      setActionLoadingId(`business-application-${id}`);
      setFeedback(null);
      await approveBusinessApplication(id);
      setFeedback(`Başvuru #${id} onaylandı.`);
      await fetchBusinessApplications(businessApplicationsPageIndex, businessApplicationsStatusFilter);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Başvuru onaylanamadı.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectBusinessApplication = async (id: number) => {
    const reason = window.prompt("Red sebebini yazın:");
    if (!reason || !reason.trim()) {
      return;
    }

    try {
      setActionLoadingId(`business-application-${id}`);
      setFeedback(null);
      await rejectBusinessApplication(id, reason.trim());
      setFeedback(`Başvuru #${id} reddedildi.`);
      await fetchBusinessApplications(businessApplicationsPageIndex, businessApplicationsStatusFilter);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Başvuru reddedilemedi.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteBusinessApplication = async (id: number) => {
    if (!window.confirm("Bu kurumu tamamen silmek istediğinize emin misiniz? İş kartı silinir ve sahibinin rolü tekrar kullanıcıya döner.")) {
      return;
    }

    try {
      setActionLoadingId(`business-application-${id}`);
      setFeedback(null);
      await deleteBusinessApplication(id);
      setFeedback(`Kurum #${id} silindi.`);
      await fetchBusinessApplications(businessApplicationsPageIndex, businessApplicationsStatusFilter);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Başvuru silinemedi.");
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

  const handleSkipInstagramItem = async (id: number) => {
    if (!window.confirm("Bu ilan Instagram'da paylaşılmayacak. Onaylıyor musunuz?")) {
      return;
    }

    try {
      setActionLoadingId(`instagram-skip-${id}`);
      setFeedback(null);

      await skipInstagramQueueItem(id);
      setFeedback("İlan Instagram kuyruğundan çıkarıldı.");

      await fetchInstagramQueue(instagramQueuePageIndex);
    } catch (err) {
      console.error("Instagram kuyruk kaydı atlanamadı:", err);
      setError("İşlem gerçekleştirilemedi.");
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
        return "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30";
      case "FOUND":
        return "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30";
      case "ADOPTION":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
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
        return "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30";
      case "FAILED":
        return "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30";
      case "NEEDS_REVIEW":
        return "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30";
      default:
        return "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30";
    }
  };

  const getInstagramQueueStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Bekliyor";
      case "PUBLISHED":
        return "Gönderildi";
      case "FAILED":
        return "Başarısız";
      case "SKIPPED":
        return "Atlandı";
      default:
        return status;
    }
  };

  const getInstagramQueueStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30";
      case "FAILED":
        return "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30";
      case "SKIPPED":
        return "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
      default:
        return "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30";
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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl dark:bg-blue-500/15 dark:text-blue-400">
                <Shield size={26} />
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight dark:text-slate-50">
                  Yönetim Paneli
                </h1>
                <p className="text-sm text-slate-500 font-medium dark:text-slate-400">
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
              if (activeTab === "instagram" && instagramSubTab === "posts")
                fetchExternalPosts(externalPostsPageIndex);
              if (activeTab === "instagram" && instagramSubTab === "queue")
                fetchInstagramQueue(instagramQueuePageIndex);
              if (activeTab === "businessApplications")
                fetchBusinessApplications(businessApplicationsPageIndex, businessApplicationsStatusFilter);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>Yenile</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-semibold text-emerald-800 animate-in fade-in dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
            <CheckCircle size={20} className="text-emerald-600 shrink-0 dark:text-emerald-400" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm font-semibold text-rose-800 animate-in fade-in dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
            <AlertTriangle size={20} className="text-rose-600 shrink-0 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Tabs Navigation */}
        <div className="flex border-b border-slate-200 mb-6 gap-2 sm:gap-4 overflow-x-auto pb-0.5 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab("users");
              setError(null);
              setFeedback(null);
            }}
            className={`flex items-center gap-2 px-5 py-3 font-extrabold text-sm border-b-2 transition-all whitespace-nowrap ${
              activeTab === "users"
                ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl dark:bg-blue-500/10"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:border-slate-600"
            }`}
          >
            <Users size={18} />
            <span>Kullanıcılar</span>
            {usersPage?.totalElements !== undefined && (
              <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
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
                ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl dark:bg-blue-500/10"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:border-slate-600"
            }`}
          >
            <LayoutGrid size={18} />
            <span>İlanlar</span>
            {adsPage?.totalElements !== undefined && (
              <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
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
                ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl dark:bg-blue-500/10"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:border-slate-600"
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
                ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl dark:bg-blue-500/10"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:border-slate-600"
            }`}
          >
            <AtSign size={18} />
            <span>Instagram</span>
            {(externalPostsPage || instagramQueuePage) && (
              <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {(externalPostsPage?.totalElements ?? 0) + (instagramQueuePage?.totalElements ?? 0)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("businessApplications");
              setError(null);
              setFeedback(null);
            }}
            className={`flex items-center gap-2 px-5 py-3 font-extrabold text-sm border-b-2 transition-all whitespace-nowrap ${
              activeTab === "businessApplications"
                ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl dark:bg-blue-500/10"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:border-slate-600"
            }`}
          >
            <Briefcase size={18} />
            <span>Kurum Başvuruları</span>
            {businessApplicationsPage?.totalElements !== undefined && (
              <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {businessApplicationsPage.totalElements}
              </span>
            )}
          </button>
        </div>

        {/* Filter Bar */}
        {(activeTab === "users" || activeTab === "ads" || activeTab === "complaints") && (
        <div className="mb-6">
          <AdminFilterBar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            placeholder={
              activeTab === "users"
                ? "Kullanıcı ara (ad, e-posta)..."
                : activeTab === "ads"
                ? "İlan ara (başlık, açıklama)..."
                : "Şikayet ara..."
            }
          />
        </div>
        )}

        {/* Tab Content */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          {/* 1. USERS TAB */}
          {activeTab === "users" && (
            <div>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between dark:border-slate-800">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-50">
                  Sistem Kullanıcıları
                </h2>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  Sayfa {usersPageIndex + 1} / {usersPage?.totalPages || 1}
                </span>
              </div>

              {loading && !usersPage ? (
                <div className="p-12 flex justify-center items-center text-slate-400 gap-2 dark:text-slate-500">
                  <Loader2 size={24} className="animate-spin text-blue-600 dark:text-blue-400" />
                  <span>Kullanıcılar yükleniyor...</span>
                </div>
              ) : !usersPage?.content.length ? (
                <div className="p-12 text-center text-slate-500 font-medium dark:text-slate-400">
                  Kayıtlı kullanıcı bulunamadı.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs border-b border-slate-100 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-800">
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
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700 dark:divide-slate-800 dark:text-slate-300">
                      {usersPage.content.map((usr) => {
                        const uid = usr.uid || usr.id || 0;
                        const isBanned = usr.banned === true || usr.enabled === false;
                        const isActionLoading =
                          actionLoadingId === `user-${uid}`;

                        return (
                          <tr
                            key={uid}
                            className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/60"
                          >
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                              #{uid}
                            </td>
                            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                              {usr.firstName} {usr.lastName}
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                              {usr.email}
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                              {usr.phone || usr.phoneNumber || "-"}
                            </td>
                            <td className="px-6 py-4">
                              <RoleBadge role={usr.role} size="sm" />
                            </td>
                            <td className="px-6 py-4">
                              {isBanned ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30">
                                  <Ban size={13} />
                                  <span>Engelli</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
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
                                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/15 dark:border-emerald-500/20"
                                      : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/15 dark:border-rose-500/20"
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
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30">
                  <button
                    type="button"
                    disabled={usersPageIndex <= 0 || loading}
                    onClick={() => setUsersPageIndex((prev) => prev - 1)}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft size={16} />
                    <span>Önceki</span>
                  </button>

                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Sayfa {usersPageIndex + 1} / {usersPage.totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      usersPageIndex >= usersPage.totalPages - 1 || loading
                    }
                    onClick={() => setUsersPageIndex((prev) => prev + 1)}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
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
              <div className="p-6 border-b border-slate-100 flex items-center justify-between dark:border-slate-800">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-50">
                  İlan Yönetimi
                </h2>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  Sayfa {adsPageIndex + 1} / {adsPage?.totalPages || 1}
                </span>
              </div>

              {loading && !adsPage ? (
                <div className="p-12 flex justify-center items-center text-slate-400 gap-2 dark:text-slate-500">
                  <Loader2 size={24} className="animate-spin text-blue-600 dark:text-blue-400" />
                  <span>İlanlar yükleniyor...</span>
                </div>
              ) : !adsPage?.content.length ? (
                <div className="p-12 text-center text-slate-500 font-medium dark:text-slate-400">
                  Sistemde ilan bulunamadı.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs border-b border-slate-100 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Başlık</th>
                        <th className="px-6 py-4">İlan Türü</th>
                        <th className="px-6 py-4">İlan Sahibi</th>
                        <th className="px-6 py-4">Durum</th>
                        <th className="px-6 py-4 text-right">Eylemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700 dark:divide-slate-800 dark:text-slate-300">
                      {adsPage.content.map((ad) => {
                        const isSuspended = !ad.active;
                        const isSuspendLoading =
                          actionLoadingId === `ad-suspend-${ad.id}`;
                        const isDeleteLoading =
                          actionLoadingId === `ad-delete-${ad.id}`;

                        return (
                          <tr
                            key={ad.id}
                            className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/60"
                          >
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                              #{ad.id}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900 max-w-xs truncate dark:text-slate-100">
                              <Link href={`/ads/${ad.id}`} className="hover:underline hover:text-blue-600 dark:hover:text-blue-400">
                                {ad.title}
                              </Link>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                                  ad.adType === "LOST"
                                    ? "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30"
                                    : ad.adType === "FOUND"
                                    ? "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30"
                                    : "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30"
                                }`}
                              >
                                {ad.adType === "LOST"
                                  ? "Kayıp"
                                  : ad.adType === "FOUND"
                                  ? "Buldum"
                                  : "Sahiplendirme"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                              {ad.ownerDisplayName || `Kullanıcı #${ad.ownerId}`}
                            </td>
                            <td className="px-6 py-4">
                              {isSuspended ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
                                  <EyeOff size={13} />
                                  <span>Askıda</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
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
                                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/15 dark:border-emerald-500/20"
                                    : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/15 dark:border-amber-500/20"
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
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/15 dark:border-rose-500/20"
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
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30">
                  <button
                    type="button"
                    disabled={adsPageIndex <= 0 || loading}
                    onClick={() => setAdsPageIndex((prev) => prev - 1)}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft size={16} />
                    <span>Önceki</span>
                  </button>

                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Sayfa {adsPageIndex + 1} / {adsPage.totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      adsPageIndex >= adsPage.totalPages - 1 || loading
                    }
                    onClick={() => setAdsPageIndex((prev) => prev + 1)}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
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
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:border-slate-800 dark:bg-slate-800/30">
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
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800"
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
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800"
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
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800"
                    }`}
                  >
                    Sahiplendirme Şikayetleri
                  </button>
                </div>
              </div>

              {/* Sub tab content list */}
              {loading ? (
                <div className="p-12 flex justify-center items-center text-slate-400 gap-2 dark:text-slate-500">
                  <Loader2 size={24} className="animate-spin text-blue-600 dark:text-blue-400" />
                  <span>Şikayetler yükleniyor...</span>
                </div>
              ) : complaintSubTab === "ads" ? (
                !adComplaintsPage?.content.length ? (
                  <div className="p-12 text-center text-slate-500 font-medium dark:text-slate-400">
                    Henüz bir ilan şikayeti yok.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs border-b border-slate-100 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-800">
                        <tr>
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4">Şikayet Edilen İlan</th>
                          <th className="px-6 py-4">Şikayet Eden</th>
                          <th className="px-6 py-4">Sebep</th>
                          <th className="px-6 py-4">Açıklama</th>
                          <th className="px-6 py-4">Tarih</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700 dark:divide-slate-800 dark:text-slate-300">
                        {adComplaintsPage.content.map((c) => (
                          <tr
                            key={c.id}
                            className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/60"
                          >
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                              #{c.id}
                            </td>
                            <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">
                              <Link href={`/ads/${c.adId}`} className="hover:underline">
                                {c.adTitle || `İlan #${c.adId}`}
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                              {c.reporterEmail}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30">
                                {getReasonLabel(c.reason)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-700 max-w-xs truncate dark:text-slate-300">
                              {c.description}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-500">
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
                  <div className="p-12 text-center text-slate-500 font-medium dark:text-slate-400">
                    Henüz bir kullanıcı şikayeti yok.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs border-b border-slate-100 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-800">
                        <tr>
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4">Şikayet Edilen Kullanıcı</th>
                          <th className="px-6 py-4">Şikayet Eden</th>
                          <th className="px-6 py-4">Sebep</th>
                          <th className="px-6 py-4">Açıklama</th>
                          <th className="px-6 py-4">Tarih</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700 dark:divide-slate-800 dark:text-slate-300">
                        {userComplaintsPage.content.map((c) => (
                          <tr
                            key={c.id}
                            className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/60"
                          >
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                              #{c.id}
                            </td>
                            <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">
                              {c.reportedUserEmail ||
                                `Kullanıcı #${c.reportedUserId}`}
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                              {c.reporterEmail}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30">
                                {getReasonLabel(c.reason)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-700 max-w-xs truncate dark:text-slate-300">
                              {c.description}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-500">
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
                <div className="p-12 text-center text-slate-500 font-medium dark:text-slate-400">
                  Henüz bir sahiplendirme şikayeti yok.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs border-b border-slate-100 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Sahiplendirme İlanı</th>
                        <th className="px-6 py-4">Şikayet Eden</th>
                        <th className="px-6 py-4">Sebep</th>
                        <th className="px-6 py-4">Açıklama</th>
                        <th className="px-6 py-4">Tarih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700 dark:divide-slate-800 dark:text-slate-300">
                      {adoptionComplaintsPage.content.map((c) => (
                        <tr
                          key={c.id}
                          className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/60"
                        >
                          <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                            #{c.id}
                          </td>
                          <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">
                            <Link href={`/ads/${c.adId}`} className="hover:underline">
                              {c.adTitle || `Sahiplendirme #${c.adId}`}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                            {c.reporterEmail}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30">
                              {getReasonLabel(c.reason)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-700 max-w-xs truncate dark:text-slate-300">
                            {c.description}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-500">
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
              {/* Instagram Sub-Tabs */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:border-slate-800 dark:bg-slate-800/30">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setInstagramSubTab("posts")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      instagramSubTab === "posts"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800"
                    }`}
                  >
                    Etiketler
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstagramSubTab("queue")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      instagramSubTab === "queue"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800"
                    }`}
                  >
                    Gönderi İstekleri
                  </button>
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {instagramSubTab === "posts" ? (
                    <>Sayfa {externalPostsPageIndex + 1} / {externalPostsPage?.totalPages || 1}</>
                  ) : (
                    <>Sayfa {instagramQueuePageIndex + 1} / {instagramQueuePage?.totalPages || 1}</>
                  )}
                </span>
              </div>

              {instagramSubTab === "posts" && (
              <>
              {loading && !externalPostsPage ? (
                <div className="p-12 flex justify-center items-center text-slate-400 gap-2 dark:text-slate-500">
                  <Loader2 size={24} className="animate-spin text-blue-600 dark:text-blue-400" />
                  <span>Instagram kayıtları yükleniyor...</span>
                </div>
              ) : !externalPostsPage?.content.length ? (
                <div className="p-12 text-center text-slate-500 font-medium dark:text-slate-400">
                  Henüz hesap hiçbir gönderide etiketlenmedi.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs border-b border-slate-100 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-800">
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
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                      {externalPostsPage.content.map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-6 py-4">
                            {p.photoUrl ? (
                              <button
                                type="button"
                                onClick={() => setLightboxPhotoUrl(p.photoUrl)}
                                className="block rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <img
                                  src={p.photoUrl}
                                  alt=""
                                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 cursor-pointer transition hover:opacity-80"
                                  loading="lazy"
                                />
                              </button>
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700" />
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                            {p.authorUsername ? `@${p.authorUsername}` : "-"}
                            {p.caption && (
                              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs truncate mt-0.5">
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
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
                              <p className="text-xs text-rose-500 dark:text-rose-400 max-w-xs truncate mt-1">
                                {p.failureReason}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {p.hasMatch && p.matchedAdId ? (
                              <Link
                                href={`/ads/${p.matchedAdId}`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 transition hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 dark:hover:bg-emerald-500/25"
                              >
                                <CheckCircle size={13} />
                                <span>Eşleşti</span>
                              </Link>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                <span>Yok</span>
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                            {new Date(p.detectedAt).toLocaleString("tr-TR")}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <a
                              href={p.canonicalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:border-slate-700"
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
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30">
                  <button
                    type="button"
                    disabled={externalPostsPageIndex <= 0 || loading}
                    onClick={() =>
                      setExternalPostsPageIndex((prev) => prev - 1)
                    }
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft size={16} />
                    <span>Önceki</span>
                  </button>

                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
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
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <span>Sonraki</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
              </>
              )}

              {instagramSubTab === "queue" && (
              <>
              {loading && !instagramQueuePage ? (
                <div className="p-12 flex justify-center items-center text-slate-400 gap-2 dark:text-slate-500">
                  <Loader2 size={24} className="animate-spin text-blue-600 dark:text-blue-400" />
                  <span>Instagram kuyruğu yükleniyor...</span>
                </div>
              ) : !instagramQueuePage?.content.length ? (
                <div className="p-12 text-center text-slate-500 font-medium dark:text-slate-400">
                  Instagram'a gönderim için bekleyen ilan yok.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs border-b border-slate-100 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Fotoğraf</th>
                        <th className="px-6 py-4">İlan</th>
                        <th className="px-6 py-4">Gönderi Metni</th>
                        <th className="px-6 py-4">Durum</th>
                        <th className="px-6 py-4">Tarih</th>
                        <th className="px-6 py-4 text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                      {instagramQueuePage.content.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-6 py-4">
                            {item.photoUrl ? (
                              <img
                                src={item.photoUrl}
                                alt=""
                                className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700" />
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                            <Link
                              href={`/ads/${item.adId}`}
                              className="font-bold text-slate-900 hover:underline dark:text-slate-100"
                            >
                              {item.adTitle}
                            </Link>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                              {item.adType === "LOST"
                                ? "Kayıp"
                                : item.adType === "FOUND"
                                ? "Bulundu"
                                : "Sahiplendirme"}
                              {item.ownerDisplayName ? ` · ${item.ownerDisplayName}` : ""}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                            <p className="text-xs max-w-xs truncate">
                              {item.suggestedCaption || "-"}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg ${getInstagramQueueStatusBadgeClass(
                                item.status,
                              )}`}
                            >
                              {getInstagramQueueStatusLabel(item.status)}
                            </span>
                            {item.failureReason && (
                              <p className="text-xs text-rose-500 dark:text-rose-400 max-w-xs truncate mt-1">
                                {item.failureReason}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                            {new Date(item.createdAt).toLocaleString("tr-TR")}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {item.status === "PENDING" ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSkipInstagramItem(item.id)}
                                  disabled={actionLoadingId === `instagram-skip-${item.id}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:border-slate-700"
                                >
                                  <X size={14} />
                                  <span>Atla</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPublishModalItem(item)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-all"
                                >
                                  <Send size={14} />
                                  <span>Gönder</span>
                                </button>
                              </div>
                            ) : item.status === "FAILED" ? (
                              <button
                                type="button"
                                onClick={() => setPublishModalItem(item)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-all"
                              >
                                <Send size={14} />
                                <span>Tekrar Dene</span>
                              </button>
                            ) : item.status === "PUBLISHED" && item.igPermalink ? (
                              <a
                                href={item.igPermalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:border-slate-700"
                              >
                                <ExternalLink size={14} />
                                <span>Gönderiyi Gör</span>
                              </a>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {instagramQueuePage && instagramQueuePage.totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30">
                  <button
                    type="button"
                    disabled={instagramQueuePageIndex <= 0 || loading}
                    onClick={() =>
                      setInstagramQueuePageIndex((prev) => prev - 1)
                    }
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft size={16} />
                    <span>Önceki</span>
                  </button>

                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Sayfa {instagramQueuePageIndex + 1} /{" "}
                    {instagramQueuePage.totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      instagramQueuePageIndex >=
                        instagramQueuePage.totalPages - 1 || loading
                    }
                    onClick={() =>
                      setInstagramQueuePageIndex((prev) => prev + 1)
                    }
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <span>Sonraki</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
              </>
              )}
            </div>
          )}

          {/* BUSINESS APPLICATIONS TAB */}
          {activeTab === "businessApplications" && (
            <div className="p-6">
              <h2 className="mb-1 text-lg font-extrabold text-slate-900 dark:text-slate-50">
                Kurum Başvuruları
              </h2>
              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                Kullanıcıların Hizmetler sayfasından yaptığı işletme sahibi olma başvuruları. Onaylandığında
                kullanıcının rolü değişir ve iş kartı (klinik/petshop/barınak) otomatik oluşur.
              </p>

              <div className="mb-6 flex flex-wrap gap-2">
                {(
                  [
                    { value: "BEKLEMEDE", label: "Bekleyen" },
                    { value: "ONAYLANDI", label: "Onaylanan" },
                    { value: "REDDEDILDI", label: "Reddedilen" },
                  ] as Array<{ value: BusinessApplicationStatus; label: string }>
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setBusinessApplicationsStatusFilter(option.value);
                      setBusinessApplicationsPageIndex(0);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      businessApplicationsStatusFilter === option.value
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Yükleniyor...</p>}

              {!loading && (businessApplicationsPage?.content.length ?? 0) === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">Bu kategoride başvuru yok.</p>
              )}

              <div className="space-y-4">
                {businessApplicationsPage?.content.map((application) => {
                  const typeLabel =
                    application.businessType === "VET"
                      ? "Veteriner"
                      : application.businessType === "PETSHOP"
                        ? "Petshop"
                        : "Barınak";
                  const isActioning = actionLoadingId === `business-application-${application.id}`;

                  return (
                    <div
                      key={application.id}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row dark:border-slate-800"
                    >
                      {application.photoUrl && (
                        <img
                          src={application.photoUrl}
                          alt={application.name}
                          className="h-28 w-28 shrink-0 rounded-xl object-cover"
                        />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                            {typeLabel}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                            {application.name}
                          </h3>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Başvuran: {application.applicantName} ({application.applicantEmail})
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {application.address}
                          {application.district ? `, ${application.district}` : ""}, {application.city} ·{" "}
                          {application.phone}
                        </p>
                        {application.rejectionReason && (
                          <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">
                            Red sebebi: {application.rejectionReason}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                          {new Date(application.createdAt).toLocaleDateString("tr-TR")}
                        </p>

                        {application.status === "BEKLEMEDE" && (
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleApproveBusinessApplication(application.id)}
                              disabled={isActioning}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                              <Check size={14} />
                              Onayla
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectBusinessApplication(application.id)}
                              disabled={isActioning}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 disabled:opacity-60 dark:bg-rose-500/10"
                            >
                              <XCircle size={14} />
                              Reddet
                            </button>
                          </div>
                        )}

                        {application.status === "ONAYLANDI" && (
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => handleDeleteBusinessApplication(application.id)}
                              disabled={isActioning}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300"
                            >
                              <Trash2 size={14} />
                              Kurumu Sil
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {businessApplicationsPage && businessApplicationsPage.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBusinessApplicationsPageIndex((p) => Math.max(0, p - 1))}
                    disabled={businessApplicationsPageIndex === 0}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 disabled:opacity-40 dark:border-slate-700"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {businessApplicationsPageIndex + 1} / {businessApplicationsPage.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setBusinessApplicationsPageIndex((p) =>
                        Math.min(businessApplicationsPage.totalPages - 1, p + 1),
                      )
                    }
                    disabled={businessApplicationsPageIndex >= businessApplicationsPage.totalPages - 1}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 disabled:opacity-40 dark:border-slate-700"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {publishModalItem && (
        <InstagramPublishModal
          isOpen
          onClose={() => setPublishModalItem(null)}
          queueItemId={publishModalItem.id}
          adTitle={publishModalItem.adTitle}
          suggestedCaption={publishModalItem.suggestedCaption || ""}
          onPublished={() => fetchInstagramQueue(instagramQueuePageIndex)}
        />
      )}

      {lightboxPhotoUrl && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 p-6"
          onClick={() => setLightboxPhotoUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxPhotoUrl(null)}
            className="absolute top-6 right-6 text-white/80 hover:text-white transition"
            aria-label="Kapat"
          >
            <X size={28} />
          </button>
          <img
            src={lightboxPhotoUrl}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}

      <Footer />
    </div>
  );
}