import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { TeamBack, TeamShell } from "../components/TeamUI";
import {
  getAdminAdComplaints,
  getAdminAdoptionComplaints,
  getAdminUserComplaints,
} from "../services/admin";
import type { ComplaintResponse } from "../services/types";
import { getUserErrorMessage } from "../utils/errorMessage";

type AdminComplaint = ComplaintResponse & {
  title: string;
};

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<AdminComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getAdminAdComplaints({ page: 0, size: 50 }),
      getAdminUserComplaints({ page: 0, size: 50 }),
      getAdminAdoptionComplaints({ page: 0, size: 50 }),
    ])
      .then(([adComplaints, userComplaints, adoptionComplaints]) => {
        if (cancelled) return;

        const ads: AdminComplaint[] = adComplaints.content.map((item) => ({
          ...item,
          title: item.adTitle || `İlan #${item.reportedAdId ?? "-"}`,
        }));

        const users: AdminComplaint[] = userComplaints.content.map((item) => ({
          ...item,
          title:
            item.reportedUserEmail ||
            `Kullanıcı #${item.reportedUserId ?? "-"}`,
        }));

        const adoptions: AdminComplaint[] =
          adoptionComplaints.content.map((item) => ({
            ...item,
            title:
              item.adoptionTitle ||
              `Sahiplendirme #${item.reportedAdId ?? "-"}`,
          }));

        setComplaints([...ads, ...users, ...adoptions]);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            getUserErrorMessage(err, "Şikayetler yüklenemedi."),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack href="/admin" />
        <h1>Şikayet Yönetimi</h1>
      </header>

      <section className="card-stack">
        {loading && <p className="muted">Şikayetler yükleniyor...</p>}

        {error && <p className="muted">{error}</p>}

        {!loading && !error && complaints.length === 0 && (
          <p className="muted">Şikayet bulunamadı.</p>
        )}

        {complaints.map((item) => (
          <article key={item.id} className="content-card">
            <div className="content-card__top">
              <div className="pill pill--warning">{item.status}</div>

              <span className="muted">
                {new Date(item.createdAt).toLocaleDateString("tr-TR")}
              </span>
            </div>

            <h3>{item.title}</h3>

            <p>{item.description}</p>

            <button
              className="button button--outline"
              type="button"
              disabled
            >
              <CheckCircle2 size={16} />
              Çözüldü olarak işaretle
            </button>
          </article>
        ))}
      </section>
    </TeamShell>
  );
}
