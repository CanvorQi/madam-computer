# Madam Bilgisayar

Bilgisayar biliminin temellerini en basit hâliyle anlatan, etkileşimli devre araçlı web uygulaması (PWA). Madam Matematik ile aynı kabuğu kullanır.
Şu an **Bölüm 1: Mantık, Boole Cebiri ve Sayısal Devreler** (1.1–1.6, 20 ders) hazır; 4 çoktan seçmeli test ve 4 alıştırma seti (adım adım çözümlü) dahil.

Kurulum veya derleme adımı yoktur; saf HTML/CSS/JS'dir.

## Yerelde çalıştırma

```bash
python -m http.server 8000
# tarayıcıda: http://localhost:8000
```

(Service worker `file://` üzerinden çalışmaz; bir sunucuyla aç.)

## Dosya yapısı

| Dosya | Görevi |
|---|---|
| `index.html` | Uygulama kabuğu (sol menü, mobil üst/alt menü) |
| `css/style.css` | Tasarım (açık/koyu tema) + devre, doğruluk tablosu, K-haritası stilleri |
| `js/logic.js` | Boole motoru: ayrıştırıcı (`A'B + C`, `!p & q`, `p -> q`, `nand`…), doğruluk tablosu, Quine–McCluskey sadeleştirme, otomatik devre çizimi (SVG) |
| `js/widgets.js` | Derslerdeki araçlar: kapı oyun alanı, doğruluk tablosu, eşdeğerlik, devre, K-haritası, toplayıcılar, MUX/kod çözücü, flip-floplar, sayaç, ikili sayı |
| `js/cpu.js` | Mantık Lab'daki basit bilgisayar (SAP-1 benzeri 8 bitlik işlemci; kontrol birimi Boole ifadeleriyle) |
| `js/content/mantik.js` | Bölüm 1 ders içerikleri (+ `COURSE` listesi) |
| `js/content/mantik-testler.js` | Testler + alıştırmalar |
| `js/app.js` | Yönlendirme, sayfalar, ilerleme, Mantık Lab |
| `sw.js`, `manifest.json`, `icons/` | PWA |

## Yeni bölüm eklemek

1. `js/content/` altına `mantik.js` ile aynı yapıda yeni bir dosya ekle (`CHAPTERS.<id>`).
2. `index.html`'e `<script defer>` satırını, `sw.js` içindeki `APP_SHELL` listesine dosya yolunu ekle.
3. `COURSE.chapters` içinde ilgili bölüme `id` ver.
4. Dosyaları değiştirdikten sonra `sw.js` içindeki `CACHE_NAME` sürümünü artır.

İlerleme `madamcs_*` anahtarlarıyla, önbellek `madam-cs-*` adıyla saklanır; böylece Madam Matematik ile aynı alan adında (ör. GitHub Pages) yayınlansa da birbirine karışmaz.
