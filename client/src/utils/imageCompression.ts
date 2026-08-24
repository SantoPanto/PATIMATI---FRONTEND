import imageCompression from "browser-image-compression";

export interface CompressImageOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
  initialQuality?: number;
}

const DEFAULT_OPTIONS: CompressImageOptions = {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/jpeg",
};

/**
 * Compresses a single image file using browser-image-compression.
 * If file is not an image or compression fails, returns the original file.
 */
export async function compressImage(
  file: File,
  customOptions?: CompressImageOptions,
): Promise<File> {
  if (!file || !file.type || !file.type.startsWith("image/")) {
    return file;
  }

  const options = {
    ...DEFAULT_OPTIONS,
    ...customOptions,
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    // Guarantee output MIME type matches expected fileType or blob type
    const targetType = options.fileType || compressedBlob.type || "image/jpeg";
    
    // Ensure file extension matches target MIME type (.jpg for image/jpeg)
    let newFileName = file.name;
    if (
      (targetType === "image/jpeg" || targetType === "image/jpg") &&
      !/\.(jpg|jpeg)$/i.test(file.name)
    ) {
      newFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
    } else if (targetType === "image/webp" && !file.name.toLowerCase().endsWith(".webp")) {
      newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
    }

    return new File([compressedBlob], newFileName, {
      type: targetType,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn("Resim sıkıştırma işlemi yapılamadı, orijinal dosya kullanılacak:", error);
    return file;
  }
}

/**
 * Compresses multiple image files concurrently.
 */
export async function compressImages(
  files: File[],
  customOptions?: CompressImageOptions,
): Promise<File[]> {
  if (!files || files.length === 0) return [];
  return Promise.all(files.map((file) => compressImage(file, customOptions)));
}

export interface SinirliSikistirmaSonucu {
  /** Sunucu sınırının altında kalan, gönderilebilir dosyalar. */
  accepted: File[];
  /** Sıkıştırmaya RAĞMEN sınırın üstünde kalanlar (gönderilmemeli). */
  stillTooLarge: { name: string; size: number }[];
}

/**
 * Sıkıştırır ve sonucu sunucu sınırıyla YENİDEN ölçer.
 *
 * <p>Neden gerekli: {@link compressImage} sıkıştırma başarısız olursa
 * (bozuk dosya, tarayıcının worker'ı engellemesi, bellek yetmemesi)
 * bilinçli olarak ORİJİNAL dosyayı geri veriyor. Çağıran yerlerde boyut
 * kontrolü sıkıştırmadan ÖNCE yapıldığı için, bu yedek yola düşen büyük bir
 * dosya hiçbir kontrole takılmadan sunucuya gidiyor ve kullanıcı 413
 * alıyordu. Bu yardımcı, gönderim kararını sıkıştırma SONRASI ölçüme
 * bağlar.
 */
export async function compressImagesWithinLimit(
  files: File[],
  limitBytes: number,
  customOptions?: CompressImageOptions,
): Promise<SinirliSikistirmaSonucu> {
  const compressed = await compressImages(files, customOptions);

  const accepted: File[] = [];
  const stillTooLarge: { name: string; size: number }[] = [];

  for (const file of compressed) {
    if (file.size > limitBytes) {
      stillTooLarge.push({ name: file.name, size: file.size });
    } else {
      accepted.push(file);
    }
  }

  return { accepted, stillTooLarge };
}
