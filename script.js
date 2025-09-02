/* script.js — unified desktop/mobile nav + hardened utilities */
(() => {
  "use strict";

  // ---------- helpers ----------
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // run after DOM is parsed (use <script defer>)
  document.addEventListener("DOMContentLoaded", () => {

    // ===== Scroll-to-top button (guarded) =====
    const scrollBtn = $("#scrollTopBtn");
    if (scrollBtn) {
      const onScrollBtn = () => {
        if (window.scrollY > 100) scrollBtn.classList.add("show");
        else scrollBtn.classList.remove("show");
      };
      window.addEventListener("scroll", onScrollBtn, { passive: true });
      scrollBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
      onScrollBtn();
    }

    // ===== Unified NAV (desktop + mobile) =====
    const navToggle = $(".nav-toggle");      // <button aria-controls="nav-menu">
    const navMenu   = $("#nav-menu");        // <nav id="nav-menu">…</nav>
    const mqDesktop = window.matchMedia("(min-width: 901px)");
    let mobileOpen  = false;

    const openMobile = () => {
      mobileOpen = true;
      navToggle?.setAttribute("aria-expanded", "true");
      if (navMenu) {
        navMenu.hidden = false;
        navMenu.classList.add("show");  // keep for CSS transitions if you use them
      }
      document.body.classList.add("no-scroll"); // prevent background scroll on mobile
    };

    const closeMobile = () => {
      mobileOpen = false;
      navToggle?.setAttribute("aria-expanded", "false");
      if (navMenu) {
        navMenu.hidden = true;
        navMenu.classList.remove("show");
      }
      document.body.classList.remove("no-scroll");
    };

    const setDesktopState = () => {
      // On desktop, let CSS lay things out; menu should be visible and not overlay
      mobileOpen = false;
      navToggle?.setAttribute("aria-expanded", "false");
      if (navMenu) {
        navMenu.hidden = false;
        navMenu.classList.remove("show");
      }
      document.body.classList.remove("no-scroll");
    };

    const setMobileClosed = () => closeMobile();

    if (navToggle && navMenu) {
      // initial state
      mqDesktop.matches ? setDesktopState() : setMobileClosed();

      // toggle button
      navToggle.addEventListener("click", () => {
        mobileOpen ? closeMobile() : openMobile();
      });

      // close when clicking outside (mobile only)
      document.addEventListener("click", (e) => {
        if (!mobileOpen) return;
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
          closeMobile();
        }
      });

      // close when a link is tapped/clicked inside the menu (mobile only)
      navMenu.addEventListener("click", (e) => {
        if (!mobileOpen) return;
        if (e.target.closest("a")) closeMobile();
      });

      // Esc to close (mobile only)
      document.addEventListener("keydown", (e) => {
        if (!mobileOpen) return;
        if (e.key === "Escape") closeMobile();
      });

      // keep things sane on resize
      mqDesktop.addEventListener("change", (e) => {
        e.matches ? setDesktopState() : setMobileClosed();
      });
    }

// ===== Dropdowns (click on mobile, hover on desktop) =====
$$(".dropdown-toggle").forEach((btn) => {
  const wrap = btn.closest(".dropdown");
  const menu = wrap?.querySelector(".dropdown-menu");
  if (!wrap || !menu) return;

  const mqHoverDesktop = window.matchMedia("(hover: hover) and (min-width: 641px)");

  const close = () => { btn.setAttribute("aria-expanded", "false"); menu.hidden = true;  wrap.classList.remove("is-open"); };
  const open  = () => { btn.setAttribute("aria-expanded", "true");  menu.hidden = false; wrap.classList.add("is-open"); };

  // Keep behavior in sync with viewport capability
  const sync = () => {
    if (mqHoverDesktop.matches) {
      // Desktop w/ hover: let CSS handle it; ensure NOT hidden
      btn.setAttribute("aria-expanded", "false");
      menu.hidden = false;               // remove [hidden] so :hover can display it
      wrap.classList.remove("is-open");
    } else {
      // Mobile / touch: closed by default; JS toggles it
      close();
    }
  };
  sync();
  mqHoverDesktop.addEventListener("change", sync);

  // Mobile: toggle on tap/click
  btn.addEventListener("click", (e) => {
    if (mqHoverDesktop.matches) return;  // ignore clicks on desktop; hover will handle it
    e.preventDefault();
    (btn.getAttribute("aria-expanded") === "true") ? close() : open();
  });

  // Mobile: close when clicking outside
  document.addEventListener("click", (e) => {
    if (mqHoverDesktop.matches) return;
    if (!wrap.contains(e.target)) close();
  });

  // Mobile: close on Esc
  document.addEventListener("keydown", (e) => {
    if (mqHoverDesktop.matches) return;
    if (e.key === "Escape") close();
  });

  // Mobile: close when a dropdown link is tapped
  menu.addEventListener("click", (e) => {
    if (mqHoverDesktop.matches) return;
    if (e.target.closest("a")) close();
  });
});

    // ===== Reveal-on-scroll (for .reveal sections) =====
    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      }),
      { rootMargin: "0px 0px -10%", threshold: 0.1 }
    );
    $$(".reveal").forEach((el) => io.observe(el));

    // ===== Ticker (duplicate track once, safely) =====
    $$(".ticker, .hero-ticker").forEach((ticker) => {
      const track = $(".ticker-track", ticker);
      if (!track) return;
      if (!track.dataset.duped) {
        const content = track.innerHTML.trim();
        track.innerHTML = content + content;
        track.dataset.duped = "1";
      }
    });

    // ===== Button ripple (respects reduced motion) =====
    document.addEventListener("click", (e) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const btn = e.target.closest(".btn");
      if (!btn) return;

      let ripple = btn.querySelector(".ripple");
      if (!ripple) {
        ripple = document.createElement("span");
        ripple.className = "ripple";
        btn.appendChild(ripple);
      }
      btn.classList.remove("rippling");
      void ripple.offsetWidth;           // reflow
      btn.classList.add("rippling");
      setTimeout(() => btn.classList.remove("rippling"), 500);
    });
    window.addEventListener("pagehide", () => {
      $$(".btn.rippling").forEach((b) => b.classList.remove("rippling"));
    });

    // ===== Gentle tilt (composes with existing transforms via CSS var) =====
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) {
      const tiltable = $$(".card, .bubble, .flyer, .gallery a");
      tiltable.forEach((el) => {
        let raf = null, rx = 0, ry = 0;
        const apply = () => { el.style.setProperty("--tilt", `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`); raf = null; };
        el.addEventListener("mousemove", (ev) => {
          const r = el.getBoundingClientRect();
          const px = (ev.clientX - r.left) / r.width;
          const py = (ev.clientY - r.top) / r.height;
          rx = (0.5 - py) * 4;
          ry = (px - 0.5) * 4;
          if (!raf) raf = requestAnimationFrame(apply);
        });
        el.addEventListener("mouseleave", () => el.style.setProperty("--tilt", "none"));
      });
    }

  }); // DOMContentLoaded
})();
