// Drifting fog + glowing wisps that follow your mouse or finger.
// Built to stay smooth: glows are pre-drawn sprites, the fog is painted
// tiny and stretched, and the fog only repaints every other frame.
(() => {
  const canvas = document.getElementById('fog');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const FOG_SCALE = 0.09;
  const fogC = document.createElement('canvas');
  fogC.id = 'fogbase';
  fogC.setAttribute('aria-hidden', 'true');
  canvas.before(fogC);
  const fctx = fogC.getContext('2d');

  let W = 0, H = 0, dpr = 1;
  const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false, energy: 0 };

  const FOG_COLORS = [
    [115, 170, 180], // teal mist
    [90, 125, 170],  // night blue
    [165, 195, 205], // pale blue fog
    [70, 135, 145],  // deep teal
  ];

  // Pre-drawn glow sprites.
  function glowSprite(rgb, size, stops) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const h = size / 2;
    const grad = g.createRadialGradient(h, h, 0, h, h, h);
    for (const [at, a] of stops) grad.addColorStop(at, `rgba(${rgb},${a})`);
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    return c;
  }
  const WISP = [
    glowSprite('205,240,246', 64, [[0, 1], [0.2, 0.4], [1, 0]]),
    glowSprite('160,215,248', 64, [[0, 1], [0.2, 0.4], [1, 0]]),
  ];
  const LANTERN = glowSprite('180,225,238', 256, [[0, 1], [1, 0]]);

  let blobs = [];
  let specks = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const newW = window.innerWidth, newH = window.innerHeight;
    const widthChanged = newW !== W;
    W = newW; H = newH;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    fogC.width = Math.max(24, Math.round(W * FOG_SCALE));
    fogC.height = Math.max(24, Math.round(H * FOG_SCALE));
    if (widthChanged || !blobs.length) seed();
  }

  function seed() {
    const big = Math.max(W, H);
    const count = W < 700 ? 8 : 12;
    blobs = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * W,
      y: H * (0.35 + Math.pow(Math.random(), 0.6) * 0.75),
      r: big * (0.22 + Math.random() * 0.28),
      sx: (Math.random() - 0.5) * 0.12,
      sy: (Math.random() - 0.5) * 0.05,
      ph: Math.random() * Math.PI * 2,
      c: FOG_COLORS[i % FOG_COLORS.length],
      a: 0.07 + Math.random() * 0.07,
      ox: 0, oy: 0,
    }));
    const n = Math.round(Math.min(W < 700 ? 45 : 90, (W * H) / 14000));
    specks = Array.from({ length: n }, () => newSpeck(true));
  }

  function newSpeck(anywhere) {
    return {
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : H + 10,
      vx: 0, vy: 0,
      drift: 0.08 + Math.random() * 0.22,
      size: 0.6 + Math.random() * 1.8,
      tw: Math.random() * Math.PI * 2,
      tws: 0.01 + Math.random() * 0.03,
      kind: Math.random() < 0.65 ? 0 : 1,
      burst: 0,
    };
  }

  function onMove(x, y) {
    if (!pointer.active) { pointer.x = x; pointer.y = y; }
    pointer.tx = x; pointer.ty = y; pointer.active = true;
    pointer.energy = Math.min(1, pointer.energy + 0.08);
  }
  addEventListener('pointermove', (ev) => onMove(ev.clientX, ev.clientY), { passive: true });
  addEventListener('pointerdown', (ev) => {
    clearTimeout(lift);
    onMove(ev.clientX, ev.clientY);
    pointer.energy = 1;
    spiralBurst(ev.clientX, ev.clientY);
  }, { passive: true });
  addEventListener('pointerleave', () => { pointer.active = false; });
  document.addEventListener('mouseleave', () => { pointer.active = false; });
  // On phones the light fades a moment after your finger lifts.
  let lift;
  addEventListener('pointerup', (ev) => {
    if (ev.pointerType !== 'touch') return;
    clearTimeout(lift);
    lift = setTimeout(() => { pointer.active = false; }, 1400);
  }, { passive: true });
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });

  function spiralBurst(x, y) {
    if (still) return;
    const n = 26, turn = Math.random() * Math.PI * 2, dir = Math.random() < 0.5 ? 1 : -1;
    for (let i = 0; i < n; i++) {
      const a = turn + dir * i * 0.55;
      const s = newSpeck(true);
      const r = 2 + i * 0.9;
      s.x = x + Math.cos(a) * r; s.y = y + Math.sin(a) * r;
      s.vx = Math.cos(a) * (0.6 + i * 0.05) - dir * Math.sin(a) * 1.6;
      s.vy = Math.sin(a) * (0.6 + i * 0.05) + dir * Math.cos(a) * 1.6;
      s.size = 0.8 + Math.random() * 1.2;
      s.burst = 1;
      specks.push(s);
    }
    if (specks.length > 220) specks.splice(0, specks.length - 220);
  }

  function drawFog(t) {
    const fw = fogC.width, fh = fogC.height;
    fctx.clearRect(0, 0, fw, fh);
    fctx.globalCompositeOperation = 'lighter';
    const scrollShift = (window.scrollY || 0) * 0.15;
    for (const b of blobs) {
      b.x += (b.sx + Math.sin(t * 0.0007 + b.ph) * 0.15) * 2;
      b.y += (b.sy + Math.cos(t * 0.0005 + b.ph) * 0.08) * 2;
      if (b.x < -b.r) b.x = W + b.r; else if (b.x > W + b.r) b.x = -b.r;
      if (b.y < -b.r) b.y = H + b.r; else if (b.y > H + b.r) b.y = -b.r;
      if (pointer.active) {
        const dx = b.x + b.ox - pointer.x, dy = b.y + b.oy - pointer.y;
        const d = Math.hypot(dx, dy) || 1;
        const reach = b.r * 0.9;
        if (d < reach) {
          const f = (1 - d / reach) * 3.2 * (0.4 + pointer.energy);
          b.ox += (dx / d) * f; b.oy += (dy / d) * f;
        }
      }
      b.ox *= 0.97; b.oy *= 0.97;
      const breathe = 1 + Math.sin(t * 0.001 + b.ph) * 0.08;
      const span = H + b.r * 2;
      const x = (b.x + b.ox) * FOG_SCALE;
      const y = ((((b.y + b.oy - scrollShift + b.r) % span) + span) % span - b.r) * FOG_SCALE;
      const r = b.r * FOG_SCALE * breathe;
      const g = fctx.createRadialGradient(x, y, 0, x, y, r);
      const [cr, cg, cb] = b.c;
      g.addColorStop(0, `rgba(${cr},${cg},${cb},${b.a})`);
      g.addColorStop(0.55, `rgba(${cr},${cg},${cb},${b.a * 0.45})`);
      g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      fctx.fillStyle = g;
      fctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    fctx.globalCompositeOperation = 'source-over';
  }

  function drawSpecks() {
    ctx.globalCompositeOperation = 'lighter';
    if (pointer.active) {
      const r = Math.min(W, H) * 0.32;
      ctx.globalAlpha = 0.05 + pointer.energy * 0.05;
      ctx.drawImage(LANTERN, pointer.x - r, pointer.y - r, r * 2, r * 2);
    }
    for (let i = 0; i < specks.length; i++) {
      const s = specks[i];
      s.tw += s.tws;
      let glow = 0;
      if (pointer.active) {
        const dx = pointer.x - s.x, dy = pointer.y - s.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 48400) { // within 220px
          const d = Math.sqrt(d2) || 1;
          const k = 1 - d / 220;
          s.vx += (dx / d) * k * 0.035 + (-dy / d) * k * 0.05;
          s.vy += (dy / d) * k * 0.035 + (dx / d) * k * 0.05;
          if (d < 26) { s.vx -= (dx / d) * 0.12; s.vy -= (dy / d) * 0.12; }
          glow = k;
        }
      }
      const damp = s.burst ? 0.985 : 0.96;
      s.vx *= damp; s.vy *= damp;
      s.x += s.vx + Math.sin(s.tw * 0.7) * 0.12;
      s.y += s.vy - s.drift;
      if (s.burst) {
        s.burst -= 0.006;
        if (s.burst <= 0) { specks.splice(i, 1); i--; continue; }
      } else if (s.y < -10 || s.x < -20 || s.x > W + 20) { specks[i] = newSpeck(false); continue; }

      const a = (0.45 + Math.sin(s.tw) * 0.35 + glow * 0.6) * (s.burst ? Math.min(1, s.burst * 1.5) + 0.3 : 1);
      const R = s.size * (1 + glow * 1.2) * 5;
      ctx.globalAlpha = Math.min(1, a * 0.9);
      ctx.drawImage(WISP[s.kind], s.x - R, s.y - R, R * 2, R * 2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  let frameNo = 0;
  function frame(now) {
    const t = now || 0;
    pointer.x += (pointer.tx - pointer.x) * 0.12;
    pointer.y += (pointer.ty - pointer.y) * 0.12;
    pointer.energy *= 0.985;
    if (frameNo++ % 2 === 0 || still) drawFog(t);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawSpecks();
    if (!still) requestAnimationFrame(frame);
  }

  resize();
  if (still) {
    frame(0);
    addEventListener('resize', () => setTimeout(() => frame(0), 200));
  } else {
    requestAnimationFrame(frame);
  }
})();
