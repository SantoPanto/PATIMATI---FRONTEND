import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Landmark, UserRoundCog } from "lucide-react";
import { TeamBack, TeamShell } from "../components/TeamUI";
import AdminFilterBar from "../components/admin/AdminFilterBar";
import { assignInstitution, getAdminUsers } from "../services/admin";
import type { UserDetailForAdminDTO } from "../services/types";
import { getUserErrorMessage } from "../utils/errorMessage";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserDetailForAdminDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("createdAt,desc");
  const [page, setPage] = useState(0);
  const [surum, setSurum] = useState(0);

  // Kuruma yükseltme formu (belediye modülü, B parçası). Kurum hesabı serbest
  // kayıtla AÇILMIYOR — tek kapı bu ekran; form yoksa ilk kurum hesabı ancak
  // curl ile açılabiliyordu.
  const [acikFormUid, setAcikFormUid] = useState<number | null>(null);
  const [kurumAdi, setKurumAdi] = useState("");
  const [il, setIl] = useState("");
  const [ilce, setIlce] = useState("");
  const [yukseltiliyor, setYukseltiliyor] = useState(false);
  const [yukseltmeHatasi, setYukseltmeHatasi] = useState("");
  const [yukseltmeSonucu, setYukseltmeSonucu] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getAdminUsers({
      page,
      size: 50,
      search: searchQuery,
      sort: sortOrder,
    })
      .then((response) => {
        if (!cancelled) {
          setUsers(response.content);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            getUserErrorMessage(err, "Kullanıcılar yüklenemedi."),
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
  }, [page, searchQuery, sortOrder, surum]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(0);
  };

  const handleSortChange = (sort: string) => {
    setSortOrder(sort);
    setPage(0);
  };

  const formuAc = (uid: number) => {
    setAcikFormUid(uid);
    setKurumAdi("");
    setIl("");
    setIlce("");
    setYukseltmeHatasi("");
    setYukseltmeSonucu("");
  };

  const yukselt = async (event: FormEvent, uid: number) => {
    event.preventDefault();
    setYukseltmeHatasi("");

    try {
      setYukseltiliyor(true);
      const cevap = await assignInstitution(uid, {
        institutionName: kurumAdi.trim(),
        institutionCity: il.trim(),
        institutionDistrict: ilce.trim(),
      });
      setAcikFormUid(null);
      setYukseltmeSonucu(
        `${cevap.message} — Kullanıcının yeniden giriş yapması gerekir; yetki jetondaki rolden okunuyor.`,
      );
      setSurum((s) => s + 1);
    } catch (err) {
      setYukseltmeHatasi(
        getUserErrorMessage(err, "Kurum ataması yapılamadı."),
      );
    } finally {
      setYukseltiliyor(false);
    }
  };

  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack href="/admin" />
        <h1>Kullanıcı Yönetimi</h1>
      </header>

      <section className="card-stack">
        <AdminFilterBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          placeholder="Kullanıcı adı veya e-posta ara..."
          className="mb-4"
        />

        {loading && <p className="muted">Kullanıcılar yükleniyor...</p>}

        {error && <p className="muted">{error}</p>}

        {yukseltmeSonucu && (
          <p
            role="status"
            className="rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800"
          >
            {yukseltmeSonucu}
          </p>
        )}

        {!loading && !error && users.length === 0 && (
          <p className="muted">Kullanıcı bulunamadı.</p>
        )}

        {users.map((user) => (
          <article key={user.uid} className="content-card">
            <div className="content-card__top">
              <div className="pill">{user.role}</div>
              <span className="muted">
                {user.banned ? "Banned" : user.enabled ? "Active" : "Disabled"}
              </span>
            </div>

            <h3>
              {user.firstName} {user.lastName}
            </h3>

            <p>{user.email}</p>

            {user.createdAt && (
              <p className="muted">
                Katılma: {new Date(user.createdAt).toLocaleDateString("tr-TR")}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button className="button button--quiet" type="button" disabled>
                <UserRoundCog size={16} />
                Rolü güncelle
              </button>

              {user.role !== "INSTITUTION" && acikFormUid !== user.uid && (
                <button
                  className="button button--outline"
                  type="button"
                  onClick={() => formuAc(user.uid)}
                >
                  <Landmark size={16} />
                  Kuruma yükselt
                </button>
              )}
            </div>

            {acikFormUid === user.uid && (
              <form
                className="mt-3 space-y-2 rounded border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
                onSubmit={(e) => yukselt(e, user.uid)}
              >
                <p className="text-xs text-gray-500">
                  İlçe, panelin ve ihbar kuyruğunun kapsamını belirler;
                  ilanlardaki yazımla aynı olmalı (örn. "Nilüfer").
                </p>

                <div>
                  <label
                    htmlFor={`kurum-adi-${user.uid}`}
                    className="block text-xs font-medium mb-1"
                  >
                    Kurum adı
                  </label>
                  <input
                    id={`kurum-adi-${user.uid}`}
                    type="text"
                    className="w-full rounded border p-2 text-sm"
                    placeholder="Nilüfer Belediyesi"
                    value={kurumAdi}
                    onChange={(e) => setKurumAdi(e.target.value)}
                    maxLength={150}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label
                      htmlFor={`il-${user.uid}`}
                      className="block text-xs font-medium mb-1"
                    >
                      İl
                    </label>
                    <input
                      id={`il-${user.uid}`}
                      type="text"
                      className="w-full rounded border p-2 text-sm"
                      placeholder="Bursa"
                      value={il}
                      onChange={(e) => setIl(e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor={`ilce-${user.uid}`}
                      className="block text-xs font-medium mb-1"
                    >
                      İlçe
                    </label>
                    <input
                      id={`ilce-${user.uid}`}
                      type="text"
                      className="w-full rounded border p-2 text-sm"
                      placeholder="Nilüfer"
                      value={ilce}
                      onChange={(e) => setIlce(e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>
                </div>

                {yukseltmeHatasi && (
                  <p role="alert" className="text-xs text-red-600">
                    {yukseltmeHatasi}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    className="button button--primary"
                    type="submit"
                    disabled={yukseltiliyor}
                  >
                    {yukseltiliyor ? "Yükseltiliyor..." : "Yükselt"}
                  </button>
                  <button
                    className="button button--quiet"
                    type="button"
                    disabled={yukseltiliyor}
                    onClick={() => setAcikFormUid(null)}
                  >
                    Vazgeç
                  </button>
                </div>
              </form>
            )}
          </article>
        ))}
      </section>
    </TeamShell>
  );
}
