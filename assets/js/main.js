(function ($) {
  'use strict';

  /*
  |--------------------------------------------------------------------------
  | Template Name: Arkdin
  | Author: JUJCO Heating & Cooling
  | Version: 1.0.1
  |--------------------------------------------------------------------------
  */

  $.exists = function (selector) {
    return $(selector).length > 0;
  };

  $(function () {
    // 1. Initialize preloader immediately on DOM ready (better than window load)
    initVideoPreloader();

    // 1b. Electrical vibes behind the spinning favicon preloader
    initElectricVibes();

    // 2. Initialize other scripts
    mainNav();
    stickyHeader();
    dynamicBackground();
    slickInit();
    modalVideo();
    accordian();
    tabs();
    progressBar();
    review();
    pageTransitions();

    if ($.exists('.wow')) {
      new WOW().init();
    }
    if ($.exists('.player')) {
      $('.player').YTPlayer();
    }
  });

  /*--------------------------------------------------------------
    1. Preloader (Advanced Video Support with 2X Speed & Conditional Display)
  --------------------------------------------------------------*/
  function initVideoPreloader() {
    var $preloader = $('.cs_preloader');
    if (!$preloader.length) return;

    // Check if this is a main page (where the video preloader should display)
    // Main pages: index.html, index-2.html, home-v2.html
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var isMainPage = /^(index\.html|index-2\.html|home-v2\.html)$/.test(currentPage);

    // Lock body scroll while any preloader is visible
    $('body').css('overflow', 'hidden');

    if (isMainPage) {
      var $video = $preloader.find('video');

      // Remove poster attribute for faster loading
      $video.removeAttr('poster');

      if ($video.length) {
        var video = $video[0];

        // CRITICAL: Force every possible attribute to bypass mobile autoplay restrictions
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('muted', '');
        video.playbackRate = 2.3;

        var hasHidden = false;
        var triggerHide = function () {
          if (!hasHidden) {
            hasHidden = true;
            hidePreloader();
          }
        };

        video.addEventListener('timeupdate', function () {
          // Because the video is playing at 2.3x speed, the timeupdate event (which fires ~every 250ms)
          // might skip over a small window. We widen the window to 1.0s to guarantee it catches
          // the end before the HTML loop attribute restarts the video.
          if (video.duration > 0 && video.currentTime >= video.duration - 1.0) {
            triggerHide();
          }
        });

        // Aggressively attempt to play
        var p = video.play();
        if (p !== undefined) {
          p.catch(function (e) {
            // If the browser absolutely blocks it (e.g. iOS Low Power Mode),
            // hide immediately so the user isn't stuck staring at a frozen frame.
            triggerHide();
          });
        }

        // Hard timeout fallback
        setTimeout(triggerHide, 6000);
      } else {
        // Fallback for non-video preloaders
        setTimeout(hidePreloader, 2000);
      }
    } else {
      // Non-main pages: show the spinning favicon preloader for exactly 1 second
      setTimeout(hidePreloader, 1000);
    }
  }

  function hidePreloader() {
    var $preloaderIn = $('.cs_preloader_in');
    var $preloader = $('.cs_preloader');

    // Stop the electrical-vibes animation loop as soon as the preloader begins hiding
    $(document).trigger('preloader:hidden');

    if ($preloaderIn.length) {
      $preloaderIn.delay(150).fadeOut('slow', function () {
        $preloader.fadeOut('slow', function () {
          $('body').css('overflow', ''); // Restore scrolling
        });
      });
    } else {
      $preloader.fadeOut('slow', function () {
        $('body').css('overflow', ''); // Restore scrolling
      });
    }
  }

  /*--------------------------------------------------------------
     1b. Electrical vibes behind the spinning favicon preloader
     Draws branching lightning bolts + sparks + a breathing energy
     core in the favicon's brand colors, only on spinner pages.
  --------------------------------------------------------------*/
  function initElectricVibes() {
    var $in = $('.cs_preloader_in');
    var $spinner = $('.cs_preloader_spinner');
    // Only run where the favicon actually spins (spinner pages)
    if (!$in.length || !$spinner.length) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'cs_electric_vibes';
    $in[0].insertBefore(canvas, $spinner[0]);
    $in.addClass('has-vibes');

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, cx = 0, cy = 0;

    function resize() {
      var r = $in[0].getBoundingClientRect();
      W = r.width || window.innerWidth;
      H = r.height || window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2;
      cy = H / 2;
    }
    resize();
    window.addEventListener('resize', resize);

    // Favicon brand palette: gold, blue, red (red kept rare).
    // Each bolt has a colored 'glow' (bloom) and a 'core' (white-hot center)
    // so the lightning pops beautifully against the pitch-black background.
    var palette = [
      { glow: 'rgba(255,199,38,', core: 'rgba(255,243,205,' }, // gold
      { glow: 'rgba(255,199,38,', core: 'rgba(255,243,205,' }, // gold (weighted)
      { glow: 'rgba(0,51,160,',   core: 'rgba(205,224,255,' }, // superman blue
      { glow: 'rgba(239,27,29,',  core: 'rgba(255,210,210,' }  // superman red (rare)
    ];

    var bolts = [];
    var nextBoltAt = 0;

    function rand(a, b) { return a + Math.random() * (b - a); }

    // Fractal midpoint-displacement path -> natural, chaotic lightning channel
    function buildBolt(x1, y1, x2, y2, disp, detail) {
      if (disp < detail) return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
      var dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
      var nx = -dy / len, ny = dx / len;
      var mx = (x1 + x2) / 2 + nx * (Math.random() - 0.5) * disp;
      var my = (y1 + y2) / 2 + ny * (Math.random() - 0.5) * disp;
      var L = buildBolt(x1, y1, mx, my, disp / 2, detail);
      var R = buildBolt(mx, my, x2, y2, disp / 2, detail);
      return L.concat(R.slice(1));
    }

    // Every bolt flows outward from the favicon at the center of the screen
    function makeBolt() {
      var a0 = rand(0, Math.PI * 2);
      var reach = Math.hypot(W, H) * rand(0.34, 0.6);
      var grand = Math.random() < 0.18;
      if (grand) reach *= 1.15;
      var sx = cx, sy = cy;
      var ex = sx + Math.cos(a0) * reach;
      var ey = sy + Math.sin(a0) * reach;
      var pts = buildBolt(sx, sy, ex, ey, reach * 0.2, 5);
      var pal = palette[Math.floor(Math.random() * palette.length)];
      var bolt = {
        pts: pts,
        branches: [],
        glow: pal.glow,
        core: pal.core,
        born: performance.now(),
        life: rand(480, 820),
        w: rand(1.4, 2.8),
        phase: rand(0, Math.PI * 2),
        inten: grand ? 1.15 : 1
      };
      // finer, dimmer fractal sub-branches that also fan outward
      var nb = Math.floor(rand(2, grand ? 5 : 4));
      for (var b = 0; b < nb; b++) {
        var bi = Math.floor(rand(Math.floor(pts.length * 0.25), pts.length - 1));
        var bp = pts[bi];
        var bdir = Math.atan2(bp.y - cy, bp.x - cx) + rand(-0.8, 0.8);
        var blen = reach * rand(0.16, 0.4);
        var bxp = bp.x + Math.cos(bdir) * blen;
        var byp = bp.y + Math.sin(bdir) * blen;
        bolt.branches.push({
          pts: buildBolt(bp.x, bp.y, bxp, byp, blen * 0.25, 5),
          inten: 0.55
        });
      }
      bolts.push(bolt);
      if (bolts.length > 16) bolts.shift();
    }

    // Returns the bolt polyline revealed up to fraction f (0..1) from the center
    function partialPath(pts, f) {
      if (f >= 1) return pts;
      var seglen = [], total = 0, l;
      for (var i = 0; i < pts.length - 1; i++) {
        l = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
        seglen.push(l); total += l;
      }
      var target = f * total, acc = 0;
      var out = [pts[0]];
      for (var j = 0; j < seglen.length; j++) {
        if (acc + seglen[j] <= target) {
          out.push(pts[j + 1]); acc += seglen[j];
        } else {
          var r = (target - acc) / seglen[j];
          out.push({
            x: pts[j].x + (pts[j + 1].x - pts[j].x) * r,
            y: pts[j].y + (pts[j + 1].y - pts[j].y) * r
          });
          break;
        }
      }
      return out;
    }

    function strokePath(pts) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }

    // Tapered bright core: width + intensity fade from trunk to tip
    function drawTaper(pts, color, aMax, wBase) {
      for (var i = 0; i < pts.length - 1; i++) {
        var t = i / (pts.length - 1);
        var w = Math.max(0.4, wBase * (1 - t) * 0.85 + 0.35);
        var a = aMax * (1 - t * 0.65);
        if (a <= 0.01) continue;
        ctx.strokeStyle = color + a + ')';
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
        ctx.stroke();
      }
    }

    var raf = 0;
    function frame(now) {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Tight, subtle halo behind the favicon so the backdrop stays pitch black
      var pulse = 0.5 + 0.5 * Math.sin(now / 620);
      var coreR = 44 + pulse * 16;
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.0);
      g.addColorStop(0, 'rgba(255,199,38,' + (0.09 + 0.06 * pulse) + ')');
      g.addColorStop(0.45, 'rgba(0,51,160,' + (0.045 + 0.035 * pulse) + ')');
      g.addColorStop(1, 'rgba(0,51,160,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 2.0, 0, Math.PI * 2);
      ctx.fill();

      // Lightning bolts: flow outward from center, soft bloom + tapered core
      for (var i = bolts.length - 1; i >= 0; i--) {
        var bo = bolts[i];
        var age = now - bo.born;
        if (age > bo.life) { bolts.splice(i, 1); continue; }
        var env = age < bo.life * 0.12
          ? age / (bo.life * 0.12)
          : 1 - (age - bo.life * 0.12) / (bo.life * 0.88);
        env = Math.max(0, Math.min(1, env));
        // progressive outward reveal (center -> tip)
        var f = age < bo.life * 0.22 ? age / (bo.life * 0.22) : 1;
        var flick = 0.82 + 0.18 * Math.sin(now * 0.045 + bo.phase);
        var mul = bo.inten * flick;
        var mainPts = f < 1 ? partialPath(bo.pts, f) : bo.pts;

        // soft bloom
        ctx.strokeStyle = bo.glow + (env * 0.26 * mul) + ')';
        ctx.lineWidth = bo.w * 2.8;
        ctx.shadowColor = bo.glow + '0.9)';
        ctx.shadowBlur = 18;
        strokePath(mainPts);
        ctx.shadowBlur = 0;

        // bright tapered core
        drawTaper(mainPts, bo.core, env * 0.95 * mul, bo.w);

        // sub-branches appear once the main channel has struck outward
        if (f >= 1) {
          for (var br = 0; br < bo.branches.length; br++) {
            var bint = bo.branches[br].inten;
            ctx.strokeStyle = bo.glow + (env * 0.16 * mul * bint) + ')';
            ctx.lineWidth = bo.w * 1.6;
            ctx.shadowColor = bo.glow + '0.9)';
            ctx.shadowBlur = 12;
            strokePath(bo.branches[br].pts);
            ctx.shadowBlur = 0;
            drawTaper(bo.branches[br].pts, bo.core, env * 0.7 * mul * bint, bo.w * 0.6);
          }
        }
      }
      ctx.shadowBlur = 0;

      ctx.globalCompositeOperation = 'source-over';

      if (now >= nextBoltAt) {
        // several bolts burst outward from the center at once
        var burst = 2 + Math.floor(Math.random() * 2);
        for (var fb = 0; fb < burst; fb++) makeBolt();
        nextBoltAt = now + rand(90, 300);
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    $(document).one('preloader:hidden', function () {
      cancelAnimationFrame(raf);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      $in.removeClass('has-vibes');
    });
  }

  /*--------------------------------------------------------------
     2. Mobile Menu
  --------------------------------------------------------------*/
  function mainNav() {
    $('.cs_nav').append('<span class="cs_menu_toggle"><span></span></span>');
    $('.menu-item-has-children').append(
      '<span class="cs_menu_dropdown_toggle"><span></span></span>',
    );
    $('.cs_menu_toggle').on('click', function () {
      $(this)
        .toggleClass('cs_toggle_active')
        .siblings('.cs_nav_list')
        .toggleClass('cs_active');
    });
    $('.cs_menu_toggle')
      .parents('body')
      .find('.cs_side_header')
      .addClass('cs_has_main_nav');
    $('.cs_menu_toggle')
      .parents('body')
      .find('.cs_toolbox')
      .addClass('cs_has_main_nav');
    $('.cs_menu_dropdown_toggle').on('click', function () {
      $(this).toggleClass('active').siblings('ul').slideToggle();
      $(this).parent().toggleClass('active');
    });
  }

  /*--------------------------------------------------------------
    3. Sticky Header
  --------------------------------------------------------------*/
  function stickyHeader() {
    var $window = $(window);
    var lastScrollTop = 0;
    var $header = $('.cs_sticky_header');
    var headerHeight = $header.outerHeight() + 20;

    $window.scroll(function () {
      var windowTop = $window.scrollTop();

      if (windowTop >= headerHeight) {
        $header.addClass('cs_gescout_sticky');
      } else {
        $header.removeClass('cs_gescout_sticky');
        $header.removeClass('cs_gescout_show');
      }

      if ($header.hasClass('cs_gescout_sticky')) {
        if (windowTop < lastScrollTop) {
          $header.addClass('cs_gescout_show');
        } else {
          $header.removeClass('cs_gescout_show');
        }
      }
      lastScrollTop = windowTop;
    });
  }

  /*--------------------------------------------------------------
    4. Dynamic Background
  --------------------------------------------------------------*/
  function dynamicBackground() {
    $('[data-src]').each(function () {
      var src = $(this).attr('data-src');
      $(this).css({
        'background-image': 'url(' + src + ')',
      });
    });
  }

  /*--------------------------------------------------------------
    5. Slick Slider
  --------------------------------------------------------------*/
  function slickInit() {
    if ($.exists('.cs_slider')) {
      $('.cs_slider').each(function () {
        var $ts = $(this).find('.cs_slider_container');
        var $slickActive = $(this).find('.cs_slider_wrapper');
        var autoPlayVar = parseInt($ts.attr('data-autoplay'), 10);
        var autoplaySpdVar = 3000;
        if (autoPlayVar > 1) {
          autoplaySpdVar = autoPlayVar;
          autoPlayVar = 1;
        }
        var speedVar = parseInt($ts.attr('data-speed'), 10);
        var loopVar = Boolean(parseInt($ts.attr('data-loop'), 10));
        var centerVar = Boolean(parseInt($ts.attr('data-center'), 10));
        var variableWidthVar = Boolean(
          parseInt($ts.attr('data-variable-width'), 10),
        );
        var paginaiton = $(this)
          .find('.cs_pagination')
          .hasClass('cs_pagination');
        var slidesPerView = $ts.attr('data-slides-per-view');
        if (slidesPerView == 1) {
          slidesPerView = 1;
        }
        if (slidesPerView == 'responsive') {
          var slidesPerView = parseInt($ts.attr('data-add-slides'), 10);
          var lgPoint = parseInt($ts.attr('data-lg-slides'), 10);
          var mdPoint = parseInt($ts.attr('data-md-slides'), 10);
          var smPoint = parseInt($ts.attr('data-sm-slides'), 10);
          var xsPoing = parseInt($ts.attr('data-xs-slides'), 10);
        }
        var fadeVar = parseInt($($ts).attr('data-fade-slide'));
        fadeVar === 1 ? (fadeVar = true) : (fadeVar = false);

        $slickActive.slick({
          autoplay: autoPlayVar,
          dots: paginaiton,
          centerPadding: '28%',
          speed: speedVar,
          infinite: loopVar,
          autoplaySpeed: autoplaySpdVar,
          centerMode: centerVar,
          fade: fadeVar,
          prevArrow: $(this).find('.cs_left_arrow'),
          nextArrow: $(this).find('.cs_right_arrow'),
          appendDots: $(this).find('.cs_pagination'),
          slidesToShow: slidesPerView,
          variableWidth: variableWidthVar,
          swipeToSlide: true,
          responsive: [
            { breakpoint: 1200, settings: { slidesToShow: lgPoint } },
            { breakpoint: 992, settings: { slidesToShow: mdPoint } },
            { breakpoint: 768, settings: { slidesToShow: smPoint } },
            { breakpoint: 576, settings: { slidesToShow: xsPoing } },
          ],
        });
      });
    }
    $('.cs_service_product_thumb').slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
      asNavFor: '.cs_service_product_nav',
      appendDots: $('.cs_pagination_2'),
    });

    $('.cs_service_product_nav').slick({
      slidesToShow: 4,
      slidesToScroll: 1,
      asNavFor: '.cs_service_product_thumb',
      focusOnSelect: true,
      prevArrow: $('.cs_service_product_nav_left_arrow'),
      nextArrow: $('.cs_service_product_nav_right_arrow'),
      responsive: [
        { breakpoint: 1400, settings: { slidesToShow: 4 } },
        { breakpoint: 1199, settings: { slidesToShow: 3 } },
        { breakpoint: 991, settings: { slidesToShow: 2 } },
        { breakpoint: 575, settings: { slidesToShow: 1 } },
      ],
    });
  }

  /*--------------------------------------------------------------
    6. Modal Video
  --------------------------------------------------------------*/
  function modalVideo() {
    if ($.exists('.cs_video_open')) {
      $('body').append(`
        <div class="cs_video_popup">
          <div class="cs_video_popup-overlay"></div>
          <div class="cs_video_popup-content">
            <div class="cs_video_popup-layer"></div>
            <div class="cs_video_popup-container">
              <div class="cs_video_popup-align">
                <div class="embed-responsive embed-responsive-16by9">
                  <iframe class="embed-responsive-item" src="about:blank"></iframe>
                </div>
              </div>
              <div class="cs_video_popup-close"></div>
            </div>
          </div>
        </div>
      `);
      $(document).on('click', '.cs_video_open', function (e) {
        e.preventDefault();
        var video = $(this).attr('href');
        $('.cs_video_popup-container iframe').attr('src', `${video}`);
        $('.cs_video_popup').addClass('active');
      });
      $('.cs_video_popup-close, .cs_video_popup-layer').on(
        'click',
        function (e) {
          $('.cs_video_popup').removeClass('active');
          $('html').removeClass('overflow-hidden');
          $('.cs_video_popup-container iframe').attr('src', 'about:blank');
          e.preventDefault();
        },
      );
    }
  }

  /*--------------------------------------------------------------
    7. Accordian
  --------------------------------------------------------------*/
  function accordian() {
    $('.cs_accordian').children('.cs_accordian_body').hide();
    $('.cs_accordian.active').children('.cs_accordian_body').show();
    $('.cs_accordian_head').on('click', function () {
      $(this)
        .parent('.cs_accordian')
        .siblings()
        .children('.cs_accordian_body')
        .slideUp(250);
      $(this).siblings().slideDown(250);
      $(this)
        .parent()
        .parent()
        .siblings()
        .find('.cs_accordian_body')
        .slideUp(250);
      $(this).parents('.cs_accordian').addClass('active');
      $(this).parent('.cs_accordian').siblings().removeClass('active');
    });
  }

  /*--------------------------------------------------------------
    8. Tabs
  --------------------------------------------------------------*/
  function tabs() {
    $('.cs_tabs .cs_tab_links a').on('click', function (e) {
      var currentAttrValue = $(this).attr('href');
      $('.cs_tabs ' + currentAttrValue)
        .fadeIn(400)
        .siblings()
        .hide();
      $(this).parents('li').addClass('active').siblings().removeClass('active');
      e.preventDefault();
    });
  }

  /*--------------------------------------------------------------
    9. Progress Bar
  --------------------------------------------------------------*/
  function progressBar() {
    $('.cs_progress').each(function () {
      var progressPercentage = $(this).data('progress') + '%';
      $(this).find('.cs_progress_in').css('width', progressPercentage);
    });
  }

  /*--------------------------------------------------------------
    10. Review
  --------------------------------------------------------------*/
  function review() {
    $('.cs_rating').each(function () {
      var review = $(this).data('rating');
      var reviewVal = review * 20 + '%';
      $(this).find('.cs_rating_percentage').css('width', reviewVal);
    });
  }

  /*--------------------------------------------------------------
    11. Page Transitions (Creative fast transitions for non-preload links)
  --------------------------------------------------------------*/
  function pageTransitions() {
    var transitionTypes = [
      'transition-wipe-left',
      'transition-wipe-right',
      'transition-expand-circle',
      'transition-diagonal-wipe',
      'transition-fade-blur',
      'transition-slide-down'
    ];
    var currentTransitionIndex = 0;

    // Bind to non-menu navigation links (not main menu or footer links to main pages)
    $(document).on('click', 'a:not([href*="index-2.html"]):not([href*="home-v2.html"]):not([href*="service.html"]):not([href*="#"]):not([target="_blank"])', function (e) {
      var $link = $(this);
      var href = $link.attr('href');

      // Skip if it's an email or phone link
      if (href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) {
        return;
      }

      // Skip external links
      if (href.indexOf('http') === 0 && href.indexOf(window.location.hostname) === -1) {
        return;
      }

      // Skip if preloader will show (main pages)
      var mainPages = ['index.html', 'index-2.html', 'home-v2.html', 'service.html', 'about-us.html', 'contact.html', 'blog.html', 'projects.html', 'team.html'];
      var isMainPage = mainPages.some(function (page) {
        return href.indexOf(page) !== -1;
      });

      if (isMainPage) {
        return; // Let preloader handle it
      }

      e.preventDefault();

      // Create transition overlay with alternating effects
      var transitionClass = transitionTypes[currentTransitionIndex % transitionTypes.length];
      currentTransitionIndex++;

      var $overlay = $('<div class="page-transition-overlay ' + transitionClass + '"></div>');
      $('body').append($overlay);

      // Navigate after transition starts
      setTimeout(function () {
        window.location.href = href;
      }, 400); // 400ms gives enough time for transition to be visible
    });
  }
})(jQuery); // End of use strict

/* JUJCO premium 3D / 4D / 5D animations */
(function () {
  'use strict';
  function jujcoInit() {
    var tilt = '.cs_service_card, .cs_pricing_plan, .cs_team_member, .cs_post, .cs_project_card, .cs_card, .cs_iconbox';
    var reveal = '.cs_service_card, .cs_pricing_plan, .cs_team_member, .cs_post, .cs_project_card, .cs_card, .cs_iconbox, .cs_section_heading, .cs_cta, .cs_faq, .cs_contact_info, .cs_work_step';
    var supportsIO = ('IntersectionObserver' in window);
    var io = null;
    if (supportsIO) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('jujco-show');
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    }
    document.querySelectorAll(tilt).forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateX(' + (-py * 9).toFixed(2) + 'deg) rotateY(' + (px * 9).toFixed(2) + 'deg) translateY(-8px) scale(1.025)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = '';
      });
    });
    document.querySelectorAll(reveal).forEach(function (el, i) {
      el.classList.add('jujco-reveal');
      if (i % 3 === 1) el.classList.add('lvl-2');
      else if (i % 3 === 2) el.classList.add('lvl-3');
      if (io) io.observe(el);
      else el.classList.add('jujco-show');
    });
    var eqGroups = ['.cs_whychoose_grid', '.cs_contact_cards'];
    function jujcoEqualize() {
      eqGroups.forEach(function (g) {
        var containers = document.querySelectorAll(g);
        Array.prototype.forEach.call(containers, function (cont) {
          var cards = cont.querySelectorAll('.cs_iconbox');
          if (cards.length < 2) return;
          Array.prototype.forEach.call(cards, function (c) { c.style.height = ''; });
          var max = 0;
          Array.prototype.forEach.call(cards, function (c) {
            var h = c.offsetHeight;
            if (h > max) max = h;
          });
          if (max > 0) {
            Array.prototype.forEach.call(cards, function (c) { c.style.height = max + 'px'; });
          }
        });
      });
    }
    jujcoEqualize();
    var eqTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(eqTimer);
      eqTimer = setTimeout(jujcoEqualize, 150);
    });
    window.addEventListener('load', jujcoEqualize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(jujcoEqualize);
  }
  if (document.readyState !== 'loading') jujcoInit();
  else document.addEventListener('DOMContentLoaded', jujcoInit);
})();