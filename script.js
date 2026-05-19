/**
 * Vlastní kurzor: malý tmavě hnědý kroužek, nad prvky/textem jako lupa s malým přiblížením.
 */
(function markBuild() {
  const BUILD = "20260331-5";
  window.__Y_BUILD__ = BUILD;
  try {
    console.log(`[Y] build ${BUILD} loaded`);
  } catch (_) {}
})();

(function () {
  const cursor = document.getElementById("customCursor");
  if (!cursor) return;

  const canUseCustomCursor = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!canUseCustomCursor) {
    cursor.style.display = "none";
    return;
  }

  const hero = document.querySelector(".dream-hero");
  const heroHeading = document.querySelector(".dream-content h1");

  document.documentElement.classList.add("custom-cursor-active");
  cursor.style.opacity = "1";

  let mouseX = 0;
  let mouseY = 0;
  let cursorX = 0;
  let cursorY = 0;

  const magnifierSelectors = "a, button, input, [role=button], .faq-question, h1, h2, h3, h4, p, span, .how-flow-card, .social-post, .why-split, .bonus-card, .about-card, .signup-input, .faq-item, .stats-block, .subtitle, .signup-title, .signup-subtitle, .faq-question__text";

  const zoomSelectors = "a, button, .faq-question, h1, h2, h3, h4, p, span, .subtitle, .signup-title, .signup-subtitle, .faq-question__text, .how-flow-card p, .about-card__text, .stats-block__label";

  let lastZoomedEl = null;

  function updatePosition() {
    cursorX += (mouseX - cursorX) * 0.08;
    cursorY += (mouseY - cursorY) * 0.08;
    cursor.style.left = cursorX + "px";
    cursor.style.top = cursorY + "px";

    const el = document.elementFromPoint(mouseX, mouseY);
    const magnifierTarget = el && el.closest(magnifierSelectors);
    const zoomTarget = el && el.closest(zoomSelectors);
    const isMagnifier = !!magnifierTarget;
    const isOnDarkHero = !!(el && el.closest(".dream-hero"));

    cursor.classList.toggle("is-magnifier", isMagnifier);
    cursor.classList.toggle("is-on-dark", isOnDarkHero);

    if (hero) {
      if (isOnDarkHero) {
        const heroRect = hero.getBoundingClientRect();
        hero.style.setProperty("--hero-glow-x", `${mouseX - heroRect.left}px`);
        hero.style.setProperty("--hero-glow-y", `${mouseY - heroRect.top}px`);
        hero.style.setProperty("--hero-glow-opacity", "1");
      } else {
        hero.style.setProperty("--hero-glow-opacity", "0");
      }
    }

    if (lastZoomedEl && lastZoomedEl !== zoomTarget) {
      lastZoomedEl.style.transition = "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)";
      lastZoomedEl.style.transform = "scale(1)";
      lastZoomedEl.style.transformOrigin = "";
      lastZoomedEl = null;
    }

    const shouldZoom = zoomTarget && !zoomTarget.closest(".dream-content h1");

    if (shouldZoom) {
      const rect = zoomTarget.getBoundingClientRect();
      const ox = mouseX - rect.left;
      const oy = mouseY - rect.top;
      zoomTarget.style.transformOrigin = `${ox}px ${oy}px`;
      zoomTarget.style.transform = "scale(1.03)";
      zoomTarget.style.transition = "transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)";
      lastZoomedEl = zoomTarget;
    }

    requestAnimationFrame(updatePosition);
  }

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  document.addEventListener("mouseleave", () => {
    cursor.style.opacity = "0";
    if (hero) {
      hero.style.setProperty("--hero-glow-opacity", "0");
    }
    if (lastZoomedEl) {
      lastZoomedEl.style.transition = "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)";
      lastZoomedEl.style.transform = "scale(1)";
      lastZoomedEl.style.transformOrigin = "";
      lastZoomedEl = null;
    }
  });

  document.addEventListener("mouseenter", () => {
    cursor.style.opacity = "1";
  });

  (function initHeroHeadingLetters() {
    if (!heroHeading) return;
    if (heroHeading.dataset.lettersReady === "1") return;

    const lines = Array.from(heroHeading.querySelectorAll(".h1-line"));
    if (!lines.length) return;

    lines.forEach((line) => {
      const text = line.textContent ?? "";
      line.textContent = "";

      Array.from(text).forEach((ch) => {
        const span = document.createElement("span");
        span.className = "h1-letter";
        span.textContent = ch === " " ? "\u00A0" : ch;
        line.appendChild(span);
      });
    });

    heroHeading.dataset.lettersReady = "1";
  })();

  updatePosition();
})();

/**
 * Section Reveal: sekce se plynule vynoří při scrollu do viewportu.
 */
(function () {
  const sections = document.querySelectorAll(".reveal-section");
  if (!sections.length) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    sections.forEach((el) => el.classList.add("reveal-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
  );

  sections.forEach((el) => io.observe(el));
})();

/**
 * Sekce „Jak to funguje“: statický layout – klasický scroll, bez GSAP pin/scenes.
 */
(function () {
  const section = document.getElementById("howSection");
  const flow = document.getElementById("howFlow");
  if (!section || !flow) return;

  const cards = Array.from(flow.querySelectorAll(".how-flow-card"));
  const paths = Array.from(flow.querySelectorAll(".how-flow-connector__path"));
  const progressFill = document.getElementById("howProgressFill");
  const progressTrack = document.getElementById("howProgressTrack");
  const ratingEl = cards[3] ? cards[3].querySelector(".how-rating") : null;

  document.documentElement.classList.remove("how-gsap-desktop", "how-scenes-active");
  section.classList.remove("how-section--scrolly", "how-section--scenes");
  section.classList.add("how-section--static");

  cards.forEach((c) => {
    c.classList.remove("is-current", "is-past", "is-future", "is-hovered");
    c.classList.add("how-flow-card--revealed");
    c.style.removeProperty("opacity");
    c.style.removeProperty("transform");
    if (c.classList.contains("how-flow-card--final")) {
      c.classList.add("how-flow-card--cta-active");
    }
  });

  flow.querySelectorAll(".how-flow-card__inner").forEach((inner) => {
    inner.style.removeProperty("opacity");
    inner.style.removeProperty("transform");
  });

  paths.forEach((path) => {
    path.style.removeProperty("stroke-dasharray");
    path.style.removeProperty("stroke-dashoffset");
  });

  if (progressFill) progressFill.style.height = "100%";
  if (progressTrack) progressTrack.setAttribute("aria-valuenow", "100");
  if (ratingEl) ratingEl.classList.add("how-rating--lit");
})();

/**
 * Sekce „Co říkají uživatelky“: karusel (1 slide mobil / 3 desktop).
 */
(function () {
  const track = document.getElementById("socialCarouselTrack");
  const viewport = document.querySelector(".social-carousel__viewport");
  const prevBtn = document.getElementById("socialCarouselPrev");
  const nextBtn = document.getElementById("socialCarouselNext");
  if (!track || !viewport) return;

  const slides = () => Array.from(track.querySelectorAll(".social-post"));
  let index = 0;
  function gapPx() {
    const g = getComputedStyle(track).gap || getComputedStyle(track).columnGap;
    const n = parseFloat(g);
    return Number.isFinite(n) ? n : 14;
  }

  function visibleCount() {
    return window.matchMedia("(min-width: 900px)").matches ? 3 : 1;
  }

  function maxIndex() {
    const v = visibleCount();
    const n = slides().length;
    return Math.max(0, n - v);
  }

  function applySlideWidths() {
    const v = visibleCount();
    const vw = viewport.offsetWidth;
    const g = gapPx();
    const slideW = v === 1 ? vw : (vw - g * (v - 1)) / v;
    track.style.setProperty("--social-slide-w", `${slideW}px`);
  }

  function go(delta) {
    const next = Math.min(maxIndex(), Math.max(0, index + delta));
    index = next;
    updateTransform();
    restartAutoplay();
  }

  /** Automatické posouvání (po pár sekundách), na konci se vrátí na začátek */
  const AUTOPLAY_MS = 5500;
  let autoplayTimer = null;

  function advanceAuto() {
    const mx = maxIndex();
    index = index >= mx ? 0 : index + 1;
    updateTransform();
  }

  function startAutoplay() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (maxIndex() <= 0) return;
    clearInterval(autoplayTimer);
    autoplayTimer = window.setInterval(advanceAuto, AUTOPLAY_MS);
  }

  function restartAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
  }

  function pauseAutoplay() {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }

  function updateTransform() {
    const v = visibleCount();
    const vw = viewport.offsetWidth;
    const g = gapPx();
    const w = v === 1 ? vw : (vw - g * (v - 1)) / v;
    const offset = index * (w + g);
    track.style.transform = `translate3d(-${offset}px, 0, 0)`;
    if (prevBtn) prevBtn.disabled = index <= 0;
    if (nextBtn) nextBtn.disabled = index >= maxIndex();
  }

  function onResize() {
    applySlideWidths();
    index = Math.min(index, maxIndex());
    updateTransform();
  }

  if (prevBtn) prevBtn.addEventListener("click", () => go(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => go(1));

  viewport.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    }
  });

  let touchStartX = null;
  viewport.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );
  viewport.addEventListener(
    "touchend",
    (e) => {
      if (touchStartX == null) return;
      const dx = e.changedTouches[0].screenX - touchStartX;
      touchStartX = null;
      if (Math.abs(dx) < 50) return;
      if (dx < 0) go(1);
      else go(-1);
    },
    { passive: true }
  );

  window.addEventListener("resize", onResize);
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(onResize);
    ro.observe(viewport);
  }

  applySlideWidths();
  updateTransform();
  startAutoplay();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseAutoplay();
    else startAutoplay();
  });
})();

/**
 * Stats bar: counter-up animace při scrollu do viewportu.
 */
(function () {
  const numbers = document.querySelectorAll(".stats-block__number[data-count]");
  if (!numbers.length) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DURATION = 1600;

  function format(n) {
    if (n >= 1000) {
      const k = Math.floor(n / 1000);
      const r = n % 1000;
      return r === 0 ? k + ",000" : k + "," + String(r).padStart(3, "0");
    }
    return String(n);
  }

  function animate(el) {
    const target = parseInt(el.dataset.count, 10);
    if (isNaN(target)) return;

    if (reduce) {
      el.textContent = format(target);
      return;
    }

    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      el.textContent = format(current);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.dataset.animated) return;
        el.dataset.animated = "1";
        animate(el);
      });
    },
    { threshold: 0.4, rootMargin: "0px 0px -40px 0px" }
  );

  numbers.forEach((el) => io.observe(el));
})();

/**
 * FAQ akordeon: v jeden moment jen jedna otevřená otázka.
 */
(function () {
  const toggles = document.querySelectorAll("[data-faq-toggle]");
  const items = document.querySelectorAll(".faq-item");
  if (!toggles.length || !items.length) return;

  toggles.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const item = btn.closest(".faq-item");
      const isOpen = item.classList.contains("is-open");

      items.forEach((el) => {
        el.classList.remove("is-open");
        const answer = el.querySelector(".faq-answer");
        const trigger = el.querySelector("[data-faq-toggle]");
        if (answer) answer.setAttribute("aria-hidden", "true");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
      });

      if (!isOpen) {
        item.classList.add("is-open");
        const answer = item.querySelector(".faq-answer");
        const trigger = item.querySelector("[data-faq-toggle]");
        if (answer) answer.setAttribute("aria-hidden", "false");
        if (trigger) trigger.setAttribute("aria-expanded", "true");
      }
    });
  });
})();

/**
 * Videotéka v bonus sekci: vertikální scroll mřížky (JS – spolehlivější než CSS % u flexu).
 */
(function () {
  const track = document.querySelector(".bonus-videoteca-wall__track");
  if (!track) return;

  const sheet = track.querySelector(".bonus-videoteca-wall__sheet");
  if (!sheet) return;

  let offset = 0;
  let last = performance.now();
  let rafId = 0;
  const pxPerSec = 22;

  function sheetHeight() {
    return sheet.offsetHeight || sheet.getBoundingClientRect().height;
  }

  function tick(now) {
    const h = sheetHeight();
    if (h > 1) {
      const dt = Math.min(0.064, (now - last) / 1000);
      last = now;
      offset += pxPerSec * dt;
      if (offset >= h) offset -= h;
      track.style.transform = "translate3d(0," + -offset + "px,0)";
    }
    rafId = requestAnimationFrame(tick);
  }

  function start() {
    cancelAnimationFrame(rafId);
    last = performance.now();
    rafId = requestAnimationFrame(tick);
  }

  const imgs = track.querySelectorAll("img");
  let pending = imgs.length || 1;
  const onImgReady = () => {
    pending -= 1;
    if (pending <= 0) start();
  };

  if (imgs.length === 0) {
    start();
  } else {
    imgs.forEach((img) => {
      if (img.complete) onImgReady();
      else {
        img.addEventListener("load", onImgReady, { once: true });
        img.addEventListener("error", onImgReady, { once: true });
      }
    });
  }

  let resizeT;
  window.addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      const h = sheetHeight();
      if (h > 0) offset = offset % h;
    }, 120);
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start).catch(start);
  }
})();

