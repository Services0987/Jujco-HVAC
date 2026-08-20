/* JUJCO - Distinct, top-notch typography & kinetic animations (vanilla).
   Every title family gets its signature motion without visual glitches or layout shifts.
*/
(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  var isTouch = !window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function qsa(sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel));
  }
  function visible(els) {
    return els.filter(function (t) { return t.offsetParent !== null; });
  }

  function splitToChars(el) {
    if (el.dataset.jujcoSplit === 'chars') return el.querySelectorAll('.jujco-char');
    var nodes = Array.prototype.slice.call(el.childNodes);
    var frag = document.createDocumentFragment();
    nodes.forEach(function (node) {
      if (node.nodeType === 3) {
        var text = node.nodeValue;
        text.split(/(\s+)/).forEach(function (part) {
          if (part === '') return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            var word = document.createElement('span');
            word.className = 'jujco-word';
            word.style.display = 'inline-block';
            word.style.whiteSpace = 'nowrap';
            for (var i = 0; i < part.length; i++) {
              var s = document.createElement('span');
              s.className = 'jujco-char';
              s.textContent = part[i];
              word.appendChild(s);
            }
            frag.appendChild(word);
          }
        });
      } else if (node.nodeName === 'BR') frag.appendChild(document.createElement('br'));
      else frag.appendChild(node);
    });
    el.innerHTML = '';
    el.appendChild(frag);
    el.dataset.jujcoSplit = 'chars';
    return el.querySelectorAll('.jujco-char');
  }

  function splitToWords(el) {
    if (el.dataset.jujcoSplit === 'words') return el.querySelectorAll('.jujco-word');
    var text = el.textContent;
    el.innerHTML = '';
    text.split(/(\s+)/).forEach(function (w) {
      if (w === '') return;
      if (/^\s+$/.test(w)) { el.appendChild(document.createTextNode(w)); return; }
      var s = document.createElement('span');
      s.className = 'jujco-word';
      s.style.display = 'inline-block';
      s.textContent = w;
      el.appendChild(s);
    });
    el.dataset.jujcoSplit = 'words';
    return el.querySelectorAll('.jujco-word');
  }

  var KINETIC = [
    'translateY(28px)',
    'translateY(-28px)',
    'translateY(20px) scale(.92)',
    'translateY(-20px) scale(.92)'
  ];
  function kineticEntry(i) { return KINETIC[i % KINETIC.length]; }
  var KINETIC_RESET = 'translateY(0) scale(1)';

  function init() {
    var hero = visible(qsa('.cs_hero_title'));
    var allSection = visible(qsa('.cs_section_title')).filter(function (t) {
      return !t.closest('.cs_section_heading.cs_style_1') && !t.getAttribute('data-split');
    });
    var page = visible(qsa('.cs_page_title'));
    var cta = visible(qsa('.cs_cta_title'));

    var io = ('IntersectionObserver' in window)
      ? new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting && en.target._jujcoReveal) {
              en.target._jujcoReveal();
              io.unobserve(en.target);
            }
          });
        }, { threshold: 0.1, rootMargin: '0px 0px -4% 0px' })
      : null;

    function observe(el, revealFn) {
      el._jujcoReveal = revealFn;
      if (io) io.observe(el);
      else revealFn();
    }

    /* ---------- HERO TITLE ---------- */
    hero.forEach(function (t, hi) {
      var chars = splitToChars(t);
      chars.forEach(function (c, i) {
        c.style.display = 'inline-block';
        c.style.transition = 'transform .6s cubic-bezier(.2,.7,.2,1), opacity .6s ease';
        c.style.transitionDelay = (Math.min(i * 18, 400)) + 'ms';
        c.style.transform = kineticEntry(i + hi * 2);
        c.style.opacity = '0';
      });
      observe(t, function () {
        chars.forEach(function (c) {
          c.style.opacity = '1';
          c.style.transform = KINETIC_RESET;
        });
      });
    });

    /* ---------- SECTION TITLE ---------- */
    allSection.forEach(function (t, si) {
      var words = splitToWords(t);
      words.forEach(function (w, i) {
        w.style.display = 'inline-block';
        w.style.transition = 'transform .5s cubic-bezier(.2,.7,.2,1), opacity .5s ease';
        w.style.transitionDelay = (Math.min(i * 25, 300)) + 'ms';
        w.style.transform = 'translateY(16px)';
        w.style.opacity = '0';
      });
      observe(t, function () {
        words.forEach(function (w) {
          w.style.opacity = '1';
          w.style.transform = 'translateY(0)';
        });
      });
    });

    /* ---------- PAGE TITLE ---------- */
    page.forEach(function (t) {
      t.style.transition = 'opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1)';
      t.style.transform = 'translateY(18px)';
      t.style.opacity = '0';
      observe(t, function () {
        t.style.transform = 'translateY(0)';
        t.style.opacity = '1';
      });
    });

    /* ---------- CTA TITLE ---------- */
    cta.forEach(function (t) {
      var words = splitToWords(t);
      words.forEach(function (w, i) {
        w.style.display = 'inline-block';
        w.style.transition = 'transform .5s cubic-bezier(.2,.7,.2,1), opacity .5s ease';
        w.style.transitionDelay = (i * 30) + 'ms';
        w.style.transform = 'translateY(18px)';
        w.style.opacity = '0';
      });
      observe(t, function () {
        words.forEach(function (w) {
          w.style.opacity = '1';
          w.style.transform = 'translateY(0)';
        });
      });
    });

    initFx();
  }

  function initFx() {
    parallaxMouse();
    wipeReveal();
    bento();
    marquee();
  }

  function parallaxMouse() {
    if (isTouch) return;
    var layers = qsa('[data-parallax]');
    if (!layers.length) return;
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    window.addEventListener('mousemove', function (e) {
      tx = (e.clientX / window.innerWidth - 0.5);
      ty = (e.clientY / window.innerHeight - 0.5);
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    function apply() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      layers.forEach(function (l) {
        var d = parseFloat(l.getAttribute('data-parallax')) || 10;
        l.style.transform = 'translate3d(' + (cx * d).toFixed(1) + 'px,' + (cy * d).toFixed(1) + 'px,0)';
      });
      if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) raf = requestAnimationFrame(apply);
      else raf = null;
    }
  }

  function wipeReveal() {
    var els = qsa('.jujco-wipe');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('in-view'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
      });
    }, { threshold: 0.2 });
    els.forEach(function (e) { io.observe(e); });
  }

  function bento() {
    var items = qsa('.jujco-bento__item');
    if (!items.length) return;
    var overlay = document.getElementById('jujcoBentoOverlay');
    items.forEach(function (it) {
      it.addEventListener('click', function () {
        if (!overlay) return;
        var img = it.querySelector('img');
        if (img) overlay.querySelector('img').src = img.src;
        overlay.classList.add('is-open');
      });
    });
    if (overlay) overlay.addEventListener('click', function () { overlay.classList.remove('is-open'); });
  }

  function marquee() {
    qsa('.jujco-marquee__track').forEach(function (tr) {
      if (!tr.dataset.cloned) {
        tr.innerHTML = tr.innerHTML + tr.innerHTML;
        tr.dataset.cloned = 'true';
      }
    });
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
