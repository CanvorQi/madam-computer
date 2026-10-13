/*
 * Basit bilgisayar - SAP-1 benzeri 8 bitlik işlemci.
 * Kontrol birimi, kod çözücü, yazmaçlar ve ALU mantık kapılarıyla tanımlanır.
 * Widgets.cpu(root, opts)
 */
(function (global) {
    "use strict";

    const L = Logic;
    const { el, chips, lamp } = Widgets._helpers;

    const OPS = { NOP: 0, LDA: 1, ADD: 2, SUB: 3, STA: 4, LDI: 5, JMP: 6, JC: 7, JZ: 8, OUT: 14, HLT: 15 };
    const NAME = {};
    Object.keys(OPS).forEach((k) => (NAME[OPS[k]] = k));
    const HAS_ARG = ["LDA", "ADD", "SUB", "STA", "LDI", "JMP", "JC", "JZ"];
    const OP_INFO = {
        NOP: "hiçbir şey yapma", LDA: "A ← RAM[adres]", ADD: "A ← A + RAM[adres]", SUB: "A ← A − RAM[adres]", STA: "RAM[adres] ← A",
        LDI: "A ← sayı (0–15)", JMP: "adrese atla", JC: "elde varsa atla", JZ: "sonuç 0 ise atla", OUT: "A'yı ekrana yaz", HLT: "dur",
    };

    const V = L.V, NOT = L.NOT;
    const and = (...xs) => L.chain("and", xs), or = (...xs) => L.chain("or", xs);
    const T = [0, 1, 2, 3, 4].map((k) => V("T" + k));
    const D = {};
    Object.keys(OPS).forEach((k) => (D[k] = V(k)));

    // Kontrol birimi: her sinyal, adım sayacı (T0–T4) ile kod çözücü çıkışlarının Boole ifadesidir
    const CTRL = {
        HLT: and(T[2], D.HLT),
        MI: or(T[0], and(T[2], or(D.LDA, D.ADD, D.SUB, D.STA))),
        RI: and(T[3], D.STA),
        RO: or(T[1], and(T[3], or(D.LDA, D.ADD, D.SUB))),
        IO: and(T[2], or(D.LDA, D.ADD, D.SUB, D.STA, D.LDI, D.JMP, D.JC, D.JZ)),
        II: T[1],
        AI: or(and(T[3], D.LDA), and(T[2], D.LDI), and(T[4], or(D.ADD, D.SUB))),
        AO: or(and(T[3], D.STA), and(T[2], D.OUT)),
        EO: and(T[4], or(D.ADD, D.SUB)),
        SU: and(T[4], D.SUB),
        BI: and(T[3], or(D.ADD, D.SUB)),
        OI: and(T[2], D.OUT),
        CE: T[1],
        CO: T[0],
        J: and(T[2], or(D.JMP, and(D.JC, V("C")), and(D.JZ, V("Z")))),
        FI: and(T[4], or(D.ADD, D.SUB)),
    };
    const SIGS = Object.keys(CTRL);
    const SIG_INFO = {
        HLT: "saati durdur", MI: "bus → MAR", RI: "bus → RAM", RO: "RAM → bus", IO: "IR (adres kısmı) → bus", II: "bus → IR",
        AI: "bus → A", AO: "A → bus", EO: "ALU → bus", SU: "ALU çıkarma yapsın", BI: "bus → B", OI: "bus → OUT",
        CE: "PC'yi 1 artır", CO: "PC → bus", J: "bus → PC (atla)", FI: "bayrakları (C, Z) kaydet",
    };

    // Kod çözücü: opcode = I7 I6 I5 I4; her komut hattı 4 girişli bir AND kapısıdır
    const decodeAst = (op) => and(...[3, 2, 1, 0].map((b) => ((op >> b) & 1 ? V("I" + (4 + b)) : NOT(V("I" + (4 + b))))));

    const P = (name, arg) => (OPS[name] << 4) | (arg || 0);
    const PROGRAMS = [
        { label: "28 + 14 − 5", desc: "RAM'deki üç sayıyı toplar ve çıkarır, sonucu OUT'a yazar. Toplama ve çıkarmayı aynı ALU (tam toplayıcı zinciri) yapar.",
            code: [P("LDA", 13), P("ADD", 14), P("SUB", 15), P("OUT"), P("HLT")], data: { 13: 28, 14: 14, 15: 5 } },
        { label: "Geri sayım", desc: "5'ten 0'a kadar sayar. SUB'dan sonra Z bayrağı (sonuç sıfır mı?) 1 olunca JZ döngüden çıkar.",
            code: [P("LDI", 5), P("OUT"), P("SUB", 15), P("JZ", 5), P("JMP", 1), P("OUT"), P("HLT")], data: { 15: 1 } },
        { label: "Çarpma 3 × 4", desc: "Bu işlemcide çarpma komutu yok! 3'ü 4 kez toplayarak çarpar. Sayaç 0'ın altına inince C bayrağı 0 olur ve döngü biter.",
            code: [P("LDA", 15), P("SUB", 12), P("JC", 6), P("LDA", 13), P("OUT"), P("HLT"), P("STA", 15), P("LDA", 13), P("ADD", 14), P("STA", 13), P("JMP", 0)],
            data: { 12: 1, 13: 0, 14: 3, 15: 4 } },
        { label: "Fibonacci", desc: "0, 1, 1, 2, 3, 5, 8 … dizisini üretir. Toplam 255'i aşınca C bayrağı 1 olur ve JC programı durdurur.",
            code: [P("LDA", 13), P("OUT"), P("ADD", 14), P("JC", 10), P("STA", 15), P("LDA", 14), P("STA", 13), P("LDA", 15), P("STA", 14), P("JMP", 0), P("HLT")],
            data: { 13: 0, 14: 1, 15: 0 } },
    ];

    const bin = (v, w) => L.bin(v, w);
    const disasm = (v) => {
        const name = NAME[v >> 4];
        if (!name) return "?";
        return HAS_ARG.includes(name) ? `${name} ${v & 15}` : name;
    };

    // Parça rehberi: ne olduğu, kapılarla nasıl yapıldığı ve şu anki durumu (x = { st, cw, al, bus })
    const PARTS = [
        { id: "pc", chip: "PC", title: "Program sayacı (PC)", sigs: ["CO", "CE", "J"],
            what: "Sıradaki komutun RAM'deki adresini tutar. Bilgisayar her komutu getirdikten sonra PC'yi 1 artırır; böylece komutlar sırayla çalışır. Atlama komutları (JMP, JC, JZ) PC'ye yeni bir adres yazarak bu sırayı değiştirir — döngüler ve kararlar böyle yapılır.",
            gates: "4 bitlik bir sayaçtır: her bit bir flip-flop. CE = 1 iken saat darbesinde 1 artar (bir toplayıcı ya da T flip-flop zinciriyle); J = 1 iken bir MUX, artırılmış değer yerine bus'taki adresi seçer.",
            now: ({ st, cw, bus }) => `PC = <b>${st.pc}</b> (${bin(st.pc, 4)}). Sıradaki komut ${st.pc}. adreste: <b>${disasm(st.ram[st.pc])}</b>.` +
                (cw.CO ? " Bu adımda değerini bus'a veriyor; MAR onu yakalayacak." : "") +
                (cw.J ? ` Bu darbede bus'taki <b>${bus & 15}</b> adresine atlayacak.` : cw.CE ? ` Bu darbede 1 artıp <b>${(st.pc + 1) & 15}</b> olacak.` : "") },
        { id: "mar", chip: "MAR", title: "Bellek adres yazmacı (MAR)", sigs: ["MI"],
            what: "RAM'in hangi hücresine bakılacağını tutar. Adres bus'tan RAM'e doğrudan verilmez: önce MAR'a yazılır, MAR da RAM'e sürekli “şu hücre” der. Böylece bus serbest kalır ve bir sonraki adımda hücrenin içeriğini taşıyabilir.",
            gates: "4 D flip-flop ve her biri için yükleme MUX'u (“İçine bak → Yazmaç biti”). Çıkışı RAM'in adres kod çözücüsüne bağlıdır.",
            now: ({ st, cw, bus }) => `MAR = <b>${st.mar}</b> (${bin(st.mar, 4)}): RAM şu an ${st.mar}. hücreyi gösteriyor (içinde ${st.ram[st.mar]} var).` +
                (cw.MI ? ` Bu darbede bus'taki <b>${bus & 15}</b> adresini alacak.` : "") },
        { id: "ram", chip: "RAM", title: "RAM (bellek)", sigs: ["RO", "RI"],
            what: "16 hücrelik bellek; her hücre 8 bit (1 bayt). Hem program (komutlar) hem veri (sayılar) aynı bellekte durur — buna <b>von Neumann mimarisi</b> denir. Bir hücredeki 8 bitin komut mu sayı mı olduğunu bellek bilmez; onu nasıl kullandığımız belirler.",
            gates: "Her hücre 8 D flip-flop'tur (16 × 8 = 128 flip-flop). MAR'daki 4 bitlik adres bir 4→16 kod çözücüye girer; yalnızca seçilen hücrenin satırı açılır. RO ile o hücre bus'a, RI ile bus'taki değer o hücreye yazılır.",
            now: ({ st, cw, bus }) => `MAR'ın gösterdiği hücre: [${st.mar}] = <b>${st.ram[st.mar]}</b> (${bin(st.ram[st.mar], 8)})${st.mar < st.codeLen ? `, komut olarak: <b>${disasm(st.ram[st.mar])}</b>` : ", veri olarak kullanılıyor"}.` +
                (cw.RO ? " Bu adımda içeriğini bus'a veriyor." : "") + (cw.RI ? ` Bu darbede bus'taki <b>${bus}</b> değerini bu hücreye yazacak.` : "") },
        { id: "ir", chip: "IR", title: "Komut yazmacı (IR)", sigs: ["II", "IO"],
            what: "RAM'den getirilen komutu, yürütülürken tutar. Üst 4 bit <b>işlem kodudur</b> (opcode: ne yapılacak), alt 4 bit <b>adres ya da sayıdır</b> (neyle yapılacak). Örneğin 0010 1110 = ADD 14: “14. hücredeki sayıyı A'ya ekle”.",
            gates: "8 D flip-flop. Üst 4 bit kontrol birimindeki kod çözücüye gider; alt 4 bit IO sinyaliyle bus'a çıkabilir.",
            now: ({ st, cw }) => {
                const op = NAME[st.ir >> 4];
                return `IR = ${bin(st.ir >> 4, 4)} ${bin(st.ir & 15, 4)} → opcode ${st.ir >> 4} = <b>${op || "?"}</b> (${OP_INFO[op] || "tanımsız"}), alt 4 bit = <b>${st.ir & 15}</b>.` +
                    (cw.II ? " Bu darbede RAM'den gelen yeni komutu alacak." : "") + (cw.IO ? ` Bu adımda alt 4 biti (${st.ir & 15}) bus'a veriyor.` : "");
            } },
        { id: "a", chip: "A", title: "A yazmacı (akümülatör)", sigs: ["AI", "AO"],
            what: "Hesapların biriktiği ana yazmaç. ALU'nun bir girişi her zaman A'dır; toplama ve çıkarmanın sonucu da A'ya geri yazılır. LDA ve LDI A'ya sayı yükler, STA A'yı belleğe yazar, OUT A'yı ekrana gönderir.",
            gates: "8 D flip-flop, her birinin önünde AI ile kontrol edilen bir yükleme MUX'u. Çıkışı hem ALU'ya hem (AO ile) bus'a gider.",
            now: ({ st, cw, bus }) => `A = <b>${st.a}</b> (${bin(st.a, 8)}).` + (cw.AI ? ` Bu darbede bus'taki <b>${bus}</b> değerini alacak.` : "") + (cw.AO ? " Bu adımda değerini bus'a veriyor." : "") },
        { id: "alu", chip: "ALU", title: "ALU (aritmetik mantık birimi)", sigs: ["EO", "SU", "FI"],
            what: "A ile B'yi toplar ya da çıkarır. Hiç durmadan hesap yapar — girişler değişince sonuç hemen değişir — ama sonucu bus'a yalnızca EO açılınca verir.",
            gates: "8 tam toplayıcı zinciri (her biri 2 XOR, 2 AND, 1 OR) ve B'yi terslemek için 8 XOR. SU = 1 iken A − B = A + B̅ + 1 olur, yani çıkarma için ayrı bir devre gerekmez.",
            now: ({ st, cw, al }) => {
                const sub = cw.SU, sign = sub ? "−" : "+";
                let s = `Şu an ${sub ? "çıkarma" : "toplama"} modunda: ${st.a} ${sign} ${st.b} → <b>${al.s}</b> (${bin(al.s, 8)}), elde C = ${al.c}, sıfır Z = ${al.z}.`;
                if (!sub && st.a + st.b > 255) s += " Toplam 255'i aştı; 8 bite sığmayan 1, elde (C = 1) olarak çıkıyor.";
                if (sub && st.a < st.b) s += ` A < B olduğundan borç var (C = 0); sonuç ikiye tümleyen gösterimde ${al.s - 256} demek.`;
                return s + (cw.EO ? " Bu adımda sonucu bus'a veriyor." : "") + (cw.FI ? " Bu darbede C ve Z bayraklara kaydedilecek." : "");
            } },
        { id: "flags", chip: "Bayraklar", title: "Bayraklar (C ve Z)", sigs: ["FI"],
            what: "Son ADD/SUB'un sonucu hakkında iki bit. <b>C</b> (carry, elde): toplama 255'i aştıysa ya da çıkarmada borç yoksa 1. <b>Z</b> (zero, sıfır): sonuç 0 ise 1. Koşullu atlamalar (JC, JZ) bunlara bakar — bilgisayarın “karar verme” yeteneği buradan gelir.",
            gates: "2 D flip-flop, FI ile yüklenir. C, en soldaki tam toplayıcının elde çıkışıdır. Z, sonucun 8 bitinin NOR'udur: Z = (S7 + S6 + … + S0)'.",
            now: ({ st, cw }) => {
                let s = `C = <b>${st.c}</b> (${st.c ? "son işlemde elde vardı / borç yoktu" : "son işlemde elde yoktu / borç vardı"}), Z = <b>${st.z}</b> (${st.z ? "son sonuç 0'dı" : "son sonuç 0 değildi"}).`;
                const op = NAME[st.ir >> 4];
                if (st.t === 2 && (op === "JC" || op === "JZ")) s += ` ${op} şimdi ${op === "JC" ? "C" : "Z"}'ye bakıyor: atlama <b>${cw.J ? "olacak" : "olmayacak"}</b>.`;
                return s;
            } },
        { id: "b", chip: "B", title: "B yazmacı", sigs: ["BI"],
            what: "ALU'nun ikinci girişi. ADD ve SUB komutları, RAM'deki sayıyı önce B'ye koyar; sonra ALU A ile B'yi işler.",
            gates: "8 D flip-flop ve yükleme MUX'ları (BI). Çıkışı yalnızca ALU'ya gider; bus'a yazamaz.",
            now: ({ st, cw, bus }) => `B = <b>${st.b}</b> (${bin(st.b, 8)}).` + (cw.BI ? ` Bu darbede bus'taki <b>${bus}</b> değerini alacak.` : "") },
        { id: "out", chip: "OUT", title: "Çıkış yazmacı (OUT)", sigs: ["OI"],
            what: "Bilgisayarın dış dünyaya gösterdiği sayı. Gerçek devrede 7 segmentli ekranlara bağlanır. OUT komutu A'daki değeri buraya kopyalar.",
            gates: "8 D flip-flop (OI ile yüklenir) ve ikili sayıyı ekran rakamlarına çeviren bir kod çözücü.",
            now: ({ st, cw, bus }) => `OUT = <b>${st.out === null ? "henüz boş" : st.out}</b>. Şimdiye kadarki çıktılar: ${st.outs.join(", ") || "yok"}.` + (cw.OI ? ` Bu darbede bus'taki <b>${bus}</b> değerini gösterecek.` : "") },
        { id: "bus", chip: "Bus", title: "Bus (ortak veri yolu)", sigs: ["CO", "RO", "IO", "AO", "EO"],
            what: "8 paralel telden oluşan ortak yol. Parçalar birbirine tek tek bağlanmaz; hepsi bu yolu paylaşır. Aynı anda yalnızca <b>bir</b> parça bus'a yazabilir (yoksa teller çakışır), ama birden fazla parça okuyabilir.",
            gates: "Her çıkış bus'a <b>üç durumlu (tri-state) tamponla</b> bağlanır: sinyali kapalıyken çıkış tele hiç bağlı değilmiş gibi davranır. Kontrol birimi CO, RO, IO, AO, EO'dan aynı anda en fazla birini açar.",
            now: ({ cw, bus }) => {
                const W8 = { CO: "PC", RO: "RAM", IO: "IR", AO: "A", EO: "ALU" }, R8 = { MI: "MAR", RI: "RAM", II: "IR", AI: "A", BI: "B", OI: "OUT", J: "PC" };
                const w = Object.keys(W8).find((s) => cw[s]), r = Object.keys(R8).filter((s) => cw[s]).map((s) => R8[s]);
                return w ? `Bus'a şu an <b>${W8[w]}</b> yazıyor: <b>${bus}</b> (${bin(bus, 8)}). Okuyan: <b>${r.join(", ") || "kimse"}</b>.` : "Şu an bus'a kimse yazmıyor; teller boşta.";
            } },
        { id: "clk", chip: "Saat ve adımlar", title: "Saat ve adım sayacı", sigs: [],
            what: "Saat, bilgisayarın kalp atışıdır: her darbede (yükselen kenarda) yükleme sinyali açık olan yazmaçlar bus'taki değeri aynı anda yakalar. Her komut birkaç <b>mikro adımda</b> (T0–T4) yürür: T0–T1 <b>getirme</b> (fetch), T2'den sonrası <b>yürütme</b> (execute).",
            gates: "Saat, düzenli 0-1 üreten bir osilatördür. Adım sayacı 3 bitlik bir sayaçtır (flip-floplar); çıkışı bir kod çözücüye girer, bu yüzden T0–T4 hatlarından aynı anda yalnızca biri 1'dir. Komut bitince sayaç sıfırlanır.",
            now: ({ st }) => st.halted ? `Saat <b>durdu</b> (HLT). Toplam ${st.cycles} darbe.` : `Şu an <b>T${st.t}</b> adımı (${st.t < 2 ? "getirme" : "yürütme"}). Program başladığından beri ${st.cycles} saat darbesi.` },
        { id: "ctl", chip: "Kontrol birimi", title: "Kontrol birimi", sigs: SIGS,
            what: "Orkestra şefidir: her adımda hangi parçanın bus'a yazacağına, hangilerinin okuyacağına karar verir. Girişleri: komut (IR'nin üst 4 biti), adım (T0–T4) ve bayraklar (C, Z). Çıkışı: 16 kontrol sinyali — buna <b>kontrol sözcüğü</b> denir.",
            gates: "Bir kod çözücü (her komut için 4 girişli bir AND) ve her sinyal için küçük bir AND-OR devresi (“İçine bak → Kontrol sinyalleri”). Gerçek makinelerde bu tablo bir ROM'a da yazılabilir; buna <b>mikrokod</b> denir.",
            now: ({ cw }) => {
                const on = Object.keys(cw).filter((s) => cw[s]);
                return on.length ? `Açık sinyaller: ${on.map((s) => `<b>${s}</b> (${SIG_INFO[s]})`).join(", ")}.` : "Şu an hiçbir kontrol sinyali açık değil.";
            } },
    ];

    // ALU: 8 tam toplayıcı; SU = 1 iken B'nin bitleri XOR ile terslenir ve ilk elde 1 olur
    function alu(a, b, su) {
        let c = su, s = 0;
        const cins = [];
        for (let i = 0; i < 8; i++) {
            const x = (a >> i) & 1, y = ((b >> i) & 1) ^ su;
            cins.push(c);
            s |= (x ^ y ^ c) << i;
            c = (x & y) | (c & (x ^ y));
        }
        return { s, c, z: s === 0 ? 1 : 0, cins };
    }

    function envOf(st) {
        const env = { C: st.c, Z: st.z };
        T.forEach((t, k) => (env[t.name] = st.t === k ? 1 : 0));
        Object.keys(OPS).forEach((k) => (env[k] = st.ir >> 4 === OPS[k] ? 1 : 0));
        for (let b = 4; b < 8; b++) env["I" + b] = (st.ir >> b) & 1;
        return env;
    }
    function control(st) {
        const env = envOf(st), cw = {};
        SIGS.forEach((s) => (cw[s] = L.evaluate(CTRL[s], env)));
        return cw;
    }
    function busOf(st, cw, al) {
        if (cw.CO) return st.pc;
        if (cw.RO) return st.ram[st.mar];
        if (cw.IO) return st.ir & 15;
        if (cw.AO) return st.a;
        if (cw.EO) return al.s;
        return null;
    }

    // Bir saat darbesi: yükselen kenarda, yükleme sinyali açık olan yazmaçlar bus'taki değeri yakalar
    function tick(st) {
        if (st.halted) return;
        const cw = control(st);
        if (cw.HLT) { st.halted = true; return; }
        const al = alu(st.a, st.b, cw.SU), bus = busOf(st, cw, al) || 0;
        if (cw.RI) st.ram[st.mar] = bus;
        if (cw.MI) st.mar = bus & 15;
        if (cw.II) st.ir = bus;
        if (cw.AI) st.a = bus;
        if (cw.BI) st.b = bus;
        if (cw.OI) { st.out = bus; st.outs.push(bus); }
        if (cw.J) st.pc = bus & 15;
        else if (cw.CE) st.pc = (st.pc + 1) & 15;
        if (cw.FI) { st.c = al.c; st.z = al.z; }
        st.cycles++;
        st.t++;
        // Sıradaki adımda hiçbir sinyal yoksa adım sayacı başa döner (komut bitti)
        if (st.t > 4) st.t = 0;
        else { const next = control(st); if (!SIGS.some((s) => next[s])) st.t = 0; }
    }

    const W = Widgets;
    W.cpu = function (root, o) {
        let pi = o.program || 0, st = null, timer = null;
        let look = 0, sigSel = null, reg = 0, bit = 0, part = "pc";
        const head = el(`<div></div>`), pdesc = el(`<p class="muted" style="margin:8px 0 0;font-size:13.5px"></p>`);
        const bar = el(`<div class="ex-actions" style="margin-top:10px">
            <button type="button" class="btn small" data-clk>⏱ Saat darbesi</button>
            <button type="button" class="btn small ghost" data-ins>⏭ Komutu bitir</button>
            <button type="button" class="btn small ghost" data-run>▶ Çalıştır</button>
            <button type="button" class="btn small ghost" data-rst>↺ Sıfırla</button></div>`);
        const main = el(`<div class="cpu-main"></div>`), info = el(`<div class="readout"></div>`);
        const insideHead = el(`<div><div class="section-title" style="margin:18px 0 8px">İçine bak: hepsi mantık kapıları</div></div>`), inside = el(`<div class="cpu-inside"></div>`);
        const guideHead = el(`<div><div class="section-title" style="margin:18px 0 8px">Parçalar ve durumları <span class="muted" style="text-transform:none;letter-spacing:0;font-weight:500">· şemada bir parçaya dokun ya da seç</span></div></div>`);
        const guide = el(`<div class="cpu-guide"></div>`), cycle = el(`<div class="cpu-cycle"></div>`);
        [head, bar, main, info, guideHead, guide, cycle, insideHead, inside].forEach((x) => root.appendChild(x));
        const partRow = chips(guideHead, PARTS.map((p) => p.chip), 0, (i) => { part = PARTS[i].id; build(); });
        function setPart(id) {
            part = id;
            const idx = PARTS.findIndex((p) => p.id === id);
            partRow.querySelectorAll("button").forEach((b, i) => b.classList.toggle("active", i === idx));
            build();
            guide.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
        chips(head, PROGRAMS.map((p) => p.label), pi, (i) => { pi = i; load(); });
        head.appendChild(pdesc);
        chips(insideHead, ["Kod çözücü", "Kontrol sinyalleri", "Yazmaç biti", "ALU biti"], look, (i) => { look = i; build(); });

        const runBtn = bar.querySelector("[data-run]");
        const stop = () => { if (timer) clearInterval(timer); timer = null; runBtn.textContent = "▶ Çalıştır"; };
        bar.querySelector("[data-clk]").addEventListener("click", () => { stop(); tick(st); build(); });
        bar.querySelector("[data-ins]").addEventListener("click", () => {
            stop();
            for (let k = 0; k < 6 && !st.halted; k++) { tick(st); if (st.t === 0) break; }
            build();
        });
        runBtn.addEventListener("click", () => {
            if (timer) { stop(); return; }
            if (st.halted) load();
            runBtn.textContent = "⏸ Durdur";
            timer = setInterval(() => {
                if (!root.isConnected) { stop(); return; }
                tick(st);
                if (st.halted) stop();
                build();
            }, 260);
        });
        bar.querySelector("[data-rst]").addEventListener("click", load);

        function load() {
            stop();
            const p = PROGRAMS[pi];
            st = { ram: new Array(16).fill(0), pc: 0, mar: 0, ir: 0, a: 0, b: 0, out: null, outs: [], c: 0, z: 0, t: 0, halted: false, cycles: 0, codeLen: p.code.length };
            p.code.forEach((v, i) => (st.ram[i] = v));
            Object.keys(p.data).forEach((k) => (st.ram[k] = p.data[k]));
            pdesc.textContent = p.desc;
            build();
        }

        /* ---- Blok şeması (SVG) ---- */
        function diagram(cw, bus, al) {
            const p = [];
            p.push(`<defs><marker id="cpuArrOut" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path class="cpu-ah out" d="M0 0 L10 5 L0 10 Z"/></marker>
                <marker id="cpuArrIn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path class="cpu-ah in" d="M0 0 L10 5 L0 10 Z"/></marker></defs>`);
            // Bus: 8 paralel tel
            const sel = (id) => `cpu-part${part === id ? " sel" : ""}" data-part="${id}`;
            p.push(`<g class="${sel("bus")}"><rect class="cpu-hit" x="346" y="0" width="68" height="386"/><text class="cpu-busname" x="380" y="14">BUS ${bus === null ? "(boş)" : `= ${bus}`}</text>`);
            for (let k = 0; k < 8; k++) {
                const x = 355 + (7 - k) * 7;
                p.push(`<line class="lc-wire${bus !== null && (bus >> k) & 1 ? " on" : ""}" x1="${x}" y1="22" x2="${x}" y2="382"/>`);
            }
            p.push(`</g>`);
            const block = (id, x, y, title, desc, val, n, sigs, extra) => {
                const act = sigs.some((s) => cw[s]);
                let s = `<g class="${sel(id)}"><rect class="cpu-block${act ? " on" : ""}" x="${x}" y="${y}" width="290" height="72" rx="10"/>
                    <text class="cpu-title" x="${x + 12}" y="${y + 20}">${title}</text>`;
                sigs.forEach((sg, i) => {
                    const sx = x + 290 - 10 - (sigs.length - i) * 30;
                    s += `<g class="cpu-sig${cw[sg] ? " on" : ""}"><rect x="${sx}" y="${y + 8}" width="27" height="16" rx="5"/><text x="${sx + 13.5}" y="${y + 19.5}">${sg}</text></g>`;
                });
                for (let j = 0; j < n; j++) {
                    const b = (val >> (n - 1 - j)) & 1, bx = x + 12 + j * 18;
                    s += `<g class="cpu-bit${b ? " on" : ""}"><rect x="${bx}" y="${y + 31}" width="15" height="17" rx="3"/><text x="${bx + 7.5}" y="${y + 43.5}">${b}</text></g>`;
                }
                s += `<text class="cpu-val" x="${x + 20 + n * 18}" y="${y + 45}">= ${val}${extra ? ` <tspan class="cpu-extra">${extra}</tspan>` : ""}</text>
                    <text class="cpu-desc" x="${x + 12}" y="${y + 64}">${desc}</text></g>`;
                return s;
            };
            const link = (side, y, outSig, inSig) => {
                const mode = outSig && cw[outSig] ? "out" : inSig && cw[inSig] ? "in" : "";
                const [bx, bz] = side === "L" ? [310, 350] : [450, 410];
                const [x1, x2] = mode === "in" ? [bz, bx] : [bx, bz];
                return `<line class="cpu-link ${mode}" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"${mode ? ` marker-end="url(#cpuArr${mode === "out" ? "Out" : "In"})"` : ""}/>`;
            };
            const op = NAME[st.ir >> 4];
            // Sol sütun
            p.push(link("L", 66, "CO", "J"), link("L", 156, null, "MI"), link("L", 246, "RO", "RI"), link("L", 336, "IO", "II"));
            p.push(`<line class="cpu-int" x1="160" y1="102" x2="160" y2="120"/>`);
            p.push(`<line class="cpu-int" x1="160" y1="192" x2="160" y2="210"/><text class="cpu-desc" x="166" y="205">adres</text>`);
            p.push(`<line class="cpu-int" x1="160" y1="372" x2="160" y2="392"/><text class="cpu-desc" x="166" y="386">opcode (I7–I4)</text>`);
            p.push(block("pc", 20, 30, "Program sayacı (PC)", "Sıradaki komutun adresi · 4 T flip-flop", st.pc, 4, ["CO", "CE", "J"]));
            p.push(block("mar", 20, 120, "Bellek adres yazmacı (MAR)", "RAM'in hangi hücresi · 4 D flip-flop", st.mar, 4, ["MI"]));
            p.push(block("ram", 20, 210, `RAM [${st.mar}]`, "16 bayt bellek · adres kod çözücü + hücreler", st.ram[st.mar], 8, ["RO", "RI"], st.mar < st.codeLen ? disasm(st.ram[st.mar]) : ""));
            p.push(block("ir", 20, 300, "Komut yazmacı (IR)", "Üst 4 bit: komut · alt 4 bit: adres/sayı", st.ir, 8, ["II", "IO"], op || "?"));
            // Sağ sütun
            p.push(link("R", 66, "AO", "AI"), link("R", 156, "EO", null), link("R", 246, null, "BI"), link("R", 336, null, "OI"));
            p.push(`<line class="cpu-int" x1="600" y1="102" x2="600" y2="120"/><line class="cpu-int" x1="600" y1="192" x2="600" y2="210"/>`);
            p.push(block("a", 450, 30, "A yazmacı (akümülatör)", "8 D flip-flop", st.a, 8, ["AI", "AO"]));
            p.push(block("alu", 450, 120, `ALU: A ${cw.SU ? "−" : "+"} B`, `8 tam toplayıcı · C=${al.c} Z=${al.z} · bayrak: C=${st.c} Z=${st.z}`, al.s, 8, ["EO", "SU", "FI"]));
            p.push(block("b", 450, 210, "B yazmacı", "8 D flip-flop", st.b, 8, ["BI"]));
            p.push(block("out", 450, 300, "Çıkış (OUT)", "Ekrana giden yazmaç", st.out || 0, 8, ["OI"]));
            // Kontrol birimi
            p.push(`<g class="${sel("ctl")}"><rect class="cpu-block ctl" x="20" y="392" width="720" height="100" rx="10"/>
                <text class="cpu-title" x="32" y="412">Kontrol birimi · adım sayacı + kod çözücü + kontrol kapıları</text>`);
            T.forEach((t, k) => p.push(`<g class="cpu-sig${st.t === k ? " on" : ""}"><rect x="${32 + k * 36}" y="422" width="32" height="18" rx="5"/><text x="${48 + k * 36}" y="434.5">T${k}</text></g>`));
            p.push(`<text class="cpu-val" x="230" y="436">${st.halted ? "DURDU (HLT)" : st.t < 2 ? "Getir (fetch)" : `Yürüt: ${op || "?"}`}</text>`);
            p.push(`<text class="cpu-desc" x="728" y="436" text-anchor="end">saat: ${st.cycles} darbe</text>`);
            SIGS.forEach((s, k) => p.push(`<g class="cpu-sig${cw[s] ? " on" : ""}"><rect x="${32 + k * 44}" y="452" width="40" height="28" rx="6"/><text x="${52 + k * 44}" y="470">${s}</text></g>`));
            p.push(`</g>`);
            return `<svg class="cpu-svg" viewBox="0 0 760 500" width="760" style="max-width:100%;height:auto" role="img" aria-label="Basit bilgisayarın blok şeması">${p.join("")}</svg>`;
        }

        function memHtml() {
            let h = `<table class="mtable cpu-mem"><thead><tr><th>Adres</th><th>İçerik (dokun, değiştir)</th><th>Anlamı</th><th></th></tr></thead><tbody>`;
            for (let i = 0; i < 16; i++) {
                const v = st.ram[i], tags = [i === st.pc ? "PC" : "", i === st.mar ? "MAR" : ""].filter(Boolean);
                h += `<tr class="${i === st.pc ? "pc" : ""}${i === st.mar ? " mar" : ""}"><td class="mono">${bin(i, 4)} <small>(${i})</small></td>
                    <td class="cpu-mcell">${Array.from({ length: 8 }, (_, j) => { const b = (v >> (7 - j)) & 1; return `<button type="button" class="cpu-mbit${b ? " on" : ""}${j === 3 ? " gap" : ""}" data-m="${i}" data-b="${7 - j}">${b}</button>`; }).join("")}</td>
                    <td class="mono">${i < st.codeLen ? disasm(v) : `<span class="muted">veri: ${v}</span>`}</td><td class="cpu-tag">${tags.map((t) => `◀ ${t}`).join(" ")}</td></tr>`;
            }
            return h + `</tbody></table>`;
        }

        function stepText(cw, bus, al) {
            if (st.halted) return `<b>Durdu.</b> HLT komutu saati kapattı. Baştan çalıştırmak için ↺ Sıfırla.`;
            const op = NAME[st.ir >> 4];
            const SRC = { CO: `PC (${st.pc})`, RO: `RAM[${st.mar}] (${st.ram[st.mar]})`, IO: `IR'nin adres kısmı (${st.ir & 15})`, AO: `A (${st.a})`, EO: `ALU sonucu (${al.s})` };
            const DST = { MI: "MAR", RI: `RAM[${st.mar}]`, II: "IR", AI: "A", BI: "B", OI: "OUT", J: "PC" };
            const src = Object.keys(SRC).find((s) => cw[s]), dst = Object.keys(DST).filter((s) => cw[s]);
            const parts = [];
            if (src) parts.push(`${SRC[src]} bus'a çıkar${dst.length ? `, <b>${dst.map((d) => DST[d]).join(", ")}</b> onu yakalar` : ""}`);
            if (cw.CE) parts.push("PC bir artar");
            if (cw.SU) parts.push("ALU çıkarma yapar (B terslenir, elde = 1)");
            if (cw.FI) parts.push(`bayraklar kaydedilir: C = ${al.c}, Z = ${al.z}`);
            if (cw.HLT) parts.push("saat durdurulur");
            const phase = st.t === 0 ? "Getir: sıradaki komutun adresi MAR'a gider" : st.t === 1 ? "Getir: komut RAM'den IR'ye alınır" : `Yürüt <b>${op}</b> (${OP_INFO[op] || "tanımsız"})`;
            return `<b>T${st.t}</b> · ${phase}.<br>Sonraki saat darbesinde: ${parts.join("; ") || "bir şey olmaz"}.`;
        }

        function guideHtml(cw, bus, al) {
            const p = PARTS.find((x) => x.id === part);
            const sigs = p.sigs.length ? `<div class="cpu-sigrow">${p.sigs.map((s) => `<span class="cpu-pill${cw[s] ? " on" : ""}"><b>${s}</b> ${SIG_INFO[s]}</span>`).join("")}</div>` : "";
            return `<div class="cpu-card">
                <h3>${p.title}</h3>
                <p>${p.what}</p>
                <div class="cpu-now"><span class="cpu-now-lbl">Şu an</span> ${p.now({ st, cw, al, bus })}</div>
                <p class="muted" style="font-size:13.5px"><b>Kapılarla nasıl yapılır?</b> ${p.gates}</p>
                ${sigs ? `<div class="muted" style="font-size:12.5px;margin-bottom:4px">Kontrol sinyalleri (mor = şu an açık):</div>${sigs}` : ""}
            </div>`;
        }

        // Komut döngüsü: şu anki komutun her mikro adımında hangi sinyallerin açıldığı (kontrol kapılarından hesaplanır)
        function cycleHtml() {
            const op = NAME[st.ir >> 4];
            const SRC = { CO: "PC", RO: "RAM[MAR]", IO: "IR'nin adres kısmı", AO: "A", EO: "ALU" };
            const DST = { MI: "MAR", RI: "RAM[MAR]", II: "IR", AI: "A", BI: "B", OI: "OUT", J: "PC" };
            const rows = [];
            for (let k = 0; k < 5; k++) {
                const c = control(Object.assign({}, st, { t: k })), on = SIGS.filter((s) => c[s]);
                if (k >= 2 && !on.length) break;
                const src = Object.keys(SRC).find((s) => c[s]), dst = Object.keys(DST).filter((s) => c[s]).map((s) => DST[s]);
                const what = [];
                if (src) what.push(`${SRC[src]} → ${dst.join(", ") || "(okuyan yok)"}`);
                if (c.CE) what.push("PC + 1");
                if (c.SU) what.push("ALU çıkarır");
                if (c.FI) what.push("bayrakları kaydet");
                if (c.HLT) what.push("saati durdur");
                const cur = !st.halted && st.t === k;
                rows.push(`<tr class="${cur ? "cpu-cur" : ""}"><td class="mono"><b>T${k}</b>${cur ? " ◀" : ""}</td><td>${k < 2 ? "Getir" : "Yürüt"}</td>
                    <td>${on.map((s) => `<span class="cpu-pill on"><b>${s}</b></span>`).join(" ")}</td><td>${what.join(" · ")}</td></tr>`);
            }
            const cond = op === "JC" || op === "JZ" ? `<p class="muted" style="font-size:13px;margin:6px 0 0">${op}'de J sinyali yalnızca ${op === "JC" ? "C" : "Z"} = 1 iken açılır; şu an ${op === "JC" ? "C" : "Z"} = ${op === "JC" ? st.c : st.z}, yani atlama ${(op === "JC" ? st.c : st.z) ? "<b>olacak</b>" : "<b>olmayacak</b> ve komut T2'de bitecek"}.</p>` : "";
            return `<div class="section-title" style="margin:18px 0 8px">Komut döngüsü: ${st.ir === 0 && st.cycles < 2 ? "ilk komut getiriliyor" : `${op || "?"} — ${OP_INFO[op] || "tanımsız"}`}</div>
                <div class="table-wrap"><table class="mtable cpu-steps"><thead><tr><th>Adım</th><th>Aşama</th><th>Açık sinyaller</th><th>Ne olur?</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>
                ${cond}
                <p class="muted" style="font-size:13px;margin:6px 0 0">Her komut önce <b>getirilir</b> (T0: PC → MAR, T1: RAM → IR ve PC + 1 — bütün komutlarda aynı), sonra <b>yürütülür</b> (T2'den itibaren, komuta göre değişir). Komutun son adımından sonra adım sayacı T0'a döner ve sıradaki komut getirilir.${st.halted ? " <b>Bilgisayar durdu:</b> HLT saati kapattı." : ""}</p>`;
        }

        function insideHtml(cw, bus, al) {
            const env = envOf(st), op = st.ir >> 4;
            if (look === 0) {
                const lines = Object.keys(OPS).map((k) => lamp(env[k], k)).join("");
                return `<div class="circuit-stage">${L.circuitSvg(decodeAst(op), env, { out: NAME[op] || "?" })}</div>
                    <div class="cpu-lamps">${lines}</div>
                    <p class="muted" style="font-size:13px;margin:6px 0 0">IR'nin üst 4 biti I7 I6 I5 I4 = ${bin(op, 4)}. Her komutun kendi <b>4 girişli AND</b> kapısı vardır; 0 olması gereken bitler önce NOT'tan geçer. Bu yüzden aynı anda yalnızca bir hat (<b>${NAME[op] || "hiçbiri"}</b>) 1 olur — bu bir <b>4→16 kod çözücüdür</b>.</p>`;
            }
            if (look === 1) {
                if (!sigSel) sigSel = SIGS.find((s) => cw[s]) || "MI";
                const btns = SIGS.map((s) => `<button type="button" class="chip${s === sigSel ? " active" : ""}" data-sig="${s}">${s}${cw[s] ? " ●" : ""}</button>`).join("");
                return `<div class="chip-row">${btns}</div>
                    <div class="readout" style="margin-top:8px"><b>${sigSel}</b> = ${L.format(CTRL[sigSel], { mode: "html" })} &nbsp;→ şu an <b>${cw[sigSel]}</b> ${lamp(cw[sigSel])}<br><span class="muted" style="font-size:13px">${sigSel}: ${SIG_INFO[sigSel]}</span></div>
                    <div class="circuit-stage">${L.circuitSvg(CTRL[sigSel], env, { out: sigSel })}</div>
                    <p class="muted" style="font-size:13px;margin:6px 0 0">Kontrol biriminin “beyni” bu kapılardır. Girişler: adım sayacının hattı (T0–T4, aynı anda yalnızca biri 1), kod çözücünün komut hatları ve bayraklar (C, Z). ● işaretli sinyaller şu an açık.</p>`;
            }
            if (look === 2) {
                const REGS = [["A", "AI", st.a, 8], ["B", "BI", st.b, 8], ["IR", "II", st.ir, 8], ["OUT", "OI", st.out || 0, 8], ["MAR", "MI", st.mar, 4]];
                const [rn, ld, rv, rbits] = REGS[reg];
                if (bit >= rbits) bit = 0;
                const e = { L: cw[ld], B: bus === null ? 0 : (bus >> bit) & 1, Q: (rv >> bit) & 1 };
                return `<div class="chip-row">${REGS.map((r, i) => `<button type="button" class="chip${i === reg ? " active" : ""}" data-reg="${i}">${r[0]}</button>`).join("")}</div>
                    <div class="chip-row" style="margin-top:6px">${Array.from({ length: rbits }, (_, k) => `<button type="button" class="chip mono${k === bit ? " active" : ""}" data-bit="${k}">bit ${k}</button>`).join("")}</div>
                    <div class="circuit-stage" style="margin-top:8px">${L.circuitSvg(L.parse("L·B + L'·Q"), e, { out: "D" })}</div>
                    <p class="muted" style="font-size:13px;margin:6px 0 0"><b>L</b> = yükle sinyali (${ld} = ${e.L}), <b>B</b> = bus'ın ${bit}. biti (${e.B}), <b>Q</b> = ${rn} yazmacının şu anki ${bit}. biti (${e.Q}).
                    Bu küçük devre bir <b>2→1 MUX</b>'tur: L = 1 ise bus'taki biti, L = 0 ise eski değeri seçip bir <b>D flip-flop</b>'un D girişine verir. Saat darbesinde flip-flop bu değeri yakalar. ${rbits} tanesi yan yana = ${rbits} bitlik yazmaç.</p>`;
            }
            if (bit > 7) bit = 0;
            const e = { A: (st.a >> bit) & 1, B: (st.b >> bit) & 1, U: cw.SU, C: al.cins[bit] };
            return `<div class="chip-row">${Array.from({ length: 8 }, (_, k) => `<button type="button" class="chip mono${k === bit ? " active" : ""}" data-bit="${k}">bit ${k}</button>`).join("")}</div>
                <div class="adder-stage" style="margin-top:8px">
                    <div class="adder-col"><div class="section-title">Toplam S<sub>${bit}</sub></div>${L.circuitSvg(L.parse("A ⊕ (B ⊕ U) ⊕ C"), e, { out: "S" })}</div>
                    <div class="adder-col"><div class="section-title">Elde C<sub>${bit + 1}</sub></div>${L.circuitSvg(L.parse("A·(B ⊕ U) + C·(A ⊕ (B ⊕ U))"), e, { out: "C" })}</div></div>
                <p class="muted" style="font-size:13px;margin:6px 0 0"><b>A</b>, <b>B</b> = yazmaçların ${bit}. bitleri, <b>U</b> = SU (çıkarma) sinyali = ${e.U}, <b>C</b> = bir sağdaki bitten gelen elde = ${e.C}.
                ALU, bu tam toplayıcıdan 8 tane yan yana dizilmiş hâlidir. U = 1 olunca B ⊕ U, B'yi tersler: A − B = A + B̅ + 1.</p>`;
        }

        function build() {
            const cw = st.halted ? Object.fromEntries(SIGS.map((s) => [s, 0])) : control(st), al = alu(st.a, st.b, cw.SU), bus = st.halted ? null : busOf(st, cw, al);
            main.innerHTML = `<div class="cpu-diagram">${diagram(cw, bus, al)}</div><div class="cpu-memwrap"><div class="section-title" style="margin:0 0 6px">RAM (program + veri)</div><div class="table-wrap">${memHtml()}</div></div>`;
            main.querySelectorAll("[data-m]").forEach((b) => b.addEventListener("click", () => { st.ram[Number(b.dataset.m)] ^= 1 << Number(b.dataset.b); build(); }));
            info.innerHTML = `${stepText(cw, bus, al)}
                <div class="cpu-outrow"><span class="cpu-outlbl">OUT</span><span class="cpu-out">${st.out === null ? "—" : st.out}</span><span class="muted" style="font-size:13px">Çıktılar: ${st.outs.join(", ") || "henüz yok"}</span></div>`;
            main.querySelectorAll("[data-part]").forEach((g) => g.addEventListener("click", () => setPart(g.dataset.part)));
            guide.innerHTML = guideHtml(cw, bus, al);
            cycle.innerHTML = cycleHtml();
            inside.innerHTML = insideHtml(cw, bus, al);
            inside.querySelectorAll("[data-sig]").forEach((b) => b.addEventListener("click", () => { sigSel = b.dataset.sig; build(); }));
            inside.querySelectorAll("[data-reg]").forEach((b) => b.addEventListener("click", () => { reg = Number(b.dataset.reg); build(); }));
            inside.querySelectorAll("[data-bit]").forEach((b) => b.addEventListener("click", () => { bit = Number(b.dataset.bit); build(); }));
        }

        load();
    };

    W._cpu = { tick, control, alu, PROGRAMS, OPS, CTRL };
})(window);
