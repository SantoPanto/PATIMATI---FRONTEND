import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AdCreateRequest } from './types'

/**
 * İlan oluşturulurken tarih telde KAÇ KEZ gidiyor?
 *
 * <p><b>Ölçülen kusur (21.08, canlı):</b> {@code POST /api/ads} iki denemede de
 * <b>500</b> döndü ve hiç ilan oluşmadı. Sunucu gövdesi:
 * {@code Type definition error: [simple type, class java.lang.String]}.
 * Çevrimdışı oynatınca sebebi çıktı:
 *
 * <pre>No fallback setter/field defined for creator property 'lostDate'
 * (through reference chain: AdCreateRequest["date"])</pre>
 *
 * Ön yüz tarihi HEM `lostDate` HEM `date` adıyla gönderiyordu; sunucuda `date`
 * zaten `lostDate`'in `@JsonAlias`'ı. Aynı record bileşenine ikinci kez yazmak
 * isteyen Jackson geri düşecek bir setter bulamıyor ve isteğin TAMAMINI
 * reddediyor.
 *
 * <p><b>Neden bu katmanda ölçülüyor:</b> arıza yolu gövdenin telde aldığı SON
 * biçim. Kaynak metninde `ad.date` arayan bir bekçi, alanı başka bir adla
 * ekleyen değişikliği göremezdi; burada gerçekten serileştirilen JSON
 * okunuyor.
 *
 * <p><b>Neden iki alan da tek başına zararsız:</b> yalnız `lostDate` ya da
 * yalnız `date` gönderilmesi çalışıyor (arka yüzde ölçüldü). Kusur ancak
 * ikisi BİRLİKTE gönderildiğinde doğuyor — o yüzden tek tarafa bakan hiçbir
 * denetim yakalayamaz.
 */

const { istek } = vi.hoisted(() => ({ istek: vi.fn() }))

vi.mock('./api', () => ({ request: istek }))

const { createAd } = await import('./ads')

const TEMEL: AdCreateRequest = {
  title: 'TEST',
  description: 'deneme',
  adType: 'LOST',
  species: 'CAT',
  colors: ['WHITE'],
  gender: 'UNKNOWN',
  ageGroup: 'UNKNOWN',
  coatPattern: 'UNKNOWN',
  collarStatus: 'UNKNOWN',
  earTagStatus: 'UNKNOWN',
  earNotchStatus: 'UNKNOWN',
  lostDate: '2026-08-21',
  latitude: 40.195,
  longitude: 29.06,
}

/** createAd'in FormData'ya koyduğu `ad` parçasını çözüp JSON olarak verir. */
async function telegeGidenGovde(): Promise<Record<string, unknown>> {
  const [, secenekler] = istek.mock.calls[0] as [string, { body: FormData }]
  const parca = secenekler.body.get('ad')
  const metin = await (parca as Blob).text()
  return JSON.parse(metin) as Record<string, unknown>
}

beforeEach(() => {
  istek.mockReset()
  istek.mockResolvedValue({ id: 1 })
})

describe('createAd — tarih alanı', () => {
  it('govdede lostDate gider', async () => {
    await createAd(TEMEL)

    const govde = await telegeGidenGovde()
    expect(govde.lostDate).toBe('2026-08-21')
  })

  it('govdede date alani HIC BULUNMAZ', async () => {
    await createAd(TEMEL)

    const govde = await telegeGidenGovde()
    expect(Object.keys(govde)).not.toContain('date')
  })

  it('cagiran yanlislikla date koysa bile telde gitmez', async () => {
    // Kusurun ta kendisi buydu: sayfa `ad.date = lostDate` yazıyordu.
    await createAd({ ...TEMEL, date: '2026-08-21' } as AdCreateRequest & {
      date: string
    })

    const govde = await telegeGidenGovde()
    expect(Object.keys(govde)).not.toContain('date')
    expect(govde.lostDate).toBe('2026-08-21')
  })
})
