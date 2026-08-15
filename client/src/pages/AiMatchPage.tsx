import {
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ImagePlus,
  PawPrint,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { getUserErrorMessage } from "../utils/errorMessage";

type ListingType = "lost" | "found";

type SelectedImage = {
  id: string;
  file: File;
  preview: string;
};

const MIN_IMAGES = 3;
const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export default function AiMatchPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [listingType, setListingType] =
    useState<ListingType>("lost");
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isMatching, setIsMatching] = useState(false);

  const remainingRequiredImages = Math.max(
    MIN_IMAGES - selectedImages.length,
    0,
  );

  const canStartMatching =
    selectedImages.length >= MIN_IMAGES &&
    selectedImages.length <= MAX_IMAGES &&
    !isMatching;

  const createImageId = (file: File) => {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return `${file.name}-${crypto.randomUUID()}`;
    }

    return `${file.name}-${file.size}-${file.lastModified}-${Date.now()}-${Math.random()}`;
  };

  const openFilePicker = () => {
    setErrorMessage("");

    if (selectedImages.length >= MAX_IMAGES) {
      setErrorMessage(
        `En fazla ${MAX_IMAGES} fotoğraf yükleyebilirsiniz.`,
      );
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFiles = (files: FileList | File[]) => {
    setErrorMessage("");

    const incomingFiles = Array.from(files);

    if (incomingFiles.length === 0) {
      return;
    }

    const availableSlots =
      MAX_IMAGES - selectedImages.length;

    if (availableSlots <= 0) {
      setErrorMessage(
        `En fazla ${MAX_IMAGES} fotoğraf yükleyebilirsiniz.`,
      );
      return;
    }

    const validFiles: File[] = [];
    const validationErrors: string[] = [];

    incomingFiles.forEach((file) => {
      if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        validationErrors.push(
          `${file.name}: Yalnızca JPG, PNG veya WEBP yüklenebilir.`,
        );
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        validationErrors.push(
          `${file.name}: Fotoğraf boyutu 10 MB'dan büyük olamaz.`,
        );
        return;
      }

      const isAlreadySelected = selectedImages.some(
        (image) =>
          image.file.name === file.name &&
          image.file.size === file.size &&
          image.file.lastModified === file.lastModified,
      );

      if (isAlreadySelected) {
        validationErrors.push(
          `${file.name}: Bu fotoğraf zaten yüklendi.`,
        );
        return;
      }

      const isRepeatedInNewFiles = validFiles.some(
        (validFile) =>
          validFile.name === file.name &&
          validFile.size === file.size &&
          validFile.lastModified === file.lastModified,
      );

      if (isRepeatedInNewFiles) {
        validationErrors.push(
          `${file.name}: Aynı fotoğraf birden fazla seçildi.`,
        );
        return;
      }

      validFiles.push(file);
    });

    const filesToAdd = validFiles.slice(0, availableSlots);

    if (validFiles.length > availableSlots) {
      validationErrors.push(
        `Yalnızca ${availableSlots} fotoğraf daha ekleyebilirsiniz.`,
      );
    }

    const newImages: SelectedImage[] = filesToAdd.map(
      (file) => ({
        id: createImageId(file),
        file,
        preview: URL.createObjectURL(file),
      }),
    );

    setSelectedImages((currentImages) => [
      ...currentImages,
      ...newImages,
    ]);

    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors[0]);
    }
  };

  const handleDragEnter = (
    event: DragEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (
    event: DragEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (
    event: DragEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (
      event.currentTarget.contains(
        event.relatedTarget as Node | null,
      )
    ) {
      return;
    }

    setIsDragging(false);
  };

  const handleDrop = (
    event: DragEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    if (event.dataTransfer.files.length > 0) {
      handleFiles(event.dataTransfer.files);
    }
  };

  const removeImage = (imageId: string) => {
    setSelectedImages((currentImages) => {
      const imageToRemove = currentImages.find(
        (image) => image.id === imageId,
      );

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }

      return currentImages.filter(
        (image) => image.id !== imageId,
      );
    });

    setErrorMessage("");
  };

  const clearAllImages = () => {
    selectedImages.forEach((image) => {
      URL.revokeObjectURL(image.preview);
    });

    setSelectedImages([]);
    setErrorMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleStartMatching = async () => {
    setErrorMessage("");

    if (selectedImages.length < MIN_IMAGES) {
      setErrorMessage(
        `Eşleştirme için en az ${MIN_IMAGES} fotoğraf yüklemelisiniz.`,
      );
      return;
    }

    if (selectedImages.length > MAX_IMAGES) {
      setErrorMessage(
        `En fazla ${MAX_IMAGES} fotoğraf yükleyebilirsiniz.`,
      );
      return;
    }

    setIsMatching(true);

    const formData = new FormData();

    selectedImages.forEach((image) => {
      formData.append("images", image.file);
    });

    formData.append("listingType", listingType);

    try {
      console.log("Yapay zekâ eşleştirme verileri:", {
        listingType,
        imageCount: selectedImages.length,
        imageNames: selectedImages.map(
          (image) => image.file.name,
        ),
      });

      // Şimdilik backend yerine sahte analiz süresi
      await new Promise((resolve) =>
        setTimeout(resolve, 1500),
      );

      // Sonuç sayfasına yönlendir
      navigate("/ai-match/results");

      /*
        BACKEND HAZIR OLDUĞUNDA YUKARIDAKİ
        setTimeout ve navigate kısmını kaldırıp
        aşağıdaki yapıyı kullanabilirsin:

        const response = await fetch(
          "http://localhost:8080/api/ai-match",
          {
            method: "POST",
            body: formData,
          },
        );

        if (!response.ok) {
          throw new Error(
            "Eşleştirme işlemi gerçekleştirilemedi.",
          );
        }

        const result = await response.json();

        console.log("Eşleşme sonuçları:", result);

        sessionStorage.setItem(
          "aiMatchResults",
          JSON.stringify(result),
        );

        navigate("/ai-match/results");
      */
    } catch (error) {
      console.error("AI eşleştirme hatası:", error);
      setErrorMessage(
        getUserErrorMessage(
          error,
          "Eşleştirme sırasında beklenmeyen bir hata oluştu.",
        ),
      );
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <Header />

      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF7ED] via-white to-[#EFF6FF]">
          <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-[#FED7AA]/30 blur-3xl" />

          <div className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-[#BFDBFE]/30 blur-3xl" />

          <div className="relative mx-auto grid max-w-[1200px] gap-12 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-20">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FED7AA] bg-white px-4 py-2 text-sm font-semibold text-[#F97316] shadow-sm">
                <Sparkles size={17} />
                Yapay zekâ destekli arama
              </div>

              <h1 className="mt-5 max-w-2xl text-4xl font-bold tracking-tight text-[#0F172A] sm:text-5xl lg:text-6xl">
                Fotoğrafları yükle,
                <span className="block text-[#F97316]">
                  benzer ilanları bulalım.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-[#64748B] sm:text-lg">
                Hayvanın farklı açılardan çekilmiş en az üç
                fotoğrafını yükle. PATIMATI; renk, desen, yüz
                yapısı ve belirgin özellikleri analiz ederek en
                benzer ilanları sıralasın.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-6 py-3.5 font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#EA580C] focus:outline-none focus:ring-4 focus:ring-[#FED7AA]"
                >
                  <Upload size={19} />
                  Fotoğraf Yükle
                </button>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-6 py-3.5 font-semibold text-[#475569] transition hover:border-[#CBD5E1] hover:bg-[#F8FAFC] focus:outline-none focus:ring-4 focus:ring-[#E2E8F0]"
                >
                  Nasıl çalışır?
                  <ArrowRight size={18} />
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#64748B]">
                <span className="flex items-center gap-2">
                  <CheckCircle2
                    size={17}
                    className="text-[#22C55E]"
                  />
                  En az 3 fotoğraf
                </span>

                <span className="flex items-center gap-2">
                  <CheckCircle2
                    size={17}
                    className="text-[#22C55E]"
                  />
                  En fazla 5 fotoğraf
                </span>

                <span className="flex items-center gap-2">
                  <CheckCircle2
                    size={17}
                    className="text-[#22C55E]"
                  />
                  Benzerlik yüzdesi
                </span>
              </div>
            </div>

            <section className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-2xl shadow-slate-200/70 backdrop-blur sm:p-7">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#0F172A]">
                    Görsel eşleştirme
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#64748B]">
                    İlan türünü seç ve aynı hayvana ait net
                    fotoğraflar yükle.
                  </p>
                </div>

                {selectedImages.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllImages}
                    className="shrink-0 text-sm font-semibold text-[#64748B] transition hover:text-[#DC2626]"
                  >
                    Tümünü sil
                  </button>
                )}
              </div>

              <div className="mb-5 grid grid-cols-2 rounded-xl bg-[#F1F5F9] p-1">
                <button
                  type="button"
                  onClick={() => setListingType("lost")}
                  className={`rounded-lg px-3 py-3 text-sm font-semibold transition sm:px-4 ${
                    listingType === "lost"
                      ? "bg-white text-[#F97316] shadow-sm"
                      : "text-[#64748B] hover:text-[#334155]"
                  }`}
                >
                  Kayıp Hayvanım
                </button>

                <button
                  type="button"
                  onClick={() => setListingType("found")}
                  className={`rounded-lg px-3 py-3 text-sm font-semibold transition sm:px-4 ${
                    listingType === "found"
                      ? "bg-white text-[#2563EB] shadow-sm"
                      : "text-[#64748B] hover:text-[#334155]"
                  }`}
                >
                  Hayvan Buldum
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  if (event.target.files) {
                    handleFiles(event.target.files);
                  }

                  event.target.value = "";
                }}
              />

              <button
                type="button"
                onClick={openFilePicker}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex min-h-[220px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition ${
                  isDragging
                    ? "border-[#F97316] bg-[#FFF7ED]"
                    : "border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#FB923C] hover:bg-[#FFF7ED]/50"
                }`}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFEDD5] text-[#F97316]">
                  <ImagePlus size={30} />
                </div>

                <p className="mt-5 text-lg font-bold text-[#1E293B]">
                  En az 3 fotoğraf yükleyin
                </p>

                <p className="mt-2 max-w-sm text-sm leading-6 text-[#64748B]">
                  Fotoğrafları buraya sürükleyin veya
                  bilgisayarınızdan seçmek için tıklayın.
                </p>

                <span className="mt-4 rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-medium text-[#64748B]">
                  JPG, PNG veya WEBP · Her fotoğraf en fazla 10
                  MB
                </span>
              </button>

              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#334155]">
                    Yüklenen fotoğraflar
                  </p>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      selectedImages.length >= MIN_IMAGES
                        ? "bg-[#DCFCE7] text-[#15803D]"
                        : "bg-[#FFEDD5] text-[#C2410C]"
                    }`}
                  >
                    {selectedImages.length}/{MAX_IMAGES}
                  </span>
                </div>

                {selectedImages.length === 0 ? (
                  <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-5 text-center text-sm text-[#64748B]">
                    Henüz fotoğraf yüklenmedi.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {selectedImages.map((image, index) => (
                      <div
                        key={image.id}
                        className="group relative overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F1F5F9]"
                      >
                        <img
                          src={image.preview}
                          alt={`Yüklenen hayvan fotoğrafı ${
                            index + 1
                          }`}
                          className="h-32 w-full object-cover"
                        />

                        <span className="absolute left-2 top-2 rounded-full bg-[#0F172A]/75 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
                          {index + 1}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            removeImage(image.id)
                          }
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#0F172A]/75 text-white backdrop-blur transition hover:bg-[#DC2626]"
                          aria-label={`${
                            index + 1
                          }. fotoğrafı kaldır`}
                          title="Fotoğrafı kaldır"
                        >
                          <X size={16} />
                        </button>

                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0F172A]/90 to-transparent px-3 pb-2 pt-8">
                          <p className="truncate text-xs font-medium text-white">
                            {image.file.name}
                          </p>
                        </div>
                      </div>
                    ))}

                    {selectedImages.length < MAX_IMAGES && (
                      <button
                        type="button"
                        onClick={openFilePicker}
                        className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B] transition hover:border-[#FB923C] hover:bg-[#FFF7ED] hover:text-[#F97316]"
                      >
                        <ImagePlus size={24} />

                        <span className="mt-2 text-xs font-semibold">
                          Fotoğraf ekle
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {selectedImages.length < MIN_IMAGES && (
                  <p className="mt-3 text-sm font-medium text-[#EA580C]">
                    Devam etmek için {remainingRequiredImages}{" "}
                    fotoğraf daha yükleyin.
                  </p>
                )}

                {selectedImages.length >= MIN_IMAGES && (
                  <p className="mt-3 flex items-center gap-2 text-sm font-medium text-[#15803D]">
                    <CheckCircle2 size={17} />
                    Fotoğraflar yapay zekâ analizi için hazır.
                  </p>
                )}

                {errorMessage && (
                  <p
                    role="alert"
                    className="mt-3 rounded-lg bg-[#FEF2F2] px-3 py-2 text-sm font-medium text-[#DC2626]"
                  >
                    {errorMessage}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleStartMatching}
                disabled={!canStartMatching}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] px-5 py-4 font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#EA580C] focus:outline-none focus:ring-4 focus:ring-[#FED7AA] disabled:cursor-not-allowed disabled:bg-[#CBD5E1] disabled:shadow-none"
              >
                {isMatching ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Fotoğraflar analiz ediliyor...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Eşleşmeleri Bul
                  </>
                )}
              </button>

              <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-[#94A3B8]">
                <ShieldCheck size={15} />
                Yüklenen fotoğraflar yalnızca eşleştirme
                amacıyla kullanılır.
              </p>
            </section>
          </div>
        </section>

        <section
          id="how-it-works"
          className="mx-auto max-w-[1200px] scroll-mt-24 px-4 py-16 sm:px-6 md:py-20 lg:px-8"
        >
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-[#F97316]">
              Nasıl çalışır?
            </span>

            <h2 className="mt-3 text-3xl font-bold text-[#0F172A] sm:text-4xl">
              Üç adımda benzer ilanları bul
            </h2>

            <p className="mt-4 leading-7 text-[#64748B]">
              Farklı açılardan yüklenen fotoğraflar birlikte
              incelenerek daha güçlü eşleştirme sonuçları
              oluşturulur.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <InfoCard
              number="01"
              icon={<Camera size={26} />}
              title="En az 3 fotoğraf yükle"
              description="Hayvanın yüzünü, gövdesini ve belirgin özelliklerini farklı açılardan göster."
            />

            <InfoCard
              number="02"
              icon={<Sparkles size={26} />}
              title="Yapay zekâ analiz etsin"
              description="Tür, renk, desen, kulak, kuyruk, göz ve aksesuar özellikleri birlikte değerlendirilir."
            />

            <InfoCard
              number="03"
              icon={<PawPrint size={26} />}
              title="Eşleşmeleri incele"
              description="En güçlü kayıp veya bulunan ilanlar benzerlik yüzdesine göre sıralanır."
            />
          </div>
        </section>

        <section className="border-y border-[#E2E8F0] bg-white">
          <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-14 sm:px-6 md:grid-cols-3 md:py-16 lg:px-8">
            <Feature
              title="Çoklu fotoğraf analizi"
              description="Tek bir fotoğrafa bağlı kalmadan farklı açılardaki detaylar birlikte incelenir."
            />

            <Feature
              title="Daha güçlü eşleşme"
              description="Birden fazla görsel kullanılması yanlış eşleşme ihtimalini azaltmaya yardımcı olur."
            />

            <Feature
              title="Doğrudan iletişim"
              description="Eşleşen ilanı açabilir, detaylarını inceleyebilir ve ilan sahibiyle iletişime geçebilirsin."
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

type InfoCardProps = {
  number: string;
  icon: ReactNode;
  title: string;
  description: string;
};

function InfoCard({
  number,
  icon,
  title,
  description,
}: InfoCardProps) {
  return (
    <article className="relative rounded-2xl border border-[#E2E8F0] bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#FED7AA] hover:shadow-lg">
      <span className="absolute right-6 top-5 text-4xl font-black text-[#F1F5F9]">
        {number}
      </span>

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFEDD5] text-[#F97316]">
        {icon}
      </div>

      <h3 className="mt-6 text-xl font-bold text-[#0F172A]">
        {title}
      </h3>

      <p className="mt-3 leading-7 text-[#64748B]">
        {description}
      </p>
    </article>
  );
}

type FeatureProps = {
  title: string;
  description: string;
};

function Feature({
  title,
  description,
}: FeatureProps) {
  return (
    <div className="flex gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFEDD5] text-[#F97316]">
        <CheckCircle2 size={22} />
      </div>

      <div>
        <h3 className="font-bold text-[#0F172A]">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-[#64748B]">
          {description}
        </p>
      </div>
    </div>
  );
}