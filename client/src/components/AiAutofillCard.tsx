import { Loader2, Sparkles } from "lucide-react";

interface AiAutofillCardProps {
  onAnalyze: () => void;
  isAnalyzing: boolean;
  disabled?: boolean;
  analysisMessage?: string;
  descriptionText?: string;
}

export default function AiAutofillCard({
  onAnalyze,
  isAnalyzing,
  disabled = false,
  analysisMessage,
  descriptionText = "İlk fotoğrafınız analiz edilir ve tür, cins, renk ve desen gibi bilgiler forma otomatik aktarılır.",
}: AiAutofillCardProps) {
  return (
    <div className="mt-5 rounded-2xl bg-[#7c5cff]/5 p-4">
      <div className="flex items-start gap-3">
        <Sparkles size={20} className="mt-0.5 shrink-0 text-[#7c5cff]" />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-800">
            AI ile otomatik doldur
          </p>

          <p className="mt-1 text-xs leading-5 text-gray-500">
            {descriptionText}
          </p>

          <button
            type="button"
            onClick={onAnalyze}
            disabled={disabled || isAnalyzing}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#7c5cff] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#6d4ff0] disabled:cursor-not-allowed disabled:opacity-50"
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

          {analysisMessage && (
            <p className="mt-2.5 text-xs font-medium text-[#7c5cff]">
              {analysisMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
