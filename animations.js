const Motion = (() => {
  const touch = matchMedia('(pointer: coarse)').matches;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let px = innerWidth / 2, py = innerHeight / 2, rx = px, ry = py, glowScheduled = false;

  // Batches the --mx/--my spotlight vars into one write per animation
  // frame instead of one write per raw pointermove event, so the
  // page isn't repainting large blurred gradients faster than the
  // screen can show them.
  function paintGlow() {
    document.documentElement.style.setProperty('--mx', `${px}px`);
    document.documentElement.style.setProperty('--my', `${py}px`);
    glowScheduled = false;
  }
  function scheduleGlow() { if (!glowScheduled) { glowScheduled = true; requestAnimationFrame(paintGlow); } }

  function bindReveals() {
    document.querySelectorAll('.reveal:not([data-motion-bound])').forEach(el => {
      el.dataset.motionBound = '1';
      const io = new IntersectionObserver(([entry], obs) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect(); } }, { threshold: .12 });
      io.observe(el);
    });
  }

  function bindRipples() {
    document.querySelectorAll('.ripple:not([data-ripple-bound])').forEach(el => {
      el.dataset.rippleBound = '1';
      el.addEventListener('click', e => {
        const r = document.createElement('i'); r.className = 'ink';
        const b = el.getBoundingClientRect();
        r.style.cssText = `left:${e.clientX - b.left}px;top:${e.clientY - b.top}px`;
        el.append(r);
        setTimeout(() => r.remove(), 650);
      }, { passive: true });
    });
  }

  // Caches each card's rect once on entry instead of recalculating it
  // on every pointermove (a forced layout read per mouse pixel is the
  // single biggest source of scroll/hover jank on a grid of cards).
  function bindTilt() {
    if (touch || reduceMotion) return;
    document.querySelectorAll('.tilt:not([data-tilt-bound])').forEach(el => {
      el.dataset.tiltBound = '1';
      let rect = null, ticking = false, lastX = 0, lastY = 0;
      const apply = () => {
        const X = (lastX - rect.left) / rect.width - .5;
        const Y = (lastY - rect.top) / rect.height - .5;
        el.style.transform = `perspective(900px) rotateX(${-Y * 6}deg) rotateY(${X * 7}deg) translateY(-7px)`;
        ticking = false;
      };
      el.addEventListener('pointerenter', () => { rect = el.getBoundingClientRect(); }, { passive: true });
      el.addEventListener('pointermove', e => {
        if (!rect) rect = el.getBoundingClientRect();
        lastX = e.clientX; lastY = e.clientY;
        if (!ticking) { ticking = true; requestAnimationFrame(apply); }
      }, { passive: true });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; rect = null; }, { passive: true });
    });
  }

  let cursorBound = false;
  function bindCursor() {
    if (touch || reduceMotion || cursorBound) return;
    cursorBound = true;
    const dot = document.createElement('i'), ring = document.createElement('i');
    dot.className = 'cursor-dot'; ring.className = 'cursor-ring';
    document.body.append(dot, ring);
    addEventListener('pointermove', e => {
      px = e.clientX; py = e.clientY;
      dot.style.transform = `translate(${px}px,${py}px)`;
      scheduleGlow();
    }, { passive: true });
    (function loop() {
      rx += (px - rx) * .16;
      ry += (py - ry) * .16;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      requestAnimationFrame(loop);
    })();
  }

  function init() {
    bindReveals();
    bindRipples();
    bindTilt();
    bindCursor();
  }

  return { init };
})();
