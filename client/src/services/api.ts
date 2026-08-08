const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export async function postListing(formData: FormData) {
  const response = await fetch(new URL("/listings", API_BASE_URL).toString(), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "İlan gönderimi başarısız oldu.");
  }

  return response.json();
}
