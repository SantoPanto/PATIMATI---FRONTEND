import {
  Camera,
  CheckCircle2,
  Info,
  MapPin,
  Package,
  Pencil,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import MapPicker from "../components/MapPicker";
import ServiceHero from "../components/ServiceHero";
import StarRating from "../components/StarRating";
import { ApiError } from "../services/api";
import { getMyPetShop, upsertMyPetShop } from "../services/petshop";
import { createProduct, deleteProduct, listMyProducts, updateProduct } from "../services/petshopProducts";
import type { PetShopProductResponse } from "../services/types";

const MAX_FILE_SIZE_MB = 5;

/**
 * Petshop Paneli -- `VetPanelPage.tsx` deseni ama YALNIZCA 2 sekme:
 * "Petshop Kartı" ve "Ürünlerim". "Gelen İstekler"/"Müşterilerim" YOK --
 * bir petshop'un veterinerin aksine süregelen bir müşteri ilişkisi takip
 * etmesi gerekmiyor (plan "Bilinçli kapsam sınırları").
 */
type PetShopTab = "card" | "products";

export default function PetShopPanelPage() {
  const [activeTab, setActiveTab] = useState<PetShopTab>("card");

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      <Header />

      <ServiceHero icon={ShoppingBag} eyebrow="Petshop Paneli" title="Petshop Paneli" color="#7c3aed" />

      <main className="mx-auto max-w-[900px] px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-slate-800">
          <TabButton active={activeTab === "card"} onClick={() => setActiveTab("card")} icon={<ShoppingBag size={16} />}>
            Petshop Kartı
          </TabButton>
          <TabButton active={activeTab === "products"} onClick={() => setActiveTab("products")} icon={<Package size={16} />}>
            Ürünlerim
          </TabButton>
        </div>

        {activeTab === "card" && <CardTab />}
        {activeTab === "products" && <ProductsTab />}
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

function CardTab() {
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
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    getMyPetShop()
      .then((shop) => {
        if (cancelled || !shop) {
          return;
        }
        setName(shop.name);
        setAddress(shop.address);
        setCity(shop.city);
        setDistrict(shop.district ?? "");
        setPhone(shop.phone);
        setWorkingHours(shop.workingHours ?? "");
        setExistingPhotoUrl(shop.photoUrl);
        setLatitude(shop.latitude);
        setLongitude(shop.longitude);
      })
      .catch(() => {
        setErrorMessage("Petshop bilgileri yüklenirken bir hata oluştu.");
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
      setErrorMessage("Petshop adı, adres, il ve telefon zorunludur.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await upsertMyPetShop({
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        district: district.trim() || undefined,
        phone: phone.trim(),
        workingHours: workingHours.trim() || undefined,
        photo: newPhoto ?? undefined,
        // Yalnızca ikisi BİRDEN seçiliyse gönderilir -- konum ayarlanmadan
        // kart kaydedilebilmeli, tek biri gönderilirse backend'in
        // doğrulaması reddeder (plan §6, VetClinic ile aynı desen).
        ...(latitude !== null && longitude !== null ? { latitude, longitude } : {}),
      });

      setExistingPhotoUrl(updated.photoUrl);
      setNewPhoto(null);
      setNewPhotoPreview(null);
      setSuccessMessage("Petshop bilgi kartınız kaydedildi.");
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
                alt="Petshop fotoğrafı"
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
        <h2 className="mb-4 text-lg font-bold">Petshop Bilgileri</h2>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Petshop Adı</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className={inputClass}
              placeholder="Pati Petshop"
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

      <section className={cardClass}>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <MapPin size={20} className="text-[#2563EB]" />
          Konum
        </h2>
        <MapPicker
          latitude={latitude}
          longitude={longitude}
          onChange={(lat, lng) => {
            setLatitude(lat);
            setLongitude(lng);
          }}
        />
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

function ProductsTab() {
  const [products, setProducts] = useState<PetShopProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ürün ekleme formu
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Satır-içi düzenleme (VetClinicReviewsSection'daki editingId deseniyle aynı)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadProducts = () => {
    setIsLoading(true);
    return listMyProducts()
      .then((page) => setProducts(page.content))
      .catch(() => setErrorMessage("Ürünler yüklenirken bir hata oluştu."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadProducts();
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
    setPhoto(file);
  };

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const priceValue = Number(price);
    if (!name.trim() || !price.trim() || Number.isNaN(priceValue) || priceValue <= 0) {
      setErrorMessage("Ürün adı ve 0'dan büyük bir fiyat zorunludur.");
      return;
    }

    setIsAdding(true);
    try {
      const created = await createProduct({
        name: name.trim(),
        description: description.trim() || undefined,
        price: priceValue,
        photo: photo ?? undefined,
      });
      setProducts((prev) => [created, ...prev]);
      setName("");
      setDescription("");
      setPrice("");
      setPhoto(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Ürün eklenirken bir hata oluştu.",
      );
    } finally {
      setIsAdding(false);
    }
  };

  const startEdit = (product: PetShopProductResponse) => {
    setEditingId(product.id);
    setEditName(product.name);
    setEditDescription(product.description ?? "");
    setEditPrice(String(product.price));
  };

  const handleUpdate = async (productId: number) => {
    const priceValue = Number(editPrice);
    if (!editName.trim() || Number.isNaN(priceValue) || priceValue <= 0) {
      setErrorMessage("Ürün adı ve 0'dan büyük bir fiyat zorunludur.");
      return;
    }

    setBusyId(productId);
    setErrorMessage(null);
    try {
      const updated = await updateProduct(productId, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        price: priceValue,
      });
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
      setEditingId(null);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Ürün güncellenirken bir hata oluştu.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (productId: number) => {
    if (!window.confirm("Bu ürün silinsin mi?")) return;
    setBusyId(productId);
    setErrorMessage(null);
    try {
      await deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch {
      setErrorMessage("Ürün silinirken bir hata oluştu.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleAdd} className={`${cardClass} space-y-4`}>
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Plus size={20} className="text-[#2563EB]" />
          Ürün Ekle
        </h2>

        <div>
          <label className={labelClass}>Ürün Adı</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className={inputClass}
            placeholder="Kedi Maması 1kg"
          />
        </div>

        <div>
          <label className={labelClass}>Açıklama</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            className={inputClass}
            placeholder="Ürün hakkında kısa bilgi (isteğe bağlı)"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Fiyat (₺)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
              className={inputClass}
              placeholder="149.90"
            />
          </div>
          <div>
            <label className={labelClass}>Fotoğraf (isteğe bağlı)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className={inputClass}
            />
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
          >
            <Info size={19} className="mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isAdding}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={16} />
          {isAdding ? "Ekleniyor..." : "Ürünü Ekle"}
        </button>
      </form>

      {isLoading ? (
        <div className={cardClass}>
          <p className="text-sm text-gray-500 dark:text-slate-400">Yükleniyor...</p>
        </div>
      ) : products.length === 0 ? (
        <div className={cardClass}>
          <p className="text-sm text-gray-500 dark:text-slate-400">Henüz bir ürün eklemediniz.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className={cardClass}>
              {editingId === product.id ? (
                <div className="space-y-3">
                  <input
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    className={inputClass}
                  />
                  <textarea
                    value={editDescription}
                    onChange={(event) => setEditDescription(event.target.value)}
                    rows={2}
                    className={inputClass}
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editPrice}
                    onChange={(event) => setEditPrice(event.target.value)}
                    className={inputClass}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdate(product.id)}
                      disabled={busyId === product.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Kaydet
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:border-slate-700 dark:text-slate-300"
                    >
                      Vazgeç
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800">
                    {product.photoUrl && (
                      <img
                        src={product.photoUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                        {product.name}
                      </h3>
                      <span className="font-bold text-[#2563EB]">
                        ₺{product.price.toFixed(2)}
                      </span>
                    </div>
                    {product.description && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                        {product.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <StarRating value={product.averageRating ?? 0} readOnly size={14} />
                      <span className="text-xs text-gray-400 dark:text-slate-500">
                        {product.reviewCount > 0 && product.averageRating !== null
                          ? `${product.averageRating.toFixed(1)} (${product.reviewCount})`
                          : "Henüz değerlendirme yok"}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(product)}
                      aria-label="Düzenle"
                      className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200 dark:text-slate-400 dark:hover:bg-slate-700"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product.id)}
                      disabled={busyId === product.id}
                      aria-label="Sil"
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-100 disabled:opacity-60 dark:hover:bg-red-500/10"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
