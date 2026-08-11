# -*- coding: utf-8 -*-
"""
Pati — sayfa durum denetcisi.

Frontend'in her rotasini KODDAN olcup siniflandirir ve backend'de karsilik
gelen ucun var olup olmadigini soyler. Amac tek seferlik bir belge degil,
her gun yeniden kosulabilen bir duzenek: uc depo da gun icinde birkac kez
degisiyor, statik liste ertesi gun yanlis oluyor.

Kullanim:
    python sayfa-denetcisi.py <frontend-depo> <backend-depo> [--json cikti.json]

Bagimlilik yok (yalniz standart kutuphane) ve mutlak yol/gizli dosya
okumuyor -- boylece ileride depoya tasinabilir.
"""

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime

# --------------------------------------------------------------------------
# 1) Yorum ayiklama -- bu betigin en kritik parcasi.
#
# Duz grep "fetch(" arayinca /found/create'i "backend'e gidiyor" saniyor;
# oysa cagri /* BACKEND HAZIR OLUNCA */ blogunun icinde ve hic kosmuyor.
# Ters tuzak da var: "http://localhost:8080" metninde // gecer, naif bir
# satir-yorumu ayiklayici URL'i yok eder. Bu yuzden dizgi/sablon dizgi
# durumlarini da izleyen kucuk bir durum makinesi gerekiyor.
# --------------------------------------------------------------------------

def ayikla(kaynak):
    """Kaynagi (kod, yorum) ciftine ayirir. Ikisi de ayni uzunlukta degil;
    kod tarafinda yorumlar bosluga cevrilir ki satir numaralari kaymasin."""
    kod, yorum = [], []
    i, n = 0, len(kaynak)
    durum = "kod"          # kod | satir_yorum | blok_yorum | '  | "  | `
    while i < n:
        c = kaynak[i]
        iki = kaynak[i:i + 2]

        if durum == "kod":
            if iki == "//":
                durum = "satir_yorum"; yorum.append("//"); kod.append("  "); i += 2; continue
            if iki == "/*":
                durum = "blok_yorum"; yorum.append("/*"); kod.append("  "); i += 2; continue
            if c in "'\"`":
                durum = c
            kod.append(c); yorum.append(" " if c != "\n" else "\n"); i += 1; continue

        if durum == "satir_yorum":
            if c == "\n":
                durum = "kod"; kod.append("\n"); yorum.append("\n")
            else:
                kod.append(" "); yorum.append(c)
            i += 1; continue

        if durum == "blok_yorum":
            if iki == "*/":
                durum = "kod"; kod.append("  "); yorum.append("*/"); i += 2; continue
            kod.append(" " if c != "\n" else "\n"); yorum.append(c); i += 1; continue

        # dizgi icindeyiz: kacis dizisini atla, kapanisi bekle
        if c == "\\" and i + 1 < n:
            kod.append(kaynak[i:i + 2]); yorum.append("  "); i += 2; continue
        if c == durum:
            durum = "kod"
        kod.append(c); yorum.append(" " if c != "\n" else "\n"); i += 1

    return "".join(kod), "".join(yorum)


# --------------------------------------------------------------------------
# 2) Rota envanteri
# --------------------------------------------------------------------------

def rotalari_oku(app_tsx):
    kaynak = oku(app_tsx)
    kod, _ = ayikla(kaynak)

    ithal = dict(re.findall(r'import\s+(\w+)\s+from\s+"\./([^"]+)"', kod))

    rotalar = []
    for blok in re.findall(r"<Route\b(.*?)/>", kod, re.S):
        yol = re.search(r'path="([^"]*)"', blok)
        bilesen = re.search(r"component=\{(\w+)\}", blok)
        if not bilesen:
            continue
        rotalar.append({
            "rota": yol.group(1) if yol else "*",   # path'siz Route = yakalayici
            "bilesen": bilesen.group(1),
            "dosya": ithal.get(bilesen.group(1)),
        })
    return rotalar


# --------------------------------------------------------------------------
# 3) Sayfa siniflandirmasi
# --------------------------------------------------------------------------

URL_KALIBI = re.compile(r"""["'`]([^"'`]*?/(?:api|oauth2|analyze)[^"'`]*)["'`]""")
# sablon degiskeni ${API_BASE_URL} olan yollari da yakalayabilmek icin
# once ${...} ifadelerini temizleyecegiz.

def url_topla(metin):
    temiz = re.sub(r"\$\{[^}]*\}", "", metin)
    bulunan = set()
    for m in URL_KALIBI.finditer(temiz):
        y = m.group(1)
        y = re.sub(r"^https?://[^/]+", "", y)          # host'u at
        y = y.split("?")[0].rstrip("/")
        if y.startswith("/"):
            bulunan.add(y)
    return bulunan


def servis_uclari(src_dizin):
    """services/*.ts icindeki her disa acilan fonksiyonun cagirdigi uclar.

    Gerekli, cunku bir sayfa backend'e dogrudan degil servis katmani
    uzerinden gidebiliyor (LoginPage -> services/api.ts login()). Bunu
    izlemezsek sayfa "hicbir yere gitmiyor" gibi gorunur.
    """
    harita = {}
    dizin = os.path.join(src_dizin, "services")
    if not os.path.isdir(dizin):
        return harita
    for d in os.listdir(dizin):
        if not d.endswith((".ts", ".tsx")):
            continue
        kod, _ = ayikla(oku(os.path.join(dizin, d)))
        # fonksiyonu bir sonraki "export function" / dosya sonuna kadar al
        parcalar = re.split(r"(?=export\s+(?:async\s+)?function\s+\w+)", kod)
        for p in parcalar:
            ad = re.search(r"export\s+(?:async\s+)?function\s+(\w+)", p)
            if ad:
                harita[ad.group(1)] = url_topla(p)
    return harita


def sayfayi_incele(dosya_yolu, servisler=None):
    kaynak = oku(dosya_yolu)
    kod, yorum = ayikla(kaynak)

    kod_satir = [s for s in kod.splitlines() if s.strip()]

    fetch_kodda = len(re.findall(r"\bfetch\s*\(", kod))
    fetch_yorumda = len(re.findall(r"\bfetch\s*\(", yorum))
    sahte_bekleme = bool(re.search(r"setTimeout\s*\(\s*resolve", kod))

    url_kodda = url_topla(kod)
    url_yorumda = url_topla(yorum) - url_kodda

    # iskelet: govdesi tek bir <h1> olan bilesen
    iskelet = bool(re.search(r"return\s*<h1>[^<]*</h1>\s*\}?\s*$", kod.strip())) \
        or (len(kod_satir) <= 5 and "<h1>" in kod)

    # sahte veri: tepe seviyede nesne dizisi var, kodda fetch yok
    sahte_veri = bool(re.search(r"^const\s+\w+\s*(:[^=]+)?=\s*\[\s*\n\s*\{", kod, re.M))

    # kendi backend'imize giden cagri var mi (nominatim gibi dis servis sayilmaz)
    kendi_ucumuz = {u for u in url_kodda if u.startswith(("/api", "/oauth2"))}

    # servis katmani uzerinden gidilen uclari da say
    for ad in re.findall(r'import\s*\{([^}]*)\}\s*from\s*"\.\./services/', kod):
        for parca in ad.split(","):
            kendi_ucumuz |= (servisler or {}).get(parca.strip(), set())

    dis_servis = bool(re.search(r"nominatim|openstreetmap", kod))

    if iskelet:
        durum = "ISKELET"
    elif kendi_ucumuz:
        durum = "CALISIYOR"
    # TASLAK olcutu "hic fetch yok" DEGIL, "KENDI backend'imize giden cagri
    # yok ama yorumda/sahte beklemede niyet var". Ilk surumde fetch_kodda==0
    # araniyordu; iki taslak sayfa nominatim'i cagirdigi icin bu sart tutmadi
    # ve sayfalar DIS SERVIS'e dustu -- sinav bunu yakaladi.
    elif fetch_yorumda > 0 or sahte_bekleme:
        durum = "TASLAK"
    elif sahte_veri:
        durum = "SAHTE VERI"
    elif dis_servis:
        durum = "DIS SERVIS"
    else:
        durum = "STATIK"

    return {
        "satir": len(kaynak.splitlines()),
        "durum": durum,
        "fetch_kodda": fetch_kodda,
        "fetch_yorumda": fetch_yorumda,
        "sahte_bekleme": sahte_bekleme,
        "cagirdigi_uclar": sorted(kendi_ucumuz),
        "yorumda_bekledigi_uclar": sorted(u for u in url_yorumda if u.startswith(("/api", "/oauth2"))),
    }


# --------------------------------------------------------------------------
# 4) Backend uc envanteri
# --------------------------------------------------------------------------

def backend_uclari(backend_depo):
    kok = os.path.join(backend_depo, "src", "main", "java")
    uclar = []
    for dizin, _, dosyalar in os.walk(kok):
        for d in dosyalar:
            if not d.endswith("Controller.java"):
                continue
            kaynak = oku(os.path.join(dizin, d))
            kod, _ = ayikla(kaynak)
            taban = re.search(r'@RequestMapping\("([^"]+)"\)', kod)
            taban = taban.group(1) if taban else ""
            for eslesme in re.finditer(
                r"@(Get|Post|Put|Patch|Delete)Mapping(?:\(([^)]*)\))?", kod, re.S
            ):
                fiil = eslesme.group(1).upper()
                arg = eslesme.group(2) or ""
                yol = re.search(r'"([^"]*)"', arg)
                yol = yol.group(1) if yol and not yol.group(1).startswith("multipart") else ""
                uclar.append({"fiil": fiil, "yol": (taban + yol) or taban, "sinif": d})
    return uclar


def uc_var_mi(yol, uclar):
    """Frontend'in cagirdigi yolu backend sablonuyla esler ({id} <-> 123)."""
    for u in uclar:
        sablon = re.sub(r"\{[^}]+\}", r"[^/]+", u["yol"])
        if re.fullmatch(sablon, yol):
            return u
    return None


def ai_uclari(ai_depo):
    """AI servisinin FastAPI uclari."""
    yol = os.path.join(ai_depo, "app", "main.py")
    if not os.path.exists(yol):
        return []
    kod, _ = ayikla(oku(yol))
    return [
        {"fiil": m.group(1).upper(), "yol": m.group(2)}
        for m in re.finditer(r'@app\.(get|post|put|delete)\(\s*["\']([^"\']+)', kod)
    ]


# --------------------------------------------------------------------------
# 4b) Erisilemeyen sayfa dosyalari
#
# Bu projede ayni sayfanin UC kopyasi bulunabiliyor: depo kokunde dolu bir
# surum, client/src/pages altinda 3 satirlik iskelet, bir de acik bir PR'in
# icinde. Uygulamanin gercekten kosturdugu iskelet olan. Depoyu acan biri
# koktekini gorup "sayfa burada" saniyor -- bu daha once gerceklesti ve
# birinin emegi calismayan bir kopyaya gitti. Bu yuzden erisilemeyen dosyalar
# envanterin AYRI bir kalemi.
# --------------------------------------------------------------------------

def erisilemeyen_sayfalar(depo_kok, src_dizin, rotalar):
    rotali = {r["dosya"] for r in rotalar if r.get("dosya")}
    sonuc = []

    # (a) client/src/pages altinda olup hicbir rotaya baglanmayanlar
    pages = os.path.join(src_dizin, "pages")
    if os.path.isdir(pages):
        for d in sorted(os.listdir(pages)):
            if not d.endswith(".tsx"):
                continue
            ad = "pages/" + d[:-4]
            if ad not in rotali:
                sonuc.append({
                    "dosya": "client/src/pages/" + d,
                    "sebep": "rotaya bagli degil",
                    "satir": len(oku(os.path.join(pages, d)).splitlines()),
                })

    # (b) depo kokunde duran sayfa dosyalari -- uygulama client/ altindan
    #     kosuyor, kokteki .tsx dosyalari derlemeye hic girmiyor
    for d in sorted(os.listdir(depo_kok)):
        if not d.endswith(".tsx"):
            continue
        tam = os.path.join(depo_kok, d)
        if not os.path.isfile(tam):
            continue
        icerideki = os.path.join(pages, d)
        sonuc.append({
            "dosya": d,
            "sebep": "depo kokunde, uygulama client/ altindan kosuyor",
            "satir": len(oku(tam).splitlines()),
            "ayni_adli_ic_dosya": (
                len(oku(icerideki).splitlines()) if os.path.exists(icerideki) else None
            ),
        })

    return sonuc


def bilesenler(src_dizin):
    dizin = os.path.join(src_dizin, "components")
    if not os.path.isdir(dizin):
        return []
    return [
        {"dosya": d, "satir": len(oku(os.path.join(dizin, d)).splitlines())}
        for d in sorted(os.listdir(dizin)) if d.endswith(".tsx")
    ]


# --------------------------------------------------------------------------
# 5) Yardimcilar
# --------------------------------------------------------------------------

def oku(yol):
    with open(yol, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def git(depo, *args):
    try:
        return subprocess.run(["git", "-C", depo, *args], capture_output=True,
                              text=True, encoding="utf-8", errors="replace",
                              timeout=30).stdout.strip()
    except Exception:
        return "?"


def baglantilari_topla(src_dizin):
    """src/ icindeki tum href="/..." ve navigate("/...") hedefleri."""
    hedefler = {}
    for dizin, _, dosyalar in os.walk(src_dizin):
        for d in dosyalar:
            if not d.endswith((".tsx", ".ts")):
                continue
            p = os.path.join(dizin, d)
            kod, _ = ayikla(oku(p))
            for m in re.finditer(r'(?:href|to)="(/[^"]*)"|(?:navigate|setLocation)\(\s*"(/[^"]*)"', kod):
                hedef = (m.group(1) or m.group(2)).split("?")[0]
                hedefler.setdefault(hedef, set()).add(os.path.basename(p))
    return hedefler


def rota_eslesir_mi(hedef, rotalar):
    for r in rotalar:
        if r["rota"] == "*":
            continue
        sablon = re.sub(r":\w+", r"[^/]+", r["rota"])
        if re.fullmatch(sablon, hedef):
            return True
    return False


# --------------------------------------------------------------------------
# 6) Ana akis
# --------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(
        description="PatiMati sayfa durum denetcisi — haritayi koddan uretir."
    )
    ap.add_argument("frontend", help="PATIMATI-FRONTEND deposunun yolu")
    ap.add_argument("--backend", default=None,
                    help="PATIMATI-BACKEND yolu (istege bagli; verilirse "
                         "sayfanin cagirdigi ucun backend'de olup olmadigi da olculur)")
    ap.add_argument("--ai", default=None,
                    help="PATIMATI-AI yolu (istege bagli; AI servisinin uclari listelenir)")
    ap.add_argument("--json", default=None)
    ap.add_argument("--sinav", action="store_true",
                    help="elle dogrulanmis vakalarla betigin kendisini sina")
    a = ap.parse_args()

    src = os.path.join(a.frontend, "client", "src")
    app_tsx = os.path.join(src, "App.tsx")

    rotalar = rotalari_oku(app_tsx)
    uclar = backend_uclari(a.backend) if a.backend else []
    ai_ucları = ai_uclari(a.ai) if a.ai else []
    servisler = servis_uclari(src)

    # --- her rotayi incele -------------------------------------------------
    for r in rotalar:
        if not r["dosya"]:
            continue
        p = os.path.join(src, r["dosya"] + ".tsx")
        if not os.path.exists(p):
            r["not"] = "dosya bulunamadi"
            continue
        r.update(sayfayi_incele(p, servisler))
        eksik = []
        if uclar:
            for yol in r.get("yorumda_bekledigi_uclar", []) + r.get("cagirdigi_uclar", []):
                # /oauth2/** Spring Security'nin kendi urettigi ucu; controller
                # taramasinda gorunmez, "yok" saymak yanlis pozitif olur.
                if yol.startswith("/oauth2"):
                    continue
                if not uc_var_mi(yol, uclar):
                    eksik.append(yol)
        r["backendde_olmayan"] = eksik

    # --- rotasi olmayan baglantilar ---------------------------------------
    baglantilar = baglantilari_topla(src)
    kirik = {h: sorted(k) for h, k in baglantilar.items() if not rota_eslesir_mi(h, rotalar)}

    # --- erisilemeyen dosyalar ve bilesenler ------------------------------
    erisilemeyen = erisilemeyen_sayfalar(a.frontend, src, rotalar)
    bilesen_listesi = bilesenler(src)

    # --- hicbir yerden cagrilmayan backend uclari -------------------------
    #
    # DIKKAT: yalniz sayfalara bakmak YETMEZ. /api/auth/me ve /api/auth/logout
    # sayfalardan degil AuthContext uzerinden, servis katmani araciligiyla
    # cagriliyor. Ilk surumde yalniz rotalar taraniyordu ve bu ikisi "hic
    # cagrilmiyor" diye yanlis raporlandi -- oysa tarayici ag kaydinda
    # bizzat gorulmustu. Bu yuzden src/ altindaki TUM dosyalar taraniyor.
    cagrilan = set()
    for dizin, _, dosyalar in os.walk(src):
        for d in dosyalar:
            if d.endswith((".ts", ".tsx")):
                kod, yorum = ayikla(oku(os.path.join(dizin, d)))
                cagrilan |= url_topla(kod) | url_topla(yorum)
    cagrilmayan = [u for u in uclar if not any(
        re.fullmatch(re.sub(r"\{[^}]+\}", r"[^/]+", u["yol"]), c) for c in cagrilan
    )]

    # --- damga: hangi commit olculdu --------------------------------------
    damga = {
        "olcum_zamani": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "frontend_commit": git(a.frontend, "log", "-1", "--format=%h %s"),
        "frontend_dal": git(a.frontend, "rev-parse", "--abbrev-ref", "HEAD"),
        "backend_commit": git(a.backend, "log", "-1", "--format=%h %s"),
        "backend_dal": git(a.backend, "rev-parse", "--abbrev-ref", "HEAD"),
    }

    # --- ekrana bas --------------------------------------------------------
    print("=" * 78)
    print("PATI SAYFA DURUM HARITASI")
    for k, v in damga.items():
        print("  {:<18} {}".format(k, v))
    print("=" * 78)

    sira = {"CALISIYOR": 0, "TASLAK": 1, "ISKELET": 2, "SAHTE VERI": 3,
            "DIS SERVIS": 4, "STATIK": 5}
    print("\n{:<22} {:<13} {:>6}  {}".format("ROTA", "DURUM", "SATIR", "KANIT / UC"))
    print("-" * 78)
    for r in sorted(rotalar, key=lambda x: (sira.get(x.get("durum"), 9), x["rota"])):
        if "durum" not in r:
            print("{:<22} {:<13} {:>6}  {}".format(r["rota"], "?", "-", r.get("not", "")))
            continue
        kanit = []
        if r["cagirdigi_uclar"]:
            kanit.append("cagiriyor: " + ", ".join(r["cagirdigi_uclar"]))
        if r["yorumda_bekledigi_uclar"]:
            kanit.append("YORUMDA bekliyor: " + ", ".join(r["yorumda_bekledigi_uclar"]))
        if r["sahte_bekleme"]:
            kanit.append("sahte bekleme")
        if r["backendde_olmayan"]:
            kanit.append("!! BACKENDDE YOK: " + ", ".join(r["backendde_olmayan"]))
        print("{:<22} {:<13} {:>6}  {}".format(
            r["rota"], r["durum"], r["satir"], " | ".join(kanit) or "-"))

    print("\n" + "-" * 78)
    print("ROTASI OLMAYAN BAGLANTILAR ({} adet)".format(len(kirik)))
    for h, kaynaklar in sorted(kirik.items()):
        print("  {:<20} <- {}".format(h, ", ".join(kaynaklar)))

    print("\n" + "-" * 78)
    print("ERISILEMEYEN SAYFA DOSYALARI ({} adet)".format(len(erisilemeyen)))
    print("  (dosya var ama uygulamada acilamiyor -- ayni sayfanin baska bir")
    print("   kopyasi kosuyor olabilir; asagidaki 'ic' sutunu onu gosteriyor)")
    for e in erisilemeyen:
        ic = e.get("ayni_adli_ic_dosya")
        not_ = "  <-- client/src/pages'te ayni adli {} satirlik dosya KOSUYOR".format(ic) if ic else ""
        print("  {:<42} {:>4} satir  ({}){}".format(
            e["dosya"], e["satir"], e["sebep"], not_))

    if uclar:
        print("\n" + "-" * 78)
        print("HICBIR SAYFANIN CAGIRMADIGI BACKEND UCLARI ({}/{})".format(
            len(cagrilmayan), len(uclar)))
        for u in cagrilmayan:
            print("  {:<6} {}".format(u["fiil"], u["yol"]))

    if ai_ucları:
        print("\n" + "-" * 78)
        print("AI SERVISI UCLARI ({} adet)".format(len(ai_ucları)))
        for u in ai_ucları:
            print("  {:<6} {}".format(u["fiil"], u["yol"]))

    ozet = {}
    for r in rotalar:
        ozet[r.get("durum", "?")] = ozet.get(r.get("durum", "?"), 0) + 1
    print("\n" + "=" * 78)
    print("ENVANTER — taranmasi gereken toplam")
    print("=" * 78)
    print("  {:<44} {:>4}".format("App.tsx rotasi", len(rotalar)))
    print("  {:<44} {:>4}".format("  x oturum durumu (girisli / girissiz)", len(rotalar) * 2))
    print("  {:<44} {:>4}".format("erisilemeyen sayfa dosyasi", len(erisilemeyen)))
    print("  {:<44} {:>4}".format("rotasi olmayan baglanti", len(kirik)))
    print("  {:<44} {:>4}".format("backend ucu", len(uclar)))
    print("  {:<44} {:>4}".format("  bunlardan hic cagrilmayan", len(cagrilmayan)))
    print("  {:<44} {:>4}".format("AI servisi ucu", len(ai_ucları)))
    print("  {:<44} {:>4}".format("bilesen", len(bilesen_listesi)))
    print("\n  Rota durumlari: " + " | ".join(
        "{}={}".format(k, v) for k, v in sorted(ozet.items())))
    if not uclar:
        print("\n  ! backend yolu verilmedi -> uc esleşmesi ve cagrilmayan uc")
        print("    olcumu ATLANDI. --backend <yol> ile calistirin.")
    if not ai_ucları:
        print("  ! AI yolu verilmedi -> AI uclari ATLANDI. --ai <yol> ile calistirin.")

    sonuc = {"damga": damga, "rotalar": rotalar, "rotasiz_baglantilar": kirik,
             "backend_uclari": uclar, "cagrilmayan_backend_uclari": cagrilmayan,
             "ai_uclari": ai_ucları, "erisilemeyen_sayfalar": erisilemeyen,
             "bilesenler": bilesen_listesi, "ozet": ozet}

    if a.json:
        with open(a.json, "w", encoding="utf-8") as f:
            json.dump(sonuc, f, ensure_ascii=False, indent=2)
        print("JSON yazildi: {}".format(a.json))

    if a.sinav:
        return sinav(rotalar, kirik, uclar, erisilemeyen, cagrilmayan)
    return 0


# --------------------------------------------------------------------------
# 7) Denetcinin kendi sinavi
#
# Ders: "duzenegin kendisi de urundur." Gecen turda senaryo_testi.py'de dort
# gercek hata cikti. Bu yuzden betik, elle dogrulanmis vakalarla sinaniyor:
# tutmuyorsa duzeltilecek olan harita degil, BETIK.
# --------------------------------------------------------------------------

# Bu liste bir REGRESYON KORUMASI: her satir elle dogrulanmis bir gozlem.
# Tutmuyorsa once BETIK suphelidir. Ama davranis MESRU bicimde degistiyse
# (bir sayfa gercekten duzeltildiyse) beklenti BILEREK guncellenir ve
# degisiklik burada not edilir -- boylece "neden degisti" sorusu cevapsiz
# kalmaz.
BEKLENEN = [
    # Bu ucu sayfada gonderim kodu YORUM ICINDE duruyor, yerine sahte bir
    # bekleme konmus: form doldurulup gonderiliyor ama sifir istek cikiyor.
    # 🔜 Frontend PR #7 bunlari backend'e bagliyor; O PR BIRLESINCE bu iki
    #    satir "CALISIYOR" yapilmali. Beklentiyi, davranisi degistiren PR
    #    gunceller -- boylece degisiklik gozden kacmaz.
    ("/found/create",    "TASLAK"),
    ("/adoption/create", "TASLAK"),

    # Bu TASLAK kalici: bekledigi /api/ai-match ucu GERCEKTEN yok.
    ("/ai-match",       "TASLAK"),

    ("/listings",       "ISKELET"),     # govdesi tek <h1>
    ("/pet/:id",        "ISKELET"),
    ("/map",            "ISKELET"),
    ("/chat",           "ISKELET"),
    ("/add-listing",    "CALISIYOR"),   # tarayicida uctan uca dogrulanmisti
    ("/about",          "STATIK"),      # yanlis pozitif uretmemeli
    ("/adoption",       "SAHTE VERI"),
]


def sinav(rotalar, kirik, uclar, erisilemeyen, cagrilmayan):
    print("\n" + "=" * 78)
    print("DENETCININ KENDI SINAVI")
    print("=" * 78)
    harita = {r["rota"]: r.get("durum") for r in rotalar}
    gecti = kalan = 0

    for rota, beklenen in BEKLENEN:
        oldu = harita.get(rota)
        ok = (oldu == beklenen)
        gecti += ok; kalan += (not ok)
        print("  [{}] {:<20} beklenen={:<11} olcum={}".format(
            "OK" if ok else "HATA", rota, beklenen, oldu))

    # rotasiz baglanti: /notifications yakalanmali
    ok = "/notifications" in kirik
    gecti += ok; kalan += (not ok)
    print("  [{}] /notifications rotasiz baglanti olarak yakalandi".format("OK" if ok else "HATA"))

    # POST /api/ai-match backend'de OLMAMALI, digerleri OLMALI
    ok = uc_var_mi("/api/ai-match", uclar) is None
    gecti += ok; kalan += (not ok)
    print("  [{}] /api/ai-match backend'de yok (tek gercek eksik uc)".format("OK" if ok else "HATA"))

    for yol in ("/api/adoptions", "/api/public/ads", "/api/ads/nearby"):
        ok = uc_var_mi(yol, uclar) is not None
        gecti += ok; kalan += (not ok)
        print("  [{}] {} backend'de var".format("OK" if ok else "HATA", yol))

    # Erisilemeyen dosya tespiti: ayni sayfanin hem kokte dolu hem
    # client/src/pages'te iskelet halde durdugu yakalanmali.
    ikili = [e for e in erisilemeyen if e.get("ayni_adli_ic_dosya")]
    ok = len(ikili) >= 4
    gecti += ok; kalan += (not ok)
    print("  [{}] kokte dolu / icerde iskelet ciftleri yakalandi ({} adet)".format(
        "OK" if ok else "HATA", len(ikili)))

    # /api/auth/me AuthContext uzerinden cagriliyor; "hic cagrilmiyor"
    # listesine DUSMEMELI (ilk surumde dusuyordu).
    ok = not any(u["yol"] == "/api/auth/me" for u in cagrilmayan)
    gecti += ok; kalan += (not ok)
    print("  [{}] /api/auth/me cagriliyor sayiliyor (servis katmani izlendi)".format(
        "OK" if ok else "HATA"))

    print("\nSINAV: {} gecti, {} kaldi".format(gecti, kalan))
    if kalan:
        print("!! Betik yanlis olcuyor -- duzeltilecek olan harita degil, BETIK.")
    return 1 if kalan else 0


if __name__ == "__main__":
    sys.exit(main())
