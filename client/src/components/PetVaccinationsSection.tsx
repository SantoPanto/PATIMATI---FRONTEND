import { Syringe } from "lucide-react";
import { useState } from "react";
import type { AddVaccinationPayload, PetVaccination } from "../services/types";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

/** Aşı geçmişi -- hem sahip hem bağlı vet ekleyebilir (26.08). */
export default function PetVaccinationsSection({
  vaccinations,
  isLoading,
  onAdd,
}: {
  vaccinations: PetVaccination[];
  isLoading: boolean;
  onAdd: (payload: AddVaccinationPayload) => Promise<void>;
}) {
  const [vaccineName, setVaccineName] = useState("");
  const [administeredDate, setAdministeredDate] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    if (!vaccineName.trim() || !administeredDate) return;
    setIsSaving(true);
    try {
      await onAdd({
        vaccineName: vaccineName.trim(),
        administeredDate,
        nextDueDate: nextDueDate || undefined,
      });
      setVaccineName("");
      setAdministeredDate("");
      setNextDueDate("");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
      ) : vaccinations.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">Henüz aşı kaydı yok.</p>
      ) : (
        vaccinations.map((vaccination) => (
          <div
            key={vaccination.id}
            className="flex items-start gap-2.5 rounded-xl bg-gray-50 p-3 text-sm dark:bg-slate-800/60"
          >
            <Syringe size={16} className="mt-0.5 shrink-0 text-[#2563EB]" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                {vaccination.vaccineName}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {new Date(vaccination.administeredDate).toLocaleDateString("tr-TR")}
                {vaccination.nextDueDate &&
                  ` · Sonraki: ${new Date(vaccination.nextDueDate).toLocaleDateString("tr-TR")}`}
                {vaccination.recordedByName && ` · ${vaccination.recordedByName}`}
              </p>
              {vaccination.notes && (
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{vaccination.notes}</p>
              )}
            </div>
          </div>
        ))
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
        <input
          value={vaccineName}
          onChange={(event) => setVaccineName(event.target.value)}
          placeholder="Aşı adı (ör. Kuduz)"
          className={inputClass}
        />
        <input
          type="date"
          value={administeredDate}
          onChange={(event) => setAdministeredDate(event.target.value)}
          aria-label="Uygulama tarihi"
          className={inputClass}
        />
        <input
          type="date"
          value={nextDueDate}
          onChange={(event) => setNextDueDate(event.target.value)}
          aria-label="Sonraki tekrar tarihi"
          className={inputClass}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={isSaving || !vaccineName.trim() || !administeredDate}
          className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-bold text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Ekle
        </button>
      </div>
    </div>
  );
}
