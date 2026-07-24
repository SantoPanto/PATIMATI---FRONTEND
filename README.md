# PATIMATI — Frontend

Kedi ve köpekler için kayıp-bulunan takip, AI kamera tanıma ve sahiplenme platformu frontend uygulaması.

## Teknoloji Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Routing:** Wouter
- **Form Management:** React Hook Form + Zod
- **Animations:** Framer Motion
- **Maps:** Google Maps (JavaScript API)
- **Icons:** Lucide React

## Proje Yapısı

```
client/src/
├── App.tsx                  # Ana routing ve layout
├── index.css                # Global tema (sıcak toprak tonları)
├── const.ts                 # Sabitler ve mock veriler
├── types/                   # TypeScript tip tanımları
├── contexts/                # React Context (auth, kullanıcı verileri)
├── hooks/                   # Custom React hooks
├── lib/                     # Yardımcı fonksiyonlar
├── components/              # Paylaşımlı UI bileşenleri
│   ├── BottomNav.tsx        # Alt navigasyon (5 sekme)
│   ├── PawLogo.tsx          # Pattymaty logo bileşeni
│   ├── PetCard.tsx          # Hayvan kartı bileşeni
│   ├── PattyButton.tsx      # Özelleştirilmiş buton
│   ├── Loading.tsx          # Yükleme animasyonu
│   └── Modal.tsx            # Modal pencere
├── pages/                   # Tüm ekran sayfaları
│   ├── LoginPage.tsx        # Giriş/Kayıt ekranı
│   ├── HomePage.tsx         # Ana sayfa (Sahiplen + Kayıp/Bulunan + AI Kamera)
│   ├── MapPage.tsx          # Harita (Google Maps + interaktif pin'ler)
│   ├── ListingsPage.tsx     # İlan listesi (filtreleme + sıralama)
│   ├── PetDetailPage.tsx    # Hayvan detay sayfası
│   ├── ChatPage.tsx         # Sohbet/mesajlaşma
│   ├── ProfilePage.tsx      # Kullanıcı profili
│   └── AddListingPage.tsx   # Yeni ilan oluşturma
└── pages/NotFound.tsx       # 404 sayfası
```

## Kurulum

```bash
npm install
npm run dev
```

## Geliştirme Durumu

### 1. Hafta (Tamamlandı)
- [x] Temel altyapı: React + TypeScript + Tailwind CSS kurulumu
- [x] Sıcak toprak tonlarında tema (amber, krem, kahve)
- [x] Quicksand + Nunito tipografi sistemi
- [x] Stack/Tab navigasyon (Ana Sayfa, Harita, Ekle, Sohbet, Profil)
- [x] Button, Input, PetCard, Loading, EmptyState bileşenleri
- [x] Giriş, ana sayfa ve ilan listesi taslakları

### 2. Hafta (Tamamlandı)
- [x] Giriş ve Guest akışı
- [x] Ana sayfa (Sahiplen/Kayıp-Bulunan sekmeleri)
- [x] İlan listesi ve ilan detayı
- [x] İlan oluşturma formu (fotoğraf yükleme, hayvan bilgileri)
- [x] Harita ekranı (Google Maps, interaktif pin popup'ları)
- [x] Profil ve ilanlarım ekranı
- [x] Tüm ekranlar mock data ile çalışır durumda

### 3. Hafta (Devam Ediyor)
- [ ] Axios client ve token yönetimi (Backend hazır olduğunda)
- [ ] TanStack Query entegrasyonu
- [ ] Auth, ilan, profil ve harita API entegrasyonu
- [ ] AI eşleşme sonuçlarının gerçek API'ye bağlanması
- [ ] Mesajlaşma arayüzü ve WebSocket bağlantısı
- [ ] Form doğrulama (Zod validasyonu hazır)
- [ ] Konum alma ve filtreleme

### 4. Hafta (Planlandı)
- [ ] Bildirim ekranı
- [ ] İlan raporlama arayüzü
- [ ] Sahiplendirme modülü
- [ ] Loading, hata ve boş durumlar
- [ ] Mobil uyumluluk ve UI/UX düzenlemeleri
- [ ] Entegrasyon testleri ve bug düzeltmeleri
- [ ] Demo senaryosu ve final build

## Önemli Notlar

- Backend API henüz hazır olmadığı için tüm veriler mock data (yerel React state) ile yönetilmektedir
- Backend hazır olduğunda, `AppContext.tsx` dosyasındaki mock fonksiyonlar gerçek axios API çağrılarına dönüştürülecektir
- AI servisi henüz hazır olmadığı için kamera tanıma ekranı simülasyon modunda çalışmaktadır
- Planlanan yaklaşım: Önce mock data ile geliştirme → Backend hazır olunca API entegrasyonu
