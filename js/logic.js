/*
 * Logic - Boole ifadesi motoru.
 * Ayrıştırma (A'B + C, !p & q, p -> q, A xor B ...), değerlendirme, doğruluk tablosu,
 * Quine–McCluskey ile en sade SOP/POS ve ifadeden otomatik kapı devresi çizimi (SVG).
 */
(function (global) {
    "use strict";

    /* ---------------- Ayrıştırıcı ---------------- */
    const KEYWORDS = { and: "and", ve: "and", or: "or", veya: "or", xor: "xor", nand: "nand", nor: "nor", xnor: "xnor", not: "not", "değil": "not", degil: "not" };
    const SYMBOLS = [
        ["<->", "iff"], ["<=>", "iff"], ["==", "iff"], ["↔", "iff"], ["⇔", "iff"], ["≡", "iff"],
        ["->", "imp"], ["=>", "imp"], ["→", "imp"], ["⇒", "imp"],
        ["&&", "and"], ["||", "or"],
        ["*", "and"], ["·", "and"], ["⋅", "and"], ["&", "and"], ["∧", "and"], [".", "and"],
        ["+", "or"], ["|", "or"], ["∨", "or"],
        ["^", "xor"], ["⊕", "xor"], ["⊙", "xnor"], ["↑", "nand"], ["↓", "nor"],
        ["!", "not"], ["~", "not"], ["¬", "not"],
        ["'", "prime"], ["’", "prime"], ["′", "prime"],
        ["(", "("], ["[", "("], [")", ")"], ["]", ")"],
    ];
    const BINARY = ["and", "or", "xor", "nand", "nor", "xnor", "imp", "iff"];

    function tokenize(src) {
        const s = String(src), out = [];
        let i = 0;
        outer: while (i < s.length) {
            const c = s[i];
            if (/\s/.test(c)) { i++; continue; }
            if (c === "0" || c === "1") { out.push({ t: "const", v: +c }); i++; continue; }
            if (/\p{L}/u.test(c)) {
                let j = i;
                while (j < s.length && /\p{L}/u.test(s[j])) j++;
                const word = s.slice(i, j);
                const kw = word.length > 1 && (KEYWORDS[word.toLowerCase()] || KEYWORDS[word.toLocaleLowerCase("tr")]);
                if (kw === "not") out.push({ t: "not" });
                else if (kw) out.push({ t: "op", v: kw });
                else for (const ch of word) out.push({ t: "var", v: ch });
                i = j;
                continue;
            }
            for (const [sym, kind] of SYMBOLS) {
                if (s.startsWith(sym, i)) {
                    if (kind === "not" || kind === "prime" || kind === "(" || kind === ")") out.push({ t: kind });
                    else out.push({ t: "op", v: kind });
                    i += sym.length;
                    continue outer;
                }
            }
            throw new Error(`Tanınmayan karakter: “${c}”`);
        }
        return out;
    }

    function parse(src) {
        const toks = tokenize(src);
        if (!toks.length) throw new Error("İfade boş");
        let k = 0;
        const peek = () => toks[k];
        const isOp = (...ops) => peek() && peek().t === "op" && ops.includes(peek().v);
        const startsPrimary = () => peek() && ["var", "const", "(", "not"].includes(peek().t);

        function iff() {
            let a = imp();
            while (isOp("iff")) { k++; a = { op: "iff", a, b: imp() }; }
            return a;
        }
        function imp() {
            const a = or();
            if (isOp("imp")) { k++; return { op: "imp", a, b: imp() }; }
            return a;
        }
        function or() {
            let a = xor();
            while (isOp("or", "nor")) { const op = toks[k++].v; a = { op, a, b: xor() }; }
            return a;
        }
        function xor() {
            let a = and();
            while (isOp("xor", "xnor")) { const op = toks[k++].v; a = { op, a, b: and() }; }
            return a;
        }
        function and() {
            let a = unary();
            for (;;) {
                if (isOp("and", "nand")) { const op = toks[k++].v; a = { op, a, b: unary() }; }
                else if (startsPrimary()) a = { op: "and", a, b: unary() };
                else return a;
            }
        }
        function unary() {
            if (peek() && peek().t === "not") { k++; return { op: "not", a: unary() }; }
            let a = atom();
            while (peek() && peek().t === "prime") { k++; a = { op: "not", a }; }
            return a;
        }
        function atom() {
            const t = peek();
            if (!t) throw new Error("İfade yarım kaldı");
            if (t.t === "var") { k++; return { op: "var", name: t.v }; }
            if (t.t === "const") { k++; return { op: "const", v: t.v }; }
            if (t.t === "(") {
                k++;
                const e = iff();
                if (!peek() || peek().t !== ")") throw new Error("Kapanmayan parantez");
                k++;
                return e;
            }
            if (t.t === ")") throw new Error("Fazladan “)”");
            throw new Error("Bir işlecin iki yanında da ifade olmalı");
        }

        const ast = iff();
        if (k < toks.length) throw new Error(toks[k].t === ")" ? "Fazladan “)”" : "İfadenin sonunda fazlalık var");
        return ast;
    }

    function evaluate(n, env) {
        switch (n.op) {
            case "var": return env[n.name] ? 1 : 0;
            case "const": return n.v;
            case "not": return 1 - evaluate(n.a, env);
        }
        const a = evaluate(n.a, env), b = evaluate(n.b, env);
        switch (n.op) {
            case "and": return a & b;
            case "or": return a | b;
            case "xor": return a ^ b;
            case "nand": return 1 - (a & b);
            case "nor": return 1 - (a | b);
            case "xnor": return 1 - (a ^ b);
            case "imp": return (1 - a) | b;
            case "iff": return a === b ? 1 : 0;
        }
        return 0;
    }

    function varsOf(n, set) {
        set = set || new Set();
        if (n.op === "var") set.add(n.name);
        if (n.a) varsOf(n.a, set);
        if (n.b) varsOf(n.b, set);
        return set;
    }
    const sortVars = (list) => Array.from(list).sort((x, y) => (x.toLowerCase() === y.toLowerCase() ? (x < y ? -1 : 1) : x.toLowerCase() < y.toLowerCase() ? -1 : 1));

    function compile(src) {
        const ast = parse(src);
        const vars = sortVars(varsOf(ast));
        return { ast, vars, f: (env) => evaluate(ast, env) };
    }

    // i. satır için {A:0, B:1, ...}; ilk değişken en anlamlı bit
    function envOf(vars, i) {
        const env = {}, n = vars.length;
        vars.forEach((v, j) => (env[v] = (i >> (n - 1 - j)) & 1));
        return env;
    }
    function table(ast, vars) {
        const rows = [];
        for (let i = 0; i < 1 << vars.length; i++) {
            const env = envOf(vars, i);
            rows.push({ i, env, out: evaluate(ast, env) });
        }
        return rows;
    }

    // Ara sütunlar: her alt ifade (değişkenler hariç), sonuncusu ifadenin tamamı
    function subterms(ast) {
        const out = [], seen = new Set();
        (function walk(n) {
            if (n.a) walk(n.a);
            if (n.b) walk(n.b);
            if (n.op === "var" || n.op === "const") return;
            const key = format(n, { mode: "text" });
            if (seen.has(key)) return;
            seen.add(key);
            out.push(n);
        })(ast);
        return out;
    }

    /* ---------------- Yazdırma ---------------- */
    const PREC = { iff: 1, imp: 2, or: 3, nor: 3, xor: 4, xnor: 4, and: 5, nand: 5, not: 6, var: 7, const: 7 };
    const ASSOC = { and: 1, or: 1, xor: 1, iff: 1 };
    const SYM = {
        text: { and: "·", or: " + ", xor: " ⊕ ", xnor: " ⊙ ", nand: " ↑ ", nor: " ↓ ", imp: " → ", iff: " ↔ " },
        html: { and: "·", or: " + ", xor: " ⊕ ", xnor: " ⊙ ", nand: " ↑ ", nor: " ↓ ", imp: " → ", iff: " ↔ " },
        tex: { and: " \\cdot ", or: " + ", xor: " \\oplus ", xnor: " \\odot ", nand: " \\uparrow ", nor: " \\downarrow ", imp: " \\rightarrow ", iff: " \\leftrightarrow " },
    };
    const LOGIC = {
        text: { and: " ∧ ", or: " ∨ ", not: "¬" },
        html: { and: " ∧ ", or: " ∨ ", not: "¬" },
        tex: { and: " \\land ", or: " \\lor ", not: "\\lnot " },
    };

    // o: { mode: "text" | "html" | "tex", logic: ¬∧∨ gösterimi, juxt: VE işaretini yazma (AB) }
    function format(n, o) {
        o = o || {};
        const mode = o.mode || "text";
        const lp = mode === "tex" ? "\\left(" : "(", rp = mode === "tex" ? "\\right)" : ")";
        const wrap = (child, parentOp) => {
            const s = format(child, o), pc = PREC[child.op], pp = PREC[parentOp];
            if (pc < pp || (pc === pp && !(child.op === parentOp && ASSOC[parentOp]))) return lp + s + rp;
            return s;
        };
        switch (n.op) {
            case "var": return n.name;
            case "const": return String(n.v);
            case "not": {
                if (o.logic) {
                    const inner = n.a.op === "var" || n.a.op === "const" || n.a.op === "not" ? format(n.a, o) : lp + format(n.a, o) + rp;
                    return LOGIC[mode].not + inner;
                }
                const inner = format(n.a, o);
                if (mode === "tex") return `\\overline{${inner}}`;
                if (mode === "html") return `<span class="ov">${inner}</span>`;
                return n.a.op === "var" || n.a.op === "const" ? inner + "'" : "(" + inner + ")'";
            }
        }
        let sym = (o.logic && LOGIC[mode][n.op]) || SYM[mode][n.op];
        const a = wrap(n.a, n.op), b = wrap(n.b, n.op);
        if (n.op === "and" && o.juxt && !o.logic && n.a.op !== "const" && n.b.op !== "const") sym = mode === "tex" ? "\\," : "";
        return a + sym + b;
    }

    /* ---------------- Quine–McCluskey ---------------- */
    const popcount = (x) => { let c = 0; while (x) { x &= x - 1; c++; } return c; };

    // Asal çarpanlar (prime implicants): { v: değer bitleri, d: "-" olan bitler }
    function primeImplicants(ones, dcs) {
        let cur = new Map();
        ones.concat(dcs || []).forEach((m) => cur.set(m + "|0", { v: m, d: 0 }));
        const primes = [];
        while (cur.size) {
            const list = Array.from(cur.values()), used = new Set(), next = new Map();
            for (let i = 0; i < list.length; i++) {
                for (let j = i + 1; j < list.length; j++) {
                    const a = list[i], b = list[j];
                    if (a.d !== b.d) continue;
                    const x = a.v ^ b.v;
                    if (!x || (x & (x - 1))) continue;
                    const t = { v: a.v & ~x, d: a.d | x };
                    next.set(t.v + "|" + t.d, t);
                    used.add(i); used.add(j);
                }
            }
            list.forEach((t, i) => { if (!used.has(i)) primes.push(t); });
            cur = next;
        }
        return primes;
    }
    const covers = (p, m) => (m & ~p.d) === p.v;

    // En az terimli (eşitlikte en az harfli) örtü
    function minimize(n, ones, dcs) {
        dcs = (dcs || []).filter((m) => !ones.includes(m));
        if (!ones.length) return [];
        if (ones.length + dcs.length === 1 << n) return [{ v: 0, d: (1 << n) - 1 }];
        const primes = primeImplicants(ones, dcs);
        const lits = (list) => list.reduce((s, p) => s + n - popcount(p.d), 0);
        let best = null;
        (function search(remaining, chosen) {
            if (!remaining.length) {
                if (!best || chosen.length < best.length || (chosen.length === best.length && lits(chosen) < lits(best))) best = chosen;
                return;
            }
            if (best && chosen.length >= best.length) return;
            let pick = null, opts = null;
            remaining.forEach((m) => {
                const c = primes.filter((p) => covers(p, m));
                if (!opts || c.length < opts.length) { pick = m; opts = c; }
            });
            opts.sort((p, q) => remaining.filter((m) => covers(q, m)).length - remaining.filter((m) => covers(p, m)).length || popcount(q.d) - popcount(p.d));
            opts.forEach((p) => search(remaining.filter((m) => !covers(p, m)), chosen.concat([p])));
        })(ones.slice(), []);
        // Okunuş sırası: A, A', (yok); sonra B … (ör. A + BC + BD)
        const key = (p) => Array.from({ length: n }, (_, j) => { const bit = 1 << (n - 1 - j); return p.d & bit ? 2 : p.v & bit ? 0 : 1; });
        return best.sort((p, q) => { const a = key(p), b = key(q); for (let j = 0; j < n; j++) if (a[j] !== b[j]) return a[j] - b[j]; return 0; });
    }

    const V = (name) => ({ op: "var", name });
    const NOT = (a) => ({ op: "not", a });
    const chain = (op, list) => list.reduce((acc, x) => (acc ? { op, a: acc, b: x } : x), null);

    // Çarpım terimi (SOP) ya da toplam terimi (POS, zeros üzerinden bulunan örtüden)
    function termAst(p, vars, pos) {
        const n = vars.length, lits = [];
        vars.forEach((v, j) => {
            const bit = 1 << (n - 1 - j);
            if (p.d & bit) return;
            const one = !!(p.v & bit);
            lits.push(one !== !!pos ? V(v) : NOT(V(v)));
        });
        if (!lits.length) return { op: "const", v: pos ? 0 : 1 };
        return chain(pos ? "or" : "and", lits);
    }
    function sopAst(primes, vars) {
        if (!primes.length) return { op: "const", v: 0 };
        return chain("or", primes.map((p) => termAst(p, vars, false)));
    }
    function posAst(primes, vars) {
        if (!primes.length) return { op: "const", v: 1 };
        return chain("and", primes.map((p) => termAst(p, vars, true)));
    }
    function simplify(ast, vars, dcs) {
        const rows = table(ast, vars), n = vars.length;
        dcs = dcs || [];
        const ones = rows.filter((r) => r.out && !dcs.includes(r.i)).map((r) => r.i);
        const zeros = rows.filter((r) => !r.out && !dcs.includes(r.i)).map((r) => r.i);
        const sopP = minimize(n, ones, dcs), posP = minimize(n, zeros, dcs);
        return { ones, zeros, sopPrimes: sopP, posPrimes: posP, sop: sopAst(sopP, vars), pos: posAst(posP, vars) };
    }

    // Karnaugh haritası düzeni: satır/sütun değişkenleri ve Gray kodu sıraları
    const GRAY = { 0: [0], 1: [0, 1], 2: [0, 1, 3, 2] };
    function kmapLayout(n) {
        const rb = Math.floor(n / 2), cb = n - rb;
        return { rb, cb, rows: GRAY[rb], cols: GRAY[cb], cell: (r, c) => (GRAY[rb][r] << cb) | GRAY[cb][c] };
    }
    const bin = (v, w) => v.toString(2).padStart(w, "0");

    /* ---------------- Devre çizimi ---------------- */
    const FLAT = { and: 1, or: 1, xor: 1 };
    function gateTree(n) {
        if (n.op === "var") return { kind: "in", name: n.name, node: n };
        if (n.op === "const") return { kind: "const", v: n.v, node: n };
        if (n.op === "not") return { kind: "not", kids: [gateTree(n.a)], node: n };
        let kids = [n.a, n.b];
        if (FLAT[n.op]) {
            // Aynı işleçli zinciri tek çok girişli kapıya topla (en fazla 4 giriş)
            for (let changed = true; changed && kids.length < 4;) {
                changed = false;
                const idx = kids.findIndex((x) => x.op === n.op);
                if (idx >= 0 && kids.length + 1 <= 4) { kids.splice(idx, 1, kids[idx].a, kids[idx].b); changed = true; }
            }
        }
        return { kind: n.op, kids: kids.map(gateTree), node: n };
    }

    const GW = 54, COLW = 104, SLOT = 34, INW = 46;
    function gatePath(kind, x, y, w, h) {
        const y0 = y - h / 2, y1 = y + h / 2;
        const bubble = ["nand", "nor", "xnor", "not"].includes(kind);
        const bw = bubble ? w - 9 : w;
        let d = "", extra = "";
        if (kind === "not") d = `M${x} ${y - 13} L${x + bw} ${y} L${x} ${y + 13} Z`;
        else if (kind === "and" || kind === "nand") d = `M${x} ${y0} H${x + bw / 2} A${bw / 2} ${h / 2} 0 0 1 ${x + bw / 2} ${y1} H${x} Z`;
        else if (kind === "or" || kind === "nor" || kind === "xor" || kind === "xnor") {
            const xs = kind === "xor" || kind === "xnor" ? x + 7 : x, ww = bw - (xs - x);
            d = `M${xs} ${y0} Q${xs + ww * 0.28} ${y} ${xs} ${y1} Q${xs + ww * 0.62} ${y1} ${xs + ww} ${y} Q${xs + ww * 0.62} ${y0} ${xs} ${y0} Z`;
            if (xs !== x) extra = `<path class="lc-back" d="M${x} ${y0} Q${x + ww * 0.28} ${y} ${x} ${y1}"/>`;
        } else d = `M${x} ${y0} H${x + bw} V${y1} H${x} Z`;
        const bub = bubble ? `<circle class="lc-bubble" cx="${x + bw + 4.5}" cy="${y}" r="4.5"/>` : "";
        return { d, extra, bub };
    }
    const LABEL = { and: "AND", or: "OR", xor: "XOR", nand: "NAND", nor: "NOR", xnor: "XNOR", imp: "→", iff: "↔" };

    // ast'yi env değerleriyle çizer. o: { out: "F", labels: true }
    function circuitSvg(ast, env, o) {
        o = o || {};
        const root = gateTree(ast);
        let leafCount = 0;
        (function depth(t) {
            if (!t.kids) { t.depth = 0; t.leafY = leafCount++; return; }
            t.kids.forEach(depth);
            t.depth = 1 + Math.max(...t.kids.map((k) => k.depth));
        })(root);
        const D = root.depth;
        const width = INW + Math.max(D, 0) * COLW + 46, height = leafCount * SLOT + 24;
        const wires = [], gates = [], ins = [];
        const val = (t) => evaluate(t.node, env);

        (function place(t) {
            if (!t.kids) {
                t.y = 12 + SLOT * (t.leafY + 0.5);
                t.ox = INW - 4;
                return;
            }
            t.kids.forEach(place);
            t.y = t.kids.reduce((s, k) => s + k.y, 0) / t.kids.length;
            t.x = INW + (t.depth - 1) * COLW + (COLW - GW) - 10;
            t.ox = t.x + GW;
        })(root);

        (function draw(t) {
            const on = val(t);
            if (!t.kids) {
                const label = t.kind === "const" ? String(t.v) : t.name;
                ins.push(`<g class="lc-in${on ? " on" : ""}"${t.kind === "in" ? ` data-var="${t.name}"` : ""}>
                    <rect x="4" y="${t.y - 11}" width="${INW - 18}" height="22" rx="7"/>
                    <text x="${4 + (INW - 18) / 2}" y="${t.y + 4.5}">${label}</text>
                    <circle cx="${INW - 9}" cy="${t.y}" r="4"/></g>`);
                return;
            }
            const k = t.kids.length;
            const h = t.kind === "not" ? 26 : Math.max(36, k * 18);
            t.kids.forEach((kid, i) => {
                draw(kid);
                const py = k === 1 ? t.y : t.y - h / 2 + ((i + 0.5) * h) / k;
                const ex = t.x + 9;
                const mx = t.x - 12 - Math.abs(i - (k - 1) / 2) * 7;
                const d = Math.abs(kid.y - py) < 0.5 ? `M${kid.ox} ${kid.y} H${ex}` : `M${kid.ox} ${kid.y} H${mx} V${py} H${ex}`;
                wires.push(`<path class="lc-wire${val(kid) ? " on" : ""}" d="${d}"/>`);
            });
            const g = gatePath(t.kind, t.x, t.y, GW, h);
            const lbl = o.labels !== false && t.kind !== "not" ? `<text class="lc-glabel" x="${t.x + (["or", "nor", "xor", "xnor"].includes(t.kind) ? 25 : 21)}" y="${t.y + 3.5}">${LABEL[t.kind]}</text>` : "";
            gates.push(`<g class="lc-gate${on ? " on" : ""}">${g.extra}<path class="lc-body" d="${g.d}"/>${g.bub}${lbl}</g>`);
        })(root);

        const outOn = val(root), endX = width - 34;
        wires.push(`<path class="lc-wire${outOn ? " on" : ""}" d="M${root.ox} ${root.y} H${endX}"/>`);
        const out = `<g class="lc-out${outOn ? " on" : ""}"><circle cx="${endX + 10}" cy="${root.y}" r="9"/><text x="${endX + 10}" y="${root.y + 4}">${outOn}</text>
            <text class="lc-outname" x="${endX + 10}" y="${root.y - 14}">${o.out || "F"}</text></g>`;
        return `<svg class="lc-svg" viewBox="0 0 ${width} ${Math.max(height, 64)}" width="${width}" style="max-width:100%;height:auto" role="img" aria-label="Mantık devresi">${wires.join("")}${gates.join("")}${ins.join("")}${out}</svg>`;
    }

    global.Logic = {
        tokenize, parse, evaluate, compile, envOf, table, subterms, format, varsOf, sortVars,
        primeImplicants, minimize, termAst, sopAst, posAst, simplify, kmapLayout, bin, popcount, covers,
        circuitSvg, gatePath, V, NOT, chain, BINARY,
    };
})(window);
