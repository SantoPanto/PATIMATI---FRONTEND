import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * B5: İlanlar sayfasında arama kutusu.
 *
 * <p><b>Ölçülen kusur (21.08, canlı):</b> sitede tek arama ana sayfadaki
 * kutuydu; İlanlar sayfasına gidip arama arayan kullanıcı bulamıyordu.
 * Kutu eklendi ve sunucu tarafında arıyor (başlık+ırk+açıklama, BE #126).
 *
 * <p><b>Neden mock-çağrı iddiası:</b> iddiaların çoğu "sunucuya HANGİ
 * parametreyle gidildi" hakkında — bekletme (debounce) süresi, Enter'ın
 * bekletmeyi atlaması ve sayfanın 0'a dönmesi ancak istek parametrelerinden
 * gözlenebilir; ekranda ikisi de aynı görünür.
 */

const { ilanlariGetir } = vi.hoisted(() => ({ ilanlariGetir: vi.fn() }))

vi.mock('../services/ads', () => ({
  getPublicAds: ilanlariGetir,
}))

vi.mock('wouter', () => ({
  Link: ({ children }: { children?: React.ReactNode }) => <a>{children}</a>,
}))

vi.mock('../components/Header', () => ({ default: () => <header /> }))
vi.mock('../components/Footer', () => ({ default: () => <footer /> }))
vi.mock('../components/PetListingCard', () => ({ default: () => null }))

import ListingsPage from './listingpage'

function sayfaVer(totalPages = 0, totalElements = 0) {
  ilanlariGetir.mockResolvedValue({
    content: [],
    totalPages,
    totalElements,
  })
}

/** Bekleyen istek sözlerinin (promise) çözülmesini bekler; zamanlayıcı İLERLETMEZ. */
async function istekleriBekle() {
  await act(async () => {})
}

beforeEach(() => {
  ilanlariGetir.mockReset()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('ListingsPage — arama kutusu (B5)', () => {
  it('ilk yükleme aramasız gider; yazınca bekletme sonrası search paramı eklenir', async () => {
    sayfaVer()

    render(<ListingsPage />)
    await istekleriBekle()

    expect(ilanlariGetir).toHaveBeenCalledWith({ page: 0, size: 20 })

    fireEvent.change(screen.getByLabelText('İlanlarda ara'), {
      target: { value: 'tekir' },
    })

    // Bekletme dolmadan istek GİTMEMELİ — her tuşta sunucuya gitmek
    // kutunun varlık sebebini (sunucu araması) spam'e çevirirdi.
    expect(ilanlariGetir).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(350)
    })
    await istekleriBekle()

    expect(ilanlariGetir).toHaveBeenLastCalledWith({
      page: 0,
      size: 20,
      search: 'tekir',
    })
  })

  it('Enter bekletmeyi beklemeden aramayı gönderir', async () => {
    sayfaVer()

    render(<ListingsPage />)
    await istekleriBekle()

    const kutu = screen.getByLabelText('İlanlarda ara')
    fireEvent.change(kutu, { target: { value: 'kangal' } })
    fireEvent.keyDown(kutu, { key: 'Enter' })
    await istekleriBekle()

    expect(ilanlariGetir).toHaveBeenLastCalledWith({
      page: 0,
      size: 20,
      search: 'kangal',
    })
  })

  it('arama sayfayı 0a döndürür ve sekme süzgeciyle birleşir', async () => {
    sayfaVer(3, 60)

    render(<ListingsPage />)
    await istekleriBekle()

    // Önce 2. sayfaya geçilir ki "aramada 0'a dönüş" gerçekten ölçülsün —
    // sayfa zaten 0'ken iddia hiçbir şeyi kanıtlamazdı.
    fireEvent.click(screen.getByLabelText('Sonraki sayfa'))
    await istekleriBekle()
    expect(ilanlariGetir).toHaveBeenLastCalledWith({ page: 1, size: 20 })

    const kutu = screen.getByLabelText('İlanlarda ara')
    fireEvent.change(kutu, { target: { value: 'tekir' } })
    fireEvent.keyDown(kutu, { key: 'Enter' })
    await istekleriBekle()

    expect(ilanlariGetir).toHaveBeenLastCalledWith({
      page: 0,
      size: 20,
      search: 'tekir',
    })

    fireEvent.click(screen.getByRole('tab', { name: 'Kayıp' }))
    await istekleriBekle()

    expect(ilanlariGetir).toHaveBeenLastCalledWith({
      page: 0,
      size: 20,
      search: 'tekir',
      adType: 'LOST',
    })
  })

  it('boş sonuçta aramaya özgü mesaj ve temizleme düğmesi çıkar', async () => {
    sayfaVer()

    render(<ListingsPage />)
    await istekleriBekle()

    const kutu = screen.getByLabelText('İlanlarda ara')
    fireEvent.change(kutu, { target: { value: 'bulunamayacakterim' } })
    fireEvent.keyDown(kutu, { key: 'Enter' })
    await istekleriBekle()

    expect(screen.getByText('Aramana uyan ilan bulunamadı')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Aramayı temizle' }))
    await istekleriBekle()

    expect((kutu as HTMLInputElement).value).toBe('')
    expect(ilanlariGetir).toHaveBeenLastCalledWith({ page: 0, size: 20 })
  })
})
