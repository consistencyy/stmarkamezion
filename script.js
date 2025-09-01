// Nav toggle
const toggle = document.querySelector('.nav-toggle');
const menu = document.querySelector('#nav-menu');
if (toggle && menu){
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    menu.classList.toggle('show');
  });
}

// Dropdown keyboard + click
document.querySelectorAll('.dropdown-toggle').forEach(btn => {
  const wrap = btn.closest('.dropdown');
  const dmenu = wrap?.querySelector('.dropdown-menu');
  if (!wrap || !dmenu) return;
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    dmenu.style.display = open ? 'none' : 'block';
  });
  btn.addEventListener('blur', () => {
    if (window.matchMedia('(min-width: 641px)').matches) return;
    btn.setAttribute('aria-expanded', 'false');
    dmenu.style.display = 'none';
  });
});

// Current year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Reveal on scroll
(function () {
  if (window._revealInit) return; window._revealInit = true;
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.15 });
  els.forEach(el => io.observe(el));
})();


// Button ripple
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  let r = btn.querySelector('.ripple');
  if (!r){ r = document.createElement('span'); r.className = 'ripple'; btn.appendChild(r); }
  btn.classList.remove('rippling');
  void r.offsetWidth;
  btn.classList.add('rippling');
  setTimeout(() => btn.classList.remove('rippling'), 500);
});

// Scroll to top button start //
  const scrollBtn = document.getElementById("scrollTopBtn");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 100) {
      scrollBtn.classList.add("show");
    } else {
      scrollBtn.classList.remove("show");
    }
  });

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
// Scroll to top button end //

// Trigger the on-load animations once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('loaded');
});

// ===== UX polish (progress bar, staggered reveals, gentle tilt) =====
(function(){
  if (window._uxPlusInit) return; window._uxPlusInit = true;

  // 1) Scroll progress bar
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  const setProgress = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const value = max > 0 ? (doc.scrollTop / max) : 0;
    bar.style.transform = `scaleX(${Math.max(0, Math.min(1, value))})`;
  };
  document.addEventListener('scroll', setProgress, { passive: true });
  window.addEventListener('resize', setProgress);
  setProgress();

  // 2) Staggered transitions for grids (nice cascade as they reveal)
  const applyStagger = (selector, step = 40) => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.style.setProperty('--stagger', `${i * step}ms`);
    });
  };
  applyStagger('.media-grid > *');
  applyStagger('.flyer-grid > *');
  applyStagger('.gallery > *', 30);

  // 3) Gentle, accessible tilt on hover (skips for reduced motion)
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced){
    const tilts = document.querySelectorAll('.card, .bubble, .flyer, .gallery a');
    tilts.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = (0.5 - py) * 4;   // max 4deg
        const ry = (px - 0.5) * 4;
        el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }
})();

// === Hero Ticker ===
(function(){
  const ticker = document.querySelector('.hero-ticker');
  if (!ticker) return;

  const track = ticker.querySelector('.ticker-track');
  if (!track) return;

  // Duplicate content for seamless 50% translate loop
  const originalHTML = track.innerHTML.trim();
  track.innerHTML = originalHTML + originalHTML;

  // Duration = (half the track width) / speed(px/s)
  const getSpeed = () => {
    const s = parseFloat(getComputedStyle(ticker).getPropertyValue('--ticker-speed'));
    return isNaN(s) ? 90 : s;
  };

  const setDuration = () => {
    // half, because we’re translating -50%
    const halfWidth = track.scrollWidth / 2;
    const durationSec = halfWidth / getSpeed();
    track.style.setProperty('--ticker-duration', `${durationSec}s`);
  };

  // Pause on hover/focus
  const setPaused = (paused) => track.style.animationPlayState = paused ? 'paused' : 'running';
  ticker.addEventListener('mouseenter', () => setPaused(true));
  ticker.addEventListener('mouseleave', () => setPaused(false));
  ticker.addEventListener('focusin',  () => setPaused(true));
  ticker.addEventListener('focusout', () => setPaused(false));

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    track.style.animation = 'none';
  } else {
    setDuration();
    window.addEventListener('resize', setDuration);
  }

  // Stagger the dot pulse a bit so they don’t flash in sync
  track.querySelectorAll('.ticker-dot').forEach((dot, i) => {
    dot.style.animationDelay = `${(i % 10) * 0.15}s`;
  });

  // Optional: pause when not visible (saves cycles)
  const io = new IntersectionObserver(([entry]) => {
    track.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
  }, { threshold: 0 });
  io.observe(ticker);
})();
