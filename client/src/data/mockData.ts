export type ListingType = "Sahiplendirme" | "Kayıp" | "Bulunan";
export type ListingStatus = "Aktif" | "Beklemede" | "Reddedildi";

export interface PetListing {
  id: string;
  title: string;
  type: ListingType;
  species: string;
  age: string;
  location: string;
  description: string;
  image: string;
  owner: string;
  distance: string;
  status: ListingStatus;
  contact: string;
  lastSeen?: string;
}

export interface Complaint {
  id: string;
  title: string;
  category: string;
  detail: string;
  status: "Bekliyor" | "İnceleniyor" | "Çözüldü";
  createdAt: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: "Kullanıcı" | "Admin" | "Moderatör";
  status: "Aktif" | "Beklemede" | "Engelli";
  joinedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

export interface ChatThread {
  id: string;
  name: string;
  role: string;
  preview: string;
  time: string;
  unread: number;
  image: string;
}

export const petListings: PetListing[] = [
  {
    id: "pet-1",
    title: "Minnoş",
    type: "Sahiplendirme",
    species: "Kedi",
    age: "2 yaşında",
    location: "Kadıköy, İstanbul",
    description: "Yakın zamanda aşısı yapılmış, çok uyumlu bir yavru kedi.",
    image: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=900&q=80",
    owner: "Elif Y.",
    distance: "1.2 km",
    status: "Aktif",
    contact: "0555 123 45 67",
  },
  {
    id: "pet-2",
    title: "Badem",
    type: "Kayıp",
    species: "Köpek",
    age: "4 yaşında",
    location: "Beşiktaş",
    description: "Sarı-turuncu tasmalı, kahverengi bir köpek.",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80",
    owner: "Mert K.",
    distance: "3.4 km",
    status: "Aktif",
    contact: "0555 678 12 34",
    lastSeen: "Akatlar, 14:30",
  },
  {
    id: "pet-3",
    title: "Pufi",
    type: "Bulunan",
    species: "Kedi",
    age: "8 aylık",
    location: "Şişli",
    description: "Kırmızı kedi tasmasıyla bulundu. Sahibi aranıyor.",
    image: "https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=900&q=80",
    owner: "Patimati Ekibi",
    distance: "2.8 km",
    status: "Beklemede",
    contact: "0212 555 66 77",
  },
];

export const complaints: Complaint[] = [
  {
    id: "c-1",
    title: "Yanlış ilan bilgisi",
    category: "İlan",
    detail: "İlan açıklaması ile fotoğraf eşleşmiyor.",
    status: "Bekliyor",
    createdAt: "2 saat önce",
  },
  {
    id: "c-2",
    title: "Spam mesaj",
    category: "Mesaj",
    detail: "Tekrar eden reklam içerikli mesaj gönderildi.",
    status: "İnceleniyor",
    createdAt: "Dün",
  },
];

export const users: AppUser[] = [
  {
    id: "u-1",
    name: "Elif Yılmaz",
    email: "elif@example.com",
    role: "Kullanıcı",
    status: "Aktif",
    joinedAt: "2 ay önce",
  },
  {
    id: "u-2",
    name: "Aylin Demir",
    email: "aylin@example.com",
    role: "Admin",
    status: "Aktif",
    joinedAt: "6 ay önce",
  },
  {
    id: "u-3",
    name: "Can Arslan",
    email: "can@example.com",
    role: "Moderatör",
    status: "Beklemede",
    joinedAt: "3 hafta önce",
  },
];

export const notifications: NotificationItem[] = [
  {
    id: "n-1",
    title: "Yeni mesaj",
    message: "Badem için yeni bir cevap geldi.",
    time: "10 dk önce",
    unread: true,
  },
  {
    id: "n-2",
    title: "İlan güncellendi",
    message: "Minnoş ilanı güncellendi.",
    time: "1 saat önce",
    unread: false,
  },
];

export const chatThreads: ChatThread[] = [
  {
    id: "ch-1",
    name: "Elif Y.",
    role: "İlan sahibi",
    preview: "Minnoş ile ilgili randevu ayarlayalım mı?",
    time: "10:12",
    unread: 2,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "ch-2",
    name: "Mert K.",
    role: "Sahip",
    preview: "Badem için son konum bilgisi paylaştım.",
    time: "Dün",
    unread: 0,
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
  },
];
