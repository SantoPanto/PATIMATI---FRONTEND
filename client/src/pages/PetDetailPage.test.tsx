import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Girissiz kullanicinin "Mesaj Gonder" akisi (madde 21).
 *
 * <p><b>Olculen kusur:</b> girissiz biri dugmeye basinca tarayicinin yerel
 * uyari kutusu cikiyor ve <b>hicbir sey olmuyordu</b> — kullanici giris
 * sayfasina goturulmuyor, ayni sayfada kaliyordu. Akis tam da donusumun
 * olacagi yerde kopuyor.
 *
 * <p><b>Neden bu testin varligi sarti:</b> kusur da duzeltmesi de saf
 * <b>calisma ani</b> davranisi — `openChat` icindeki dalin hangi kosulda
 * calistigi. Tip denetimi ikisini de goremez; koda bakan biri
 * `createOrGetChatRoom` cagrisini gorup "sohbet aciliyor" sanir.
 */

const { navigate, oturum, ilanGetir, odaAc, gorulmeGetir } = vi.hoisted(() => ({
  navigate: vi.fn(),
  oturum: { user: null as { id?: number } | null, isAuthenticated: false },
  ilanGetir: vi.fn(),
  odaAc: vi.fn(),
  gorulmeGetir: vi.fn(),
}))

vi.mock('wouter', () => ({
  useLocation: () => ['/pet/74', navigate] as const,
  useParams: () => ({ id: '74' }),
}))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => oturum,
}))

vi.mock('../services/ads', () => ({
  getPublicAdById: ilanGetir,
}))

vi.mock('../services/messages', () => ({
  createOrGetChatRoom: odaAc,
  startConversationWithAd: odaAc,
}))

vi.mock('../services/sightings', () => ({
  getSightings: gorulmeGetir,
  createSighting: vi.fn(),
}))

// Header/Footer kendi baglamlarini (yonlendirme, oturum, bildirim) cekiyor;
// olculen sey sayfa cercevesi degil, dugmenin davranisi. Ikisi de sahte.
vi.mock('../components/Header', () => ({ default: () => <header /> }))
vi.mock('../components/Footer', () => ({ default: () => <footer /> }))

import PetDetailPage from './PetDetailPage'

const ILAN = {
  id: 74,
  title: 'Kayıp tekir kedi',
  description: 'Sarıyer civarında kayboldu',
  adType: 'LOST',
  species: 'CAT',
  breed: null,
  colors: ['BROWN'],
  gender: 'UNKNOWN',
  ageGroup: 'ADULT',
  coatPattern: 'UNKNOWN',
  collarStatus: 'UNKNOWN',
  collarColor: null,
  collarTagText: null,
  eyeColor: 'UNKNOWN',
  earTagStatus: 'UNKNOWN',
  earNotchStatus: 'UNKNOWN',
  microchipped: false,
  lostDate: '2026-08-01',
  distinctiveMarks: null,
  latitude: 41.1,
  longitude: 29.05,
  ownerId: 7,
  ownerDisplayName: 'Ayşe K.',
  photoUrls: [],
  active: true,
  aiStatus: 'DONE',
  aiIsPet: true,
  createdAt: '2026-08-01T10:00:00Z',
  updatedAt: '2026-08-01T10:00:00Z',
}

beforeEach(() => {
  navigate.mockClear()
  odaAc.mockClear()
  odaAc.mockResolvedValue({ id: 1 })
  ilanGetir.mockReset()
  ilanGetir.mockResolvedValue(ILAN)
  gorulmeGetir.mockReset()
  gorulmeGetir.mockResolvedValue([])
  oturum.user = null
  oturum.isAuthenticated = false
  window.history.replaceState({}, '', '/pet/74')
})

async function mesajGonderEDugmesineBas() {
  render(<PetDetailPage />)
  const dugme = await screen.findByRole('button', { name: /Mesaj Gönder/i })
  await userEvent.click(dugme)
}

describe('PetDetailPage — "Mesaj Gönder"', () => {
  it('girissiz kullaniciyi GIRIS SAYFASINA goturur', async () => {
    await mesajGonderEDugmesineBas()

    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1))

    const [hedef] = navigate.mock.calls[0] as [string]
    expect(hedef).toContain('/login?redirect=')
  })

  it('donus adresi bu ILANI gosterir — giristen sonra buraya donulur', async () => {
    window.history.replaceState({}, '', '/pet/74?kaynak=harita')

    await mesajGonderEDugmesineBas()

    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1))

    const [hedef] = navigate.mock.calls[0] as [string]
    const donusAdresi = decodeURIComponent(hedef.split('redirect=')[1])
    expect(donusAdresi).toBe('/pet/74?kaynak=harita')
  })

  it('girissizken sohbet odasi ucuna HIC gitmez', async () => {
    await mesajGonderEDugmesineBas()

    // Kusurun ta kendisi buydu: istek istemci tarafinda firlatiyor, catch
    // bir alert basiyor ve akis oluyordu. Artik uca hic gidilmiyor.
    await waitFor(() => expect(navigate).toHaveBeenCalled())
    expect(odaAc).not.toHaveBeenCalled()
  })

  it('giris yapmis kullanicida sohbet odasi acilir — kapi fazla genis degil', async () => {
    oturum.user = { id: 5 }
    oturum.isAuthenticated = true

    await mesajGonderEDugmesineBas()

    // Ikizi: kosul yanlislikla "her zaman /login'e git" diye genisletilirse
    // bu vaka kirmizi yanar.
    await waitFor(() => expect(odaAc).toHaveBeenCalledWith({ targetUserId: 7, adId: 74 }))
    const hedefler = navigate.mock.calls.map(([h]) => h as string)
    expect(hedefler.some((h) => h.includes('/login'))).toBe(false)
    expect(hedefler).toContain('/chat/7')
  })
})

/**
 * DESEN hücresi metni (22.08, 390px turu).
 *
 * <p><b>Ölçülen kusur:</b> hücre 390px'te 111px; "Desen belirtilmemiş"
 * 136px istiyor ve truncate "Desen belirtil…" diye kesiyordu. Hücrenin
 * başlığı zaten "DESEN" — değerde kelimeyi tekrarlamak hem gereksizdi hem
 * sığmıyordu. Değer "Belirtilmemiş" oldu (CİNSİYET hücresiyle tutarlı),
 * truncate kaldırıldı (uzun değer diğer hücreler gibi sarar, kesilmez).
 */
describe('PetDetailPage — DESEN hücresi', () => {
  it('bilinmeyen desende "Belirtilmemiş" yazar, eski uzun metin donmez', async () => {
    render(<PetDetailPage />)

    // Nişan hücrenin KENDİSİ: sayfada başka "Belirtilmemiş" de var
    // (CİNSİYET aynı fixture'da UNKNOWN) — genel metin araması ya çoklu
    // eşleşmeyle patlar ya da yanlış hücreden sahte yeşil verir.
    const desenHucresi = (await screen.findByText('DESEN')).parentElement!
    expect(desenHucresi.textContent).toContain('Belirtilmemiş')
    expect(desenHucresi.textContent).not.toContain('Desen belirtil')
    expect(screen.queryByText(/Desen belirtil/)).toBeNull()
  })

  it('dolu desen dogru etikete cevrilir (pozitif kontrol)', async () => {
    ilanGetir.mockResolvedValue({ ...ILAN, coatPattern: 'TORTOISESHELL' })

    render(<PetDetailPage />)

    expect(await screen.findByText('Kaplumbağa Kabuğu')).toBeTruthy()
  })
})

/**
 * "Gördüm" bildirimi görünürlüğü (özellik ①, 22.08).
 *
 * <p>Taşıyıcı iddialar: düğme KAYIP ilanında sahip olmayan HERKESE (girişsiz
 * dahil — afiş QR'ı senaryosu) görünür; Görülmeler bölümü YALNIZ sahibine
 * görünür ve listeyi sunucudan çeker. Tip denetimi hangi JSX dalının
 * çizildiğini göremez, o yüzden render edip bakıyoruz.
 */
describe('PetDetailPage — Gördüm bildirimi', () => {
  it('girissiz ziyaretci kayip ilaninda "Bu Hayvanı Gördüm" dugmesini gorur; Gorulmeler bolumunu GORMEZ', async () => {
    render(<PetDetailPage />)

    expect(
      await screen.findByRole('button', { name: /Bu Hayvanı Gördüm/ }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Görülmeler')).toBeNull()
    expect(gorulmeGetir).not.toHaveBeenCalled()
  })

  it('kayip DISI ilanda dugme cizilmez', async () => {
    ilanGetir.mockResolvedValue({ ...ILAN, adType: 'FOUND' })

    render(<PetDetailPage />)

    await screen.findByRole('button', { name: /Mesaj Gönder/i })
    expect(screen.queryByRole('button', { name: /Bu Hayvanı Gördüm/ })).toBeNull()
  })

  it('sahibi dugme yerine Gorulmeler bolumunu gorur ve liste sunucudan cekilir', async () => {
    oturum.user = { id: 7 }
    oturum.isAuthenticated = true
    gorulmeGetir.mockResolvedValue([
      {
        id: 99,
        latitude: 40.19,
        longitude: 29.06,
        note: 'Parkta gördüm',
        reporterContact: '0555 111 22 33',
        photoUrl: null,
        createdAt: '2026-08-22T18:00:00Z',
      },
    ])

    render(<PetDetailPage />)

    expect(await screen.findByText('Görülmeler')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Bu Hayvanı Gördüm/ })).toBeNull()
    await waitFor(() => expect(gorulmeGetir).toHaveBeenCalledWith(74))
    expect(await screen.findByText('Parkta gördüm')).toBeInTheDocument()
    expect(screen.getByText(/0555 111 22 33/)).toBeInTheDocument()
  })
})
