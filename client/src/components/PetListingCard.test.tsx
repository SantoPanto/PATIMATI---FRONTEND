import { render, screen } from '@testing-library/react'
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
  Link: ({ children }: { children?: React.ReactNode }) => <a>{children}</a>,
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
