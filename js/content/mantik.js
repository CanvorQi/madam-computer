/*
 * Bölüm 1 - Mantık, Boole Cebiri ve Sayısal Devreler
 * Önermeler ve doğruluk tabloları, mantık kapıları, Boole cebiri, De Morgan,
 * Karnaugh haritaları, toplayıcılar, flip-floplar ve temel devreler.
 */
(function (global) {
    "use strict";

    const R = String.raw;

    const p = (html) => ({ t: "p", html });
    const simple = (html) => ({ t: "simple", html });
    const def = (title, html) => ({ t: "def", title, html });
    const formula = (title, html) => ({ t: "formula", title, html });
    const tip = (html, title) => ({ t: "tip", html, title });
    const warn = (html, title) => ({ t: "warn", html, title });
    const ex = (q, steps, answer) => ({ t: "example", q, steps, answer });
    const quiz = (q, options, correct, why) => ({ t: "quiz", q, options, correct, why });
    const widget = (name, title, desc, opts) => ({ t: "widget", name, title, desc, opts: opts || {} });
    const table = (html) => ({ t: "table", html });

    // Doğruluk tablosu: vars = ["p","q"], cols = [[KaTeX başlık, Logic ifadesi], ...]; son sütun sonuçtur
    function tt(vars, cols) {
        const asts = cols.map((c) => Logic.parse(c[1]));
        let h = `<table class="mtable tt"><thead><tr>${vars.map((v) => `<th class="tt-var">$${v}$</th>`).join("")}${cols.map((c, i) => `<th${i === cols.length - 1 ? ' class="tt-out"' : ""}>$${c[0]}$</th>`).join("")}</tr></thead><tbody>`;
        for (let i = 0; i < 1 << vars.length; i++) {
            const env = Logic.envOf(vars, i);
            h += `<tr>${vars.map((v) => `<td class="tt-var">${env[v]}</td>`).join("")}${asts.map((a, j) => {
                const v = Logic.evaluate(a, env);
                return `<td class="${j === asts.length - 1 ? "tt-out " : ""}${v ? "one" : "zero"}">${v}</td>`;
            }).join("")}</tr>`;
        }
        return h + `</tbody></table>`;
    }

    const sections = [
        /* =========================== 1.1 =========================== */
        {
            no: "1.1", title: "Önermeler ve Doğruluk Tabloları",
            lessons: [
                {
                    id: "onerme", title: "Önerme ve Mantık Bağlaçları",
                    summary: "Doğru ya da yanlış olan cümleler; değil, ve, veya.",
                    blocks: [
                        simple(R`Bilgisayar her şeyi iki değerle düşünür: <b>doğru</b> ya da <b>yanlış</b>, yani <b>1</b> ya da <b>0</b>. Mantık, bu iki değerle nasıl “hesap” yapılacağını anlatır. “Yağmur yağıyor” bir <b>önerme</b>dir: ya doğrudur ya yanlış. “Kapıyı kapat!” ise önerme değildir; doğru ya da yanlış olamaz.`),
                        def("Önerme", R`Doğru ya da yanlış olduğu kesin olarak söylenebilen bildirme cümlesine <b>önerme</b> denir. Önermeler genellikle $p, q, r, \ldots$ harfleriyle gösterilir.
                            <ul>
                                <li>Önerme doğruysa <b>doğruluk değeri</b> $1$ (D), yanlışsa $0$ (Y) olur.</li>
                                <li>“$7$ bir asal sayıdır” → önerme, değeri $1$.</li>
                                <li>“$2 + 2 = 5$” → önerme, değeri $0$.</li>
                                <li>“Saat kaç?”, “$x + 1 = 3$” → önerme <b>değil</b> (soru; $x$ bilinmeden doğruluğu belli değil).</li>
                            </ul>`),
                        def(R`Değil (olumsuzlama), $\lnot p$`, R`$p$ önermesinin <b>değili</b> $\lnot p$ (ya da $p'$, $\overline{p}$) ile gösterilir; $p$ doğruysa $\lnot p$ yanlış, $p$ yanlışsa $\lnot p$ doğrudur.
                            <br>$p$: “Hava soğuk.” → $\lnot p$: “Hava soğuk <b>değil</b>.”`),
                        def(R`Ve ($\land$), veya ($\lor$)`, R`<ul>
                            <li>$p \land q$ (“$p$ <b>ve</b> $q$”): yalnızca <b>ikisi de doğruysa</b> doğrudur.</li>
                            <li>$p \lor q$ (“$p$ <b>veya</b> $q$”): <b>en az biri</b> doğruysa doğrudur. (İkisi de doğruysa da doğrudur!)</li>
                        </ul>`),
                        table(tt(["p", "q"], [[R`\lnot p`, "!p"], [R`p \land q`, "p & q"], [R`p \lor q`, "p | q"]]).replace(/tt-out ?/g, "")),
                        tip(R`Tabloyu ezberlemek yerine şöyle düşün: <b>VE</b> titiz bir bekçidir, herkes “1” demeden kapıyı açmaz. <b>VEYA</b> rahat bir bekçidir, bir kişinin “1” demesi yeter.`),
                        widget("truthTable", "Bağlaçları dene", "Bir bağlaç seç ya da kutuya kendi ifadeni yaz (! değil, &amp; ve, | veya). 1 çıkan satırlar yeşil boyanır.", {
                            expr: "p & q", logic: true, steps: false,
                            presets: [{ label: "p ∧ q", expr: "p & q" }, { label: "p ∨ q", expr: "p | q" }, { label: "¬p", expr: "!p" }, { label: "¬p ∨ q", expr: "!p | q" }],
                        }),
                        ex(R`$p$: “$3 > 1$”, $q$: “$5$ çift sayıdır”. $p \land q$, $p \lor q$ ve $\lnot q$ önermelerinin doğruluk değerlerini bulunuz.`, [
                            R`$p$ doğru ($1$), $q$ yanlış ($0$).`,
                            R`$p \land q = 1 \land 0 = 0$ (ikisi birden doğru değil).`,
                            R`$p \lor q = 1 \lor 0 = 1$ (biri doğru, yeter).`,
                            R`$\lnot q = \lnot 0 = 1$.`,
                        ], R`$p \land q = 0$, $p \lor q = 1$, $\lnot q = 1$.`),
                        quiz("Aşağıdakilerden hangisi bir önermedir?", ["“İstanbul Türkiye'nin başkentidir.”", "“Pencereyi aç.”", "“Bugün hava nasıl?”", R`“$x + 2 = 7$”`], 0, R`Yanlış bile olsa doğruluk değeri kesin olan bir bildirme cümlesidir (değeri $0$). Diğerleri emir, soru ve $x$'e bağlı açık önermedir.`),
                        quiz(R`$p = 0$ ve $q = 1$ ise $p \lor \lnot q$ kaçtır?`, ["0", "1", "Belirsiz", "Önerme değildir"], 0, R`$\lnot q = 0$, $0 \lor 0 = 0$.`),
                    ],
                },
                {
                    id: "kosullu", title: "Koşullu, İki Yönlü Koşullu ve Özel Veya",
                    summary: "p → q, p ↔ q ve p ⊕ q bağlaçları.",
                    blocks: [
                        simple(R`“Sınavdan 100 alırsan sana bisiklet alacağım.” Bu söz ne zaman <b>yalan</b> olur? Yalnızca sen 100 aldığın hâlde bisiklet alınmazsa! 100 alamadıysan, bisiklet alınsa da alınmasa da söz bozulmamıştır. Koşullu önermenin bütün mantığı budur.`),
                        def(R`Koşullu önerme (ise), $p \rightarrow q$`, R`“$p$ ise $q$” önermesi $p \rightarrow q$ ile gösterilir. $p$'ye <b>hipotez</b> (öncül), $q$'ya <b>hüküm</b> (sonuç) denir.
                            <br>$p \rightarrow q$ <b>yalnızca</b> $p = 1$ ve $q = 0$ iken yanlıştır; diğer bütün durumlarda doğrudur.`),
                        def(R`İki yönlü koşullu (ancak ve ancak), $p \leftrightarrow q$`, R`“$p$ ancak ve ancak $q$” önermesi $p \leftrightarrow q$ ile gösterilir; $p$ ile $q$ <b>aynı</b> değeri aldığında doğrudur.
                            $$p \leftrightarrow q \equiv (p \rightarrow q) \land (q \rightarrow p)$$`),
                        def(R`Özel veya (XOR), $p \oplus q$`, R`“Ya $p$ ya $q$ (ama ikisi birden değil)”. $p$ ile $q$ <b>farklı</b> olduğunda doğrudur. Bu yüzden $p \oplus q$, $p \leftrightarrow q$'nun tam tersidir: $p \oplus q \equiv \lnot(p \leftrightarrow q)$.`),
                        table(tt(["p", "q"], [[R`p \rightarrow q`, "p -> q"], [R`p \leftrightarrow q`, "p <-> q"], [R`p \oplus q`, "p ^ q"]]).replace(/tt-out ?/g, "")),
                        formula("Koşullunun eşdeğerleri", R`$$p \rightarrow q \;\equiv\; \lnot p \lor q \;\equiv\; \lnot q \rightarrow \lnot p$$
                            <ul>
                                <li>$\lnot q \rightarrow \lnot p$: <b>karşıt ters</b> (contrapositive) — her zaman $p \rightarrow q$ ile aynıdır.</li>
                                <li>$q \rightarrow p$: <b>karşıt</b> (converse) — genelde $p \rightarrow q$ ile aynı <b>değildir</b>.</li>
                                <li>$\lnot p \rightarrow \lnot q$: <b>ters</b> (inverse) — o da genelde aynı değildir.</li>
                            </ul>`),
                        widget("equiv", "Hangi önermeler denk?", "İki önermenin her satırda aynı değeri verip vermediğine bak. Kendi önermelerini de yazabilirsin (-> ise, <-> ancak ve ancak).", {
                            logic: true,
                            pairs: [
                                { label: "p→q ile ¬p∨q", a: "p -> q", b: "!p | q" },
                                { label: "Karşıt ters", a: "p -> q", b: "!q -> !p" },
                                { label: "Karşıt (tuzak!)", a: "p -> q", b: "q -> p" },
                                { label: "p↔q", a: "p <-> q", b: "(p -> q) & (q -> p)" },
                                { label: "XOR", a: "p ^ q", b: "!(p <-> q)" },
                            ],
                        }),
                        warn(R`Günlük dilde “ise” çoğu zaman bir neden-sonuç ilişkisi taşır. Mantıkta öyle değildir: “$2 + 2 = 5$ ise Ay peynirdendir” önermesi <b>doğrudur</b>, çünkü hipotez yanlıştır. Yanlış bir hipotezden her şey çıkar!`),
                        ex(R`$p$: “Yağmur yağıyor”, $q$: “Yerler ıslak”. $p \rightarrow q$ önermesinin karşıtını ve karşıt tersini yazınız.`, [
                            R`$p \rightarrow q$: “Yağmur yağıyorsa yerler ıslaktır.”`,
                            R`Karşıt $q \rightarrow p$: “Yerler ıslaksa yağmur yağıyordur.” (Yanlış olabilir: yerleri biri yıkamış olabilir.)`,
                            R`Karşıt ters $\lnot q \rightarrow \lnot p$: “Yerler ıslak değilse yağmur yağmıyordur.” (Asıl önermeyle aynı anlam.)`,
                        ], R`Karşıt: “Yerler ıslaksa yağmur yağıyordur.” Karşıt ters: “Yerler ıslak değilse yağmur yağmıyordur.”`),
                        quiz(R`$p \rightarrow q$ önermesi hangi durumda yanlıştır?`, [R`$p = 1,\ q = 0$`, R`$p = 0,\ q = 1$`, R`$p = 0,\ q = 0$`, R`$p = 1,\ q = 1$`], 0, R`Söz verilmiş (hipotez doğru) ama yerine getirilmemiş (hüküm yanlış).`),
                        quiz(R`$p \rightarrow q$ ile her zaman denk olan hangisidir?`, [R`$\lnot q \rightarrow \lnot p$`, R`$q \rightarrow p$`, R`$\lnot p \rightarrow \lnot q$`, R`$p \land q$`], 0, R`Karşıt ters (contrapositive) her zaman denktir; karşıt ve ters değildir.`),
                    ],
                },
                {
                    id: "dogruluk-tablosu", title: "Doğruluk Tablosu Kurmak; Totoloji ve Çelişki",
                    summary: "n değişken → 2ⁿ satır; ara sütunlarla adım adım.",
                    blocks: [
                        simple(R`Doğruluk tablosu, bir ifadenin <b>bütün olası durumlarını</b> tek tek denemektir. Her değişken 0 ya da 1 olabildiğinden, 2 değişkende $2 \cdot 2 = 4$, 3 değişkende $2 \cdot 2 \cdot 2 = 8$ durum vardır. Karmaşık ifadeyi küçük parçalara böl, her parçaya bir sütun aç, soldan sağa doldur.`),
                        formula("Satır sayısı", R`$n$ tane değişken varsa doğruluk tablosunda $$2^n$$ satır bulunur. Satırları $0$'dan $2^n - 1$'e kadar <b>ikili sayma</b> sırasıyla yazmak hiçbir durumu kaçırmamayı garantiler: $000, 001, 010, 011, 100, \ldots$`),
                        def("Totoloji, çelişki, olumsal", R`<ul>
                            <li><b>Totoloji:</b> her satırda doğru ($1$) olan önerme. Örnek: $p \lor \lnot p$.</li>
                            <li><b>Çelişki:</b> her satırda yanlış ($0$) olan önerme. Örnek: $p \land \lnot p$.</li>
                            <li><b>Olumsal:</b> bazı satırlarda doğru, bazılarında yanlış olan önerme.</li>
                        </ul>
                        İki önerme her satırda aynı değeri alıyorsa <b>denktir</b> ($\equiv$). $A \equiv B$ demek, $A \leftrightarrow B$'nin bir totoloji olması demektir.`),
                        ex(R`$(p \rightarrow q) \land p \rightarrow q$ önermesinin doğruluk tablosunu kurunuz. Bu önerme nedir?`, [
                            R`2 değişken → $2^2 = 4$ satır.`,
                            R`Ara sütunlar: önce $p \rightarrow q$, sonra $(p \rightarrow q) \land p$, en son tamamı.
                            <div class="table-wrap">${tt(["p", "q"], [[R`p \rightarrow q`, "p -> q"], [R`(p \rightarrow q) \land p`, "(p -> q) & p"], [R`\ldots \rightarrow q`, "(p -> q) & p -> q"]])}</div>`,
                            R`Son sütunun hepsi $1$.`,
                        ], R`Totolojidir. Bu, “modus ponens” denen akıl yürütme kuralıdır: “$p$ ise $q$” doğruysa ve $p$ doğruysa, $q$ da doğrudur.`),
                        widget("truthTable", "Doğruluk tablosu kurucu", "Bir ifade yaz; araç her alt ifade için bir sütun açar ve sonucun totoloji, çelişki ya da olumsal olduğunu söyler.", {
                            expr: "(p -> q) & p -> q", logic: true,
                            presets: [
                                { label: "Modus ponens", expr: "(p -> q) & p -> q" },
                                { label: "p ∨ ¬p", expr: "p | !p" },
                                { label: "p ∧ ¬p", expr: "p & !p" },
                                { label: "3 değişken", expr: "(p | q) & !r" },
                                { label: "Zincir kuralı", expr: "(p -> q) & (q -> r) -> (p -> r)" },
                            ],
                        }),
                        tip(R`Totoloji olup olmadığını anlamak için bazen tüm tabloyu kurmana gerek yoktur: önermeyi <b>yanlış</b> yapan bir satır aramak yeter. $\ldots \rightarrow q$ yanlış olsun diye $q = 0$ ve sol tarafın $1$ olması gerekir; $(p \rightarrow q) \land p = 1$ ise $p = 1$ ve $p \rightarrow q = 1$, bu da $q = 1$ demektir. Çelişki! Demek ki yanlış satır yok.`, "Kısa yol"),
                        quiz(R`$p, q, r, s$ değişkenlerini içeren bir önermenin doğruluk tablosu kaç satırdır?`, ["16", "8", "4", "32"], 0, R`$2^4 = 16$.`),
                        quiz(R`$p \land \lnot p$ önermesi için hangisi doğrudur?`, ["Çelişkidir", "Totolojidir", "Olumsaldır", "p = 1 iken doğrudur"], 0, R`Bir şey hem doğru hem yanlış olamaz; her satırda $0$.`),
                    ],
                },
            ],
        },

        /* =========================== 1.2 =========================== */
        {
            no: "1.2", title: "Mantık Kapıları",
            lessons: [
                {
                    id: "bitler", title: "Bit, İkili Sayılar ve Elektrik",
                    summary: "Neden 0 ve 1? İkili sayı sistemi.",
                    blocks: [
                        simple(R`Bir bilgisayarın içinde milyarlarca minicik <b>anahtar</b> (transistör) vardır. Bir anahtar ya açıktır ya kapalı: elektrik ya geçer ya geçmez. Biz geçen akıma <b>1</b>, geçmeyene <b>0</b> deriz. Bu tek 0/1 bilgisine <b>bit</b> denir. Fotoğraflar, müzikler, bu yazı… hepsi sonunda bit dizileridir.`),
                        def("Bit ve bayt", R`<ul>
                            <li><b>Bit</b> (binary digit): $0$ ya da $1$ değerini alan en küçük bilgi birimi.</li>
                            <li><b>Bayt</b>: $8$ bit. Bir bayt $2^8 = 256$ farklı değer alabilir ($0$–$255$).</li>
                            <li>$n$ bit ile $2^n$ farklı durum gösterilebilir.</li>
                        </ul>`),
                        def("İkili (taban 2) sayılar", R`Onluk sistemde basamaklar $1, 10, 100, \ldots$ değerindedir; ikili sistemde ise $1, 2, 4, 8, 16, \ldots$:
                            $$(1101)_2 = 1\cdot 8 + 1\cdot 4 + 0\cdot 2 + 1\cdot 1 = 13$$
                            En sağdaki bit en az değerli bit (LSB), en soldaki en değerli bit (MSB) olarak adlandırılır.`),
                        widget("binary", "Bitlere dokun", "Her kutu bir bit. Üstteki sayı o bitin değeri. 1 olan bitlerin değerleri toplanır.", { bits: 8, value: 13 }),
                        ex(R`$25$ sayısını ikili sisteme çeviriniz.`, [
                            R`Sürekli 2'ye böl, kalanları yaz: $25 = 2\cdot12 + \mathbf{1}$, $12 = 2\cdot6 + \mathbf{0}$, $6 = 2\cdot3 + \mathbf{0}$, $3 = 2\cdot1 + \mathbf{1}$, $1 = 2\cdot0 + \mathbf{1}$.`,
                            R`Kalanları <b>aşağıdan yukarıya</b> oku: $11001$.`,
                            R`Kontrol: $16 + 8 + 1 = 25$ ✓`,
                        ], R`$25 = (11001)_2$`),
                        tip(R`Mantıktaki <b>doğru/yanlış</b>, elektronikteki <b>yüksek/alçak gerilim</b> ve sayılardaki <b>1/0</b> aslında aynı şeydir. Bu yüzden önermelerle yaptığımız hesapları, elektrikle çalışan devrelere birebir yaptırabiliriz. Bunu yapan parçalara <b>mantık kapısı</b> denir.`),
                        quiz(R`$(10110)_2$ onluk sistemde kaçtır?`, ["22", "26", "11", "20"], 0, R`$16 + 4 + 2 = 22$.`),
                        quiz("4 bit ile kaç farklı değer gösterilebilir?", ["16", "8", "4", "15"], 0, R`$2^4 = 16$ (0'dan 15'e).`),
                    ],
                },
                {
                    id: "temel-kapilar", title: "AND, OR ve NOT Kapıları",
                    summary: "Bilgisayarın üç temel yapı taşı.",
                    blocks: [
                        simple(R`Mantık kapısı, girişlerine 0/1 alan ve bir kurala göre 0/1 üreten küçük bir devredir. Bir odadaki lambayı düşün: iki anahtar <b>seri</b> bağlıysa lamba ancak ikisi de açıkken yanar (<b>AND</b>); <b>paralel</b> bağlıysa biri açıkken bile yanar (<b>OR</b>). <b>NOT</b> ise tersine çeviren bir düğmedir.`),
                        def("Üç temel kapı", R`Boole cebirinde VE çarpma gibi, VEYA toplama gibi yazılır:
                            <ul>
                                <li><b>AND (VE):</b> $Y = A \cdot B$ (ya da $AB$) — iki giriş de $1$ ise $1$.</li>
                                <li><b>OR (VEYA):</b> $Y = A + B$ — en az bir giriş $1$ ise $1$.</li>
                                <li><b>NOT (DEĞİL):</b> $Y = \overline{A}$ (ya da $A'$) — girişin tersi.</li>
                            </ul>`),
                        table(tt(["A", "B"], [[R`A \cdot B`, "A&B"], [R`A + B`, "A|B"], [R`\overline{A}`, "!A"]]).replace(/tt-out ?/g, "")),
                        widget("gate", "Kapı oyun alanı", "Bir kapı seç, girişlere dokun. Yeşil teller 1, gri teller 0 taşır; sağdaki tabloda o anki satır sarı yanar.", { gates: ["and", "or", "not"] }),
                        warn(R`Burada $+$ “toplama” değil <b>VEYA</b> demektir: $1 + 1 = 1$! Çünkü “en az biri 1 mi?” sorusunun cevabı evettir. Sayı toplamayı ilerideki derslerde <b>toplayıcı</b> devresiyle yapacağız.`),
                        tip(R`AND ve OR kapılarının ikiden fazla girişi olabilir. 3 girişli AND, $A \cdot B \cdot C$ demektir: üçü de 1 ise 1. 3 girişli OR ise girişlerden biri 1 olunca 1 verir.`),
                        ex(R`$A = 1$, $B = 0$, $C = 1$ için $Y = A \cdot \overline{B} + \overline{C}$ değerini bulunuz.`, [
                            R`Önce DEĞİL'ler: $\overline{B} = 1$, $\overline{C} = 0$.`,
                            R`Sonra VE: $A \cdot \overline{B} = 1 \cdot 1 = 1$.`,
                            R`En son VEYA: $1 + 0 = 1$.`,
                        ], R`$Y = 1$. İşlem önceliği: <b>DEĞİL → VE → VEYA</b> (aritmetikteki gibi önce çarpma, sonra toplama).`),
                        quiz(R`3 girişli bir AND kapısının çıkışı kaç farklı giriş durumunda $1$ olur?`, ["1", "3", "7", "8"], 0, R`Yalnızca $A = B = C = 1$ iken (8 durumdan 1'i).`),
                        quiz(R`Boole cebirinde $1 + 1$ kaçtır?`, ["1", "2", "0", "10"], 0, R`$+$ burada VEYA'dır: en az biri 1 → 1.`),
                    ],
                },
                {
                    id: "diger-kapilar", title: "XOR, XNOR, NAND ve NOR",
                    summary: "Türetilmiş kapılar ve sembolleri.",
                    blocks: [
                        simple(R`Temel kapılara bir NOT eklersek yeni kapılar elde ederiz: <b>NAND</b> = AND + NOT, <b>NOR</b> = OR + NOT. Sembolde bu tersleme, çıkıştaki küçük <b>yuvarlak</b> (balon) ile gösterilir. <b>XOR</b> ise “farklılık dedektörüdür”: girişler farklıysa 1 verir.`),
                        def("Türetilmiş kapılar", R`<ul>
                            <li><b>NAND:</b> $Y = \overline{A \cdot B}$ — iki giriş de $1$ ise $0$, aksi hâlde $1$.</li>
                            <li><b>NOR:</b> $Y = \overline{A + B}$ — iki giriş de $0$ ise $1$, aksi hâlde $0$.</li>
                            <li><b>XOR:</b> $Y = A \oplus B = \overline{A}B + A\overline{B}$ — girişler farklıysa $1$.</li>
                            <li><b>XNOR:</b> $Y = \overline{A \oplus B} = \overline{A}\,\overline{B} + AB$ — girişler aynıysa $1$ (eşitlik kapısı).</li>
                        </ul>`),
                        table(tt(["A", "B"], [[R`\overline{AB}`, "(A&B)'"], [R`\overline{A + B}`, "(A|B)'"], [R`A \oplus B`, "A^B"], [R`\overline{A \oplus B}`, "(A^B)'"]]).replace(/tt-out ?/g, "")),
                        widget("gate", "Yedi kapının hepsi", "Kapılar arasında gez; NAND ile AND'in, NOR ile OR'un tablolarını karşılaştır.", { gates: ["nand", "nor", "xor", "xnor", "and", "or", "not"] }),
                        tip(R`XOR'un sihirli özellikleri: $A \oplus 0 = A$, $A \oplus 1 = \overline{A}$, $A \oplus A = 0$. Yani XOR'un bir girişi “ters çevir mi?” düğmesi gibi çalışır. Çok girişli XOR, girişlerdeki <b>1'lerin sayısı tekse</b> 1 verir; bu yüzden hata denetiminde (<b>eşlik/parity biti</b>) kullanılır.`, "XOR ipuçları"),
                        ex(R`Üç girişli $Y = A \oplus B \oplus C$ hangi girişlerde $1$ olur?`, [
                            R`$A \oplus B \oplus C$, 1'lerin sayısı tek ise $1$'dir.`,
                            R`Tek sayıda 1: $001, 010, 100$ (bir tane 1) ve $111$ (üç tane 1).`,
                        ], R`$ABC = 001, 010, 100, 111$ için $Y = 1$.`),
                        quiz(R`$A = 1$, $B = 1$ için NAND kapısının çıkışı nedir?`, ["0", "1", "Tanımsız", "A"], 0, R`$\overline{1 \cdot 1} = \overline{1} = 0$.`),
                        quiz("Girişleri aynı olduğunda 1 veren kapı hangisidir?", ["XNOR", "XOR", "NAND", "OR"], 0, R`XNOR “eşitlik” kapısıdır.`),
                    ],
                },
                {
                    id: "kapilardan-devre", title: "İfadeden Devreye, Devreden İfadeye",
                    summary: "Boole ifadesini kapılarla çizmek ve geri okumak.",
                    blocks: [
                        simple(R`Bir Boole ifadesi aslında bir devrenin tarifidir. Her işleç bir kapıya, her değişken bir girişe karşılık gelir. İfadeyi okumak için işlem önceliğini kullan: en içteki işlem en soldaki kapıdır, en son yapılan işlem çıkıştaki kapıdır.`),
                        def("Dönüşüm kuralları", R`<ol>
                            <li><b>İfadeden devreye:</b> İşlem önceliğine göre (parantez → DEĞİL → VE → VEYA) her işlemi bir kapıyla yap. En son yapılan işlem çıkış kapısıdır.</li>
                            <li><b>Devreden ifadeye:</b> Girişten başla; her kapının çıkışına, girişlerinden oluşan ifadeyi yaz. Çıkışa vardığında ifade hazırdır.</li>
                        </ol>`),
                        widget("circuit", "Otomatik devre çizici", "Hazır bir ifade seç ya da kendin yaz; devre kendiliğinden çizilir. Girişleri değiştirip sinyalin nasıl ilerlediğini izle.", {
                            presets: [
                                { label: "A·B + C'", expr: "A·B + C'" },
                                { label: "(A + B)·C", expr: "(A + B)·C" },
                                { label: "Çoğunluk", expr: "A·B + A·C + B·C" },
                                { label: "XOR (temel kapılarla)", expr: "A'·B + A·B'" },
                                { label: "(A·B)'", expr: "(A·B)'" },
                            ],
                        }),
                        ex(R`Bir alarm devresi: Kapı açıksa ($K = 1$) <b>ve</b> alarm kuruluysa ($S = 1$) <b>ya da</b> duman varsa ($D = 1$) siren ($Y$) çalmalı. Devrenin ifadesini yazınız.`, [
                            R`“Kapı açık ve alarm kurulu”: $K \cdot S$ (bir AND kapısı).`,
                            R`“…ya da duman var”: $K \cdot S + D$ (bir OR kapısı).`,
                        ], R`$Y = K \cdot S + D$: bir AND ve bir OR kapısı. <a href="#/lab?e=${encodeURIComponent(JSON.stringify(["K·S + D"]))}">Lab'da aç ›</a>`),
                        ex(R`“Çoğunluk devresi”: 3 kişiden en az 2'si “evet” ($1$) derse çıkış $1$ olsun. İfadeyi bulunuz.`, [
                            R`En az iki kişi evet diyorsa şu üç çiftten biri tamamen evettir: $(A, B)$, $(A, C)$ veya $(B, C)$.`,
                            R`Her çift bir AND: $AB$, $AC$, $BC$. Herhangi biri yeter: OR.`,
                        ], R`$Y = AB + AC + BC$ (3 AND + 1 adet 3 girişli OR).`),
                        tip(R`Aynı işi yapan devre daha <b>az kapıyla</b> kurulabiliyorsa, o devre daha ucuz, daha hızlı ve daha az enerji harcar. Sonraki derslerde (Boole cebiri ve Karnaugh haritaları) ifadeleri bu yüzden sadeleştireceğiz.`),
                        quiz(R`$Y = \overline{A} \cdot B + C$ devresinde çıkıştaki kapı hangisidir?`, ["OR", "AND", "NOT", "NAND"], 0, R`İşlem önceliği: önce $\overline{A}$, sonra VE, en son VEYA. En son işlem çıkış kapısıdır.`),
                        quiz(R`$Y = (A + B)\cdot\overline{C}$ devresi kaç kapıyla kurulur (2 girişli kapılar)?`, ["3", "2", "4", "1"], 0, R`Bir OR ($A + B$), bir NOT ($\overline{C}$), bir AND.`),
                    ],
                },
            ],
        },

        /* =========================== 1.3 =========================== */
        {
            no: "1.3", title: "Boole Cebiri",
            lessons: [
                {
                    id: "boole-kurallari", title: "Boole Cebirinin Kuralları",
                    summary: "Özdeşlik, yutan eleman, tümleyen, dağılma…",
                    blocks: [
                        simple(R`Boole cebiri, yalnızca 0 ve 1 ile yapılan bir “aritmetik”tir. Kurallarının çoğu bildiğin cebire benzer ($A \cdot 1 = A$ gibi), ama bazıları şaşırtıcıdır: $A + A = A$ ve $A + 1 = 1$! Her kuralı, değişkene 0 ve 1 koyup deneyerek doğrulayabilirsin.`),
                        formula("Temel kurallar", R`<div class="table-wrap"><table class="mtable">
                            <tr><th>Kural</th><th>VEYA biçimi</th><th>VE biçimi</th></tr>
                            <tr><td>Özdeşlik (etkisiz eleman)</td><td>$A + 0 = A$</td><td>$A \cdot 1 = A$</td></tr>
                            <tr><td>Yutan eleman</td><td>$A + 1 = 1$</td><td>$A \cdot 0 = 0$</td></tr>
                            <tr><td>Tekrar (idempotent)</td><td>$A + A = A$</td><td>$A \cdot A = A$</td></tr>
                            <tr><td>Tümleyen</td><td>$A + \overline{A} = 1$</td><td>$A \cdot \overline{A} = 0$</td></tr>
                            <tr><td>Çift tümleyen</td><td colspan="2">$\overline{\overline{A}} = A$</td></tr>
                            <tr><td>Değişme</td><td>$A + B = B + A$</td><td>$AB = BA$</td></tr>
                            <tr><td>Birleşme</td><td>$(A + B) + C = A + (B + C)$</td><td>$(AB)C = A(BC)$</td></tr>
                            <tr><td>Dağılma</td><td>$A + BC = (A + B)(A + C)$</td><td>$A(B + C) = AB + AC$</td></tr>
                            <tr><td>Yutma</td><td>$A + AB = A$</td><td>$A(A + B) = A$</td></tr>
                            <tr><td>De Morgan</td><td>$\overline{A + B} = \overline{A}\,\overline{B}$</td><td>$\overline{AB} = \overline{A} + \overline{B}$</td></tr>
                        </table></div>`),
                        def("Dualite (eşleklik) ilkesi", R`Bir Boole eşitliğinde $+ \leftrightarrow \cdot$ ve $0 \leftrightarrow 1$ yer değiştirilirse yine doğru bir eşitlik elde edilir. Bu yüzden tablodaki kurallar <b>çiftler</b> hâlindedir: birini bilen ötekini de bilir. Örnek: $A + 0 = A$ doğruysa $A \cdot 1 = A$ da doğrudur.`),
                        widget("equiv", "Kural doğrulayıcı", "Her kuralın iki tarafını doğruluk tablosuyla karşılaştır. Tüm satırlarda ✓ varsa kural doğrudur.", {
                            pairs: [
                                { label: "A + 1 = 1", a: "A + 1", b: "1" },
                                { label: "A + A = A", a: "A + A", b: "A" },
                                { label: "A + A' = 1", a: "A + A'", b: "1" },
                                { label: "Dağılma (VEYA)", a: "A + B·C", b: "(A + B)·(A + C)" },
                                { label: "Yutma", a: "A + A·B", b: "A" },
                                { label: "Tuzak: A+B = A·B?", a: "A + B", b: "A·B" },
                            ],
                        }),
                        warn(R`$A + BC = (A + B)(A + C)$ kuralı normal cebirde <b>yanlıştır</b>, Boole cebirinde doğrudur. Kanıtı: sağ tarafı aç: $AA + AC + AB + BC = A + AC + AB + BC = A(1 + C + B) + BC = A + BC$.`, "Normal cebirden farkı"),
                        ex(R`$A + 1 = 1$ kuralını doğruluk tablosuyla gösteriniz.`, [
                            R`$A = 0$: $0 + 1 = 1$ ✓`,
                            R`$A = 1$: $1 + 1 = 1$ ✓`,
                        ], R`İki durumda da sonuç $1$; kural doğrudur. (Bir VEYA kapısının bir girişi sürekli 1 ise çıkış hep 1'dir.)`),
                        quiz(R`$A \cdot \overline{A}$ neye eşittir?`, ["0", "1", "A", R`$\overline{A}$`], 0, R`Bir şey ve onun tersi aynı anda 1 olamaz.`),
                        quiz(R`$A + A + A$ neye eşittir?`, ["A", "3A", "1", "0"], 0, R`Tekrar kuralı: $A + A = A$.`),
                    ],
                },
                {
                    id: "sadelestirme", title: "Cebirsel Sadeleştirme",
                    summary: "Kurallarla ifadeyi kısaltmak; yutma ve uzlaşma.",
                    blocks: [
                        simple(R`Sadeleştirme, devreden gereksiz kapıları atmak demektir. Tıpkı $3x + 5x = 8x$ yazdığın gibi, ortak çarpan parantezine al, $A + \overline{A} = 1$ ve $A \cdot 1 = A$ kurallarıyla terimleri yok et.`),
                        formula("Sık kullanılan kısayollar", R`<ul>
                            <li>$AB + A\overline{B} = A$ &nbsp;(birleştirme: $A(B + \overline{B}) = A \cdot 1$)</li>
                            <li>$A + AB = A$ &nbsp;(yutma)</li>
                            <li>$A + \overline{A}B = A + B$</li>
                            <li>$A(\overline{A} + B) = AB$</li>
                            <li>$AB + \overline{A}C + BC = AB + \overline{A}C$ &nbsp;(uzlaşma / consensus teoremi)</li>
                        </ul>`),
                        ex(R`$F = \overline{A}\,\overline{B}C + \overline{A}BC + A\overline{B}C + ABC$ ifadesini sadeleştiriniz.`, [
                            R`Her terimde $C$ var, dışarı al: $F = C(\overline{A}\,\overline{B} + \overline{A}B + A\overline{B} + AB)$.`,
                            R`İlk iki terim: $\overline{A}(\overline{B} + B) = \overline{A}$. Son iki terim: $A(\overline{B} + B) = A$.`,
                            R`$F = C(\overline{A} + A) = C \cdot 1$.`,
                        ], R`$F = C$. Dört terim, tek bir tele dönüştü! <a href="#/lab?e=${encodeURIComponent(JSON.stringify(["A'B'C + A'BC + AB'C + ABC"]))}">Lab'da aç ›</a>`),
                        ex(R`$F = AB + A\overline{B} + \overline{A}B$ ifadesini sadeleştiriniz.`, [
                            R`$AB + A\overline{B} = A(B + \overline{B}) = A$.`,
                            R`$F = A + \overline{A}B$.`,
                            R`$A + \overline{A}B = (A + \overline{A})(A + B) = 1 \cdot (A + B)$ (VEYA'nın dağılması).`,
                        ], R`$F = A + B$. Doğruluk tablosuna bakarsan bu, yalnızca $A = B = 0$'da 0 olan fonksiyondur: OR!`),
                        ex(R`$F = (A + B)(A + \overline{B})$ ifadesini sadeleştiriniz.`, [
                            R`Dağılma kuralı (VEYA biçimi) geriye doğru: $(A + B)(A + \overline{B}) = A + B\overline{B}$.`,
                            R`$B\overline{B} = 0$ → $F = A + 0$.`,
                        ], R`$F = A$.`),
                        widget("circuit", "Önce ve sonra", "Aynı fonksiyonun uzun ve sade devrelerini karşılaştır. Girişleri değiştirdiğinde çıkışlar hep aynı kalır.", {
                            presets: [
                                { label: "Uzun: A'B'C + A'BC + AB'C + ABC", expr: "A'B'C + A'BC + AB'C + ABC" },
                                { label: "Sade: C", expr: "C" },
                                { label: "Uzun: AB + AB' + A'B", expr: "AB + AB' + A'B" },
                                { label: "Sade: A + B", expr: "A + B" },
                            ],
                        }),
                        tip(R`Cebirsel sadeleştirmede hangi kuralı ne zaman kullanacağını kestirmek zor olabilir; sonucun en sade olduğundan da emin olamazsın. 4 değişkene kadar <b>Karnaugh haritası</b> bu işi görsel ve garantili yapar (Bölüm 1.5).`),
                        quiz(R`$A + \overline{A}B$ neye eşittir?`, [R`$A + B$`, R`$AB$`, "1", R`$B$`], 0, R`$(A + \overline{A})(A + B) = A + B$.`),
                        quiz(R`$XY + X\overline{Y}$ neye eşittir?`, ["X", "Y", "1", R`$X + Y$`], 0, R`$X(Y + \overline{Y}) = X$.`),
                    ],
                },
                {
                    id: "kanonik", title: "Minterm, Maxterm ve Kanonik Biçimler",
                    summary: "Doğruluk tablosundan ifade yazmak: Σm ve ΠM.",
                    blocks: [
                        simple(R`Elinde yalnızca bir doğruluk tablosu var ve ifadeyi bulman gerekiyor. Çok kolay bir yol var: çıkışın 1 olduğu her satır için “tam bu satırda 1 olan” bir VE terimi yaz, sonra hepsini VEYA ile bağla. Bu terimlere <b>minterm</b> denir.`),
                        def("Minterm ve maxterm", R`$n$ değişkenli bir fonksiyonda:
                            <ul>
                                <li><b>Minterm</b> $m_i$: tüm değişkenlerin VE'si; $i$'nin ikili yazılışında $1$ olan değişken düz, $0$ olan tersli yazılır. Yalnızca $i$. satırda $1$'dir. Örnek (3 değişken): $m_5 = m_{101} = A\overline{B}C$.</li>
                                <li><b>Maxterm</b> $M_i$: tüm değişkenlerin VEYA'sı; $0$ olan değişken düz, $1$ olan tersli. Yalnızca $i$. satırda $0$'dır. Örnek: $M_5 = \overline{A} + B + \overline{C}$.</li>
                            </ul>
                            $M_i = \overline{m_i}$ olduğuna dikkat et.`),
                        formula("Kanonik biçimler", R`<ul>
                            <li><b>Çarpımların toplamı (SOP):</b> $F = \sum m(\text{1 olan satırlar})$</li>
                            <li><b>Toplamların çarpımı (POS):</b> $F = \prod M(\text{0 olan satırlar})$</li>
                        </ul>
                        Örneğin $F(A, B, C) = \sum m(1, 4, 7) = \prod M(0, 2, 3, 5, 6)$.`),
                        table(R`<table class="mtable tt"><thead><tr><th>#</th><th class="tt-var">$A$</th><th class="tt-var">$B$</th><th class="tt-var">$C$</th><th>Minterm</th><th>Maxterm</th></tr></thead><tbody>
                            ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                                const b = [(i >> 2) & 1, (i >> 1) & 1, i & 1], n = ["A", "B", "C"];
                                const mt = n.map((v, j) => (b[j] ? v : `\\overline{${v}}`)).join("");
                                const Mt = n.map((v, j) => (b[j] ? `\\overline{${v}}` : v)).join(" + ");
                                return `<tr><td class="tt-i">${i}</td><td class="tt-var">${b[0]}</td><td class="tt-var">${b[1]}</td><td class="tt-var">${b[2]}</td><td>$m_${i} = ${mt}$</td><td>$M_${i} = ${Mt}$</td></tr>`;
                            }).join("")}</tbody></table>`),
                        ex(R`Doğruluk tablosu $A, B$ için $00 \to 0$, $01 \to 1$, $10 \to 1$, $11 \to 0$ olan $F$'yi SOP ve POS biçiminde yazınız.`, [
                            R`1 olan satırlar: $01$ ($m_1 = \overline{A}B$) ve $10$ ($m_2 = A\overline{B}$).`,
                            R`SOP: $F = \sum m(1, 2) = \overline{A}B + A\overline{B}$.`,
                            R`0 olan satırlar: $00$ ($M_0 = A + B$) ve $11$ ($M_3 = \overline{A} + \overline{B}$).`,
                            R`POS: $F = \prod M(0, 3) = (A + B)(\overline{A} + \overline{B})$.`,
                        ], R`Bu fonksiyon $A \oplus B$'dir (XOR). SOP: $\overline{A}B + A\overline{B}$, POS: $(A + B)(\overline{A} + \overline{B})$.`),
                        widget("truthTable", "Tablo ↔ ifade", "Bir SOP ifadesi yaz; 1 çıkan satırların, yazdığın mintermlerle tam olarak eşleştiğini gör.", {
                            expr: "A'B'C + AB'C' + ABC", steps: false,
                            presets: [{ label: "Σm(1,4,7)", expr: "A'B'C + AB'C' + ABC" }, { label: "XOR (SOP)", expr: "A'B + AB'" }, { label: "XOR (POS)", expr: "(A + B)(A' + B')" }],
                        }),
                        quiz(R`3 değişkenli ($A, B, C$) bir fonksiyonda $m_6$ hangisidir?`, [R`$AB\overline{C}$`, R`$\overline{A}\,\overline{B}C$`, R`$A\overline{B}C$`, R`$\overline{A} + \overline{B} + C$`], 0, R`$6 = (110)_2$: $A = 1$, $B = 1$, $C = 0$.`),
                        quiz(R`$F(A, B, C) = \sum m(0, 3, 5)$ ise $F$'nin POS biçimi hangisidir?`, [R`$\prod M(1, 2, 4, 6, 7)$`, R`$\prod M(0, 3, 5)$`, R`$\prod M(1, 2, 4)$`, R`$\sum m(1, 2, 4, 6, 7)$`], 0, R`Maxtermler, mintermlerde <b>olmayan</b> satır numaralarıdır.`),
                    ],
                },
            ],
        },

        /* =========================== 1.4 =========================== */
        {
            no: "1.4", title: "De Morgan Yasaları",
            lessons: [
                {
                    id: "de-morgan", title: "De Morgan Yasaları",
                    summary: "Çizgiyi kır, işareti değiştir.",
                    blocks: [
                        simple(R`“Hem çay hem kahve içmedim” demek, “çay içmedim <b>veya</b> kahve içmedim” demektir (en az birini içmedin). “Çay veya kahve içmedim” ise “çay içmedim <b>ve</b> kahve içmedim” demektir. Bir VE'nin tersini alınca VEYA'ya, VEYA'nın tersini alınca VE'ye dönüşür. Bu, De Morgan yasalarıdır.`),
                        formula("De Morgan yasaları", R`$$\overline{A \cdot B} = \overline{A} + \overline{B} \qquad\qquad \overline{A + B} = \overline{A} \cdot \overline{B}$$
                            Önermeler mantığında: $\lnot(p \land q) \equiv \lnot p \lor \lnot q$, &nbsp; $\lnot(p \lor q) \equiv \lnot p \land \lnot q$.
                            <br>Çok değişkenli hâli: $\overline{A \cdot B \cdot C} = \overline{A} + \overline{B} + \overline{C}$, &nbsp; $\overline{A + B + C} = \overline{A}\,\overline{B}\,\overline{C}$.`),
                        tip(R`<b>“Çizgiyi kır, işareti değiştir.”</b> Uzun tersleme çizgisini parçalara böl ve altındaki işlemi değiştir ($\cdot \leftrightarrow +$). Tersine, iki kısa çizgiyi birleştirirken de işareti değiştir.`, "Ezber cümlesi"),
                        widget("equiv", "De Morgan'ı tabloyla doğrula", "Doğru ve yanlış eşitlikleri karşılaştır. Sık yapılan hata: işareti değiştirmeyi unutmak.", {
                            pairs: [
                                { label: "(AB)' = A' + B'", a: "(A·B)'", b: "A' + B'" },
                                { label: "(A+B)' = A'B'", a: "(A + B)'", b: "A'·B'" },
                                { label: "Hata: (AB)' = A'B'", a: "(A·B)'", b: "A'·B'" },
                                { label: "3 değişken", a: "(A + B + C)'", b: "A'·B'·C'" },
                                { label: "Mantıkta", a: "!(p & q)", b: "!p | !q" },
                            ],
                        }),
                        warn(R`$\overline{AB}$ ile $\overline{A}\,\overline{B}$ <b>aynı şey değildir</b>! İlki NAND'dır (yalnızca $A = B = 1$'de $0$); ikincisi NOR'dur (yalnızca $A = B = 0$'da $1$). Uzun çizgi ile kısa çizgiler arasındaki farka dikkat et.`),
                        ex(R`$F = \overline{\overline{A}B + C}$ ifadesinin tersleme çizgisini değişkenlere kadar indiriniz.`, [
                            R`Dış çizgi bir VEYA'nın üstünde: $\overline{X + C} = \overline{X} \cdot \overline{C}$, burada $X = \overline{A}B$.`,
                            R`$\overline{\overline{A}B} = \overline{\overline{A}} + \overline{B} = A + \overline{B}$.`,
                            R`$F = (A + \overline{B}) \cdot \overline{C}$.`,
                        ], R`$F = (A + \overline{B})\,\overline{C} = A\overline{C} + \overline{B}\,\overline{C}$.`),
                        ex(R`“Ali sınavı geçti ve ödevini teslim etti” önermesinin değilini yazınız.`, [
                            R`$p$: Ali sınavı geçti, $q$: Ali ödevini teslim etti. Önerme: $p \land q$.`,
                            R`De Morgan: $\lnot(p \land q) \equiv \lnot p \lor \lnot q$.`,
                        ], R`“Ali sınavı geçemedi <b>veya</b> ödevini teslim etmedi.”`),
                        quiz(R`$\overline{A + B}$ neye eşittir?`, [R`$\overline{A}\cdot\overline{B}$`, R`$\overline{A} + \overline{B}$`, R`$A \cdot B$`, R`$\overline{A \cdot B}$`], 0, R`Çizgiyi kır ($\overline{A}$, $\overline{B}$), işareti değiştir ($+ \to \cdot$).`),
                        quiz(R`$\lnot(p \lor \lnot q)$ neye denktir?`, [R`$\lnot p \land q$`, R`$\lnot p \lor q$`, R`$p \land \lnot q$`, R`$\lnot p \land \lnot q$`], 0, R`$\lnot p \land \lnot\lnot q = \lnot p \land q$.`),
                    ],
                },
                {
                    id: "evrensel-kapilar", title: "NAND ve NOR: Evrensel Kapılar",
                    summary: "Her devre yalnızca NAND (ya da yalnızca NOR) ile kurulabilir.",
                    blocks: [
                        simple(R`Bir fabrikada tek çeşit parça üretmek çok ucuzdur. Mucize şu: yalnızca <b>NAND</b> kapılarıyla NOT, AND, OR, kısacası <b>her</b> devre kurulabilir. NOR için de aynısı geçerlidir. Bu yüzden bu ikisine <b>evrensel kapı</b> denir; gerçek yongalar çoğunlukla NAND'larla yapılır.`),
                        formula("NAND ile temel kapılar", R`<ul>
                            <li><b>NOT:</b> $\overline{A \cdot A} = \overline{A}$ — iki girişi birleştir.</li>
                            <li><b>AND:</b> $\overline{\overline{A \cdot B}} = A \cdot B$ — NAND'ın arkasına NAND-NOT koy (2 kapı).</li>
                            <li><b>OR:</b> $\overline{\overline{A} \cdot \overline{B}} = A + B$ — önce girişleri tersle, sonra NAND (De Morgan!) (3 kapı).</li>
                        </ul>`),
                        formula("NOR ile temel kapılar", R`<ul>
                            <li><b>NOT:</b> $\overline{A + A} = \overline{A}$</li>
                            <li><b>OR:</b> $\overline{\overline{A + B}} = A + B$ (2 kapı)</li>
                            <li><b>AND:</b> $\overline{\overline{A} + \overline{B}} = A \cdot B$ (3 kapı)</li>
                        </ul>`),
                        widget("circuit", "Yalnızca NAND ile", "Her ön ayar, temel bir kapının yalnızca NAND'larla yapılmış hâlidir. Tablolar AND, OR, NOT ile aynı mı? Dene!", {
                            presets: [
                                { label: "NOT = A NAND A", expr: "A nand A" },
                                { label: "AND", expr: "(A nand B) nand (A nand B)" },
                                { label: "OR", expr: "(A nand A) nand (B nand B)" },
                                { label: "OR (NOR ile)", expr: "(A nor B) nor (A nor B)" },
                            ],
                            editable: false,
                        }),
                        ex(R`$F = AB + CD$ devresini yalnızca NAND kapılarıyla kurunuz.`, [
                            R`Çift tersleme ekle (değer değişmez): $F = \overline{\overline{AB + CD}}$.`,
                            R`İçteki tersi De Morgan ile dağıt: $\overline{AB + CD} = \overline{AB} \cdot \overline{CD}$.`,
                            R`$F = \overline{\overline{AB} \cdot \overline{CD}}$: iki NAND ($\overline{AB}$, $\overline{CD}$) çıkışları üçüncü bir NAND'a girer.`,
                        ], R`3 NAND kapısı. Genel kural: <b>iki katlı AND-OR (SOP) devresi, doğrudan iki katlı NAND-NAND devresine dönüşür.</b> <a href="#/lab?e=${encodeURIComponent(JSON.stringify(["(A nand B) nand (C nand D)", "AB + CD"]))}">Lab'da karşılaştır ›</a>`),
                        tip(R`Aynı fikir POS için de geçerlidir: iki katlı OR-AND devresi, iki katlı <b>NOR-NOR</b> devresine dönüşür.`),
                        quiz(R`Yalnızca NAND kapılarıyla bir NOT kapısı nasıl elde edilir?`, ["Girişler birleştirilir: A NAND A", "A NAND 0", "İki NAND seri bağlanır", "Mümkün değildir"], 0, R`$\overline{A \cdot A} = \overline{A}$. (Not: $A$ NAND $1$ de olur.)`),
                        quiz("Hangi kapı grubu tek başına “evrensel”dir?", ["Yalnızca NOR", "Yalnızca AND", "Yalnızca OR", "Yalnızca XOR"], 0, R`AND ve OR ile tersleme yapılamaz; XOR tek başına AND'i üretemez. NAND ve NOR evrenseldir.`),
                    ],
                },
            ],
        },

        /* =========================== 1.5 =========================== */
        {
            no: "1.5", title: "Karnaugh Haritaları",
            lessons: [
                {
                    id: "kmap-giris", title: "Karnaugh Haritası: 2 ve 3 Değişken",
                    summary: "Doğruluk tablosunu komşulukla gruplamak.",
                    blocks: [
                        simple(R`Karnaugh haritası (K-haritası), doğruluk tablosunun özel bir şekilde dizilmiş hâlidir. Yan yana duran iki kutu yalnızca <b>bir</b> değişkende farklıdır. Böylece yan yana iki “1”i tek bir terime birleştirebiliriz ($AB + A\overline{B} = A$ kuralını gözle uygulamak gibi). Yapacağın tek şey 1'leri mümkün olan en büyük dikdörtgenlere almak!`),
                        def("Gray kodu sıralaması", R`Sütun başlıkları $00, 01, \mathbf{11}, \mathbf{10}$ sırasıyla yazılır (ikili sayma sırası $00, 01, 10, 11$ değil!). Bu sırada ardışık iki kod yalnızca <b>bir bitte</b> farklıdır. Böylece komşu hücreler tek değişkende farklı olur.
                            <br>3 değişkenli haritada hücrelerin minterm numaraları:
                            <div class="table-wrap"><table class="mtable" style="max-width:360px"><tr><th>$A \backslash BC$</th><th>00</th><th>01</th><th>11</th><th>10</th></tr>
                            <tr><th>0</th><td>$m_0$</td><td>$m_1$</td><td>$m_3$</td><td>$m_2$</td></tr>
                            <tr><th>1</th><td>$m_4$</td><td>$m_5$</td><td>$m_7$</td><td>$m_6$</td></tr></table></div>`),
                        formula("Gruplama kuralları", R`<ol>
                            <li>Gruplar yalnızca <b>1</b>'leri içerir; boyutları $1, 2, 4, 8, \ldots$ ($2$'nin kuvveti) olmalıdır.</li>
                            <li>Gruplar <b>dikdörtgen</b> olmalıdır (çapraz olmaz).</li>
                            <li>Harita kenarlardan <b>sarılır</b>: en sol sütun ile en sağ sütun komşudur.</li>
                            <li>Gruplar olabildiğince <b>büyük</b>, grup sayısı olabildiğince <b>az</b> olmalıdır. Gruplar üst üste binebilir.</li>
                            <li>Her grup bir çarpım terimi verir: grupta <b>değişmeyen</b> değişkenler kalır, değişenler atılır. $2^k$ hücrelik grup $k$ değişken eler.</li>
                        </ol>`),
                        ex(R`$F(A, B, C) = \sum m(0, 2, 4, 5, 6)$ fonksiyonunu K-haritasıyla sadeleştiriniz.`, [
                            R`Haritada $m_0, m_2, m_4, m_6$ (ilk ve son sütunlar, iki satır) ile $m_4, m_5$ 1'dir.`,
                            R`4'lü grup: $m_0, m_2, m_4, m_6$ — kenardan sarılarak birleşen dört köşe/kenar hücresi. Bu hücrelerde $A$ ve $B$ değişiyor, $C = 0$ sabit → $\overline{C}$.`,
                            R`$m_5$ kaldı: $m_4$ ile 2'li grup → $A = 1$, $B = 0$ sabit, $C$ değişiyor → $A\overline{B}$.`,
                        ], R`$F = \overline{C} + A\overline{B}$. Aşağıdaki haritada bu örnek hazır; gruplar renklerle gösteriliyor.`),
                        widget("kmap", "Etkileşimli K-haritası", "Hücrelere dokunarak 1 yaz; en sade ifade ve gruplar anında bulunur. Bir grubun adının üstüne gelirsen hücreleri vurgulanır.", { n: 3, ones: [0, 2, 4, 5, 6] }),
                        tip(R`2 değişkenli haritada 4 hücre vardır ($A$ satır, $B$ sütun). Örneğin $F = \sum m(1, 2, 3)$: alt satırdaki $m_2, m_3$ → $A$; sağ sütundaki $m_1, m_3$ → $B$. Sonuç $F = A + B$.`),
                        quiz(R`3 değişkenli bir K-haritasında 4 hücrelik bir grup kaç değişkenli bir terim verir?`, ["1", "2", "3", "0"], 0, R`$4 = 2^2$ hücre 2 değişkeni eler; $3 - 2 = 1$ değişken kalır.`),
                        quiz("K-haritasında sütunlar neden 00, 01, 11, 10 sırasıyla yazılır?", ["Komşu hücreler tek bitte farklı olsun diye", "Daha kısa olduğu için", "İkili sayma sırası bu olduğu için", "Rastgele bir gelenektir"], 0, R`Gray kodu: ardışık kodlar yalnızca bir bitte farklıdır, böylece komşu hücreler birleştirilebilir.`),
                    ],
                },
                {
                    id: "kmap-4", title: "4 Değişkenli Harita ve Önemsiz Durumlar",
                    summary: "16 hücre, köşe grupları ve X (don't care).",
                    blocks: [
                        simple(R`4 değişkende harita 4×4 olur. Sağ-sol kenarlar gibi <b>üst-alt kenarlar da komşudur</b>; hatta dört köşe birlikte bir grup olabilir! Bazen de bazı giriş durumları hiç oluşmaz; o hücrelerin değeri <b>önemsizdir</b> (X) ve işimize gelirse 1, gelmezse 0 sayarız.`),
                        def("4 değişkenli harita", R`Satırlar $AB$, sütunlar $CD$; ikisi de Gray sırasında ($00, 01, 11, 10$):
                            <div class="table-wrap"><table class="mtable" style="max-width:420px"><tr><th>$AB \backslash CD$</th><th>00</th><th>01</th><th>11</th><th>10</th></tr>
                            <tr><th>00</th><td>0</td><td>1</td><td>3</td><td>2</td></tr>
                            <tr><th>01</th><td>4</td><td>5</td><td>7</td><td>6</td></tr>
                            <tr><th>11</th><td>12</td><td>13</td><td>15</td><td>14</td></tr>
                            <tr><th>10</th><td>8</td><td>9</td><td>11</td><td>10</td></tr></table></div>
                            Gruplar: 1 hücre → 4 harfli terim, 2 → 3 harf, 4 → 2 harf, 8 → 1 harf, 16 → $F = 1$.`),
                        ex(R`$F(A, B, C, D) = \sum m(0, 2, 5, 7, 8, 10, 13, 15)$ ifadesini sadeleştiriniz.`, [
                            R`Dört köşe: $m_0, m_2, m_8, m_{10}$. Hepsinde $B = 0$ ve $D = 0$ → $\overline{B}\,\overline{D}$.`,
                            R`Ortadaki kare: $m_5, m_7, m_{13}, m_{15}$. Hepsinde $B = 1$ ve $D = 1$ → $BD$.`,
                        ], R`$F = BD + \overline{B}\,\overline{D}$ (yani $B \odot D$, XNOR).`),
                        def("Önemsiz (don't care) durumlar", R`Hiç oluşmayacak ya da çıkışı umursanmayan girişler haritada <b>X</b> (ya da $d$) ile işaretlenir: $F = \sum m(\ldots) + d(\ldots)$. Bir X, daha büyük bir grup kurmaya yarıyorsa 1 sayılır; yaramıyorsa dışarıda bırakılır. X'leri kapsamak <b>zorunlu değildir</b>.`),
                        ex(R`Girişi bir BCD rakamı ($0$–$9$, 4 bit $ABCD$) olan bir devre, rakam $5$ veya daha büyükse $1$ versin. $10$–$15$ kodları hiç gelmez. En sade ifadeyi bulunuz.`, [
                            R`$F = \sum m(5, 6, 7, 8, 9) + d(10, 11, 12, 13, 14, 15)$.`,
                            R`Alt iki satır ($AB = 11$ ve $10$) tamamen 1 ya da X → 8'li grup: $A$.`,
                            R`$m_5, m_7, m_{13}, m_{15}$ (X'lerle) → $BD$. $m_6, m_7, m_{14}, m_{15}$ → $BC$.`,
                        ], R`$F = A + BD + BC$. X'ler olmasaydı sonuç çok daha uzun olurdu! Aşağıdaki haritada bu örnek hazır.`),
                        widget("kmap", "4 değişkenli K-haritası (X destekli)", "Hücreye bir kez dokun: 1, iki kez: X (önemsiz), üç kez: 0. Değişken sayısını da değiştirebilirsin.", { n: 4, ones: [5, 6, 7, 8, 9], dc: [10, 11, 12, 13, 14, 15], dontCare: true }),
                        warn(R`En sık yapılan hatalar: (1) 3 ya da 6 hücrelik grup yapmak; (2) köşe ve kenar sarmalarını unutmak; (3) gereksiz bir grubu eklemek — tüm 1'leri zaten başka gruplar kapsıyorsa o grup <b>fazladır</b>.`),
                        quiz(R`4 değişkenli haritada 8 hücrelik bir grup kaç harfli bir terim verir?`, ["1", "2", "3", "4"], 0, R`$8 = 2^3$ hücre 3 değişkeni eler: $4 - 3 = 1$.`),
                        quiz(R`4 değişkenli haritada $m_0$, $m_2$, $m_8$, $m_{10}$ (dört köşe) grubu hangi terimi verir?`, [R`$\overline{B}\,\overline{D}$`, R`$\overline{A}\,\overline{C}$`, R`$BD$`, R`$\overline{A}\,\overline{B}$`], 0, R`Dördünde de $B = 0$ ve $D = 0$; $A$ ve $C$ değişiyor.`),
                    ],
                },
            ],
        },

        /* =========================== 1.6 =========================== */
        {
            no: "1.6", title: "Toplayıcılar, Flip-floplar ve Temel Devreler",
            lessons: [
                {
                    id: "yarim-toplayici", title: "İkili Toplama ve Yarım Toplayıcı",
                    summary: "1 + 1 = 10: toplam ve elde.",
                    blocks: [
                        simple(R`İkili sistemde toplama, onluk sistemdeki gibi basamak basamak yapılır; yalnızca $1 + 1 = 2 = (10)_2$ olduğu için “0 yaz, 1 elde” deriz. Tek bitlik iki sayıyı toplayan devreye <b>yarım toplayıcı</b> denir: iki çıkışı vardır, <b>toplam</b> (S) ve <b>elde</b> (C).`),
                        formula("Tek bit toplama", R`$$0 + 0 = 00 \qquad 0 + 1 = 01 \qquad 1 + 0 = 01 \qquad 1 + 1 = 10$$
                            Sağdaki bit toplam $S$, soldaki bit elde $C$. Tabloya bakınca: $S$ girişler farklıyken $1$ → <b>XOR</b>; $C$ ikisi de $1$ iken $1$ → <b>AND</b>.`),
                        def("Yarım toplayıcı (half adder)", R`$$S = A \oplus B \qquad\qquad C = A \cdot B$$
                            Bir XOR ve bir AND kapısından oluşur.`),
                        widget("adder", "Yarım toplayıcı", "A ve B'yi değiştir; S ve C çıkışlarının ikili toplamı nasıl verdiğini gör.", { mode: "half", choose: false }),
                        ex(R`$(1011)_2 + (0110)_2$ toplamını elle yapınız.`, [
                            R`En sağdan başla: $1 + 0 = 1$ → yaz $1$, elde $0$.`,
                            R`$1 + 1 = 10$ → yaz $0$, elde $1$.`,
                            R`$0 + 1 + 1(\text{elde}) = 10$ → yaz $0$, elde $1$.`,
                            R`$1 + 0 + 1(\text{elde}) = 10$ → yaz $0$, elde $1$. Son elde başa yazılır.`,
                        ], R`$(10001)_2 = 17$. Kontrol: $11 + 6 = 17$ ✓`),
                        warn(R`Yarım toplayıcı yalnızca <b>en sağdaki</b> basamak için yeterlidir. Diğer basamaklarda bir önceki basamaktan gelen <b>elde</b> de toplanmalıdır; üç bit toplamak için <b>tam toplayıcı</b> gerekir (sonraki ders).`),
                        quiz("Yarım toplayıcının toplam (S) çıkışı hangi kapıyla elde edilir?", ["XOR", "AND", "OR", "NAND"], 0, R`$S = 1$ yalnızca girişler farklıyken.`),
                        quiz(R`$(111)_2 + (001)_2$ kaçtır?`, [R`$(1000)_2$`, R`$(112)_2$`, R`$(110)_2$`, R`$(111)_2$`], 0, R`$7 + 1 = 8 = (1000)_2$; elde zincirleme ilerler.`),
                    ],
                },
                {
                    id: "tam-toplayici", title: "Tam Toplayıcı ve n Bitlik Toplayıcı",
                    summary: "Elde girişli toplayıcı; dalgalı elde zinciri.",
                    blocks: [
                        simple(R`Tam toplayıcı üç biti toplar: $A$, $B$ ve önceki basamaktan gelen elde $C_{in}$. Bunlardan $n$ tanesini yan yana dizip her birinin eldesini solundakine bağlarsan $n$ bitlik sayıları toplayan bir devre elde edersin. Bilgisayarının işlemcisindeki toplama devresi tam olarak budur!`),
                        def("Tam toplayıcı (full adder)", R`$$S = A \oplus B \oplus C_{in}$$
                            $$C_{out} = AB + C_{in}(A \oplus B) = AB + AC_{in} + BC_{in}$$
                            $S$: üç girişteki 1'lerin sayısı tekse $1$. $C_{out}$: en az iki giriş $1$ ise $1$ (çoğunluk fonksiyonu!).
                            <br>Bir tam toplayıcı, <b>iki yarım toplayıcı ve bir OR</b> kapısıyla kurulabilir.`),
                        table(tt(["A", "B", "C"], [[R`C_{out}`, "A&B | C&(A^B)"], ["S", "A^B^C"]]).replace('<th class="tt-var">$C$</th>', '<th class="tt-var">$C_{in}$</th>')),
                        widget("adder", "Tam toplayıcı", "Üç girişi değiştir. Devrelerdeki C girişi, önceki basamaktan gelen elde (Cin) demektir.", { mode: "full" }),
                        def("Dalgalı elde toplayıcı (ripple-carry adder)", R`$n$ tane tam toplayıcı yan yana dizilir; $i$. toplayıcının $C_{out}$ çıkışı $(i+1)$. toplayıcının $C_{in}$ girişine bağlanır. En sağdaki toplayıcının $C_{in}$'i $0$'dır. Sonucun $n$ bite sığmaması (son $C_{out} = 1$) <b>taşma</b> demektir.`),
                        widget("ripple", "4 bitlik toplayıcı", "A ve B'nin bitlerine dokun. Eldelerin (TT kutularının yanındaki küçük sayılar) sağdan sola nasıl dalgalandığını izle. 15'i aşınca ne oluyor?", { bits: 4, a: 11, b: 6 }),
                        tip(R`Dalgalı elde toplayıcı yavaştır: en soldaki bit, eldenin bütün zincir boyunca gelmesini bekler. Hızlı işlemciler, eldeyi önceden hesaplayan <b>elde öngörülü (carry look-ahead)</b> toplayıcılar kullanır. Çıkarma ise ikiye tümleyen ($B$'nin bitlerini tersle, $1$ ekle) sayesinde aynı toplayıcıyla yapılır: $A - B = A + \overline{B} + 1$.`, "Daha fazlası"),
                        ex(R`$A = 1$, $B = 1$, $C_{in} = 1$ için tam toplayıcının çıkışlarını bulunuz.`, [
                            R`$S = 1 \oplus 1 \oplus 1 = 0 \oplus 1 = 1$.`,
                            R`$C_{out} = 1\cdot1 + 1\cdot(1 \oplus 1) = 1 + 0 = 1$.`,
                        ], R`$S = 1$, $C_{out} = 1$: $1 + 1 + 1 = 3 = (11)_2$ ✓`),
                        quiz(R`8 bitlik iki sayıyı toplayan dalgalı elde toplayıcıda kaç tam toplayıcı kullanılır?`, ["8", "16", "4", "9"], 0, R`Her bit için bir tam toplayıcı (en sağdaki yarım toplayıcı da olabilir, $C_{in} = 0$).`),
                        quiz(R`Tam toplayıcıda $A = 1$, $B = 0$, $C_{in} = 1$ ise $(C_{out}, S)$ nedir?`, ["(1, 0)", "(0, 1)", "(1, 1)", "(0, 0)"], 0, R`$1 + 0 + 1 = 2 = (10)_2$.`),
                    ],
                },
                {
                    id: "dort-islem", title: "Kapılarla Dört İşlem",
                    summary: "Toplama, çıkarma, çarpma ve bölme devreleri.",
                    blocks: [
                        simple(R`İşlemcinin içindeki <b>aritmetik mantık birimi</b> (ALU) dört işlemi de yalnızca mantık kapılarıyla yapar. İşin sırrı şu: hepsi <b>toplayıcıya</b> dayanır. Çıkarma, tersleyip toplamaktır; çarpma, kaydırıp toplamaktır; bölme ise tekrar tekrar çıkarmaktır.`),
                        def("Çıkarma", R`$$A - B = A + \overline{B} + 1$$
                            $B$'nin bitleri XOR kapılarıyla terslenir, toplayıcının ilk eldesine $1$ verilir (ikiye tümleyen). Son elde $C_{out} = 0$ ise sonuç negatiftir.`),
                        def("Çarpma", R`İkili çarpım tablosu tek bir AND kapısıdır: $a \cdot b$. $A$'nın bitleri $B$'nin her bitiyle AND'lenir (<b>kısmi çarpımlar</b>), her satır bir basamak sola kaydırılır ve satırlar toplayıcılarla toplanır. $n$ bitlik iki sayının çarpımı $2n$ bite kadar çıkar.`),
                        def("Bölme", R`Uzun bölmenin aynısı: $A$'nın bitleri soldan birer birer kalana indirilir; kalan $\ge B$ ise $B$ çıkarılır ve bölüm biti $1$ olur, değilse bölüm biti $0$ olur ve kalan korunur. Sonunda $A = B \cdot Q + R$.`),
                        widget("alu", "Dört işlem birimi", "İşlemi seç, A ve B'nin bitlerine dokun. Sonucun hangi kapılardan geçerek hesaplandığını ve kaç kapı çalıştığını gör.", { bits: 4, a: 13, b: 3 }),
                        tip(R`Devrenin kapı kapı çizilmiş hâlini görmek için: <a href="#/lab?m=alu">Mantık Lab'da aç ›</a>`),
                        ex(R`$(0110)_2 \times (0011)_2$ çarpımını kısmi çarpımlarla bulunuz.`, [
                            R`$B_0 = 1$ → $0110$; $B_1 = 1$ → bir sola kaydırılmış $0110$, yani $01100$.`,
                            R`$B_2 = B_3 = 0$ → kısmi çarpımlar $0$.`,
                            R`$0110 + 01100 = 10010$.`,
                        ], R`$(10010)_2 = 18$. Kontrol: $6 \times 3 = 18$ ✓`),
                        quiz(R`4 bitlik bir çıkarıcıda $B$'nin bitlerini terslemek için hangi kapı “kontrollü tersleyici” olarak kullanılır?`, ["XOR", "AND", "OR", "NAND"], 0, R`$B \oplus 1 = \overline{B}$, $B \oplus 0 = B$: aynı devre hem toplar hem çıkarır.`),
                        quiz(R`4 bitlik iki sayının kısmi çarpımları için kaç AND kapısı gerekir?`, ["16", "8", "4", "32"], 0, R`Her $A_i$, her $B_j$ ile AND'lenir: $4 \times 4 = 16$.`),
                    ],
                },
                {
                    id: "mux-decoder", title: "Çoklayıcı (MUX) ve Kod Çözücü",
                    summary: "Seçici anahtarlar ve adres çözümü.",
                    blocks: [
                        simple(R`<b>Çoklayıcı</b> (multiplexer, MUX) bir demiryolu makası gibidir: birçok girişten <b>birini</b> seçip çıkışa bağlar; hangisinin seçileceğini <b>seçici</b> bitler söyler. <b>Kod çözücü</b> (decoder) ise bir ikili sayıyı alır ve o numaralı çıkışı yakar; bellekteki doğru hücreyi seçmek böyle yapılır.`),
                        def("Çoklayıcı (MUX)", R`$2^n$ veri girişi, $n$ seçici girişi ve bir çıkışı vardır. 4→1 MUX ($S_1 S_0$ seçici):
                            $$Y = \overline{S_1}\,\overline{S_0}D_0 + \overline{S_1}S_0D_1 + S_1\overline{S_0}D_2 + S_1S_0D_3$$
                            Her terim bir minterm ile bir veri girişinin VE'sidir: yalnızca seçilen girişin terimi “açık” kalır.`),
                        def("Kod çözücü (decoder)", R`$n$ girişli kod çözücünün $2^n$ çıkışı vardır; giriş $k$ sayısını gösteriyorsa yalnızca $Y_k = 1$ olur. Yani her çıkış bir mintermdir: $Y_k = m_k$. Çoğunda bir de <b>etkinleştirme</b> (enable, $E$) girişi bulunur.`),
                        widget("mux", "MUX ve kod çözücü", "Seçici bitleri değiştir; hangi verinin çıkışa aktığını, ya da hangi lambanın yandığını gör.", {}),
                        ex(R`4→1 MUX'ta $D_0 = 0$, $D_1 = 1$, $D_2 = 1$, $D_3 = 0$ ve $S_1S_0 = 10$ ise çıkış nedir?`, [
                            R`$S_1S_0 = (10)_2 = 2$ → çıkışa $D_2$ bağlanır.`,
                        ], R`$Y = D_2 = 1$.`),
                        tip(R`Bir MUX ile <b>her</b> fonksiyon kurulabilir: 3 değişkenli bir fonksiyon için 8→1 MUX'un seçicilerine $A, B, C$'yi bağla, veri girişlerine de doğruluk tablosunun çıkış sütununu (0/1) yaz. MUX bir “arama tablosu” (look-up table) gibi çalışır — FPGA'lar tam olarak bu fikirle çalışır.`),
                        quiz("8 veri girişli bir MUX'ta kaç seçici girişi gerekir?", ["3", "8", "4", "2"], 0, R`$2^3 = 8$.`),
                        quiz(R`3→8 kod çözücüye $101$ girildiğinde hangi çıkış $1$ olur?`, [R`$Y_5$`, R`$Y_3$`, R`$Y_1$`, R`$Y_6$`], 0, R`$(101)_2 = 5$.`),
                    ],
                },
                {
                    id: "flip-flop", title: "Mandallar ve Flip-floplar: SR ve D",
                    summary: "Hafızalı devreler: 1 bit saklamak.",
                    blocks: [
                        simple(R`Şimdiye kadarki devrelerin çıkışı yalnızca o anki girişlere bağlıydı (<b>kombinasyonel</b> devreler). Ama bir bilgisayarın <b>hatırlaması</b> gerekir! Çıkışı girişe geri besleyen devreler bir önceki durumu saklar; bunlara <b>ardışıl</b> (sequential) devreler denir. En küçüğü 1 bit saklayan <b>mandal</b> ve <b>flip-flop</b>'tur.`),
                        def("SR mandal (latch)", R`İki NOR (ya da NAND) kapısının çıkışları çapraz olarak birbirinin girişine bağlanır. Girişler: $S$ (set, kur) ve $R$ (reset, sıfırla); çıkışlar $Q$ ve $\overline{Q}$.
                            <ul>
                                <li>$S = 1, R = 0$ → $Q = 1$ (kur) &nbsp;·&nbsp; $S = 0, R = 1$ → $Q = 0$ (sıfırla)</li>
                                <li>$S = 0, R = 0$ → $Q$ <b>eski değerini korur</b> (hafıza!)</li>
                                <li>$S = 1, R = 1$ → <b>yasak</b> (geçersiz) durum</li>
                            </ul>`),
                        def("Saat ve D flip-flop", R`Bilgisayardaki bütün parçalar bir <b>saat</b> (clock) sinyaliyle, aynı ritimde çalışır. <b>Flip-flop</b>, girişini yalnızca saatin <b>yükselen kenarında</b> (0 → 1 anı) okuyan bir hafıza elemanıdır.
                            <br><b>D flip-flop:</b> saat kenarında $D$ girişindeki değeri $Q$'ya kopyalar ve bir sonraki kenara kadar saklar: $$Q_{\text{sonraki}} = D$$`),
                        widget("flipflop", "SR mandal ve D flip-flop", "Girişleri değiştir; D flip-flopta “Saat darbesi”ne bas. Zaman diyagramında Q'nun yalnızca saat kenarında değiştiğine dikkat et.", { types: ["SR", "D"] }),
                        ex(R`Bir D flip-flopta başlangıçta $Q = 0$. Saat kenarlarından hemen önce $D$ sırasıyla $1, 1, 0, 1$ ise her kenardan sonra $Q$ ne olur?`, [
                            R`1. kenar: $Q = D = 1$. &nbsp; 2. kenar: $Q = 1$. &nbsp; 3. kenar: $Q = 0$. &nbsp; 4. kenar: $Q = 1$.`,
                            R`İki kenar arasında $D$ değişse bile $Q$ değişmez.`,
                        ], R`$Q$: $1, 1, 0, 1$ — $D$'nin saat kenarlarındaki “fotoğrafları”.`),
                        tip(R`Yan yana 8 D flip-flop, 8 bitlik bir <b>yazmaç</b> (register) olur. İşlemcinin içindeki yazmaçlar, önbellekler (SRAM) hep bu fikrin devamıdır.`),
                        quiz(R`SR mandalda $S = 0$, $R = 0$ iken ne olur?`, ["Q eski değerini korur", "Q = 0 olur", "Q = 1 olur", "Geçersiz durum"], 0, R`Hafıza durumu: çıkış değişmez.`),
                        quiz("D flip-flop girişi ne zaman okur?", ["Saatin yükselen kenarında", "Her an sürekli", "Yalnızca D = 1 iken", "Saat 0 iken"], 0, R`Kenar tetiklemeli: yalnızca 0 → 1 geçişinde.`),
                    ],
                },
                {
                    id: "jk-t-sayac", title: "JK ve T Flip-flop; Sayaçlar",
                    summary: "Tersleme özelliği ve ikili sayaç.",
                    blocks: [
                        simple(R`JK flip-flop, SR'nin “yasak” durumunu işe yarar hâle getirir: $J = K = 1$ olunca çıkış <b>tersine döner</b>. T (toggle) flip-flop da tam olarak bunu yapar: $T = 1$ iken her saat darbesinde çıkış 0 → 1 → 0 → … diye değişir. Birkaç T flip-flopu art arda bağlarsan ikili sayan bir <b>sayaç</b> elde edersin.`),
                        formula("Karakteristik denklemler", R`<div class="table-wrap"><table class="mtable">
                            <tr><th>Flip-flop</th><th>Sonraki durum</th><th>Özet</th></tr>
                            <tr><td>SR</td><td>$Q^+ = S + \overline{R}Q$ &nbsp;($SR = 0$)</td><td>kur / sıfırla / koru</td></tr>
                            <tr><td>D</td><td>$Q^+ = D$</td><td>kopyala</td></tr>
                            <tr><td>JK</td><td>$Q^+ = J\overline{Q} + \overline{K}Q$</td><td>$11$ → tersle</td></tr>
                            <tr><td>T</td><td>$Q^+ = T \oplus Q$</td><td>$T = 1$ → tersle</td></tr>
                        </table></div>`),
                        widget("flipflop", "JK ve T flip-flop", "J = K = 1 yapıp birkaç saat darbesi ver: Q her darbede tersine döner.", { types: ["JK", "T"] }),
                        def("İkili sayaç", R`$n$ tane T flip-flop ($T = 1$) ile $0$'dan $2^n - 1$'e kadar sayan bir sayaç kurulur. En düşük bit $Q_0$ her darbede, $Q_1$ her 2 darbede, $Q_2$ her 4 darbede bir değişir. $2^n$ darbeden sonra sayaç başa döner (mod $2^n$ sayaç).`),
                        widget("counter", "3 bitlik sayaç", "Saat darbesi ver ve bitlerin ikili sayma düzeninde nasıl değiştiğini izle: 000, 001, 010, 011, …", { bits: 3 }),
                        ex(R`Başlangıçta $Q = 0$ olan bir JK flip-flopa sırasıyla $(J, K) = (1, 0), (1, 1), (0, 0), (0, 1), (1, 1)$ uygulanıyor. Her saat darbesinden sonra $Q$ nedir?`, [
                            R`$(1, 0)$ → kur: $Q = 1$.`,
                            R`$(1, 1)$ → tersle: $Q = 0$.`,
                            R`$(0, 0)$ → koru: $Q = 0$.`,
                            R`$(0, 1)$ → sıfırla: $Q = 0$.`,
                            R`$(1, 1)$ → tersle: $Q = 1$.`,
                        ], R`$Q$: $1, 0, 0, 0, 1$.`),
                        tip(R`Sayaçtaki her flip-flop, saat frekansını <b>yarıya</b> böler. 32 768 Hz'lik bir kuvars kristalini 15 T flip-flopla böldüğünde ($2^{15} = 32\,768$) tam 1 Hz elde edilir: kol saatlerindeki saniye böyle üretilir!`, "Gerçek hayatta"),
                        quiz(R`T flip-flopta $T = 1$ iken $Q = 1$ ise bir saat darbesinden sonra $Q$ kaç olur?`, ["0", "1", "Değişmez", "Tanımsız"], 0, R`$Q^+ = T \oplus Q = 1 \oplus 1 = 0$.`),
                        quiz("4 flip-floplu bir ikili sayaç kaçtan sonra başa döner?", ["15", "16", "8", "4"], 0, R`$0$'dan $2^4 - 1 = 15$'e kadar sayar (16 durum), sonra 0'a döner.`),
                    ],
                },
            ],
        },
    ];

    global.CHAPTERS = global.CHAPTERS || {};
    global.CHAPTERS.mantik = {
        no: 1, id: "mantik", title: "Mantık, Boole Cebiri ve Sayısal Devreler",
        intro: "Bilgisayarın en alt katmanı: önermeler ve doğruluk tabloları, mantık kapıları, Boole cebiri, De Morgan yasaları, Karnaugh haritaları, toplayıcılar ve flip-floplar.",
        sections,
    };

    global.COURSE = {
        title: "Bilgisayar Bilimi",
        source: "Bilgisayar biliminin temel konuları",
        chapters: [
            { no: 1, title: "Mantık, Boole Cebiri ve Sayısal Devreler", sub: "6 alt konu · 20 ders", id: "mantik" },
            { no: 2, title: "Sayı Sistemleri ve Veri Gösterimi", sub: "İkili, onaltılık, tümleyen, kayan nokta" },
            { no: 3, title: "Algoritmalar", sub: "Akış şemaları, karmaşıklık, sıralama" },
            { no: 4, title: "Programlamaya Giriş", sub: "Değişkenler, koşullar, döngüler" },
            { no: 5, title: "Veri Yapıları", sub: "Dizi, yığın, kuyruk, ağaç" },
            { no: 6, title: "Bilgisayar Mimarisi", sub: "İşlemci, bellek, komut çevrimi" },
        ],
    };
})(window);
