/* JUJCO intro — runs immediately after the preloader markup (no jQuery). */
(function () {
  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js');

  if (window.__jujcoIntro) return;
  window.__jujcoIntro = true;

  var preloader = document.querySelector('.cs_preloader');
  if (!preloader) return;

  var html = document.documentElement;
  html.classList.add('cs_intro_lock');
  if (document.body) document.body.classList.add('cs_intro_lock');

  var reduce = false;
  try {
    reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  var cinematic = preloader.classList.contains('cs_preloader--cinematic');
  var done = false;
  var timers = [];

  function later(fn, ms) {
    timers.push(window.setTimeout(fn, ms));
  }

  function unlock() {
    html.classList.remove('cs_intro_lock');
    if (document.body) document.body.classList.remove('cs_intro_lock');
  }

  function finish() {
    if (done) return;
    done = true;
    timers.forEach(function (id) { window.clearTimeout(id); });
    preloader.classList.add('is-out');
    window.setTimeout(function () {
      if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
      unlock();
      try { document.dispatchEvent(new Event('jujco:intro-done')); } catch (err) {}
    }, 420);
  }

  if (reduce) {
    preloader.classList.add('is-title');
    later(finish, 450);
  } else if (cinematic) {
    later(function () { preloader.classList.add('is-title'); }, 1250);
    later(finish, 3050);
  } else {
    later(finish, 1250);
  }

  preloader.addEventListener('click', finish);
  preloader.addEventListener('touchstart', finish, { passive: true });
  later(finish, 5200);
})();
