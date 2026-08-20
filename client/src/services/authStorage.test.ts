import { describe, expect, it } from 'vitest'

import { sanitizeRedirectPath } from './authStorage'

/**
 * `sanitizeRedirectPath` bir ACIK YONLENDIRME (open redirect) kapisi:
 * `/login?redirect=...` parametresi kullanicidan geliyor ve giristen sonra
 * oraya gidiliyor. Suzgec delinirse saldirgan kullaniciyi kendi sitesine
 * tasiyabilir; sayfa gercek giristen sonra acildigi icin kurban akisin
 * meshru oldugunu dusunur.
 *
 * Tip denetimi bu fonksiyon hakkinda hicbir sey soyleyemez — donus tipi her
 * durumda `string`. Olculecek sey davranis, imza degil.
 */
describe('sanitizeRedirectPath', () => {
  it('site ici yolu oldugu gibi birakir', () => {
    expect(sanitizeRedirectPath('/profil')).toBe('/profil')
  })

  it('sorgu ve capa parcalarini korur', () => {
    expect(sanitizeRedirectPath('/ilanlar?tur=kayip#liste')).toBe(
      '/ilanlar?tur=kayip#liste',
    )
  })

  it('protokol-goreli adresi (//site) REDDEDER', () => {
    // `//kotu.example` tarayicida `https://kotu.example` demektir; tek egik
    // cizgiyle basladigi icin "site ici" gibi gorunur. Suzgecin en kolay
    // atlanan vakasi budur.
    expect(sanitizeRedirectPath('//kotu.example/giris')).toBe('/')
  })

  it('ters egik cizgili bicimi de (/\\site) REDDEDER', () => {
    // WHATWG URL cozumlemesi ozel semalarda `\` karakterini `/` gibi okur,
    // yani `/\kotu.example` da baska bir kaynaga cikar. `startsWith("//")`
    // kontrolu bunu GORMEZ; yakalayan sey kaynak (origin) karsilastirmasidir.
    expect(sanitizeRedirectPath('/\\kotu.example/giris')).toBe('/')
  })

  it('mutlak dis adresi reddeder', () => {
    expect(sanitizeRedirectPath('https://kotu.example/giris')).toBe('/')
  })

  it('goreli yolu (egik cizgisiz) reddeder', () => {
    expect(sanitizeRedirectPath('profil')).toBe('/')
  })

  it('bos, null ve undefined icin varsayilana duser', () => {
    expect(sanitizeRedirectPath('')).toBe('/')
    expect(sanitizeRedirectPath(null)).toBe('/')
    expect(sanitizeRedirectPath(undefined)).toBe('/')
  })

  it('verilen varsayilani kullanir', () => {
    expect(sanitizeRedirectPath('//kotu.example', '/anasayfa')).toBe('/anasayfa')
  })
})
