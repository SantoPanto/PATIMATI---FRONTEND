import { useState } from "react";
import type { AddWeightLogPayload, PetWeightLog } from "../services/types";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

/** Basit çizgi grafiği -- ayrı bir grafik kütüphanesi gerektirmeyecek kadar küçük veri seti. */
function Sparkline({ points }: { points: PetWeightLog[] }) {
  if (points.length < 2) return null;

  const degerler = points.map((p) => p.weightKg);
  const min = Math.min(...degerler);
  const max = Math.max(...degerler);
  const aralik = max - min || 1;
  const genislik = 200;
  const yukseklik = 48;

  const koordinatlar = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * genislik;
      const y = yukseklik - ((p.weightKg - min) / aralik) * yukseklik;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={genislik}
      height={yukseklik}
      viewBox={`0 0 ${genislik} ${yukseklik}`}
      className="shrink-0 text-[#2563EB]"
      role="img"
      aria-label="Ağırlık değişim grafiği"
    >
      <polyline
        points={koordinatlar}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Ağırlık geçmişi -- hem sahip hem bağlı vet ekleyebilir (26.08). */
export default function PetWeightSection({
  logs,
  isLoading,
  onAdd,
}: {
  logs: PetWeightLog[];
  isLoading: boolean;
  onAdd: (payload: AddWeightLogPayload) => Promise<void>;
}) {
  const [weightKg, setWeightKg] = useState("");
  const [recordedAt, setRecordedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    const parsed = Number(weightKg.replace(",", "."));
    if (!parsed || parsed <= 0 || !recordedAt) return;

    setIsSaving(true);
    try {
      await onAdd({ weightKg: parsed, recordedAt });
      setWeightKg("");
    } finally {
      setIsSaving(false);
    }
  };

  const sonKayit = logs[logs.length - 1];

  return (
    <div className="space-y-3">
      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">Henüz kilo kaydı yok.</p>
      ) : (
        <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-3 dark:bg-slate-800/60">
          <Sparkline points={logs} />
          <div>
            <p className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
              {sonKayit.weightKg} kg
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Son ölçüm: {new Date(sonKayit.recordedAt).toLocaleDateString("tr-TR")}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          value={weightKg}
          onChange={(event) => setWeightKg(event.target.value)}
          placeholder="Ağırlık (kg)"
          inputMode="decimal"
          className={inputClass}
        />
        <input
          type="date"
          value={recordedAt}
          onChange={(event) => setRecordedAt(event.target.value)}
          aria-label="Ölçüm tarihi"
          className={inputClass}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={isSaving || !weightKg.trim()}
          className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-bold text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Ekle
        </button>
      </div>
    </div>
  );
}
