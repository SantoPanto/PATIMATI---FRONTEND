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
  latitude: number;
  longitude: number;
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
export type Species = "CAT" | "DOG";
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
  | "YELLOW"
  | "BEIGE"
  | "OTHER";

export type CoatPattern =
  | "SOLID"
  | "BICOLOR"
  | "TRICOLOR"
  | "TABBY"
  | "SPOTTED"
  | "HARLEQUIN"
  | "OTHER";

export type StatusEnum = "PRESENT" | "ABSENT" | "UNKNOWN";

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
  collarStatus: StatusEnum;
  collarColor?: string;
  collarTagText?: string;
  eyeColor?: string;
  earTagStatus: StatusEnum;
  earNotchStatus: StatusEnum;
  microchipNumber?: string;
  lostDate?: string; // YYYY-MM-DD
  distinctiveMarks?: string;
  latitude: number;
  longitude: number;
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
  collarStatus: StatusEnum;
  collarColor?: string;
  collarTagText?: string;
  eyeColor?: string;
  earTagStatus: StatusEnum;
  earNotchStatus: StatusEnum;
  microchipped: boolean;
  lostDate?: string;
  distinctiveMarks?: string;
  photoUrls: string[];
  latitude: number | null;
  longitude: number | null;
  ownerId: number;
  ownerDisplayName: string;
  active: boolean;
  createdAt: string; // ISO-8601 UTC
  updatedAt: string; // ISO-8601 UTC
  aiStatus?: string;
  aiIsPet?: boolean;
};

export type ResolveLostAdRequest = {
  finderId?: number;
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
};

export type AdoptionAdUpdateRequest = Partial<AdoptionAdCreateRequest>;

export type ResolveAdoptionAdRequest = {
  adopterId?: number;
};

// ==========================================
// 4. Messaging & Chat Types (/api/messages)
// ==========================================

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
};

// ==========================================
// 5. Complaint Types (/api/complaints)
// ==========================================

export type ComplaintReason =
  | "SAHTE_ILAN"
  | "UYGUNSUZ_ICERIK"
  | "DOLANDIRICILIK"
  | "KOTU_DIL_KULLANIMI"
  | "DIGER"
  | "SPAM"
  | "INAPPROPRIATE_CONTENT"
  | "FRAUD"
  | "OTHER";

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
  status: "PENDING" | "RESOLVED" | "REJECTED" | string;
  createdAt: string; // ISO-8601 UTC
};

// ==========================================
// 6. Admin Panel Types (/api/admin/*)
// ==========================================

export type UserDetailForAdminDTO = UserResponseDTO & {
  banned?: boolean;
  createdAt?: string;
};

export type AdComplaintAdminResponse = ComplaintResponse & {
  adTitle?: string;
};

export type UserComplaintAdminResponse = ComplaintResponse & {
  reportedUserEmail?: string;
};

export type AdoptionComplaintAdminResponse = ComplaintResponse & {
  adoptionTitle?: string;
};

// ==========================================
// 7. Potential Match Types (/api/me/potential-matches)
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
