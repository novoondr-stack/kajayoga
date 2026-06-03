/**
 * Zjednodušená verze – bez Lenis/GSAP scroll animací.
 */
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
  let lastMagnifierTarget = null;
  let lastZoomTarget = null;
  let lastIsOnDarkHero = false;

  function updatePosition() {
    cursorX += (mouseX - cursorX) * 0.08;
    cursorY += (mouseY - cursorY) * 0.08;
    cursor.style.left = cursorX + "px";
    cursor.style.top = cursorY + "px";

    const now = performance.now();
    if (now - lastHitTestAt > 33) {
      lastHitTestAt = now;
      const el = document.elementFromPoint(mouseX, mouseY);
      const inFaq = !!(el && el.closest(".faq-section"));
      lastMagnifierTarget = !inFaq && el && el.closest(magnifierSelectors);
      lastZoomTarget = !inFaq && el && el.closest(zoomSelectors);
      lastIsOnDarkHero = !!(el && el.closest(".dream-hero"));
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
      zoomTarget.style.transformOrigin = `${mouseX - rect.left}px ${mouseY - rect.top}px`;
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
    if (hero) hero.style.setProperty("--hero-glow-opacity", "0");
    if (lastZoomedEl) {
      lastZoomedEl.style.transform = "scale(1)";
      lastZoomedEl.style.transformOrigin = "";
      lastZoomedEl = null;
    }
  });

  document.addEventListener("mouseenter", () => {
    cursor.style.opacity = "1";
  });

  (function initHeroHeadingLetters() {
    if (!heroHeading || heroHeading.dataset.lettersReady === "1") return;
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

(function () {
  const section = document.getElementById("howSection");
  const flow = document.getElementById("howFlow");
  if (!section || !flow) return;

  section.classList.add("how-section--static");
  flow.querySelectorAll(".how-flow-card").forEach((c) => {
    c.classList.add("how-flow-card--revealed");
    if (c.classList.contains("how-flow-card--final")) {
      c.classList.add("how-flow-card--cta-active");
      const rating = c.querySelector(".how-rating");
      if (rating) rating.classList.add("how-rating--lit");
    }
  });
})();

(function () {
  document.querySelectorAll(".why-steps .why-split").forEach((el) => {
    el.classList.add("why-split--in-view");
  });
})();

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
    return Math.max(0, slides().length - visibleCount());
  }

  function applySlideWidths() {
    const v = visibleCount();
    const vw = viewport.offsetWidth;
    const g = gapPx();
    const slideW = v === 1 ? vw : (vw - g * (v - 1)) / v;
    track.style.setProperty("--social-slide-w", `${slideW}px`);
  }

  function updateTransform() {
    const v = visibleCount();
    const vw = viewport.offsetWidth;
    const g = gapPx();
    const w = v === 1 ? vw : (vw - g * (v - 1)) / v;
    track.style.transform = `translate3d(-${index * (w + g)}px, 0, 0)`;
  }

  function go(delta) {
    index = Math.min(maxIndex(), Math.max(0, index + delta));
    updateTransform();
    restartAutoplay();
  }

  const AUTOPLAY_MS = 5500;
  let autoplayTimer = null;

  function advanceAuto() {
    const mx = maxIndex();
    index = index >= mx ? 0 : index + 1;
    updateTransform();
  }

  function startAutoplay() {
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

  function onResize() {
    applySlideWidths();
    index = Math.min(index, maxIndex());
    updateTransform();
  }

  if (prevBtn) prevBtn.addEventListener("click", () => go(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => go(1));

  viewport.addEventListener("mouseenter", pauseAutoplay);
  viewport.addEventListener("mouseleave", startAutoplay);

  applySlideWidths();
  updateTransform();
  startAutoplay();
  window.addEventListener("resize", onResize);
})();

(function () {
  const section = document.querySelector(".stats-bar");
  const numbers = document.querySelectorAll(".stats-block__number[data-count]");
  if (!section || !numbers.length) return;

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
    const startAt = performance.now() + delayMs;
    const DURATION = 2600;

    function tick(now) {
      if (now < startAt) {
        requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min((now - startAt) / DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = format(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function runCounters() {
    if (section.dataset.statsAnimated === "1") return;
    section.dataset.statsAnimated = "1";
    numbers.forEach((el, i) => animate(el, i * 140));
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) runCounters();
      });
    },
    { threshold: 0.18 }
  );
  io.observe(section);
})();

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
      openItem(btn.closest(".faq-item"));
    });
  });

  if (canHover) {
    items.forEach((item) => {
      item.addEventListener("mouseenter", () => openItem(item));
      item.addEventListener("mouseleave", () => closeAll());
    });
  }
})();

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
      offset += pxPerSec * Math.min(0.064, (now - last) / 1000);
      last = now;
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

  if (!imgs.length) start();
  else {
    imgs.forEach((img) => {
      if (img.complete) onImgReady();
      else {
        img.addEventListener("load", onImgReady, { once: true });
        img.addEventListener("error", onImgReady, { once: true });
      }
    });
  }
})();

(function () {
  document.querySelectorAll('a[href="#registrace"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const el = document.getElementById("registrace");
      if (!el) return;
      event.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
})();
