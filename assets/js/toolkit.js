(function () {
  var STR = {
    tr: {
      rows: { bag: "Plastik poşet (adet)", film: "Streç film (kullanım)", other: "Diğer tek kullanımlık plastik", wax: "Balmumu kumaş kullanımı" },
      days: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"],
      msgEmpty: "İki formu da doldurduğunda sonucun burada görünecek. Çizgi, %40 hedefini gösteriyor.",
      msgNoBase: "1. formda plastik kullanımı görünmüyor. Karşılaştırma için önce başlangıç haftanı doldur.",
      msgHit: function (p) { return "Hedef tuttu: plastik kullanımın %" + p + " azaldı."; },
      msgPart: function (p, r) { return "%" + p + " azalma. %40 hedefine " + r + " puan kaldı."; },
      msgNone: "Bu hafta bir azalma görünmüyor. Balmumu kumaşı mutfakta hangi anlarda kullanabileceğine birlikte bakalım.",
      waxNote: function (n) { return " Balmumu kumaşı bu hafta " + n + " kez kullandın."; },
      confirmReset: "Bu formdaki tüm sayılar silinsin mi?",
      score: function (s, n) { return n + " sorudan " + s + " doğru."; }
    },
    en: {
      rows: { bag: "Plastic bags (pcs)", film: "Cling film (uses)", other: "Other single-use plastic", wax: "Beeswax wrap uses" },
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      msgEmpty: "Your result appears here once both forms are filled in. The line marks the 40% target.",
      msgNoBase: "Form 1 shows no plastic use. Fill in your starting week first to compare.",
      msgHit: function (p) { return "Target reached: your plastic use dropped by " + p + "%."; },
      msgPart: function (p, r) { return p + "% reduction. " + r + " points to go to the 40% target."; },
      msgNone: "No reduction this week. Let's look at where beeswax wraps could replace plastic in your kitchen.",
      waxNote: function (n) { return " You used beeswax wraps " + n + " times this week."; },
      confirmReset: "Clear all numbers in this form?",
      score: function (s, n) { return s + " of " + n + " correct."; }
    }
  };
  function S() { return STR[window.SITE_LANG === "en" ? "en" : "tr"]; }

  /* ---------- 7 günlük takip formu ---------- */
  var KEY = "btc-tracker-v1";
  var ROWS = { f1: ["bag", "film", "other"], f2: ["bag", "film", "other", "wax"] };
  var PLASTIC = ["bag", "film", "other"];
  var state = load();
  var current = "f1";

  function blank() {
    var s = {};
    Object.keys(ROWS).forEach(function (f) {
      s[f] = {};
      ROWS[f].forEach(function (r) { s[f][r] = ["", "", "", "", "", "", ""]; });
    });
    return s;
  }
  function load() {
    var s = blank();
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (saved) Object.keys(s).forEach(function (f) {
        Object.keys(s[f]).forEach(function (r) {
          if (saved[f] && Array.isArray(saved[f][r])) s[f][r] = saved[f][r].slice(0, 7);
        });
      });
    } catch (e) {}
    return s;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function num(v) { var n = parseInt(v, 10); return isNaN(n) || n < 0 ? 0 : n; }
  function rowSum(f, r) { return state[f][r].reduce(function (a, v) { return a + num(v); }, 0); }
  function plasticSum(f) { return PLASTIC.reduce(function (a, r) { return a + rowSum(f, r); }, 0); }
  function filled(f) { return ROWS[f].some(function (r) { return state[f][r].some(function (v) { return v !== ""; }); }); }

  var table = document.getElementById("tracker");
  function renderTracker() {
    if (!table) return;
    var s = S();
    var body = table.querySelector("tbody");
    body.innerHTML = "";
    ROWS[current].forEach(function (r) {
      var tr = document.createElement("tr");
      if (r === "wax") tr.className = "wax-row";
      var th = document.createElement("td");
      th.textContent = s.rows[r];
      tr.appendChild(th);
      for (var d = 0; d < 7; d++) {
        var td = document.createElement("td");
        var inp = document.createElement("input");
        inp.type = "number"; inp.min = "0"; inp.max = "99"; inp.inputMode = "numeric";
        inp.value = state[current][r][d];
        inp.dataset.row = r; inp.dataset.day = d;
        inp.setAttribute("aria-label", s.rows[r] + ", " + s.days[d]);
        td.appendChild(inp);
        tr.appendChild(td);
      }
      var tot = document.createElement("td");
      tot.className = "total"; tot.dataset.total = r;
      tot.textContent = rowSum(current, r);
      tr.appendChild(tot);
      body.appendChild(tr);
    });
    renderResult();
  }

  function renderResult() {
    var s = S();
    var a = plasticSum("f1"), b = plasticSum("f2");
    document.getElementById("sum-f1").textContent = filled("f1") ? a : "0";
    document.getElementById("sum-f2").textContent = filled("f2") ? b : "0";
    var change = document.getElementById("change");
    var meter = document.getElementById("meter");
    var msg = document.getElementById("result-msg");
    // Mesajın çeviri anahtarı artık dinamik; main.js'in eski metni geri yazmasını engelle
    msg.removeAttribute("data-i18n");

    if (!filled("f1") || !filled("f2")) {
      change.textContent = "—"; meter.style.width = "0"; msg.textContent = s.msgEmpty; return;
    }
    if (a === 0) {
      change.textContent = "—"; meter.style.width = "0"; msg.textContent = s.msgNoBase; return;
    }
    var pct = Math.round((a - b) / a * 100);
    change.textContent = (pct > 0 ? "−" : pct < 0 ? "+" : "") + Math.abs(pct) + "%";
    meter.style.width = Math.max(0, Math.min(100, pct)) + "%";
    var text = pct >= 40 ? s.msgHit(pct) : pct > 0 ? s.msgPart(pct, 40 - pct) : s.msgNone;
    var wax = rowSum("f2", "wax");
    if (wax > 0) text += s.waxNote(wax);
    msg.textContent = text;
  }

  if (table) {
    table.addEventListener("input", function (e) {
      var inp = e.target;
      if (!inp.dataset.row) return;
      var v = inp.value === "" ? "" : String(Math.min(99, num(inp.value)));
      state[current][inp.dataset.row][+inp.dataset.day] = v;
      save();
      table.querySelector('[data-total="' + inp.dataset.row + '"]').textContent = rowSum(current, inp.dataset.row);
      renderResult();
    });

    document.querySelectorAll(".tracker-tabs button").forEach(function (b) {
      b.addEventListener("click", function () {
        current = b.dataset.form;
        document.querySelectorAll(".tracker-tabs button").forEach(function (x) {
          x.setAttribute("aria-selected", String(x === b));
        });
        renderTracker();
      });
    });

    document.getElementById("print-form").addEventListener("click", function () { window.print(); });
    document.getElementById("reset-form").addEventListener("click", function () {
      if (!confirm(S().confirmReset)) return;
      ROWS[current].forEach(function (r) { state[current][r] = ["", "", "", "", "", "", ""]; });
      save();
      renderTracker();
    });
  }

  /* ---------- Bilgi testi ---------- */
  var QUIZ = [
    {
      tr: ["Projenin temel yaklaşımı hangisi?", ["Plastiği daha çok geri dönüştürmek", "Atığı oluşmadan önlemek", "Plastiği başka bir plastik türüyle değiştirmek"], "Geri dönüşüm enerji, kaynak ve maliyet gerektirir. Plastik hiç kullanılmazsa bu yük de hiç oluşmaz."],
      en: ["What is the project's core approach?", ["Recycling more plastic", "Preventing waste before it exists", "Swapping one plastic for another"], "Recycling costs energy, resources and money. If plastic is never used, that burden never exists."],
      a: 1
    },
    {
      tr: ["Atölyelerde kullanılan balmumu nereden geliyor?", ["Yerel arıcıların kullanılmayan peteklerinden", "Hazır satın alınan parafinden", "İthal mum bloklarından"], "Arıcıların üretimde kullanmadığı atık petekler, balmumunun kaynağı."],
      en: ["Where does the workshop beeswax come from?", ["Unused combs from local beekeepers", "Store-bought paraffin", "Imported wax blocks"], "Waste combs that beekeepers no longer use are the source of the wax."],
      a: 0
    },
    {
      tr: ["Balmumu kumaşla hangisini sarmamalısın?", ["Yarım limon", "Ekmek", "Çiğ et"], "Balmumu kumaş sıcak suyla yıkanamadığı için çiğ et ve balık için uygun değil."],
      en: ["Which of these should you not wrap in beeswax cloth?", ["Half a lemon", "Bread", "Raw meat"], "Beeswax wraps can't be washed in hot water, so they're not suitable for raw meat or fish."],
      a: 2
    },
    {
      tr: ["Balmumu kumaş nasıl temizlenir?", ["Bulaşık makinesinde", "Soğuk ya da ılık su ve hafif sabunla", "Kaynar suyla"], "Sıcak su mumu eritir; soğuk ya da ılık su ve hafif sabun yeterli."],
      en: ["How do you clean a beeswax wrap?", ["In the dishwasher", "With cool or lukewarm water and mild soap", "With boiling water"], "Hot water melts the wax; cool or lukewarm water with mild soap is enough."],
      a: 1
    },
    {
      tr: ["Plastiğin doğada tamamen kaybolması ne kadar sürebilir?", ["Birkaç ay", "1–2 yıl", "Türüne göre 20 yıldan binlerce yıla"], "Plastiğin türüne göre bu süre 20 yıldan binlerce yıla kadar uzar."],
      en: ["How long can plastic take to disappear in nature?", ["A few months", "1–2 years", "From 20 to thousands of years, depending on type"], "Depending on the type, it takes anywhere from 20 to thousands of years."],
      a: 2
    },
    {
      tr: ["Kumaşın mumu azaldığında ne yapılır?", ["Atılır", "Yeniden balmumu serpilip ütülenir", "Deterjanla yıkanır"], "Biraz balmumu serpip yeniden ütüleyerek kumaşı tazeleyebilirsin."],
      en: ["What do you do when a wrap loses its wax?", ["Throw it away", "Sprinkle on more wax and iron it again", "Wash it with detergent"], "Sprinkle on a little beeswax and iron again to refresh it."],
      a: 1
    }
  ];
  var answers = {};
  var quiz = document.getElementById("quiz");

  function renderQuiz() {
    if (!quiz) return;
    var lang = window.SITE_LANG === "en" ? "en" : "tr";
    quiz.innerHTML = "";
    QUIZ.forEach(function (item, i) {
      var q = item[lang];
      var wrap = document.createElement("div");
      wrap.className = "q" + (answers[i] !== undefined ? " done" : "");
      var fs = document.createElement("fieldset");
      var lg = document.createElement("legend");
      var num = document.createElement("span");
      num.textContent = String(i + 1).padStart(2, "0");
      lg.appendChild(num);
      lg.appendChild(document.createTextNode(q[0]));
      fs.appendChild(lg);
      q[1].forEach(function (opt, j) {
        var lab = document.createElement("label");
        var inp = document.createElement("input");
        inp.type = "radio"; inp.name = "q" + i; inp.value = j;
        if (answers[i] !== undefined) {
          inp.disabled = true;
          if (answers[i] === j) inp.checked = true;
          if (j === item.a) lab.className = "right";
          else if (answers[i] === j) lab.className = "wrong";
        }
        lab.appendChild(inp);
        lab.appendChild(document.createTextNode(opt));
        fs.appendChild(lab);
      });
      var why = document.createElement("p");
      why.className = "why";
      why.textContent = q[2];
      fs.appendChild(why);
      wrap.appendChild(fs);
      quiz.appendChild(wrap);
    });
    renderScore();
  }
  function renderScore() {
    var el = document.getElementById("quiz-score");
    var n = Object.keys(answers).length;
    if (n < QUIZ.length) { el.textContent = ""; return; }
    var s = QUIZ.filter(function (item, i) { return answers[i] === item.a; }).length;
    el.textContent = S().score(s, QUIZ.length);
  }
  if (quiz) {
    quiz.addEventListener("change", function (e) {
      if (e.target.type !== "radio") return;
      answers[+e.target.name.slice(1)] = +e.target.value;
      renderQuiz();
    });
  }

  document.addEventListener("langchange", function () { renderTracker(); renderQuiz(); });
  renderTracker();
  renderQuiz();
})();
