/**
 * PatiMati Backend API Type Definitions & Models
 * Standardized according to the PatiMati API Contract.
 */

// ==========================================
// Common Types
// ==========================================

export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type ApiResponse<T = unknown> = {
  message?: string;
  error?: string;
  success?: boolean;
  user?: T;
};

// ==========================================
// 1. User & Authentication Types (/api/auth)
// ==========================================

export type Role = "GUEST" | "USER" | "ADMIN";

export type UserResponseDTO = {
  uid: number;
  id?: number; // Normalized fallback
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  phone: string;
  enabled: boolean;
  latitude: number | null;
  longitude: number | null;
  lostPoints: number;
  adoptionPoints: number;
  lostBadgeLevel: number;
  adoptionBadgeLevel: number;
  city?: string; // UI optional extension
  phoneNumber?: string; // Compat fallback
};

export type AuthUser = UserResponseDTO;

export type RegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type GoogleAuthRequest = {
  idToken: string;
  email: string;
  googleId: string;
  firstName: string;
  lastName: string;
  fcmToken?: string;
};

export type UpdateProfileRequest = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
};

// For frontend form compatibility
export type UpdateProfileData = UpdateProfileRequest;

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
};

export type AuthResponse = {
  token: string;
  user: UserResponseDTO;
  accessToken?: string; // Compat
  refreshToken?: string; // Compat
  message?: string;
  error?: string;
};

// ==========================================
// 2. Ads Types (/api/ads & /api/public/ads)
// ==========================================

export type AdType = "LOST" | "FOUND" | "ADOPTION";
export type Species = "CAT" | "DOG" | "UNKNOWN";
export type Gender = "MALE" | "FEMALE" | "UNKNOWN";
export type AgeGroup =
  | "BABY"
  | "YOUNG"
  | "ADULT"
  | "SENIOR"
  | "UNKNOWN";
export type PetColor =
  | "WHITE"
  | "BLACK"
  | "BROWN"
  | "GRAY"
  | "ORANGE"
  | "CREAM"
  | "GOLDEN"
  | "BEIGE"
  | "OTHER";

export type CoatPattern =
  | "UNKNOWN"
  | "SOLID"
  | "STRIPED"
  | "SPOTTED"
  | "PATCHED"
  | "CALICO"
  | "TORTOISESHELL"
  | "OTHER";

export type PresenceStatus = "UNKNOWN" | "YES" | "NO";

/**
 * İlanın nasıl kapandığı. `active=false` TEK BAŞINA yetmiyor: "sahibi yayından
 * kaldırdı" ile "hayvan bulundu" ikisi de `active=false` üretiyor.
 * Backend karşılığı: entity/enums/AdResolutionStatus.
 */
export type AdResolutionStatus = "NONE" | "FOUND" | "ADOPTED";

export type AiStatus =
  | "PENDING"
  | "DONE"
  | "FAILED"
  | "APPROVED"
  | "REJECTED"
  | "NOT_APPLICABLE";

export type AdCreateRequest = {
  title: string;
  description: string;
  adType: AdType;
  species: Species;
  breed?: string;
  colors: PetColor[];
  gender: Gender;
  ageGroup: AgeGroup;
  coatPattern: CoatPattern;
  collarStatus: PresenceStatus;
  collarColor?: string;
  collarTagText?: string;
  eyeColor?: string;
  earTagStatus: PresenceStatus;
  earNotchStatus: PresenceStatus;
  microchipNumber?: string;
  lostDate?: string; // YYYY-MM-DD
  distinctiveMarks?: string;
  latitude: number;
  longitude: number;
  isMatchRequired?: boolean;
};

export type AdUpdateRequest = Partial<AdCreateRequest>;

export type AdResponse = {
  id: number;
  title: string;
  description: string;
  adType: AdType;
  species: Species;
  breed?: string;
  colors: PetColor[];
  gender: Gender;
  ageGroup: AgeGroup;
  coatPattern: CoatPattern;
  collarStatus: PresenceStatus;
  collarColor?: string;
  collarTagText?: string;
  eyeColor?: string;
  earTagStatus: PresenceStatus;
  earNotchStatus: PresenceStatus;
  microchipped: boolean;
  microchipNumber?: string;
  lostDate?: string;
  distinctiveMarks?: string;
  photoUrls: string[];
  latitude: number | null;
  longitude: number | null;
  ownerId: number;
  ownerDisplayName: string;
  active: boolean;
  /**
   * Yonetici moderasyonu. `active` ile KARISTIRILMAMALI:
   *   active=false + suspended=false -> SAHIP kendi ilanini yayindan kaldirdi
   *   active=false + suspended=true  -> YONETICI inceleme icin askiya aldi
   * Ikisi de active=false uretiyor; ayirt eden tek alan bu.
   */
  suspended: boolean;
  createdAt: string; // ISO-8601 UTC
  updatedAt: string; // ISO-8601 UTC
  aiStatus?: AiStatus;
  aiIsPet?: boolean;
  isPosterAllowed?: boolean;
  showEmailOnPoster?: boolean;
  showPhoneOnPoster?: boolean;
  city?: string;
  district?: string;
  resolutionStatus?: string;
};

/**
 * Yapay Zekâ İlan Eşleştirme Yanıt DTO'su (POST /api/ai-match)
 */
export type MatchedAdResponseDTO = {
  /** Benzerlik skoru (0.0 - 1.0 arasında ondalıklı sayı, örn: 0.942) */
  score: number;
  /** Eşleşen ilan yanıt verisi */
  ad: AdResponse;
};

export type PosterSettingsRequest = {
  isPosterAllowed: boolean;
  showEmailOnPoster: boolean;
  showPhoneOnPoster: boolean;
};

/**
 * Kayip ilanini "bulundu" diye kapatma istegi.
 *
 * Iki alan da ISTEGE BAGLI: kullanici hayvanini kendi bulmus olabilir. Sunucu
 * `foundAdId` gonderildiginde ilanin gercekten FOUND tipinde oldugunu dogrular,
 * degilse istegin TAMAMINI reddeder — bu yuzden istemci bagi ancak dogruladigi
 * ilan icin gonderir.
 *
 * Backend karsiligi: dto/ad/ResolveLostAdRequest (foundAdId backend #105 ile
 * geldi; alani tanimayan eski sunucu istegi reddetmez, alani yok sayar).
 */
export type ResolveLostAdRequest = {
  /** Hayvani bulan kullanici. Odul puani buna yaziliyor. */
  finderId?: number;
  /** Eslesen BULUNDU ilaninin kimligi. `resolved_by_ad_id` alanini doldurur. */
  foundAdId?: number;
};

// ==========================================
// 3. Adoption Ads Types (/api/adoptions)
// ==========================================

export type AdoptionAdCreateRequest = {
  title: string;
  description: string;
  species: Species;
  breed?: string;
  gender: Gender;
  ageGroup: AgeGroup;
  colors: PetColor[];
  coatPattern: CoatPattern;
  eyeColor?: string;
  microchipNumber?: string | null;
  latitude: number;
  longitude: number;
  isMatchRequired?: boolean;
};

export type AdoptionAdUpdateRequest = Partial<AdoptionAdCreateRequest>;

export type ResolveAdoptionAdRequest = {
  adopterId?: number;
};

// ==========================================
// 4. Messaging & Chat Types (/api/messages)
// ==========================================

export type WebSocketStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR";

export type ChatRoomResponse = {
  roomId?: number;
  partnerId: number;
  partnerName?: string;
  partnerAvatar?: string;
  lastMessage?: string;
  lastMessageTimestamp?: string;
  unreadCount?: number;
};

export type MessageSendRequest = {
  recipientId: number;
  content: string;
};

export type MessageResponse = {
  id: number;
  senderId: number;
  senderName: string;
  recipientId: number;
  recipientName: string;
  content: string;
  timestamp: string; // ISO-8601 UTC
  isRead: boolean;
  isOptimistic?: boolean;
};


// ==========================================
// 5. Complaint Types (/api/complaints)
// ==========================================

export type ComplaintReason =
  | "SAHTE_ILAN"
  | "UYGUNSUZ_ICERIK"
  | "DOLANDIRICILIK"
  | "KOTU_DIL_KULLANIMI"
  | "DIGER";

export type ComplaintStatus = "BEKLEMEDE" | "INCELEMEDE" | "COZULDU";

export type UserComplaintRequestDTO = {
  reportedUserId: number;
  reason: ComplaintReason;
  description: string;
};

export type AdComplaintRequestDTO = {
  reportedAdId?: number;
  reason: ComplaintReason;
  description: string;
};

export type ComplaintResponse = {
  id: number;
  reporterId: number;
  reporterEmail: string;
  reportedAdId?: number;
  reportedUserId?: number;
  reason: ComplaintReason;
  description: string;
  status: ComplaintStatus;
  createdAt: string; // ISO-8601 UTC
};

// ==========================================
// 6. Admin Panel Types (/api/admin/*)
// ==========================================

export type UserDetailForAdminDTO = UserResponseDTO & {
  banned?: boolean;
  createdAt?: string;
};

export type AdminGetParams = {
  page?: number;
  size?: number;
  search?: string;
  sort?: string;
};

/**
 * Üç admin şikayet kaydının ORTAK çekirdeği.
 *
 * Bu tipler eskiden `ComplaintResponse`'tan türetiliyordu ve oradan
 * `reportedAdId` alanını miras alıyorlardı — ama o alan ADMIN cevaplarında
 * YOK. `ComplaintResponse` şikayet OLUŞTURMA uçlarının cevabı
 * (`POST /api/complaints/ad` vb.) ve orada `reportedAdId` doğru. Admin
 * uçları `dto/admin/*AdminResponse` kayıtlarını döndürüyor; onlarda alanın
 * adı `adId` ve yanında `adTitle` da geliyor.
 *
 * Sonuç: yönetici ekranı `#undefined` gösteriyordu ve "İlanı Askıya Al"
 * düğmesi hiç çizilmiyordu (koşulu hep `undefined`'dı).
 *
 * `status` alanı bilerek `ComplaintResponse`'tan TÜRETİLİYOR: tek bir yerde
 * tanımlı kalsın, ikisi ayrışmasın.
 */
type AdminComplaintCore = Pick<
  ComplaintResponse,
  "id" | "reporterId" | "reporterEmail" | "reason" | "description" | "status" | "createdAt"
> & {
  reporterFullName?: string;
};

export type AdComplaintAdminResponse = AdminComplaintCore & {
  adId: number;
  adTitle: string;
  adOwnerId?: number;
  adOwnerFullName?: string;
};

/**
 * Backend'de AYRI bir record (`AdoptionComplaintAdminResponse`) ama alanları
 * `AdComplaintAdminResponse` ile birebir aynı. Ayrı isim, ekranların hangi
 * ucu okuduğunu görünür tutuyor.
 */
export type AdoptionComplaintAdminResponse = AdComplaintAdminResponse;

export type UserComplaintAdminResponse = AdminComplaintCore & {
  reportedUserId: number;
  reportedUserFullName?: string;
  reportedUserEmail?: string;
};

// ==========================================
// 7. Match Types (/api/matches)
// ==========================================

/**
 * Eslesme kartinin okudugu ilan ozeti.
 * Backend karsiligi: dto/match/AdMatchResponseDTO.AdSummaryDTO
 * (AdResponse DEGIL - bu ic sinifin yalnizca su 5 alani vardir).
 */
export type AdSummaryDTO = {
  id?: number;
  title?: string;
  photoUrl?: string;
  species?: Species | string;
  breed?: string;
};

/**
 * Backend karsiligi: dto/match/AdMatchResponseDTO
 * Alanlar oradan birebir alinmistir. Buraya backend'in GONDERMEDIGI alan
 * eklenmez: eklenirse kart sessizce bos kalir, tip denetimi de uyarmaz.
 */
export type MatchResponseDTO = {
  id?: number;

  // Oturum acan kullanicinin ilani
  myAd?: AdSummaryDTO;
  myAdId?: number;
  myAdTitle?: string;

  // Karsi tarafin ilani
  partnerAd?: AdSummaryDTO;
  partnerAdId?: number;
  partnerAdTitle?: string;

  // Skor kirilimlari
  totalScore: number;
  visualScore: number;
  tagScore: number;
  locationScore: number;
  thresholdAtTime: number;

  // Detaylar ve durumlar
  matchedPhotoPair?: string;
  blockReason?: string | null;
  passedThreshold: boolean;
  notificationSentAt?: string;
  createdAt?: string;
};

// ==========================================
// 8. User Online Status Types (/api/users/{userId}/status)
// ==========================================

export type UserStatusResponse = {
  userId: number;
  online: boolean;
  status: "ONLINE" | "OFFLINE";
  lastSeen?: string | null;
};

export type UserStatusEvent = {
  userId: number | string;
  online?: boolean;
  status?: "ONLINE" | "OFFLINE" | string;
  lastSeen?: string | null;
};

