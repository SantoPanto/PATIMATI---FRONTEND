# PATIMATI Design System

Bu doküman, PATIMATI frontend projesinde kullanılacak ortak tasarım kurallarını tanımlar.  
Tüm ekranlar ve ortak bileşenler bu standartlara uygun geliştirilmelidir.

---

## 1. Renk Paleti

### Ana Renkler

- Primary: #F97316
- Primary Hover: #EA580C
- Primary Light: #FFF7ED
- Secondary: #3B82F6
- Secondary Hover: #2563EB
- Secondary Light: #EFF6FF

### Arka Plan Renkleri

- Background: #F8FAFC
- Surface: #FFFFFF
- Surface Secondary: #F1F5F9
- Overlay: rgba(15, 23, 42, 0.40)

### Metin Renkleri

- Text Primary: #0F172A
- Text Secondary: #64748B
- Text Muted: #94A3B8
- Text Inverse: #FFFFFF

### Kenarlık Renkleri

- Border: #E2E8F0
- Border Strong: #CBD5E1
- Divider: #E2E8F0

### Durum Renkleri

- Success: #22C55E
- Success Light: #F0FDF4
- Warning: #F59E0B
- Warning Light: #FFFBEB
- Error: #EF4444
- Error Light: #FEF2F2
- Info: #3B82F6
- Info Light: #EFF6FF

---

## 2. Tipografi

### Font Ailesi

- Primary Font: Inter, sans-serif
- Fallback: Arial, sans-serif

### Başlıklar

- H1: 32px / 40px / Bold
- H2: 24px / 32px / Bold
- H3: 20px / 28px / Semibold
- H4: 18px / 24px / Semibold

### Metinler

- Body Large: 18px / 28px / Regular
- Body: 16px / 24px / Regular
- Small: 14px / 20px / Regular
- Caption: 12px / 16px / Regular

### Font Ağırlıkları

- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Tipografi Kuralları

- Ana başlıklarda H1 veya H2 kullanılmalıdır.
- Kart başlıklarında H3 veya H4 kullanılmalıdır.
- Açıklama metinlerinde Body veya Small kullanılmalıdır.
- Yardımcı metinlerde Caption kullanılmalıdır.
- Metinlerde gereksiz büyük harf kullanımından kaçınılmalıdır.

---

## 3. Boşluk Sistemi

Tüm boşluk değerleri 4px tabanlı sistemle kullanılmalıdır.

- 4px
- 8px
- 12px
- 16px
- 20px
- 24px
- 32px
- 40px
- 48px
- 64px

### Kullanım Kuralları

- Sayfa yatay boşluğu: 16px
- Kart iç boşluğu: 16px
- Form alanları arası boşluk: 16px
- Bölümler arası boşluk: 24px veya 32px
- İkon ve metin arası boşluk: 8px
- Kartlar arası boşluk: 16px

---

## 4. Border Radius

- Extra Small: 4px
- Small: 8px
- Medium: 12px
- Large: 16px
- Extra Large: 24px
- Full: 9999px

### Kullanım Kuralları

- Input: 12px
- Button: 12px
- Card: 16px
- Modal: 16px
- Avatar ve badge: Full

---

## 5. Gölge Sistemi

- Shadow Small: Kartlar ve küçük yüzeyler
- Shadow Medium: Dropdown ve açılır menüler
- Shadow Large: Modal ve önemli katmanlar

### Tailwind Karşılıkları

- Kart: shadow-sm
- Dropdown: shadow-md
- Modal: shadow-xl

### Kurallar

- Butonlarda varsayılan olarak gölge kullanılmaz.
- Gereksiz yoğun gölge kullanımından kaçınılmalıdır.
- Aynı ekranda farklı gölge seviyeleri sınırlı tutulmalıdır.

---

## 6. İkon Kuralları

- İkon kütüphanesi: Lucide React
- Küçük ikon: 16px
- Standart ikon: 20px
- Büyük ikon: 24px
- Özel büyük ikon: 32px

### Kullanım Kuralları

- Navigasyon ikonları: 24px
- Buton içi ikonlar: 18px veya 20px
- Input ikonları: 20px
- İkon ve metin arası boşluk: 8px
- Standart arayüzde emoji yerine Lucide React ikonları kullanılmalıdır.
- Emoji yalnızca boş durum veya bilgilendirici içeriklerde kullanılabilir.

---

## 7. Button Kuralları

### Yükseklikler

- Small: 36px
- Medium: 44px
- Large: 48px

### Varyantlar

- Primary
- Secondary
- Outline
- Ghost
- Danger

### Kurallar

- Ana aksiyon için Primary kullanılmalıdır.
- İkincil aksiyon için Secondary veya Outline kullanılmalıdır.
- Silme işlemleri için Danger kullanılmalıdır.
- Aynı alanda birden fazla Primary buton kullanılmamalıdır.
- Buton metinleri kısa ve aksiyon odaklı olmalıdır.
- Loading durumunda buton devre dışı bırakılmalıdır.

---

## 8. Input Kuralları

- Standart yükseklik: 48px
- Border radius: 12px
- Yatay padding: 16px
- Label ve input arası boşluk: 8px
- Inputlar tam genişlikte kullanılmalıdır.

### Durumlar

- Default
- Focus
- Disabled
- Error
- Success

### Kurallar

- Her input mümkünse label ile kullanılmalıdır.
- Placeholder, label yerine kullanılmamalıdır.
- Hata mesajı input altında gösterilmelidir.
- Hata rengi Error rengi olmalıdır.
- Disabled alanlar görsel olarak ayırt edilmelidir.

---

## 9. Card Kuralları

- Background: Surface
- Border: Border
- Border radius: 16px
- Padding: 16px
- Shadow: shadow-sm

### Kurallar

- Kart başlığı, açıklaması ve aksiyonları düzenli hizalanmalıdır.
- Kart içeriğinde gereksiz yoğunluk oluşturulmamalıdır.
- Tıklanabilir kartlarda hover veya active durumu bulunmalıdır.
- Kartlar arasında 16px boşluk kullanılmalıdır.

---

## 10. Modal Kuralları

- Maksimum genişlik: 448px
- Mobil yatay boşluk: 16px
- Border radius: 16px
- Overlay: rgba(15, 23, 42, 0.40)
- Shadow: shadow-xl

### Kurallar

- Modal başlığı görünür olmalıdır.
- Kapatma ikonu sağ üstte bulunmalıdır.
- Escape tuşu ile kapanmalıdır.
- Overlay alanına tıklama davranışı tasarıma göre belirlenmelidir.
- Kritik işlemlerde onay modalı kullanılmalıdır.

---

## 11. Navigasyon Kuralları

### Bottom Navigation

- Mobil ekranlarda kullanılmalıdır.
- Standart ikon boyutu: 24px
- Aktif sekme Primary rengi kullanmalıdır.
- Pasif sekme Text Muted rengini kullanmalıdır.
- Menü elemanı sayısı 3–5 arasında olmalıdır.

### Header

- Sayfa başlığı açıkça gösterilmelidir.
- Geri butonu gerektiğinde sol tarafta bulunmalıdır.
- Sağ tarafta en fazla 1–2 aksiyon kullanılmalıdır.

---

## 12. Responsive Kuralları

- Mobil öncelikli geliştirme yapılmalıdır.
- Minimum ekran genişliği: 320px
- Mobil yatay boşluk: 16px
- Tablet yatay boşluk: 24px
- Masaüstü yatay boşluk: 32px
- Maksimum içerik genişliği: 1200px

### Breakpointler

- Mobile: 320px–639px
- Tablet: 640px–1023px
- Desktop: 1024px ve üzeri

### Kurallar

- İçerik küçük ekranlarda yatay taşmamalıdır.
- Butonlar mobilde gerektiğinde tam genişlikte kullanılmalıdır.
- Grid yapısı ekran genişliğine göre uyarlanmalıdır.
- Metinler okunabilirliğini kaybetmemelidir.

---

## 13. Erişilebilirlik Kuralları

- Renk kontrastları yeterli olmalıdır.
- Tüm inputların label alanı bulunmalıdır.
- İkon butonlarda aria-label kullanılmalıdır.
- Klavye ile erişim desteklenmelidir.
- Focus durumu görünür olmalıdır.
- Sadece renk ile anlam aktarılmamalıdır.

---

## 14. Dosya ve Component İsimlendirme

### Componentler

- PascalCase kullanılmalıdır.
- Örnek:
  - PatimatiButton.tsx
  - PetCard.tsx
  - BottomNav.tsx

### Hooklar

- use ile başlamalıdır.
- Örnek:
  - useAuth.ts
  - useListings.ts

### Servisler

- camelCase kullanılmalıdır.
- Örnek:
  - api.ts
  - authService.ts
  - listingService.ts

### Sabitler

- Büyük harf ve alt çizgi kullanılmalıdır.
- Örnek:
  - API_BASE_URL
  - MAX_FILE_SIZE

---

## 15. Ortak Component Listesi

İlk aşamada hazırlanacak ortak componentler:

- Button
- Input
- Textarea
- Select
- Card
- Modal
- Loading
- Badge
- EmptyState
- BottomNav
- PageHeader
- Avatar

---

## 16. Figma Uyumluluk Kuralı

- Kodda kullanılacak renkler Figma’daki renklerle aynı olmalıdır.
- Font boyutları Figma’dan kontrol edilmelidir.
- Border radius değerleri Figma ile eşleşmelidir.
- Spacing değerleri Figma’daki Auto Layout ölçülerine göre alınmalıdır.
- Component varyantları Figma’daki component varyantlarıyla eşleşmelidir.
- Tasarım ile kod arasında farklılık varsa ekip ile görüşülmeden rastgele değer kullanılmamalıdır.