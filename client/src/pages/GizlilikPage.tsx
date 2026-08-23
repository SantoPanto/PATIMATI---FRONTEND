import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";

/**
 * Gizlilik Politikası / KVKK aydınlatma sayfası.
 *
 * Kayıt formundaki "gizlilik politikasını kabul ediyorum" onayının işaret
 * ettiği metin BUDUR — bu sayfa eklenmeden önce onay kutusu hiçbir yere
 * bağlanmıyordu, kullanıcı okuyamadığı bir metni kabul ediyordu.
 *
 * İçerik yalnız ürünün BUGÜN gerçekten yaptığı işlemeyi anlatır; burada
 * yazan her davranış üründe karşılığı olan bir özelliktir. Yeni bir veri
 * işleme özelliği eklenirse bu sayfa da aynı değişiklikte güncellenmelidir.
 */

function Bolum({ baslik, children }: { baslik: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-xl font-bold text-[#0F172A] sm:text-2xl dark:text-slate-50">{baslik}</h2>
      <div className="mt-3 space-y-3 text-base leading-7 text-[#475569] dark:text-slate-400">
        {children}
      </div>
    </section>
  );
}

export default function GizlilikPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      <Header />

      <main>
        <section className="border-b border-[#E2E8F0] bg-gradient-to-br from-[#FFF7ED] via-white to-[#EFF6FF]">
          <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#FED7AA] bg-white px-4 py-2 text-sm font-bold text-[#F97316]">
              <ShieldCheck size={16} />
              KVKK aydınlatması
            </span>

            <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
              Gizlilik Politikası
            </h1>

            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#64748B]">
              Bu sayfa PATIMATI kullanırken hangi verilerinizin, ne amaçla ve
              nasıl işlendiğini açıklar. Son güncelleme: 22 Ağustos 2026.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[900px] px-4 py-12 sm:px-6 lg:px-8">
          <article className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-10 dark:border-slate-800 dark:bg-slate-900">
            <Bolum baslik="Biz kimiz?">
              <p>
                PATIMATI (patimati.me), kayıp ve bulunan hayvanlar ile
                sahiplendirilecek hayvanları doğru kişilerle buluşturmayı
                amaçlayan, kâr amacı gütmeyen bir topluluk platformudur.
                Kişisel verileriniz 6698 sayılı Kişisel Verilerin Korunması
                Kanunu (KVKK) kapsamında, yalnızca aşağıda açıklanan amaçlarla
                işlenir.
              </p>
            </Bolum>

            <Bolum baslik="Hangi verileri topluyoruz?">
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Hesap bilgileri:</strong> ad-soyad, e-posta adresi ve
                  şifreniz. Şifreniz düz metin olarak saklanmaz.
                </li>
                <li>
                  <strong>İlan içerikleri:</strong> yüklediğiniz hayvan
                  fotoğrafları; tür, cins, renk gibi tanımlar; yazdığınız
                  açıklama metni.
                </li>
                <li>
                  <strong>Konum bilgisi:</strong> ilan verirken paylaştığınız
                  il/ilçe beyanı ve — izin verirseniz cihaz konumunuzdan, ya da
                  elle girişinizden — harita koordinatı. Konum izni vermek
                  zorunda değilsiniz; koordinatı elle de girebilirsiniz.
                </li>
                <li>
                  <strong>Mesajlar:</strong> uygulama içindeki yazışmalarınız,
                  iki tarafın da konuşmayı görebilmesi için saklanır.
                </li>
                <li>
                  <strong>Teknik veriler:</strong> oturumunuzu açık tutan
                  kimlik bilgisi tarayıcınızın yerel deposunda tutulur;
                  bildirimlere izin verirseniz tarayıcınıza ait bir bildirim
                  adresi (jeton) kaydedilir.
                </li>
              </ul>
            </Bolum>

            <Bolum baslik="Verilerinizi ne için kullanıyoruz?">
              <ul className="list-disc space-y-2 pl-5">
                <li>İlanınızı yayınlamak, aramalarda ve haritada göstermek.</li>
                <li>
                  <strong>Yapay zekâ ile eşleştirme:</strong> ilan
                  fotoğraflarınız, kayıp ve bulunan hayvanları birbirine
                  benzerliklerine göre eşleştirebilmek için otomatik olarak
                  analiz edilir (görsel özet ve tür/cins/renk etiketleri
                  çıkarılır). Bu analiz yalnız eşleştirme amacıyla yapılır.
                </li>
                <li>Olası eşleşmelerde ve mesajlarda size bildirim göndermek.</li>
                <li>
                  Şikâyetleri değerlendirmek ve platformu kötüye kullanıma
                  karşı korumak.
                </li>
              </ul>
            </Bolum>

            <Bolum baslik="Kimler görebilir, kimlerle paylaşılır?">
              <p>
                İlan fotoğraflarınız, ilan açıklamanız ve ilanın konumu —
                ilanın amacı gereği — sitedeki herkese açık görünür. Bu yüzden
                açıklama ve fotoğraflarda ev adresi gibi hassas ayrıntıları
                paylaşmamanızı öneririz.
              </p>
              <p>
                Verileriniz reklam veya pazarlama amacıyla üçüncü taraflara
                satılmaz ve aktarılmaz. Hizmetin çalışması için sınırlı
                paylaşım yapılan altyapılar şunlardır:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Google Firebase:</strong> tarayıcı bildirimlerinin
                  iletilmesi.
                </li>
                <li>
                  <strong>OpenStreetMap / Nominatim:</strong> il-ilçe bilgisi
                  ile harita koordinatı arasındaki çevrim.
                </li>
                <li>
                  <strong>Barındırma sağlayıcısı:</strong> uygulamanın ve
                  veritabanının çalıştığı sunucular.
                </li>
              </ul>
            </Bolum>

            <Bolum baslik="Verileriniz ne kadar saklanır?">
              <p>
                İlanlarınız ve hesabınız, siz kaldırana ya da kaldırılmasını
                talep edene kadar saklanır. İlanınızı çözüldü olarak
                işaretlediğinizde ilan yayından kalkar; hesabınızın veya
                verilerinizin tamamen silinmesini uygulama içi kanallardan
                talep edebilirsiniz.
              </p>
            </Bolum>

            <Bolum baslik="KVKK kapsamındaki haklarınız">
              <p>KVKK'nın 11. maddesi uyarınca şunları talep edebilirsiniz:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Verilerinizin işlenip işlenmediğini öğrenme,</li>
                <li>İşlenmişse buna ilişkin bilgi isteme,</li>
                <li>
                  İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını
                  öğrenme,
                </li>
                <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
                <li>Silinmesini veya yok edilmesini isteme,</li>
                <li>
                  Otomatik sistemlerce analiz sonucu aleyhinize bir sonucun
                  ortaya çıkmasına itiraz etme.
                </li>
              </ul>
              <p>
                Bu talepleriniz için uygulama içindeki iletişim kanallarını
                kullanabilirsiniz.
              </p>
            </Bolum>

            <Bolum baslik="Bu metin değişirse">
              <p>
                Ürüne veri işleyen yeni bir özellik eklendiğinde bu sayfa da
                güncellenir ve sayfanın başındaki son güncelleme tarihi
                değiştirilir.
              </p>
            </Bolum>
          </article>
        </section>
      </main>

      <Footer />
    </div>
  );
}
