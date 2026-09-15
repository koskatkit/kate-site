/* ============================================================
   YEKATERINA — Model Portfolio · static JS
   - i18n (EN / RU) with localStorage persistence
   - Age gate (30-day cookie)
   - Sticky header + active section detection
   - Smooth scroll navigation
   - Booking form: client-side validation + mailto fallback
   - Toast notifications
   ============================================================ */

(function () {
  'use strict';

  // ---------- i18n ----------
  function applyLang(lang) {
    if (!window.I18N || !window.I18N[lang]) lang = 'en';
    const dict = window.I18N[lang];

    document.documentElement.setAttribute('lang', lang);

    // Text content
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) {
        // Allow simple HTML in translations (e.g. <br />)
        if (dict[key].indexOf('<') !== -1) el.innerHTML = dict[key];
        else el.textContent = dict[key];
      }
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key] !== undefined) el.setAttribute('placeholder', dict[key]);
    });

    // Toggle active button
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-lang') === lang);
    });

    // Update <title> + meta description
    if (lang === 'ru') {
      document.title = 'YEKATERINA — Портфель модели';
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', 'Профессиональный портфель модели YEKATERINA, Усть-Каменогорск, Казахстан. Сотрудничество, editorial, бельё, art-nude.');
    } else {
      document.title = 'YEKATERINA — Model Portfolio';
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', 'Professional portfolio of YEKATERINA, model based in Ust-Kamenogorsk, Kazakhstan. Available for collaborations, editorial, lingerie and art-nude projects.');
    }

    // Re-validate form errors (if any) so they show in the current language
    if (currentFormValues) revalidateForm();

    try { localStorage.setItem('kate_lang', lang); } catch (e) {}
    currentLang = lang;
  }

  let currentLang = 'en';
  let currentFormValues = null; // snapshot for re-validation on lang switch

  // Detect initial language
  let initialLang = 'en';
  try {
    const saved = localStorage.getItem('kate_lang');
    if (saved === 'ru' || saved === 'en') initialLang = saved;
    else if (navigator.language && navigator.language.toLowerCase().indexOf('ru') === 0) initialLang = 'ru';
  } catch (e) {}

  // ---------- AGE GATE ----------
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }
  function setCookie(name, value, days) {
    const exp = new Date();
    exp.setDate(exp.getDate() + days);
    document.cookie = name + '=' + value + '; expires=' + exp.toUTCString() + '; path=/; SameSite=Lax';
  }

  const ageGate = document.getElementById('ageGate');
  if (getCookie('kate_age_verified') === '1') {
    ageGate.hidden = true;
    document.body.classList.remove('age-locked');
  } else {
    document.body.classList.add('age-locked');
  }

  document.getElementById('ageConfirm').addEventListener('click', function () {
    setCookie('kate_age_verified', '1', 30);
    ageGate.hidden = true;
    document.body.classList.remove('age-locked');
  });

  // ---------- YEAR ----------
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- NAV: smooth scroll ----------
  function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  document.querySelectorAll('[data-nav]').forEach(function (btn) {
    btn.addEventListener('click', function () { scrollTo(btn.getAttribute('data-nav')); });
  });

  // ---------- HEADER: scroll state + active section ----------
  const header = document.getElementById('siteHeader');
  const sections = ['hero', 'about', 'portfolio', 'tiers', 'booking', 'links']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));

  function onScroll() {
    if (window.scrollY > 80) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');

    const probe = window.scrollY + 100;
    let active = sections[0] && sections[0].id;
    sections.forEach(function (sec) {
      if (sec.offsetTop <= probe) active = sec.id;
    });
    navLinks.forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('data-nav') === active);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- TOAST ----------
  const toastEl = document.getElementById('toast');
  let toastTimer = null;
  function showToast(message, opts) {
    opts = opts || {};
    if (toastTimer) clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.classList.toggle('is-error', !!opts.error);
    toastEl.hidden = false;
    void toastEl.offsetWidth;
    toastEl.classList.add('is-visible');
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-visible');
      setTimeout(function () { toastEl.hidden = true; }, 300);
    }, opts.duration || 4500);
  }

  // ---------- BOOKING FORM ----------
  const form = document.getElementById('bookingForm');
  const dict = function (key) {
    return (window.I18N[currentLang] && window.I18N[currentLang][key]) || key;
  };

  function setError(name, msg) {
    const input = form.querySelector('[name="' + name + '"]');
    if (!input) return;
    const field = input.closest('.form-field');
    const errEl = form.querySelector('[data-error-for="' + name + '"]');
    if (msg) {
      field.classList.add('has-error');
      if (errEl) errEl.textContent = msg;
    } else {
      field.classList.remove('has-error');
      if (errEl) errEl.textContent = '';
    }
  }

  function validate(data) {
    const errors = [];
    if (!data.name || data.name.trim().length < 2) {
      setError('name', dict('form.errorName'));
      errors.push('name');
    } else setError('name', '');
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setError('email', dict('form.errorEmail'));
      errors.push('email');
    } else setError('email', '');
    if (!data.projectType) {
      setError('projectType', dict('form.errorType'));
      errors.push('projectType');
    } else setError('projectType', '');
    if (!data.description || data.description.trim().length < 20) {
      setError('description', dict('form.errorDescription'));
      errors.push('description');
    } else setError('description', '');
    return errors;
  }

  function snapshotForm() {
    return Object.fromEntries(new FormData(form).entries());
  }
  function revalidateForm() {
    currentFormValues = snapshotForm();
    validate(currentFormValues);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const data = snapshotForm();
    currentFormValues = data;

    // Honeypot — if filled, silently drop (bot detection)
    if (data.website && data.website.trim() !== '') {
      // Pretend success so the bot doesn't try again
      showToast(dict('form.toastSuccess'), { duration: 4000 });
      form.reset();
      currentFormValues = null;
      return;
    }
    delete data.website; // don't send honeypot field

    const errors = validate(data);
    if (errors.length > 0) {
      showToast(dict('form.toastError'), { error: true });
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const label = submitBtn.querySelector('.btn-label');
    const spinner = submitBtn.querySelector('.btn-spinner');
    submitBtn.disabled = true;
    if (label) label.textContent = currentLang === 'ru' ? 'Отправка...' : 'Sending...';
    if (spinner) spinner.hidden = false;

    // ---------- Telegram via Google Apps Script ----------
    const GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwbDcIqYs9Dg--ALZecKCEG9D40HAqA8Oxbx2M4uLiXvgUsbbIKFaWp2g9T2LfkY_8c/exec';

    // Send as FormData with mode:'no-cors' (same pattern as in the working reference project)
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('company', data.company || '');
    formData.append('projectType', data.projectType);
    formData.append('budget', data.budget || '');
    formData.append('shootDate', data.shootDate || '');
    formData.append('location', data.location || '');
    formData.append('description', data.description);
    formData.append('lang', currentLang);

    fetch(GAS_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: formData
    })
    .then(function () {
      // With mode:'no-cors' we can't read the response, but if fetch resolved
      // without throwing, the request reached the server. Assume success.
      showToast(dict('form.toastSuccess'), { duration: 5000 });
      form.reset();
      currentFormValues = null;
    })
    .catch(function (err) {
      console.error('[booking] Error:', err);
      // Fallback to mailto: so the inquiry is never lost
      const KATE_EMAIL = 'hello@your-domain.com'; // ← change this as backup
      const subject = (currentLang === 'ru' ? 'Запрос на сотрудничество — ' : 'Collaboration inquiry — ') + (data.name || '');
      const bodyLines = [
        (currentLang === 'ru' ? 'Имя' : 'Name') + ': ' + data.name,
        'Email: ' + data.email,
        (currentLang === 'ru' ? 'Компания / Бренд' : 'Company / Brand') + ': ' + (data.company || '—'),
        (currentLang === 'ru' ? 'Тип проекта' : 'Project type') + ': ' + data.projectType,
        (currentLang === 'ru' ? 'Бюджет' : 'Budget') + ': ' + (data.budget || '—'),
        (currentLang === 'ru' ? 'Дата съёмки' : 'Shoot date') + ': ' + (data.shootDate || '—'),
        (currentLang === 'ru' ? 'Локация' : 'Location') + ': ' + (data.location || '—'),
        '',
        (currentLang === 'ru' ? 'О проекте' : 'About the project') + ':',
        data.description
      ];
      const mailtoUrl = 'mailto:' + KATE_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(bodyLines.join('\n'));
      window.location.href = mailtoUrl;
      showToast(dict('form.toastFallback'), { duration: 8000 });
    })
    .finally(function () {
      submitBtn.disabled = false;
      if (label) label.textContent = dict('form.submit');
      if (spinner) spinner.hidden = true;
    });
  });

  // Clear errors on input
  form.querySelectorAll('input, select, textarea').forEach(function (el) {
    el.addEventListener('input', function () {
      const field = el.closest('.form-field');
      if (field && field.classList.contains('has-error')) {
        field.classList.remove('has-error');
        const errEl = form.querySelector('[data-error-for="' + el.name + '"]');
        if (errEl) errEl.textContent = '';
      }
    });
  });

  // ---------- LANG SWITCH ----------
  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const lang = btn.getAttribute('data-lang');
      if (lang !== currentLang) applyLang(lang);
    });
  });

  // ---------- PORTFOLIO GALLERY (rising masonry, rAF-driven) ----------
  (function initGallery() {
    const stage = document.getElementById('galleryStage');
    if (!stage) return;

    // ---------- USER: list your gallery photos here ----------
    // Drop your files into assets/gallery/ and list them below.
    // 20–30 photos is the sweet spot. webp or jpg both work.
    const GALLERY_IMAGES = [
      'assets/gallery/photo-01.webp',
      'assets/gallery/photo-02.webp',
      'assets/gallery/photo-03.webp',
      'assets/gallery/photo-04.webp',
      'assets/gallery/photo-05.webp',
      'assets/gallery/photo-06.webp',
      'assets/gallery/photo-07.webp',
      'assets/gallery/photo-08.webp',
      'assets/gallery/photo-09.webp',
      'assets/gallery/photo-10.webp',
      'assets/gallery/photo-11.webp',
      'assets/gallery/photo-12.webp',
      'assets/gallery/photo-13.webp',
      'assets/gallery/photo-14.webp',
      'assets/gallery/photo-15.webp',
      'assets/gallery/photo-16.webp',
      'assets/gallery/photo-17.webp',
      'assets/gallery/photo-18.webp',
      'assets/gallery/photo-19.webp',
      'assets/gallery/photo-20.webp',
      'assets/gallery/photo-21.webp',
    ];

    const SIZE_CLASSES = ['gallery-card--sm', 'gallery-card--md', 'gallery-card--lg'];
    const SIZE_HEIGHTS = { 'gallery-card--sm': 200, 'gallery-card--md': 275, 'gallery-card--lg': 350 };

    const mqMobile = window.matchMedia('(max-width: 767px)');
    let isMobile = mqMobile.matches;

    // Read stage dims once, recompute on resize (debounced)
    function getStageDims() {
      return {
        w: stage.clientWidth,
        h: stage.clientHeight
      };
    }
    let stageDims = getStageDims();

    // Stable shuffle (deterministic per load, so layout doesn't jump)
    function seededShuffle(arr, seed) {
      const a = arr.slice();
      let s = seed;
      for (let i = a.length - 1; i > 0; i--) {
        s = (s * 9301 + 49297) % 233280;
        const j = Math.floor((s / 233280) * (i + 1));
        const t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    // Build card data
    const cardsData = GALLERY_IMAGES.map(function (src, i) {
      return {
        src: src,
        sizeClass: SIZE_CLASSES[i % SIZE_CLASSES.length],
        index: i
      };
    });
    const shuffled = seededShuffle(cardsData, 42);

    // Create DOM elements
    const cardEls = shuffled.map(function (card, i) {
      const el = document.createElement('div');
      el.className = 'gallery-card ' + card.sizeClass;
      const img = document.createElement('img');
      img.src = card.src;
      img.alt = 'Gallery photo ' + (card.index + 1);
      img.loading = 'lazy';
      el.appendChild(img);
      stage.appendChild(el);
      return el;
    });

    // ---------- DESKTOP: vertical rising via rAF ----------
    // Each card has: column (0..3), x-jitter, rotation, duration, phase offset.
    // Position is computed each frame as: y = lerp(startY, endY, progress)
    // Opacity fades at the very start (0–8%) and end (92–100%) of cycle.

    const COLS_DESKTOP = 4;

    const desktopCards = shuffled.map(function (card, i) {
      const col = i % COLS_DESKTOP;
      const colWidth = stageDims.w / COLS_DESKTOP;
      const baseX = col * colWidth + (colWidth / 2) - 100;
      // Use deterministic pseudo-random for stable layout
      const jitter = Math.sin(i * 7.3) * 30 - 15; // ±15–30 px
      const rotation = Math.sin(i * 3.7) * 2.5; // ±2.5deg
      const duration = 22000 + (i % 6) * 2000; // 22–32 sec per rise
      const phase = (i * 0.27) % 1; // staggered phase 0..1 — each card starts mid-cycle
      return {
        el: cardEls[i],
        x: baseX + jitter,
        rotation: rotation,
        duration: duration,
        phase: phase,
        startY: stageDims.h + 50, // below stage
        endY: -SIZE_HEIGHTS[card.sizeClass] - 50 // above stage
      };
    });

    // ---------- MOBILE: 2-column vertical rising (no overlap) ----------
    // On mobile, use 8 cards total (4 per column).
    // With 4 cards per column and 28s cycle → 7s gap between cards.
    // Card height ~150-212px + 30px gap = max ~242px.
    // In 7s, a card travels ~242px (242/7 ≈ 35px/s).
    // Stage height 380px / 35px per sec = ~11s for full traversal.
    // 11s traversal < 7s gap → cards NEVER overlap.
    const MOBILE_MAX_CARDS = 8;
    const MOBILE_DURATION = 28000; // 28s per cycle
    const mobileSource = shuffled.slice(0, MOBILE_MAX_CARDS);
    const mobileCards = mobileSource.map(function (card, i) {
      return {
        el: cardEls[i],
        sizeClass: card.sizeClass,
        duration: MOBILE_DURATION,
        phase: 0,
        col: 0,
        cardIndexInCol: 0
      };
    });

    const MOBILE_COLS = 2;
    function applyMobileLayout() {
      const stageW = stage.clientWidth;
      const colCounts = [0, 0];
      mobileCards.forEach(function (c, i) {
        c.col = i % MOBILE_COLS;
        c.cardIndexInCol = colCounts[c.col]++;
      });
      const perCol = [colCounts[0], colCounts[1]];
      mobileCards.forEach(function (c, i) {
        const w = c.el.offsetWidth;
        // Two cards per row, anchored to outer edges, overlapping at the middle.
        // Left column: card's left edge at 4px from stage left
        //   → its right edge extends into the right column by overlapShift px
        // Right column: card's right edge at 4px from stage right
        //   → its left edge extends into the left column by overlapShift px
        // Net effect: cards touch outer edges and overlap by 2×overlapShift at center.
        const edgeMargin = 4;
        const overlapShift = 4; // each column shifts 4px past center → 8px total overlap
        let baseX;
        if (c.col === 0) {
          // Anchored left: left edge at edgeMargin
          baseX = edgeMargin;
        } else {
          // Anchored right: right edge at stageW - edgeMargin
          baseX = stageW - w - edgeMargin;
        }
        c.x = baseX;
        // Evenly distribute phases within column
        c.phase = (c.cardIndexInCol / perCol[c.col]) % 1;
      });
    }

    // rAF loop
    let rafId = null;
    let lastTime = 0;
    let isVisible = true;

    function tick(now) {
      if (!isVisible) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      if (!lastTime) lastTime = now;
      const dt = now - lastTime;
      lastTime = now;

      if (isMobile) {
        // Mobile: 2-column vertical rising (no overlap)
        // Only first 12 cards are used on mobile; rest are hidden.
        const stageH = stageDims.h;
        mobileCards.forEach(function (c) {
          const t = ((now / c.duration) + c.phase) % 1;
          const cardH = c.el.offsetHeight;
          const startY = stageH + cardH + 20;
          const endY = -cardH - 20;
          const y = startY + (endY - startY) * t;
          let opacity = 1;
          if (t < 0.08) opacity = t / 0.08;
          else if (t > 0.92) opacity = (1 - t) / 0.08;
          c.el.style.transform = 'translate3d(' + c.x + 'px, ' + y + 'px, 0)';
          c.el.style.opacity = opacity;
          c.el.style.display = '';
        });
        // Hide cards beyond mobile set
        for (let i = mobileCards.length; i < cardEls.length; i++) {
          cardEls[i].style.display = 'none';
        }
      } else {
        // Desktop: make sure all cards are visible
        cardEls.forEach(function (el) { el.style.display = ''; });
        // Vertical rising
        desktopCards.forEach(function (c) {
          const t = ((now / c.duration) + c.phase) % 1;
          const y = c.startY + (c.endY - c.startY) * t;
          // Opacity: fade in/out at edges
          let opacity = 1;
          if (t < 0.08) opacity = t / 0.08;
          else if (t > 0.92) opacity = (1 - t) / 0.08;
          // Use translate3d only — pure GPU transform, no rotate (avoid compositor conflicts)
          // Rotation is applied via a child wrapper if needed; for now keep it pure translate
          c.el.style.transform = 'translate3d(' + c.x + 'px, ' + y + 'px, 0)';
          c.el.style.opacity = opacity;
        });
      }

      rafId = requestAnimationFrame(tick);
    }

    // Pause when tab is hidden (saves battery + avoids frame jumps)
    document.addEventListener('visibilitychange', function () {
      isVisible = !document.hidden;
      if (isVisible) lastTime = 0; // reset to avoid dt jump
    });

    // ---------- Resize handler: recompute layout on viewport change ----------
    let resizeTimer = null;
    function onResize() {
      const newIsMobile = mqMobile.matches;
      if (newIsMobile !== isMobile) {
        isMobile = newIsMobile;
      }
      stageDims = getStageDims();
      // Recompute desktop card positions
      desktopCards.forEach(function (c, i) {
        const col = i % COLS_DESKTOP;
        const colWidth = stageDims.w / COLS_DESKTOP;
        const baseX = col * colWidth + (colWidth / 2) - 100;
        const jitter = Math.sin(i * 7.3) * 30 - 15;
        c.x = baseX + jitter;
        c.startY = stageDims.h + 50;
      });
      if (isMobile) applyMobileLayout();
    }
    window.addEventListener('resize', function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(onResize, 150);
    });

    // Initial mobile layout if needed
    if (isMobile) applyMobileLayout();

    // Start animation loop
    rafId = requestAnimationFrame(tick);
  })();

  // ---------- INIT ----------
  applyLang(initialLang);

})();
