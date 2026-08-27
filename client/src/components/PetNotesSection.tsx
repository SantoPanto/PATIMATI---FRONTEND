import { Check, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { PetTreatmentNoteResponse } from "../services/types";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

/**
 * Not listesi + ekleme/düzenleme/silme -- hem "Evcil Hayvanlarım" (sahip
 * gözlemi) hem de veteriner panelinde (tedavi notu) AYNI bileşen kullanılır
 * (26.08). Kimin ne yapabileceği tamamen sunucudan gelen `canEdit` ile
 * belirlenir; bu bileşen yetki kararı VERMEZ, yalnızca gösterir.
 */
export default function PetNotesSection({
  notes,
  isLoading,
  onAdd,
  onUpdate,
  onDelete,
  addPlaceholder,
  emptyLabel,
}: {
  notes: PetTreatmentNoteResponse[];
  isLoading: boolean;
  onAdd: (content: string) => Promise<void>;
  onUpdate: (noteId: number, content: string) => Promise<void>;
  onDelete: (noteId: number) => Promise<void>;
  addPlaceholder: string;
  emptyLabel: string;
}) {
  const [newContent, setNewContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    setIsSaving(true);
    try {
      await onAdd(newContent.trim());
      setNewContent("");
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (note: PetTreatmentNoteResponse) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const handleUpdate = async (noteId: number) => {
    if (!editContent.trim()) return;
    setBusyId(noteId);
    try {
      await onUpdate(noteId, editContent.trim());
      setEditingId(null);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (noteId: number) => {
    if (!window.confirm("Bu not silinsin mi?")) return;
    setBusyId(noteId);
    try {
      await onDelete(noteId);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-2">
      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">{emptyLabel}</p>
      ) : (
        notes.map((note) => (
          <div key={note.id} className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-slate-800/60">
            {editingId === note.id ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(event) => setEditContent(event.target.value)}
                  rows={2}
                  className={inputClass}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdate(note.id)}
                    disabled={busyId === note.id || !editContent.trim()}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Check size={14} />
                    Kaydet
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:border-slate-700 dark:text-slate-300"
                  >
                    <X size={14} />
                    Vazgeç
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[#0F172A] dark:text-[#F1F5F9]">{note.content}</p>
                  {note.canEdit && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(note)}
                        aria-label="Düzenle"
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200 dark:text-slate-400 dark:hover:bg-slate-700"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(note.id)}
                        disabled={busyId === note.id}
                        aria-label="Sil"
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-100 disabled:opacity-60 dark:hover:bg-red-500/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                  {note.authorType === "VET" ? "Veteriner" : "Sahip"} · {note.vetName} ·{" "}
                  {new Date(note.createdAt).toLocaleDateString("tr-TR")}
                </p>
              </>
            )}
          </div>
        ))
      )}

      <div className="flex gap-2">
        <input
          value={newContent}
          onChange={(event) => setNewContent(event.target.value)}
          placeholder={addPlaceholder}
          className={inputClass}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={isSaving || !newContent.trim()}
          className="shrink-0 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Ekle
        </button>
      </div>
    </div>
  );
}
