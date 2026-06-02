/**
 * Vlastní kurzor: malý tmavě hnědý kroužek, nad prvky/textem jako lupa s malým přiblížením.
 */
(function markBuild() {
  const BUILD = "20260519-113";
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

  const magnifierSelectors =
    "a, button, input, [role=button], h1, h2, h3, h4, p, span, .how-flow-card, .social-post, .why-split, .bonus-card, .about-card, .signup-input, .stats-block, .subtitle, .signup-title, .signup-subtitle";

  const zoomSelectors =
    "a, button, h1, h2, h3, h4, p, span, .subtitle, .signup-title, .signup-subtitle, .how-flow-card p, .about-card__text, .stats-block__label";

  let lastZoomedEl = null;
  let lastHitTestAt = 0;
  let lastEl = null;
  let lastMagnifierTarget = null;
  let lastZoomTarget = null;
  let lastIsOnDarkHero = false;

  function updatePosition() {
    cursorX += (mouseX - cursorX) * 0.08;
    cursorY += (mouseY - cursorY) * 0.08;
    cursor.style.left = cursorX + "px";
    cursor.style.top = cursorY + "px";

    // Hit test je relativně drahý (elementFromPoint + closest). Stačí ho dělat ~30×/s.
    const now = performance.now();
    if (now - lastHitTestAt > 33) {
      lastHitTestAt = now;
      lastEl = document.elementFromPoint(mouseX, mouseY);
      const inFaq = !!(lastEl && lastEl.closest(".faq-section"));
      lastMagnifierTarget = !inFaq && lastEl && lastEl.closest(magnifierSelectors);
      lastZoomTarget = !inFaq && lastEl && lastEl.closest(zoomSelectors);
      lastIsOnDarkHero = !!(lastEl && lastEl.closest(".dream-hero"));
    }

    const zoomTarget = lastZoomTarget;
    const isMagnifier = !!lastMagnifierTarget;
    const isOnDarkHero = !!lastIsOnDarkHero;

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

    const shouldZoom =
      zoomTarget &&
      !zoomTarget.closest(".dream-content h1") &&
      !zoomTarget.closest(".faq-section");

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
  const main = document.querySelector("main");
  if (main) {
    let afterHero = false;
    Array.from(main.children).forEach((el) => {
      if (el.id === "heroIntroScroll") {
        afterHero = true;
        return;
      }
      if (!afterHero) return;
      if (el.classList.contains("how-scrolly")) return; // má vlastní scroll animaci
      el.classList.add("reveal-section");
    });
  }

  const sections = document.querySelectorAll(".reveal-section");
  if (!sections.length) return;

  function prep(section) {
    const root =
      section.querySelector(".faq-wrap") ||
      section.querySelector(".container") ||
      section;
    const kids = Array.from(root.children).filter((n) => {
      const tag = String(n.tagName || "").toLowerCase();
      return tag && tag !== "script" && tag !== "style";
    });

    kids.forEach((el, i) => {
      el.classList.add("reveal-child");
      el.style.setProperty("--reveal-delay", `${i * 75}ms`);
    });
  }

  sections.forEach((el) => prep(el));

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reveal-visible");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -18% 0px" }
  );

  sections.forEach((el) => io.observe(el));
})();

/**
 * Sekce „Proč to funguje“: karty při scrollu z boku.
 */
(function () {
  const cards = document.querySelectorAll(".why-steps .why-split");
  if (!cards.length) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    cards.forEach((el) => el.classList.add("why-split--in-view"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("why-split--in-view");
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
  );

  cards.forEach((el) => io.observe(el));
})();

/**
 * Sekce „Jak to funguje“: statický layout – klasický scroll, bez GSAP pin/scenes.
 */
(function () {
  if (document.getElementById("stage")) return;

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
 * Stats bar: counter-up animace až po scrollu do sekce (po reveal).
 */
(function () {
  const section = document.querySelector(".stats-bar");
  const numbers = document.querySelectorAll(".stats-block__number[data-count]");
  if (!section || !numbers.length) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DURATION = 2600;

  function format(n) {
    if (n >= 1000) {
      const k = Math.floor(n / 1000);
      const r = n % 1000;
      return r === 0 ? k + ",000" : k + "," + String(r).padStart(3, "0");
    }
    return String(n);
  }

  function animate(el, delayMs) {
    const target = parseInt(el.dataset.count, 10);
    if (isNaN(target)) return;

    if (reduce) {
      el.textContent = format(target);
      return;
    }

    const startAt = performance.now() + delayMs;

    function tick(now) {
      if (now < startAt) {
        requestAnimationFrame(tick);
        return;
      }

      const elapsed = now - startAt;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      el.textContent = format(current);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function runCounters() {
    if (section.dataset.statsAnimated === "1") return;
    if (section.classList.contains("reveal-section") && !section.classList.contains("reveal-visible")) {
      return;
    }

    const rect = section.getBoundingClientRect();
    if (rect.bottom < window.innerHeight * 0.12 || rect.top > window.innerHeight * 0.92) {
      return;
    }

    section.dataset.statsAnimated = "1";
    numbers.forEach((el, index) => animate(el, index * 140));
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) runCounters();
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
  );

  io.observe(section);

  if (section.classList.contains("reveal-section")) {
    const revealObs = new MutationObserver(() => {
      if (section.classList.contains("reveal-visible")) runCounters();
    });
    revealObs.observe(section, { attributes: true, attributeFilter: ["class"] });
  }

  runCounters();
})();

/**
 * FAQ akordeon: v jeden moment jen jedna otevřená otázka.
 */
(function () {
  const toggles = document.querySelectorAll("[data-faq-toggle]");
  const items = document.querySelectorAll(".faq-item");
  if (!toggles.length || !items.length) return;

  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function closeAll() {
    items.forEach((el) => {
      el.classList.remove("is-open");
      const answer = el.querySelector(".faq-answer");
      const trigger = el.querySelector("[data-faq-toggle]");
      if (answer) answer.setAttribute("aria-hidden", "true");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
  }

  function openItem(item) {
    if (!item) return;
    const isOpen = item.classList.contains("is-open");
    closeAll();
    if (isOpen) return;
    item.classList.add("is-open");
    const answer = item.querySelector(".faq-answer");
    const trigger = item.querySelector("[data-faq-toggle]");
    if (answer) answer.setAttribute("aria-hidden", "false");
    if (trigger) trigger.setAttribute("aria-expanded", "true");
  }

  toggles.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const scrollY = window.lenis ? window.lenis.scroll : window.scrollY;
      const item = btn.closest(".faq-item");
      openItem(item);

      requestAnimationFrame(() => {
        if (window.lenis && typeof window.lenis.scrollTo === "function") {
          window.lenis.scrollTo(scrollY, { immediate: true });
        } else {
          window.scrollTo(0, scrollY);
        }
      });
    });
  });

  if (canHover) {
    items.forEach((item) => {
      item.addEventListener("mouseenter", () => openItem(item));
      item.addEventListener("mouseleave", () => closeAll());
    });
  }
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

/**
 * Posuvník vpravo – průhledná dráha, hnědý posuvník podle pozice scrollu.
 */
(function () {
  const root = document.getElementById("pageScroll");
  const track = document.getElementById("pageScrollTrack");
  const thumb = document.getElementById("pageScrollThumb");
  if (!root || !track || !thumb) return;

  const canShow = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!canShow) return;

  let lenisHooked = false;

  function getScrollY() {
    if (window.lenis && typeof window.lenis.scroll === "number") {
      return window.lenis.scroll;
    }
    return window.scrollY || document.documentElement.scrollTop || 0;
  }

  function getScrollMax() {
    if (window.lenis && typeof window.lenis.limit === "number") {
      return Math.max(0, window.lenis.limit);
    }
    const rootEl = document.documentElement;
    return Math.max(0, rootEl.scrollHeight - window.innerHeight);
  }

  function updatePageScrollIndicator() {
    const max = getScrollMax();
    if (max <= 8) {
      root.classList.remove("is-visible");
      return;
    }

    root.classList.add("is-visible");
    const trackH = track.clientHeight;
    const ratio = window.innerHeight / document.documentElement.scrollHeight;
    const thumbH = Math.max(28, Math.round(trackH * ratio));
    const travel = Math.max(0, trackH - thumbH);
    const y = getScrollY();

    let progress = y / max;
    if (y <= 1) progress = 0;
    else if (y >= max - 1) progress = 1;
    else progress = Math.min(1, Math.max(0, progress));

    thumb.style.height = `${thumbH}px`;
    thumb.style.top = `${travel * progress}px`;
  }

  function hookLenis() {
    if (lenisHooked || !window.lenis || typeof window.lenis.on !== "function") return;
    window.lenis.on("scroll", updatePageScrollIndicator);
    lenisHooked = true;
  }

  updatePageScrollIndicator();
  window.addEventListener("scroll", updatePageScrollIndicator, { passive: true });
  window.addEventListener("resize", updatePageScrollIndicator);

  hookLenis();
  const lenisPoll = window.setInterval(() => {
    hookLenis();
    updatePageScrollIndicator();
    if (lenisHooked) window.clearInterval(lenisPoll);
  }, 120);
  window.setTimeout(() => window.clearInterval(lenisPoll), 8000);

  if (typeof ScrollTrigger !== "undefined") {
    ScrollTrigger.addEventListener("refresh", updatePageScrollIndicator);
  }
})();

