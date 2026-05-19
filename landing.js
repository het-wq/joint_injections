/* ============================================================
   LANDING.JS — Get Joint Injections Landing Page
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ── Facebook Pixel: ViewContent ──────────────────────────
     if (typeof fbq !== 'undefined') { fbq('track', 'ViewContent'); }
  ────────────────────────────────────────────────────────── */

  // ── Header scroll shadow ──────────────────────────────────
  var header = document.getElementById('siteHeader');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 24);
    updateSticky();
  }
  window.addEventListener('scroll', onScroll, { passive: true });


  // ── Smooth-scroll for all [data-scroll] buttons ───────────
  document.querySelectorAll('[data-scroll]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      var id     = el.getAttribute('data-scroll');
      var target = document.getElementById(id);
      if (!target) return;
      var offset = (header ? header.offsetHeight : 70) + 16;
      var top    = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });


  // ── Sticky mobile CTA ─────────────────────────────────────
  var stickyCta  = document.getElementById('stickyCta');
  var quizSec    = document.getElementById('quiz');
  var quizFormEl = document.getElementById('quizForm');
  var quizTyEl   = document.getElementById('quizTy');

  function updateSticky() {
    if (!stickyCta) return;
    var inForm  = quizFormEl && quizFormEl.classList.contains('active');
    var inTy    = quizTyEl   && quizTyEl.classList.contains('active');
    var inQuiz  = false;
    if (quizSec) {
      var r = quizSec.getBoundingClientRect();
      inQuiz = r.top <= window.innerHeight && r.bottom >= 0;
    }
    var show = window.scrollY > 320 && !inForm && !inTy && !inQuiz;
    stickyCta.classList.toggle('show', show);
  }


  // ── FAQ accordion ─────────────────────────────────────────
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item   = btn.closest('.faq-item');
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (el) {
        el.classList.remove('open');
      });
      if (!isOpen) item.classList.add('open');
    });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
    });
  });


  // ── QUIZ LOGIC ────────────────────────────────────────────
  var step      = 1;
  var totalStep = 7;
  var multiQ    = [2, 3, 5];   // question indices that allow multi-select

  var data = {
    score: 0,
    answers: {},
    flags: {
      isHot: false, hasMedicare: false, isQualified: false,
      isNurture: false, isIdeal: false, hasObjection: false, hasTried: false
    }
  };

  function isMulti(n) { return multiQ.indexOf(n) !== -1; }

  // Update progress bar
  function setProgress(n) {
    var pct = Math.round(((n - 1) / totalStep) * 100);
    var fill = document.getElementById('quizFill');
    var pctEl = document.getElementById('quizPct');
    var curEl = document.getElementById('quizCur');
    if (fill)  fill.style.width  = pct + '%';
    if (pctEl) pctEl.textContent = pct;
    if (curEl) curEl.textContent = n;
  }

  // Show a step
  function goTo(n) {
    document.querySelectorAll('.quiz-step').forEach(function (el) {
      el.classList.remove('active');
    });
    var el = document.getElementById('qs' + n);
    if (el) el.classList.add('active');

    var backBtn = document.getElementById('btnBack');
    var nextBtn = document.getElementById('btnNext');
    if (backBtn) backBtn.disabled = n === 1;
    if (nextBtn) {
      nextBtn.innerHTML = n === totalStep
        ? 'See My Results <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'
        : 'Next <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    }
    setProgress(n);
    step = n;
  }

  // Option click handlers
  document.querySelectorAll('.quiz-step').forEach(function (stepEl) {
    var n     = parseInt(stepEl.getAttribute('data-step'));
    var multi = isMulti(n);
    stepEl.querySelectorAll('.opt').forEach(function (opt) {
      opt.addEventListener('click', function () {
        if (multi) {
          opt.classList.toggle('sel');
        } else {
          stepEl.querySelectorAll('.opt').forEach(function (o) { o.classList.remove('sel'); });
          opt.classList.add('sel');
        }
      });
    });
  });

  // Next
  var btnNext = document.getElementById('btnNext');
  if (btnNext) {
    btnNext.addEventListener('click', function () {
      var stepEl  = document.getElementById('qs' + step);
      var chosen  = stepEl ? stepEl.querySelectorAll('.opt.sel') : [];
      if (!chosen.length) { shake(stepEl); return; }

      // Save answers and accumulate score / flags
      data.answers['q' + step] = [];
      chosen.forEach(function (o) {
        data.answers['q' + step].push(o.dataset.val);
        data.score += parseInt(o.dataset.score || 0);
        if (o.dataset.hot      === 'true') data.flags.isHot       = true;
        if (o.dataset.ideal    === 'true') data.flags.isIdeal      = true;
        if (o.dataset.medicare === 'true') data.flags.hasMedicare  = true;
        if (o.dataset.qual     === 'true') data.flags.isQualified  = true;
        if (o.dataset.nurture  === 'true') data.flags.isNurture    = true;
        if (o.dataset.obj      === 'true') data.flags.hasObjection = true;
        if (o.dataset.tried    === 'true') data.flags.hasTried     = true;
      });

      if (step < totalStep) {
        goTo(step + 1);
      } else {
        showResults();
      }
    });
  }

  // Back
  var btnBack = document.getElementById('btnBack');
  if (btnBack) {
    btnBack.addEventListener('click', function () {
      if (step <= 1) return;
      // Subtract previous step scores before going back
      var prevEl = document.getElementById('qs' + step);
      if (prevEl && data.answers['q' + step]) {
        prevEl.querySelectorAll('.opt.sel').forEach(function (o) {
          data.score = Math.max(0, data.score - parseInt(o.dataset.score || 0));
          o.classList.remove('sel');
        });
        delete data.answers['q' + step];
      }
      goTo(step - 1);
    });
  }

  // Shake animation for no-selection
  function shake(el) {
    if (!el) return;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'shakeX .4s ease';
  }

  // Show results
  function showResults() {
    // Hide steps and nav
    document.querySelectorAll('.quiz-step').forEach(function (el) {
      el.classList.remove('active');
    });
    var nav = document.getElementById('quizNav');
    if (nav) nav.style.display = 'none';

    // Progress to 100%
    var fill  = document.getElementById('quizFill');
    var pctEl = document.getElementById('quizPct');
    var curEl = document.getElementById('quizCur');
    if (fill)  fill.style.width  = '100%';
    if (pctEl) pctEl.textContent = '100';
    if (curEl) curEl.textContent = totalStep;

    /* Facebook Pixel: Quiz Complete
       if (typeof fbq !== 'undefined') {
         fbq('trackCustom', 'QuizComplete', { score: data.score });
       }
    */

    var qualified =
      data.score >= 5 ||
      data.flags.hasMedicare ||
      data.flags.isHot ||
      data.flags.isQualified;

    var showPartial = !qualified || data.flags.isNurture;

    var resQ = document.getElementById('resQualified');
    var resP = document.getElementById('resPartial');
    if (!showPartial && resQ) {
      resQ.classList.add('active');
    } else if (resP) {
      resP.classList.add('active');
    }
  }

  // Show contact form from results
  document.querySelectorAll('[data-show-form]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.quiz-result').forEach(function (el) {
        el.classList.remove('active');
      });
      var form = document.getElementById('quizForm');
      if (form) { form.classList.add('active'); updateSticky(); }
    });
  });

  // Lead form submit
  var leadForm = document.getElementById('leadForm');
  if (leadForm) {
    leadForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var payload = {
        firstName:   document.getElementById('firstName').value,
        lastName:    document.getElementById('lastName').value,
        phone:       document.getElementById('phone').value,
        email:       document.getElementById('email').value,
        zipCode:     document.getElementById('zipCode').value,
        contactTime: document.getElementById('contactTime').value,
        score:       data.score,
        answers:     data.answers,
        flags:       data.flags,
        source:      'lp-quiz',
        ts:          new Date().toISOString()
      };

      /* Facebook Pixel: Lead
         if (typeof fbq !== 'undefined') { fbq('track', 'Lead'); }
      */

      /* CRM / GHL Webhook — replace URL before going live
         fetch('YOUR_GHL_WEBHOOK_URL', {
           method:  'POST',
           headers: { 'Content-Type': 'application/json' },
           body:    JSON.stringify(payload)
         }).catch(function (err) { console.error('Webhook error', err); });
      */

      console.log('[Lead]', payload);

      var formEl = document.getElementById('quizForm');
      var tyEl   = document.getElementById('quizTy');
      if (formEl) formEl.classList.remove('active');
      if (tyEl)   { tyEl.classList.add('active'); updateSticky(); }

      // Scroll to top of quiz card
      if (quizSec) {
        var offset = (header ? header.offsetHeight : 70) + 16;
        window.scrollTo({
          top: quizSec.getBoundingClientRect().top + window.pageYOffset - offset,
          behavior: 'smooth'
        });
      }
    });
  }

  // Init
  goTo(1);

  // ── Intersection Observer for Scroll Animations ───────────
  var animateElements = document.querySelectorAll('.fade-up-element');
  if ('IntersectionObserver' in window && animateElements.length > 0) {
    var animObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    animateElements.forEach(function (el) {
      animObserver.observe(el);
    });
  } else {
    animateElements.forEach(function (el) {
      el.classList.add('animated');
    });
  }

  /* ─────────────────────────────────────────────────────────
     Shake keyframe (injected once via JS to avoid extra CSS)
  ───────────────────────────────────────────────────────── */
  var style = document.createElement('style');
  style.textContent =
    '@keyframes shakeX{0%,100%{transform:translateX(0)}' +
    '20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}';
  document.head.appendChild(style);

});
