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

export type Role = "GUEST" | "USER" | "ADMIN" | "VET" | "PETSHOP" | "BARINAK" | "INSTITUTION";

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

export type AdType = "LOST" | "FOUND" | "ADOPTION" | "HELP";
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

export type EyeColor =
  | "UNKNOWN"
  | "BROWN"
  | "BLUE"
  | "GREEN"
  | "AMBER"
  | "HAZEL"
  | "HETEROCHROMIA"
  | "OTHER";

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
  /** İlanı açan kullanıcının rolü -- barınak hesabından açılan sahiplendirme ilanlarında "Barınak" etiketi için. Sahip silinmişse (veya eski test/mock veride) null/undefined olabilir. */
  ownerRole?: Role | null;
  active: boolean;
  /**
   * Yonetici moderasyonu. `active` ile KARISTIRILMAMALI:
   *   active=false + suspended=false -> SAHIP kendi ilanini yayindan kaldirdi
   *   active=false + suspended=true  -> YONETICI inceleme icin askiya aldi
   * Ikisi de active=false uretiyor; ayirt eden tek alan bu.
   */
  suspended: boolean;
  /**
   * İlanın nasıl kapandığı -- bkz. yukarıdaki AdResolutionStatus tanımı.
   * `active=false`'un TEK BAŞINA "sahibi kaldırdı" mı "hayvan bulundu" mu
   * olduğunu ayırt eder. Opsiyonel: backend bu alanı henüz her durumda
   * doldurmuyor, MyListingsPage bu yüzden değeri undefined iken eski
   * davranışı (yayından kaldırıldı) koruyacak şekilde yazıldı.
   */
  resolutionStatus?: AdResolutionStatus;
  createdAt: string; // ISO-8601 UTC
  updatedAt: string; // ISO-8601 UTC
  aiStatus?: AiStatus;
  aiIsPet?: boolean;
  isPosterAllowed?: boolean;
  showEmailOnPoster?: boolean;
  showPhoneOnPoster?: boolean;
  city?: string;
  district?: string;
};

/**
 * Yapay Zekâ Analiz Yanıt DTO'su (POST /api/ai/analyze)
 */
export type AiAnalysis = {
  species?: string;
  speciesConfidence?: number;
  species_confidence?: number;
  breed?: string | null;
  breedConfidence?: number;
  breed_confidence?: number;
  coatPattern?: string | null;
  pattern?: string | null;
  colors?: string[] | Array<{ r: number; g: number; b: number; score: number }>;
  isPet?: boolean;
  is_pet?: boolean;
  embedding?: number[];
  labels?: string[];
  model_version?: string;
};

/**
 * "Ben Neyim?" pet raporu yanıt DTO'su (POST /api/public/pet-analiz).
 * Alan adları AI servisindeki `PetReportResult`in (pet_raporu_prompt.py'nin
 * ÇIKTI FORMATI'yla) birebir aynı -- backend cevabı olduğu gibi aktarıyor.
 */
export type PetDegerGuven = {
  deger: string;
  guven: number; // 0-100 -- EKRANDA HAM GÖSTERİLMEZ, bkz. guvenEtiketi()
};

export type PetYasTahmini = {
  aralik: string;
  yasam_evresi: "Yavru" | "Genç" | "Yetişkin" | "Yaşlı" | string;
  guven: number;
};

export type PetCinsiyetTahmini = {
  tahmin: string;
  guven: number;
};

export type PetBakimIpuclari = {
  beslenme?: string | null;
  tuy_bakimi?: string | null;
  aktivite?: string | null;
};

export type PetReportResult = {
  gecerli: boolean;
  hata_nedeni?: string | null;
  irka_ozel_icerik?: boolean | null;
  renk_tarifi?: PetDegerGuven | null;
  goz_rengi?: PetDegerGuven | null;
  tahmini_yas?: PetYasTahmini | null;
  cinsiyet?: PetCinsiyetTahmini | null;
  tahmini_boyut?: PetDegerGuven | null;
  ayirt_edici_isaretler?: string[];
  genel_durum_gozlemi?: string | null;
  karakter_profili?: string | null;
  sasirtici_bilgiler?: string[];
  dikkat_edilmesi_gerekenler?: string[];
  bakim_ipuclari?: PetBakimIpuclari | null;
  ek_hayvanlar?: string | null;
  goruntu_kalite_notu?: string | null;
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
  /** Karşı tarafın rolü -- sohbette rol rozeti göstermek için. */
  partnerRole?: Role | null;
};

export type MessageType = "TEXT" | "AD_SHARE";

export type MessageSendRequest = {
  recipientId: number;
  content: string;
  type?: MessageType;
  sharedAdId?: number;
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
  /** Karşı tarafın rolü -- sohbette rol rozeti göstermek için. */
  partnerRole?: Role | null;
  type?: MessageType;
  sharedAdId?: number;
  sharedAd?: AdResponse | AdSummaryDTO;
};


// ==========================================
// 5. Complaint Types (/api/complaints)
// ==========================================

// Backend'in tek ComplaintReason enum'uyla (Ad/Adoption/User şikayetlerinin
// üçü de aynısını kullanır) birebir aynı olmalı -- bkz.
// PATIMATI---BACKEND-social/.../entity/enums/ComplaintReason.java. Bunun
// dışındaki bir değer backend'den 400 döner.
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
  signal?: AbortSignal;
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

export type ExternalPostAdminResponse = {
  id: number;
  source: string;
  sourcePostId: string;
  canonicalUrl: string;
  authorUsername: string | null;
  caption: string | null;
  detectedAt: string; // ISO-8601 UTC
  processingStatus: string;
  failureReason: string | null;
  photoUrl: string | null;
  category: string | null;
  categoryConfidence: number | null;
  species: string | null;
  breed: string | null;
  needsReview: boolean | null;
  hasMatch: boolean;
  matchedAdId: number | null;
};

export type InstagramPublishStatus = "PENDING" | "PUBLISHED" | "FAILED" | "SKIPPED";

/** Backend karşılığı: dto/admin/InstagramPublishQueueAdminResponse. */
export type InstagramQueueItemResponse = {
  id: number;
  adId: number;
  adTitle: string;
  adType: AdType;
  ownerDisplayName: string | null;
  photoUrl: string | null;
  suggestedCaption: string | null;
  status: InstagramPublishStatus;
  failureReason: string | null;
  createdAt: string; // ISO-8601 UTC
};

/**
 * Backend karşılığı: entity/enums/AnimalType.java.
 *
 * Bilerek `Species`'ten (yalnızca CAT/DOG/UNKNOWN, ilan eşleştirmesine bağlı)
 * AYRI bir tip -- bir veterinerin baktığı tür yelpazesi çok daha geniş.
 */
export type AnimalType =
  | "DOG"
  | "CAT"
  | "BIRD"
  | "RABBIT"
  | "RODENT"
  | "REPTILE"
  | "FISH"
  | "FARM_ANIMAL"
  | "EXOTIC"
  | "OTHER";

/** Backend karşılığı: dto/vet/VetClinicResponse (kendi kartı, GET/PUT /api/vet/clinic). */
export type VetClinicResponse = {
  id: number;
  name: string;
  address: string;
  city: string;
  district: string | null;
  phone: string;
  workingHours: string | null;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  animalTypes: AnimalType[];
  /** Yorum yoksa `null` -- 0.0 DEĞİL, "henüz değerlendirme yok" ayırt edilebilsin diye. */
  averageRating: number | null;
  reviewCount: number;
};

/**
 * Backend karşılığı: dto/vet/VetClinicPublicResponse (herkese açık dizin,
 * GET /api/vet-clinics ve GET /api/vet-clinics/{id}).
 *
 * `vetUserId`: müşteri isteği göndermek için gereken hedef (User.uid) --
 * klinik kartının kendi `id`'si (VetClinic PK) DEĞİL. Backend'in bu alanı
 * döndürdüğü varsayılıyor (VetClinic.user.uid) -- yoksa müşteri isteği
 * gönderme akışı çalışmaz. Bilerek EN SONDA tutuluyor (plan §10).
 */
export type VetClinicPublicResponse = {
  id: number;
  name: string;
  address: string;
  city: string;
  district: string | null;
  phone: string;
  workingHours: string | null;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  animalTypes: AnimalType[];
  averageRating: number | null;
  reviewCount: number;
  vetUserId: number;
};

export type VetClinicUpsertPayload = {
  name: string;
  address: string;
  city: string;
  district?: string;
  phone: string;
  workingHours?: string;
  photo?: File;
  latitude?: number;
  longitude?: number;
  animalTypes?: AnimalType[];
};

/** Backend karşılığı: dto/vet/VetClinicReviewResponse. */
export type VetClinicReviewResponse = {
  id: number;
  authorId: number;
  authorName: string;
  rating: number;
  comment: string | null;
  /** Çağıran bu yorumun yazarı mı -- öyleyse düzenle/sil gösterilebilir. */
  canEdit: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Backend karşılığı: dto/vet/VetClinicReviewUpsertRequest (PUT /api/vet-clinics/{id}/reviews/me). */
export type VetClinicReviewUpsertPayload = {
  rating: number;
  comment?: string;
};

/** Backend karşılığı: dto/admin/CreateVetAccountRequest. */
export type CreateVetAccountPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

// ==========================================
// 7b. Pet & Vet Customer Types (/api/pets, /api/vet-customer-requests, /api/vet/**)
// ==========================================

/** Backend karşılığı: dto/pet/PetResponse. */
export type Pet = {
  id: number;
  name: string;
  species: Species;
  breed: string | null;
  gender: Gender | null;
  ageGroup: AgeGroup | null;
  photoUrl: string | null;
  /** Kapak dahil TÜM fotoğraflar, sıralı; photoUrl her zaman ilk eleman. */
  photoUrls: string[];
  birthDate: string | null;
  sterilized: boolean | null;
  microchipNumber: string | null;
  chronicConditions: string | null;
  allergies: string | null;
  /** "Ben Neyim?" raporunun ham JSON'u — JSON.parse ile PetReportResult'a çevrilir. */
  aiReport: string | null;
  aiReportAt: string | null;
  /** Vet panelindeki müşteri/hayvan listesi özeti. */
  treatmentNoteCount: number;
  lastTreatmentAt: string | null;
};

export type PetUpsertPayload = {
  name: string;
  species: Species;
  breed?: string;
  gender?: Gender;
  ageGroup?: AgeGroup;
  birthDate?: string;
  sterilized?: boolean;
  microchipNumber?: string;
  chronicConditions?: string;
  allergies?: string;
  photo?: File;
  extraPhotos?: File[];
};

export type NoteAuthorType = "VET" | "OWNER";

export type PetVaccination = {
  id: number;
  vaccineName: string;
  administeredDate: string;
  nextDueDate: string | null;
  notes: string | null;
  recordedByName: string | null;
  createdAt: string;
};

export type AddVaccinationPayload = {
  vaccineName: string;
  administeredDate: string;
  nextDueDate?: string;
  notes?: string;
};

export type PetWeightLog = {
  id: number;
  weightKg: number;
  recordedAt: string;
};

export type AddWeightLogPayload = {
  weightKg: number;
  recordedAt: string;
};

export type VetCustomerRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

/** Backend karşılığı: dto/vetcustomer/VetCustomerRequestResponse. */
export type VetCustomerRequestResponse = {
  id: number;
  requesterId: number;
  requesterName: string;
  status: VetCustomerRequestStatus;
  createdAt: string;
};

/** Backend karşılığı: dto/vetcustomer/VetCustomerResponse -- ACCEPTED durumdaki istekler. */
export type VetCustomerResponse = {
  id: number;
  requesterId: number;
  requesterName: string;
  status: VetCustomerRequestStatus;
  createdAt: string;
};

/** Backend karşılığı: dto/pet/PetTreatmentNoteResponse. */
export type PetTreatmentNoteResponse = {
  id: number;
  content: string;
  vetName: string;
  authorType: NoteAuthorType;
  /** Çağıran bu notun ORİJİNAL yazarı mı — öyleyse düzenle/sil gösterilebilir. */
  canEdit: boolean;
  createdAt: string;
};

// ==========================================
// 8. Potential Match Types (/api/me/potential-matches)
// ==========================================

export type PotentialMatchStatus =
  | "PENDING"
  | "NOTIFIED"
  | "VIEWED"
  | "REJECTED"
  | "CONFIRMED"
  | "EXPIRED"
  | "NOTIFICATION_FAILED";

export type PotentialMatchCounterparty = {
  kind: "AD" | "EXTERNAL";
  id: number;
  title?: string | null;
  photoUrl?: string | null;
  adType?: AdType | null;
  category?: "LOST" | "FOUND" | "ADOPTION" | "IRRELEVANT" | "UNCERTAIN" | null;
  species?: string | null;
  breed?: string | null;
  sourceUrl?: string | null;
};

export type PotentialMatchSummaryResponse = {
  recipientId: number;
  matchId: number;
  status: PotentialMatchStatus;
  finalScore: number;
  createdAt: string; // ISO-8601 UTC
  counterparty: PotentialMatchCounterparty;
};

export type PotentialMatchDecision = "CONFIRMED" | "REJECTED";

// ==========================================
// 9. User Online Status Types (/api/users/{userId}/status)
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

// ==========================================
// 10. Realtime Notification Event (/user/queue/notifications)
// ==========================================

export type WsNotificationEvent = {
  id: number | string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
};

// ==========================================
// 11. POI Types (/api/public/pois) — veteriner, petshop, barınak
// ==========================================

export type PoiType = "VETERINARY" | "PET_SHOP" | "SHELTER";

export type PoiSource = "OSM" | "MANUAL" | "PLATFORM";

export type PoiResponse = {
  id: number;
  type: PoiType;
  name: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  phone: string | null;
  openingHours: string | null;
  source: PoiSource;
  /** `source === "PLATFORM"` iken ilgili VetClinic/PetShop/Shelter'ın kendi kimliği -- "Hizmete Git" bağlantısı için. OSM/MANUAL noktalarda null. */
  refId: number | null;
};

// ==========================================
// 12. Petshop Types (/api/petshop/**, /api/petshops/**, /api/petshop-products/**)
// ==========================================

/**
 * Backend karşılığı: dto/petshop/PetShopResponse (kendi kartı, GET/PUT
 * /api/petshop/card). `VetClinicResponse`'un aynısı eksi `animalTypes`.
 * Dükkan seviyesinde puanlama eklendi -- `ShelterResponse` ile AYNI desen
 * (`averageRating`/`reviewCount`), ürün bazlı puanlamadan (`PetShopProductResponse`)
 * BAĞIMSIZ.
 */
export type PetShopResponse = {
  id: number;
  name: string;
  address: string;
  city: string;
  district: string | null;
  phone: string;
  workingHours: string | null;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Yorum yoksa `null` -- 0.0 DEĞİL, "henüz değerlendirme yok" ayırt edilebilsin diye. */
  averageRating: number | null;
  reviewCount: number;
};

/**
 * Backend karşılığı: dto/petshop/PetShopPublicResponse (herkese açık
 * dizin, GET /api/petshops ve GET /api/petshops/{id}). `vetUserId`'nin
 * karşılığı YOK: dizin kartından hedeflenen bir "müşteri isteği" eylemi
 * yok (YAGNI, plan §5).
 */
export type PetShopPublicResponse = {
  id: number;
  name: string;
  address: string;
  city: string;
  district: string | null;
  phone: string;
  workingHours: string | null;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Yorum yoksa `null` -- 0.0 DEĞİL, "henüz değerlendirme yok" ayırt edilebilsin diye. */
  averageRating: number | null;
  reviewCount: number;
};

export type PetShopUpsertPayload = {
  name: string;
  address: string;
  city: string;
  district?: string;
  phone: string;
  workingHours?: string;
  photo?: File;
  latitude?: number;
  longitude?: number;
};

/**
 * Backend karşılığı: dto/petshop/PetShopProductResponse. `petShopId` --
 * dükkan detay sayfasından ürün detay/inceleme sayfasının rotasını
 * (`/hizmetler/petshop/{shopId}/urun/{productId}`) kurmak için gerekli.
 */
export type PetShopProductResponse = {
  id: number;
  petShopId: number;
  name: string;
  description: string | null;
  price: number;
  photoUrl: string | null;
  /** Yorum yoksa `null` -- 0.0 DEĞİL, "henüz değerlendirme yok" ayırt edilebilsin diye. */
  averageRating: number | null;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PetShopProductUpsertPayload = {
  name: string;
  description?: string;
  price: number;
  photo?: File;
};

/** Backend karşılığı: dto/petshop/PetShopReviewResponse (dükkan seviyesi -- ürün YORUMU DEĞİL). */
export type PetShopReviewResponse = {
  id: number;
  authorId: number;
  authorName: string;
  rating: number;
  comment: string | null;
  /** Çağıran bu yorumun yazarı mı -- öyleyse düzenle/sil gösterilebilir. */
  canEdit: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Backend karşılığı: dto/petshop/PetShopReviewUpsertRequest
 * (PUT /api/petshops/{id}/reviews/me).
 */
export type PetShopReviewUpsertPayload = {
  rating: number;
  comment?: string;
};

/** Backend karşılığı: dto/petshop/PetShopProductReviewResponse. */
export type PetShopProductReviewResponse = {
  id: number;
  authorId: number;
  authorName: string;
  rating: number;
  comment: string | null;
  /** Çağıran bu yorumun yazarı mı -- öyleyse düzenle/sil gösterilebilir. */
  canEdit: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Backend karşılığı: dto/petshop/PetShopProductReviewUpsertRequest
 * (PUT /api/petshop-products/{id}/reviews/me).
 */
export type PetShopProductReviewUpsertPayload = {
  rating: number;
  comment?: string;
};

/** Backend karşılığı: dto/admin/CreatePetShopAccountRequest. */
export type CreatePetShopAccountPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

// ==========================================
// 13. Barınak Types (/api/shelter/**, /api/shelters/**)
// ==========================================

/**
 * Backend karşılığı: dto/shelter/ShelterResponse (kendi kartı, GET/PUT
 * /api/shelter/card). `PetShopResponse`'un aynısı + `averageRating`/
 * `reviewCount` -- Petshop'un aksine barınakta VetClinic gibi barınak
 * seviyesinde puanlama VAR (plan "Bilinçli kapsam sınırları").
 */
export type ShelterResponse = {
  id: number;
  name: string;
  address: string;
  city: string;
  district: string | null;
  phone: string;
  workingHours: string | null;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Yorum yoksa `null` -- 0.0 DEĞİL, "henüz değerlendirme yok" ayırt edilebilsin diye. */
  averageRating: number | null;
  reviewCount: number;
};

/**
 * Backend karşılığı: dto/shelter/ShelterPublicResponse (herkese açık dizin,
 * GET /api/shelters ve GET /api/shelters/{id}). `PetShopPublicResponse` gibi
 * sahip-hedefli bir alan YOK -- barınak kartından yönlendirilecek bir
 * "müşteri isteği" eylemi yok (plan §10).
 */
export type ShelterPublicResponse = {
  id: number;
  name: string;
  address: string;
  city: string;
  district: string | null;
  phone: string;
  workingHours: string | null;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  averageRating: number | null;
  reviewCount: number;
};

export type ShelterUpsertPayload = {
  name: string;
  address: string;
  city: string;
  district?: string;
  phone: string;
  workingHours?: string;
  photo?: File;
  latitude?: number;
  longitude?: number;
};

/** Backend karşılığı: dto/shelter/ShelterReviewResponse. */
export type ShelterReviewResponse = {
  id: number;
  authorId: number;
  authorName: string;
  rating: number;
  comment: string | null;
  /** Çağıran bu yorumun yazarı mı -- öyleyse düzenle/sil gösterilebilir. */
  canEdit: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Backend karşılığı: dto/shelter/ShelterReviewUpsertRequest
 * (PUT /api/shelters/{id}/reviews/me).
 */
export type ShelterReviewUpsertPayload = {
  rating: number;
  comment?: string;
};

/** Backend karşılığı: dto/admin/CreateShelterAccountRequest. */
export type CreateShelterAccountPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};
