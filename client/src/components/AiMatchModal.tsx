import { Sparkles, X } from "lucide-react";
import MatchedAdCard from "./MatchedAdCard";
import type { MatchedAdResponseDTO } from "../services/types";

interface AiMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: MatchedAdResponseDTO[];
}

export default function AiMatchModal({
  isOpen,
  onClose,
  matches,
}: AiMatchModalProps) {
  if (!isOpen || !matches || matches.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 mb-6">
          <h2 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <Sparkles className="text-[#F97316]" size={24} />
            Olası Eşleşmeler Bulundu!
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#64748B] hover:bg-[#F1F5F9] transition"
            aria-label="Kapat"
          >
            <X size={24} />
          </button>
        </div>

        <p className="text-[#64748B] mb-6">
          İlanını oluşturmadan önce, sistemimizde fotoğrafı yüklediğin hayvana benzeyen bazı ilanlar bulduk. Lütfen bunları incele:
        </p>

        <div className="grid gap-4">
          {matches.map((match, idx) => (
            <MatchedAdCard
              key={match.ad?.id || idx}
              match={match}
              variant="modal"
            />
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#0F172A] px-6 py-3 font-bold text-white transition hover:bg-[#334155]"
          >
            İlan Oluşturmaya Devam Et
          </button>
        </div>
      </div>
    </div>
  );
}
