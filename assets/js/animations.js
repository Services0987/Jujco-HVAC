/* =============================================================================
   JUJCO — animations.js
   Stable, high-performance vanilla controller for animations.css.
   Triggers: data-anim, data-split, data-type, data-count, data-tilt,
             data-spotlight, data-marquee, data-parallax-speed, [data-anim-live]
   Responsive across mobile, tablet, and desktop without jitter or glitches.
   ========================================================================== */
(function () {
  'use strict';

  var docEl = document.documentElement;
  docEl.classList.add('js');

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var isTouch = !window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function num(v, d) { var n = parseFloat(v); return isNaN(n) ? d : n; }

  /* ---------------------------------------------------------------- helpers */
  function applyAnimVars(el) {
    var d = el.getAttribute('data-anim-duration');
    var delay = el.getAttribute('data-anim-delay');
    var ease = el.getAttribute('data-anim-ease');
    if (d !== null) el.style.setProperty('--anim-duration', d + (/%$/.test(d) ? '' : 's'));
    if (delay !== null) el.style.setProperty('--anim-delay', delay + (/%$/.test(delay) ? '' : 's'));
    if (ease !== null) el.style.setProperty('--anim-ease', ease);
  }

  /* ----------------------------------------------------- scroll reveal core */
  var revealSel = '[data-anim], [data-split], .img-fade, .reveal-mask, .reveal-wipe, ' +
                  '.reveal-curtain, .reveal-circle, .reveal-diamond, .reveal-blind, .reveal-window';

  function initReveal() {
    var els = qsa(revealSel);
    if (!els.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) {
        el.classList.add('in');
        if (el.hasAttribute('data-split')) playSplit(el);
      });
      return;
    }

    /* Trigger once by default so content doesn't abruptly disappear when scrolling up/down */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var el = en.target;
        var once = el.getAttribute('data-anim-once') !== 'false';
        if (en.isIntersecting) {
          if (el.hasAttribute('data-anim')) applyAnimVars(el);
          el.classList.remove('out');
          el.classList.add('in');
          if (el.hasAttribute('data-split')) playSplit(el);
          if (once) io.unobserve(el);
        } else {
          if (once) return;
          el.classList.remove('in');
          el.classList.add('out');
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -4% 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------- split typography */
  var SPLIT_FX = {
    fade: 'unitFade', slide: 'unitSlide', scale: 'unitScale', rotate: 'unitRotate',
    flip: 'unitFlip', blur: 'unitBlur', glow: 'unitGlow', bounce: 'unitBounce'
  };

  var AUTO_SPLIT = [
    { sel: '.cs_service_card_title, .cs_card_title, .cs_post_title, .cs_team_title, .cs_project_title, .cs_price_title, .cs_award_title, .cs_feature_title, .cs_iconbox_title, .cs_testimonial_title, .cs_process_title',
      type: 'words', fx: ['slide', 'fade', 'scale', 'blur'] },
    { sel: '.jujco-stats__num', type: 'chars', fx: ['glow'], live: 'glow' },
    { sel: '.cs_faq_question, .cs_accordion_head, .cs_accordian_head, .cs_faq_head', type: 'words', fx: ['slide', 'fade'] },
    { sel: '.cs_section_subtitle, .cs_subtitle', type: 'words', fx: ['slide', 'fade'] }
  ];
  var _autoIdx = {};
  function autoIndex(key, len) { _autoIdx[key] = (_autoIdx[key] || 0); var i = _autoIdx[key] % len; _autoIdx[key]++; return i; }

  function wrapUnits(el, type) {
    if (el._wrappedUnits) return el._splitUnits || [];
    var text = el.textContent.trim();
    if (!text) return [];
    el.textContent = '';
    var units = [];
    if (type === 'chars') {
      text.split(/(\s+)/).forEach(function (tok) {
        if (tok === '') return;
        if (/^\s+$/.test(tok)) { el.appendChild(document.createTextNode(tok)); return; }
        var word = document.createElement('span');
        word.className = 'anim-word';
        word.style.display = 'inline-block';
        word.style.whiteSpace = 'nowrap';
        tok.split('').forEach(function (ch) {
          var s = document.createElement('span');
          s.className = 'anim-unit';
          s.textContent = ch;
          word.appendChild(s); units.push(s);
        });
        el.appendChild(word);
      });
    } else if (type === 'words' || type === 'lines') {
      text.split(/(\s+)/).forEach(function (w) {
        if (w === '') return;
        if (/^\s+$/.test(w)) { el.appendChild(document.createTextNode(w)); return; }
        var s = document.createElement('span');
        s.className = 'anim-unit anim-word';
        s.style.display = 'inline-block';
        s.textContent = w;
        el.appendChild(s); units.push(s);
      });
    }
    el._wrappedUnits = true;
    el._splitUnits = units;
    return units;
  }

  function playSplit(el) {
    var units = el._splitUnits;
    if (!units || !units.length) return;
    if (reduceMotion) { units.forEach(function (u) { u.style.opacity = 1; }); return; }

    var live = el.getAttribute('data-anim-live');
    if (live) {
      var LIVE_FX = {
        wave: 'charWave', jitter: 'charJitter', shake: 'charShake',
        glow: 'charGlow', flip: 'charFlip'
      };
      var liveFx = LIVE_FX[live] || 'charWave';
      var ldur = num(el.getAttribute('data-split-duration'), 1600);
      var lea = el.getAttribute('data-split-ease') || 'ease-in-out';
      var lstagger = num(el.getAttribute('data-split-stagger'), 40);
      var ldir = (live === 'glow') ? 'alternate infinite' : 'infinite';
      units.forEach(function (u, i) {
        u.style.opacity = 1;
        u.style.animation = liveFx + ' ' + ldur + 'ms ' + lea + ' ' + ldir;
        u.style.animationDelay = (i * lstagger) + 'ms';
      });
      return;
    }

    var fx = SPLIT_FX[el.getAttribute('data-split-effect') || 'fade'] || 'unitFade';
    var dur = num(el.getAttribute('data-split-duration'), 500);
    var stagger = Math.min(num(el.getAttribute('data-split-stagger'), 22), 25);
    var ease = el.getAttribute('data-split-ease') || 'cubic-bezier(0.22,0.61,0.36,1)';
    units.forEach(function (u, i) {
      u.style.animation = fx + ' ' + dur + 'ms ' + ease + ' both';
      u.style.animationDelay = (i * stagger) + 'ms';
    });
  }

  function initSplit() {
    qsa('[data-split]').forEach(function (el) {
      el._splitUnits = wrapUnits(el, el.getAttribute('data-split') || 'words');
    });

    AUTO_SPLIT.forEach(function (rule) {
      qsa(rule.sel).forEach(function (el) {
        if (el.hasAttribute('data-split') || el.hasAttribute('data-anim') || el.dataset.jujcoSplit) return;
        var fx = rule.fx[autoIndex(rule.sel, rule.fx.length)];
        el.setAttribute('data-split', rule.type);
        el.setAttribute('data-split-effect', fx);
        if (rule.live) el.setAttribute('data-anim-live', rule.live);
        el._splitUnits = wrapUnits(el, rule.type);
      });
    });
  }

  /* ----------------------------------------------------- typewriter */
  function initType() {
    qsa('[data-type]').forEach(function (el) {
      var text = el.getAttribute('data-type') || el.textContent;
      var speed = num(el.getAttribute('data-type-speed'), 45);
      var cursor = el.getAttribute('data-type-cursor') || '';
      var loop = el.getAttribute('data-type-loop') === 'true';
      if (reduceMotion) { el.textContent = text; return; }
      el.textContent = '';
      var cur = document.createElement('span');
      cur.className = 'type-cursor';
      cur.textContent = cursor;
      cur.style.cssText = 'display:inline-block;width:0.6em;animation:caretBlink 1s steps(1) infinite;';
      var i = 0;
      function tick() {
        if (i <= text.length) {
          el.textContent = text.slice(0, i);
          el.appendChild(cur);
          i++;
          setTimeout(tick, speed + Math.random() * speed * 0.3);
        } else if (loop) {
          setTimeout(function () {
            var j = text.length;
            function back() {
              if (j >= 0) { el.textContent = text.slice(0, j); el.appendChild(cur); j--; setTimeout(back, speed * 0.5); }
              else { i = 0; tick(); }
            }
            back();
          }, 1500);
        }
      }
      tick();
    });
  }

  /* ----------------------------------------------------- counters */
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function initCounters() {
    qsa('[data-count-to]').forEach(function (el) {
      var to = num(el.getAttribute('data-count-to'), 0);
      var from = num(el.getAttribute('data-count-from'), 0);
      var dur = num(el.getAttribute('data-count-duration'), 1600);
      var pre = el.getAttribute('data-count-prefix') || '';
      var suf = el.getAttribute('data-count-suffix') || '';
      var dec = num(el.getAttribute('data-count-decimals'), 0);
      function fmt(v) {
        return pre + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString()) + suf;
      }
      if (reduceMotion) { el.textContent = fmt(to); return; }
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        el.textContent = fmt(from + (to - from) * easeOutCubic(p));
        if (p < 1) requestAnimationFrame(step);
      }
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) { requestAnimationFrame(step); io.unobserve(e.target); } });
        }, { threshold: 0.4 });
        io.observe(el);
      } else { requestAnimationFrame(step); }
    });
  }

  /* ----------------------------------------------------- mouse tilt (Desktop only) */
  function initTilt() {
    if (reduceMotion || isTouch) return;
    qsa('[data-tilt]').forEach(function (el) {
      var max = num(el.getAttribute('data-tilt-max'), 8);
      var scale = num(el.getAttribute('data-tilt-scale'), 1.02);
      el.style.transformStyle = 'preserve-3d';
      el.style.transition = 'transform 0.18s ease-out';
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateY(' + (px * max) + 'deg) rotateX(' + (-py * max) + 'deg) scale(' + scale + ')';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ----------------------------------------------------- magnetic buttons */
  function initMagnetic() {
    if (reduceMotion || isTouch) return;
    qsa('.cs_btn, .cs_emergency_btn').forEach(function (el) {
      var strength = num(el.getAttribute('data-magnetic'), 0.25);
      el.style.transition = el.style.transition || 'transform 0.2s ease-out';
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - (r.left + r.width / 2);
        var my = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (mx * strength) + 'px,' + (my * strength) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ----------------------------------------------------- spotlight */
  function initSpotlight() {
    if (reduceMotion || isTouch) return;
    qsa('[data-spotlight]').forEach(function (el) {
      el.style.position = el.style.position || 'relative';
      var glow = document.createElement('span');
      glow.style.cssText = 'position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .3s;' +
        'background:radial-gradient(220px circle at var(--mx,50%) var(--my,50%), rgba(239,27,29,0.18), transparent 60%);';
      el.appendChild(glow);
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
        glow.style.opacity = '1';
      });
      el.addEventListener('mouseleave', function () { glow.style.opacity = '0'; });
    });
  }

  /* ----------------------------------------------------- marquee */
  function initMarquee() {
    qsa('[data-marquee]').forEach(function (el) {
      if (el.querySelector('.marquee__track')) return;
      var track = document.createElement('div');
      track.className = 'marquee__track';
      track.innerHTML = el.innerHTML;
      el.innerHTML = '';
      el.classList.add('marquee');
      el.appendChild(track.cloneNode(true));
      el.appendChild(track);
    });
  }

  /* ----------------------------------------------------- scroll parallax */
  function initParallax() {
    if (reduceMotion || isTouch) return;
    var els = qsa('[data-parallax-speed]');
    if (!els.length) return;
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var prog = (r.top + r.height / 2 - vh / 2) / vh;
        var sp = num(el.getAttribute('data-parallax-speed'), 0.12);
        var axis = el.getAttribute('data-parallax-axis') || 'y';
        var val = (prog * sp * 80).toFixed(1) + 'px';
        el.style.transform = axis === 'x' ? 'translateX(' + val + ')' : 'translateY(' + val + ')';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ----------------------------------------------------- image reveals */
  function initImageReveals() {
    if (reduceMotion) return;
    var IMG_FX = ['scale-in', 'zoom-in', 'pop-in', 'fade-up', 'rise-up'];
    var groups = [
      '.cs_team_member_thumb img',
      '.cs_post_thumb img',
      '.cs_service_details img',
      '.jujco-imgstrip__item img'
    ];
    var idx = 0;
    groups.forEach(function (sel) {
      qsa(sel).forEach(function (img) {
        if (img.hasAttribute('data-anim') || img.hasAttribute('data-split')) return;
        img.setAttribute('data-anim', IMG_FX[idx % IMG_FX.length]);
        idx++;
      });
    });
  }

  /* ----------------------------------------------------- scroll progress bar */
  function initProgress() {
    if (reduceMotion) return;
    if (document.querySelector('.jujco-scroll-progress')) return;
    var bar = document.createElement('div');
    bar.className = 'jujco-scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var ticking = false;
    function update() {
      var doc = document.documentElement;
      var max = (doc.scrollHeight - doc.clientHeight) || 1;
      var ratio = Math.min(Math.max(doc.scrollTop / max, 0), 1);
      bar.style.transform = 'scaleX(' + ratio + ')';
      ticking = false;
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  /* ----------------------------------------------------- live char effects */
  function initLive() {}

  /* ----------------------------------------------------- cursor glow (global) */
  function initCursorGlow() {
    var host = document.querySelector('[data-cursor-glow]');
    if (!host || reduceMotion || isTouch) return;
    var dot = document.createElement('div');
    dot.style.cssText = 'position:fixed;width:18px;height:18px;border-radius:50%;pointer-events:none;' +
      'background:rgba(239,27,29,0.35);transform:translate(-50%,-50%);z-index:9999;mix-blend-mode:screen;transition:opacity .3s;';
    document.body.appendChild(dot);
    var x = 0, y = 0, cx = 0, cy = 0, raf = null;
    window.addEventListener('mousemove', function (e) { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(loop); }, { passive: true });
    document.addEventListener('mouseleave', function () { dot.style.opacity = '0'; });
    document.addEventListener('mouseenter', function () { dot.style.opacity = '1'; });
    function loop() {
      cx += (x - cx) * 0.18; cy += (y - cy) * 0.18;
      dot.style.left = cx + 'px'; dot.style.top = cy + 'px';
      if (Math.abs(x - cx) > 0.5 || Math.abs(y - cy) > 0.5) raf = requestAnimationFrame(loop);
      else raf = null;
    }
  }

  /* ----------------------------------------------------- site-wide randomiser */
  function randomiseAllEffects() {
    if (reduceMotion) return;
    var isSmall = window.innerWidth < 992;
    var SAFE_FX = isSmall
      ? ['fade-up', 'scale-in', 'zoom-in', 'pop-in', 'fade-in', 'rise-up', 'blur-in']
      : ['fade-up', 'fade-down', 'scale-in', 'zoom-in', 'rotate-in', 'pop-in', 'blur-in', 'drop-in', 'rise-up', 'float-in'];

    qsa('[data-anim]').forEach(function(el){
      if (!el.getAttribute('data-anim') || el.getAttribute('data-anim') === 'random') {
        var effect = SAFE_FX[Math.floor(Math.random() * SAFE_FX.length)];
        el.setAttribute('data-anim', effect);
      }
      if (!el.hasAttribute('data-anim-duration'))
        el.setAttribute('data-anim-duration', '0.6s');
      if (!el.hasAttribute('data-anim-delay'))
        el.setAttribute('data-anim-delay', (Math.random() * 0.25).toFixed(2) + 's');
    });

    qsa('.cs_section_heading.cs_style_1 .cs_section_title').forEach(function(el){
      if (el.hasAttribute('data-anim') || el.hasAttribute('data-split') || el.dataset.jujcoSplit) return;
      el.setAttribute('data-anim', 'fade-up');
      el.setAttribute('data-anim-duration', '0.65s');
    });

    if (!isTouch) {
      qsa('.cs_service_card, .cs_post, .cs_team, .cs_project, .cs_price, .cs_award, .cs_feature, .cs_iconbox, .cs_testimonial, .cs_process, .cs_card').forEach(function(el){
        if (el.hasAttribute('data-tilt')) return;
        el.setAttribute('data-tilt', '');
        el.setAttribute('data-tilt-max', '6');
      });
    }
  }

  /* ----------------------------------------------------- bootstrap */
  function init() {
    randomiseAllEffects();
    initImageReveals();
    initSplit();
    initReveal();
    initType();
    initCounters();
    initTilt();
    initMagnetic();
    initSpotlight();
    initMarquee();
    initParallax();
    initProgress();
    initLive();
    initCursorGlow();
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

/* caret blink keyframe injected so typewriter works without extra CSS */
(function () {
  if (document.getElementById('jujco-caret-kf')) return;
  var s = document.createElement('style');
  s.id = 'jujco-caret-kf';
  s.textContent = '@keyframes caretBlink{0%,100%{opacity:1}50%{opacity:0}}';
  document.head.appendChild(s);
})();
