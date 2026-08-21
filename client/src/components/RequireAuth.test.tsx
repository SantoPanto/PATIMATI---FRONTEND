import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Korumali rota kapisinin CALISMA ANI davranisi.
 *
 * <p><b>Neden bu dosya var:</b> 20.08'de bu bilesene yazilan bir mutasyon
 * KACTI — cunku ön yüzün tek olcusu `tsc`ydi ve tip denetimi "bu dal hangi
 * kosulda calisiyor" sorusunu goremez. `mode` degerini yanlis dala baglamak,
 * korumali bileseni giris yapmamis kullaniciya cizmek ya da yonlendirmeyi hic
 * cagirmamak — ucunun de tipi kusursuzdur.
 *
 * <p><b>Neden Modal SAHTELENMEDI:</b> gercek `AuthRequiredModal` kullaniliyor.
 * Sahtelenseydi "modal acildi" iddiasi yalnizca RequireAuth'un bir bileseni
 * cagirdigini kanitlardi, kullanicinin giris penceresini gordugunu degil.
 * Sahtelenen tek sey gercekten disaridan gelen durum: oturum ve yonlendirme.
 */

const { navigate, oturum } = vi.hoisted(() => ({
  navigate: vi.fn(),
  oturum: { isAuthenticated: false, isAuthLoading: false },
}))

vi.mock('wouter', () => ({
  useLocation: () => ['/profil', navigate] as const,
}))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => oturum,
}))

// `vi.mock` cagrilari import'larin USTUNE tasiniyor (vitest donusturuyor),
// bu yuzden duz import yeterli — dinamik import gerekmiyor.
import RequireAuth from './RequireAuth'

function KorumaliSayfa() {
  return <div>gizli içerik</div>
}

beforeEach(() => {
  navigate.mockClear()
  oturum.isAuthenticated = false
  oturum.isAuthLoading = false
})

describe('RequireAuth', () => {
  it('oturum yuklenirken korumali bileseni CIZMEZ', () => {
    oturum.isAuthLoading = true

    render(<RequireAuth component={KorumaliSayfa} mode="redirect" />)

    // Yukleme sirasinda "giris yapmamis" gibi davranilirsa, sayfa her
    // yenilendiginde kullanici bir an /login'e atilir.
    expect(screen.queryByText('gizli içerik')).not.toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('giris yapmis kullaniciya korumali bileseni cizer', () => {
    oturum.isAuthenticated = true

    render(<RequireAuth component={KorumaliSayfa} mode="redirect" />)

    expect(screen.getByText('gizli içerik')).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('mode="redirect": girissiz kullaniciyi /login e GONDERIR, icerigi cizmez', () => {
    render(<RequireAuth component={KorumaliSayfa} mode="redirect" />)

    expect(screen.queryByText('gizli içerik')).not.toBeInTheDocument()
    expect(navigate).toHaveBeenCalledTimes(1)

    const [hedef] = navigate.mock.calls[0] as [string]
    expect(hedef).toContain('/login?redirect=')
  })

  it('mode="modal": girissiz kullaniciyi YONLENDIRMEZ, pencereyi acar', () => {
    render(<RequireAuth component={KorumaliSayfa} mode="modal" />)

    // Iki modun ayrimi kuralin ta kendisi (madde 28): icerikten aksiyon
    // alarak gelinen sayfada kullanici sayfadan KOPARILMAZ. Yonlendirme
    // cagrilirsa kural sessizce ihlal edilmis olur.
    expect(navigate).not.toHaveBeenCalled()
    expect(screen.queryByText('gizli içerik')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('yonlendirme DONUS ADRESINI tasir', () => {
    // Madde 28 kurali: iki yol da donus adresini tasir, LoginPage bunu okuyup
    // geri doner. Adres dusurse kullanici giristen sonra anasayfaya birakilir
    // ve ne yapmaya calistigini kaybeder — tipi kusursuz, davranisi bozuk.
    window.history.replaceState({}, '', '/ilanlar/42?sekme=fotograf')

    render(<RequireAuth component={KorumaliSayfa} mode="redirect" />)

    const [hedef] = navigate.mock.calls[0] as [string]
    const donusAdresi = decodeURIComponent(hedef.split('redirect=')[1])
    expect(donusAdresi).toBe('/ilanlar/42?sekme=fotograf')
  })

  // ⚠ Olculemeyen: `goToLogin` icindeki `sanitizeRedirectPath` cagrisinin
  // KALDIRILMASI bu dosyada yakalanamaz. Suzgecin reddettigi bir adres
  // (`//kotu.example/x`) jsdom'da `history.replaceState` ile kurulamiyor —
  // farkli kaynak sayilip SecurityError veriyor. Suzgecin kendisi
  // `services/authStorage.test.ts` icinde dogrudan olculuyor.
})
