/*
 * Madam Bilgisayar - uygulama kabuğu: yönlendirme (hash), sayfalar, ilerleme, tema, PWA.
 * Sayfalar: #/  ·  #/konu/:id  ·  #/ders/:id  ·  #/lab[?e=...]
 */
(function () {
    "use strict";

    const view = document.getElementById("view");

    /* ---------------- Depolama (localStorage erişilemezse sessizce geç) ---------------- */
    const store = {
        get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
        set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* yok say */ } },
    };
    let progress = store.get("madamcs_progress", {});

    /* ---------------- Ders listesi ---------------- */
    const chapters = Object.values(CHAPTERS).sort((a, b) => a.no - b.no);
    const lessons = [];
    chapters.forEach((ch) => ch.sections.forEach((s) => s.lessons.forEach((l, i) => lessons.push(Object.assign({}, l, { chapter: ch, section: s, idxInSection: i })))));
    const lessonById = {};
    lessons.forEach((l, i) => { l.index = i; lessonById[l.id] = l; });
    const chapterLessons = (ch) => lessons.filter((l) => l.chapter === ch);

    const doneCount = (ch) => (ch ? chapterLessons(ch) : lessons).filter((l) => progress[l.id]).length;
    const pct = (ch) => Math.round((doneCount(ch) / (ch ? chapterLessons(ch) : lessons).length) * 100);

    function esc(s) {
        return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    function toast(msg) {
        const t = document.getElementById("toast");
        t.textContent = msg;
        t.classList.add("show");
        clearTimeout(toast._t);
        toast._t = setTimeout(() => t.classList.remove("show"), 2200);
    }

    function renderMath(el) {
        if (typeof window.renderMathInElement !== "function") return;
        try {
            renderMathInElement(el, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false },
                ],
                throwOnError: false,
                ignoredClasses: ["no-math"],
            });
        } catch (e) { /* KaTeX yoksa düz metin kalır */ }
    }

    /* ---------------- Ana sayfa ---------------- */
    function pageHome() {
        const last = lessonById[store.get("madamcs_last", "")];
        const next = last || lessons.find((l) => !progress[l.id]) || lessons[0];
        return `
        <section class="hero">
            <svg class="hero-art" viewBox="0 0 200 160" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M10 55 H62 M10 105 H62 M150 80 H192" stroke-width="4"/>
                <path d="M62 30 H100 A50 50 0 0 1 100 130 H62 Z"/>
                <circle cx="192" cy="80" r="6" fill="#fff"/>
                <path d="M20 145 h12 v-10 h12 v10 h12 v-10 h12 v10 h12" stroke-width="3" stroke-dasharray="0"/>
            </svg>
            <h1>Bilgisayarın dilini en basit hâliyle öğren</h1>
            <p>Her konu önce “basitçe” anlatılır, sonra tanım, adım adım örnek, dokunarak oynayabileceğin bir devre ve kısa bir test gelir.</p>
            <div class="hero-actions">
                <a class="btn" href="#/ders/${next.id}">${last ? "▶ Kaldığın yerden devam et" : "▶ Derse başla"}</a>
                <a class="btn ghost" href="#/lab">🔌 Mantık Lab</a>
            </div>
        </section>
        <div class="stat-row">
            <div class="stat-box"><div class="num">${doneCount()}</div><div class="lbl">tamamlanan ders</div></div>
            <div class="stat-box"><div class="num">${lessons.length}</div><div class="lbl">ders · ${chapters.length} bölüm</div></div>
            <div class="stat-box"><div class="num">%${pct()}</div><div class="lbl">ilerleme</div></div>
        </div>
        ${last ? `<div class="card" style="margin-top:16px">
            <h2 class="section-title">Kaldığın yer</h2>
            <a class="lesson-row${progress[last.id] ? " done" : ""}" href="#/ders/${last.id}">
                <div class="lesson-check">${progress[last.id] ? "✓" : last.idxInSection + 1}</div>
                <div><div class="lt">${esc(last.title)}</div><div class="ls">${esc(last.chapter.title)} · ${last.section.no} ${esc(last.section.title)}</div></div>
                <span class="arrow">›</span>
            </a></div>` : ""}
        <a class="card lesson-row" href="#/testler" style="margin-top:16px;padding:18px 20px">
            <div class="chapter-no" style="background:var(--green);color:#fff">🎯</div>
            <div><div class="lt">Testler ve alıştırmalar</div><div class="ls">${PRACTICE.tests.length} çoktan seçmeli test · ${PRACTICE.problemSets.reduce((a, s) => a + s.problems.length, 0)} alıştırmanın adım adım çözümü</div></div>
            <span class="arrow">›</span>
        </a>
        <div class="card" style="margin-top:16px">
            <h2 class="section-title">Konular · ${esc(COURSE.title)}</h2>
            ${chapterGrid()}
        </div>
        <div class="card">
            <h2 class="section-title">Her derste</h2>
            <div class="chapter-grid">
                <div class="chapter-card"><div class="chapter-no" style="background:var(--orange-pale);color:var(--orange)">💡</div><div><div class="ct">Basitçe</div><div class="cs">Konunun özü, günlük dille</div></div></div>
                <div class="chapter-card"><div class="chapter-no">📘</div><div><div class="ct">Tanım ve kurallar</div><div class="cs">Resmî hâliyle, tablolarla</div></div></div>
                <div class="chapter-card"><div class="chapter-no" style="background:var(--purple-pale);color:var(--purple)">🧪</div><div><div class="ct">Etkileşimli devre</div><div class="cs">Anahtara dokun, ışığı gör</div></div></div>
                <div class="chapter-card"><div class="chapter-no" style="background:var(--green-pale);color:var(--green)">🎯</div><div><div class="ct">Adım adım örnek + test</div><div class="cs">Kendini hemen dene</div></div></div>
            </div>
        </div>
        <div class="card">
            <h2 class="section-title">Telefona / tablete ekle</h2>
            <p class="muted" style="margin:0">Android (Chrome): menü ⋮ → <b>Ana ekrana ekle</b> ya da <b>Uygulamayı yükle</b>. iPhone/iPad (Safari): paylaş ⎋ → <b>Ana Ekrana Ekle</b>. Eklendikten sonra uygulama gibi tam ekran açılır ve bir kez açılan dersler internetsiz de çalışır.</p>
            <div class="ex-actions"><button class="btn small" type="button" data-install hidden>📲 Şimdi yükle</button></div>
        </div>`;
    }

    /* ---------------- Bölüm listesi ve bölüm sayfası ---------------- */
    function chapterGrid() {
        return `<div class="chapter-grid">${COURSE.chapters.map((c) => {
            const ch = CHAPTERS[c.id];
            if (!ch) return `<div class="chapter-card locked" title="Yakında"><div class="chapter-no">${c.no}</div><div><div class="ct">${esc(c.title)}</div><div class="cs">Yakında</div></div></div>`;
            const p = pct(ch);
            return `<a class="chapter-card available" href="#/konu/${c.id}"><div class="chapter-no">${c.no}</div><div style="flex:1;min-width:0"><div class="ct">${esc(c.title)}</div><div class="cs">${esc(c.sub)}</div>
                <div class="progress-bar" style="height:5px;margin-top:6px"><span style="width:${p}%"></span></div></div></a>`;
        }).join("")}</div>`;
    }

    function pageChapters() {
        return `
        <div class="page-head">
            <div class="crumbs"><a href="#/">Ana Sayfa</a> › <span>Konular</span></div>
            <h1>${esc(COURSE.title)}</h1>
            <p>${esc(COURSE.source)}. Hazır olanlara dokunup başla; diğerleri yakında eklenecek.</p>
        </div>
        <div class="card">${chapterGrid()}</div>`;
    }

    function pageChapter(id) {
        const chapter = CHAPTERS[id];
        if (!chapter) return pageNotFound();
        const secs = chapter.sections.map((s) => {
            const d = s.lessons.filter((l) => progress[l.id]).length;
            const rows = s.lessons.map((l, i) => `
                <a class="lesson-row${progress[l.id] ? " done" : ""}" href="#/ders/${l.id}">
                    <div class="lesson-check">${progress[l.id] ? "✓" : i + 1}</div>
                    <div><div class="lt">${esc(l.title)}</div><div class="ls">${l.summary}</div></div>
                    <span class="arrow">›</span>
                </a>`).join("");
            return `<div class="card section-block">
                <div class="section-head"><span class="section-num">${s.no}</span><h2>${esc(s.title)}</h2>
                <span class="pill ${d === s.lessons.length ? "green" : "gray"}">${d}/${s.lessons.length}</span></div>
                <div class="lesson-list">${rows}</div>
                ${practiceLinks(s.no) ? `<div class="section-title" style="margin:14px 0 6px">Kendini sına</div><div class="lesson-list">${practiceLinks(s.no)}</div>` : ""}</div>`;
        }).join("");
        return `
        <div class="page-head">
            <div class="crumbs"><a href="#/konular">Konular</a> › <span>Bölüm ${chapter.no}</span></div>
            <h1>${chapter.no}. ${esc(chapter.title)}</h1>
            <p>${esc(chapter.intro)}</p>
            <div class="ex-actions"><a class="btn small ghost" href="#/ozet/${chapter.id}">📄 Kural özeti (kopya kâğıdı)</a></div>
            <div style="display:flex;align-items:center;gap:12px;margin-top:14px">
                <div class="progress-bar" style="flex:1"><span style="width:${pct(chapter)}%"></span></div>
                <b style="color:var(--blue-deep);font-family:Sora,sans-serif">%${pct(chapter)}</b>
            </div>
        </div>
        ${secs}
        ${problemSets.filter((s) => s.whole && s.chapter === chapter.id).map((s) => `<div class="card"><div class="section-title">Bölüm sonu</div><div class="lesson-list">
            <a class="lesson-row" href="#/problemler/${s.id}"><div class="lesson-check" style="border-color:var(--purple);color:var(--purple)">📚</div><div><div class="lt">${esc(s.title)}</div><div class="ls">${s.problems.length} alıştırma · ${solvedCount(s)} çözüldü</div></div><span class="arrow">›</span></a></div></div>`).join("")}`;
    }

    /* ---------------- Formül özeti (kopya kâğıdı) ---------------- */
    function pageSummary(id) {
        const chapter = CHAPTERS[id];
        if (!chapter) return pageNotFound();
        const kinds = { def: ["📘", "Tanım"], formula: ["🧮", "Kural"], table: ["📊", "Tablo"] };
        const secs = chapter.sections.map((s) => {
            const items = [];
            s.lessons.forEach((l) => l.blocks.forEach((b) => {
                if (!kinds[b.t]) return;
                const title = b.title || kinds[b.t][1];
                items.push(`<div class="sum-item sum-${b.t}">
                    <div class="sum-title">${kinds[b.t][0]} ${title}<a class="sum-src no-print" href="#/ders/${l.id}" title="Derse git">${esc(l.title)} ›</a></div>
                    <div class="sum-body">${b.html}</div></div>`);
            }));
            return items.length ? `<section class="sum-section"><h2 class="sum-head"><span class="section-num">${s.no}</span> ${esc(s.title)}</h2><div class="sum-grid">${items.join("")}</div></section>` : "";
        }).join("");
        return `
        <div class="page-head no-print">
            <div class="crumbs"><a href="#/konu/${chapter.id}">${chapter.no}. ${esc(chapter.title)}</a> › <span>Kural özeti</span></div>
            <h1>Kural Özeti · ${esc(chapter.title)}</h1>
            <p>Bölümdeki tüm tanım, kural ve tabloların bir arada hâli. Her kutudaki bağlantı ilgili derse götürür.</p>
            <div class="ex-actions"><button type="button" class="btn small" data-print>🖨️ Yazdır / PDF kaydet</button></div>
        </div>
        <div class="print-only sum-print-head"><b>${esc(COURSE.title)} · ${chapter.no}. ${esc(chapter.title)}</b> — Kural özeti</div>
        <div class="summary">${secs}</div>`;
    }

    /* ---------------- Ders sayfası ---------------- */
    let widgetQueue = [];

    function box(cls, icon, title, html) {
        return `<div class="box ${cls}"><div class="box-title">${icon} ${title}</div><div>${html}</div></div>`;
    }

    function renderBlock(b, bi) {
        switch (b.t) {
            case "p": return `<div class="card">${b.html.trim().startsWith("<") ? b.html : `<p>${b.html}</p>`}</div>`;
            case "simple": return box("simple", "💡", "Basitçe", b.html);
            case "def": return box("def", "📘", b.title || "Tanım", b.html);
            case "formula": return box("formula", "🧮", b.title || "Kural", b.html);
            case "tip": return box("tip", "✅", b.title || "İpucu", b.html);
            case "warn": return box("warn", "⚠️", b.title || "Dikkat", b.html);
            case "table": return `<div class="card"><div class="table-wrap">${b.html}</div></div>`;
            case "example": {
                const steps = b.steps.map((s, i) => `<div class="ex-step" hidden><span class="sn">${i + 1}</span><div class="sb">${s}</div></div>`).join("");
                return `<div class="card example" data-example>
                    <div class="box-title" style="color:var(--blue-deep)">✏️ Örnek</div>
                    <div class="ex-q">${b.q}</div>
                    <div class="ex-steps">${steps}<div class="ex-answer" hidden><b>Sonuç:</b> ${b.answer}</div></div>
                    <div class="ex-actions">
                        <button type="button" class="btn small" data-step>Çözümü adım adım göster</button>
                        <button type="button" class="btn small ghost" data-all>Tamamını göster</button>
                    </div></div>`;
            }
            case "quiz": {
                const opts = b.options.map((o, i) => `<button type="button" class="q-opt" data-i="${i}">${o.replace(/\$([^$]+)\$/g, (m, x) => `$\\displaystyle ${x}$`)}</button>`).join("");
                return `<div class="card quiz" data-quiz data-correct="${b.correct}">
                    <div class="box-title" style="color:var(--green)">🎯 Kendini dene</div>
                    <div class="q-text">${b.q}</div>
                    <div class="q-options">${opts}</div>
                    <div class="q-feedback ok" hidden><b>Doğru! 🎉</b> ${b.why || ""}</div>
                    <div class="q-feedback no" hidden><b>Olmadı.</b> Doğru cevap: <b>${b.options[b.correct]}</b>. ${b.why || ""}</div>
                </div>`;
            }
            case "widget":
                widgetQueue.push({ id: `w${bi}`, name: b.name, opts: b.opts });
                return `<div class="card widget">
                    <div class="widget-head"><span class="wi">🧪</span><span class="wt">${esc(b.title)}</span></div>
                    <div class="widget-body">${b.desc ? `<p class="widget-desc">${b.desc}</p>` : ""}<div data-widget="w${bi}"></div></div>
                </div>`;
        }
        return "";
    }

    function pageLesson(id) {
        const l = lessonById[id];
        if (!l) return pageNotFound();
        store.set("madamcs_last", id);
        widgetQueue = [];
        const prev = lessons[l.index - 1], next = lessons[l.index + 1];
        const body = l.blocks.map(renderBlock).join("");
        const done = !!progress[l.id];
        return `
        <div class="lesson-hero">
            <div class="crumbs"><a href="#/konu/${l.chapter.id}">${l.chapter.no}. ${esc(l.chapter.title)}</a> › <span>${l.section.no} ${esc(l.section.title)}</span></div>
            <h1>${esc(l.title)}</h1>
            <p class="lead">${l.summary} <span class="pill gray" style="margin-left:4px">Ders ${l.idxInSection + 1}/${l.section.lessons.length}</span></p>
        </div>
        <div class="lesson-body">${body}
            ${l.idxInSection === l.section.lessons.length - 1 && practiceLinks(l.section.no) ? `<div class="card"><div class="box-title" style="color:var(--green)">🎯 ${l.section.no} bitti — kendini sına</div><div class="lesson-list">${practiceLinks(l.section.no)}</div></div>` : ""}
            <div class="card lesson-done-bar">
                <div><b>${done ? "Bu dersi tamamladın ✓" : "Bu dersi bitirdin mi?"}</b><div class="muted" style="font-size:13px">İlerlemen bu cihazda saklanır.</div></div>
                <button type="button" class="btn ${done ? "ghost" : "success"}" data-done>${done ? "Tamamlanmadı olarak işaretle" : "✓ Anladım, tamamla"}</button>
            </div>
            <div class="lesson-nav">
                ${prev ? `<a class="btn ghost nav-prev" href="#/ders/${prev.id}"><span><span class="nl">‹ Önceki</span>${esc(prev.title)}</span></a>` : "<span></span>"}
                ${next ? `<a class="btn nav-next" href="#/ders/${next.id}"><span><span class="nl">${next.chapter === l.chapter ? "Sonraki ›" : `Sonraki bölüm: ${esc(next.chapter.title)} ›`}</span>${esc(next.title)}</span></a>` : `<a class="btn nav-next" href="#/konu/${l.chapter.id}">Bölüm özeti ›</a>`}
            </div>
        </div>`;
    }

    function bindLesson(id) {
        view.querySelectorAll("[data-example]").forEach((ex) => {
            const steps = Array.from(ex.querySelectorAll(".ex-step"));
            const ans = ex.querySelector(".ex-answer");
            const bStep = ex.querySelector("[data-step]"), bAll = ex.querySelector("[data-all]");
            let shown = 0;
            const finish = () => { ans.hidden = false; bStep.hidden = true; bAll.hidden = true; };
            bStep.addEventListener("click", () => {
                if (shown < steps.length) { steps[shown++].hidden = false; bStep.textContent = shown < steps.length ? "Sonraki adım ›" : "Sonucu göster"; }
                else finish();
            });
            bAll.addEventListener("click", () => { steps.forEach((s) => (s.hidden = false)); finish(); });
        });
        view.querySelectorAll("[data-quiz]").forEach((q) => {
            const correct = Number(q.dataset.correct);
            q.querySelectorAll(".q-opt").forEach((b) => b.addEventListener("click", () => {
                const i = Number(b.dataset.i);
                q.querySelectorAll(".q-opt").forEach((x) => {
                    x.disabled = true;
                    if (Number(x.dataset.i) === correct) x.classList.add("correct");
                });
                if (i !== correct) b.classList.add("wrong");
                q.querySelector(i === correct ? ".q-feedback.ok" : ".q-feedback.no").hidden = false;
            }));
        });
        const doneBtn = view.querySelector("[data-done]");
        if (doneBtn) doneBtn.addEventListener("click", () => {
            if (progress[id]) delete progress[id]; else progress[id] = true;
            store.set("madamcs_progress", progress);
            if (progress[id]) {
                toast("Harika! Ders tamamlandı ✓");
                const next = lessons[lessonById[id].index + 1];
                if (next) { location.hash = "#/ders/" + next.id; return; }
            }
            route();
        });
        widgetQueue.forEach((w) => {
            const host = view.querySelector(`[data-widget="${w.id}"]`);
            if (!host || !Widgets[w.name]) return;
            try { Widgets[w.name](host, w.opts || {}); } catch (e) {
                host.innerHTML = `<p class="muted">Bu araç yüklenemedi.</p>`;
                console.error(e);
            }
        });
    }

    /* ---------------- Testler ve alıştırmalar ---------------- */
    const tests = PRACTICE.tests, problemSets = PRACTICE.problemSets;
    let testScores = store.get("madamcs_tests", {});
    let solved = store.get("madamcs_solved", {});
    const solvedCount = (set) => set.problems.filter((p) => solved[`${set.id}#${p.no}`]).length;
    const labLink = (exprs) => "#/lab?e=" + encodeURIComponent(JSON.stringify(exprs));
    const practiceFor = (secNo) => ({
        tests: tests.filter((t) => t.sections.includes(secNo)),
        sets: problemSets.filter((s) => s.sections.includes(secNo) && !s.whole),
    });

    function practiceLinks(secNo) {
        const { tests: ts, sets } = practiceFor(secNo);
        return ts.map((t) => `<a class="lesson-row" href="#/test/${t.id}"><div class="lesson-check" style="border-color:var(--green);color:var(--green)">🎯</div><div><div class="lt">${esc(t.title)}</div><div class="ls">${t.questions.length} soru · çoktan seçmeli${testScores[t.id] ? ` · en iyi ${testScores[t.id].best}/${t.questions.length}` : ""}</div></div><span class="arrow">›</span></a>`).join("") +
            sets.map((s) => `<a class="lesson-row" href="#/problemler/${s.id}"><div class="lesson-check" style="border-color:var(--purple);color:var(--purple)">📚</div><div><div class="lt">${esc(s.title)}</div><div class="ls">${s.problems.length} alıştırma · ${solvedCount(s)} çözüldü</div></div><span class="arrow">›</span></a>`).join("");
    }

    function pagePractice() {
        const grouped = (list, render) => chapters.map((ch) => {
            const items = list.filter((x) => x.chapter === ch.id);
            return items.length ? `<div class="section-title" style="margin:14px 0 4px">${ch.no}. ${esc(ch.title)}</div>${items.map(render).join("")}` : "";
        }).join("");
        const tcards = grouped(tests, (t) => {
            const sc = testScores[t.id];
            return `<a class="lesson-row" href="#/test/${t.id}">
                <div class="lesson-check" style="${sc ? "background:var(--green);border-color:var(--green);color:#fff" : ""}">${sc ? sc.best : "🎯"}</div>
                <div><div class="lt">${esc(t.title)}</div><div class="ls">${esc(t.desc)}</div></div>
                <span class="pill ${sc ? "green" : "gray"}" style="margin-left:auto;white-space:nowrap">${sc ? `en iyi ${sc.best}/${t.questions.length}` : `${t.questions.length} soru`}</span></a>`;
        });
        const pcards = grouped(problemSets, (s) => {
            const n = solvedCount(s);
            return `<a class="lesson-row${n === s.problems.length ? " done" : ""}" href="#/problemler/${s.id}">
                <div class="lesson-check">${n === s.problems.length ? "✓" : "📚"}</div>
                <div><div class="lt">${esc(s.title)}</div><div class="ls">${esc(s.desc || "")}</div></div>
                <span class="pill ${n ? "green" : "gray"}" style="margin-left:auto;white-space:nowrap">${n}/${s.problems.length}</span></a>`;
        });
        return `
        <div class="page-head">
            <div class="crumbs"><a href="#/">Ana Sayfa</a> › <span>Testler</span></div>
            <h1>Testler ve Problemler</h1>
            <p>Çoktan seçmeli testlerle kendini dene; alıştırmaların adım adım çözümlerine bak.</p>
        </div>
        <div class="card"><div class="section-head"><span class="section-num">🎯</span><h2>Çoktan seçmeli testler</h2></div>
            <p class="muted" style="margin:0 0 10px;font-size:14px">Her test 10 soru. Bitirince puanını ve her sorunun açıklamasını görürsün.</p>
            <div class="lesson-list">${tcards}</div></div>
        <div class="card"><div class="section-head"><span class="section-num" style="background:var(--purple)">📚</span><h2>Alıştırmalar</h2></div>
            <p class="muted" style="margin:0 0 10px;font-size:14px">Kâğıt kalemle çözülecek sorular. Önce kendin dene, sonra çözümü aç.</p>
            <div class="lesson-list">${pcards}</div></div>`;
    }

    function pageTest(id) {
        const t = tests.find((x) => x.id === id);
        if (!t) return pageNotFound();
        const sc = testScores[t.id];
        // Şıklar her açılışta karışır; data-i orijinal indeksi tutar
        const shuffled = (n) => {
            const a = Array.from({ length: n }, (_, i) => i);
            for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
            return a;
        };
        const big = (o) => o.replace(/\$([^$]+)\$/g, (m, x) => `$\\displaystyle ${x}$`);
        const qs = t.questions.map((q, qi) => `
            <div class="card quiz" data-q="${qi}">
                <div class="box-title" style="color:var(--blue-deep)">Soru ${qi + 1} <span class="q-mark" style="margin-left:auto"></span></div>
                <div class="q-text">${q.q}</div>
                <div class="q-options">${shuffled(q.options.length).map((oi, pos) => `<button type="button" class="q-opt" data-i="${oi}"><span class="q-letter">${"ABCD"[pos]}</span> ${big(q.options[oi])}</button>`).join("")}</div>
                <div class="q-feedback" hidden><b>Açıklama:</b> ${q.why}</div>
            </div>`).join("");
        return `
        <div class="page-head">
            <div class="crumbs"><a href="#/testler">Testler</a> › <span>${esc(t.title)}</span></div>
            <h1>${esc(t.title)}</h1>
            <p>${esc(t.desc)}${sc ? ` <span class="pill green">En iyi: ${sc.best}/${t.questions.length}</span>` : ""}</p>
        </div>
        <div id="testResult"></div>
        <div class="lesson-body">${qs}
            <div class="card lesson-done-bar">
                <div><b data-answered>0 / ${t.questions.length} cevaplandı</b><div class="muted" style="font-size:13px">Boş bıraktıkların yanlış sayılır.</div></div>
                <button type="button" class="btn success" data-finish>Testi bitir</button>
            </div>
        </div>`;
    }

    function bindTest(id) {
        const t = tests.find((x) => x.id === id);
        if (!t) return;
        const answers = new Array(t.questions.length).fill(null);
        let finished = false;
        const answeredEl = view.querySelector("[data-answered]");
        view.querySelectorAll("[data-q]").forEach((card) => {
            const qi = Number(card.dataset.q);
            card.querySelectorAll(".q-opt").forEach((b) => b.addEventListener("click", () => {
                if (finished) return;
                answers[qi] = Number(b.dataset.i);
                card.querySelectorAll(".q-opt").forEach((x) => x.classList.toggle("selected", x === b));
                answeredEl.textContent = `${answers.filter((a) => a !== null).length} / ${t.questions.length} cevaplandı`;
            }));
        });
        view.querySelector("[data-finish]").addEventListener("click", (e) => {
            if (finished) { route(); return; }
            finished = true;
            let score = 0;
            view.querySelectorAll("[data-q]").forEach((card) => {
                const qi = Number(card.dataset.q), q = t.questions[qi], a = answers[qi];
                const ok = a === q.correct;
                if (ok) score++;
                card.querySelectorAll(".q-opt").forEach((x) => {
                    x.disabled = true;
                    const i = Number(x.dataset.i);
                    if (i === q.correct) x.classList.add("correct");
                    else if (i === a) x.classList.add("wrong");
                });
                const fb = card.querySelector(".q-feedback");
                fb.className = "q-feedback " + (ok ? "ok" : "no");
                fb.hidden = false;
                card.querySelector(".q-mark").innerHTML = ok ? `<span class="pill green">✓ Doğru</span>` : `<span class="pill" style="background:var(--red-pale);color:var(--red)">${a === null ? "Boş" : "✗ Yanlış"}</span>`;
            });
            const n = t.questions.length, prev = testScores[t.id];
            testScores[t.id] = { best: Math.max(score, prev ? prev.best : 0), last: score };
            store.set("madamcs_tests", testScores);
            const pctv = Math.round((score / n) * 100);
            const msg = pctv === 100 ? "Mükemmel! Hepsi doğru 🎉" : pctv >= 70 ? "Çok iyi! Yanlışlarının açıklamalarına bir göz at." : pctv >= 40 ? "Fena değil. Yanlış yaptığın konuların derslerine dönmek iyi olur." : "Konuları tekrar edip yeniden dene — açıklamalar yardımcı olacak.";
            const res = view.querySelector("#testResult");
            res.innerHTML = `<div class="card" style="margin-bottom:16px;text-align:center">
                <div class="section-title">Sonuç</div>
                <div style="font-family:Sora,sans-serif;font-weight:800;font-size:44px;color:${pctv >= 70 ? "var(--green)" : pctv >= 40 ? "var(--orange)" : "var(--red)"}">${score} / ${n}</div>
                <div class="progress-bar" style="max-width:320px;margin:8px auto"><span style="width:${pctv}%"></span></div>
                <p style="margin:8px 0 14px">${msg}</p>
                <div class="ex-actions" style="justify-content:center"><button type="button" class="btn" data-retry>↻ Tekrar çöz</button><a class="btn ghost" href="#/testler">Testlere dön</a></div></div>`;
            res.querySelector("[data-retry]").addEventListener("click", () => route());
            e.target.textContent = "↻ Tekrar çöz";
            res.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    function pageProblems(id) {
        const set = problemSets.find((x) => x.id === id);
        if (!set) return pageNotFound();
        const solBlock = (p) => {
            if (p.parts) {
                return p.parts.map((pt) => `<div class="ex-step"><span class="sn" style="width:auto;padding:0 8px;border-radius:12px">${pt.l}</span><div class="sb">
                    <div><b>Cevap:</b> ${pt.a}</div>
                    ${pt.s && pt.s.length ? `<div class="muted" style="margin-top:4px">${pt.s.join("<br>")}</div>` : ""}
                    ${pt.lab ? `<a class="btn small ghost" style="margin-top:8px" href="${labLink(pt.lab)}">🔌 Lab'da aç</a>` : ""}
                </div></div>`).join("");
            }
            return `<div class="ex-answer"><b>Cevap:</b> ${p.a}</div>` +
                (p.s || []).map((s, i) => `<div class="ex-step"><span class="sn">${i + 1}</span><div class="sb">${s}</div></div>`).join("");
        };
        const cards = set.problems.map((p) => {
            const key = `${set.id}#${p.no}`, isSolved = !!solved[key];
            const partsQ = p.parts ? `<div class="part-grid">${p.parts.map((pt) => `<div><b>(${pt.l})</b> ${pt.q}</div>`).join("")}</div>` : "";
            return `<div class="card problem${isSolved ? " solved" : ""}" data-key="${key}">
                <div class="box-title" style="color:var(--purple)">Alıştırma ${p.no}
                    <button type="button" class="solve-toggle" data-solve>${isSolved ? "✓ Çözdüm" : "Çözdüm olarak işaretle"}</button></div>
                <div class="q-text">${p.q}</div>${partsQ}
                <div class="ex-actions">
                    <button type="button" class="btn small" data-show>💡 Çözümü göster</button>
                    ${p.lab ? `<a class="btn small ghost" href="${labLink(p.lab)}">🔌 Lab'da aç</a>` : ""}
                </div>
                <div class="ex-steps" data-sol hidden>
                    ${p.note ? `<div class="box warn" style="padding:10px 14px"><div class="box-title" style="margin-bottom:4px">⚠️ Not</div>${p.note}</div>` : ""}
                    ${solBlock(p)}
                </div>
            </div>`;
        }).join("");
        const n = solvedCount(set);
        return `
        <div class="page-head">
            <div class="crumbs"><a href="#/testler">Testler</a> › <span>Alıştırmalar</span></div>
            <h1>${esc(set.title)}</h1>
            <p>${set.desc ? esc(set.desc) + " " : ""}Önce kendin çöz, sonra çözümü aç ve kontrol et.</p>
            <div style="display:flex;align-items:center;gap:12px;margin-top:14px;flex-wrap:wrap">
                <div class="progress-bar" style="flex:1;min-width:160px"><span data-pbar style="width:${Math.round((n / set.problems.length) * 100)}%"></span></div>
                <b style="color:var(--blue-deep);font-family:Sora,sans-serif" data-pcount>${n}/${set.problems.length} çözüldü</b>
                <button type="button" class="btn small ghost" data-allsol>Tüm çözümleri aç</button>
            </div>
        </div>
        <div class="lesson-body">${cards}</div>`;
    }

    function bindProblems(id) {
        const set = problemSets.find((x) => x.id === id);
        if (!set) return;
        const refresh = () => {
            const n = solvedCount(set);
            view.querySelector("[data-pcount]").textContent = `${n}/${set.problems.length} çözüldü`;
            view.querySelector("[data-pbar]").style.width = `${Math.round((n / set.problems.length) * 100)}%`;
        };
        view.querySelectorAll(".problem").forEach((card) => {
            const sol = card.querySelector("[data-sol]"), btn = card.querySelector("[data-show]");
            btn.addEventListener("click", () => {
                sol.hidden = !sol.hidden;
                btn.textContent = sol.hidden ? "💡 Çözümü göster" : "Çözümü gizle";
            });
            card.querySelector("[data-solve]").addEventListener("click", (e) => {
                const key = card.dataset.key;
                if (solved[key]) delete solved[key]; else solved[key] = true;
                store.set("madamcs_solved", solved);
                card.classList.toggle("solved", !!solved[key]);
                e.target.textContent = solved[key] ? "✓ Çözdüm" : "Çözdüm olarak işaretle";
                refresh();
            });
        });
        let allOpen = false;
        view.querySelector("[data-allsol]").addEventListener("click", (e) => {
            allOpen = !allOpen;
            view.querySelectorAll(".problem").forEach((card) => {
                card.querySelector("[data-sol]").hidden = !allOpen;
                card.querySelector("[data-show]").textContent = allOpen ? "Çözümü gizle" : "💡 Çözümü göster";
            });
            e.target.textContent = allOpen ? "Tüm çözümleri kapat" : "Tüm çözümleri aç";
        });
    }

    /* ---------------- Mantık Lab sayfası ---------------- */
    const EXAMPLES = ["A·B + A'·C", "(A + B)'", "A' + B'", "A ⊕ B", "p -> q", "!p | q", "(p -> q) & p -> q", "A'B'C + A'BC + AB'C + ABC",
        "A·B + A·C + B·C", "(A + B)(A + C)", "A ⊕ B ⊕ C", "A NAND B", "x'y'z' + x'yz' + xy'z' + xyz'", "AB + CD"];
    const DEFAULT_LAB = { f: "A'B'C + A'BC + AB'C + ABC", g: "", dc: "" };

    function pageLab() {
        return `
        <div class="lab">
            <div class="card lab-panel">
                <h2 style="margin:0;font-size:19px">Mantık Lab</h2>
                <label class="ctrl"><span class="ctrl-label"><span>F = (Boole ifadesi)</span></span>
                    <input class="text-input mono" data-f type="text" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="ör. A'B + AC"></label>
                <label class="ctrl"><span class="ctrl-label"><span>Önemsiz satırlar (X), isteğe bağlı</span></span>
                    <input class="text-input mono" data-dc type="text" spellcheck="false" autocomplete="off" placeholder="ör. 5, 7"></label>
                <label class="ctrl"><span class="ctrl-label"><span>G = (karşılaştırmak için, isteğe bağlı)</span></span>
                    <input class="text-input mono" data-g type="text" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="ör. A' + B'"></label>
                <div>
                    <div class="section-title" style="margin:6px 0 8px">Örnekler (dokun, F'ye yazılsın)</div>
                    <div class="chip-row">${EXAMPLES.map((e) => `<button type="button" class="chip mono" data-ex="${esc(e)}">${esc(e)}</button>`).join("")}</div>
                </div>
                <details class="help-box">
                    <summary>Nasıl yazılır?</summary>
                    <table>
                        <tr><td><code>A B C</code>, <code>p q r</code></td><td>değişkenler (tek harf)</td></tr>
                        <tr><td><code>A'</code>, <code>!A</code>, <code>~A</code>, <code>not A</code></td><td>DEĞİL (tümleyen)</td></tr>
                        <tr><td><code>AB</code>, <code>A·B</code>, <code>A*B</code>, <code>A&amp;B</code>, <code>A and B</code></td><td>VE</td></tr>
                        <tr><td><code>A+B</code>, <code>A|B</code>, <code>A or B</code></td><td>VEYA</td></tr>
                        <tr><td><code>A^B</code>, <code>A xor B</code>, <code>⊕</code></td><td>özel VEYA</td></tr>
                        <tr><td><code>nand</code>, <code>nor</code>, <code>xnor</code></td><td>tersli kapılar</td></tr>
                        <tr><td><code>p -&gt; q</code>, <code>p &lt;-&gt; q</code></td><td>ise, ancak ve ancak</td></tr>
                        <tr><td><code>0</code>, <code>1</code></td><td>sabitler</td></tr>
                    </table>
                    <p style="margin:8px 0 0">Öncelik (güçlüden zayıfa): DEĞİL → VE → XOR → VEYA → ise → ancak ve ancak. Emin değilsen parantez kullan.</p>
                </details>
            </div>
            <div class="lab-results" id="labOut"></div>
        </div>`;
    }

    function bindLab(query) {
        const st = Object.assign({}, DEFAULT_LAB, store.get("madamcs_lab", {}));
        const fromLink = query.get("e");
        if (fromLink) {
            try {
                const list = JSON.parse(fromLink);
                if (Array.isArray(list) && list.length) { st.f = String(list[0]); st.g = list[1] ? String(list[1]) : ""; st.dc = list[2] ? String(list[2]) : ""; }
            } catch (e) { /* bozuk bağlantı: kayıtlı değerlerle devam */ }
            history.replaceState(null, "", "#/lab");
        }
        const inF = view.querySelector("[data-f]"), inG = view.querySelector("[data-g]"), inD = view.querySelector("[data-dc]");
        const out = view.querySelector("#labOut");
        inF.value = st.f; inG.value = st.g; inD.value = st.dc;
        let drawMode = 0, steps = true;
        const sw = {};
        const html = (ast) => Logic.format(ast, { mode: "html", juxt: true });
        const lits = (ast) => (function c(n) { return n.op === "var" ? 1 : (n.a ? c(n.a) : 0) + (n.b ? c(n.b) : 0); })(ast);

        function update() {
            st.f = inF.value; st.g = inG.value; st.dc = inD.value;
            store.set("madamcs_lab", st);
            let c;
            try { c = Logic.compile(st.f); inF.classList.remove("err"); } catch (e) {
                inF.classList.add("err");
                out.innerHTML = `<div class="card"><span class="bad" style="color:var(--red);font-weight:700">${esc(e.message)}</span><p class="muted" style="margin:6px 0 0">Yazım için soldaki “Nasıl yazılır?” kısmına bak.</p></div>`;
                return;
            }
            if (c.vars.length > 6) { out.innerHTML = `<div class="card"><b style="color:var(--red)">En fazla 6 değişken kullanılabilir (${c.vars.length} var).</b></div>`; return; }
            const n = c.vars.length, N = 1 << n;
            const dcs = st.dc.split(/[\s,;]+/).filter(Boolean).map(Number).filter((x) => Number.isInteger(x) && x >= 0 && x < N);
            inD.classList.toggle("err", st.dc.trim() !== "" && dcs.length !== st.dc.split(/[\s,;]+/).filter(Boolean).length);
            const s = Logic.simplify(c.ast, c.vars, dcs);
            const ones = s.ones.length;
            const kind = ones + dcs.length === N && !s.zeros.length ? `<span class="pill green">Totoloji</span>` : !ones ? `<span class="pill" style="background:var(--red-pale);color:var(--red)">Çelişki</span>` : `<span class="pill gray">Olumsal</span>`;
            const fv = `F(${c.vars.join(", ")})`;

            let gHtml = "";
            if (st.g.trim()) {
                try {
                    const g = Logic.compile(st.g);
                    inG.classList.remove("err");
                    const vars = Logic.sortVars(new Set(c.vars.concat(g.vars)));
                    let diff = -1;
                    if (vars.length <= 8) for (let i = 0; i < 1 << vars.length && diff < 0; i++) {
                        const env = Logic.envOf(vars, i);
                        if (c.f(env) !== g.f(env)) diff = i;
                    }
                    const denv = diff >= 0 ? Logic.envOf(vars, diff) : null;
                    gHtml = `<div class="card"><h2 class="section-title">F ile G karşılaştırması</h2>
                        <div class="readout" style="margin-top:0">G = <b class="bool-out">${html(g.ast)}</b><br>
                        ${vars.length > 8 ? `<span class="bad">Çok fazla değişken.</span>` : diff < 0 ? `<span class="good">F ≡ G ✓ — tüm ${1 << vars.length} satırda aynı.</span>` : `<span class="bad">F ≢ G ✗</span> — ${vars.map((v) => `${v}=${denv[v]}`).join(", ")} için F = ${c.f(denv)}, G = ${g.f(denv)}.`}</div></div>`;
                } catch (e) {
                    inG.classList.add("err");
                    gHtml = `<div class="card"><span style="color:var(--red);font-weight:700">G: ${esc(e.message)}</span></div>`;
                }
            } else inG.classList.remove("err");

            const drawAst = [c.ast, s.sop, s.pos][drawMode];
            c.vars.forEach((v) => { if (sw[v] === undefined) sw[v] = 0; });
            const subs = steps ? Logic.subterms(c.ast) : [];
            const cols = (subs.length ? subs : [c.ast]).map((t, i, arr) => ({
                head: Widgets._helpers.tex(Logic.format(t, { mode: "tex" })), f: (env) => Logic.evaluate(t, env), cls: i === arr.length - 1 ? "tt-out" : "",
            }));
            if (dcs.length) cols.push({ head: "F (X'li)", f: (env) => { const i = c.vars.reduce((a, v) => a * 2 + env[v], 0); return dcs.includes(i) ? "X" : c.f(env); }, cls: "tt-out2" });

            out.innerHTML = `
                <div class="card">
                    <h2 class="section-title">Özet ${kind}</h2>
                    <div class="bool-big">F = ${html(c.ast)}</div>
                    <div class="readout-grid" style="margin-top:12px">
                        <div class="ro-cell"><div class="k">Değişkenler</div><div class="v">${c.vars.join(", ") || "—"}</div></div>
                        <div class="ro-cell"><div class="k">Satır sayısı</div><div class="v">2<sup>${n}</sup> = ${N}</div></div>
                        <div class="ro-cell"><div class="k">F = 1 olan satır</div><div class="v">${ones}</div></div>
                    </div>
                    <div class="readout">${fv} = Σm(${s.ones.join(", ") || " "})${dcs.length ? ` + d(${dcs.join(", ")})` : ""}<br>${fv} = ΠM(${s.zeros.join(", ") || " "})${dcs.length ? ` · D(${dcs.join(", ")})` : ""}</div>
                </div>
                <div class="card">
                    <h2 class="section-title">En sade hâl (Quine–McCluskey)</h2>
                    <div class="readout" style="margin-top:0">
                        Çarpımların toplamı (SOP): <b class="bool-out">F = ${html(s.sop)}</b> <span class="muted">· ${s.sopPrimes.length} terim, ${lits(s.sop)} harf</span><br>
                        Toplamların çarpımı (POS): <b class="bool-out">F = ${html(s.pos)}</b> <span class="muted">· ${lits(s.pos)} harf</span><br>
                        <span class="muted">Girilen ifade: ${lits(c.ast)} harf.</span>
                    </div>
                </div>
                ${gHtml}
                <div class="card">
                    <h2 class="section-title">Devre</h2>
                    <div class="chip-row" data-modes>${["Girilen ifade", "Sade SOP", "Sade POS"].map((l, i) => `<button type="button" class="chip${i === drawMode ? " active" : ""}" data-mode="${i}">${l}</button>`).join("")}</div>
                    <div data-sw style="margin-top:12px"></div>
                    <div class="circuit-stage">${Logic.circuitSvg(drawAst, sw)}</div>
                    <p class="muted" style="font-size:13px;margin:6px 0 0">Girişlere dokun: yeşil teller 1, gri teller 0 taşır. Üç devre de aynı tabloyu verir; sade olanlar daha az kapı kullanır.</p>
                </div>
                ${n >= 2 && n <= 4 ? `<div class="card"><h2 class="section-title">Karnaugh haritası</h2><div data-kmap></div></div>` : ""}
                <div class="card">
                    <h2 class="section-title" style="display:flex;align-items:center;gap:10px">Doğruluk tablosu
                        <label class="check" style="margin-left:auto;text-transform:none;letter-spacing:0"><input type="checkbox" data-steps${steps ? " checked" : ""}> ara sütunlar</label></h2>
                    <div class="table-wrap">${Widgets._helpers.truthHtml(c.vars, cols, { index: true, mark: (env, vals) => vals[subs.length ? subs.length - 1 : 0] === 1 })}</div>
                </div>`;
            Widgets._helpers.switches(out.querySelector("[data-sw]"), c.vars, sw, update);
            Widgets._helpers.bindSvgInputs(out.querySelector(".circuit-stage"), sw, update);
            out.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => { drawMode = Number(b.dataset.mode); update(); }));
            out.querySelector("[data-steps]").addEventListener("change", (e) => { steps = e.target.checked; update(); });
            const km = out.querySelector("[data-kmap]");
            if (km) Widgets.kmap(km, { n, vars: c.vars, ones: s.ones, dc: dcs, readonly: true });
            renderMath(out);
        }

        [inF, inG, inD].forEach((i) => i.addEventListener("input", update));
        view.querySelectorAll("[data-ex]").forEach((b) => b.addEventListener("click", () => {
            inF.value = b.dataset.ex;
            inD.value = "";
            update();
            toast(`“${b.dataset.ex}” yazıldı`);
        }));
        update();
    }

    function pageNotFound() {
        return `<div class="card empty-note"><h2>Sayfa bulunamadı</h2><p>Aradığın sayfa yok ya da taşınmış.</p><a class="btn" href="#/">Ana sayfaya dön</a></div>`;
    }

    /* ---------------- Yönlendirme ---------------- */
    function parseHash() {
        const raw = (location.hash || "#/").slice(1);
        const [path, qs] = raw.split("?");
        const parts = path.split("/").filter(Boolean);
        return { parts, query: new URLSearchParams(qs || "") };
    }

    function route() {
        const { parts, query } = parseHash();
        const page = parts[0] || "home";
        let html, after = null, navKey = page;
        if (page === "home") html = pageHome();
        else if (page === "konular") { html = pageChapters(); navKey = "konu"; }
        else if (page === "konu") html = pageChapter(parts[1]);
        else if (page === "ozet") {
            html = pageSummary(parts[1]); navKey = "konu";
            after = () => { const b = view.querySelector("[data-print]"); if (b) b.addEventListener("click", () => window.print()); };
        }
        else if (page === "ders") { html = pageLesson(parts[1]); after = () => bindLesson(parts[1]); navKey = "konu"; }
        else if (page === "lab") { html = pageLab(); after = () => bindLab(query); }
        else if (page === "testler") html = pagePractice();
        else if (page === "test") { html = pageTest(parts[1]); after = () => bindTest(parts[1]); navKey = "testler"; }
        else if (page === "problemler") { html = pageProblems(parts[1]); after = () => bindProblems(parts[1]); navKey = "testler"; }
        else html = pageNotFound();

        view.classList.add("page-fade");
        view.classList.toggle("wide", page === "lab");
        view.innerHTML = html;
        renderMath(view);
        if (after) after();
        requestAnimationFrame(() => view.classList.remove("page-fade"));
        window.scrollTo(0, 0);

        document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === navKey));
        updateSidebar();
        syncInstallButtons();
        document.title = page === "ders" && lessonById[parts[1]] ? `${lessonById[parts[1]].title} · Madam` : page === "lab" ? "Mantık Lab · Madam" : navKey === "testler" ? "Testler · Madam" : "Madam Bilgisayar";
    }

    function updateSidebar() {
        const el = document.getElementById("sidebarProgress");
        el.innerHTML = `<div class="sp-label">Toplam ilerleme</div><div class="sp-value">%${pct()}</div><div class="progress-bar"><span style="width:${pct()}%"></span></div>
            <div class="muted" style="font-size:12px;margin:6px 0 12px">${doneCount()} / ${lessons.length} ders tamamlandı</div>
            ${chapters.map((ch) => `<a href="#/konu/${ch.id}" style="display:block;margin-top:8px;color:var(--ink-soft);font-size:12px;font-weight:700">${ch.no}. ${esc(ch.title)} <span style="float:right">${doneCount(ch)}/${chapterLessons(ch).length}</span>
                <div class="progress-bar" style="height:5px;margin-top:4px"><span style="width:${pct(ch)}%"></span></div></a>`).join("")}`;
    }

    /* ---------------- Tema ---------------- */
    function applyThemeIcons() {
        const dark = document.documentElement.getAttribute("data-theme") === "dark";
        document.querySelectorAll("[data-theme-toggle]").forEach((b) => (b.textContent = dark ? "☀️" : "🌙"));
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", dark ? "#182530" : "#00aff0");
    }
    document.querySelectorAll("[data-theme-toggle]").forEach((b) => b.addEventListener("click", () => {
        const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        try { localStorage.setItem("madamcs_theme", next); } catch (e) { /* yok say */ }
        applyThemeIcons();
    }));

    /* ---------------- PWA: service worker + yükleme ---------------- */
    let installEvt = null;
    function syncInstallButtons() {
        document.querySelectorAll("[data-install]").forEach((b) => {
            b.hidden = !installEvt;
            if (!b._bound) {
                b._bound = true;
                b.addEventListener("click", async () => {
                    if (!installEvt) return;
                    installEvt.prompt();
                    try { await installEvt.userChoice; } catch (e) { /* yok say */ }
                    installEvt = null;
                    syncInstallButtons();
                });
            }
        });
    }
    window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; syncInstallButtons(); });
    window.addEventListener("appinstalled", () => { installEvt = null; syncInstallButtons(); toast("Uygulama yüklendi 🎉"); });
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
        window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => { /* çevrimdışı destek olmadan devam */ }));
    }

    window.addEventListener("hashchange", route);
    applyThemeIcons();
    route();
})();
