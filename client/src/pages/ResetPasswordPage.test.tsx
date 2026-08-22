import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../services/api'

/**
 * /reset-password sayfası (sahipsiz "şifremi unuttum" maddesinin FE yarısı).
 *
 * <p>Sayfa bugüne dek hiç yoktu: e-postadaki bağlantının açacağı yer buydu.
 * Testler üç şeyi ölçer: token adresten okunup İSTEĞE değişmeden giriyor,
 * istemci doğrulaması sunucuya çöp istek göndermiyor (kurallar
 * ChangePassword/Register ile aynı) ve sunucunun anlamlı hata metni
 * kullanıcıya ulaşıyor.
 */

const { sifirla } = vi.hoisted(() => ({ sifirla: vi.fn() }))

vi.mock('../services/auth', () => ({
  resetPassword: sifirla,
}))

vi.mock('wouter', () => ({
  Link: ({ children }: { children?: React.ReactNode }) => <a>{children}</a>,
}))

import ResetPasswordPage from './ResetPasswordPage'

function adresiKur(search: string) {
  window.history.replaceState({}, '', `/reset-password${search}`)
}

function doldurVeGonder(yeni: string, tekrar: string) {
  fireEvent.change(screen.getByLabelText('Yeni şifre'), {
    target: { value: yeni },
  })
  fireEvent.change(screen.getByLabelText('Yeni şifre (tekrar)'), {
    target: { value: tekrar },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Şifreyi güncelle' }))
}

beforeEach(() => {
  sifirla.mockReset()
})

describe('ResetPasswordPage', () => {
  it('token yoksa form yerine "Bağlantı eksik" ekranı çıkar', () => {
    adresiKur('')

    render(<ResetPasswordPage />)

    expect(screen.getByText('Bağlantı eksik')).toBeInTheDocument()
    expect(screen.queryByLabelText('Yeni şifre')).not.toBeInTheDocument()
  })

  it('şifreler eşleşmezse istek GİTMEZ ve hata gösterilir', () => {
    adresiKur('?token=abc123')

    render(<ResetPasswordPage />)
    doldurVeGonder('YeniSifre1', 'BaskaSifre1')

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Yeni şifreler birbiriyle eşleşmiyor.',
    )
    expect(sifirla).not.toHaveBeenCalled()
  })

  it('politikaya uymayan şifrede istek GİTMEZ (küçük harf + rakam ama büyük harf yok)', () => {
    adresiKur('?token=abc123')

    render(<ResetPasswordPage />)
    doldurVeGonder('yenisifre1', 'yenisifre1')

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Yeni şifre en az bir büyük harf içermelidir.',
    )
    expect(sifirla).not.toHaveBeenCalled()
  })

  it('geçerli formda token adresten okunup istekle gider, başarı ekranı çıkar', async () => {
    adresiKur('?token=abc123')
    sifirla.mockResolvedValue({ message: 'tamam' })

    render(<ResetPasswordPage />)
    doldurVeGonder('YeniSifre1', 'YeniSifre1')

    await waitFor(() =>
      expect(screen.getByText('Şifren güncellendi')).toBeInTheDocument(),
    )
    expect(sifirla).toHaveBeenCalledWith({
      token: 'abc123',
      newPassword: 'YeniSifre1',
    })
  })

  it('sunucunun anlamlı hata metni (ör. süresi dolmuş bağlantı) kullanıcıya ulaşır', async () => {
    adresiKur('?token=bayat')
    const mesaj =
      'Bu şifre sıfırlama bağlantısının süresi dolmuş. Lütfen yeni bir bağlantı talep edin.'
    sifirla.mockRejectedValue(new ApiError(mesaj, 400, { message: mesaj }))

    render(<ResetPasswordPage />)
    doldurVeGonder('YeniSifre1', 'YeniSifre1')

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(mesaj),
    )
    expect(screen.queryByText('Şifren güncellendi')).not.toBeInTheDocument()
  })
})
