import { describe, expect, it } from "vitest";

import { resolvePostLoginPath } from "./auth";

/**
 * Giriş sonrası varış yolu (belediye modülü, B parçası).
 *
 * <p>Kurum hesabı girişten sonra panele düşmeli — ama kullanıcının AÇIKÇA
 * istediği sayfa (?redirect=) çiğnenmemeli. İki yönü de kilitliyoruz: yoksa
 * ya kurum panele hiç ulaşamaz ya da redirect parametresi sessizce yutulur.
 */
describe("resolvePostLoginPath", () => {
  it("kurum hesabı varsayılan yoldan panele yönlenir", () => {
    expect(resolvePostLoginPath("INSTITUTION", "/")).toBe("/municipality");
  });

  it("kurum hesabının AÇIKÇA istediği yol korunur", () => {
    expect(resolvePostLoginPath("INSTITUTION", "/listings")).toBe("/listings");
  });

  it("sıradan kullanıcı ve yönetici yönlendirilmez", () => {
    expect(resolvePostLoginPath("USER", "/")).toBe("/");
    expect(resolvePostLoginPath("ADMIN", "/")).toBe("/");
    expect(resolvePostLoginPath(undefined, "/")).toBe("/");
  });
});
