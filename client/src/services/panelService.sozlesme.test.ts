import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Panel uçları telde HANGİ BİÇİMDE çağrılıyor?
 *
 * <p><b>Neden var:</b> bu modülde iki taraf ayrı sözlükle yazıldı ve kimse
 * görmedi — ekranlar sahte veriyle çalıştığı için ayrışma hiçbir yerde
 * patlamadı. Aynı sessizliğin panel tarafında tekrarlamaması için sözleşmenin
 * üç kırılgan noktası burada kilitleniyor.
 *
 * <p><b>1. {@code reunionCount}:</b> panel ekranı sayacı {@code resolvedCount}
 * adıyla tutuyordu; arka yüzdeki ad {@code reunionCount}. Ad kayarsa alan
 * {@code undefined} gelir, sayaç boş görünür ve hata YAZILMAZ — panelin en
 * çarpıcı sayacı sessizce sıfırlanır.
 *
 * <p><b>2. Tarih biçimi:</b> sunucu {@code LocalDateTime} bekliyor, yani saat
 * dilimi eki OLMADAN. {@code Date.toISOString()} ise {@code Z} ekli ve
 * milisaniyeli UTC üretir. O değer ya reddedilir ya da UTC duvar saati yerel
 * sanılarak sessizce kayar — kullanıcı yanlış aralığın sayılarını doğru sanır.
 *
 * <p><b>3. İlçe:</b> kapsam sunucuda oturumdan türetiliyor. İstemcinin ilçe
 * göndermesi, gönderilen değere göre veri döndüğü yanılgısını yaratır; tek
 * yanlış yapılandırılmış hesap başka belediyenin verisini okumaya çalışabilir.
 * Parametre HİÇ gitmemeli.
 */

const { istek } = vi.hoisted(() => ({ istek: vi.fn() }))

vi.mock('./api', () => ({ request: istek }))

const { getPanelIstatistikleri, getIsiHaritasi, yerelIsoTarihSaat, EN_COK_ISI_NOKTASI } =
  await import('./panelService')

const ARALIK = {
  startDate: new Date(2026, 7, 1, 0, 0, 0), // 1 Ağustos 2026, yerel
  endDate: new Date(2026, 7, 27, 23, 59, 59),
}

/** Çağrılan yolu URL nesnesi olarak verir. */
function cagrilanYol(): URL {
  const [yol] = istek.mock.calls[0] as [string]
  return new URL(yol, 'https://ornek.test')
}

beforeEach(() => {
  istek.mockReset()
  istek.mockResolvedValue({})
})

describe('yerelIsoTarihSaat', () => {
  it('saat dilimi eki ve milisaniye ICERMEZ', () => {
    const bicim = yerelIsoTarihSaat(new Date(2026, 7, 1, 9, 5, 3))

    expect(bicim).toBe('2026-08-01T09:05:03')
    expect(bicim).not.toContain('Z')
    expect(bicim).not.toContain('.')
  })

  it('toISOString ile AYNI DEGIL — kusurun ta kendisi buydu', () => {
    const t = new Date(2026, 7, 1, 9, 5, 3)

    expect(yerelIsoTarihSaat(t)).not.toBe(t.toISOString())
  })
})

describe('getPanelIstatistikleri', () => {
  it('dogru yolu ve zorunlu tarih parametrelerini gonderir', async () => {
    await getPanelIstatistikleri(ARALIK)

    const url = cagrilanYol()
    expect(url.pathname).toBe('/api/municipality/panel/stats')
    expect(url.searchParams.get('startDate')).toBe('2026-08-01T00:00:00')
    expect(url.searchParams.get('endDate')).toBe('2026-08-27T23:59:59')
  })

  it('ILCE parametresi HIC gonderilmez', async () => {
    await getPanelIstatistikleri(ARALIK)

    const url = cagrilanYol()
    for (const ad of ['district', 'ilce', 'city']) {
      expect(url.searchParams.get(ad)).toBeNull()
    }
  })

  it('jeton ister', async () => {
    await getPanelIstatistikleri(ARALIK)

    const [, secenekler] = istek.mock.calls[0] as [string, { requiresAuth?: boolean }]
    expect(secenekler.requiresAuth).toBe(true)
  })

  it('sunucudan gelen sayac adi reunionCount olarak okunur', async () => {
    // Ekran resolvedCount okusaydi undefined alirdi ve sessizce bos gorunurdu.
    istek.mockResolvedValue({
      district: 'Nilüfer',
      lostCount: 12,
      foundCount: 8,
      adoptionCount: 3,
      reunionCount: 15,
    })

    const sonuc = await getPanelIstatistikleri(ARALIK)

    expect(sonuc.reunionCount).toBe(15)
    expect((sonuc as unknown as Record<string, unknown>).resolvedCount).toBeUndefined()
  })
})

describe('getIsiHaritasi', () => {
  it('limit verilmezse parametre hic gitmez — sunucu varsayilani kullanilir', async () => {
    await getIsiHaritasi(ARALIK)

    expect(cagrilanYol().searchParams.get('limit')).toBeNull()
  })

  it('limit verilirse gonderilir', async () => {
    await getIsiHaritasi(ARALIK, 1000)

    expect(cagrilanYol().searchParams.get('limit')).toBe('1000')
  })

  it('ust sinir asilirsa istek HIC gonderilmez', async () => {
    // Sunucudan donecek 400 hangi alanin sorunlu oldugunu soylemiyor.
    expect(() => getIsiHaritasi(ARALIK, EN_COK_ISI_NOKTASI + 1)).toThrow(
      /en çok 2000/,
    )
    expect(istek).not.toHaveBeenCalled()
  })

  it('gecersiz limit istek gonderilmeden reddedilir', async () => {
    expect(() => getIsiHaritasi(ARALIK, 0)).toThrow()
    expect(() => getIsiHaritasi(ARALIK, 1.5)).toThrow()
    expect(istek).not.toHaveBeenCalled()
  })

  it('dogru yolu kullanir ve jeton ister', async () => {
    await getIsiHaritasi(ARALIK)

    const [, secenekler] = istek.mock.calls[0] as [string, { requiresAuth?: boolean }]
    expect(cagrilanYol().pathname).toBe('/api/municipality/panel/heatmap')
    expect(secenekler.requiresAuth).toBe(true)
  })
})
