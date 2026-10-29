/**
 * Natal banner behavior — luzinhas, neve animada em <canvas>, trenó do
 * Papai Noel e o clique que leva até #panetones. Ported ~1:1 from the
 * original index.html's inline script. Call from a useEffect in
 * NatalBanner.tsx; the returned function tears everything down (resize
 * listener, IntersectionObserver, rAF loops, in-flight animations).
 */
export function initNatalBanner(banner: HTMLElement): () => void {
  const teardown: Array<() => void> = [];

  banner.setAttribute("role", "button");
  banner.setAttribute("tabindex", "0");

  function goToPanetones() {
    const target = document.getElementById("panetones");
    if (!target) return;
    const navWrap = document.querySelector<HTMLElement>(".nav-wrap");
    const offset = navWrap ? navWrap.offsetHeight : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - offset - 8;
    window.scrollTo({ top, behavior: "smooth" });
    if (typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "banner_click", {
        event_category: "engagement",
        event_label: "natal_panetones",
      });
    }
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToPanetones();
    }
  }
  banner.addEventListener("click", goToPanetones);
  banner.addEventListener("keydown", onKeydown);
  teardown.push(() => {
    banner.removeEventListener("click", goToPanetones);
    banner.removeEventListener("keydown", onKeydown);
  });

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Luzinhas de Natal ---------- */
  const lights = banner.querySelector<SVGSVGElement>(".natal-banner__lights")!;
  const COLORS = ["#E8B866", "#FFE9C2", "#E39A8A"];
  const NS = "http://www.w3.org/2000/svg";

  function el(name: string, attrs: Record<string, string | number>) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, String(attrs[k]));
    return n;
  }
  function buildLights() {
    const w = banner.clientWidth;
    lights.setAttribute("viewBox", "0 0 " + w + " 64");
    lights.innerHTML = "";
    const seg = Math.max(90, Math.round(w / Math.ceil(w / 130)));
    const count = Math.ceil(w / seg);
    let d = "M0 6";
    const bulbs: [number, number][] = [];
    for (let i = 0; i < count; i++) {
      const x0 = i * seg,
        x1 = (i + 1) * seg,
        cx = (x0 + x1) / 2,
        y0 = 6,
        cy = 44;
      d += " Q" + cx + " " + cy + " " + x1 + " " + y0;
      [0.3, 0.7].forEach((t) => {
        const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
        const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y0;
        bulbs.push([x, y]);
      });
    }
    lights.appendChild(el("path", { d, class: "wire" }));
    bulbs.forEach((b, i) => {
      const color = COLORS[i % COLORS.length];
      lights.appendChild(el("line", { x1: b[0], y1: b[1], x2: b[0], y2: b[1] + 7, class: "stem" }));
      const bulb = el("ellipse", { cx: b[0], cy: b[1] + 12, rx: 4.2, ry: 5.6, fill: color, class: "bulb" }) as SVGElement;
      bulb.style.color = color;
      bulb.style.animationDelay = i * 0.35 + "s";
      lights.appendChild(bulb);
    });
  }

  /* ---------- Neve ---------- */
  const canvas = banner.querySelector<HTMLCanvasElement>(".natal-banner__snow")!;
  const ctx = canvas.getContext("2d")!;
  type Flake = { x: number; y: number; r: number; vy: number; sway: number; phase: number; freq: number; a: number; soft: boolean };
  let flakes: Flake[] = [],
    W = 0,
    H = 0,
    dpr = 1;
  let speedMul = 1,
    targetMul = 1;
  let running = false,
    last = 0,
    raf = 0;

  function makeFlake(initial: boolean): Flake {
    const r = 1 + Math.random() * 3.2;
    return {
      x: Math.random() * W,
      y: initial ? Math.random() * H : -10,
      r,
      vy: (14 + r * 11 + Math.random() * 10) * 0.55,
      sway: 8 + Math.random() * 18,
      phase: Math.random() * Math.PI * 2,
      freq: (0.4 + Math.random() * 0.8) * 0.75,
      a: 0.35 + Math.random() * 0.55,
      soft: r > 3,
    };
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = banner.clientWidth;
    H = banner.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = W < 640 ? 24 : 40;
    flakes = [];
    for (let i = 0; i < n; i++) flakes.push(makeFlake(true));
  }
  function drawFlake(f: Flake, t: number) {
    const x = f.x + Math.sin(t * f.freq + f.phase) * f.sway;
    if (f.soft) {
      const g = ctx.createRadialGradient(x, f.y, 0, x, f.y, f.r * 2);
      g.addColorStop(0, "rgba(255,244,226," + f.a + ")");
      g.addColorStop(1, "rgba(255,244,226,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, f.y, f.r * 2, 0, 6.2832);
      ctx.fill();
    } else {
      ctx.fillStyle = "rgba(255,244,226," + f.a + ")";
      ctx.beginPath();
      ctx.arc(x, f.y, f.r, 0, 6.2832);
      ctx.fill();
    }
  }
  function frame(ts: number) {
    if (!running) return;
    const dt = Math.min((ts - last) / 1000, 0.05);
    last = ts;
    speedMul += (targetMul - speedMul) * Math.min(dt * 3, 1);
    ctx.clearRect(0, 0, W, H);
    const t = ts / 1000;
    for (let i = 0; i < flakes.length; i++) {
      let f = flakes[i];
      f.y += f.vy * dt * speedMul;
      if (f.y > H + 10) flakes[i] = f = makeFlake(false);
      drawFlake(f, t);
    }
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (running || reduce) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  function onMouseEnter() {
    targetMul = 2.2;
  }
  function onMouseLeave() {
    targetMul = 1;
  }
  let touchTimer: ReturnType<typeof setTimeout>;
  function onTouchStart() {
    targetMul = 2.2;
    touchTimer = setTimeout(() => {
      targetMul = 1;
    }, 1800);
  }
  banner.addEventListener("mouseenter", onMouseEnter);
  banner.addEventListener("mouseleave", onMouseLeave);
  banner.addEventListener("touchstart", onTouchStart, { passive: true });
  teardown.push(() => {
    banner.removeEventListener("mouseenter", onMouseEnter);
    banner.removeEventListener("mouseleave", onMouseLeave);
    banner.removeEventListener("touchstart", onTouchStart);
    clearTimeout(touchTimer);
  });

  /* ---------- Papai Noel + rédeas + poeira de estrelas ---------- */
  const santa = banner.querySelector<HTMLElement>(".natal-banner__santa");
  const santaSvg = santa?.querySelector<SVGSVGElement>("svg");
  const rein1 = santa?.querySelector<SVGPathElement>(".nb-rein1");
  const rein2 = santa?.querySelector<SVGPathElement>(".nb-rein2");
  const aHand = santa?.querySelector<SVGElement>(".nb-anchor-hand");
  const aA = santa?.querySelector<SVGElement>(".nb-anchor-a");
  const aB = santa?.querySelector<SVGElement>(".nb-anchor-b");
  const aTail = santa?.querySelector<SVGElement>(".nb-anchor-tail");
  let santaTimers: ReturnType<typeof setTimeout>[] = [];
  let santaAnims: Animation[] = [];
  let dustTimer = 0;
  let reinRaf = 0;

  function later(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms);
    santaTimers.push(id);
  }
  function santaCleanup() {
    santaTimers.forEach(clearTimeout);
    santaTimers = [];
    clearInterval(dustTimer);
    dustTimer = 0;
    cancelAnimationFrame(reinRaf);
    reinRaf = 0;
    santaAnims.forEach((a) => {
      try {
        a.cancel();
      } catch {}
    });
    santaAnims = [];
    banner.querySelectorAll(".natal-banner__dust").forEach((n) => n.parentNode?.removeChild(n));
    if (santa) santa.style.opacity = "0";
  }
  function anchorPt(element: SVGElement, inv: DOMMatrix) {
    const r = element.getBoundingClientRect();
    const p = santaSvg!.createSVGPoint();
    p.x = r.left + r.width / 2;
    p.y = r.top + r.height / 2;
    return p.matrixTransform(inv);
  }
  function reinPath(p: DOMPoint, q: DOMPoint, sag: number) {
    const mx = (p.x + q.x) / 2,
      my = (p.y + q.y) / 2 + sag;
    return "M" + p.x.toFixed(1) + " " + p.y.toFixed(1) + " Q" + mx.toFixed(1) + " " + my.toFixed(1) + " " + q.x.toFixed(1) + " " + q.y.toFixed(1);
  }
  function reinLoop(ts: number) {
    const ctm = santaSvg?.getScreenCTM();
    if (ctm && aHand && aA && aB && rein1 && rein2) {
      const inv = ctm.inverse();
      const h = anchorPt(aHand, inv),
        a = anchorPt(aA, inv),
        b = anchorPt(aB, inv);
      const flutter = Math.sin(ts / 110) * 1.4;
      rein1.setAttribute("d", reinPath(h, a, 3.2 + flutter));
      rein2.setAttribute("d", reinPath(a, b, 2.6 - flutter));
    }
    reinRaf = requestAnimationFrame(reinLoop);
  }
  function emitDust() {
    if (!aTail) return;
    const br = banner.getBoundingClientRect(),
      tr = aTail.getBoundingClientRect();
    const x = tr.left - br.left + tr.width / 2,
      y = tr.top - br.top + tr.height / 2;
    if (x < -6 || x > br.width + 6) return;
    const d = document.createElement("i");
    d.className = "natal-banner__dust";
    const s = 3 + Math.random() * 5;
    d.style.width = d.style.height = s + "px";
    d.style.left = x + (Math.random() - 0.5) * 4 - s / 2 + "px";
    d.style.top = y + (Math.random() - 0.5) * 6 - s / 2 + "px";
    banner.appendChild(d);
    const an = d.animate(
      [
        { opacity: 0.95, transform: "translate(0,0) scale(1)" },
        {
          opacity: 0,
          transform: "translate(" + (-20 - Math.random() * 38) + "px," + (-4 + Math.random() * 20) + "px) scale(.15)",
        },
      ],
      { duration: 900 + Math.random() * 800, easing: "ease-out", fill: "forwards" }
    );
    an.onfinish = () => d.parentNode?.removeChild(d);
  }
  function flySanta() {
    if (!santa) return;
    const w = banner.clientWidth,
      mobile = w < 640;
    const sw = santa.offsetWidth;
    const dur = mobile ? 7000 : 9000;
    const x0 = -sw - 10,
      x1 = w + 10,
      N = 80;
    const frames: Keyframe[] = [];
    const bannerH = banner.clientHeight,
      top0 = santa.offsetTop,
      sh = santa.offsetHeight;
    const ALT_IN = 0.7,
      ALT_LOW = 0.575,
      ALT_OUT = 0.8,
      T_LOW = 0.42;
    function ease(u: number) {
      return (1 - Math.cos(Math.PI * u)) / 2;
    }
    function altAt(t: number) {
      return t < T_LOW ? ALT_IN + (ALT_LOW - ALT_IN) * ease(t / T_LOW) : ALT_LOW + (ALT_OUT - ALT_LOW) * ease((t - T_LOW) / (1 - T_LOW));
    }
    const kicker = banner.querySelector(".natal-banner__kicker");
    const K = (kicker?.getBoundingClientRect().top ?? 0) - banner.getBoundingClientRect().top;
    const cmin = 44 + sh / 2,
      cmax = Math.max(cmin, K - 11 - sh / 2);
    function yAt(t: number) {
      if (!mobile) return (1 - altAt(t)) * bannerH - sh / 2 - top0;
      const f = t < T_LOW ? 0.45 + 0.55 * ease(t / T_LOW) : 1 - ease((t - T_LOW) / (1 - T_LOW));
      return cmin + f * (cmax - cmin) - sh / 2 - top0;
    }
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const x = x0 + (x1 - x0) * t;
      const y = yAt(t);
      const dt = 1 / N,
        dyp = (yAt(Math.min(t + dt, 1)) - yAt(Math.max(t - dt, 0))) / (Math.min(t + dt, 1) - Math.max(t - dt, 0));
      const rot = (Math.atan2(dyp, x1 - x0) * 180) / Math.PI * 1.2;
      const op = t < 0.07 ? (t / 0.07) * 0.6 : t > 0.93 ? ((1 - t) / 0.07) * 0.6 : 0.6;
      frames.push({ transform: "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) rotate(" + rot.toFixed(2) + "deg)", opacity: op, offset: t });
    }
    santaAnims.push(santa.animate(frames, { duration: dur, easing: "linear", fill: "both" }));
    reinRaf = requestAnimationFrame(reinLoop);
    dustTimer = window.setInterval(emitDust, 45);
    later(() => {
      clearInterval(dustTimer);
      dustTimer = 0;
      cancelAnimationFrame(reinRaf);
      reinRaf = 0;
    }, dur);
    later(flySanta, dur + 9000);
  }
  function santaStart() {
    if (reduce || !santa || !("animate" in santa)) return;
    santaCleanup();
    later(flySanta, 2200);
  }
  function santaStop() {
    santaCleanup();
  }

  /* ---------- Inicialização ---------- */
  buildLights();
  resize();
  if (reduce) {
    for (let i = 0; i < flakes.length; i++) drawFlake(flakes[i], 0);
  }
  let rt: ReturnType<typeof setTimeout>;
  function onWindowResize() {
    clearTimeout(rt);
    rt = setTimeout(() => {
      buildLights();
      resize();
      if (reduce) for (let i = 0; i < flakes.length; i++) drawFlake(flakes[i], 0);
    }, 150);
  }
  window.addEventListener("resize", onWindowResize);
  teardown.push(() => window.removeEventListener("resize", onWindowResize));

  let observer: IntersectionObserver | undefined;
  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            banner.classList.add("is-visible");
            start();
            santaStart();
          } else {
            banner.classList.remove("is-visible");
            stop();
            santaStop();
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(banner);
  } else {
    banner.classList.add("is-visible");
    start();
    santaStart();
  }
  teardown.push(() => observer?.disconnect());
  teardown.push(() => {
    stop();
    santaCleanup();
  });

  return () => teardown.forEach((fn) => fn());
}
