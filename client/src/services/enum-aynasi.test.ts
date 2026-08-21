import ts from 'typescript'
import { describe, expect, it } from 'vitest'

import ayna from './enum-aynasi.json'

// Kaynaklar `node:fs` ile DEGIL, Vite'in `?raw` ice aktarimiyla okunuyor.
// Sebep: `tsconfig.app.json`daki "types": ["vite/client"] listesi ayni zamanda
// UYGULAMA kodunun tip yuzeyi; oraya "node" eklemek, uygulama kodunun da
// `fs`e uzanabilmesi demekti. `?raw` ile o yuzey hic genislemiyor.
import ilanFormuKaynagi from '../pages/AddListingPage.tsx?raw'
import sahipFormuKaynagi from '../pages/AdoptionCreatePage.tsx?raw'
import paylasilanKaynak from './types.ts?raw'

/**
 * On yuz enum degerleri, arka yuzun TAAHHUT EDILEN aynasiyla tutuyor mu?
 *
 * <p><b>Olculen kusur:</b> 19.08 taramasinda 13 enum'un 6'sinda ayrisma
 * bulundu ve sonuclari kullaniciya somut yansiyordu — sahiplendirme ilaninda
 * yasli hayvan secilemiyor, backend'in tanimadigi desen degerleri
 * gonderiliyor, ilan 8'de tasma "YES" iken arayuz "bilinmiyor" gosteriyor.
 * Elle senkron tutmak basarisiz oldu ve basarisizlik HICBIR YERDE gorunmedi.
 *
 * <p><b>Neden bu bicim:</b> uc depo da private ⇒ bu CI arka yuz enum'larini
 * jetonsuz okuyamaz. Onun yerine arka yuzun urettigi ayna dosyasi buraya
 * KOPYALANIYOR; arka yuz CI'i o dosyanin bayatlamadigini denetliyor, bu test
 * de ön yüz tiplerinin kopyayla tuttugunu. Kayma artik tek dosyanin diff'inde
 * ve kirmizi CI'da gorunuyor.
 *
 * <p><b>Neden tipler METINDEN okunuyor:</b> `types.ts` enum'lari TypeScript
 * birlesim tipi olarak tutuyor (`"CAT" | "DOG"`), yani calisma aninda hicbir
 * degeri YOK — `import` edip karsilastirmak imkansiz. Duz regex de kirilgan
 * olurdu (bicimlendirme degisince sessizce 0 sonuc verir). Bu yuzden projenin
 * KENDI TypeScript derleyicisi cozumleyici olarak kullaniliyor.
 */

/**
 * Eslemenin `dosya` alani buradan cozulur. Yeni bir dosya eslemeye eklenip
 * buraya eklenmezse test SESSIZCE atlamaz — asagida ayri bir vaka kirmizi
 * yakar. "Olculmeyen sey olculmus sayilmasin."
 */
const KAYNAKLAR: Record<string, string> = {
  'src/services/types.ts': paylasilanKaynak,
  'src/pages/AddListingPage.tsx': ilanFormuKaynagi,
  'src/pages/AdoptionCreatePage.tsx': sahipFormuKaynagi,
}

type TamEslesme = {
  dosya: string
  tip?: string
  sabit?: string
  tur: 'tam' | 'altkume' | 'sozluk'
  haric?: string[]
}
type Aynalanmiyor = { aynalanmiyor: string }
type Kayit = TamEslesme[] | Aynalanmiyor

const enumlar = ayna.enumlar as Record<string, { degerler: string[] }>
const eslesme = ayna.eslesme as unknown as Record<string, Kayit>

const kaynakOnbellegi = new Map<string, ts.SourceFile>()

function kaynak(gorecelYol: string): ts.SourceFile {
  const onbellek = kaynakOnbellegi.get(gorecelYol)
  if (onbellek) return onbellek
  const metin = KAYNAKLAR[gorecelYol]
  if (metin === undefined) {
    throw new Error(
      `${gorecelYol} eşlemede geçiyor ama KAYNAKLAR listesinde yok — ` +
        `test onu okuyamaz. enum-aynasi.test.ts'e ?raw içe aktarımını ekle.`,
    )
  }
  const dosya = ts.createSourceFile(
    gorecelYol,
    metin,
    ts.ScriptTarget.Latest,
    true,
  )
  kaynakOnbellegi.set(gorecelYol, dosya)
  return dosya
}

/** `type X = "A" | "B"` -> ["A","B"]; tip yoksa null (bulunamadi ≠ bos). */
function birlesimDegerleri(gorecelYol: string, tip: string): string[] | null {
  let sonuc: string[] | null = null

  const gez = (dugum: ts.Node) => {
    if (ts.isTypeAliasDeclaration(dugum) && dugum.name.text === tip) {
      const dizgiler: string[] = []
      const topla = (t: ts.TypeNode) => {
        if (ts.isUnionTypeNode(t)) {
          t.types.forEach(topla)
        } else if (
          ts.isLiteralTypeNode(t) &&
          ts.isStringLiteral(t.literal)
        ) {
          dizgiler.push(t.literal.text)
        }
      }
      topla(dugum.type)
      sonuc = dizgiler
      return
    }
    ts.forEachChild(dugum, gez)
  }

  gez(kaynak(gorecelYol))
  return sonuc
}

/** `const X: Record<..> = { a: "A", b: "B" }` -> ["A","B"] */
function sozlukDegerleri(gorecelYol: string, sabit: string): string[] | null {
  let sonuc: string[] | null = null

  const gez = (dugum: ts.Node) => {
    if (
      ts.isVariableDeclaration(dugum) &&
      ts.isIdentifier(dugum.name) &&
      dugum.name.text === sabit &&
      dugum.initializer &&
      ts.isObjectLiteralExpression(dugum.initializer)
    ) {
      const dizgiler: string[] = []
      for (const alan of dugum.initializer.properties) {
        if (
          ts.isPropertyAssignment(alan) &&
          ts.isStringLiteral(alan.initializer)
        ) {
          dizgiler.push(alan.initializer.text)
        }
      }
      sonuc = dizgiler
      return
    }
    ts.forEachChild(dugum, gez)
  }

  gez(kaynak(gorecelYol))
  return sonuc
}

describe('enum aynası — ön yüz ↔ arka yüz', () => {
  it('ölçüm aleti çalışıyor: bilinen bir tip GERÇEKTEN okunabiliyor', () => {
    // Pozitif kontrol. Bu olmadan asagidaki butun ✓'ler, hicbir seyi
    // okuyamayan bir cozumleyiciden de gelebilirdi (0 sonuc supheDIR).
    expect(birlesimDegerleri('src/services/types.ts', 'AdType')).toEqual([
      'LOST',
      'FOUND',
      'ADOPTION',
    ])
    expect(
      sozlukDegerleri('src/pages/AdoptionCreatePage.tsx', 'CINSIYET_KARSILIGI'),
    ).toEqual(['UNKNOWN', 'FEMALE', 'MALE'])
    // Negatif kontrol: olmayan tip null vermeli, bos dizi DEGIL.
    expect(birlesimDegerleri('src/services/types.ts', 'BoyleBirTipYok')).toBeNull()
  })

  it('arka yüzdeki HER enum için bir karar yazılmış olmalı', () => {
    // StatusEnum vakasinin dersi: tip ADI iki tarafta farkli oldugu icin o
    // enum karsilastirmaya HIC girmemis ve ayrisma iki tur boyunca
    // gorunmemisti. Bu yuzden "eslesmesi yok" sessiz gecemez.
    const kararsiz = Object.keys(enumlar).filter((ad) => !(ad in eslesme))
    expect(kararsiz, 'eşlemesi hiç yazılmamış enum').toEqual([])
  })

  it('eşlemedeki her dosya bu testten okunabiliyor olmalı', () => {
    const okunamayan = Object.values(eslesme)
      .filter(Array.isArray)
      .flat()
      .map((k) => (k as TamEslesme).dosya)
      .filter((yol) => !(yol in KAYNAKLAR))
    expect(okunamayan, 'KAYNAKLAR listesine eklenmemiş dosya').toEqual([])
  })

  it('eşleme bloğunda arka yüzde OLMAYAN enum kalmamalı', () => {
    // Ters yon: backend bir enum'u silerse eslesme satiri oksuz kalir ve
    // bekci sessizce hicbir sey olcmez.
    const oksuz = Object.keys(eslesme).filter((ad) => !(ad in enumlar))
    expect(oksuz, 'arka yüzde karşılığı olmayan eşleme').toEqual([])
  })

  it('aynalanmayan enum için gerekçe yazılmış olmalı', () => {
    const gerekcesiz = Object.entries(eslesme)
      .filter(([, k]) => !Array.isArray(k))
      .filter(([, k]) => {
        const sebep = (k as Aynalanmiyor).aynalanmiyor
        return typeof sebep !== 'string' || sebep.trim().length < 20
      })
      .map(([ad]) => ad)
    expect(gerekcesiz, 'gerekçesiz "aynalanmıyor"').toEqual([])
  })

  const karsilastirmali = Object.entries(eslesme).filter(([, k]) =>
    Array.isArray(k),
  ) as [string, TamEslesme[]][]

  it.each(karsilastirmali.flatMap(([enumAdi, kayitlar]) =>
    kayitlar.map((kayit) => ({
      enumAdi,
      kayit,
      baslik: `${enumAdi} ↔ ${kayit.dosya}:${kayit.tip ?? kayit.sabit}`,
    })),
  ))('$baslik', ({ enumAdi, kayit }) => {
    const arkaYuz = enumlar[enumAdi].degerler

    const onYuz =
      kayit.tur === 'sozluk'
        ? sozlukDegerleri(kayit.dosya, kayit.sabit!)
        : birlesimDegerleri(kayit.dosya, kayit.tip!)

    expect(
      onYuz,
      `${kayit.dosya} içinde ${kayit.tip ?? kayit.sabit} bulunamadı — ` +
        `taşınmış ya da yeniden adlandırılmış olabilir; eşleme güncellenmeli.`,
    ).not.toBeNull()

    const beklenen =
      kayit.tur === 'altkume'
        ? arkaYuz.filter((d) => !(kayit.haric ?? []).includes(d))
        : arkaYuz

    // Küme karşılaştırması: sıra sözleşmenin parçası değil, ama EKLENEN,
    // SİLİNEN ve YENİDEN ADLANDIRILAN değerin üçü de burada kırmızı yanar.
    expect([...onYuz!].sort()).toEqual([...beklenen].sort())
  })
})
