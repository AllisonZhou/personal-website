(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let motionOn = !reduceMotion;

  const mouse = { x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2, down: false };

  /* ---------------- generative field ----------------
     Particles drift through a curl-ish noise flow field and are
     pushed around by the cursor. Each route gets its own mood. */
  const canvas = $("#field");
  const ctx = canvas.getContext("2d");
  let W, H, DPR, particles = [];

  const moods = {
    hello:   { hue: 14,  speed: 1.0, scale: 0.0016, trail: 0.08 },
    work:    { hue: 205, speed: 0.6, scale: 0.0024, trail: 0.12 },
    about:   { hue: 145, speed: 0.45, scale: 0.0012, trail: 0.06 },
    contact: { hue: 330, speed: 1.3, scale: 0.002, trail: 0.1 },
  };
  let mood = { ...moods.hello };
  let target = moods.hello;

  // cheap smooth pseudo-noise (sum of sines) — no dependencies needed
  const noise = (x, y, t) =>
    Math.sin(x * 1.7 + t) * Math.cos(y * 1.3 - t * 0.7) +
    Math.sin((x + y) * 0.9 + t * 0.5) * 0.6 +
    Math.cos(x * 2.3 - y * 1.1 + t * 0.3) * 0.4;

  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const count = Math.round(Math.min(1400, (W * H) / 1100));
    particles = Array.from({ length: count }, spawn);
    ctx.fillStyle = "#0d0c0b";
    ctx.fillRect(0, 0, W, H);
  }

  function spawn() {
    return { x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, life: Math.random() * 200, s: Math.random() };
  }

  let t = 0;
  function frame() {
    requestAnimationFrame(frame);

    mouse.x += (mouse.tx - mouse.x) * 0.18;
    mouse.y += (mouse.ty - mouse.y) * 0.18;

    // ease mood toward target
    for (const k of ["speed", "scale", "trail"]) mood[k] += (target[k] - mood[k]) * 0.03;
    let dh = ((target.hue - mood.hue + 540) % 360) - 180;
    mood.hue = (mood.hue + dh * 0.03 + 360) % 360;

    if (!motionOn) return;
    t += 0.004 * mood.speed;

    ctx.fillStyle = `rgba(13,12,11,${mood.trail})`;
    ctx.fillRect(0, 0, W, H);

    const r2 = 160 * 160;
    for (const p of particles) {
      const a = noise(p.x * mood.scale, p.y * mood.scale, t) * Math.PI * 1.4;
      p.vx += Math.cos(a) * 0.12 * mood.speed;
      p.vy += Math.sin(a) * 0.12 * mood.speed;

      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < r2) {
        const f = (1 - d2 / r2) * (mouse.down ? -1.6 : 0.9);
        const d = Math.sqrt(d2) || 1;
        // push away + swirl
        p.vx += (dx / d) * f + (-dy / d) * f * 0.6;
        p.vy += (dy / d) * f + (dx / d) * f * 0.6;
      }

      p.vx *= 0.92; p.vy *= 0.92;
      const px = p.x, py = p.y;
      p.x += p.vx; p.y += p.vy;
      p.life -= 1;

      if (p.life < 0 || p.x < -10 || p.x > W + 10 || p.y < -10 || p.y > H + 10) {
        Object.assign(p, spawn(), { life: 120 + Math.random() * 240 });
        continue;
      }

      const sp = Math.min(1, Math.hypot(p.vx, p.vy) / 3);
      const hue = mood.hue + p.s * 40 - 20;
      ctx.strokeStyle = `hsla(${hue}, ${55 + sp * 45}%, ${55 + sp * 20}%, ${0.25 + sp * 0.6})`;
      ctx.lineWidth = 0.6 + p.s * 1.2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }

  function drawStill() {
    // a calm static composition for reduced motion
    ctx.fillStyle = "#0d0c0b";
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W * 0.75, H * 0.35, 0, W * 0.75, H * 0.35, Math.max(W, H) * 0.6);
    g.addColorStop(0, `hsla(${target.hue}, 80%, 55%, .28)`);
    g.addColorStop(1, "rgba(13,12,11,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  /* ---------------- cursor ---------------- */
  const cursor = $(".cursor");
  const cursorLabel = $(".cursor__label");
  let cx = mouse.tx, cy = mouse.ty;

  function cursorLoop() {
    cx += (mouse.tx - cx) * 0.25;
    cy += (mouse.ty - cy) * 0.25;
    cursor.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(cursorLoop);
  }

  addEventListener("pointermove", (e) => {
    mouse.tx = e.clientX; mouse.ty = e.clientY;
    cursor.classList.remove("is-hidden");
    $("#coords").textContent = `x ${String(Math.round(e.clientX)).padStart(3, "0")} · y ${String(Math.round(e.clientY)).padStart(3, "0")}`;
  });
  addEventListener("pointerdown", () => (mouse.down = true));
  addEventListener("pointerup", () => (mouse.down = false));
  document.addEventListener("pointerleave", () => cursor.classList.add("is-hidden"));

  document.addEventListener("pointerover", (e) => {
    const el = e.target.closest("[data-cursor], a, button");
    if (!el) return;
    const label = el.dataset.cursor;
    if (label) {
      cursor.classList.add("is-big");
      cursorLabel.textContent = label;
    }
  });
  document.addEventListener("pointerout", (e) => {
    const el = e.target.closest("[data-cursor]");
    if (el && !el.contains(e.relatedTarget)) cursor.classList.remove("is-big");
  });

  /* ---------------- router ---------------- */
  const views = Object.fromEntries($$("[data-view]").map((v) => [v.dataset.view, v]));
  let current = null;

  function parseRoute() {
    const m = location.hash.match(/^#\/([\w-]+)/);
    return m && views[m[1]] ? m[1] : "hello";
  }

  function show(name, animate) {
    if (name === current) return;
    const swap = () => {
      if (current) views[current].classList.remove("is-active");
      views[name].classList.add("is-active");
      views[name].scrollTop = 0;
      $$(".nav a").forEach((a) => a.classList.toggle("is-active", a.dataset.route === name));
      document.title = name === "hello" ? "Allison Zhou" : `${name[0].toUpperCase() + name.slice(1)} — Allison Zhou`;
      target = moods[name];
      if (!motionOn) drawStill();
      current = name;
    };
    if (animate && motionOn) {
      document.body.classList.remove("is-leaving");
      void document.body.offsetWidth;
      document.body.classList.add("is-leaving");
      setTimeout(swap, 420);
      setTimeout(() => document.body.classList.remove("is-leaving"), 950);
    } else swap();
  }

  addEventListener("hashchange", () => show(parseRoute(), true));
  if (!location.hash) history.replaceState(null, "", "#/hello/");

  /* ---------------- word swapper ---------------- */
  const words = ["curious", "playful", "tender", "strange", "useful", "joyful"];
  let wi = 0;
  const swapEl = $("#swap");
  setInterval(() => {
    if (!motionOn || current !== "hello") return;
    wi = (wi + 1) % words.length;
    swapEl.classList.remove("is-flip");
    void swapEl.offsetWidth;
    swapEl.classList.add("is-flip");
    setTimeout(() => (swapEl.textContent = words[wi]), 280);
  }, 2400);

  /* ---------------- work peek (generative thumbnails) ---------------- */
  const peek = $(".peek");
  const pc = $(".peek__canvas");
  const pctx = pc.getContext("2d");
  let peekHue = null, peekX = 0, peekY = 0, px = 0, py = 0;

  function drawPeek(hue, time) {
    const w = pc.width, h = pc.height;
    const g = pctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, `hsl(${hue}, 80%, 58%)`);
    g.addColorStop(1, `hsl(${(hue + 60) % 360}, 70%, 22%)`);
    pctx.fillStyle = g;
    pctx.fillRect(0, 0, w, h);
    pctx.globalCompositeOperation = "overlay";
    for (let i = 0; i < 7; i++) {
      pctx.beginPath();
      const r = 30 + i * 22;
      pctx.arc(w / 2 + Math.sin(time + i) * 40, h / 2 + Math.cos(time * 0.8 + i) * 24, r, 0, Math.PI * 2);
      pctx.strokeStyle = `hsla(${(hue + i * 12) % 360}, 90%, 85%, .5)`;
      pctx.lineWidth = 1.5;
      pctx.stroke();
    }
    pctx.globalCompositeOperation = "source-over";
  }

  function peekLoop(ts) {
    px += (peekX - px) * 0.15;
    py += (peekY - py) * 0.15;
    peek.style.left = `${px + 24}px`;
    peek.style.top = `${py - 100}px`;
    if (peekHue !== null) drawPeek(peekHue, ts / 700);
    requestAnimationFrame(peekLoop);
  }

  $$(".work__item").forEach((item) => {
    item.addEventListener("pointerenter", () => { peekHue = +item.dataset.hue; peek.classList.add("is-on"); });
    item.addEventListener("pointerleave", () => peek.classList.remove("is-on"));
  });
  addEventListener("pointermove", (e) => { peekX = e.clientX; peekY = e.clientY; });

  /* ---------------- contact: copy email ---------------- */
  const email = $(".email");
  email.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(email.dataset.email);
      email.classList.add("is-copied");
      setTimeout(() => email.classList.remove("is-copied"), 1800);
    } catch {
      location.href = `mailto:${email.dataset.email}`;
    }
  });

  /* ---------------- clock + misc ---------------- */
  const clock = $("#clock");
  const tick = () => {
    clock.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).toLowerCase();
  };
  tick(); setInterval(tick, 15000);
  $("#year").textContent = new Date().getFullYear();

  const toggle = $("#motion-toggle");
  function setMotion(on) {
    motionOn = on;
    document.body.classList.toggle("no-motion", !on);
    toggle.textContent = `motion: ${on ? "on" : "off"}`;
    toggle.setAttribute("aria-pressed", String(!on));
    if (!on) drawStill();
  }
  toggle.addEventListener("click", () => setMotion(!motionOn));

  /* ---------------- boot ---------------- */
  addEventListener("resize", () => { resize(); if (!motionOn) drawStill(); });
  resize();
  setMotion(motionOn);
  show(parseRoute(), false);
  requestAnimationFrame(frame);
  requestAnimationFrame(cursorLoop);
  requestAnimationFrame(peekLoop);
})();
