import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

interface AiAutofillCardProps {
  onAnalyze: () => void;
  isAnalyzing: boolean;
  disabled?: boolean;
  analysisMessage?: string;
  hasImages: boolean;
  variant?: "lost" | "found" | "adoption";
}

export default function AiAutofillCard({
  onAnalyze,
  isAnalyzing,
  disabled = false,
  analysisMessage = "",
  hasImages,
  variant = "lost",
}: AiAutofillCardProps) {
  if (!hasImages) return null;

  // Variant accent styles
  const accentColorClass =
    variant === "found"
      ? "bg-[#2563EB] hover:bg-[#1D4ED8]"
      : variant === "adoption"
      ? "bg-[#F97316] hover:bg-[#EA580C]"
      : "bg-[#7c5cff] hover:bg-[#6d4ff0]";

  const iconColorClass =
    variant === "found"
      ? "text-[#2563EB]"
      : variant === "adoption"
      ? "text-[#F97316]"
      : "text-[#7c5cff]";

  const cardBgClass =
    variant === "found"
      ? "bg-[#EFF6FF] dark:bg-blue-500/10"
      : variant === "adoption"
      ? "bg-[#FFF7ED] dark:bg-orange-500/10"
      : "bg-[#7c5cff]/5 dark:bg-[#7c5cff]/10";

  return (
    <div className="space-y-4">
      <div className={`mt-5 rounded-2xl p-4 ${cardBgClass}`}>
        <div className="flex items-start gap-3">
          <Sparkles size={20} className={`mt-0.5 shrink-0 ${iconColorClass}`} />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-800 dark:text-slate-100">
              AI ile otomatik doldur
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-slate-400">
              İlk fotoğrafınız analiz edilir ve tür, cins, renk gibi bilgiler forma otomatik aktarılır.
            </p>

            <button
              type="button"
              onClick={onAnalyze}
              disabled={disabled || isAnalyzing}
              className={`mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${accentColorClass}`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  AI analiz ediyor...
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  Fotoğrafı Analiz Et
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {analysisMessage && (
        <div className="flex items-start gap-3 rounded-2xl bg-green-50 p-4 text-sm text-green-800 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
          <span>{analysisMessage}</span>
        </div>
      )}
    </div>
  );
}
