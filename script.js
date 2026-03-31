/**
 * Vlastní kurzor: malý tmavě hnědý kroužek, nad prvky/textem jako lupa s malým přiblížením.
 */
(function markBuild() {
  const BUILD = "20260331-1";
  window.__Y_BUILD__ = BUILD;
  try {
    console.log(`[Y] build ${BUILD} loaded`);
  } catch (_) {}
})();

(function () {
  const cursor = document.getElementById("customCursor");
  if (!cursor) return;
  const hero = document.querySelector(".dream-hero");
  const heroHeading = document.querySelector(".dream-content h1");

  document.documentElement.classList.add("custom-cursor-active");
  cursor.style.opacity = "1";

  let mouseX = 0;
  let mouseY = 0;
  let cursorX = 0;
  let cursorY = 0;

  const magnifierSelectors = "a, button, input, [role=button], .faq-question, h1, h2, h3, h4, p, span, .how-flow-card, .social-post, .why-split, .about-card, .signup-input, .faq-item, .stats-block, .subtitle, .signup-title, .signup-subtitle, .faq-question__text";

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
 * Sekce „Jak to funguje“: GSAP ScrollTrigger + pin + scrub.
 * Krok 1 (desktop): jen postupné „nakreslení“ čar (stroke-dashoffset); karty zůstávají vidět.
 * Mobil: statická plná cesta, bez pinu.
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
  const sticky = section.querySelector(".how-section__sticky");
  const connectors = Array.from(flow.querySelectorAll(".how-flow-connector[data-how-connector]"));

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  document.documentElement.classList.add("how-journey-js");

  function fallbackStatic() {
    cards.forEach((c) => {
      c.classList.add("how-flow-card--revealed");
      if (c.classList.contains("how-flow-card--final")) c.classList.add("how-flow-card--cta-active");
    });
    paths.forEach((path) => {
      path.style.removeProperty("stroke-dasharray");
      path.style.removeProperty("stroke-dashoffset");
    });
    if (progressFill) progressFill.style.height = "100%";
    if (progressTrack) progressTrack.setAttribute("aria-valuenow", "100");
    if (ratingEl) ratingEl.classList.add("how-rating--lit");
  }

  if (reduce || !hasGsap) {
    fallbackStatic();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* Stejný vzorek jako v CSS (.how-flow-connector__path) — jen offset animujeme, ne celé dasharray = délka cesty (to by dělalo plnou čáru). */
  const PATH_DASH_PATTERN = "12 16";

  function initPathDash(path) {
    let len = path.getTotalLength();
    if (len < 2) {
      void path.ownerSVGElement?.getBoundingClientRect();
      len = path.getTotalLength();
    }
    if (len < 2) return 0;
    path.style.strokeDasharray = PATH_DASH_PATTERN;
    path.style.strokeDashoffset = String(len);
    return len;
  }

  function runDesktopScrolly() {
    document.documentElement.classList.add("how-gsap-desktop");
    section.classList.add("how-section--scrolly");
    section.classList.add("reveal-visible");

    // New: scroll-driven "scenes" where headline + one centered card are the focus.
    section.classList.add("how-section--scenes");
    document.documentElement.classList.add("how-scenes-active");
    try {
      console.log("[Y] how scenes init");
    } catch (_) {}

    cards.forEach((c) => {
      c.classList.add("how-flow-card--revealed");
      if (c.classList.contains("how-flow-card--final")) c.classList.add("how-flow-card--cta-active");
    });
    if (ratingEl) ratingEl.classList.add("how-rating--lit");

    // Connectors: stop dash-anim; we will show/hide connectors per scene.
    paths.forEach((path) => {
      path.style.removeProperty("stroke-dasharray");
      path.style.removeProperty("stroke-dashoffset");
    });
    connectors.forEach((c) => c.classList.remove("is-visible"));

    const n = cards.length;
    const spacing = () => Math.max(420, Math.round(window.innerHeight * 0.78));

    // In scenes mode: only one card is ever visible.
    const tl = gsap.timeline({ defaults: { ease: "none" } });

    function setCardState(activeIndex) {
      cards.forEach((el, i) => {
        el.classList.toggle("is-current", i === activeIndex);
        el.classList.toggle("is-past", i < activeIndex);
        el.classList.toggle("is-future", i > activeIndex);
        if (i !== activeIndex) el.classList.remove("is-hovered");
      });
    }

    cards.forEach((el) => {
      el.addEventListener("mouseenter", () => {
        if (el.classList.contains("is-current")) el.classList.add("is-hovered");
      });
      el.addEventListener("mouseleave", () => {
        el.classList.remove("is-hovered");
      });
    });

    tl.addLabel("scene_headline_in", 0);

    if (sticky) {
      gsap.set(sticky, { opacity: 0, y: 16 });
      tl.to(sticky, { opacity: 1, y: 0, duration: 0.35 }, "scene_headline_in");
    }

    // Prepare cards
    gsap.set(cards, { opacity: 0, y: () => spacing() * 0.9 });
    cards.forEach((c) => (c.style.filter = "blur(0px)"));
    setCardState(0);

    // Scene 2: first card enters and gets stuck centered
    if (cards[0]) {
      tl.to(
        cards[0],
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          onComplete: () => gsap.set(cards[0], { clearProps: "opacity" }),
        },
        ">+=0.25"
      );
      tl.to({}, { duration: 0.55 }); // hold
    }

    // Scene 3+: headline + current card move up together, next card comes in and becomes centered.
    for (let i = 0; i < n - 1; i++) {
      const cur = cards[i];
      const next = cards[i + 1];
      if (!cur || !next) continue;

      const sp = () => spacing();

      // Hide headline after first card starts flowing.
      if (sticky && i === 0) {
        tl.to(sticky, { opacity: 0, y: -24, duration: 0.35 }, "<");
      }

      tl.to(
        cur,
        { y: () => -sp() * 0.95, duration: 0.85, immediateRender: false },
        ">"
      );
      tl.fromTo(
        next,
        { y: () => sp() * 0.95, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          immediateRender: false,
          onComplete: () => gsap.set(next, { clearProps: "opacity" }),
        },
        "<"
      );
      tl.call(() => setCardState(i + 1), undefined, "<+=0.65");
      tl.to({}, { duration: 0.55 }); // hold
    }

    // Progressbar (optional)
    if (progressFill || progressTrack) {
      tl.eventCallback("onUpdate", () => {
        const p = tl.progress();
        const pct = Math.round(p * 100);
        if (progressFill) progressFill.style.height = `${pct}%`;
        if (progressTrack) progressTrack.setAttribute("aria-valuenow", String(pct));
      });
    }

    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => "+=" + Math.round(Math.max(window.innerHeight * (n * 2.35 + 1.2), 5200)),
      pin: true,
      pinSpacing: true,
      pinType: "fixed",
      scrub: 0.65,
      anticipatePin: 0,
      invalidateOnRefresh: true,
      animation: tl,
    });

    // Headline scrolls normally (no forced top pin)

    return tl;
  }

  function runMobileSimple() {
    document.documentElement.classList.remove("how-gsap-desktop");
    section.classList.remove("how-section--scrolly");
    fallbackStatic();
    gsap.set(cards, { clearProps: "opacity,y" });
    gsap.set(flow.querySelectorAll(".how-flow-card__inner"), { clearProps: "opacity,y" });
  }

  // Run the new "scenes" behavior on all viewport sizes.
  // (Previously mobile used fallbackStatic, which makes it look "unchanged".)
  let desktopTl = null;
  try {
    desktopTl = runDesktopScrolly();
    requestAnimationFrame(() => {
      void flow.offsetHeight;
      ScrollTrigger.refresh(true);
    });
  } catch (e) {
    document.documentElement.classList.remove("how-gsap-desktop");
    section.classList.remove("how-section--scrolly");
    section.classList.remove("how-section--scenes");
    fallbackStatic();
  }

  let resizeTimer;
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 120);
    },
    { passive: true }
  );

  window.addEventListener("load", () => {
    requestAnimationFrame(() => {
      void flow.offsetHeight;
      ScrollTrigger.refresh(true);
    });
  });
})();

/**
 * Sekce „Co říkají uživatelky“: karusel (1 slide mobil / 3 desktop).
 */
(function () {
  const track = document.getElementById("socialCarouselTrack");
  const viewport = document.querySelector(".social-carousel__viewport");
  const prevBtn = document.getElementById("socialCarouselPrev");
  const nextBtn = document.getElementById("socialCarouselNext");
  if (!track || !viewport || !prevBtn || !nextBtn) return;

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
    prevBtn.disabled = index <= 0;
    nextBtn.disabled = index >= maxIndex();
  }

  function onResize() {
    applySlideWidths();
    index = Math.min(index, maxIndex());
    updateTransform();
  }

  prevBtn.addEventListener("click", () => go(-1));
  nextBtn.addEventListener("click", () => go(1));

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

