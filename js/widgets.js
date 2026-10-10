/*
 * Widgets - derslerin içine gömülen etkileşimli araçlar.
 * Her araç: Widgets[name](root, opts)  -> root içine kendi arayüzünü kurar.
 */
(function (global) {
    "use strict";

    const L = Logic;

    function el(html) {
        const t = document.createElement("template");
        t.innerHTML = html.trim();
        return t.content.firstElementChild;
    }
    function tex(s, display) {
        if (global.katex) {
            try { return katex.renderToString(String(s), { throwOnError: false, displayMode: !!display }); } catch (e) { /* düz metne düş */ }
        }
        return String(s);
    }
    function esc(s) {
        return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    function chips(parent, labels, active, onChange) {
        const row = el(`<div class="chip-row"></div>`);
        const btns = labels.map((lb, i) => {
            const b = el(`<button type="button" class="chip${i === active ? " active" : ""}">${lb}</button>`);
            b.addEventListener("click", () => {
                btns.forEach((x) => x.classList.remove("active"));
                b.classList.add("active");
                onChange(i);
            });
            row.appendChild(b);
            return b;
        });
        parent.appendChild(row);
        return row;
    }

    function textInput(parent, label, value, onChange) {
        const node = el(`<label class="ctrl"><span class="ctrl-label"><span>${label}</span></span><input class="text-input mono" type="text" spellcheck="false" autocomplete="off" autocapitalize="off"></label>`);
        const input = node.querySelector("input");
        input.value = value;
        input.addEventListener("input", () => onChange(input.value, input));
        parent.appendChild(node);
        return input;
    }

    // 0/1 anahtarları: { A: 0, B: 1 } → düğmeler; değişince onChange(state)
    function switches(parent, names, state, onChange, o) {
        o = o || {};
        const row = el(`<div class="switch-row"></div>`);
        const render = () => {
            row.innerHTML = "";
            names.forEach((n) => {
                const b = el(`<button type="button" class="bit-switch${state[n] ? " on" : ""}" title="${esc(n)} girişini değiştir"><span class="bs-name">${o.label ? o.label(n) : esc(n)}</span><span class="bs-val">${state[n] ? 1 : 0}</span></button>`);
                b.addEventListener("click", () => { state[n] = state[n] ? 0 : 1; render(); onChange(state); });
                row.appendChild(b);
            });
        };
        render();
        parent.appendChild(row);
        return { node: row, render };
    }

    const lamp = (v, label) => `<span class="lamp${v ? " on" : ""}"><i></i>${label !== undefined ? `<b>${label}</b>` : ""}<span>${v ? 1 : 0}</span></span>`;

    // Devre SVG'sindeki giriş etiketine tıklayınca o değişkeni değiştir
    function bindSvgInputs(host, state, onChange) {
        host.querySelectorAll(".lc-in[data-var]").forEach((g) => g.addEventListener("click", () => {
            const n = g.dataset.var;
            state[n] = state[n] ? 0 : 1;
            onChange(state);
        }));
    }

    // Doğruluk tablosu HTML'i. cols: [{ head, f(env), cls }]
    function truthHtml(vars, cols, o) {
        o = o || {};
        const n = vars.length;
        let h = `<table class="mtable tt"><thead><tr>${o.index ? "<th class=\"tt-i\">#</th>" : ""}${vars.map((v) => `<th class="tt-var">${v}</th>`).join("")}${cols.map((c) => `<th class="${c.cls || ""}">${c.head}</th>`).join("")}</tr></thead><tbody>`;
        for (let i = 0; i < 1 << n; i++) {
            const env = L.envOf(vars, i);
            const vals = cols.map((c) => c.f(env));
            const rowCls = [o.current === i ? "cur" : "", o.mark && o.mark(env, vals) ? "hit" : ""].join(" ").trim();
            h += `<tr data-i="${i}"${rowCls ? ` class="${rowCls}"` : ""}>${o.index ? `<td class="tt-i">${i}</td>` : ""}${vars.map((v) => `<td class="tt-var">${env[v]}</td>`).join("")}${vals.map((v, j) => `<td class="${cols[j].cls || ""}${typeof v === "number" ? (v ? " one" : " zero") : ""}">${v}</td>`).join("")}</tr>`;
        }
        return h + `</tbody></table>`;
    }

    const W = {};

    /* ---------------- Doğruluk tablosu (ara sütunlarıyla) ---------------- */
    W.truthTable = function (root, o) {
        let expr = o.expr || "A·B + C";
        const host = el(`<div></div>`);
        if (o.presets) chips(root, o.presets.map((p) => p.label), 0, (i) => { expr = o.presets[i].expr; if (input) input.value = expr; build(); });
        let input = null;
        if (o.editable !== false) {
            const box = el(`<div class="controls" style="grid-template-columns:1fr"></div>`);
            root.appendChild(box);
            input = textInput(box, "İfade (değiştirebilirsin)", expr, (v) => { expr = v; build(); });
        }
        root.appendChild(host);
        const info = el(`<div class="readout"></div>`);
        root.appendChild(info);

        function build() {
            let c;
            try { c = L.compile(expr); if (input) input.classList.remove("err"); } catch (e) {
                if (input) input.classList.add("err");
                info.innerHTML = `<span class="bad">${esc(e.message)}</span>`;
                return;
            }
            if (c.vars.length > 5) { info.innerHTML = `<span class="bad">Burada en fazla 5 değişken. Daha büyükleri için Mantık Lab'ı kullan.</span>`; return; }
            const fo = { mode: "tex", logic: !!o.logic };
            const subs = o.steps === false ? [c.ast] : L.subterms(c.ast);
            const cols = subs.map((s, i) => ({ head: tex(L.format(s, fo)), f: (env) => L.evaluate(s, env), cls: i === subs.length - 1 ? "tt-out" : "" }));
            if (!subs.length) cols.push({ head: tex(L.format(c.ast, fo)), f: (env) => L.evaluate(c.ast, env), cls: "tt-out" });
            host.innerHTML = `<div class="table-wrap" style="margin-top:12px">${truthHtml(c.vars, cols, { mark: (env, vals) => vals[vals.length - 1] === 1 })}</div>`;
            const rows = L.table(c.ast, c.vars), ones = rows.filter((r) => r.out).length;
            const kind = ones === rows.length ? `<span class="good">Totoloji</span> — her satırda 1 (doğru)` : ones === 0 ? `<span class="bad">Çelişki</span> — her satırda 0 (yanlış)` : `<b>Olumsal</b> — bazı satırlarda 1, bazılarında 0`;
            info.innerHTML = `${c.vars.length} değişken → ${rows.length} satır · ${ones} satırda sonuç 1. ${kind}`;
        }
        build();
    };

    /* ---------------- İki ifade eşdeğer mi? (yasalar, De Morgan) ---------------- */
    W.equiv = function (root, o) {
        const pairs = o.pairs || [{ label: "De Morgan", a: "(A·B)'", b: "A' + B'" }];
        let a = pairs[0].a, b = pairs[0].b;
        if (pairs.length > 1) chips(root, pairs.map((p) => p.label), 0, (i) => { a = pairs[i].a; b = pairs[i].b; ia.value = a; ib.value = b; build(); });
        const box = el(`<div class="controls"></div>`);
        root.appendChild(box);
        const ia = textInput(box, "Sol taraf", a, (v) => { a = v; build(); });
        const ib = textInput(box, "Sağ taraf", b, (v) => { b = v; build(); });
        const host = el(`<div></div>`), info = el(`<div class="readout"></div>`);
        root.appendChild(host);
        root.appendChild(info);

        function build() {
            let ca, cb;
            try { ca = L.compile(a); ia.classList.remove("err"); } catch (e) { ia.classList.add("err"); info.innerHTML = `<span class="bad">Sol: ${esc(e.message)}</span>`; return; }
            try { cb = L.compile(b); ib.classList.remove("err"); } catch (e) { ib.classList.add("err"); info.innerHTML = `<span class="bad">Sağ: ${esc(e.message)}</span>`; return; }
            const vars = L.sortVars(new Set(ca.vars.concat(cb.vars)));
            if (vars.length > 5) { info.innerHTML = `<span class="bad">En fazla 5 değişken.</span>`; return; }
            const fo = { mode: "tex", logic: !!o.logic };
            let diff = -1;
            const cols = [
                { head: tex(L.format(ca.ast, fo)), f: (env) => L.evaluate(ca.ast, env), cls: "tt-out" },
                { head: tex(L.format(cb.ast, fo)), f: (env) => L.evaluate(cb.ast, env), cls: "tt-out2" },
                { head: "=", f: (env) => (L.evaluate(ca.ast, env) === L.evaluate(cb.ast, env) ? "✓" : "✗"), cls: "tt-eq" },
            ];
            for (let i = 0; i < 1 << vars.length && diff < 0; i++) { const env = L.envOf(vars, i); if (cols[0].f(env) !== cols[1].f(env)) diff = i; }
            host.innerHTML = `<div class="table-wrap" style="margin-top:12px">${truthHtml(vars, cols, { mark: (env, vals) => vals[2] === "✗" })}</div>`;
            info.innerHTML = diff < 0
                ? `<span class="good">Eşdeğer ✓</span> — ${1 << vars.length} satırın hepsinde iki taraf aynı değeri veriyor.`
                : `<span class="bad">Eşdeğer değil ✗</span> — örneğin ${vars.map((v) => `${v} = ${L.envOf(vars, diff)[v]}`).join(", ")} için sol ${cols[0].f(L.envOf(vars, diff))}, sağ ${cols[1].f(L.envOf(vars, diff))}.`;
            host.querySelectorAll("tr.hit").forEach((r) => r.classList.add("bad-row"));
        }
        build();
    };

    /* ---------------- Tek kapı oyun alanı ---------------- */
    const GATE_INFO = {
        and: ["AND (VE)", "Çıkış yalnızca <b>iki giriş de 1</b> iken 1 olur.", (a, b) => a & b, "A·B"],
        or: ["OR (VEYA)", "Girişlerden <b>en az biri 1</b> ise çıkış 1 olur.", (a, b) => a | b, "A + B"],
        not: ["NOT (DEĞİL)", "Tek girişlidir; girişi <b>tersine çevirir</b>.", (a) => 1 - a, "A'"],
        nand: ["NAND", "AND'in tersi: yalnızca iki giriş de 1 iken 0 olur.", (a, b) => 1 - (a & b), "(A·B)'"],
        nor: ["NOR", "OR'un tersi: yalnızca iki giriş de 0 iken 1 olur.", (a, b) => 1 - (a | b), "(A + B)'"],
        xor: ["XOR (ya da)", "Girişler <b>farklıysa</b> 1, aynıysa 0 olur.", (a, b) => a ^ b, "A ⊕ B"],
        xnor: ["XNOR", "XOR'un tersi: girişler <b>aynıysa</b> 1 olur (eşitlik kapısı).", (a, b) => 1 - (a ^ b), "A ⊙ B"],
    };
    W.gate = function (root, o) {
        const list = o.gates || ["and", "or", "not", "nand", "nor", "xor", "xnor"];
        let g = list[0];
        const st = { A: o.A || 0, B: o.B || 0 };
        if (list.length > 1) chips(root, list.map((k) => GATE_INFO[k][0]), 0, (i) => { g = list[i]; build(); });
        const sw = el(`<div style="margin-top:12px"></div>`);
        root.appendChild(sw);
        const stage = el(`<div class="gate-stage"></div>`), info = el(`<div class="readout"></div>`);
        root.appendChild(stage);
        root.appendChild(info);
        let swc = null;

        function build() {
            const names = g === "not" ? ["A"] : ["A", "B"];
            sw.innerHTML = "";
            swc = switches(sw, names, st, build);
            const ast = g === "not" ? L.NOT(L.V("A")) : { op: g, a: L.V("A"), b: L.V("B") };
            const [title, desc, fn, sym] = GATE_INFO[g];
            const out = g === "not" ? fn(st.A) : fn(st.A, st.B);
            const vars = names;
            const cur = g === "not" ? st.A : st.A * 2 + st.B;
            stage.innerHTML = `<div class="gate-svg">${L.circuitSvg(ast, st, { out: "Y" })}</div>
                <div class="gate-side"><div class="table-wrap">${truthHtml(vars, [{ head: "Y", f: (env) => (g === "not" ? fn(env.A) : fn(env.A, env.B)), cls: "tt-out" }], { current: cur })}</div></div>`;
            bindSvgInputs(stage, st, build);
            info.innerHTML = `<b>${title}</b> · ${tex(L.format(L.parse(sym), { mode: "tex" }))} — ${desc}<br>Şu an: ${names.map((n) => `${n} = ${st[n]}`).join(", ")} → <b>Y = ${out}</b> ${lamp(out)}`;
        }
        build();
    };

    /* ---------------- İfadeden devre (girişleri değiştirerek dene) ---------------- */
    W.circuit = function (root, o) {
        const presets = o.presets || [{ label: "Devre", expr: o.expr || "A·B + C'" }];
        let expr = presets[0].expr;
        const st = Object.assign({}, o.state || {});
        if (presets.length > 1) chips(root, presets.map((p) => p.label), 0, (i) => { expr = presets[i].expr; if (input) input.value = expr; build(); });
        let input = null;
        if (o.editable !== false) {
            const box = el(`<div class="controls" style="grid-template-columns:1fr"></div>`);
            root.appendChild(box);
            input = textInput(box, "İfade", expr, (v) => { expr = v; build(); });
        }
        const sw = el(`<div style="margin-top:12px"></div>`), stage = el(`<div class="circuit-stage"></div>`), info = el(`<div class="readout"></div>`);
        root.appendChild(sw);
        root.appendChild(stage);
        root.appendChild(info);

        function build() {
            let c;
            try { c = L.compile(expr); if (input) input.classList.remove("err"); } catch (e) {
                if (input) input.classList.add("err");
                info.innerHTML = `<span class="bad">${esc(e.message)}</span>`;
                return;
            }
            c.vars.forEach((v) => { if (st[v] === undefined) st[v] = 0; });
            sw.innerHTML = "";
            switches(sw, c.vars, st, build);
            stage.innerHTML = L.circuitSvg(c.ast, st, { out: o.out || "F" });
            bindSvgInputs(stage, st, build);
            const out = c.f(st);
            info.innerHTML = `${tex((o.out || "F") + " = " + L.format(c.ast, { mode: "tex" }))} → ${c.vars.map((v) => `${v}=${st[v]}`).join(", ")} için <b>${o.out || "F"} = ${out}</b> ${lamp(out)}
                <div class="muted" style="font-size:13px">Yeşil teller 1, gri teller 0 taşır. Soldaki giriş kutularına da dokunabilirsin.</div>`;
        }
        build();
    };

    /* ---------------- Karnaugh haritası ---------------- */
    const GROUP_COLORS = ["#ff4f8b", "#00aff0", "#1fa957", "#f08c00", "#7c4dff", "#00b3a4", "#e5484d", "#8a6d3b"];
    W.kmap = function (root, o) {
        let n = o.n || 3;
        const names = o.vars || ["A", "B", "C", "D"];
        let cells = {};
        const setFrom = (ones, dc) => { cells = {}; (ones || []).forEach((m) => (cells[m] = 1)); (dc || []).forEach((m) => (cells[m] = "X")); };
        setFrom(o.ones, o.dc);
        if (o.choose !== false && !o.readonly) chips(root, ["2 değişken", "3 değişken", "4 değişken"], n - 2, (i) => { n = i + 2; cells = {}; build(); });
        const bar = el(`<div class="ex-actions" style="margin-top:10px">
            <button type="button" class="btn small ghost" data-rand>🎲 Rastgele</button>
            <button type="button" class="btn small ghost" data-clr>Temizle</button></div>`);
        if (!o.readonly) root.appendChild(bar);
        const stage = el(`<div class="kmap-stage"></div>`), info = el(`<div class="readout"></div>`);
        root.appendChild(stage);
        root.appendChild(info);
        bar.querySelector("[data-rand]").addEventListener("click", () => {
            cells = {};
            for (let m = 0; m < 1 << n; m++) { const r = Math.random(); if (r < 0.45) cells[m] = 1; else if (o.dontCare && r < 0.55) cells[m] = "X"; }
            build();
        });
        bar.querySelector("[data-clr]").addEventListener("click", () => { cells = {}; build(); });

        function build() {
            const vars = names.slice(0, n), lay = L.kmapLayout(n);
            const ones = [], dcs = [];
            for (let m = 0; m < 1 << n; m++) { if (cells[m] === 1) ones.push(m); else if (cells[m] === "X") dcs.push(m); }
            const primes = L.minimize(n, ones, dcs);
            const color = (gi) => GROUP_COLORS[gi % GROUP_COLORS.length];
            const groupsOf = (m) => primes.map((p, gi) => (L.covers(p, m) ? gi : -1)).filter((x) => x >= 0);
            const rv = vars.slice(0, lay.rb).join(""), cv = vars.slice(lay.rb).join("");
            let h = `<table class="kmap"><thead><tr><th class="km-corner"><span class="km-r">${rv || "&nbsp;"}</span><span class="km-c">${cv}</span></th>${lay.cols.map((c) => `<th>${L.bin(c, lay.cb)}</th>`).join("")}</tr></thead><tbody>`;
            lay.rows.forEach((r, ri) => {
                h += `<tr><th>${lay.rb ? L.bin(r, lay.rb) : ""}</th>`;
                lay.cols.forEach((c, ci) => {
                    const m = lay.cell(ri, ci), v = cells[m] || 0, gs = groupsOf(m);
                    const rings = gs.map((gi, k) => `inset 0 0 0 ${3 + k * 3}px ${color(gi)}`).join(",");
                    const bg = gs.length ? `background:${color(gs[0])}22;` : "";
                    h += `<td data-m="${m}" data-g="${gs.join(" ")}" class="km-cell v${v}" style="${bg}${rings ? `box-shadow:${rings}` : ""}"><span class="km-v">${v}</span><span class="km-m">m${m}</span></td>`;
                });
                h += `</tr>`;
            });
            h += `</tbody></table>`;
            stage.innerHTML = h;
            if (!o.readonly) stage.querySelectorAll(".km-cell").forEach((td) => td.addEventListener("click", () => {
                const m = Number(td.dataset.m), v = cells[m] || 0;
                cells[m] = v === 0 ? 1 : v === 1 && o.dontCare ? "X" : 0;
                if (!cells[m]) delete cells[m];
                build();
            }));
            const termHtml = (p) => L.format(L.termAst(p, vars, false), { mode: "html", juxt: true });
            const groups = primes.map((p, gi) => {
                const size = 1 << L.popcount(p.d);
                return `<span class="km-group" data-gi="${gi}" style="--gc:${color(gi)}"><i></i>${termHtml(p)} <small>(${size} hücre)</small></span>`;
            }).join("");
            const sop = L.format(L.sopAst(primes, vars), { mode: "html", juxt: true });
            info.innerHTML = `<div>${tex("F(" + vars.join(",") + ") = \\sum m(" + (ones.join(",") || "\\,") + ")" + (dcs.length ? " + d(" + dcs.join(",") + ")" : ""))}</div>
                <div style="margin:4px 0">${groups || (o.readonly ? "" : `<span class="muted">Hücrelere dokunarak 1 yaz${o.dontCare ? " (bir daha dokun: X = önemsiz)" : ""}.</span>`)}</div>
                <div>En sade hâl: <b class="bool-out">F = ${sop}</b></div>`;
            info.querySelectorAll(".km-group").forEach((g) => {
                const on = (x) => stage.querySelectorAll(".km-cell").forEach((td) => td.classList.toggle("dim", x && !td.dataset.g.split(" ").includes(g.dataset.gi)));
                g.addEventListener("mouseenter", () => on(true));
                g.addEventListener("mouseleave", () => on(false));
            });
        }
        build();
    };

    /* ---------------- Yarım / tam toplayıcı ---------------- */
    W.adder = function (root, o) {
        let full = o.mode === "full";
        const st = { A: 1, B: 1, C: 0 };
        if (o.choose !== false) chips(root, ["Yarım toplayıcı", "Tam toplayıcı"], full ? 1 : 0, (i) => { full = i === 1; build(); });
        const sw = el(`<div style="margin-top:12px"></div>`), stage = el(`<div class="adder-stage"></div>`), tbl = el(`<div class="table-wrap" style="margin-top:12px"></div>`), info = el(`<div class="readout"></div>`);
        [sw, stage, info, tbl].forEach((x) => root.appendChild(x));

        function build() {
            const names = full ? ["A", "B", "C"] : ["A", "B"];
            sw.innerHTML = "";
            switches(sw, names, st, build, { label: (nm) => (nm === "C" ? "C<sub>in</sub>" : nm) });
            const sExpr = full ? "A ⊕ B ⊕ C" : "A ⊕ B", cExpr = full ? "A·B + C·(A ⊕ B)" : "A·B";
            const env = full ? st : { A: st.A, B: st.B, C: 0 };
            const sAst = L.parse(sExpr), cAst = L.parse(cExpr);
            const S = L.evaluate(sAst, env), Co = L.evaluate(cAst, env);
            stage.innerHTML = `<div class="adder-col"><div class="section-title">Toplam S</div>${L.circuitSvg(sAst, env, { out: "S" })}</div>
                <div class="adder-col"><div class="section-title">Elde C<sub>out</sub></div>${L.circuitSvg(cAst, env, { out: "C" })}</div>`;
            bindSvgInputs(stage, st, build);
            const sum = env.A + env.B + (full ? env.C : 0);
            info.innerHTML = `${names.map((nm) => env[nm]).join(" + ")} = <b>${sum}</b> = (${Co}${S})<sub>2</sub> &nbsp; ${lamp(Co, "C<sub>out</sub>")} ${lamp(S, "S")}
                <div class="muted" style="font-size:13px">S = ${L.format(sAst, { mode: "html" })}, &nbsp; C<sub>out</sub> = ${L.format(cAst, { mode: "html" })}</div>`;
            const vars = names;
            tbl.innerHTML = truthHtml(vars, [
                { head: "C<sub>out</sub>", f: (e) => L.evaluate(cAst, Object.assign({ C: 0 }, e)), cls: "tt-out2" },
                { head: "S", f: (e) => L.evaluate(sAst, Object.assign({ C: 0 }, e)), cls: "tt-out" },
            ], { current: full ? st.A * 4 + st.B * 2 + st.C : st.A * 2 + st.B }).replace(/<th class="tt-var">C<\/th>/, `<th class="tt-var">C<sub>in</sub></th>`);
        }
        build();
    };

    /* ---------------- n bitlik dalgalı elde toplayıcı ---------------- */
    W.ripple = function (root, o) {
        const n = o.bits || 4;
        let A = o.a !== undefined ? o.a : 6, B = o.b !== undefined ? o.b : 7;
        const stage = el(`<div class="ripple"></div>`), info = el(`<div class="readout"></div>`);
        root.appendChild(stage);
        root.appendChild(info);
        const bit = (x, i) => (x >> i) & 1;

        function build() {
            const carries = [0];
            let S = 0;
            for (let i = 0; i < n; i++) {
                const a = bit(A, i), b = bit(B, i), c = carries[i];
                S |= (a ^ b ^ c) << i;
                carries.push((a & b) | (c & (a ^ b)));
            }
            const cols = [];
            for (let i = n - 1; i >= 0; i--) {
                cols.push(`<div class="fa-col">
                    <button type="button" class="bit-switch small${bit(A, i) ? " on" : ""}" data-a="${i}"><span class="bs-name">A<sub>${i}</sub></span><span class="bs-val">${bit(A, i)}</span></button>
                    <button type="button" class="bit-switch small${bit(B, i) ? " on" : ""}" data-b="${i}"><span class="bs-name">B<sub>${i}</sub></span><span class="bs-val">${bit(B, i)}</span></button>
                    <div class="fa-box"><span class="fa-cout${carries[i + 1] ? " on" : ""}" title="Elde çıkışı">${carries[i + 1]}</span>TT<span class="fa-cin${carries[i] ? " on" : ""}" title="Elde girişi">${carries[i]}</span></div>
                    ${lamp(bit(S, i), `S<sub>${i}</sub>`)}
                </div>`);
            }
            stage.innerHTML = `<div class="fa-col fa-carry">${lamp(carries[n], "C<sub>out</sub>")}</div>${cols.join("")}`;
            stage.querySelectorAll("[data-a]").forEach((b) => b.addEventListener("click", () => { A ^= 1 << Number(b.dataset.a); build(); }));
            stage.querySelectorAll("[data-b]").forEach((b) => b.addEventListener("click", () => { B ^= 1 << Number(b.dataset.b); build(); }));
            const total = A + B, max = (1 << n) - 1;
            info.innerHTML = `A = (${L.bin(A, n)})<sub>2</sub> = <b>${A}</b>, &nbsp; B = (${L.bin(B, n)})<sub>2</sub> = <b>${B}</b><br>
                A + B = (${carries[n]}${L.bin(S, n)})<sub>2</sub> = <b>${total}</b>
                ${carries[n] ? `<div class="muted" style="font-size:13px">⚠️ Sonuç ${n} bite sığmadı (en büyük ${max}); taşan bit C<sub>out</sub>'ta. Buna <b>taşma (overflow)</b> denir.</div>` : ""}
                <div class="muted" style="font-size:13px">“TT” kutuları tam toplayıcıdır. Her birinin eldesi (sağdaki küçük sayı) bir soldakine aktarılır.</div>`;
        }
        build();
    };

    /* ---------------- Flip-floplar ---------------- */
    const FF = {
        SR: { title: "SR mandal (latch)", ins: ["S", "R"], clocked: false,
            next: (q, x) => (x.S && x.R ? null : x.S ? 1 : x.R ? 0 : q),
            table: [["0", "0", "Q (değişmez)"], ["0", "1", "0 (sıfırla)"], ["1", "0", "1 (kur)"], ["1", "1", "geçersiz ⚠️"]],
            note: "Saat yoktur: girişler değişir değişmez çıkış tepki verir. S = R = 1 yasaktır (Q ve Q̅ ikisi de 0 olur)." },
        D: { title: "D flip-flop", ins: ["D"], clocked: true,
            next: (q, x) => x.D,
            table: [["0", "0"], ["1", "1"]],
            note: "Saatin yükselen kenarında D'deki değeri yakalar ve bir sonraki kenara kadar saklar. 1 bitlik bellek!" },
        JK: { title: "JK flip-flop", ins: ["J", "K"], clocked: true,
            next: (q, x) => (x.J && x.K ? 1 - q : x.J ? 1 : x.K ? 0 : q),
            table: [["0", "0", "Q (değişmez)"], ["0", "1", "0 (sıfırla)"], ["1", "0", "1 (kur)"], ["1", "1", "Q̅ (tersle)"]],
            note: "SR'nin geliştirilmiş hâli: J = K = 1 yasak değil, çıkışı tersler (toggle)." },
        T: { title: "T flip-flop", ins: ["T"], clocked: true,
            next: (q, x) => (x.T ? 1 - q : q),
            table: [["0", "Q (değişmez)"], ["1", "Q̅ (tersle)"]],
            note: "T = 1 iken her saat kenarında çıkış tersine döner. Sayaçların temel taşı." },
    };

    function waveSvg(hist, rows) {
        const N = hist.length, cw = 26, rh = 30, lw = 42;
        const w = lw + Math.max(N, 1) * cw + 6, h = rows.length * rh + 6;
        let s = `<svg class="wave" viewBox="0 0 ${w} ${h}" width="${w}" style="max-width:100%;height:auto">`;
        rows.forEach((r, ri) => {
            const y0 = 6 + ri * rh, hi = y0 + 4, lo = y0 + rh - 10;
            s += `<text class="wv-name" x="4" y="${y0 + rh / 2}">${r.label}</text>`;
            let d = "", prev = null;
            hist.forEach((smp, i) => {
                const v = r.get(smp), x = lw + i * cw;
                if (v === null || v === undefined) { prev = null; return; }
                const y = v ? hi : lo;
                d += prev === null ? `M${x} ${y}` : prev !== y ? ` V${y}` : "";
                d += ` H${x + cw}`;
                prev = y;
            });
            s += `<line class="wv-base" x1="${lw}" x2="${w - 4}" y1="${lo}" y2="${lo}"/><path class="wv-line ${r.cls || ""}" d="${d}"/>`;
        });
        return s + `</svg>`;
    }

    W.flipflop = function (root, o) {
        const types = o.types || ["SR", "D", "JK", "T"];
        let type = o.type || types[0];
        let q = 0, x = {}, hist = [];
        const head = el(`<div></div>`);
        root.appendChild(head);
        if (types.length > 1) chips(head, types.map((t) => FF[t].title), types.indexOf(type), (i) => { type = types[i]; reset(); });
        const sw = el(`<div class="ff-controls"></div>`), stage = el(`<div class="ff-stage"></div>`), wave = el(`<div class="wave-wrap"></div>`);
        [sw, stage, wave].forEach((n) => root.appendChild(n));

        const push = (clk) => { hist.push({ clk, x: Object.assign({}, x), q }); if (hist.length > 22) hist.shift(); };
        function reset() { q = 0; x = {}; FF[type].ins.forEach((n) => (x[n] = 0)); hist = []; push(0); build(); }

        function onInput() {
            const ff = FF[type];
            if (!ff.clocked) { const nq = ff.next(q, x); q = nq === null ? q : nq; }
            push(0);
            build();
        }
        function clock() {
            const ff = FF[type];
            q = ff.next(q, x);
            push(1); push(0);
            build();
        }

        function build() {
            const ff = FF[type];
            const bad = !ff.clocked && ff.next(q, x) === null;
            sw.innerHTML = "";
            switches(sw, ff.ins, x, onInput);
            if (ff.clocked) {
                const b = el(`<button type="button" class="btn small">⏱ Saat darbesi ↑</button>`);
                b.addEventListener("click", clock);
                sw.appendChild(b);
            }
            const rb = el(`<button type="button" class="btn small ghost">Sıfırla</button>`);
            rb.addEventListener("click", reset);
            sw.appendChild(rb);
            const heads = ff.ins.concat([ff.clocked ? "Q<sub>sonraki</sub>" : "Q"]);
            const curRow = ff.table.findIndex((row) => ff.ins.every((n, i) => String(x[n]) === row[i]));
            stage.innerHTML = `<div class="ff-box">
                    <div class="ff-chip"><div class="ff-pins">${ff.ins.map((n) => `<span class="${x[n] ? "on" : ""}">${n}</span>`).join("")}${ff.clocked ? `<span class="clk">▷ CLK</span>` : ""}</div>
                    <div class="ff-name">${type}</div>
                    <div class="ff-outs">${lamp(bad ? 0 : q, "Q")}${lamp(bad ? 0 : 1 - q, "Q̅")}</div></div>
                    ${bad ? `<div class="bad" style="font-weight:700;margin-top:8px">⚠️ S = R = 1: geçersiz durum!</div>` : ""}
                </div>
                <div class="ff-side"><div class="table-wrap"><table class="mtable tt"><thead><tr>${heads.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>
                    ${ff.table.map((row, i) => `<tr class="${i === curRow ? "cur" : ""}">${row.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
                    <p class="muted" style="font-size:13px;margin:8px 0 0">${ff.note}</p></div>`;
            const rows = (ff.clocked ? [{ label: "CLK", get: (s) => s.clk, cls: "clk" }] : [])
                .concat(ff.ins.map((n) => ({ label: n, get: (s) => s.x[n] })))
                .concat([{ label: "Q", get: (s) => s.q, cls: "q" }]);
            wave.innerHTML = `<div class="section-title" style="margin:12px 0 4px">Zaman diyagramı</div>${waveSvg(hist, rows)}`;
        }
        reset();
    };

    /* ---------------- Sayaç (T flip-floplarla) ---------------- */
    W.counter = function (root, o) {
        const n = o.bits || 3;
        let v = 0, down = false, hist = [];
        if (o.choose !== false) chips(root, ["Yukarı say", "Aşağı say"], 0, (i) => { down = i === 1; });
        const bar = el(`<div class="ex-actions"><button type="button" class="btn small" data-clk>⏱ Saat darbesi ↑</button><button type="button" class="btn small ghost" data-rst>Sıfırla</button></div>`);
        const stage = el(`<div class="counter-stage"></div>`), wave = el(`<div class="wave-wrap"></div>`), info = el(`<div class="readout"></div>`);
        [bar, stage, info, wave].forEach((x) => root.appendChild(x));
        const push = (clk) => { hist.push({ clk, v }); if (hist.length > 22) hist.shift(); };
        bar.querySelector("[data-clk]").addEventListener("click", () => {
            v = (v + (down ? -1 : 1) + (1 << n)) % (1 << n);
            push(1); push(0); build();
        });
        bar.querySelector("[data-rst]").addEventListener("click", () => { v = 0; hist = []; push(0); build(); });

        function build() {
            const bits = [];
            for (let i = n - 1; i >= 0; i--) bits.push(`<div class="cnt-ff"><div class="ff-name">T=1</div>${lamp((v >> i) & 1, `Q<sub>${i}</sub>`)}</div>`);
            stage.innerHTML = bits.join(`<span class="cnt-arrow">←</span>`);
            info.innerHTML = `Durum: (${L.bin(v, n)})<sub>2</sub> = <b>${v}</b> · ${n} flip-flop → 0…${(1 << n) - 1} arası ${1 << n} durum, sonra başa döner.`;
            const rows = [{ label: "CLK", get: (s) => s.clk, cls: "clk" }];
            for (let i = 0; i < n; i++) rows.push({ label: `Q${i}`, get: (s) => (s.v >> i) & 1, cls: "q" });
            wave.innerHTML = `<div class="section-title" style="margin:12px 0 4px">Zaman diyagramı</div>${waveSvg(hist, rows)}
                <p class="muted" style="font-size:13px;margin:4px 0 0">Dikkat: Q0 her darbede, Q1 her 2 darbede, Q2 her 4 darbede bir değişir — frekans her adımda yarıya iner.</p>`;
        }
        push(0);
        build();
    };

    /* ---------------- Çoklayıcı (MUX) ve kod çözücü ---------------- */
    W.mux = function (root, o) {
        let mode = o.mode === "decoder" ? 1 : 0;
        const st = { D0: 0, D1: 1, D2: 0, D3: 1, S1: 0, S0: 1, A1: 1, A0: 0, E: 1 };
        if (o.choose !== false) chips(root, ["4→1 Çoklayıcı (MUX)", "2→4 Kod çözücü"], mode, (i) => { mode = i; build(); });
        const sw = el(`<div style="margin-top:12px"></div>`), stage = el(`<div class="mux-stage"></div>`), info = el(`<div class="readout"></div>`);
        [sw, stage, info].forEach((x) => root.appendChild(x));
        const sub = (nm) => nm.replace(/(\d)$/, "<sub>$1</sub>");

        function build() {
            sw.innerHTML = "";
            if (mode === 0) {
                switches(sw, ["D0", "D1", "D2", "D3"], st, build, { label: sub });
                switches(sw, ["S1", "S0"], st, build, { label: sub });
                const sel = st.S1 * 2 + st.S0, y = st["D" + sel];
                stage.innerHTML = `<div class="mux-ins">${[0, 1, 2, 3].map((i) => `<div class="mux-in${i === sel ? " sel" : ""}">D<sub>${i}</sub> = ${st["D" + i]} <span class="mux-path">${i === sel ? "━━━▶" : "┄┄┄"}</span></div>`).join("")}</div>
                    <div class="mux-box">MUX<small>seçici: ${st.S1}${st.S0} = ${sel}</small></div>
                    <div class="mux-out">━▶ ${lamp(y, "Y")}</div>`;
                info.innerHTML = `Seçici bitleri S<sub>1</sub>S<sub>0</sub> = (${st.S1}${st.S0})<sub>2</sub> = ${sel} → çıkışa <b>D<sub>${sel}</sub></b> bağlanır.
                    <div style="margin-top:4px">${tex("Y = \\overline{S_1}\\,\\overline{S_0}D_0 + \\overline{S_1}S_0D_1 + S_1\\overline{S_0}D_2 + S_1S_0D_3")}</div>`;
            } else {
                switches(sw, ["E", "A1", "A0"], st, build, { label: sub });
                const k = st.A1 * 2 + st.A0;
                stage.innerHTML = `<div class="mux-box">2→4<small>giriş: ${st.A1}${st.A0} = ${k}${st.E ? "" : " · kapalı"}</small></div>
                    <div class="dec-outs">${[0, 1, 2, 3].map((i) => lamp(st.E && i === k ? 1 : 0, `Y<sub>${i}</sub>`)).join("")}</div>`;
                info.innerHTML = `E (etkinleştirme) = ${st.E}. ${st.E ? `Giriş (${st.A1}${st.A0})<sub>2</sub> = ${k} olduğundan yalnızca <b>Y<sub>${k}</sub></b> yanar.` : "E = 0 iken bütün çıkışlar 0'dır."}
                    <div style="margin-top:4px">${tex("Y_0 = E\\,\\overline{A_1}\\,\\overline{A_0},\\quad Y_1 = E\\,\\overline{A_1}A_0,\\quad Y_2 = E\\,A_1\\overline{A_0},\\quad Y_3 = E\\,A_1A_0")}</div>`;
            }
        }
        build();
    };

    /* ---------------- İkili sayı: bitlere dokun ---------------- */
    W.binary = function (root, o) {
        const n = o.bits || 8;
        let v = o.value !== undefined ? o.value : 13;
        const stage = el(`<div class="bin-stage"></div>`), info = el(`<div class="readout"></div>`);
        root.appendChild(stage);
        root.appendChild(info);
        function build() {
            const cells = [];
            for (let i = n - 1; i >= 0; i--) cells.push(`<button type="button" class="bin-bit${(v >> i) & 1 ? " on" : ""}" data-i="${i}"><span class="bb-w">${1 << i}</span><span class="bb-v">${(v >> i) & 1}</span></button>`);
            stage.innerHTML = cells.join("");
            stage.querySelectorAll("[data-i]").forEach((b) => b.addEventListener("click", () => { v ^= 1 << Number(b.dataset.i); build(); }));
            const parts = [];
            for (let i = n - 1; i >= 0; i--) if ((v >> i) & 1) parts.push(1 << i);
            info.innerHTML = `(${L.bin(v, n)})<sub>2</sub> = ${parts.join(" + ") || "0"} = <b>${v}</b> &nbsp;·&nbsp; onaltılık: <b>${v.toString(16).toUpperCase()}</b><sub>16</sub>`;
        }
        build();
    };

    W._helpers = { el, tex, esc, chips, switches, lamp, truthHtml, bindSvgInputs };
    global.Widgets = W;
})(window);
