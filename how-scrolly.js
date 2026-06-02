/**
 * Sekce „Jak to funguje“ – pin, canvas cesty, postupné karty (GSAP ScrollTrigger).
 */
window.initHowScrolly = function initHowScrolly(lenisInstance) {
  const stage = document.getElementById("stage");
  if (!stage) return;
  const root = stage.closest(".how-scrolly");
  const pinWrap = document.getElementById("pinWrap");

  const pathCanvas = document.createElement("canvas");
  pathCanvas.setAttribute("aria-hidden", "true");
  pathCanvas.style.cssText =
    "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:6;";
  stage.appendChild(pathCanvas);
  const pctx = pathCanvas.getContext("2d");

  function resizeCanvas() {
    pathCanvas.width = pathCanvas.offsetWidth;
    pathCanvas.height = pathCanvas.offsetHeight;
  }

  function makeDrawer(startY, endY, mirrored) {
    let cache = null;

    function build() {
      const W = pathCanvas.width;
      const cx = W / 2;
      const amp = Math.min(W * 0.12, 72);
      const s = mirrored ? -1 : 1;
      const midY = (startY + endY) / 2;
      const h = (endY - startY) / 2;

      function sampleBez(x1, y1, cpx1, cpy1, cpx2, cpy2, x2, y2, N) {
        const out = [];
        for (let i = 0; i <= N; i++) {
          const t = i / N;
          const m = 1 - t;
          out.push({
            x: m ** 3 * x1 + 3 * m ** 2 * t * cpx1 + 3 * m * t ** 2 * cpx2 + t ** 3 * x2,
            y: m ** 3 * y1 + 3 * m ** 2 * t * cpy1 + 3 * m * t ** 2 * cpy2 + t ** 3 * y2,
          });
        }
        return out;
      }

      const arc1 = sampleBez(cx, startY, cx, startY + h * 0.8, cx + s * amp, midY, cx, midY, 400);
      const arc2 = sampleBez(cx, midY, cx - s * amp, midY, cx, endY - h * 0.8, cx, endY, 400);

      const pts = [...arc1, ...arc2.slice(1)];
      const cum = [0];
      for (let i = 1; i < pts.length; i++) {
        cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
      }
      return { pts, cum, total: cum[cum.length - 1], W };
    }

    return function draw(progress, shiftY) {
      if (!cache || cache.W !== pathCanvas.width) cache = build();
      const { pts, cum, total } = cache;
      const drawLen = total * Math.max(0, Math.min(1, progress));
      if (drawLen <= 0) return;
      pctx.save();
      pctx.strokeStyle = "#a84a38";
      pctx.lineWidth = 3.5;
      pctx.lineCap = "round";
      pctx.lineJoin = "round";
      pctx.setLineDash([11, 15]);
      pctx.lineDashOffset = 0;
      pctx.beginPath();
      let started = false;
      for (let i = 0; i < pts.length; i++) {
        const x = pts[i].x;
        const y = pts[i].y - shiftY;
        if (!started) {
          pctx.moveTo(x, y);
          started = true;
        } else {
          pctx.lineTo(x, y);
        }
        if (cum[i] >= drawLen) break;
      }
      pctx.stroke();
      pctx.restore();
    };
  }

  resizeCanvas();

  const VH = stage.offsetHeight;
  const TH = document.getElementById("titleBlock").offsetHeight;
  const c1h = document.getElementById("card1").offsetHeight;
  const c2h = document.getElementById("card2").offsetHeight;
  const c3h = document.getElementById("card3").offsetHeight;
  const c4h = document.getElementById("card4").offsetHeight;

  const PATH_H = 230;
  const GAP = 40;

  const colTitle = 0;
  const colCard1 = TH + 60;
  const colPath1 = colCard1 + c1h + GAP;
  const colCard2 = colPath1 + PATH_H + GAP;
  const colPath2 = colCard2 + c2h + GAP;
  const colCard3 = colPath2 + PATH_H + GAP;
  const colPath3 = colCard3 + c3h + GAP;
  const colCard4 = colPath3 + PATH_H + GAP;

  const shiftTitle = colTitle + TH / 2 - VH / 2;
  const shiftCard1 = colCard1 + c1h / 2 - VH / 2;
  const shiftCard2 = colCard2 + c2h / 2 - VH / 2;
  const shiftCard3 = colCard3 + c3h / 2 - VH / 2;
  const shiftCard4 = colCard4 + c4h / 2 - VH / 2;

  const draw1 = makeDrawer(colPath1, colPath1 + PATH_H, false);
  const draw2 = makeDrawer(colPath2, colPath2 + PATH_H, true);
  const draw3 = makeDrawer(colPath3, colPath3 + PATH_H, false);

  const APPROACH_OFFSET = 110;
  const state = {
    sceneY: shiftTitle + APPROACH_OFFSET,
    op1: 0,
    p1: 0,
    p2: 0,
    p3: 0,
    op2: 0,
    op3: 0,
    op4: 0,
  };
  const settled = { card1: false, card2: false, card3: false, card4: false };
  const PATH_DONE = 0.998;
  const cardCols = [colCard1, colCard2, colCard3, colCard4];
  const cardIds = ["card1", "card2", "card3", "card4"];
  const scrollHint = document.getElementById("scrollHint");
  const finalRating = document.querySelector("#card4 .how-rating");

  function render() {
    const sy = state.sceneY;
    pctx.clearRect(0, 0, pathCanvas.width, pathCanvas.height);

    document.getElementById("titleBlock").style.top = colTitle - sy + "px";
    document.getElementById("titleBlock").style.transform = "none";

    cardIds.forEach((id, i) => {
      const el = document.getElementById(id);
      el.style.top = cardCols[i] - sy + "px";
      el.style.transform = "translateX(-50%)";

      if (id === "card1") {
        el.style.opacity = settled.card1 ? "1" : String(state.op1);
      } else if (id === "card2") {
        el.style.opacity =
          state.p1 >= 0.88 ? (settled.card2 ? "1" : String(state.op2)) : "0";
      } else if (id === "card3") {
        el.style.opacity =
          state.p2 >= 0.88 ? (settled.card3 ? "1" : String(state.op3)) : "0";
      } else {
        el.style.opacity =
          state.p3 >= 0.88 ? (settled.card4 ? "1" : String(state.op4)) : "0";
      }
    });

    if (state.op1 >= 0.99) settled.card1 = true;
    else settled.card1 = false;

    if (state.p1 >= PATH_DONE && state.op2 >= 0.99) settled.card2 = true;
    else settled.card2 = false;

    if (state.p2 >= PATH_DONE && state.op3 >= 0.99) settled.card3 = true;
    else settled.card3 = false;

    if (state.p3 >= PATH_DONE && state.op4 >= 0.99) {
      settled.card4 = true;
      if (finalRating) finalRating.classList.add("how-rating--lit");
    } else {
      settled.card4 = false;
      if (finalRating) finalRating.classList.remove("how-rating--lit");
    }

    if (state.p1 > 0) draw1(state.p1, sy);
    if (state.p2 > 0) draw2(state.p2, sy);
    if (state.p3 > 0) draw3(state.p3, sy);
  }

  render();

  ScrollTrigger.create({
    id: "howApproach",
    trigger: "#pinWrap",
    start: "top bottom",
    end: "top top",
    onUpdate(self) {
      const main = ScrollTrigger.getById("howScrolly");
      if (main?.isActive && main.progress > 0.001) return;
      const approachP = self.progress || 0;
      state.sceneY = shiftTitle + APPROACH_OFFSET * (1 - approachP);
      render();
    },
  });

  const TOTAL = 4800;

  const tl = gsap.timeline({ paused: true });

  // Plynulý průlet scénou: žádné pauzy ani „zastávky“ na kartách.
  // Odhalení karet (op*) se pouze naváže na průběh, aby nevznikaly ostré záseky.
  tl.to(state, { sceneY: shiftCard1, op1: 1, duration: 1.6, ease: "power1.out" }, 0);

  tl.to(state, { p1: 1, sceneY: shiftCard2, duration: 2.8, ease: "none" }, ">-0.05");
  tl.to(state, { op2: 1, duration: 0.6, ease: "power1.out" }, ">-0.7");

  tl.to(state, { p2: 1, sceneY: shiftCard3, duration: 2.8, ease: "none" }, ">-0.05");
  tl.to(state, { op3: 1, duration: 0.6, ease: "power1.out" }, ">-0.7");

  tl.to(state, { p3: 1, sceneY: shiftCard4, duration: 2.8, ease: "none" }, ">-0.05");
  tl.to(state, { op4: 1, duration: 0.6, ease: "power1.out" }, ">-0.7");

  ScrollTrigger.create({
    id: "howScrolly",
    trigger: "#pinWrap",
    start: "top top",
    end: `+=${TOTAL}`,
    pin: "#stage",
    scrub: 0.65,
    anticipatePin: 0,
    invalidateOnRefresh: true,
    onEnter: () => {
      state.sceneY = shiftTitle;
      render();
    },
    onEnterBack: () => {
      render();
    },
    onUpdate(self) {
      const p = self.progress || 0;
      tl.progress(p);
      render();
    },
  });

  if (scrollHint) {
    ScrollTrigger.create({
      id: "howScrollHint",
      trigger: "#heroIntroScroll",
      start: () => {
        const heroST = ScrollTrigger.getById("heroIntroScrub");
        return heroST ? heroST.end : "bottom top";
      },
      end: () => {
        const st = ScrollTrigger.getById("howScrolly");
        return st ? st.end : "bottom top";
      },
      onEnter: () => scrollHint.classList.add("is-active"),
      onLeave: () => scrollHint.classList.remove("is-active"),
      onEnterBack: () => scrollHint.classList.add("is-active"),
      onLeaveBack: () => scrollHint.classList.remove("is-active"),
    });
  }

  render();

  window.addEventListener("resize", () => {
    // Debounce: při resize (hlavně Windows) umí refresh spamovat a škubat.
    clearTimeout(window.__howResizeT);
    window.__howResizeT = setTimeout(() => {
      resizeCanvas();
      render();
      ScrollTrigger.refresh();
    }, 120);
  });

  ScrollTrigger.addEventListener("refresh", () => {
    if (lenisInstance && typeof lenisInstance.resize === "function") {
      lenisInstance.resize();
    }
  });
  ScrollTrigger.refresh();
};
