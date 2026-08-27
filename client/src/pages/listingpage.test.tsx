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

const { ilanlariGetir, sahiplendirmeGetir } = vi.hoisted(() => ({
  ilanlariGetir: vi.fn(),
  sahiplendirmeGetir: vi.fn(),
}))

vi.mock('../services/ads', () => ({
  getPublicAds: ilanlariGetir,
}))

vi.mock('../services/adoptions', () => ({
  getPublicAdoptions: sahiplendirmeGetir,
}))

let mockSearchStr = ''
let mockLocationPath = '/listings'

vi.mock('wouter', () => ({
  Link: ({ children }: { children?: React.ReactNode }) => <a>{children}</a>,
  useLocation: () => [
    mockLocationPath,
    (to: string) => {
      const [path, query] = to.split('?')
      mockLocationPath = path || '/listings'
      mockSearchStr = query ? `?${query}` : ''
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', to)
      }
    },
  ],
  useSearch: () =>
    mockSearchStr || (typeof window !== 'undefined' ? window.location.search : ''),
}))

vi.mock('../components/Header', () => ({ default: () => <header /> }))
vi.mock('../components/Footer', () => ({ default: () => <footer /> }))
vi.mock('../components/PetListingCard', () => ({ default: () => null }))

import ListingsPage from './listingpage'

function sayfaVer(totalPages = 0, totalElements = 0) {
  const mockResponse = {
    content: [],
    totalPages,
    totalElements,
  }
  ilanlariGetir.mockResolvedValue(mockResponse)
  sahiplendirmeGetir.mockResolvedValue(mockResponse)
}

/** Bekleyen istek sözlerinin (promise) çözülmesini bekler; zamanlayıcı İLERLETMEZ. */
async function istekleriBekle() {
  await act(async () => {})
}

beforeEach(() => {
  mockSearchStr = ''
  mockLocationPath = '/listings'
  if (typeof window !== 'undefined') {
    window.history.replaceState(null, '', '/listings')
  }
  ilanlariGetir.mockReset()
  sahiplendirmeGetir.mockReset()
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

  it('Sahiplendirme sekmesi seçilince banner, alt filtreler ve güvenlik rehberi çıkar', async () => {
    sayfaVer()

    render(<ListingsPage />)
    await istekleriBekle()

    fireEvent.click(screen.getByRole('tab', { name: 'Sahiplendirme' }))
    await istekleriBekle()

    expect(sahiplendirmeGetir).toHaveBeenLastCalledWith({
      page: 0,
      size: 100,
    })

    expect(screen.getByText('Yeni bir yuva yeni bir hayat')).toBeInTheDocument()
    expect(screen.getByLabelText('Tür filtresi')).toBeInTheDocument()
    expect(screen.getByLabelText('Cinsiyet filtresi')).toBeInTheDocument()
    expect(screen.getByText('Güvenli sahiplendirme')).toBeInTheDocument()
  })

  it('Listings sayfasındayken sekmeler/URL değiştiğinde UI ve veriler dinamik güncellenir', async () => {
    sayfaVer()

    window.history.replaceState(null, '', '/listings?type=LOST')
    mockSearchStr = '?type=LOST'

    render(<ListingsPage />)
    await istekleriBekle()

    expect(screen.getByRole('heading', { name: 'Kayıp İlanları' })).toBeInTheDocument()
    expect(ilanlariGetir).toHaveBeenLastCalledWith({
      page: 0,
      size: 20,
      adType: 'LOST',
    })

    // Case 1: LOST -> ADOPTION geçişi
    fireEvent.click(screen.getByRole('tab', { name: 'Sahiplendirme' }))
    await istekleriBekle()

    expect(screen.getByRole('heading', { name: 'Sahiplendirme İlanları' })).toBeInTheDocument()
    expect(screen.getByText('Yeni bir yuva yeni bir hayat')).toBeInTheDocument()
    expect(sahiplendirmeGetir).toHaveBeenLastCalledWith({
      page: 0,
      size: 100,
    })

    // Case 2: ADOPTION -> LOST geçişi
    fireEvent.click(screen.getByRole('tab', { name: 'Kayıp' }))
    await istekleriBekle()

    expect(screen.getByRole('heading', { name: 'Kayıp İlanları' })).toBeInTheDocument()
    expect(screen.queryByText('Yeni bir yuva yeni bir hayat')).not.toBeInTheDocument()
    expect(ilanlariGetir).toHaveBeenLastCalledWith({
      page: 0,
      size: 20,
      adType: 'LOST',
    })

    // Case 3: LOST -> HELP geçişi
    fireEvent.click(screen.getByRole('tab', { name: 'Yardım' }))
    await istekleriBekle()

    expect(screen.getByRole('heading', { name: 'Yardım İlanları' })).toBeInTheDocument()
    expect(ilanlariGetir).toHaveBeenLastCalledWith({
      page: 0,
      size: 20,
      adType: 'HELP',
    })

    // Case 4: HELP -> FOUND geçişi
    fireEvent.click(screen.getByRole('tab', { name: 'Bulunan' }))
    await istekleriBekle()

    expect(screen.getByRole('heading', { name: 'Bulunan İlanlar' })).toBeInTheDocument()
    expect(ilanlariGetir).toHaveBeenLastCalledWith({
      page: 0,
      size: 20,
      adType: 'FOUND',
    })
  })
})
