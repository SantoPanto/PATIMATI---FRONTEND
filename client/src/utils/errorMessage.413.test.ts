import { describe, expect, it } from "vitest";

import {
  ApiError,
  YUK_COK_BUYUK_MESAJI,
  ZAMAN_ASIMI_DURUMU,
  ZAMAN_ASIMI_MESAJI,
} from "../services/api";
import { getUserErrorMessage } from "./errorMessage";

/**
 * Ekranlar hatayı `getUserErrorMessage` üzerinden yazıyor; kullanıcının
 * gördüğü metin BURADA belirleniyor. İki tuzak var:
 *
 * <p>1) Sunucu 413 için RFC 7807 gövdesi döndürdüğünde `detail` alanı
 * İngilizce oluyor ("Maximum upload size exceeded"). Fonksiyondaki RFC 7807
 * taraması durum kodu kontrolünden ÖNCE çalışsaydı kullanıcı yine anlamsız
 * bir metin görürdü — bu test o sıralamayı kilitliyor.
 *
 * <p>2) 408'i ağ katmanı değil biz üretiyoruz (istek zaman aşımı); haritada
 * karşılığı yoksa jenerik "Bir hata oluştu"ya düşer ve kullanıcı yavaş
 * bağlantıyla gerçek bir sunucu hatasını ayırt edemez.
 */
describe("getUserErrorMessage: 413 ve zaman aşımı", () => {
  it("413'te sunucunun İngilizce detail'i yerine anlaşılır metni verir", () => {
    const hata = new ApiError("Maximum upload size exceeded", 413, {
      type: "about:blank",
      title: "Payload Too Large",
      status: 413,
      detail: "Maximum upload size exceeded",
    });

    expect(getUserErrorMessage(hata, "yedek metin")).toBe(YUK_COK_BUYUK_MESAJI);
  });

  it("gövdesi HTML olan (nginx) 413'te de aynı metni verir", () => {
    const hata = new ApiError("İşlem sırasında bir hata oluştu (413)", 413, null);

    expect(getUserErrorMessage(hata, "yedek metin")).toBe(YUK_COK_BUYUK_MESAJI);
  });

  it("zaman aşımında (408) yavaş bağlantıyı söyleyen metni verir", () => {
    const hata = new ApiError(ZAMAN_ASIMI_MESAJI, ZAMAN_ASIMI_DURUMU, null);

    expect(getUserErrorMessage(hata, "yedek metin")).toBe(ZAMAN_ASIMI_MESAJI);
  });

  it("sunucunun anlamlı Türkçe mesajını EZMEZ (400)", () => {
    const hata = new ApiError("Doğrulama hatası", 400, {
      detail: "Başlık en fazla 150 karakter olabilir",
    });

    expect(getUserErrorMessage(hata, "yedek metin")).toBe(
      "Başlık en fazla 150 karakter olabilir",
    );
  });
});
