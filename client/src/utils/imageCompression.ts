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
  fileType: "image/webp",
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
    const targetType = compressedBlob.type || file.type;
    
    // Determine appropriate extension based on compressed blob type
    let newFileName = file.name;
    if (targetType === "image/webp" && !file.name.toLowerCase().endsWith(".webp")) {
      newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
    } else if (
      (targetType === "image/jpeg" || targetType === "image/jpg") &&
      !/\.(jpg|jpeg)$/i.test(file.name)
    ) {
      newFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
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
