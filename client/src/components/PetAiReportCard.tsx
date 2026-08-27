import { Sparkles } from "lucide-react";
import PetReportView from "./PetReportView";

/** Hayvana kaydedilmiş "Ben Neyim?" raporunu gösterir -- sahip ve vet tarafında ORTAK. */
export default function PetAiReportCard({
  aiReport,
  aiReportAt,
}: {
  aiReport: string | null;
  aiReportAt: string | null;
}) {
  if (!aiReport) {
    return null;
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(aiReport) as Record<string, unknown>;
  } catch {
    return null;
  }

  if (!parsed || parsed.gecerli === false) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-bold text-[#7C3AED] dark:text-violet-300">
        <Sparkles size={16} />
        AI Profili
        {aiReportAt && (
          <span className="font-normal text-gray-400 dark:text-slate-500">
            · {new Date(aiReportAt).toLocaleDateString("tr-TR")}
          </span>
        )}
      </div>
      <PetReportView result={parsed} />
    </div>
  );
}
