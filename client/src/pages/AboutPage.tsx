import {
  Heart,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <Header />

      <main>
        <section className="border-b border-[#E2E8F0] bg-gradient-to-br from-[#FFF7ED] via-white to-[#EFF6FF]">
          <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#FED7AA] bg-white px-4 py-2 text-sm font-bold text-[#F97316]">
              <Sparkles size={16} />
              PATIMATI hakkında
            </span>

            <h1 className="mt-6 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Minik dostlarımızı
              <span className="text-[#F97316]">
                {" "}
                yeniden bir araya getiriyoruz
              </span>
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#64748B]">
              PATIMATI kayıp bulunan ve sahiplendirilecek
              hayvanları doğru kişilerle buluşturmayı amaçlayan
              teknoloji ve topluluk gücünü bir araya getiren bir
              platformdur
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <InfoCard
              icon={<PawPrint size={27} />}
              title="Kayıp dostları bul"
              description="Kayıp ve bulunan hayvan ilanlarını tek noktada buluşturarak ailelerine ulaşmalarına yardımcı oluruz"
            />

            <InfoCard
              icon={<Heart size={27} />}
              title="Yeni yuvalar bul"
              description="Sahiplendirilecek hayvanların güvenilir ve sevgi dolu ailelerle buluşmasını destekleriz"
            />

            <InfoCard
              icon={<ShieldCheck size={27} />}
              title="Güvenli iletişim"
              description="Kullanıcıların güvenli ve kontrollü biçimde iletişim kurabileceği bir yapı sunmayı hedefleriz"
            />
          </div>

          <div className="mt-16 grid gap-10 rounded-3xl border border-[#E2E8F0] bg-white p-7 shadow-sm lg:grid-cols-2 lg:p-10">
            <div>
              <span className="text-sm font-bold uppercase tracking-wider text-[#F97316]">
                Amacımız
              </span>

              <h2 className="mt-3 text-3xl font-bold">
                Teknolojiyi iyilik için kullanmak
              </h2>

              <p className="mt-5 leading-8 text-[#64748B]">
                Geleneksel kayıp ilanlarının ötesine geçerek
                görsel eşleştirme konum bilgisi ilan yönetimi ve
                topluluk desteğini tek platformda bir araya
                getiriyoruz
              </p>

              <p className="mt-4 leading-8 text-[#64748B]">
                Amacımız sadece ilan yayınlamak değil doğru bilgi
                hızlı iletişim ve güvenli süreçlerle hayvanların
                ailelerine ya da yeni yuvalarına ulaşmasını
                kolaylaştırmak
              </p>
            </div>

            <div className="rounded-2xl bg-[#FFF7ED] p-7">
              <Users size={32} className="text-[#F97316]" />

              <h3 className="mt-5 text-2xl font-bold">
                Topluluk gücü
              </h3>

              <p className="mt-4 leading-7 text-[#64748B]">
                Bir kayıp hayvan ilanı ne kadar fazla kişiye
                ulaşırsa bulunma ihtimali o kadar artar PATIMATI
                kullanıcıların birbirine destek olduğu güçlü bir
                topluluk oluşturmayı hedefler
              </p>
            </div>
          </div>

          {/* Yeni Eklenen Sosyal Medya Paylaşım ve Takip Alanı */}
          <div className="mt-10 flex flex-col items-center justify-center rounded-3xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm sm:p-12">
            <h2 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">
              Daha fazla cana ulaşmak için paylaşın
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#64748B]">
              Topluluğumuzun gücü, sesimizi duyurabildiğimiz kadar büyüktür.
              Instagram hesabımızı takip edebilir, ilanlarımızı kendi sosyal
              medya hesaplarınızda paylaşarak minik dostlarımızın yeni
              yuvalarını veya ailelerini bulmalarına destek olabilirsiniz.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="https://www.instagram.com/patimatibuu/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] px-6 font-semibold text-white shadow-sm transition hover:opacity-90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-pink-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                Instagram'da Bizi Takip Et
              </a>

              {/* TODO: X hesabı açıldığında aşağıdaki yorum satırı kaldırılıp href güncellenecek */}
              {/*
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-black px-6 font-semibold text-white shadow-sm transition hover:bg-gray-800 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-gray-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X'te Bizi Takip Et
              </a>
              */}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function InfoCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-3xl border border-[#E2E8F0] bg-white p-7 shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF7ED] text-[#F97316]">
        {icon}
      </div>

      <h2 className="mt-5 text-xl font-bold">{title}</h2>

      <p className="mt-3 leading-7 text-[#64748B]">
        {description}
      </p>
    </article>
  );
}
