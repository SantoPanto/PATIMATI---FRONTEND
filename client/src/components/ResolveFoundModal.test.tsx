import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AdResponse, MatchResponseDTO } from '../services/types'

/**
 * "Hayvanimi buldum" akisi — kayip ilanini BULUNDU olarak kapatma.
 *
 * <p><b>Olculen sey telde ne gittigi.</b> Sunucu (AdService.resolveLostAd)
 * `foundAdId` geldiginde ilanin gercekten FOUND tipinde oldugunu dogruluyor ve
 * degilse istegin TAMAMINI reddediyor — yani yanlis bir bag, kullanicinin
 * ilanini KAPATAMAMASINA yol acar. Bagin hangi kosulda gonderildigi saf
 * calisma ani davranisi: `tsc` iki durumu da ayni gorur, cunku iki alan da
 * istege bagli.
 *
 * <p><b>Odul puani ikinci tuzak.</b> Eslesme uretimi ayni kullaniciyi ELEMIYOR
 * (AiMatchService'te boyle bir suzgec yok), yani kendi kayip ve bulundu ilani
 * eslesebilir. `finderId` korumasiz gonderilirse kullanici odul puanini
 * KENDINE yazdirir.
 */

const { ilanGetir, cozumGonder, eslesmeleriGetir } = vi.hoisted(() => ({
  ilanGetir: vi.fn(),
  cozumGonder: vi.fn(),
  eslesmeleriGetir: vi.fn(),
}))

vi.mock('../services/ads', () => ({
  getAdById: ilanGetir,
  resolveLostAdFound: cozumGonder,
}))

// `ApiError` GERCEK birakiliyor: utils/errorMessage onu `instanceof` ile
// suzuyor. Tumuyle sahte bir modulde sinif `undefined` olur ve hata yolundaki
// `instanceof` calisma aninda patlar — yani hata yolunu olcmek isteyen test,
// olcemeden once kendisi kirilir.
vi.mock('../services/api', async (gercegi) => ({
  ...(await gercegi<typeof import('../services/api')>()),
  getMyMatches: eslesmeleriGetir,
}))

import ResolveFoundModal from './ResolveFoundModal'

const KAYIP_ILAN: AdResponse = {
  id: 74,
  title: 'Kayıp tekir kedi',
  description: 'Sarıyer civarında kayboldu',
  adType: 'LOST',
  species: 'CAT',
  colors: ['BROWN'],
  gender: 'UNKNOWN',
  ageGroup: 'ADULT',
  coatPattern: 'STRIPED',
  collarStatus: 'UNKNOWN',
  earTagStatus: 'UNKNOWN',
  earNotchStatus: 'UNKNOWN',
  microchipped: false,
  photoUrls: [],
  latitude: 41.1,
  longitude: 29.05,
  ownerId: 7,
  ownerDisplayName: 'Ayşe K.',
  active: true,
  suspended: false,
  createdAt: '2026-08-01T10:00:00Z',
  updatedAt: '2026-08-01T10:00:00Z',
}

/** Karsi tarafin ilani. Varsayilan: BASKA bir kullaniciya ait bulundu ilani. */
const BULUNDU_ILAN: AdResponse = {
  ...KAYIP_ILAN,
  id: 91,
  title: 'Sarıyer’de tekir bulundu',
  adType: 'FOUND',
  ownerId: 12,
  ownerDisplayName: 'Mehmet T.',
}

const BU_ILANIN_ESLESMESI: MatchResponseDTO = {
  id: 300,
  myAdId: 74,
  myAd: { id: 74, title: 'Kayıp tekir kedi' },
  partnerAdId: 91,
  partnerAd: { id: 91, title: 'Sarıyer’de tekir bulundu' },
  totalScore: 0.82,
  visualScore: 0.9,
  tagScore: 0.7,
  locationScore: 0.6,
  thresholdAtTime: 0.75,
  passedThreshold: true,
}

/** BASKA bir ilana ait eslesme — bu pencerede GORUNMEMELI. */
const BASKA_ILANIN_ESLESMESI: MatchResponseDTO = {
  id: 301,
  myAdId: 88,
  myAd: { id: 88, title: 'Kayıp beyaz köpek' },
  partnerAdId: 92,
  partnerAd: { id: 92, title: 'Beşiktaş’ta köpek bulundu' },
  totalScore: 0.95,
  visualScore: 0.95,
  tagScore: 0.95,
  locationScore: 0.95,
  thresholdAtTime: 0.75,
  passedThreshold: true,
}

const kapat = vi.fn()
const basarili = vi.fn()

beforeEach(() => {
  kapat.mockClear()
  basarili.mockClear()
  cozumGonder.mockReset()
  cozumGonder.mockResolvedValue({ message: 'ok' })
  ilanGetir.mockReset()
  ilanGetir.mockResolvedValue(BULUNDU_ILAN)
  eslesmeleriGetir.mockReset()
  eslesmeleriGetir.mockResolvedValue([BU_ILANIN_ESLESMESI, BASKA_ILANIN_ESLESMESI])
})

function pencereyiAc(ad: AdResponse = KAYIP_ILAN) {
  return render(
    <ResolveFoundModal isOpen ad={ad} onClose={kapat} onSuccess={basarili} />,
  )
}

async function adayiSecVeKapat(desen: RegExp) {
  const aday = await screen.findByRole('radio', { name: desen })
  await userEvent.click(aday)
  await userEvent.click(
    screen.getByRole('button', { name: /Bulundu olarak kapat/i }),
  )
  await waitFor(() => expect(cozumGonder).toHaveBeenCalledTimes(1))
  return cozumGonder.mock.calls[0] as [number, { finderId?: number; foundAdId?: number }]
}

describe('ResolveFoundModal — aday listesi', () => {
  it('eslesme fotografi partner ilanin basligini alt metni olarak tasir', async () => {
    // Fotograf ICERIK gorseli (hangi ilanla eslestigini gosteriyor) — bos
    // alt, ekran okuyucuya "adsiz gorsel" der; erisilebilir adi baslikla ayni
    // olmali. Varsayilan fikstur photoUrl tasimiyor, o yuzden burada veriyoruz.
    eslesmeleriGetir.mockResolvedValue([
      {
        ...BU_ILANIN_ESLESMESI,
        partnerAd: { id: 91, title: 'Sarıyer’de tekir bulundu', photoUrl: 'foto/91.jpg' },
      },
    ])
    pencereyiAc()

    expect(
      await screen.findByRole('img', { name: 'Sarıyer’de tekir bulundu' }),
    ).toBeInTheDocument()
  })

  it('yalniz BU ilanin eslesmelerini gosterir', async () => {
    pencereyiAc()

    expect(
      await screen.findByRole('radio', { name: /tekir bulundu/i }),
    ).toBeInTheDocument()

    // Ikizi: suzgec dusurulurse kullanici BASKA ilaninin eslesmesini secip
    // yanlis ilanla bag kurar.
    expect(
      screen.queryByRole('radio', { name: /köpek bulundu/i }),
    ).not.toBeInTheDocument()
  })

  it('eslesme listesi hata verse bile ilan kapatilabilir', async () => {
    eslesmeleriGetir.mockRejectedValue(new Error('sunucu yok'))

    pencereyiAc()

    await userEvent.click(
      screen.getByRole('button', { name: /Bulundu olarak kapat/i }),
    )

    await waitFor(() => expect(cozumGonder).toHaveBeenCalledWith(74, {}))
  })
})

describe('ResolveFoundModal — telde giden istek', () => {
  it('bulundu ilani secilince foundAdId VE finderId gonderir', async () => {
    pencereyiAc()

    const [adId, govde] = await adayiSecVeKapat(/tekir bulundu/i)

    expect(adId).toBe(74)
    expect(govde).toEqual({ foundAdId: 91, finderId: 12 })
    expect(basarili).toHaveBeenCalledWith(KAYIP_ILAN)
    expect(kapat).toHaveBeenCalled()
  })

  it('aday secilmezse govde BOS gider — kendim buldum hali', async () => {
    pencereyiAc()

    await screen.findByRole('radio', { name: /tekir bulundu/i })
    await userEvent.click(
      screen.getByRole('button', { name: /Bulundu olarak kapat/i }),
    )

    await waitFor(() => expect(cozumGonder).toHaveBeenCalledWith(74, {}))
  })

  it('secilen ilan FOUND degilse foundAdId GONDERILMEZ', async () => {
    // Gercek arizanin ta kendisi: sunucu bu bagi gorunce istegin TAMAMINI
    // reddeder ve kullanici ilanini kapatamaz.
    ilanGetir.mockResolvedValue({ ...BULUNDU_ILAN, adType: 'ADOPTION' })

    pencereyiAc()

    const [, govde] = await adayiSecVeKapat(/tekir bulundu/i)

    expect(govde.foundAdId).toBeUndefined()
    expect(govde.finderId).toBeUndefined()
    expect(
      screen.getByText(/eşleşme bağı kaydedilemez/i),
    ).toBeInTheDocument()
  })

  it('eslesen ilan OKUNAMAZSA bag dusurulur, kapanis yine olur', async () => {
    ilanGetir.mockRejectedValue(new Error('404'))

    pencereyiAc()

    const [, govde] = await adayiSecVeKapat(/tekir bulundu/i)

    expect(govde).toEqual({})
    expect(basarili).toHaveBeenCalledTimes(1)
  })

  it('kendi bulundu ilanini secen kullaniciya odul puani YAZILMAZ', async () => {
    // Eslesme uretimi ayni kullaniciyi elemiyor; bu vaka gercekten olusabilir.
    ilanGetir.mockResolvedValue({ ...BULUNDU_ILAN, ownerId: KAYIP_ILAN.ownerId })

    pencereyiAc()

    const [, govde] = await adayiSecVeKapat(/tekir bulundu/i)

    // Bag kurulur (olcum icin degerli), ama finderId gitmez.
    expect(govde.foundAdId).toBe(91)
    expect(govde.finderId).toBeUndefined()
  })

  it('BASKA ilana gecince onceki secim TASINMAZ', async () => {
    // Kusur sinifi: pencere kapanip baska bir ilan icin acildiginda onceki
    // ilanda secili kalan aday duruyor olsaydi, kullanici ikinci ilanini
    // BIRINCININ eslesmesiyle kapatirdi. Sunucu bunu goremez - iki kimlik de
    // gecerli, sadece yanlis.
    //
    // ⚠ NISAN GORUNUR SECIM DURUMUNDA, telde giden govdede DEGIL: govde
    // `bagKurulabilir` sifirlamasi sayesinde sizinti varken de bos kalir, yani
    // govdeye bakan bir vaka bu kusuru GOREMEZ (olculdu - mutasyon kacti).
    const { rerender } = pencereyiAc()

    await userEvent.click(
      await screen.findByRole('radio', { name: /tekir bulundu/i }),
    )
    await waitFor(() => expect(ilanGetir).toHaveBeenCalledWith(91))
    expect(screen.getByRole('radio', { name: /tekir bulundu/i })).toBeChecked()

    // Ayni bulundu ilani kullanicinin IKINCI kayip ilaniyla da eslesmis
    // olabilir; aday listesi bos birakilsaydi sizan secim ekranda hic
    // gorunmez ve vaka yine kor kalirdi.
    const IKINCI_ILAN: AdResponse = { ...KAYIP_ILAN, id: 75, title: 'Kayıp sarı kedi' }
    eslesmeleriGetir.mockResolvedValue([
      { ...BU_ILANIN_ESLESMESI, id: 302, myAdId: 75, myAd: { id: 75, title: 'Kayıp sarı kedi' } },
    ])

    rerender(
      <ResolveFoundModal
        isOpen
        ad={IKINCI_ILAN}
        onClose={kapat}
        onSuccess={basarili}
      />,
    )

    const ayniAday = await screen.findByRole('radio', { name: /tekir bulundu/i })
    expect(ayniAday).not.toBeChecked()
    expect(screen.getByRole('radio', { name: /Kendim buldum/i })).toBeChecked()

    await userEvent.click(
      screen.getByRole('button', { name: /Bulundu olarak kapat/i }),
    )
    await waitFor(() => expect(cozumGonder).toHaveBeenCalledWith(75, {}))
  })

  it('sunucu reddederse hata gosterilir ve basari BILDIRILMEZ', async () => {
    cozumGonder.mockRejectedValue(new Error('İlan bir kayıp ilanı değildir.'))

    pencereyiAc()

    await userEvent.click(
      screen.getByRole('button', { name: /Bulundu olarak kapat/i }),
    )

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(basarili).not.toHaveBeenCalled()
    expect(kapat).not.toHaveBeenCalled()
  })
})
