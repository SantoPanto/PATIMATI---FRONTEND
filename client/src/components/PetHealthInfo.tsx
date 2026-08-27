import { AlertTriangle, Cake, Fingerprint, ShieldCheck } from "lucide-react";
import type { Pet } from "../services/types";

/*
 * Doğum tarihinden yaklaşık yaş — AgeGroup'un (yavru/genç/yetişkin/yaşlı)
 * kaba kategorisinden daha kesin bir bilgi veteriner için (26.08).
 */
function yaklasikYas(birthDate: string | null): string | null {
  if (!birthDate) return null;

  const dogum = new Date(birthDate);
  const simdi = new Date();
  let yil = simdi.getFullYear() - dogum.getFullYear();
  let ay = simdi.getMonth() - dogum.getMonth();

  if (simdi.getDate() < dogum.getDate()) {
    ay -= 1;
  }
  if (ay < 0) {
    yil -= 1;
    ay += 12;
  }

  if (yil <= 0 && ay <= 0) {
    return "1 aydan küçük";
  }

  const parcalar: string[] = [];
  if (yil > 0) parcalar.push(`${yil} yaş`);
  if (ay > 0) parcalar.push(`${ay} ay`);
  return parcalar.join(" ");
}

/** Yapılandırılmış sağlık alanlarının kompakt, salt okunur özeti. */
export default function PetHealthInfo({ pet }: { pet: Pet }) {
  const yas = yaklasikYas(pet.birthDate);
  const bosMu =
    !yas &&
    pet.sterilized == null &&
    !pet.microchipNumber &&
    !pet.chronicConditions &&
    !pet.allergies;

  if (bosMu) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 rounded-xl bg-gray-50 p-3 text-sm dark:bg-slate-800/60 sm:grid-cols-2">
      {yas && (
        <div className="flex items-center gap-2 text-[#334155] dark:text-slate-300">
          <Cake size={15} className="shrink-0 text-[#64748B] dark:text-slate-500" />
          {yas}
        </div>
      )}

      {pet.sterilized != null && (
        <div className="flex items-center gap-2 text-[#334155] dark:text-slate-300">
          <ShieldCheck size={15} className="shrink-0 text-[#64748B] dark:text-slate-500" />
          {pet.sterilized ? "Kısırlaştırılmış" : "Kısırlaştırılmamış"}
        </div>
      )}

      {pet.microchipNumber && (
        <div className="flex items-center gap-2 text-[#334155] dark:text-slate-300">
          <Fingerprint size={15} className="shrink-0 text-[#64748B] dark:text-slate-500" />
          Mikroçip: {pet.microchipNumber}
        </div>
      )}

      {pet.chronicConditions && (
        <div className="flex items-start gap-2 text-[#334155] dark:text-slate-300 sm:col-span-2">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" />
          <span>
            <strong className="font-semibold">Kronik durum: </strong>
            {pet.chronicConditions}
          </span>
        </div>
      )}

      {pet.allergies && (
        <div className="flex items-start gap-2 text-[#334155] dark:text-slate-300 sm:col-span-2">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" />
          <span>
            <strong className="font-semibold">Alerji: </strong>
            {pet.allergies}
          </span>
        </div>
      )}
    </div>
  );
}
