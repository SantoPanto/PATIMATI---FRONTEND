import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Edit3, Loader2, X } from "lucide-react";
import { updateAd } from "../services/ads";
import type {
  AdResponse,
  AgeGroup,
  CoatPattern,
  Gender,
  PetColor,
  PresenceStatus,
  Species,
} from "../services/types";
import { getUserErrorMessage } from "../utils/errorMessage";
import { translateEnum } from "../utils/enumTranslator";
import PosterSettingsForm from "./PosterSettingsForm";

interface AdEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: AdResponse | null;
  onSuccess: (updatedAd: AdResponse) => void;
}

const ALL_COLORS: PetColor[] = [
  "BLACK",
  "WHITE",
  "GRAY",
  "BROWN",
  "ORANGE",
  "CREAM",
  "GOLDEN",
  "BEIGE",
  "OTHER",
];

export default function AdEditModal({
  isOpen,
  onClose,
  ad,
  onSuccess,
}: AdEditModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [species, setSpecies] = useState<Species>("UNKNOWN");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState<Gender>("UNKNOWN");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("UNKNOWN");
  const [coatPattern, setCoatPattern] = useState<CoatPattern>("UNKNOWN");
  const [eyeColor, setEyeColor] = useState("");
  const [microchipNumber, setMicrochipNumber] = useState("");
  const [colors, setColors] = useState<PetColor[]>([]);
  const [collarStatus, setCollarStatus] = useState<PresenceStatus>("UNKNOWN");
  const [collarColor, setCollarColor] = useState("");
  const [collarTagText, setCollarTagText] = useState("");
  const [distinctiveMarks, setDistinctiveMarks] = useState("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && ad) {
      setTitle(ad.title || "");
      setDescription(ad.description || "");
      setSpecies(ad.species || "UNKNOWN");
      setBreed(ad.breed || "");
      setGender(ad.gender || "UNKNOWN");
      setAgeGroup(ad.ageGroup || "UNKNOWN");
      setCoatPattern(ad.coatPattern || "UNKNOWN");
      setEyeColor(ad.eyeColor || "");
      setMicrochipNumber(ad.microchipNumber || "");
      setColors(ad.colors || []);
      setCollarStatus(ad.collarStatus || "UNKNOWN");
      setCollarColor(ad.collarColor || "");
      setCollarTagText(ad.collarTagText || "");
      setDistinctiveMarks(ad.distinctiveMarks || "");
      setLatitude(ad.latitude !== null && ad.latitude !== undefined ? String(ad.latitude) : "");
      setLongitude(ad.longitude !== null && ad.longitude !== undefined ? String(ad.longitude) : "");

      setError(null);
      setSuccessMsg(null);
      setSubmitting(false);
    }
  }, [isOpen, ad]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !ad) return null;

  const effectiveAdType = ad.adType || (ad as unknown as { type: string }).type;
  const isAdoption = effectiveAdType === "ADOPTION";

  const toggleColor = (color: PetColor) => {
    setColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const handleSubmitAdoption = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      species,
      breed: breed.trim() || undefined,
      gender,
      ageGroup,
      coatPattern,
      eyeColor: eyeColor.trim() || undefined,
      microchipNumber: microchipNumber.trim() || undefined,
      colors: Array.isArray(colors) ? colors : [],
      collarStatus,
      collarColor: collarColor.trim() || undefined,
      collarTagText: collarTagText.trim() || undefined,
      distinctiveMarks: distinctiveMarks.trim() || undefined,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
    };

    try {
      const updatedAd = await updateAd(ad.id, payload);
      setSuccessMsg("İlan bilgileri başarıyla güncellendi.");

      const resultAd = updatedAd || { ...ad, ...payload };
      onSuccess(resultAd);

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error("İlan güncellenirken hata oluştu:", err);
      // getUserErrorMessage handles RFC 7807 details or invalid_params automatically
      setError(
        getUserErrorMessage(
          err,
          "İlan güncellenirken bir hata oluştu. Lütfen bilgilerinizi kontrol ediniz."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePosterSettingsSuccess = (updatedAd: AdResponse) => {
    onSuccess(updatedAd);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm overflow-y-auto"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        aria-labelledby="ad-edit-modal-title"
        aria-modal="true"
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-white/70 bg-white shadow-2xl shadow-slate-950/25 my-auto dark:border-slate-800 dark:bg-slate-900"
        role="dialog"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400">
              <Edit3 size={24} aria-hidden="true" />
            </span>

            <div>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-orange-500">
                İlan Yönetimi
              </span>
              <h2
                id="ad-edit-modal-title"
                className="mt-0.5 text-xl font-extrabold text-slate-900 dark:text-slate-50"
              >
                İlanı Düzenle
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Pencereyi kapat"
          >
            <X size={19} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {!isAdoption ? (
            /* Kayıp / Bulundu İlanları Kısıtlanmış Akış */
            <div className="space-y-6">
              <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50/90 p-5 text-amber-900 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300" role="alert">
                <AlertTriangle size={24} className="shrink-0 text-amber-600 mt-0.5 dark:text-amber-400" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-amber-950 dark:text-amber-300">
                    Temel Bilgi Güncelleme Kısıtlaması
                  </h3>
                  <p className="text-sm leading-relaxed font-medium text-amber-900 dark:text-amber-400/90">
                    Kayıp ve bulundu ilanlarında acil durum bildirimlerinin tutarlılığını korumak ve bilgi kirliliğini önlemek amacıyla temel ilan bilgilerinin güncellenmesine izin verilmemektedir. Lütfen ilanı oluştururken bilgilerin doğruluğundan emin olunuz. Bu ilan tiplerinde yalnızca &apos;Afiş Ayarları&apos; değiştirilebilmektedir.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                <h4 className="text-base font-bold text-slate-900 mb-4 dark:text-slate-50">
                  Afiş Ayarları Yönetimi
                </h4>
                <PosterSettingsForm
                  ad={ad}
                  onSuccess={handlePosterSettingsSuccess}
                  onCancel={onClose}
                  showTitle={false}
                />
              </div>
            </div>
          ) : (
            /* Sahiplendirme (ADOPTION) İlanları Tam Form & Afiş Ayarları */
            <>
              <form onSubmit={(e) => void handleSubmitAdoption(e)} className="space-y-6">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">İlan ID: </span>
                  #{ad.id}
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 dark:text-slate-300">
                  İlan Başlığı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="İlan başlığını giriniz"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 dark:text-slate-300">
                  Açıklama <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="İlan açıklamasını giriniz"
                />
              </div>

              {/* Grid 1: Species & Breed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 dark:text-slate-300">
                    Tür
                  </label>
                  <select
                    value={species}
                    onChange={(e) => setSpecies(e.target.value as Species)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="CAT">Kedi</option>
                    <option value="DOG">Köpek</option>
                    <option value="UNKNOWN">Bilinmiyor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 dark:text-slate-300">
                    Cins / Irk
                  </label>
                  <input
                    type="text"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Örn: Tekir, British Shorthair"
                  />
                </div>
              </div>

              {/* Grid 2: Gender & Age Group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 dark:text-slate-300">
                    Cinsiyet
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="FEMALE">Dişi</option>
                    <option value="MALE">Erkek</option>
                    <option value="UNKNOWN">Bilinmiyor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 dark:text-slate-300">
                    Yaş Grubu
                  </label>
                  <select
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="BABY">Yavru</option>
                    <option value="YOUNG">Genç</option>
                    <option value="ADULT">Yetişkin</option>
                    <option value="SENIOR">Yaşlı</option>
                    <option value="UNKNOWN">Bilinmiyor</option>
                  </select>
                </div>
              </div>

              {/* Grid 3: Coat Pattern & Eye Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 dark:text-slate-300">
                    Tüy Deseni
                  </label>
                  <select
                    value={coatPattern}
                    onChange={(e) => setCoatPattern(e.target.value as CoatPattern)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="UNKNOWN">Belirtilmemiş</option>
                    <option value="SOLID">Tek Renk</option>
                    <option value="STRIPED">Çizgili / Tekir</option>
                    <option value="SPOTTED">Benekli</option>
                    <option value="PATCHED">Parçalı / Alaca</option>
                    <option value="CALICO">Sarman / Üç Renk</option>
                    <option value="TORTOISESHELL">Kaplumbağa Kabuğu</option>
                    <option value="OTHER">Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 dark:text-slate-300">
                    Göz Rengi
                  </label>
                  <input
                    type="text"
                    value={eyeColor}
                    onChange={(e) => setEyeColor(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Örn: Yeşil, Mavi"
                  />
                </div>
              </div>

              {/* Colors multi-select chips */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 dark:text-slate-300">
                  Renkler
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_COLORS.map((c) => {
                    const isSelected = colors.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleColor(c)}
                        className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                          isSelected
                            ? "bg-orange-500 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                        }`}
                      >
                        {translateEnum(c, "color")}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid 4: Collar Status & Microchip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 dark:text-slate-300">
                    Tasma Durumu
                  </label>
                  <select
                    value={collarStatus}
                    onChange={(e) => setCollarStatus(e.target.value as PresenceStatus)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="YES">Tasmalı</option>
                    <option value="NO">Tasmasız</option>
                    <option value="UNKNOWN">Bilinmiyor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 dark:text-slate-300">
                    Mikroçip Numarası
                  </label>
                  <input
                    type="text"
                    value={microchipNumber}
                    onChange={(e) => setMicrochipNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Mikroçip numarası"
                  />
                </div>
              </div>

              {/* Distinctive Marks */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 dark:text-slate-300">
                  Ayırt Edici Özellikler
                </label>
                <textarea
                  rows={2}
                  value={distinctiveMarks}
                  onChange={(e) => setDistinctiveMarks(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="Yara izi, pati rengi farkı vb."
                />
              </div>

              {/* Error & Success Messages */}
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 whitespace-pre-line dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400" role="alert">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400" role="status">
                  <CheckCircle2 size={18} />
                  {successMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 font-bold text-white transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Güncelleniyor...
                    </>
                  ) : (
                    "İlanı Güncelle"
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 mb-4 dark:text-slate-50">
                Afiş Ayarları Yönetimi
              </h3>
              <PosterSettingsForm
                ad={ad}
                onSuccess={handlePosterSettingsSuccess}
                onCancel={onClose}
                showTitle={false}
              />
            </div>
          </>
        )}
        </div>
      </section>
    </div>
  );
}
