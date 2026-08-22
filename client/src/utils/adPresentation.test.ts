import { describe, expect, it } from 'vitest'

import type { AdResponse } from '../services/types'
import { getAdLocation } from './adPresentation'

/**
 * Konum etiketi (BE V19 ile birlikte).
 *
 * <p><b>Ölçülen kusur (22.08):</b> kartlar konum olarak ham koordinat
 * basıyordu ("39.9334, 32.8597") — 7 yüzeyde. Artık il/ilçe öncelikli;
 * koordinat yalnız il/ilçesi HENÜZ dolmamış eski kayıtlar için köprü
 * (backfill koşulana kadar) — o köprü bilerek test ediliyor ki temizlik
 * hevesiyle silinip konumlu ilanlar "belirtilmemiş"e düşmesin.
 */

function ilan(kismi: Partial<AdResponse>): AdResponse {
  return { latitude: null, longitude: null, ...kismi } as AdResponse
}

describe('getAdLocation', () => {
  it('il ve ilce doluysa "Ilce, Il" doner', () => {
    expect(
      getAdLocation(ilan({ city: 'Bursa', district: 'Nilüfer' })),
    ).toBe('Nilüfer, Bursa')
  })

  it('yalniz il doluysa il doner', () => {
    expect(getAdLocation(ilan({ city: 'Ankara' }))).toBe('Ankara')
  })

  it('il/ilce bos ama koordinat varsa koordinata DUSER (eski kayit koprusu)', () => {
    expect(
      getAdLocation(ilan({ latitude: 39.9334, longitude: 32.8597 })),
    ).toBe('39.9334, 32.8597')
  })

  it('bosluklu il/ilce degerleri bos sayilir', () => {
    expect(
      getAdLocation(
        ilan({ city: '  ', district: ' ', latitude: 40.195, longitude: 29.06 }),
      ),
    ).toBe('40.1950, 29.0600')
  })

  it('hicbir konum bilgisi yoksa "Konum belirtilmemis" doner', () => {
    expect(getAdLocation(ilan({}))).toBe('Konum belirtilmemiş')
  })
})
