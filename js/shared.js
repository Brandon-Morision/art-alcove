/**
 * Art Alcove — shared.js
 * Runs on every page. Handles:
 *  1. Skip-to-content link injection
 *  2. Mobile hamburger nav
 *  3. Page transition (fade out on link click)
 *  4. Scroll progress bar
 *  5. Scroll-reveal (.sr, .sr-stagger)
 *  6. Button micro-interactions (press + ripple)
 *  7. Magnetic CTA buttons
 *  8. Lazy image blur-up
 *  9. Global toast helper (window.aaToast)
 * 10. Active nav link highlighting
 */

'use strict';

(function () {

  // ─────────────────────────────────────────────────
  // 1. SKIP TO CONTENT
  // ─────────────────────────────────────────────────
  function initSkipLink () {
    const main = document.getElementById('main-content') ||
                 document.getElementById('dash-main')    ||
                 document.querySelector('main');
    if (!main) return;
    if (!main.id) main.id = 'aa-main';

    const link = document.createElement('a');
    link.href = '#' + main.id;
    link.className = 'skip-link';
    link.textContent = 'Skip to content';
    document.body.insertBefore(link, document.body.firstChild);
  }

  // ─────────────────────────────────────────────────
  // 2. MOBILE HAMBURGER NAV
  // ─────────────────────────────────────────────────
  const NAV_LINKS = [
    { href: 'index.html',     label: 'Home',         icon: 'fa-home' },
    { href: 'browse.html',    label: 'Browse Works',  icon: 'fa-search' },
    { href: 'artist.html',    label: 'Artists',       icon: 'fa-user-circle' },
    { href: 'listing.html',   label: 'Art Listing',   icon: 'fa-image' },
    { href: '#',              label: 'Categories',    icon: 'fa-th-large' },
    { href: '#',              label: 'Editorial',     icon: 'fa-newspaper' },
  ];

  function initMobileNav () {
    // Don't inject on dashboard (it has its own sidebar)
    if (document.getElementById('dash-body')) return;

    const nav = document.getElementById('nav');
    if (!nav) return;

    // 2a. Inject hamburger button before nav-actions
    const actions = nav.querySelector('.nav-actions');
    const burger = document.createElement('button');
    burger.className = 'nav-hamburger';
    burger.setAttribute('aria-label', 'Open navigation menu');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-controls', 'mobile-nav-drawer');
    burger.innerHTML = '<i class="fas fa-bars"></i>';
    if (actions) nav.insertBefore(burger, actions);
    else nav.appendChild(burger);

    // 2b. Build drawer
    const drawer = document.createElement('div');
    drawer.className = 'mobile-nav-drawer';
    drawer.id = 'mobile-nav-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'Navigation menu');
    drawer.style.display = 'none';

    const currentPage = location.pathname.split('/').pop() || 'index.html';

    drawer.innerHTML = `
      <div class="mobile-nav-backdrop" id="mnpBackdrop"></div>
      <nav class="mobile-nav-panel" id="mnpPanel">
        <div class="mnp-header">
          <div class="mnp-logo">
            <img src="Art_Alcove_logo.png" alt="Art Alcove" style="height:48px;width:auto;object-fit:contain;mix-blend-mode:multiply;">
          </div>
          <button class="mnp-close" id="mnpClose" aria-label="Close navigation">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="mnp-links">
          ${NAV_LINKS.map(l => `
            <a href="${l.href}" class="mnp-link${l.href === currentPage ? ' active' : ''}">
              <i class="fas ${l.icon}"></i>${l.label}
            </a>`).join('')}
          <div class="mnp-divider"></div>
          <a href="dashboard.html" class="mnp-link" style="color:var(--vermillion)">
            <i class="fas fa-store"></i>Seller Dashboard
          </a>
        </div>
        <div class="mnp-footer">
          <a href="#" class="mnp-sell-btn">
            <i class="fas fa-plus"></i> Start Selling
          </a>
          <div class="mnp-social">
            <a href="#" class="mnp-social-btn" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
            <a href="#" class="mnp-social-btn" aria-label="Pinterest"><i class="fab fa-pinterest-p"></i></a>
            <a href="#" class="mnp-social-btn" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
          </div>
        </div>
      </nav>`;

    document.body.appendChild(drawer);

    // Focus trap elements
    const focusable = () => drawer.querySelectorAll(
      'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
    );

    function openDrawer () {
      drawer.style.display = 'block';
      requestAnimationFrame(() => {
        drawer.classList.add('open');
        burger.setAttribute('aria-expanded', 'true');
        burger.innerHTML = '<i class="fas fa-times"></i>';
        document.body.style.overflow = 'hidden';
        // Move focus to close button
        setTimeout(() => document.getElementById('mnpClose')?.focus(), 50);
      });
    }

    function closeDrawer () {
      drawer.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      burger.innerHTML = '<i class="fas fa-bars"></i>';
      document.body.style.overflow = '';
      burger.focus();
      setTimeout(() => { drawer.style.display = 'none'; }, 350);
    }

    burger.addEventListener('click', openDrawer);
    document.getElementById('mnpClose')?.addEventListener('click', closeDrawer);
    document.getElementById('mnpBackdrop')?.addEventListener('click', closeDrawer);

    // Keyboard: Escape closes, Tab traps focus
    drawer.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeDrawer(); return; }
      if (e.key !== 'Tab') return;
      const els = Array.from(focusable());
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });

    // Close drawer when any mnp-link is clicked
    drawer.querySelectorAll('.mnp-link').forEach(a => {
      a.addEventListener('click', () => {
        if (!a.getAttribute('href')?.startsWith('#')) closeDrawer();
      });
    });
  }

  // ─────────────────────────────────────────────────
  // 3. PAGE TRANSITION
  // ─────────────────────────────────────────────────
  function initPageTransitions () {
    document.addEventListener('click', e => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      // Only internal .html links, not anchors or external
      if (!href || href.startsWith('#') || href.startsWith('http') ||
          href.startsWith('mailto') || link.target === '_blank') return;
      if (!href.endsWith('.html') && !href.match(/\/$/)) return;

      e.preventDefault();
      document.body.classList.add('page-exit');
      setTimeout(() => { window.location.href = href; }, 250);
    });
  }

  // ─────────────────────────────────────────────────
  // 4. SCROLL PROGRESS BAR
  // ─────────────────────────────────────────────────
  function initScrollProgress () {
    const bar = document.createElement('div');
    bar.id = 'aa-progress';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuenow', '0');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    bar.setAttribute('aria-label', 'Page scroll progress');
    document.body.appendChild(bar);

    let rafId;
    window.addEventListener('scroll', () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const el   = document.documentElement;
        const pct  = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
        bar.style.width = Math.min(pct, 100) + '%';
        bar.setAttribute('aria-valuenow', Math.round(pct));
      });
    }, { passive: true });
  }

  // ─────────────────────────────────────────────────
  // 5. SCROLL REVEAL
  // ─────────────────────────────────────────────────
  function initScrollReveal () {
    const items = document.querySelectorAll('.sr, .sr-stagger');
    if (!items.length) return;

    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        o.unobserve(entry.target);
      });
    }, { rootMargin: '-40px 0px', threshold: 0.08 });

    items.forEach(el => obs.observe(el));
  }

  // ─────────────────────────────────────────────────
  // 6. BUTTON MICRO-INTERACTIONS
  // ─────────────────────────────────────────────────
  function initButtonInteractions () {
    // Press scale on all buttons
    document.querySelectorAll('button, .btn-primary, .btn-addcart, .btn-sell, [class*="btn-"]')
      .forEach(btn => {
        btn.classList.add('btn-press');

        // Ripple on click (only for solid/filled buttons)
        const style = getComputedStyle(btn);
        const bg = style.backgroundColor;
        // Roughly detect non-transparent background
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          btn.classList.add('ripple-host');
          btn.addEventListener('click', e => createRipple(e, btn));
        }
      });
  }

  function createRipple (e, btn) {
    const rect   = btn.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height) * 2;
    const x      = e.clientX - rect.left - size / 2;
    const y      = e.clientY - rect.top  - size / 2;
    const wave   = document.createElement('span');
    wave.className = 'ripple-wave';
    wave.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    btn.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove());
  }

  // ─────────────────────────────────────────────────
  // 7. MAGNETIC BUTTONS (desktop only)
  // ─────────────────────────────────────────────────
  function initMagneticButtons () {
    if (window.matchMedia('(hover: none)').matches) return;

    document.querySelectorAll('.btn-magnetic, .pill-btn--accent, .btn-addcart, .btn-primary').forEach(btn => {
      btn.classList.add('btn-magnetic');

      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const dx   = (e.clientX - cx) * 0.22;
        const dy   = (e.clientY - cy) * 0.22;
        btn.style.transform = `translate(${dx}px, ${dy}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  // ─────────────────────────────────────────────────
  // 8. LAZY IMAGE BLUR-UP
  // ─────────────────────────────────────────────────
  function initLazyImages () {
    if (!('IntersectionObserver' in window)) return;

    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        const src = img.dataset.src;
        if (!src) { o.unobserve(img); return; }
        img.src = src;
        img.addEventListener('load', () => {
          img.classList.add('loaded');
          img.removeAttribute('data-src');
        }, { once: true });
        o.unobserve(img);
      });
    }, { rootMargin: '400px 0px' });

    document.querySelectorAll('img[data-src]').forEach(img => obs.observe(img));
  }

  // ─────────────────────────────────────────────────
  // 9. GLOBAL TOAST (window.aaToast)
  // ─────────────────────────────────────────────────
  function initToastSystem () {
    let stack = document.getElementById('aa-toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'aa-toast-stack';
      stack.setAttribute('aria-live', 'polite');
      stack.setAttribute('aria-atomic', 'false');
      document.body.appendChild(stack);
    }

    window.aaToast = function (message, type = 'info', duration = 3200) {
      const icons = {
        success: '<i class="fas fa-check aa-toast-icon aa-toast-icon--success"></i>',
        warning: '<i class="fas fa-exclamation-triangle aa-toast-icon aa-toast-icon--warning"></i>',
        error:   '<i class="fas fa-times-circle aa-toast-icon aa-toast-icon--error"></i>',
        info:    '<i class="fas fa-info-circle aa-toast-icon" style="color:rgba(250,247,242,0.5)"></i>',
      };
      const toast = document.createElement('div');
      toast.className = `aa-toast aa-toast--${type}`;
      toast.setAttribute('role', 'status');
      toast.innerHTML = (icons[type] || icons.info) + message;
      stack.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('dismiss');
        setTimeout(() => toast.remove(), 250);
      }, duration);
    };
  }

  // ─────────────────────────────────────────────────
  // 10. ACTIVE NAV LINK
  // ─────────────────────────────────────────────────
  function initActiveNav () {
    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a, #nav a').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (href && href !== '#' && href.split('/').pop() === page) {
        a.classList.add('active');
      }
    });
  }

  // ─────────────────────────────────────────────────
  // BOOT
  // ─────────────────────────────────────────────────
  function boot () {
    initSkipLink();
    initMobileNav();
    initPageTransitions();
    initScrollProgress();
    initScrollReveal();
    initButtonInteractions();
    initMagneticButtons();
    initLazyImages();
    initToastSystem();
    initActiveNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
