import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { AdResponse } from '../services/types'

/**
 * Kart, bilinmeyen değerlerde ham enum sızdırıyor muydu?
 *
 * <p><b>Ölçülen kusur (22.08, canlı 390px turu):</b> İlanlar/Favoriler
 * kartında "Kedi MIXED_OR_UNKNOWN" ve "Bilinmiyor UNKNOWN" görünüyordu.
 * Sebep: bileşen, utils/adPresentation'daki etiketleri değil kendi yerel
 * kopyalarını kullanıyordu ve kopyaların UNKNOWN dalı eksikti (default
 * dalı ham enum döndürüyordu). adPresentation'a bağlandı.
 *
 * <p>Pozitif kontrol ayrı vakada: dolu değerlerin de doğru etikete
 * çevrildiği ölçülüyor — yalnız "ham enum yok" demek tek yönlü ölçümdür.
 */

vi.mock('wouter', () => ({
  Link: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a href={href}>{children}</a>
  ),
}))

import PetListingCard from './PetListingCard'

const TEMEL: AdResponse = {
  id: 1,
  title: 'Bulundu: Kedi',
  description: '',
  adType: 'FOUND',
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
  active: true,
  suspended: false,
  createdAt: '2026-08-21T00:00:00Z',
  updatedAt: '2026-08-21T00:00:00Z',
}

describe('PetListingCard — etiketler', () => {
  it('bilinmeyen degerlerde ham enum SIZMAZ, Turkce etiket cizilir', () => {
    render(<PetListingCard ad={TEMEL} />)

    expect(screen.queryByText(/MIXED_OR_UNKNOWN/)).toBeNull()
    expect(screen.queryByText(/UNKNOWN/)).toBeNull()

    expect(screen.getByText('Kedi · Cins belirtilmemiş')).toBeTruthy()
    expect(screen.getByText('Belirtilmemiş')).toBeTruthy()
    expect(screen.getByText('Yaş belirtilmemiş')).toBeTruthy()
  })

  it('dolu degerler dogru etikete cevrilir (pozitif kontrol)', () => {
    render(
      <PetListingCard
        ad={{ ...TEMEL, breed: 'Tekir', gender: 'FEMALE', ageGroup: 'YOUNG' }}
      />,
    )

    expect(screen.getByText('Kedi · Tekir')).toBeTruthy()
    expect(screen.getByText('Dişi')).toBeTruthy()
    expect(screen.getByText('Genç')).toBeTruthy()
  })
})

/**
 * Akordiyon (27.08 isteği): karta tıklamak detay sayfasına GİTMEZ, kartı
 * aşağı doğru açar — özet (açıklama, kaybolma tarihi, ayırt edici işaretler)
 * kartın altında görünür. Detaya yalnız "İlanı incele" düğmesi götürür.
 */
describe('PetListingCard — akordiyon', () => {
  const DOLU = {
    ...TEMEL,
    description: 'Parkta bulundu, çok uysal bir kedi.',
    lostDate: '2026-08-20',
    distinctiveMarks: 'Sol kulakta çentik',
  }

  it('başlangıçta özet kapalı; başlığa tıklayınca açılır, tekrar tıklayınca kapanır', () => {
    render(<PetListingCard ad={DOLU} />)

    expect(screen.queryByText(/Parkta bulundu/)).toBeNull()

    // Başlık düğmesi: erişilebilir adı içerikten gelir (başlık + alt başlık
    // + tarih); görsel düğmesinin aria-label'ıyla karışmasın diye alt
    // başlıktan seçiyoruz.
    const baslik = screen.getByRole('button', {
      name: /Kedi · Cins belirtilmemiş/,
    })
    expect(baslik.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(baslik)
    expect(screen.getByText(/Parkta bulundu, çok uysal/)).toBeTruthy()
    expect(screen.getByText(/Sol kulakta çentik/)).toBeTruthy()
    expect(baslik.getAttribute('aria-expanded')).toBe('true')

    fireEvent.click(baslik)
    expect(screen.queryByText(/Parkta bulundu/)).toBeNull()
  })

  it('görsel alanı artık detaya götüren bir link DEĞİL, açma/kapama düğmesi', () => {
    render(<PetListingCard ad={DOLU} />)

    const gorselDugme = screen.getByRole('button', {
      name: /ilan özetini aç\/kapat/,
    })
    fireEvent.click(gorselDugme)
    expect(screen.getByText(/Parkta bulundu/)).toBeTruthy()
  })

  it("detay sayfasına yalnız 'İlanı incele' götürür (href korunur)", () => {
    render(<PetListingCard ad={DOLU} />)

    const incele = screen.getByRole('link', { name: /İlanı incele/ })
    expect(incele.getAttribute('href')).toBe('/pet/1')
  })

  it('açıklaması boş ilanda açılınca bilgilendirme metni görünür', () => {
    render(<PetListingCard ad={TEMEL} />)

    fireEvent.click(
      screen.getByRole('button', { name: /ilan özetini aç\/kapat/ }),
    )
    expect(screen.getByText('Bu ilana açıklama eklenmemiş.')).toBeTruthy()
  })
})
