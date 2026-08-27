import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * İhbar telde HANGİ ALAN ADLARIYLA gidiyor?
 *
 * <p><b>Ölçülen kusur (26.08):</b> ön yüz ihbar formu
 * {@code {title, description, location, petType}} topluyordu; uç
 * ({@code POST /api/public/reports}) ise
 * {@code {reporterContact, type, note, latitude, longitude}} bekliyor.
 * İki taraf arasında {@code description → note} dışında HİÇBİR örtüşme yoktu
 * ve form sahte bir {@code setTimeout} çağırdığı için bu hiç görünmüyordu.
 * Plan §5c'nin "uç adları koddan ÖNCE kararlaştırılsın" adımı atlandığı için
 * iki taraf ayrı sözlükle yazılmıştı.
 *
 * <p><b>Neden bu katmanda ölçülüyor:</b> arıza yolu gövdenin telde aldığı SON
 * biçim. Uç {@code @ModelAttribute} ile bağlandığı için alanlar TEK TEK form
 * alanı olarak gidiyor; bir alanın adı kayarsa Spring o alanı boş bırakır ve
 * zorunluysa istek 400 döner. Sayfa kaynağında değişken adı arayan bir
 * denetim bunu göremez — burada gerçekten {@code FormData}'ya konan anahtarlar
 * okunuyor.
 *
 * <p><b>Konum neden ayrıca sınanıyor:</b> sunucu ilçeyi koordinattan ters
 * geokodlamayla türetiyor. Konum düz metin olarak giderse ihbar hiçbir
 * belediyeye düşmez — modülün tüm yönlendirmesi bu iki alana bağlı. Bir ara
 * sürümde harita seçicisi kaldırılıp konum düz metin girdisine çevrilmişti.
 */

const { istek } = vi.hoisted(() => ({ istek: vi.fn() }))

vi.mock('./api', () => ({
  request: istek,
  ApiError: class ApiError extends Error {},
  YUK_COK_BUYUK_MESAJI: 'cok buyuk',
}))

const { createReport } = await import('./reportService')

const TEMEL = {
  reporterContact: '05551234567',
  type: 'YARALI' as const,
  note: 'Yaralı kedi, park girişinde',
  latitude: 40.1885,
  longitude: 29.061,
}

/** createReport'un FormData'ya koyduğu anahtar/değer çiftlerini verir. */
function telegeGidenGovde(): FormData {
  const [, secenekler] = istek.mock.calls[0] as [string, { body: FormData }]
  return secenekler.body
}

beforeEach(() => {
  istek.mockReset()
  istek.mockResolvedValue({ id: 1, district: 'Nilüfer' })
})

describe('createReport — telde giden alan adları', () => {
  it('uc AnimalReportCreateRequest alan adlarini birebir kullanir', async () => {
    await createReport(TEMEL)

    const govde = telegeGidenGovde()
    expect(govde.get('reporterContact')).toBe('05551234567')
    expect(govde.get('type')).toBe('YARALI')
    expect(govde.get('note')).toBe('Yaralı kedi, park girişinde')
    expect(govde.get('latitude')).toBe('40.1885')
    expect(govde.get('longitude')).toBe('29.061')
  })

  it('eski sahte formun alanlarindan HICBIRI gitmez', async () => {
    // Kusurun ta kendisi buydu: form bu dört alanı topluyordu.
    await createReport(TEMEL)

    const govde = telegeGidenGovde()
    for (const eskiAd of ['title', 'description', 'location', 'petType']) {
      expect(govde.get(eskiAd)).toBeNull()
    }
  })

  it('koordinatlar govdede HER ZAMAN bulunur', async () => {
    // İlçe bunlardan türetiliyor; eksikse ihbar hiçbir belediyeye düşmez.
    await createReport(TEMEL)

    const govde = telegeGidenGovde()
    expect(govde.has('latitude')).toBe(true)
    expect(govde.has('longitude')).toBe(true)
  })

  it('not bos birakilirsa alan hic gonderilmez', async () => {
    await createReport({ ...TEMEL, note: undefined })

    expect(telegeGidenGovde().has('note')).toBe(false)
  })

  it('foto verilirse "photo" adiyla, verilmezse hic gitmez', async () => {
    const dosya = new File(['x'], 'kedi.jpg', { type: 'image/jpeg' })
    await createReport(TEMEL, dosya)
    expect(telegeGidenGovde().get('photo')).toBe(dosya)

    istek.mockClear()
    await createReport(TEMEL, null)
    expect(telegeGidenGovde().has('photo')).toBe(false)
  })

  it('tek JSON parcasi olarak DEGIL, ayri alanlar olarak gider', async () => {
    // sightings.ts'teki desen (FormData'ya tek "sighting" JSON Blob'u) bu
    // ucta CALISMAZ: uc @ModelAttribute ile baglaniyor.
    await createReport(TEMEL)

    const govde = telegeGidenGovde()
    expect(govde.get('report')).toBeNull()
    expect(govde.get('animalReport')).toBeNull()
  })

  it('girissiz gonderilir — requiresAuth istenmez', async () => {
    await createReport(TEMEL)

    const [yol, secenekler] = istek.mock.calls[0] as [
      string,
      { requiresAuth?: boolean; method: string },
    ]
    expect(yol).toBe('/api/public/reports')
    expect(secenekler.method).toBe('POST')
    expect(secenekler.requiresAuth).toBeUndefined()
  })
})
