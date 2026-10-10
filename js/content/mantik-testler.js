/*
 * Bölüm 1 - Mantık, Boole Cebiri ve Sayısal Devreler: çoktan seçmeli testler + alıştırmalar (adım adım çözümlü).
 */
(function (global) {
    "use strict";

    const R = String.raw;
    const mc = (q, options, correct, why) => ({ q, options, correct, why });
    const part = (l, q, a, s, lab) => ({ l, q, a, s: s || [], lab });

    const tests = [
        {
            id: "test-1", title: "Test 1 · Önermeler ve Doğruluk Tabloları", sections: ["1.1"],
            desc: "Önerme, bağlaçlar, koşullu önermeler, totoloji ve çelişki.",
            questions: [
                mc("Aşağıdakilerden hangisi önerme değildir?", [R`“$x$ bir çift sayıdır.”`, R`“$5 < 3$”`, "“Ankara Türkiye'dedir.”", "“Her kare bir dikdörtgendir.”"], 0, R`$x$ bilinmeden doğru mu yanlış mı belli değil; açık önermedir.`),
                mc(R`$p = 1$, $q = 0$ ise $p \land \lnot q$ kaçtır?`, ["1", "0", "Belirsiz", "p"], 0, R`$\lnot q = 1$, $1 \land 1 = 1$.`),
                mc(R`$p \lor q$ hangi durumda yanlıştır?`, [R`$p = 0,\ q = 0$`, R`$p = 1,\ q = 0$`, R`$p = 0,\ q = 1$`, R`$p = 1,\ q = 1$`], 0, R`VEYA, ancak ikisi de yanlışken yanlıştır.`),
                mc(R`$p \rightarrow q$ önermesinin karşıt tersi hangisidir?`, [R`$\lnot q \rightarrow \lnot p$`, R`$q \rightarrow p$`, R`$\lnot p \rightarrow \lnot q$`, R`$\lnot p \lor \lnot q$`], 0, R`Karşıt ters: hem yer değiştir hem değilini al.`),
                mc(R`$p \rightarrow q$ hangisine denktir?`, [R`$\lnot p \lor q$`, R`$p \lor \lnot q$`, R`$\lnot p \land q$`, R`$p \land \lnot q$`], 0, R`Yalnızca $p = 1, q = 0$'da yanlış olan VEYA: $\lnot p \lor q$.`),
                mc(R`$p = 0$, $q = 0$ ise $p \leftrightarrow q$ kaçtır?`, ["1", "0", "Tanımsız", "q"], 0, R`İki değer aynı → doğru.`),
                mc(R`5 değişkenli bir önermenin doğruluk tablosunda kaç satır vardır?`, ["32", "25", "10", "16"], 0, R`$2^5 = 32$.`),
                mc("Hangisi bir totolojidir?", [R`$p \rightarrow (p \lor q)$`, R`$p \land q$`, R`$p \rightarrow q$`, R`$p \land \lnot p$`], 0, R`$p = 1$ ise $p \lor q = 1$; $p = 0$ ise koşullu zaten doğru.`),
                mc(R`$p \oplus q$ hangi durumda doğrudur?`, ["p ve q farklıyken", "p ve q aynıyken", "İkisi de doğruyken", "Her zaman"], 0, R`Özel veya: “ya o ya bu”.`),
                mc(R`“Ödevini yaparsan çıkabilirsin.” sözü hangi durumda <b>yalan</b> olur?`, ["Ödevi yaptın ama çıkamadın", "Ödevi yapmadın ve çıkamadın", "Ödevi yapmadın ama çıktın", "Ödevi yaptın ve çıktın"], 0, R`$p \rightarrow q$ yalnızca $p = 1$, $q = 0$'da yanlış.`),
            ],
        },
        {
            id: "test-2", title: "Test 2 · Kapılar, Boole Cebiri ve De Morgan", sections: ["1.2", "1.3", "1.4"],
            desc: "Mantık kapıları, ikili sayılar, Boole kuralları, sadeleştirme, minterm, De Morgan, NAND/NOR.",
            questions: [
                mc(R`$(1101)_2$ onluk sistemde kaçtır?`, ["13", "11", "1101", "14"], 0, R`$8 + 4 + 1 = 13$.`),
                mc("Girişlerinden en az biri 1 iken çıkışı 1 olan kapı hangisidir?", ["OR", "AND", "NOR", "XNOR"], 0, R`VEYA kapısı.`),
                mc(R`$A = 1$, $B = 0$ için $\overline{A + B}$ kaçtır?`, ["0", "1", "A", "Tanımsız"], 0, R`$A + B = 1$, tersi $0$ (NOR).`),
                mc(R`$A + AB$ neye eşittir?`, ["A", "AB", "B", "A + B"], 0, R`Yutma kuralı: $A(1 + B) = A$.`),
                mc(R`$\overline{A \cdot B}$ neye eşittir?`, [R`$\overline{A} + \overline{B}$`, R`$\overline{A}\cdot\overline{B}$`, R`$A + B$`, R`$\overline{A + B}$`], 0, R`De Morgan: çizgiyi kır, işareti değiştir.`),
                mc(R`$(A + B)(A + \overline{B})$ neye eşittir?`, ["A", "B", "1", R`$A + B$`], 0, R`$A + B\overline{B} = A + 0 = A$.`),
                mc(R`3 değişkenli ($A, B, C$) fonksiyonda $m_3$ hangisidir?`, [R`$\overline{A}BC$`, R`$AB\overline{C}$`, R`$A\overline{B}\,\overline{C}$`, R`$\overline{A}\,\overline{B}C$`], 0, R`$3 = (011)_2$.`),
                mc(R`$F(A, B, C) = \sum m(1, 2, 5)$ ise $F = 0$ olan satır sayısı kaçtır?`, ["5", "3", "8", "2"], 0, R`$8 - 3 = 5$ satır: $\prod M(0, 3, 4, 6, 7)$.`),
                mc("Hangi kapı türü tek başına her devreyi kurmaya yeter?", ["NAND", "AND", "OR", "XOR"], 0, R`NAND (ve NOR) evrenseldir.`),
                mc(R`$\overline{\overline{A} + B}$ neye eşittir?`, [R`$A\overline{B}$`, R`$\overline{A}B$`, R`$A + \overline{B}$`, R`$\overline{A}\,\overline{B}$`], 0, R`$\overline{\overline{A}} \cdot \overline{B} = A\overline{B}$.`),
            ],
        },
        {
            id: "test-3", title: "Test 3 · Karnaugh Haritaları", sections: ["1.5"],
            desc: "Gray kodu, gruplama kuralları, 3 ve 4 değişkenli haritalar, önemsiz durumlar.",
            questions: [
                mc("K-haritasında bir grup kaç hücreden oluşabilir?", ["1, 2, 4, 8, …", "Herhangi bir sayı", "Yalnızca çift sayılar", "1, 3, 5, 7, …"], 0, R`Grup boyutları 2'nin kuvveti olmalıdır.`),
                mc("3 değişkenli haritada sütun başlıklarının sırası hangisidir?", ["00, 01, 11, 10", "00, 01, 10, 11", "00, 10, 01, 11", "11, 10, 01, 00"], 0, R`Gray kodu: komşular tek bitte farklı.`),
                mc(R`4 değişkenli haritada 4 hücrelik bir grup kaç harfli terim verir?`, ["2", "1", "3", "4"], 0, R`$4 = 2^2$ → 2 değişken elenir; $4 - 2 = 2$.`),
                mc(R`$F(A, B, C) = \sum m(4, 5, 6, 7)$ en sade hâliyle nedir?`, ["A", R`$\overline{A}$`, "B", R`$AB + AC$`], 0, R`Alt satırın tamamı: $A = 1$.`),
                mc(R`$F(A, B, C) = \sum m(0, 2, 4, 6)$ en sade hâliyle nedir?`, [R`$\overline{C}$`, R`$\overline{A}$`, "C", R`$\overline{B}$`], 0, R`Dört hücrenin hepsinde $C = 0$; ilk ve son sütunlar kenardan sarılır.`),
                mc(R`$F(A, B) = \sum m(1, 2, 3)$ en sade hâliyle nedir?`, [R`$A + B$`, R`$AB$`, R`$A \oplus B$`, R`$\overline{A} + B$`], 0, R`$m_2, m_3$ → $A$; $m_1, m_3$ → $B$.`),
                mc(R`4 değişkenli haritada $m_0$ hangi hücreyle komşu <b>değildir</b>?`, [R`$m_5$`, R`$m_1$`, R`$m_2$`, R`$m_8$`], 0, R`$0000$ ile $0101$ iki bitte farklıdır; $m_2$ ve $m_8$ kenar sarmasıyla komşudur.`),
                mc("Önemsiz (X) hücreler için hangisi doğrudur?", ["İşe yararsa 1 sayılır, yaramazsa dışarıda bırakılır", "Mutlaka bir gruba alınmalıdır", "Her zaman 0 sayılır", "Grup boyutunu tek yapar"], 0, R`X'leri kapsamak zorunlu değildir.`),
                mc(R`$F(A, B, C, D) = \sum m(0, 1, 2, 3)$ en sade hâliyle nedir?`, [R`$\overline{A}\,\overline{B}$`, R`$\overline{C}\,\overline{D}$`, R`$\overline{A}$`, R`$AB$`], 0, R`İlk satırın tamamı: $A = 0$, $B = 0$.`),
                mc(R`3 değişkenli haritanın 8 hücresinin hepsi 1 ise $F$ nedir?`, ["1", "0", R`$ABC$`, R`$A + B + C$`], 0, R`8'li grup tüm değişkenleri eler: $F = 1$.`),
            ],
        },
        {
            id: "test-4", title: "Test 4 · Toplayıcılar, Flip-floplar ve Temel Devreler", sections: ["1.6"],
            desc: "Yarım/tam toplayıcı, ikili toplama, MUX, kod çözücü, SR/D/JK/T flip-flop, sayaçlar.",
            questions: [
                mc("Yarım toplayıcının elde (C) çıkışı hangi kapıdır?", ["AND", "XOR", "OR", "NOR"], 0, R`$C = AB$.`),
                mc(R`$(0111)_2 + (0011)_2$ kaçtır?`, [R`$(1010)_2$`, R`$(1000)_2$`, R`$(0100)_2$`, R`$(1110)_2$`], 0, R`$7 + 3 = 10$.`),
                mc(R`Tam toplayıcıda $A = 1$, $B = 1$, $C_{in} = 0$ ise $S$ ve $C_{out}$ nedir?`, [R`$S = 0,\ C_{out} = 1$`, R`$S = 1,\ C_{out} = 0$`, R`$S = 1,\ C_{out} = 1$`, R`$S = 0,\ C_{out} = 0$`], 0, R`$1 + 1 + 0 = (10)_2$.`),
                mc(R`Tam toplayıcının toplam çıkışı hangisidir?`, [R`$A \oplus B \oplus C_{in}$`, R`$AB + C_{in}$`, R`$A + B + C_{in}$`, R`$ABC_{in}$`], 0, R`1'lerin sayısı tekse 1.`),
                mc("16 veri girişli bir MUX'ta kaç seçici girişi gerekir?", ["4", "16", "8", "2"], 0, R`$2^4 = 16$.`),
                mc("2→4 kod çözücüye 11 girilirse hangi çıkış 1 olur?", [R`$Y_3$`, R`$Y_1$`, R`$Y_2$`, R`$Y_0$`], 0, R`$(11)_2 = 3$.`),
                mc(R`SR mandalda hangi giriş kombinasyonu yasaktır?`, [R`$S = 1,\ R = 1$`, R`$S = 0,\ R = 0$`, R`$S = 1,\ R = 0$`, R`$S = 0,\ R = 1$`], 0, R`$Q$ ve $\overline{Q}$ ikisi de 0 olur; tutarsız durum.`),
                mc(R`D flip-flopta saat kenarında $D = 1$ ise $Q$ ne olur?`, ["1", "0", "Eski değeri korunur", "Tersine döner"], 0, R`$Q^+ = D$.`),
                mc(R`JK flip-flopta $J = K = 1$ iken saat darbesi gelirse?`, ["Q tersine döner", "Q = 0 olur", "Q = 1 olur", "Q korunur"], 0, R`$Q^+ = J\overline{Q} + \overline{K}Q = \overline{Q}$.`),
                mc("3 flip-floplu bir ikili sayaç kaç farklı durumdan geçer?", ["8", "3", "6", "7"], 0, R`$2^3 = 8$ (0'dan 7'ye).`),
            ],
        },
    ];

    /* =====================================================================
     * ALIŞTIRMALAR (adım adım çözümlü)
     * ===================================================================== */
    const problemSets = [
        {
            id: "alistirma-1-1", title: "Alıştırmalar · 1.1 Önermeler", desc: "Doğruluk değerleri, koşullu önermeler, totoloji.", sections: ["1.1"],
            problems: [
                { no: 1, q: R`$p = 1$, $q = 0$, $r = 1$ için aşağıdaki önermelerin doğruluk değerlerini bulunuz.`, parts: [
                    part("a", R`$(p \lor q) \land r$`, "1", [R`$p \lor q = 1$, $1 \land 1 = 1$.`]),
                    part("b", R`$\lnot p \lor (q \land r)$`, "0", [R`$\lnot p = 0$, $q \land r = 0$, $0 \lor 0 = 0$.`]),
                    part("c", R`$p \rightarrow q$`, "0", [R`Hipotez doğru, hüküm yanlış.`]),
                    part("d", R`$q \rightarrow r$`, "1", [R`Hipotez yanlış → koşullu doğru.`]),
                    part("e", R`$(p \leftrightarrow r) \oplus q$`, "1", [R`$p \leftrightarrow r = 1$, $1 \oplus 0 = 1$.`]),
                ] },
                { no: 2, q: R`$p \rightarrow q$ önermesi yanlış olduğuna göre $p$ ve $q$'nun değerlerini bulunuz; $\lnot p \lor (q \rightarrow p)$ önermesinin değerini hesaplayınız.`,
                    a: R`$p = 1$, $q = 0$; ifade $= 1$.`, s: [R`Koşullu yalnızca $p = 1$, $q = 0$'da yanlıştır.`, R`$\lnot p = 0$; $q \rightarrow p = 0 \rightarrow 1 = 1$.`, R`$0 \lor 1 = 1$.`] },
                { no: 3, q: R`$(p \land q) \rightarrow p$ önermesinin totoloji olduğunu doğruluk tablosuyla gösteriniz.`, lab: ["(p & q) -> p"],
                    a: "Dört satırın hepsinde 1 → totoloji.", s: [R`$p, q$: $00$: $p \land q = 0$ → $0 \rightarrow 0 = 1$.`, R`$01$: $0 \rightarrow 0 = 1$. &nbsp; $10$: $0 \rightarrow 1 = 1$. &nbsp; $11$: $1 \rightarrow 1 = 1$.`, R`Hiç yanlış satır yok.`] },
                { no: 4, q: R`$p \rightarrow q$ ile $q \rightarrow p$'nin denk olmadığını bir örnek satırla gösteriniz.`, lab: ["p -> q", "q -> p"],
                    a: R`$p = 1$, $q = 0$ için $p \rightarrow q = 0$ ama $q \rightarrow p = 1$.`, s: [R`Denk olmamaları için iki önermenin farklı değer aldığı tek bir satır bulmak yeter.`, R`$p = 0$, $q = 1$ satırı da işe yarar: $p \rightarrow q = 1$, $q \rightarrow p = 0$.`] },
                { no: 5, q: R`“Hava güzelse pikniğe gideriz.” önermesinin karşıtını, tersini ve karşıt tersini yazınız. Hangisi asıl önermeye denktir?`,
                    a: "Karşıt ters denktir.", s: [R`Karşıt ($q \rightarrow p$): “Pikniğe gidiyorsak hava güzeldir.”`, R`Ters ($\lnot p \rightarrow \lnot q$): “Hava güzel değilse pikniğe gitmeyiz.”`, R`Karşıt ters ($\lnot q \rightarrow \lnot p$): “Pikniğe gitmiyorsak hava güzel değildir.” — asıl önermeye denk.`] },
            ],
        },
        {
            id: "alistirma-1-4", title: "Alıştırmalar · 1.2–1.4 Kapılar, Boole Cebiri, De Morgan", desc: "Devre çözümleme, sadeleştirme, kanonik biçim, De Morgan, NAND.", sections: ["1.2", "1.3", "1.4"],
            problems: [
                { no: 1, q: "Aşağıdaki sayıları dönüştürünüz.", parts: [
                    part("a", R`$(101101)_2 = (\;?\;)_{10}$`, "45", [R`$32 + 8 + 4 + 1 = 45$.`]),
                    part("b", R`$(37)_{10} = (\;?\;)_2$`, R`$(100101)_2$`, [R`$37 = 32 + 4 + 1$.`]),
                    part("c", R`$(255)_{10} = (\;?\;)_2$`, R`$(11111111)_2$`, [R`$255 = 2^8 - 1$: 8 bitin hepsi 1.`]),
                ] },
                { no: 2, q: R`$F = (A + \overline{B}) \cdot \overline{C}$ devresi için $A = 0$, $B = 0$, $C = 0$ ve $A = 0$, $B = 1$, $C = 0$ girişlerinde çıkışı bulunuz.`, lab: ["(A + B')·C'"],
                    a: R`Birinci durumda $F = 1$, ikincide $F = 0$.`, s: [R`$000$: $A + \overline{B} = 0 + 1 = 1$, $\overline{C} = 1$ → $F = 1$.`, R`$010$: $A + \overline{B} = 0 + 0 = 0$ → $F = 0$.`] },
                { no: 3, q: "Aşağıdaki ifadeleri Boole cebiri kurallarıyla sadeleştiriniz.", parts: [
                    part("a", R`$AB + A\overline{B}$`, "A", [R`$A(B + \overline{B}) = A \cdot 1$.`], ["AB + AB'"]),
                    part("b", R`$A(A + B)$`, "A", [R`$AA + AB = A + AB = A(1 + B) = A$.`], ["A(A + B)"]),
                    part("c", R`$\overline{A}B + AB + A\overline{B}$`, R`$A + B$`, [R`$\overline{A}B + AB = B$.`, R`$B + A\overline{B} = (B + A)(B + \overline{B}) = A + B$.`], ["A'B + AB + AB'"]),
                    part("d", R`$AB + \overline{A}C + BC$`, R`$AB + \overline{A}C$`, [R`$BC = BC(A + \overline{A}) = ABC + \overline{A}BC$.`, R`$ABC$, $AB$ tarafından; $\overline{A}BC$, $\overline{A}C$ tarafından yutulur (uzlaşma teoremi).`], ["AB + A'C + BC"]),
                    part("e", R`$(A + B)(\overline{A} + C)(B + C)$`, R`$(A + B)(\overline{A} + C)$`, [R`Uzlaşma teoreminin dual (VE) biçimi: $(B + C)$ terimi fazladır.`], ["(A + B)(A' + C)(B + C)", "(A + B)(A' + C)"]),
                ] },
                { no: 4, q: R`Doğruluk tablosu verilen $F(A, B, C)$, yalnızca $ABC = 011, 101, 110, 111$ için $1$'dir. $F$'yi $\sum m$ biçiminde yazıp sadeleştiriniz. Bu hangi fonksiyondur?`, lab: ["A'BC + AB'C + ABC' + ABC"],
                    a: R`$F = \sum m(3, 5, 6, 7) = AB + AC + BC$ (çoğunluk fonksiyonu).`, s: [R`$F = \overline{A}BC + A\overline{B}C + AB\overline{C} + ABC$.`, R`$ABC$'yi üç kez kullan (tekrar kuralı: $X = X + X + X$): $(\overline{A}BC + ABC) + (A\overline{B}C + ABC) + (AB\overline{C} + ABC)$.`, R`$= BC + AC + AB$.`, R`En az iki giriş 1 iken 1: çoğunluk (oylama) devresi; tam toplayıcının eldesi de budur.`] },
                { no: 5, q: "Tersleme çizgilerini De Morgan ile değişkenlere kadar indiriniz.", parts: [
                    part("a", R`$\overline{A + \overline{B}C}$`, R`$\overline{A}(B + \overline{C})$`, [R`$\overline{A} \cdot \overline{\overline{B}C} = \overline{A}(B + \overline{C})$.`], ["(A + B'C)'", "A'(B + C')"]),
                    part("b", R`$\overline{(A + B)\,\overline{C}}$`, R`$\overline{A}\,\overline{B} + C$`, [R`$\overline{A + B} + \overline{\overline{C}} = \overline{A}\,\overline{B} + C$.`], ["((A + B)C')'", "A'B' + C"]),
                    part("c", R`$\lnot(p \rightarrow q)$`, R`$p \land \lnot q$`, [R`$p \rightarrow q \equiv \lnot p \lor q$.`, R`$\lnot(\lnot p \lor q) = p \land \lnot q$.`]),
                ] },
                { no: 6, q: R`$F = AB + \overline{C}$ fonksiyonunu yalnızca 2 girişli NAND kapılarıyla gerçekleştiriniz. Kaç kapı gerekir?`, lab: ["(A nand B) nand C", "AB + C'"],
                    a: R`$F = \overline{\overline{AB} \cdot C}$; 2 NAND kapısı yeter.`, s: [R`Çift tersleme: $F = \overline{\overline{AB + \overline{C}}} = \overline{\overline{AB} \cdot \overline{\overline{C}}} = \overline{\overline{AB} \cdot C}$.`, R`1. NAND: $\overline{AB}$. 2. NAND: girişleri $\overline{AB}$ ve $C$.`, R`Dikkat: $\overline{C}$'yi ayrıca terslemeye gerek kalmadı; De Morgan çift terslemeyi yok etti. (Mekanik çevirme 3 NAND verir: $C$ NAND $C$ ile $\overline{C}$, sonra onun da tersi… ama gereksiz.)`] },
            ],
        },
        {
            id: "alistirma-1-5", title: "Alıştırmalar · 1.5 Karnaugh Haritaları", desc: "3 ve 4 değişkenli haritalar, önemsiz durumlar.", sections: ["1.5"],
            problems: [
                { no: 1, q: R`$F(A, B, C) = \sum m(1, 3, 5, 7)$ fonksiyonunu sadeleştiriniz.`, lab: ["A'B'C + A'BC + AB'C + ABC"],
                    a: R`$F = C$`, s: [R`$01$ ve $11$ sütunları (her iki satırda) 1 → 4'lü grup.`, R`Bu hücrelerde yalnızca $C = 1$ sabit.`] },
                { no: 2, q: R`$F(A, B, C) = \sum m(0, 1, 2, 3, 6, 7)$ fonksiyonunu sadeleştiriniz.`, lab: ["A'B'C' + A'B'C + A'BC' + A'BC + ABC' + ABC"],
                    a: R`$F = \overline{A} + B$`, s: [R`Üst satırın tamamı ($m_0$–$m_3$) → $\overline{A}$.`, R`$m_6, m_7$ ile $m_2, m_3$ (11 ve 10 sütunları, iki satır) → $B$.`, R`$F = \overline{A} + B$ (bu aslında $A \rightarrow B$'dir!).`] },
                { no: 3, q: R`$F(A, B, C, D) = \sum m(0, 1, 4, 5, 10, 11, 14, 15)$ fonksiyonunu sadeleştiriniz.`, lab: ["A'B'C'D' + A'B'C'D + A'BC'D' + A'BC'D + AB'CD' + AB'CD + ABCD' + ABCD"],
                    a: R`$F = \overline{A}\,\overline{C} + AC$`, s: [R`$m_0, m_1, m_4, m_5$: ilk iki satır × ilk iki sütun → $A = 0$, $C = 0$ → $\overline{A}\,\overline{C}$.`, R`$m_{10}, m_{11}, m_{14}, m_{15}$: son iki satır × son iki sütun → $A = 1$, $C = 1$ → $AC$.`, R`$F = \overline{A}\,\overline{C} + AC = \overline{A \oplus C}$.`] },
                { no: 4, q: R`$F(A, B, C, D) = \sum m(1, 3, 7, 11, 15) + d(0, 2, 5)$ fonksiyonunu sadeleştiriniz.`, lab: ["A'B'C'D + A'B'CD + A'BCD + AB'CD + ABCD", "", "0, 2, 5"],
                    a: R`$F = CD + \overline{A}\,\overline{B}$ &nbsp;(ya da aynı ölçüde sade: $F = CD + \overline{A}D$)`, s: [R`$m_3, m_7, m_{11}, m_{15}$: $CD = 11$ sütununun tamamı → $CD$.`, R`$m_1$ kaldı. İki eşit seçenek var: $m_0, m_1, m_2, m_3$ (X'lerle ilk satır) → $\overline{A}\,\overline{B}$; ya da $m_1, m_3, m_5, m_7$ ($d_5$ ile) → $\overline{A}D$.`, R`İkisi de 2 harfli; ikisi de doğru en sade çözümdür. Kullanılmayan X'ler 0 sayılır.`] },
                { no: 5, q: R`Bir lamba üç anahtardan ($A, B, C$) kontrol ediliyor: anahtarlardan herhangi biri konum değiştirince lamba durum değiştirmeli; hepsi 0 iken lamba sönük. $F$'yi bulunuz. K-haritası bu fonksiyonu sadeleştirebilir mi?`, lab: ["A ^ B ^ C"],
                    a: R`$F = A \oplus B \oplus C = \sum m(1, 2, 4, 7)$; K-haritasında hiçbir 1 komşu değildir, SOP olarak sadeleşmez.`, s: [R`Her anahtar değişimi 1'lerin sayısının tek/çift olmasını değiştirir; hepsi 0 iken sönük → 1'lerin sayısı tekken yanar.`, R`$\sum m(1, 2, 4, 7)$: haritada dama tahtası deseni oluşur.`, R`Komşu 1 yok → gruplar tek hücre → 4 terimli SOP. Ama XOR kapılarıyla 2 kapıda kurulur. K-haritası yalnızca VE-VEYA biçimini sadeleştirir.`] },
            ],
        },
        {
            id: "alistirma-1-6", title: "Alıştırmalar · 1.6 Toplayıcılar ve Flip-floplar", desc: "İkili toplama, toplayıcı devreleri, MUX, flip-flop zamanlaması, sayaçlar.", sections: ["1.6"],
            problems: [
                { no: 1, q: "Aşağıdaki ikili toplamaları yapınız ve onluk sistemde kontrol ediniz.", parts: [
                    part("a", R`$(0101)_2 + (0011)_2$`, R`$(1000)_2 = 8$`, [R`$5 + 3 = 8$. Eldeler: $1 + 1 = 10$ → 0, elde 1; $0 + 1 + 1 = 10$ → 0, elde 1; $1 + 0 + 1 = 10$ → 0, elde 1; $0 + 0 + 1 = 1$.`]),
                    part("b", R`$(1111)_2 + (0001)_2$ (4 bit)`, R`$(0000)_2$, $C_{out} = 1$`, [R`$15 + 1 = 16 = (10000)_2$: 4 bite sığmaz → taşma.`]),
                    part("c", R`$(1010)_2 + (0110)_2$`, R`$(10000)_2 = 16$`, [R`$10 + 6 = 16$.`]),
                ] },
                { no: 2, q: R`Tam toplayıcının $C_{out} = AB + C_{in}(A \oplus B)$ ifadesinin $AB + AC_{in} + BC_{in}$ ifadesine eşit olduğunu gösteriniz.`, lab: ["AB + C(A ^ B)", "AB + AC + BC"],
                    a: "İki ifade de çoğunluk fonksiyonudur; eşittir.", s: [R`$A \oplus B = A\overline{B} + \overline{A}B$ → $C_{in}(A \oplus B) = A\overline{B}C_{in} + \overline{A}BC_{in}$.`, R`$AB + A\overline{B}C_{in} = A(B + \overline{B}C_{in}) = A(B + C_{in}) = AB + AC_{in}$.`, R`Benzer şekilde $AB + \overline{A}BC_{in} = AB + BC_{in}$. Hepsi birlikte: $AB + AC_{in} + BC_{in}$.`] },
                { no: 3, q: R`4→1 MUX'ta $D_0 = 1$, $D_1 = 0$, $D_2 = 0$, $D_3 = 1$ sabitlenmiş, seçicilere $S_1 = A$, $S_0 = B$ bağlanmıştır. Çıkış hangi fonksiyondur?`, lab: ["A'B' + AB"],
                    a: R`$Y = \overline{A}\,\overline{B} + AB = \overline{A \oplus B}$ (XNOR)`, s: [R`$AB = 00$ → $D_0 = 1$; $01$ → $D_1 = 0$; $10$ → $D_2 = 0$; $11$ → $D_3 = 1$.`, R`Çıkış, girişler aynıyken 1: XNOR.`] },
                { no: 4, q: R`Başlangıçta $Q = 0$ olan bir T flip-flopa saat kenarlarında sırasıyla $T = 1, 0, 1, 1, 0, 1$ uygulanıyor. Her kenardan sonra $Q$'yu bulunuz.`,
                    a: R`$Q$: $1, 1, 0, 1, 1, 0$`, s: [R`$Q^+ = T \oplus Q$.`, R`$0 \oplus 1 = 1$; $1 \oplus 0 = 1$; $1 \oplus 1 = 0$; $0 \oplus 1 = 1$; $1 \oplus 0 = 1$; $1 \oplus 1 = 0$.`] },
                { no: 5, q: R`0'dan 9'a sayıp başa dönen (onluk / BCD) bir sayaç en az kaç flip-flop gerektirir? 1000 farklı durum için kaç flip-flop gerekir?`,
                    a: "4 flip-flop; 1000 durum için 10 flip-flop.", s: [R`$n$ flip-flop $2^n$ durum verir. $2^3 = 8 < 10 \le 16 = 2^4$ → 4.`, R`$2^9 = 512 < 1000 \le 1024 = 2^{10}$ → 10.`] },
            ],
        },
    ];

    global.PRACTICE = global.PRACTICE || { tests: [], problemSets: [] };
    tests.forEach((t) => (t.chapter = "mantik"));
    problemSets.forEach((s) => (s.chapter = "mantik"));
    global.PRACTICE.tests.push(...tests);
    global.PRACTICE.problemSets.push(...problemSets);
})(window);
