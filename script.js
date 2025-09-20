// script.js — Netflix-like interactions without changing HTML/CSS
// Works with the provided DOM in index.html and styles in style.css

document.addEventListener("DOMContentLoaded", () => {
    // ==============================
    // Helpers
    // ==============================
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  
    const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  
    // Simple focus trap for modal
    function trapFocus(modal) {
      const focusables = $$("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])", modal)
        .filter(el => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
      if (focusables.length === 0) return () => {};
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
  
      function handler(e) {
        if (e.key !== "Tab") return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
      modal.addEventListener("keydown", handler);
      return () => modal.removeEventListener("keydown", handler);
    }
  
    // ==============================
    // 1) Horizontal carousel (Trending Now)
    // ==============================
    const posterViewport = $(".poster");
    const posterList = $(".poster ul");
    const leftBtn = $(".button-1 button");
    const rightBtn = $(".button-2 button");
  
    if (posterViewport && posterList && leftBtn && rightBtn) {
      const itemGap = 40; // from CSS
      const cardWidth = posterList.querySelector("li .P1") ? posterList.querySelector("li .P1").offsetWidth : 250;
      const jump = Math.max(cardWidth + itemGap, posterViewport.clientWidth * 0.8);
  
      function doScroll(dir = 1) {
        posterViewport.scrollBy({ left: dir * jump, behavior: "smooth" });
      }
  
      leftBtn.addEventListener("click", () => doScroll(-1));
      rightBtn.addEventListener("click", () => doScroll(1));
  
      // Keyboard support
      posterViewport.setAttribute("tabindex", "0");
      posterViewport.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") doScroll(-1);
        if (e.key === "ArrowRight") doScroll(1);
      });
  
      // Drag / swipe to scroll
      let isDown = false, startX = 0, startScrollLeft = 0;
      const start = (clientX) => {
        isDown = true;
        startX = clientX;
        startScrollLeft = posterViewport.scrollLeft;
      };
      const move = (clientX) => {
        if (!isDown) return;
        const dx = clientX - startX;
        posterViewport.scrollLeft = startScrollLeft - dx;
      };
      const end = () => { isDown = false; };
  
      posterViewport.addEventListener("mousedown", (e) => start(e.clientX));
      window.addEventListener("mousemove", (e) => move(e.clientX));
      window.addEventListener("mouseup", end);
  
      posterViewport.addEventListener("touchstart", (e) => start(e.touches[0].clientX), { passive: true });
      posterViewport.addEventListener("touchmove", (e) => move(e.touches[0].clientX), { passive: true });
      posterViewport.addEventListener("touchend", end);
  
      // Auto-advance
      let autoTimer = setInterval(() => doScroll(1), 6000);
      ["mouseenter", "focusin"].forEach(evt => posterViewport.addEventListener(evt, () => clearInterval(autoTimer)));
      ["mouseleave", "focusout"].forEach(evt => posterViewport.addEventListener(evt, () => (autoTimer = setInterval(() => doScroll(1), 6000))));
    }
  
    // ==============================
    // 2) Poster click -> quick preview modal
    // ==============================
    const posters = $$(".poster ul li button");
    let modal, untrap = () => {};
  
    function ensureModal() {
      if (modal) return modal;
      modal = document.createElement("div");
      modal.id = "preview-modal";
      Object.assign(modal.style, {
        position: "fixed", inset: "0", background: "rgba(0,0,0,0.75)",
        display: "none", alignItems: "center", justifyContent: "center", zIndex: "9999"
      });
      modal.innerHTML = `
        <div role="dialog" aria-modal="true" style="background:#111; color:#fff; padding:24px; border-radius:12px; width:min(92vw, 560px);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h2 id="modal-title">Title</h2>
            <button id="modal-close">✕</button>
          </div>
          <p id="modal-meta">Trending · 2h 14m · 2024</p>
          <div style="display:flex; gap:12px; margin-top:4px;">
            <button id="play-btn">Play</button>
            <button id="more-btn">More Info</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
  
      const closeBtn = $("#modal-close", modal);
      const close = () => { modal.style.display = "none"; untrap(); };
      closeBtn.addEventListener("click", close);
      modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
      window.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.style.display !== "none") close(); });
      return modal;
    }
  
    posters.forEach(btn => {
      const title = btn.textContent.trim();
      btn.addEventListener("click", () => {
        const m = ensureModal();
        $("#modal-title", m).textContent = title;
        $("#modal-meta", m).textContent = "Top 10 in your country · 2h 10m · HD";
        m.style.display = "flex";
        untrap = trapFocus(m);
        $("#play-btn", m).focus();
      });
    });
  
    // ==============================
    // 3) FAQ accordion
    // ==============================
    const faqButtons = $$(".line .button button");
    const answers = {
      "What is Netflix?": "Netflix is a streaming service that offers a wide variety of award-winning TV shows, movies, anime, documentaries and more – on thousands of internet-connected devices.You can watch as much as you want, whenever you want, without a single ad – all for one low monthly price. There's always something new to discover, and new TV shows and movies are added every week!",
      "How much does Netflix cost?": "Watch Netflix on your smartphone, tablet, Smart TV, laptop, or streaming device, all for one fixed monthly fee. Plans range from ₹149 to ₹649 a month. No extra costs, no contracts.",
      "Where can I watch?": "Watch anywhere, anytime. Sign in with your Netflix account to watch instantly on the web at netflix.com from your personal computer or on any internet-connected device that offers the Netflix app, including smart TVs, smartphones, tablets, streaming media players and game consoles.",
      "How do i Cancel?": "Netflix is flexible. There are no annoying contracts and no commitments. You can easily cancel your account online in two clicks. There are no cancellation fees – start or stop your account anytime.",
      "What can I watch on Netflix?": "Netflix has an extensive library of feature films, documentaries, TV shows, anime, award-winning Netflix originals, and more. Watch as much as you want, anytime you want.",
      "Is Netflix good for Kids?": "The Netflix Kids experience is included in your membership to give parents control while kids enjoy family-friendly TV shows and films in their own space."
    };
  
    faqButtons.forEach((btn) => {
      const panel = document.createElement("div");
      panel.style.maxHeight = "0";
      panel.style.overflow = "hidden";
      panel.style.transition = "max-height .3s ease";
      panel.innerHTML = `<p>${answers[btn.textContent.trim()] ?? "—"}</p>`;
      btn.insertAdjacentElement("afterend", panel);
  
      btn.addEventListener("click", () => {
        const open = panel.style.maxHeight !== "0px" && panel.style.maxHeight !== "0";
        $$(".line .button + div").forEach(p => p.style.maxHeight = "0");
        if (!open) panel.style.maxHeight = panel.scrollHeight + "px";
      });
    });
  
    // ==============================
    // 4) Email capture
    // ==============================
    const heroBtn = $(".bttn1");
    const heroInput = $(".bttn input[type='email']");
    const footBtn = $(".f1");
    const footInput = $(".last input[type='email']");
  
    function handleSignup(input) {
      const v = (input?.value || "").trim();
      if (!v) return alert("Please enter your email!");
      if (!isEmail(v)) return alert("Invalid email format!");
      alert(`Thanks for signing up with: ${v}`);
    }
  
    heroBtn?.addEventListener("click", () => handleSignup(heroInput));
    footBtn?.addEventListener("click", () => handleSignup(footInput));
  
    [heroInput, footInput].forEach(inp => {
      if (!inp) return;
      inp.addEventListener("input", () => {
        if (inp.value && !isEmail(inp.value)) inp.style.outline = "2px solid #e50914";
        else inp.style.outline = "";
      });
    });
  
    // ==============================
    // 5) Language + Region/Genre controls
    // ==============================
    const languageSel = $("#Language");
    const regionSel = $("#region");
    const genreSel = $("#Gerne");
  
    const STRINGS = {
      en: {
        title1: "Unlimited movies, TV shows and more.",
        title2: "Starts at ₹149. Cancel at any time.",
        faqTitle: "Frequently Asked Questions"
      },
      hi: {
        title1: "अनलिमिटेड फ़िल्में, टीवी शो और बहुत कुछ।",
        title2: "₹149 से शुरू। कभी भी कैंसल करें।",
        faqTitle: "अक्सर पूछे जाने वाले प्रश्न"
      }
    };
  
    function setLanguage(lang) {
      const dict = lang === "Series" ? STRINGS.hi : STRINGS.en;
      const spans = $$(".text span");
      if (spans[0]) spans[0].innerHTML = dict.title1;
      if (spans[1]) spans[1].textContent = dict.title2;
      const faqHead = $(".line p"); if (faqHead) faqHead.textContent = dict.faqTitle;
    }
  
    languageSel?.addEventListener("change", (e) => setLanguage(e.target.value));
  
    function toast(msg) {
      let el = $("#toast");
      if (!el) {
        el = document.createElement("div");
        el.id = "toast";
        Object.assign(el.style, {
          position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
          background: "rgba(0,0,0,.85)", color: "#fff", padding: "10px 14px",
          borderRadius: "999px", zIndex: "9999", opacity: "0", transition: "opacity .2s ease"
        });
        document.body.appendChild(el);
      }
      el.textContent = msg;
      el.style.opacity = "1";
      clearTimeout(el._hide);
      el._hide = setTimeout(() => el.style.opacity = "0", 1600);
    }
  
    function applySelection() {
      posterViewport?.scrollTo({ left: 0, behavior: "smooth" });
      const region = regionSel?.value || "india";
      const genre = genreSel?.value || "movies";
      toast(`Showing: ${genre} · ${region}`);
    }
  
    regionSel?.addEventListener("change", applySelection);
    genreSel?.addEventListener("change", applySelection);
  
    // ==============================
    // 6) Sign In button
    // ==============================
    $(".btn-red")?.addEventListener("click", () => {
      heroInput?.focus();
      heroInput?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
  