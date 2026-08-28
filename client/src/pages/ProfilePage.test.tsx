import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * "Profili düzenle" dugmesinin mobil kaydirma davranisi (28.08 cihaz bulgusu).
 *
 * <p><b>Olculen kusur:</b> mobil tek kolonda dugme ustteki kartta, form ise
 * ~1200px asagidaki "Kisisel bilgiler" bolumunde aciliyordu. Sayfa
 * kaydirilmadigi icin dokunusun gorunur hicbir sonucu yoktu — ekip ve
 * kullanici bunu defalarca "dugme calismiyor" diye bildirdi (T'de programatik
 * click ile "form aciliyor" olculup artefakt sanilmisti; islev calisiyordu,
 * gorunurluk yoktu).
 *
 * <p><b>Neden bu testin varligi sart:</b> kusur da duzeltmesi de calisma ani
 * davranisi — isEditing'e bagli effect'in scrollIntoView cagirmasi. Tip
 * denetimi ve gorsel inceleme bunu goremez; effect silinirse sayfa yine
 * "calisir" gorunur, yalnizca telefonda dokunus sessizlesir.
 */

const { navigate, oturum, profilGuncelle } = vi.hoisted(() => ({
  navigate: vi.fn(),
  oturum: {
    user: {
      uid: 7,
      email: 'test@patimati.me',
      firstName: 'Test',
      lastName: 'Kullanici',
      role: 'USER',
      phone: '05550000000',
      enabled: true,
    },
    isAuthenticated: true,
    isAuthLoading: false,
    logout: vi.fn(),
    refreshUser: vi.fn(),
    updateUser: vi.fn(),
  },
  profilGuncelle: vi.fn(),
}))

vi.mock('wouter', () => ({
  useLocation: () => ['/profile', navigate] as const,
}))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => oturum,
}))

vi.mock('../services/auth', () => ({
  updateProfile: profilGuncelle,
}))

vi.mock('../services/location', () => ({
  isValidCoordinates: vi.fn().mockReturnValue(false),
  reverseGeocodeCity: vi.fn().mockResolvedValue(null),
}))

// Cerceve bilesenleri kendi baglamlarini cekiyor; olculen sey dugme→kaydirma
// zinciri. Harita da jsdom'da gereksiz agirlik.
vi.mock('../components/Header', () => ({ default: () => <header /> }))
vi.mock('../components/Footer', () => ({ default: () => <footer /> }))
vi.mock('../components/MapPicker', () => ({ default: () => <div /> }))

import ProfilePage from './ProfilePage'

describe('ProfilePage — "Profili düzenle" formu görünür kılar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // jsdom'da scrollIntoView yok; cagri yapilip yapilmadigini olcuyoruz.
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('düğmeye basınca form açılır VE bilgi bölümüne kaydırılır', async () => {
    render(<ProfilePage />)

    const dugme = await screen.findByRole('button', { name: /Profili düzenle/i })
    await userEvent.click(dugme)

    // Form gercekten acildi (Ad girdisi gorunur oldu)...
    expect(await screen.findByLabelText('Ad')).toBeInTheDocument()

    // ...ve kaydirma cagrisi yapildi — mobilde dokunusun gorunur sonucu bu.
    await waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ block: 'start' }),
      )
    })
  })

  it('düzenleme kapalıyken kaydırma çağrısı YAPILMAZ', async () => {
    render(<ProfilePage />)
    await screen.findByRole('button', { name: /Profili düzenle/i })
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })
})
