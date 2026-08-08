const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const hasBackend = Boolean(API_BASE_URL);

const fakeUsers = [
  { name: "Elif Yılmaz", email: "elif@example.com", password: "password123" },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestBackend(path: string, body: Record<string, string>) {
  const response = await fetch(new URL(path, API_BASE_URL).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Sunucu hatası oluştu.");
  }

  return response.json();
}

export async function loginUser(email: string, password: string) {
  if (hasBackend) {
    return requestBackend("/auth/login", { email, password });
  }

  await delay(400);

  const user = fakeUsers.find((entry) => entry.email === email && entry.password === password);

  if (!user) {
    throw new Error("Geçersiz e-posta veya şifre.");
  }

  return { name: user.name, email: user.email };
}

export async function registerUser(name: string, email: string, password: string) {
  if (hasBackend) {
    return requestBackend("/auth/register", { name, email, password });
  }

  await delay(400);

  const exists = fakeUsers.some((entry) => entry.email === email);
  if (exists) {
    throw new Error("Bu e-posta adresi zaten kayıtlı.");
  }

  fakeUsers.push({ name, email, password });
  return { name, email };
}

export async function resetPassword(email: string) {
  if (hasBackend) {
    return requestBackend("/auth/reset-password", { email });
  }

  await delay(400);
  const exists = fakeUsers.some((entry) => entry.email === email);

  if (!exists) {
    throw new Error("Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.");
  }

  return { message: "Şifre sıfırlama bağlantısı gönderildi." };
}
