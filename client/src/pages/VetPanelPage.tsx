import {
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  Inbox,
  Info,
  Scale,
  Sparkles,
  Stethoscope,
  Syringe,
  Users,
  X,
} from "lucide-react";
import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import PetAiReportCard from "../components/PetAiReportCard";
import PetHealthInfo from "../components/PetHealthInfo";
import PetNotesSection from "../components/PetNotesSection";
import PetVaccinationsSection from "../components/PetVaccinationsSection";
import PetWeightSection from "../components/PetWeightSection";
import { ApiError } from "../services/api";
import { getMyClinic, upsertMyClinic } from "../services/vet";
import {
  acceptRequest,
  addTreatmentNote,
  getCustomerPets,
  getIncomingRequests,
  getMyCustomers,
  rejectRequest,
} from "../services/vetCustomers";
import {
  addPetVaccination,
  addPetWeightLog,
  deletePetTreatmentNote,
  getPetTreatmentNotes,
  getPetVaccinations,
  getPetWeightLogs,
  updatePetTreatmentNote,
} from "../services/pets";
import type {
  Pet,
  PetTreatmentNoteResponse,
  PetVaccination,
  PetWeightLog,
  VetCustomerRequestResponse,
  VetCustomerResponse,
} from "../services/types";
import { getAgeLabel, getGenderLabel, getSpeciesLabel } from "../utils/adPresentation";

const MAX_FILE_SIZE_MB = 5;

type VetTab = "clinic" | "requests" | "customers";

export default function VetPanelPage() {
  const [activeTab, setActiveTab] = useState<VetTab>("clinic");

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      <Header />

      <main className="mx-auto max-w-[900px] px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-[#2563EB]">Veteriner Paneli</p>
          <h1 className="mt-1 flex items-center gap-2 text-[32px] font-bold leading-10 text-[#0F172A] dark:text-[#F1F5F9]">
            <Stethoscope size={28} className="text-[#2563EB]" />
            Veteriner Paneli
          </h1>
        </div>

        <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-slate-800">
          <TabButton active={activeTab === "clinic"} onClick={() => setActiveTab("clinic")} icon={<Stethoscope size={16} />}>
            Klinik Kartı
          </TabButton>
          <TabButton active={activeTab === "requests"} onClick={() => setActiveTab("requests")} icon={<Inbox size={16} />}>
            Gelen İstekler
          </TabButton>
          <TabButton active={activeTab === "customers"} onClick={() => setActiveTab("customers")} icon={<Users size={16} />}>
            Müşterilerim
          </TabButton>
        </div>

        {activeTab === "clinic" && <ClinicCardTab />}
        {activeTab === "requests" && <IncomingRequestsTab />}
        {activeTab === "customers" && <CustomersTab />}
      </main>

      <Footer />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
        active
          ? "border-[#2563EB] text-[#2563EB]"
          : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const labelClass = "mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-300";
const cardClass =
  "rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900";

function ClinicCardTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [workingHours, setWorkingHours] = useState("");

  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    getMyClinic()
      .then((clinic) => {
        if (cancelled || !clinic) {
          return;
        }
        setName(clinic.name);
        setAddress(clinic.address);
        setCity(clinic.city);
        setDistrict(clinic.district ?? "");
        setPhone(clinic.phone);
        setWorkingHours(clinic.workingHours ?? "");
        setExistingPhotoUrl(clinic.photoUrl);
      })
      .catch(() => {
        setErrorMessage("Klinik bilgileri yüklenirken bir hata oluştu.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
    setNewPhoto(file);
    setNewPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim() || !address.trim() || !city.trim() || !phone.trim()) {
      setErrorMessage("Klinik adı, adres, il ve telefon zorunludur.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await upsertMyClinic({
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        district: district.trim() || undefined,
        phone: phone.trim(),
        workingHours: workingHours.trim() || undefined,
        photo: newPhoto ?? undefined,
      });

      setExistingPhotoUrl(updated.photoUrl);
      setNewPhoto(null);
      setNewPhotoPreview(null);
      setSuccessMessage("Klinik bilgi kartınız kaydedildi.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Kaydedilirken bir hata oluştu, tekrar deneyin.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const displayedPhoto = newPhotoPreview ?? existingPhotoUrl;

  if (isLoading) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className={cardClass}>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Camera size={20} className="text-[#2563EB]" />
          Fotoğraf
        </h2>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handlePhotoChange}
        />

        <div className="flex items-center gap-4">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800">
            {displayedPhoto && (
              <img
                src={displayedPhoto}
                alt="Klinik fotoğrafı"
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            Fotoğraf Seç
          </button>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="mb-4 text-lg font-bold">Klinik Bilgileri</h2>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Klinik Adı</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className={inputClass}
              placeholder="Pati Veteriner Kliniği"
            />
          </div>

          <div>
            <label className={labelClass}>Adres</label>
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              required
              className={inputClass}
              placeholder="Örnek Mah. 1. Sk. No:1"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>İl</label>
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                required
                className={inputClass}
                placeholder="Ankara"
              />
            </div>
            <div>
              <label className={labelClass}>İlçe</label>
              <input
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                className={inputClass}
                placeholder="Çankaya"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Telefon</label>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
              className={inputClass}
              placeholder="0312 000 00 00"
            />
          </div>

          <div>
            <label className={labelClass}>Çalışma Saatleri</label>
            <input
              value={workingHours}
              onChange={(event) => setWorkingHours(event.target.value)}
              className={inputClass}
              placeholder="Hafta içi 09:00 - 18:00"
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
          <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="w-full rounded-xl bg-[#2563EB] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}

function IncomingRequestsTab() {
  const [requests, setRequests] = useState<VetCustomerRequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<number | null>(null);

  const loadRequests = () => {
    setIsLoading(true);
    getIncomingRequests()
      .then((data) => setRequests(data))
      .catch(() => setErrorMessage("İstekler yüklenirken bir hata oluştu."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAccept = async (id: number) => {
    setActioningId(id);
    try {
      await acceptRequest(id);
      loadRequests();
    } catch {
      setErrorMessage("İstek kabul edilirken bir hata oluştu.");
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: number) => {
    setActioningId(id);
    try {
      await rejectRequest(id);
      loadRequests();
    } catch {
      setErrorMessage("İstek reddedilirken bir hata oluştu.");
    } finally {
      setActioningId(null);
    }
  };

  if (isLoading) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
        >
          <Info size={19} className="mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {requests.length === 0 ? (
        <div className={cardClass}>
          <p className="text-sm text-gray-500 dark:text-slate-400">Bekleyen bir istek yok.</p>
        </div>
      ) : (
        requests.map((req) => (
          <div key={req.id} className={`${cardClass} flex items-center justify-between gap-4`}>
            <div>
              <p className="font-bold text-[#0F172A] dark:text-[#F1F5F9]">{req.requesterName}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">
                {new Date(req.createdAt).toLocaleDateString("tr-TR")}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => handleAccept(req.id)}
                disabled={actioningId === req.id}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <Check size={14} />
                Kabul Et
              </button>
              <button
                type="button"
                onClick={() => handleReject(req.id)}
                disabled={actioningId === req.id}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-60 dark:bg-red-500/10"
              >
                <X size={14} />
                Reddet
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function CustomersTab() {
  const [customers, setCustomers] = useState<VetCustomerResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<VetCustomerResponse | null>(null);
  const [customerPets, setCustomerPets] = useState<Pet[]>([]);
  const [isLoadingPets, setIsLoadingPets] = useState(false);

  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [notes, setNotes] = useState<PetTreatmentNoteResponse[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [vaccinations, setVaccinations] = useState<PetVaccination[]>([]);
  const [isLoadingVaccinations, setIsLoadingVaccinations] = useState(false);
  const [weightLogs, setWeightLogs] = useState<PetWeightLog[]>([]);
  const [isLoadingWeightLogs, setIsLoadingWeightLogs] = useState(false);
  const [activePanel, setActivePanel] = useState<"notes" | "vaccinations" | "weight" | "ai">("notes");

  useEffect(() => {
    getMyCustomers()
      .then((data) => setCustomers(data))
      .catch(() => setErrorMessage("Müşteriler yüklenirken bir hata oluştu."))
      .finally(() => setIsLoading(false));
  }, []);

  const openCustomer = (customer: VetCustomerResponse) => {
    setSelectedCustomer(customer);
    setSelectedPet(null);
    setIsLoadingPets(true);
    getCustomerPets(customer.requesterId)
      .then((pets) => setCustomerPets(pets))
      .catch(() => setErrorMessage("Hayvanlar yüklenirken bir hata oluştu."))
      .finally(() => setIsLoadingPets(false));
  };

  const openPet = (pet: Pet) => {
    setSelectedPet(pet);
    setActivePanel("notes");
    setIsLoadingNotes(true);
    getPetTreatmentNotes(pet.id)
      .then((data) => setNotes(data))
      .catch(() => setErrorMessage("Notlar yüklenirken bir hata oluştu."))
      .finally(() => setIsLoadingNotes(false));
  };

  const openPanel = (panel: "notes" | "vaccinations" | "weight" | "ai") => {
    if (!selectedPet) return;
    setActivePanel(panel);

    if (panel === "vaccinations" && vaccinations.length === 0) {
      setIsLoadingVaccinations(true);
      getPetVaccinations(selectedPet.id)
        .then((data) => setVaccinations(data))
        .catch(() => setErrorMessage("Aşı kayıtları yüklenirken bir hata oluştu."))
        .finally(() => setIsLoadingVaccinations(false));
    }

    if (panel === "weight" && weightLogs.length === 0) {
      setIsLoadingWeightLogs(true);
      getPetWeightLogs(selectedPet.id)
        .then((data) => setWeightLogs(data))
        .catch(() => setErrorMessage("Kilo kayıtları yüklenirken bir hata oluştu."))
        .finally(() => setIsLoadingWeightLogs(false));
    }
  };

  const refreshNotes = async () => {
    if (!selectedPet) return;
    const data = await getPetTreatmentNotes(selectedPet.id);
    setNotes(data);
  };

  if (isLoading) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
      </div>
    );
  }

  if (selectedPet && selectedCustomer) {
    const panelButtonClass = (panel: typeof activePanel) =>
      `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
        activePanel === panel
          ? "bg-[#2563EB] text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      }`;

    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSelectedPet(null)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB]"
        >
          <ChevronLeft size={16} />
          {selectedCustomer.requesterName}'in hayvanlarına dön
        </button>

        <div className={cardClass}>
          <h2 className="mb-1 text-lg font-bold">{selectedPet.name}</h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-slate-400">
            {getSpeciesLabel(selectedPet.species)}
            {selectedPet.breed ? ` · ${selectedPet.breed}` : ""}
            {selectedPet.gender ? ` · ${getGenderLabel(selectedPet.gender)}` : ""}
            {selectedPet.ageGroup ? ` · ${getAgeLabel(selectedPet.ageGroup)}` : ""}
          </p>

          <div className="mb-4">
            <PetHealthInfo pet={selectedPet} />
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => openPanel("notes")} className={panelButtonClass("notes")}>
              Notlar
              {selectedPet.treatmentNoteCount > 0 && ` (${selectedPet.treatmentNoteCount})`}
            </button>
            <button type="button" onClick={() => openPanel("vaccinations")} className={panelButtonClass("vaccinations")}>
              <Syringe size={13} />
              Aşılar
            </button>
            <button type="button" onClick={() => openPanel("weight")} className={panelButtonClass("weight")}>
              <Scale size={13} />
              Kilo Takibi
            </button>
            <button type="button" onClick={() => openPanel("ai")} className={panelButtonClass("ai")}>
              <Sparkles size={13} />
              AI Profili
            </button>
          </div>

          {activePanel === "notes" && (
            <PetNotesSection
              notes={notes}
              isLoading={isLoadingNotes}
              addPlaceholder="Ne yapıldı / ne yapılacak..."
              emptyLabel="Henüz bir not yok."
              onAdd={async (content) => {
                await addTreatmentNote(selectedPet.id, content);
                await refreshNotes();
              }}
              onUpdate={async (noteId, content) => {
                await updatePetTreatmentNote(selectedPet.id, noteId, content);
                await refreshNotes();
              }}
              onDelete={async (noteId) => {
                await deletePetTreatmentNote(selectedPet.id, noteId);
                await refreshNotes();
              }}
            />
          )}

          {activePanel === "vaccinations" && (
            <PetVaccinationsSection
              vaccinations={vaccinations}
              isLoading={isLoadingVaccinations}
              onAdd={async (payload) => {
                await addPetVaccination(selectedPet.id, payload);
                const data = await getPetVaccinations(selectedPet.id);
                setVaccinations(data);
              }}
            />
          )}

          {activePanel === "weight" && (
            <PetWeightSection
              logs={weightLogs}
              isLoading={isLoadingWeightLogs}
              onAdd={async (payload) => {
                await addPetWeightLog(selectedPet.id, payload);
                const data = await getPetWeightLogs(selectedPet.id);
                setWeightLogs(data);
              }}
            />
          )}

          {activePanel === "ai" &&
            (selectedPet.aiReport ? (
              <PetAiReportCard aiReport={selectedPet.aiReport} aiReportAt={selectedPet.aiReportAt} />
            ) : (
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Sahip henüz bir AI profili oluşturmadı.
              </p>
            ))}
        </div>
      </div>
    );
  }

  if (selectedCustomer) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSelectedCustomer(null)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB]"
        >
          <ChevronLeft size={16} />
          Müşterilerime dön
        </button>

        {isLoadingPets ? (
          <div className={cardClass}>
            <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
          </div>
        ) : customerPets.length === 0 ? (
          <div className={cardClass}>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {selectedCustomer.requesterName} henüz bir hayvan eklememiş.
            </p>
          </div>
        ) : (
          customerPets.map((pet) => (
            <button
              key={pet.id}
              type="button"
              onClick={() => openPet(pet)}
              className={`${cardClass} flex w-full items-center gap-4 text-left`}
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800">
                {pet.photoUrl && (
                  <img src={pet.photoUrl} alt={pet.name} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#0F172A] dark:text-[#F1F5F9]">{pet.name}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {getSpeciesLabel(pet.species)}
                  {pet.breed ? ` · ${pet.breed}` : ""}
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                  {pet.lastTreatmentAt
                    ? `Son ziyaret: ${new Date(pet.lastTreatmentAt).toLocaleDateString("tr-TR")}`
                    : "Henüz ziyaret yok"}
                  {pet.treatmentNoteCount > 0 && ` · ${pet.treatmentNoteCount} not`}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
        >
          <Info size={19} className="mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {customers.length === 0 ? (
        <div className={cardClass}>
          <p className="text-sm text-gray-500 dark:text-slate-400">Henüz bir müşteriniz yok.</p>
        </div>
      ) : (
        customers.map((customer) => (
          <button
            key={customer.id}
            type="button"
            onClick={() => openCustomer(customer)}
            className={`${cardClass} flex w-full items-center justify-between text-left`}
          >
            <p className="font-bold text-[#0F172A] dark:text-[#F1F5F9]">{customer.requesterName}</p>
            <ChevronLeft size={18} className="rotate-180 text-gray-400" />
          </button>
        ))
      )}
    </div>
  );
}
