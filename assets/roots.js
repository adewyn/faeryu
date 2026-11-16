// Vines creep in from the edges as you scroll down. Near the top they are
// just a few dark tendrils; further down they reach inward, unfurl leaves,
// curl into spirals, and moss blooms along them.
(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isRelease = document.body.classList.contains('page-release');

  const cv = document.createElement('canvas');
  cv.className = 'roots';
  cv.setAttribute('aria-hidden', 'true');
  const dusk = document.createElement('div');
  dusk.className = 'dusk';
  dusk.setAttribute('aria-hidden', 'true');
  document.body.prepend(dusk);
  document.body.prepend(cv);
  const ctx = cv.getContext('2d');

  let W = 0, H = 0, dpr = 1;
  let branches = [], leaves = [], moss = [];
  let seed = 1;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const ease = (v) => v * v * (3 - 2 * v);

  // ---------- moss sprites: drawn once, stamped many times ----------
  const MOSS_SPRITES = [];
  function makeMossSprites() {
    const greens = ['#1b3230', '#203e3a', '#274b45', '#2f584f', '#38665a', '#447463', '#548470'];
    for (let v = 0; v < 6; v++) {
      const S = 128;
      const c = document.createElement('canvas');
      c.width = c.height = S;
      const g = c.getContext('2d');
      let s = 97 + v * 31;
      const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
      // soft dark base so the clump sits on the vine
      const base = g.createRadialGradient(64, 70, 4, 64, 70, 54);
      base.addColorStop(0, 'rgba(12,26,28,0.9)');
      base.addColorStop(1, 'rgba(12,26,28,0)');
      g.fillStyle = base;
      g.fillRect(0, 0, S, S);
      // cushion of tiny tufts, lighter toward the top
      for (let i = 0; i < 260; i++) {
        const a = r() * Math.PI * 2;
        const d = Math.pow(r(), 0.7) * 44;
        const x = 64 + Math.cos(a) * d * 1.15;
        const y = 70 + Math.sin(a) * d * 0.6;
        const rad = 1.2 + r() * 3.2 * (1 - d / 60);
        const lift = 1 - (y - 30) / 70;
        g.fillStyle = greens[Math.max(0, Math.min(greens.length - 1, Math.floor((r() * 0.6 + lift * 0.6) * greens.length)))];
        g.beginPath();
        g.arc(x, y, rad, 0, Math.PI * 2);
        g.fill();
      }
      // dew-light speckles on top
      for (let i = 0; i < 40; i++) {
        const x = 64 + (r() - 0.5) * 70, y = 58 + (r() - 0.5) * 34;
        g.fillStyle = `rgba(145,215,210,${0.25 + r() * 0.35})`;
        g.beginPath();
        g.arc(x, y, 0.6 + r() * 1.1, 0, Math.PI * 2);
        g.fill();
      }
      // moss "flowers": thin stalks with pale glowing capsules
      const stalks = 4 + Math.floor(r() * 6);
      for (let i = 0; i < stalks; i++) {
        const x = 64 + (r() - 0.5) * 60, y = 62 + (r() - 0.5) * 16;
        const h = 10 + r() * 22, lean = (r() - 0.5) * 12;
        g.strokeStyle = 'rgba(85,100,95,0.85)';
        g.lineWidth = 0.9;
        g.beginPath();
        g.moveTo(x, y);
        g.quadraticCurveTo(x + lean * 0.3, y - h * 0.6, x + lean, y - h);
        g.stroke();
        const cx = x + lean, cy = y - h;
        const glow = g.createRadialGradient(cx, cy, 0, cx, cy, 6);
        glow.addColorStop(0, 'rgba(205,248,245,0.9)');
        glow.addColorStop(0.35, 'rgba(140,225,230,0.45)');
        glow.addColorStop(1, 'rgba(140,225,230,0)');
        g.fillStyle = glow;
        g.fillRect(cx - 6, cy - 6, 12, 12);
        g.fillStyle = '#d2f5f2';
        g.beginPath();
        g.ellipse(cx, cy, 1.3, 2, lean * 0.05, 0, Math.PI * 2);
        g.fill();
      }
      MOSS_SPRITES.push(c);
    }
  }

  // ---------- growing the shapes (once per screen width) ----------
  function branch(x, y, ang, len, w, depth, t0) {
    const step = 6;
    const n = Math.max(4, Math.round(len / step));
    const pts = [{ x, y, s: 0, a: ang }];
    let a = ang, av = 0, s = 0;
    const kids = [], myLeaves = [], myMoss = [];
    for (let i = 1; i <= n; i++) {
      av += (rnd() - 0.5) * 0.085;
      av *= 0.9;
      a += av + (ang - a) * 0.018;
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
      s += step;
      pts.push({ x, y, s, a });
      const wHere = w * (1 - 0.82 * (i / n));
      if (depth < 3 && i > 4 && i < n - 3 && rnd() < 0.075 - depth * 0.018) kids.push({ i, side: rnd() < 0.5 ? -1 : 1 });
      if (depth > 0 && wHere < 7 && i % 3 === 0 && rnd() < 0.3) {
        myLeaves.push({ i, side: rnd() < 0.5 ? -1 : 1, size: 6 + rnd() * 9, tint: Math.floor(rnd() * 3) });
      }
      if (wHere > 2.4 && rnd() < 0.06) {
        myMoss.push({ i, size: 14 + wHere * 2.4 + rnd() * 14, v: Math.floor(rnd() * 6), off: (rnd() - 0.5) * wHere });
      }
    }
    // Spiral tendrils at many tips.
    if (depth >= 1 && rnd() < 0.55) {
      const dir = rnd() < 0.5 ? -1 : 1;
      let r = 4 + rnd() * 5, turn = 0.42;
      for (let k = 0; k < 26; k++) {
        a += dir * turn;
        turn *= 1.04;
        r *= 0.9;
        x += Math.cos(a) * r;
        y += Math.sin(a) * r;
        s += r;
        pts.push({ x, y, s, a });
      }
    }
    const b = { pts, w, depth, total: s, t0, t1: t0 + 0.3 + len / 1500 + depth * 0.04 };
    branches.push(b);
    const timeAt = (i) => b.t0 + (b.t1 - b.t0) * (pts[i].s / b.total);
    for (const l of myLeaves) { l.b = b; l.t = timeAt(l.i) + 0.02; leaves.push(l); }
    // Moss blooms after its vine has grown, and never near the top of the page.
    for (const m of myMoss) { m.b = b; m.t = Math.max(0.42, timeAt(m.i) + 0.14); moss.push(m); }
    for (const k of kids) {
      const p = pts[k.i];
      const frac = p.s / b.total;
      branch(p.x, p.y, p.a + k.side * (0.55 + rnd() * 0.6), len * (0.3 + rnd() * 0.32),
             Math.max(1.2, w * (1 - 0.82 * frac) * 0.72), depth + 1, timeAt(k.i));
    }
  }

  function grow() {
    seed = 11;
    branches = []; leaves = []; moss = [];
    const small = W < 700;
    const reach = small ? W * 0.62 : Math.min(820, W * 0.5);
    const thick = small ? 0.7 : 1;
    const perSide = small ? 4 : 5;
    for (const side of [-1, 1]) {
      for (let i = 0; i < perSide; i++) {
        const y = H * (0.08 + 0.84 * (i + 0.5) / perSide) + (rnd() - 0.5) * H * 0.12;
        const x = side < 0 ? -10 : W + 10;
        const ang = (side < 0 ? 0 : Math.PI) + (rnd() - 0.5) * 0.7;
        branch(x, y, ang, reach * (0.7 + rnd() * 0.45), (9 + rnd() * 6) * thick, 0, rnd() * 0.1);
      }
    }
    // a few hanging down from the top edge
    const nt = small ? 2 : 3;
    for (let i = 0; i < nt; i++) {
      const x = W * (0.12 + 0.76 * (i + 0.5) / nt) + (rnd() - 0.5) * 80;
      branch(x, -10, Math.PI / 2 + (rnd() - 0.5) * 0.8, H * (0.2 + rnd() * 0.14), (7 + rnd() * 5) * thick, 0, 0.35 + rnd() * 0.15);
    }
    const nb = small ? 2 : 4;
    for (let i = 0; i < nb; i++) {
      const x = W * (0.1 + 0.8 * (i + 0.5) / nb) + (rnd() - 0.5) * 60;
      branch(x, H + 10, -Math.PI / 2 + (rnd() - 0.5) * 0.8, H * (0.22 + rnd() * 0.16), (8 + rnd() * 5) * thick, 0, 0.12 + rnd() * 0.12);
    }
    moss.sort((a, b) => a.t - b.t);
  }

  // ---------- drawing ----------
  const RIM = 'rgba(140,200,212,0.14)';
  const LEAF = ['#14282b', '#183234', '#1d3c3a'];
  const L = [], R = [];

  function drawBranch(b, f) {
    const vis = f * b.total;
    if (vis < 1) return;
    const pts = b.pts;
    L.length = 0; R.length = 0;
    const taperLen = Math.max(10, b.w * 5);
    let end = null;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (p.s > vis) {
        const q = pts[i - 1];
        const k = (vis - q.s) / (p.s - q.s);
        end = { x: q.x + (p.x - q.x) * k, y: q.y + (p.y - q.y) * k };
        break;
      }
      const wBase = b.w * (1 - 0.82 * (p.s / b.total));
      const tip = clamp01((vis - p.s) / taperLen);
      const hw = Math.max(0.35, wBase * (0.2 + 0.8 * tip)) / 2;
      const nx = -Math.sin(p.a), ny = Math.cos(p.a);
      L.push(p.x + nx * hw, p.y + ny * hw);
      R.push(p.x - nx * hw, p.y - ny * hw);
    }
    if (!end) end = pts[pts.length - 1];

    // body, with a faint rim where the fog light catches the edge
    ctx.beginPath();
    ctx.moveTo(L[0], L[1]);
    for (let i = 2; i < L.length; i += 2) ctx.lineTo(L[i], L[i + 1]);
    ctx.lineTo(end.x, end.y);
    for (let i = R.length - 2; i >= 0; i -= 2) ctx.lineTo(R[i], R[i + 1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // a lit ridge running along one side of the vine
    if (b.w > 2 && L.length > 4) {
      ctx.beginPath();
      for (let i = 0; i < L.length; i += 2) {
        const x = L[i] * 0.64 + R[i] * 0.36, y = L[i + 1] * 0.64 + R[i + 1] * 0.36;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.lineWidth = Math.max(0.6, b.w * 0.14);
      ctx.strokeStyle = 'rgba(66,112,124,0.52)';
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.strokeStyle = RIM;
    }
  }

  function drawLeaf(l, k) {
    const p = l.b.pts[l.i];
    const size = l.size * ease(k);
    const ang = p.a + l.side * 0.95;
    const c = Math.cos(ang), s = Math.sin(ang);
    ctx.setTransform(dpr * c, dpr * s, -dpr * s, dpr * c, dpr * p.x, dpr * p.y);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(size * 0.3, -size * 0.42, size * 0.75, -size * 0.32, size, 0);
    ctx.bezierCurveTo(size * 0.75, size * 0.32, size * 0.3, size * 0.42, 0, 0);
    ctx.fillStyle = LEAF[l.tint];
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(size * 0.08, 0);
    ctx.lineTo(size * 0.85, 0);
    ctx.strokeStyle = 'rgba(105,170,178,0.38)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }

  function draw(g) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#060b0e';
    ctx.strokeStyle = RIM;
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    for (const b of branches) {
      const f = clamp01((g - b.t0) / (b.t1 - b.t0));
      if (f > 0) drawBranch(b, ease(f));
    }
    for (const l of leaves) {
      const k = clamp01((g - l.t) / 0.07);
      if (k > 0) drawLeaf(l, k);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const m of moss) {
      const k = clamp01((g - m.t) / 0.16);
      if (k <= 0) break;
      const p = m.b.pts[m.i];
      const sz = m.size * (0.35 + 0.65 * ease(k));
      ctx.globalAlpha = Math.min(1, k * 1.6);
      ctx.drawImage(MOSS_SPRITES[m.v], p.x - sz / 2, p.y - sz * 0.62 + m.off, sz, sz);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- scroll → growth ----------
  const base = isRelease ? 0.5 : 0.04;
  let range = 1;
  const measure = () => { range = document.documentElement.scrollHeight - innerHeight; };
  function target() {
    const p = range > 40 ? clamp01(scrollY / range) : 1;
    return { p, g: base + p * (1.32 - base) };
  }

  let g = 0, drawnG = -1, duskShown = -1, lastT = 0, lastW = 0;

  function fit() {
    const rect = cv.getBoundingClientRect();
    const newW = Math.round(rect.width), newH = Math.round(rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    measure();
    if (newW === lastW && Math.abs(newH - H) < 2) return;
    W = newW; H = newH;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    if (W !== lastW) grow(); // phones change height while scrolling; regrow only on width changes
    lastW = W;
    drawnG = -1;
  }

  function tick(now) {
    const dt = Math.min(64, now - (lastT || now));
    lastT = now;
    const t = target();
    if (still) g = t.g;
    else g += (t.g - g) * (1 - Math.pow(0.9, dt / 16.7));
    if (Math.abs(g - drawnG) > 0.0006) { draw(g); drawnG = g; }
    // dark at the top of the page, lifting as you go down
    const d = (isRelease ? 0.3 : 0.62) * (1 - ease(clamp01(t.p / 0.5)));
    if (Math.abs(d - duskShown) > 0.004) { dusk.style.opacity = d.toFixed(3); duskShown = d; }
    requestAnimationFrame(tick);
  }

  makeMossSprites();
  fit();
  addEventListener('load', measure);
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(fit, 150); });
  requestAnimationFrame(tick);
})();
