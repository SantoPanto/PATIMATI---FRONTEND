import {
  Camera,
  ChevronDown,
  Images,
  Info,
  Loader2,
  Pencil,
  PlusCircle,
  Scale,
  Sparkles,
  Syringe,
  Trash2,
} from "lucide-react";
import { type ChangeEvent, type FormEvent, useRef, useState, useEffect } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import PetAiReportCard from "../components/PetAiReportCard";
import PetHealthInfo from "../components/PetHealthInfo";
import PetNotesSection from "../components/PetNotesSection";
import PetVaccinationsSection from "../components/PetVaccinationsSection";
import PetWeightSection from "../components/PetWeightSection";
import { ApiError } from "../services/api";
import { hataNedeniMesaji, petRaporuAl } from "../services/petAnalizi";
import {
  addOwnerTreatmentNote,
  addPetVaccination,
  addPetWeightLog,
  createPet,
  deletePet,
  deletePetTreatmentNote,
  getMyPets,
  getPetTreatmentNotes,
  getPetVaccinations,
  getPetWeightLogs,
  savePetAiReport,
  updatePet,
  updatePetTreatmentNote,
} from "../services/pets";
import type {
  AgeGroup,
  Gender,
  Pet,
  PetTreatmentNoteResponse,
  PetVaccination,
  PetWeightLog,
  Species,
} from "../services/types";
import { getAgeLabel, getGenderLabel, getSpeciesLabel } from "../utils/adPresentation";

const MAX_FILE_SIZE_MB = 5;

const SPECIES_OPTIONS: Species[] = ["CAT", "DOG"];
const GENDER_OPTIONS: Gender[] = ["MALE", "FEMALE"];
const AGE_GROUP_OPTIONS: AgeGroup[] = ["BABY", "YOUNG", "ADULT", "SENIOR"];

type PanelKey = "notes" | "vaccinations" | "weight" | "ai";

type FormState = {
  name: string;
  species: Species;
  breed: string;
  gender: Gender | "";
  ageGroup: AgeGroup | "";
  birthDate: string;
  sterilized: "" | "yes" | "no";
  microchipNumber: string;
  chronicConditions: string;
  allergies: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  species: "CAT",
  breed: "",
  gender: "",
  ageGroup: "",
  birthDate: "",
  sterilized: "",
  microchipNumber: "",
  chronicConditions: "",
  allergies: "",
};

export default function MyPetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [editingPetId, setEditingPetId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [extraPhotos, setExtraPhotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extraPhotosInputRef = useRef<HTMLInputElement>(null);

  const [expandedPetId, setExpandedPetId] = useState<number | null>(null);
  const [activePanel, setActivePanel] = useState<PanelKey | null>(null);

  const [notesByPetId, setNotesByPetId] = useState<Record<number, PetTreatmentNoteResponse[]>>({});
  const [vaccinationsByPetId, setVaccinationsByPetId] = useState<Record<number, PetVaccination[]>>({});
  const [weightLogsByPetId, setWeightLogsByPetId] = useState<Record<number, PetWeightLog[]>>({});
  const [panelLoading, setPanelLoading] = useState(false);

  const [aiAnalyzingPetId, setAiAnalyzingPetId] = useState<number | null>(null);
  const [aiErrorByPetId, setAiErrorByPetId] = useState<Record<number, string>>({});
  const aiFileInputRef = useRef<HTMLInputElement>(null);
  const aiTargetPetId = useRef<number | null>(null);

  const loadPets = () => {
    setIsLoading(true);
    getMyPets()
      .then((data) => setPets(data))
      .catch(() => setErrorMessage("Hayvanlarınız yüklenirken bir hata oluştu."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadPets();
  }, []);

  const resetForm = () => {
    setEditingPetId(null);
    setForm(EMPTY_FORM);
    setPhoto(null);
    setPhotoPreview(null);
    setExtraPhotos([]);
  };

  const startEdit = (pet: Pet) => {
    setEditingPetId(pet.id);
    setForm({
      name: pet.name,
      species: pet.species === "UNKNOWN" ? "CAT" : pet.species,
      breed: pet.breed ?? "",
      gender: pet.gender && pet.gender !== "UNKNOWN" ? pet.gender : "",
      ageGroup: pet.ageGroup && pet.ageGroup !== "UNKNOWN" ? pet.ageGroup : "",
      birthDate: pet.birthDate ?? "",
      sterilized: pet.sterilized == null ? "" : pet.sterilized ? "yes" : "no",
      microchipNumber: pet.microchipNumber ?? "",
      chronicConditions: pet.chronicConditions ?? "",
      allergies: pet.allergies ?? "",
    });
    setPhoto(null);
    setPhotoPreview(pet.photoUrl);
    setExtraPhotos([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`Fotoğraf en fazla ${MAX_FILE_SIZE_MB} MB olabilir.`);
      return;
    }
    setErrorMessage(null);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleExtraPhotosChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }
    const tooLarge = files.some((f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (tooLarge) {
      setErrorMessage(`Her fotoğraf en fazla ${MAX_FILE_SIZE_MB} MB olabilir.`);
      return;
    }
    setErrorMessage(null);
    setExtraPhotos((prev) => [...prev, ...files]);
    event.target.value = "";
  };

  const removeExtraPhoto = (index: number) => {
    setExtraPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!form.name.trim()) {
      setErrorMessage("Hayvanın adı zorunludur.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        species: form.species,
        breed: form.breed.trim() || undefined,
        gender: form.gender || undefined,
        ageGroup: form.ageGroup || undefined,
        birthDate: form.birthDate || undefined,
        sterilized: form.sterilized === "" ? undefined : form.sterilized === "yes",
        microchipNumber: form.microchipNumber.trim() || undefined,
        chronicConditions: form.chronicConditions.trim() || undefined,
        allergies: form.allergies.trim() || undefined,
        photo: photo ?? undefined,
        extraPhotos: extraPhotos.length > 0 ? extraPhotos : undefined,
      };

      if (editingPetId) {
        await updatePet(editingPetId, payload);
        setSuccessMessage("Hayvan bilgileri güncellendi.");
      } else {
        await createPet(payload);
        setSuccessMessage("Hayvan eklendi.");
      }

      resetForm();
      loadPets();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Kaydedilirken bir hata oluştu, tekrar deneyin.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (pet: Pet) => {
    const confirmed = window.confirm(`"${pet.name}" silinsin mi? Bu işlem geri alınamaz.`);
    if (!confirmed) {
      return;
    }

    try {
      await deletePet(pet.id);
      if (editingPetId === pet.id) {
        resetForm();
      }
      loadPets();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Silinirken bir hata oluştu, tekrar deneyin.",
      );
    }
  };

  const togglePanel = (pet: Pet, panel: PanelKey) => {
    if (expandedPetId === pet.id && activePanel === panel) {
      setActivePanel(null);
      return;
    }

    setExpandedPetId(pet.id);
    setActivePanel(panel);

    if (panel === "notes" && !notesByPetId[pet.id]) {
      setPanelLoading(true);
      getPetTreatmentNotes(pet.id)
        .then((notes) => setNotesByPetId((prev) => ({ ...prev, [pet.id]: notes })))
        .catch(() => setErrorMessage("Notlar yüklenirken bir hata oluştu."))
        .finally(() => setPanelLoading(false));
    }

    if (panel === "vaccinations" && !vaccinationsByPetId[pet.id]) {
      setPanelLoading(true);
      getPetVaccinations(pet.id)
        .then((data) => setVaccinationsByPetId((prev) => ({ ...prev, [pet.id]: data })))
        .catch(() => setErrorMessage("Aşı kayıtları yüklenirken bir hata oluştu."))
        .finally(() => setPanelLoading(false));
    }

    if (panel === "weight" && !weightLogsByPetId[pet.id]) {
      setPanelLoading(true);
      getPetWeightLogs(pet.id)
        .then((data) => setWeightLogsByPetId((prev) => ({ ...prev, [pet.id]: data })))
        .catch(() => setErrorMessage("Kilo kayıtları yüklenirken bir hata oluştu."))
        .finally(() => setPanelLoading(false));
    }
  };

  const refreshNotes = (petId: number) =>
    getPetTreatmentNotes(petId).then((notes) => setNotesByPetId((prev) => ({ ...prev, [petId]: notes })));

  const openAiPicker = (petId: number) => {
    aiTargetPetId.current = petId;
    aiFileInputRef.current?.click();
  };

  const handleAiFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const petId = aiTargetPetId.current;
    if (!file || !petId) {
      return;
    }

    setAiAnalyzingPetId(petId);
    setAiErrorByPetId((prev) => ({ ...prev, [petId]: "" }));

    try {
      const sonuc = await petRaporuAl(file);
      if (!sonuc.gecerli) {
        setAiErrorByPetId((prev) => ({ ...prev, [petId]: hataNedeniMesaji(sonuc.hata_nedeni) }));
        return;
      }
      const guncelHayvan = await savePetAiReport(petId, JSON.stringify(sonuc));
      setPets((prev) => prev.map((p) => (p.id === petId ? guncelHayvan : p)));
    } catch (error) {
      setAiErrorByPetId((prev) => ({
        ...prev,
        [petId]:
          error instanceof ApiError
            ? error.message
            : "Analiz edilemedi, tekrar deneyin.",
      }));
    } finally {
      setAiAnalyzingPetId(null);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
  const labelClass = "mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-300";
  const cardClass =
    "rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900";

  const panelButtonClass = (pet: Pet, panel: PanelKey) =>
    `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
      expandedPetId === pet.id && activePanel === panel
        ? "bg-[#2563EB] text-white"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
    }`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      <Header />

      <input
        ref={aiFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleAiFileChange}
      />

      <main className="mx-auto max-w-[800px] px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-[#F97316]">Hesabım</p>
          <h1 className="mt-1 text-[32px] font-bold leading-10 text-[#0F172A] dark:text-[#F1F5F9]">
            Evcil Hayvanlarım
          </h1>
          <p className="mt-2 text-base leading-6 text-[#64748B] dark:text-[#94A3B8]">
            Hayvanlarınızı kaydedin; bir veterineri müşteri olarak eklediğinizde
            sağlık bilgilerini, aşı ve kilo takibini birlikte görebilirsiniz.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 space-y-5">
          <section className={cardClass}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              {editingPetId ? <Pencil size={20} className="text-[#2563EB]" /> : <PlusCircle size={20} className="text-[#2563EB]" />}
              {editingPetId ? "Hayvanı Düzenle" : "Hayvan Ekle"}
            </h2>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />

            <div className="mb-4 flex items-center gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800">
                {photoPreview && (
                  <img src={photoPreview} alt="Hayvan fotoğrafı" className="h-full w-full object-cover" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <Camera size={16} />
                Kapak Fotoğrafı Seç
              </button>
            </div>

            <div className="mb-4">
              <input
                ref={extraPhotosInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleExtraPhotosChange}
              />
              <button
                type="button"
                onClick={() => extraPhotosInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                <Images size={16} />
                Galeriye Fotoğraf Ekle
              </button>

              {extraPhotos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {extraPhotos.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="relative h-14 w-14 overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-800">
                      <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExtraPhoto(index)}
                        aria-label="Kaldır"
                        className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-[10px] text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Adı</label>
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                  className={inputClass}
                  placeholder="Boncuk"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Tür</label>
                  <select
                    value={form.species}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, species: event.target.value as Species }))
                    }
                    className={inputClass}
                  >
                    {SPECIES_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {getSpeciesLabel(option)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Irk</label>
                  <input
                    value={form.breed}
                    onChange={(event) => setForm((prev) => ({ ...prev, breed: event.target.value }))}
                    className={inputClass}
                    placeholder="Tekir"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Cinsiyet</label>
                  <select
                    value={form.gender}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, gender: event.target.value as Gender | "" }))
                    }
                    className={inputClass}
                  >
                    <option value="">Belirtilmemiş</option>
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {getGenderLabel(option)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Yaş Grubu</label>
                  <select
                    value={form.ageGroup}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, ageGroup: event.target.value as AgeGroup | "" }))
                    }
                    className={inputClass}
                  >
                    <option value="">Belirtilmemiş</option>
                    {AGE_GROUP_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {getAgeLabel(option)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Doğum Tarihi</label>
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, birthDate: event.target.value }))}
                    max={new Date().toISOString().slice(0, 10)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Kısırlaştırma</label>
                  <select
                    value={form.sterilized}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, sterilized: event.target.value as FormState["sterilized"] }))
                    }
                    className={inputClass}
                  >
                    <option value="">Belirtilmemiş</option>
                    <option value="yes">Kısırlaştırılmış</option>
                    <option value="no">Kısırlaştırılmamış</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Mikroçip No</label>
                <input
                  value={form.microchipNumber}
                  onChange={(event) => setForm((prev) => ({ ...prev, microchipNumber: event.target.value }))}
                  className={inputClass}
                  placeholder="985 xxx xxx xxx xxx"
                />
              </div>

              <div>
                <label className={labelClass}>Kronik Hastalık / Rahatsızlık</label>
                <textarea
                  value={form.chronicConditions}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, chronicConditions: event.target.value }))
                  }
                  rows={2}
                  className={inputClass}
                  placeholder="Örn. eklem rahatsızlığı, kalp üfürümü..."
                />
              </div>

              <div>
                <label className={labelClass}>Alerjiler</label>
                <textarea
                  value={form.allergies}
                  onChange={(event) => setForm((prev) => ({ ...prev, allergies: event.target.value }))}
                  rows={2}
                  className={inputClass}
                  placeholder="Örn. tavuk proteinine alerjik"
                />
              </div>
            </div>
          </section>

          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
            >
              <Info size={19} className="mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
              <span>{successMessage}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-xl bg-[#2563EB] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Kaydediliyor..." : editingPetId ? "Güncelle" : "Ekle"}
            </button>
            {editingPetId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Vazgeç
              </button>
            )}
          </div>
        </form>

        <h2 className="mb-4 text-lg font-bold">Hayvanlarım</h2>

        {isLoading ? (
          <div className={cardClass}>
            <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
          </div>
        ) : pets.length === 0 ? (
          <div className={cardClass}>
            <p className="text-sm text-gray-500 dark:text-slate-400">Henüz eklenmiş bir hayvanınız yok.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pets.map((pet) => (
              <div key={pet.id} className={cardClass}>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800">
                    {pet.photoUrl && (
                      <img src={pet.photoUrl} alt={pet.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">{pet.name}</h3>
                    <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                      {getSpeciesLabel(pet.species)}
                      {pet.breed ? ` · ${pet.breed}` : ""}
                      {pet.gender ? ` · ${getGenderLabel(pet.gender)}` : ""}
                      {pet.ageGroup ? ` · ${getAgeLabel(pet.ageGroup)}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => startEdit(pet)}
                      aria-label="Düzenle"
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(pet)}
                      aria-label="Sil"
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>

                {pet.photoUrls.length > 1 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {pet.photoUrls.slice(1).map((url) => (
                      <div key={url} className="h-12 w-12 overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-800">
                        <img src={url} alt={pet.name} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3">
                  <PetHealthInfo pet={pet} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => togglePanel(pet, "notes")} className={panelButtonClass(pet, "notes")}>
                    <ChevronDown
                      size={13}
                      className={`transition-transform ${expandedPetId === pet.id && activePanel === "notes" ? "rotate-180" : ""}`}
                    />
                    Notlar
                    {pet.treatmentNoteCount > 0 && ` (${pet.treatmentNoteCount})`}
                  </button>
                  <button type="button" onClick={() => togglePanel(pet, "vaccinations")} className={panelButtonClass(pet, "vaccinations")}>
                    <Syringe size={13} />
                    Aşılar
                  </button>
                  <button type="button" onClick={() => togglePanel(pet, "weight")} className={panelButtonClass(pet, "weight")}>
                    <Scale size={13} />
                    Kilo Takibi
                  </button>
                  <button type="button" onClick={() => togglePanel(pet, "ai")} className={panelButtonClass(pet, "ai")}>
                    <Sparkles size={13} />
                    AI Profili
                  </button>
                </div>

                {expandedPetId === pet.id && activePanel && (
                  <div className="mt-3 border-t border-gray-100 pt-3 dark:border-slate-800">
                    {activePanel === "notes" && (
                      <PetNotesSection
                        notes={notesByPetId[pet.id] ?? []}
                        isLoading={panelLoading && !notesByPetId[pet.id]}
                        addPlaceholder="Bir gözlem ekleyin (ör. bugün iştahsızdı)..."
                        emptyLabel="Henüz bir not yok."
                        onAdd={async (content) => {
                          await addOwnerTreatmentNote(pet.id, content);
                          await refreshNotes(pet.id);
                        }}
                        onUpdate={async (noteId, content) => {
                          await updatePetTreatmentNote(pet.id, noteId, content);
                          await refreshNotes(pet.id);
                        }}
                        onDelete={async (noteId) => {
                          await deletePetTreatmentNote(pet.id, noteId);
                          await refreshNotes(pet.id);
                        }}
                      />
                    )}

                    {activePanel === "vaccinations" && (
                      <PetVaccinationsSection
                        vaccinations={vaccinationsByPetId[pet.id] ?? []}
                        isLoading={panelLoading && !vaccinationsByPetId[pet.id]}
                        onAdd={async (payload) => {
                          await addPetVaccination(pet.id, payload);
                          const data = await getPetVaccinations(pet.id);
                          setVaccinationsByPetId((prev) => ({ ...prev, [pet.id]: data }));
                        }}
                      />
                    )}

                    {activePanel === "weight" && (
                      <PetWeightSection
                        logs={weightLogsByPetId[pet.id] ?? []}
                        isLoading={panelLoading && !weightLogsByPetId[pet.id]}
                        onAdd={async (payload) => {
                          await addPetWeightLog(pet.id, payload);
                          const data = await getPetWeightLogs(pet.id);
                          setWeightLogsByPetId((prev) => ({ ...prev, [pet.id]: data }));
                        }}
                      />
                    )}

                    {activePanel === "ai" && (
                      <div className="space-y-3">
                        {pet.aiReport ? (
                          <PetAiReportCard aiReport={pet.aiReport} aiReportAt={pet.aiReportAt} />
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-slate-400">
                            Henüz bir AI profili oluşturulmadı.
                          </p>
                        )}

                        {aiErrorByPetId[pet.id] && (
                          <p className="text-sm text-red-600 dark:text-red-400">{aiErrorByPetId[pet.id]}</p>
                        )}

                        <button
                          type="button"
                          onClick={() => openAiPicker(pet.id)}
                          disabled={aiAnalyzingPetId === pet.id}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {aiAnalyzingPetId === pet.id ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Analiz ediliyor...
                            </>
                          ) : (
                            <>
                              <Sparkles size={16} />
                              {pet.aiReport ? "Yeniden Analiz Et" : "Fotoğraftan Analiz Et"}
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
