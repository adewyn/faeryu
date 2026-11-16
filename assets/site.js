// Tap "play here" to swap in the Spotify player (loads only when wanted).
document.addEventListener('click', (ev) => {
  const btn = ev.target.closest('.player');
  if (!btn) return;
  const id = btn.dataset.album;
  const frame = document.createElement('iframe');
  frame.className = 'spotify';
  frame.src = `https://open.spotify.com/embed/album/${id}?utm_source=generator&theme=0`;
  frame.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
  frame.loading = 'lazy';
  frame.title = 'spotify player';
  btn.replaceWith(frame);
});

// Tap a video thumbnail to swap in the YouTube player.
document.addEventListener('click', (ev) => {
  const btn = ev.target.closest('.video');
  if (!btn) return;
  const box = document.createElement('div');
  box.className = btn.className.replace('video', 'video-frame');
  const frame = document.createElement('iframe');
  frame.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&rel=0&playsinline=1`;
  frame.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
  frame.allowFullscreen = true;
  frame.title = btn.getAttribute('aria-label').replace('play ', '');
  box.appendChild(frame);
  btn.replaceWith(box);
});

// Photo viewer: tap a photo, then swipe or use arrows.
(() => {
  const dlg = document.querySelector('.lightbox');
  if (!dlg || !dlg.showModal) return;
  const img = dlg.querySelector('img');
  const items = [...document.querySelectorAll('.ph-btn')];
  let i = 0;
  const show = (n) => {
    i = (n + items.length) % items.length;
    const b = items[i];
    img.classList.remove('in');
    img.src = b.dataset.full;
    img.alt = b.querySelector('img').alt;
    img.decode().catch(() => {}).then(() => img.classList.add('in'));
  };
  items.forEach((b, n) => b.addEventListener('click', () => { show(n); dlg.showModal(); }));
  dlg.querySelector('.lb-close').addEventListener('click', () => dlg.close());
  dlg.querySelector('.lb-prev').addEventListener('click', () => show(i - 1));
  dlg.querySelector('.lb-next').addEventListener('click', () => show(i + 1));
  dlg.addEventListener('click', (ev) => { if (ev.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowRight') show(i + 1);
    if (ev.key === 'ArrowLeft') show(i - 1);
  });
  let x0 = null;
  dlg.addEventListener('touchstart', (ev) => { x0 = ev.touches[0].clientX; }, { passive: true });
  dlg.addEventListener('touchend', (ev) => {
    if (x0 === null) return;
    const dx = ev.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
    x0 = null;
  }, { passive: true });
})();

// Cards and sections fade up out of the fog as you scroll.
(() => {
  const els = document.querySelectorAll('.card, .latest, .about, .rel, .section-h, .feature, .vgrid li, .ph, .contact');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  els.forEach((el) => el.classList.add('veil'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('shown'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  els.forEach((el, i) => { el.style.transitionDelay = `${(i % 6) * 60}ms`; io.observe(el); });
})();

// Cover art tilts gently toward the pointer.
(() => {
  if (matchMedia('(hover: none)').matches) return;
  document.querySelectorAll('.card-link, .latest-art, .rel-art').forEach((el) => {
    el.addEventListener('pointermove', (ev) => {
      const r = el.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width - 0.5;
      const y = (ev.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(700px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-3px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
})();
