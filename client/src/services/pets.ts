import { request } from "./api";
import type {
  AddVaccinationPayload,
  AddWeightLogPayload,
  Pet,
  PetTreatmentNoteResponse,
  PetUpsertPayload,
  PetVaccination,
  PetWeightLog,
} from "./types";

/**
 * 9. Evcil Hayvanlarım Servisleri (/api/pets)
 */

/**
 * GET /api/pets/me (Bearer)
 */
export function getMyPets(): Promise<Pet[]> {
  return request<Pet[]>("/api/pets/me", {
    method: "GET",
    requiresAuth: true,
  });
}

function toFormData(payload: PetUpsertPayload): FormData {
  const { photo, extraPhotos, ...data } = payload;

  const formData = new FormData();
  const dataBlob = new Blob([JSON.stringify(data)], { type: "application/json" });
  formData.append("data", dataBlob);

  if (photo) {
    formData.append("photo", photo);
  }
  extraPhotos?.forEach((file) => formData.append("extraPhotos", file));

  return formData;
}

/**
 * POST /api/pets (Bearer, multipart/form-data)
 */
export function createPet(payload: PetUpsertPayload): Promise<Pet> {
  return request<Pet>("/api/pets", {
    method: "POST",
    requiresAuth: true,
    body: toFormData(payload),
  });
}

/**
 * PUT /api/pets/{id} (Bearer, multipart/form-data)
 * `photo` verilmezse mevcut kapak fotoğrafı korunur; `extraPhotos` galeriye EKLENİR (üzerine yazmaz).
 */
export function updatePet(petId: number, payload: PetUpsertPayload): Promise<Pet> {
  return request<Pet>(`/api/pets/${petId}`, {
    method: "PUT",
    requiresAuth: true,
    body: toFormData(payload),
  });
}

/**
 * DELETE /api/pets/{id} (Bearer)
 */
export function deletePet(petId: number): Promise<void> {
  return request<void>(`/api/pets/${petId}`, {
    method: "DELETE",
    requiresAuth: true,
  });
}

/**
 * PUT /api/pets/{id}/ai-report (Bearer)
 * "Ben Neyim?" raporunun ham JSON'unu ({@link PetReportResult}) hayvana kaydeder.
 */
export function savePetAiReport(petId: number, reportJson: string): Promise<Pet> {
  return request<Pet>(`/api/pets/${petId}/ai-report`, {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify({ reportJson }),
  });
}

/**
 * GET /api/pets/{id}/treatment-notes (Bearer)
 * Çağıran ya hayvanın sahibi ya da sahibiyle ACCEPTED ilişkisi olan bir
 * veteriner olmalı -- yetki kontrolü sunucuda yapılır.
 */
export function getPetTreatmentNotes(petId: number): Promise<PetTreatmentNoteResponse[]> {
  return request<PetTreatmentNoteResponse[]>(`/api/pets/${petId}/treatment-notes`, {
    method: "GET",
    requiresAuth: true,
  });
}

/**
 * POST /api/pets/{id}/treatment-notes (Bearer)
 * Sahip kendi hayvanına kendi gözlemini ekler (vet'in ekleme ucu: services/vetCustomers.ts).
 */
export function addOwnerTreatmentNote(petId: number, content: string): Promise<PetTreatmentNoteResponse> {
  return request<PetTreatmentNoteResponse>(`/api/pets/${petId}/treatment-notes`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify({ content }),
  });
}

/**
 * PUT /api/pets/{id}/treatment-notes/{noteId} (Bearer)
 * Yalnızca notun ORİJİNAL yazarı (vet ya da sahip) düzenleyebilir.
 */
export function updatePetTreatmentNote(
  petId: number,
  noteId: number,
  content: string,
): Promise<PetTreatmentNoteResponse> {
  return request<PetTreatmentNoteResponse>(`/api/pets/${petId}/treatment-notes/${noteId}`, {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify({ content }),
  });
}

/**
 * DELETE /api/pets/{id}/treatment-notes/{noteId} (Bearer)
 * Yalnızca notun ORİJİNAL yazarı (vet ya da sahip) silebilir.
 */
export function deletePetTreatmentNote(petId: number, noteId: number): Promise<void> {
  return request<void>(`/api/pets/${petId}/treatment-notes/${noteId}`, {
    method: "DELETE",
    requiresAuth: true,
  });
}

/**
 * GET /api/pets/{id}/vaccinations (Bearer)
 * Çağıran ya hayvanın sahibi ya da sahibiyle ACCEPTED ilişkisi olan bir vet olmalı.
 */
export function getPetVaccinations(petId: number): Promise<PetVaccination[]> {
  return request<PetVaccination[]>(`/api/pets/${petId}/vaccinations`, {
    method: "GET",
    requiresAuth: true,
  });
}

/**
 * POST /api/pets/{id}/vaccinations (Bearer)
 * Hem sahip hem de bağlı vet ekleyebilir.
 */
export function addPetVaccination(petId: number, payload: AddVaccinationPayload): Promise<PetVaccination> {
  return request<PetVaccination>(`/api/pets/${petId}/vaccinations`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

/**
 * GET /api/pets/{id}/weight-logs (Bearer)
 */
export function getPetWeightLogs(petId: number): Promise<PetWeightLog[]> {
  return request<PetWeightLog[]>(`/api/pets/${petId}/weight-logs`, {
    method: "GET",
    requiresAuth: true,
  });
}

/**
 * POST /api/pets/{id}/weight-logs (Bearer)
 * Hem sahip hem de bağlı vet ekleyebilir.
 */
export function addPetWeightLog(petId: number, payload: AddWeightLogPayload): Promise<PetWeightLog> {
  return request<PetWeightLog>(`/api/pets/${petId}/weight-logs`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}
