# tools/

## sayfa-denetcisi.py

Uygulamanın **durum haritasını koddan üretir**. Elle tutulan bir liste değil;
her çalıştırdığında o anki koda bakar ve hangi sürümü ölçtüğünü çıktıya damgalar.

### Neden var

Bu depoda aynı sayfanın birden fazla kopyası bulunabiliyor: depo kökünde dolu
bir sürüm, `client/src/pages` altında kısa bir iskelet, bir de açık bir PR'ın
içinde. Uygulamanın gerçekten çalıştırdığı hangisi olduğu dosyaya bakınca
anlaşılmıyor — ve bu yüzden bir kez emek çalışmayan bir kopyaya gitti.

Benzer şekilde bazı sayfalarda gönderim kodu yorum satırının içinde duruyor.
Dosyada `fetch` geçiyor ama hiç çalışmıyor. Düz arama bunu ayırt edemiyor.

Betik ikisini de ayırt eder.

### Kullanım

```bash
# En basit hâli — yalnız frontend
python tools/sayfa-denetcisi.py .

# Backend de verilirse: sayfanın çağırdığı adres backend'de var mı, ve
# hangi backend adresini hiçbir sayfa çağırmıyor
python tools/sayfa-denetcisi.py . --backend ../PATIMATI---BACKEND

# AI servisi de eklenebilir
python tools/sayfa-denetcisi.py . --backend ../PATIMATI---BACKEND --ai ../PATIMATI-AI

# Makine tarafından okunabilir çıktı (günler arası fark almak için)
python tools/sayfa-denetcisi.py . --json durum.json
```

Python 3 dışında bir şey gerekmez; hiçbir paket kurmuyor, ağa çıkmıyor,
hiçbir dosyayı değiştirmiyor.

### Ne söyler

| Başlık | Ne demek |
|---|---|
| `CALISIYOR` | Sayfa gerçekten backend'e istek atıyor |
| `TASLAK` | Gönderim kodu yorum içinde ya da yerine sahte bir bekleme var — istek gitmiyor |
| `ISKELET` | Gövdesi tek bir `<h1>`, içi doldurulmamış |
| `SAHTE VERI` | Ekran dolu ama veri kodun içine yazılmış |
| `STATIK` | Sabit içerik, sorun değil |
| Rotası olmayan bağlantı | Arayüzde tıklanabiliyor ama `App.tsx`'te karşılığı yok → 404 |
| Erişilemeyen sayfa dosyası | Dosya var ama uygulamada açılamıyor |
| Çağrılmayan backend ucu | Backend'de var, hiçbir sayfa kullanmıyor |

### `--sinav`

```bash
python tools/sayfa-denetcisi.py . --backend ../PATIMATI---BACKEND --sinav
```

Betiği **elle doğrulanmış gözlemlerle sınar**. Bir satır tutmuyorsa önce
betikten şüphelen — harita değil o düzeltilir. İlk sürümünde bu sınav betiğin
kendi üç hatasını yakaladı (taslak sayfalar dış servis sanılmıştı, servis
katmanı üzerinden giden sayfalar "hiçbir yere gitmiyor" görünüyordu,
`/api/auth/me` "çağrılmıyor" sayılıyordu).

Bir sayfa **meşru biçimde** düzeltildiğinde beklenti bilerek güncellenir ve
sebebi `BEKLENEN` listesinin yanına yazılır. Böylece "bu neden değişti"
sorusu cevapsız kalmaz.

Çıkış kodu: sınav geçerse `0`, kalırsa `1`.
