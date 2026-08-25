import {
  AlertTriangle,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      <Header />

      <main>
        <section className="border-b border-[#E2E8F0] bg-gradient-to-br from-[#EFF6FF] via-white to-[#FFF7ED] dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#BFDBFE] bg-white px-4 py-2 text-sm font-bold text-[#2563EB] dark:border-blue-500/20 dark:bg-slate-900 dark:text-blue-400">
              <ShieldCheck size={17} />
              Güvenlik rehberi
            </span>

            <h1 className="mt-6 max-w-4xl text-4xl font-bold sm:text-5xl">
              Güvenli iletişim
              <span className="text-[#2563EB]">
                {" "}
                doğru teslim
              </span>
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#64748B] dark:text-slate-400">
              Kayıp bulunan veya sahiplendirilecek bir hayvan için
              iletişim kurarken birkaç temel güvenlik adımına dikkat
              etmek hem seni hem de hayvanı korur
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            <SafetyCard
              icon={<UserCheck size={25} />}
              title="Sahibi doğrula"
              description="Hayvanı teslim etmeden önce eski fotoğraf veteriner kaydı mikroçip bilgisi veya yalnızca gerçek sahibinin bilebileceği özellikleri sor"
            />

            <SafetyCard
              icon={<MessageCircle size={25} />}
              title="Platform üzerinden iletişim kur"
              description="İlk iletişimde mümkün olduğunca kişisel bilgilerini paylaşmadan PATIMATI mesajlaşma sistemini kullan"
            />

            <SafetyCard
              icon={<ShieldCheck size={25} />}
              title="Güvenli yerde buluş"
              description="Teslim veya görüşme için kalabalık ve güvenli bir konum tercih et Mümkünse yanında başka biri olsun"
            />

            <SafetyCard
              icon={<AlertTriangle size={25} />}
              title="Şüpheli taleplere dikkat et"
              description="Para kart bilgisi doğrulama kodu veya gereksiz kişisel bilgi isteyen kullanıcılara karşı dikkatli ol"
            />
          </div>

          <div className="mt-12 rounded-3xl border border-[#BBF7D0] bg-[#F0FDF4] p-7">
            <div className="flex items-start gap-4">
              <CheckCircle2
                size={28}
                className="mt-1 shrink-0 text-[#16A34A]"
              />

              <div>
                <h2 className="text-xl font-bold text-[#166534]">
                  Hayvanın güvenliği her zaman öncelikli
                </h2>

                <p className="mt-3 leading-7 text-[#15803D]">
                  Emin olmadığın bir kişiye hayvanı teslim etme
                  Sahiplik bilgilerini doğrula ve sahiplendirme
                  durumunda yaşam koşulları hakkında mutlaka bilgi
                  al
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function SafetyCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-3xl border border-[#E2E8F0] bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[#EFF6FF] p-3 text-[#2563EB] dark:bg-blue-500/10 dark:text-blue-400">
        {icon}
      </div>

      <h2 className="mt-5 text-xl font-bold">{title}</h2>

      <p className="mt-3 leading-7 text-[#64748B] dark:text-slate-400">
        {description}
      </p>
    </article>
  );
}