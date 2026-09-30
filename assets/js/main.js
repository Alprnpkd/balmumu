(function () {
  var EN = window.I18N_EN || {};
  var CFG = window.SITE_CONFIG || {};
  var STORE_KEY = "btc-lang";

  function store(get, value) {
    try {
      if (get) return localStorage.getItem(STORE_KEY);
      localStorage.setItem(STORE_KEY, value);
    } catch (e) { return null; }
  }

  function initialLang() {
    var q = new URLSearchParams(location.search).get("lang");
    if (q === "en" || q === "tr") return q;
    return store(true) === "en" ? "en" : "tr";
  }

  // Türkçe metin HTML'de durur; İngilizce sözlükten gelir. Orijinal metin ilk geçişte saklanır.
  function applyLang(lang) {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      if (el.dataset.tr === undefined) el.dataset.tr = el.textContent;
      var en = EN[el.dataset.i18n];
      el.textContent = lang === "en" && en !== undefined ? en : el.dataset.tr;
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      if (el.dataset.tr === undefined) el.dataset.tr = el.innerHTML;
      var en = EN[el.dataset.i18nHtml];
      el.innerHTML = lang === "en" && en !== undefined ? en : el.dataset.tr;
    });
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      var parts = el.dataset.i18nAttr.split(":");
      var attr = parts[0], key = parts[1];
      if (el.dataset.tr === undefined) el.dataset.tr = el.getAttribute(attr);
      el.setAttribute(attr, lang === "en" && EN[key] !== undefined ? EN[key] : el.dataset.tr);
    });
    document.documentElement.lang = lang;
    document.querySelectorAll(".lang button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
    });
    window.SITE_LANG = lang;
    document.dispatchEvent(new CustomEvent("langchange", { detail: lang }));
  }

  // Bir öğenin çeviri anahtarını değiştir (yapılandırmaya bağlı metinler için)
  function setKey(el, key, trText) {
    el.dataset.i18n = key;
    el.dataset.tr = trText;
  }

  function applyConfig() {
    var btn = document.getElementById("apply-btn");
    if (btn && CFG.applyUrl) {
      btn.href = CFG.applyUrl;
      btn.target = "_blank";
      btn.rel = "noopener";
      btn.removeAttribute("aria-disabled");
      var label = btn.querySelector("[data-i18n]");
      setKey(label, "s10.btn", "Başvuru formunu doldur");
      btn.insertAdjacentHTML("beforeend", ' <span class="arr" aria-hidden="true">↗</span>');
      var note = document.getElementById("apply-note");
      if (note) setKey(note, "s10.open", "Başvurular incelendikten sonra seninle iletişime geçeceğiz.");
    } else if (btn) {
      btn.addEventListener("click", function (e) { e.preventDefault(); });
    }

    var mailRow = document.getElementById("contact-row");
    if (mailRow && CFG.email) {
      var a = document.getElementById("contact-mail");
      a.href = "mailto:" + CFG.email;
      a.textContent = CFG.email;
      mailRow.hidden = false;
    }

    var socials = [["instagram", "Instagram"], ["youtube", "YouTube"], ["tiktok", "TikTok"]]
      .filter(function (s) { return CFG[s[0]]; });
    var socialRow = document.getElementById("social-row");
    if (socialRow && socials.length) {
      document.getElementById("social-links").innerHTML = socials.map(function (s) {
        return '<a href="' + CFG[s[0]] + '" target="_blank" rel="noopener">' + s[1] + "</a>";
      }).join(" · ");
      socialRow.hidden = false;
    }
  }

  function initMenu() {
    var btn = document.querySelector(".menu-btn");
    var nav = document.getElementById("nav");
    if (!btn || !nav) return;
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.querySelectorAll(".lang button").forEach(function (b) {
    b.addEventListener("click", function () {
      store(false, b.dataset.lang);
      applyLang(b.dataset.lang);
    });
  });

  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Kaydırınca beliren içerik. Konum doğrudan ölçülür; ekrana gelen ya da üstte kalan her öğe görünür olur.
  function initReveal() {
    var pending = [].slice.call(document.querySelectorAll(".reveal"));
    pending.forEach(function (el) {
      var siblings = [].slice.call(el.parentNode.children).filter(function (s) { return s.classList.contains("reveal"); });
      el.style.transitionDelay = Math.min(siblings.indexOf(el), 5) * 70 + "ms";
    });
    function check() {
      var limit = window.innerHeight * 0.94;
      pending = pending.filter(function (el) {
        if (el.getBoundingClientRect().top < limit) { el.classList.add("in"); return false; }
        return true;
      });
      if (!pending.length) {
        window.removeEventListener("scroll", check);
        window.removeEventListener("resize", check);
      }
    }
    function showAll() { pending.forEach(function (el) { el.classList.add("in"); }); pending = []; }
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    window.addEventListener("load", check);
    window.addEventListener("hashchange", check);
    window.addEventListener("beforeprint", showAll);
    check();
  }

  applyConfig();
  initMenu();
  initHeader();
  initReveal();
  applyLang(initialLang());
})();
