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
    // Cookie exists — keep gate hidden, unlock body
    ageGate.hidden = true;
    document.body.classList.remove('age-locked');
  } else {
    // No cookie — show gate, lock body until user confirms
    ageGate.hidden = false;
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

  // ---------- PORTFOLIO GALLERY ----------
  (function initGallery() {
    const stage = document.getElementById('galleryStage');
    const track = document.getElementById('galleryTrack');
    if (!stage || !track) return;

    let lastTime = 0;
    let startTime = 0;

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

    function seededShuffle(arr, seed) {
      const a = arr.slice();
      let s = seed || 1;
      for (let i = a.length - 1; i > 0; i--) {
        s = (s * 9301 + 49297) % 233280;
        const j = Math.floor((s / 233280) * (i + 1));
        const t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    const mqMobile = window.matchMedia('(max-width: 767px)');
    let isMobile = mqMobile.matches;
    let rafId = null;
    let isVisible = true;

    // ---------- DESKTOP: 7-slide vertical auto-slider ----------
    // 3 cards per slide, 3s hold + 0.6s transition, loop infinitely
    function initDesktop() {
      track.innerHTML = '';
      const DESKTOP_SLIDES = 7;
      const CARDS_PER_SLIDE = 3;
      const HOLD_MS = 3000;
      const TRANSITION_MS = 600;
      const TOTAL_SLIDE_MS = HOLD_MS + TRANSITION_MS;

      // Build 7 slides, each with 3 cards (shuffled)
      const slides = [];
      for (let s = 0; s < DESKTOP_SLIDES; s++) {
        const slide = document.createElement('div');
        slide.className = 'gallery-slide';
        const shuffled = seededShuffle(GALLERY_IMAGES, s * 17 + 1);
        for (let c = 0; c < CARDS_PER_SLIDE; c++) {
          const card = document.createElement('div');
          card.className = 'gallery-card';
          const img = document.createElement('img');
          img.src = shuffled[c];
          img.alt = 'Gallery photo ' + (c + 1);
          img.loading = 'lazy';
          card.appendChild(img);
          slide.appendChild(card);
        }
        track.appendChild(slide);
        slides.push(slide);
      }

      const slideHeight = stage.clientHeight;
      let startTime = 0;

      function tickDesktop(now) {
        if (!isVisible) { rafId = requestAnimationFrame(tickDesktop); return; }
        if (!startTime) startTime = now;
        const elapsed = now - startTime;
        const cyclePos = elapsed % (TOTAL_SLIDE_MS * DESKTOP_SLIDES);
        const slideIndex = Math.floor(cyclePos / TOTAL_SLIDE_MS);
        const withinSlide = cyclePos % TOTAL_SLIDE_MS;
        let offsetY;
        if (withinSlide < HOLD_MS) {
          // Hold on current slide
          offsetY = slideIndex * slideHeight;
        } else {
          // Transition: ease from current slide to next
          const progress = (withinSlide - HOLD_MS) / TRANSITION_MS;
          const eased = 0.5 - 0.5 * Math.cos(Math.PI * progress); // smoothstep
          const from = slideIndex * slideHeight;
          const to = (slideIndex + 1) * slideHeight;
          offsetY = from + (to - from) * eased;
        }
        track.style.transform = 'translate3d(0, ' + (-offsetY) + 'px, 0)';
        rafId = requestAnimationFrame(tickDesktop);
      }
      rafId = requestAnimationFrame(tickDesktop);
    }

    // ---------- MOBILE: 2-block scrolling grid, 2×10 per block ----------
    function initMobile() {
      track.innerHTML = '';
      const MOBILE_BLOCKS = 2;
      const CARDS_PER_BLOCK = 20; // 2 cols × 10 rows

      const blocks = [];
      for (let b = 0; b < MOBILE_BLOCKS; b++) {
        const block = document.createElement('div');
        block.className = 'gallery-block';
        const shuffled = seededShuffle(GALLERY_IMAGES, b * 31 + 5);
        for (let c = 0; c < CARDS_PER_BLOCK; c++) {
          const card = document.createElement('div');
          card.className = 'gallery-card';
          const img = document.createElement('img');
          img.src = shuffled[c % shuffled.length];
          img.alt = 'Gallery photo ' + (c + 1);
          img.loading = 'lazy';
          card.appendChild(img);
          block.appendChild(card);
        }
        track.appendChild(block);
        blocks.push(block);
      }

      let offsetY = 0;
      let lastTime = 0;
      const SPEED = 35; // px per second
      let nextSeed = 100;

      function rebuildBlock(block) {
        nextSeed += 1;
        const shuffled = seededShuffle(GALLERY_IMAGES, nextSeed);
        const cards = block.querySelectorAll('.gallery-card');
        cards.forEach(function (card, i) {
          const img = card.querySelector('img');
          if (img) img.src = shuffled[i % shuffled.length];
        });
      }

      function tickMobile(now) {
        if (!isVisible) { rafId = requestAnimationFrame(tickMobile); return; }
        if (!lastTime) lastTime = now;
        const dt = (now - lastTime) / 1000;
        lastTime = now;

        offsetY += SPEED * dt;
        const blockHeight = blocks[0].offsetHeight;

        if (offsetY >= blockHeight) {
          // Block 0 (top) is off-screen. Rebuild it, swap order.
          rebuildBlock(blocks[0]);
          offsetY -= blockHeight;
          // Swap: move block[0] to end
          track.appendChild(blocks[0]);
          // Rotate array
          blocks.push(blocks.shift());
        }

        track.style.transform = 'translate3d(0, ' + (-offsetY) + 'px, 0)';
        rafId = requestAnimationFrame(tickMobile);
      }
      rafId = requestAnimationFrame(tickMobile);
    }

    // ---------- Init based on viewport ----------
    function init() {
      if (rafId) cancelAnimationFrame(rafId);
      isMobile = mqMobile.matches;
      if (isMobile) {
        initMobile();
      } else {
        initDesktop();
      }
    }
    init();

    // ---------- Pause when tab hidden ----------
    document.addEventListener('visibilitychange', function () {
      isVisible = !document.hidden;
      if (isVisible) {
        lastTime = 0;
        startTime = 0;
      }
    });

    // ---------- Resize: re-init on breakpoint change ----------
    let resizeTimer = null;
    window.addEventListener('resize', function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        const newIsMobile = mqMobile.matches;
        if (newIsMobile !== isMobile) {
          init();
        }
      }, 200);
    });
  })();


  // ---------- INIT ----------
  applyLang(initialLang);

})();
