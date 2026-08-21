import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AdResponse } from '../services/types'

/**
 * Mutlu sonla kapanan ilan İlanlarım'da nasıl görünüyor?
 *
 * <p><b>Ölçülen kusur (21.08, canlı):</b> "Hayvanımı buldum" ile kapatılan
 * ilan kartta <i>"Yayından kaldırıldı"</i> yazıyordu ve yanında
 * <b>"Yeniden yayınla"</b> düğmesi duruyordu — yani kullanıcı mutlu sonla
 * kapanmış ilanı geri yayına alabiliyordu. Sunucu da engellemiyor:
 * `republishAd` yalnız `active` ve `suspended`e bakıyor.
 *
 * <p><b>Neden burada ölçülüyor:</b> kusur hangi JSX dalının çizildiğinde.
 * `tsc` üç dalı da aynı görür; kaynak metninde desen aramak da yanıltıcı
 * olurdu (metin duruyor, çizilip çizilmediği ayrı soru). Test gerçekten
 * render edip ekranda ne olduğuna bakıyor.
 *
 * <p><b>Alan isteğe bağlı:</b> `resolutionStatus` backend #112 ile geliyor.
 * O inmeden `undefined` kalıyor ve eski davranış korunuyor — üçüncü vaka
 * bunu ölçüyor, yani bu ekran arka yüzü BEKLEMEDEN güvenle inebilir.
 */

const { ilanlariGetir } = vi.hoisted(() => ({ ilanlariGetir: vi.fn() }))

vi.mock('../services/ads', () => ({
  getMyAds: ilanlariGetir,
  deleteAd: vi.fn(),
  republishAd: vi.fn(),
}))

vi.mock('wouter', () => ({
  Link: ({ children }: { children?: React.ReactNode }) => <a>{children}</a>,
}))

vi.mock('../components/Header', () => ({ default: () => <header /> }))
vi.mock('../components/Footer', () => ({ default: () => <footer /> }))
vi.mock('../components/PosterSettingsModal', () => ({ default: () => null }))
vi.mock('../components/ResolveFoundModal', () => ({ default: () => null }))

import MyListingsPage from './MyListingsPage'

const TEMEL: AdResponse = {
  id: 1,
  title: 'Kayıp tekir',
  description: '',
  adType: 'LOST',
  species: 'CAT',
  breed: 'MIXED_OR_UNKNOWN',
  colors: [],
  gender: 'UNKNOWN',
  ageGroup: 'UNKNOWN',
  coatPattern: 'UNKNOWN',
  collarStatus: 'UNKNOWN',
  earTagStatus: 'UNKNOWN',
  earNotchStatus: 'UNKNOWN',
  microchipped: false,
  photoUrls: [],
  latitude: 40.1,
  longitude: 29.0,
  ownerId: 7,
  ownerDisplayName: 'Sahip',
  active: false,
  suspended: false,
  createdAt: '2026-08-21T00:00:00Z',
  updatedAt: '2026-08-21T00:00:00Z',
}

function ilanVer(ad: AdResponse) {
  ilanlariGetir.mockResolvedValue({ content: [ad] })
}

beforeEach(() => {
  ilanlariGetir.mockReset()
})

describe('MyListingsPage — kapanmış ilan', () => {
  it('bulundu diye kapanan ilan BULUNDU gosterir, yeniden yayinla CIKMAZ', async () => {
    ilanVer({ ...TEMEL, resolutionStatus: 'FOUND' })

    render(<MyListingsPage />)

    expect(await screen.findByText(/Bulundu/)).toBeInTheDocument()
    expect(screen.queryByText(/Yayından kaldırıldı/)).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /yeniden yayınla/i }),
    ).not.toBeInTheDocument()
  })

  it('POZITIF KONTROL: sahibi kaldirdiysa yeniden yayinla CIKAR', async () => {
    ilanVer({ ...TEMEL, resolutionStatus: 'NONE' })

    render(<MyListingsPage />)

    expect(await screen.findByText(/Yayından kaldırıldı/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /yeniden yayınla/i }),
    ).toBeInTheDocument()
  })

  it('alan HIC gelmezse eski davranis korunur — arka yuzu beklemez', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- alani disarida birakmak icin kasitli destructuring
    const { resolutionStatus: _yok, ...alansiz } = {
      ...TEMEL,
      resolutionStatus: undefined,
    }
    ilanVer(alansiz as AdResponse)

    render(<MyListingsPage />)

    expect(await screen.findByText(/Yayından kaldırıldı/)).toBeInTheDocument()
  })

  it('cins bilinmiyorken ham enum BASILMAZ', async () => {
    ilanVer({ ...TEMEL, resolutionStatus: 'NONE' })

    render(<MyListingsPage />)

    expect(await screen.findByText(/Cins belirtilmemiş/)).toBeInTheDocument()
    expect(screen.queryByText(/MIXED_OR_UNKNOWN/)).not.toBeInTheDocument()
  })
})
