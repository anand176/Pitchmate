/* ============================================================
   Pitchmate landing — vanilla JS
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* --------------------------------------------- Scroll progress + back-to-top */

  var backToTop = document.getElementById("back-to-top");
  var progressRing = document.getElementById("back-to-top-progress");
  var ringCircumference = 2 * Math.PI * 20; // r=20, matches the SVG circle
  var scrollTicking = false;

  function updateScrollUI() {
    scrollTicking = false;
    var doc = document.documentElement;
    var scrollTop = window.scrollY || doc.scrollTop;
    var scrollable = doc.scrollHeight - doc.clientHeight;
    var pct = scrollable > 0 ? scrollTop / scrollable : 0;

    if (progressRing) {
      progressRing.style.strokeDashoffset = String(
        ringCircumference * (1 - pct)
      );
    }
    if (backToTop) {
      backToTop.classList.toggle("is-visible", scrollTop > window.innerHeight * 0.6);
    }
  }

  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateScrollUI);
  }

  if (progressRing || backToTop) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateScrollUI();
  }

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------------------------------------------------------- Count-up ---- */

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function countUp(el, index) {
    var target = parseFloat(el.dataset.target);
    var suffix = el.dataset.suffix || "";
    var decimals = parseInt(el.dataset.decimals, 10) || 0;
    var duration = 1500 + index * 80;
    var start = null;

    function frame(now) {
      if (start === null) start = now;
      var t = Math.min((now - start) / duration, 1);
      el.textContent = (target * easeOutCubic(t)).toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }

    setTimeout(function () {
      requestAnimationFrame(frame);
    }, 480 + index * 90);
  }

  var stats = Array.prototype.slice.call(
    document.querySelectorAll(".stat-value")
  );

  if (reduceMotion) {
    stats.forEach(function (el) {
      var decimals = parseInt(el.dataset.decimals, 10) || 0;
      el.textContent =
        parseFloat(el.dataset.target).toFixed(decimals) +
        (el.dataset.suffix || "");
    });
  } else if ("IntersectionObserver" in window) {
    var statObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          countUp(entry.target, stats.indexOf(entry.target));
          statObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.25 }
    );
    stats.forEach(function (el) {
      statObserver.observe(el);
    });
  } else {
    stats.forEach(countUp);
  }

  /* ------------------------------------------------- Scroll reveal (below) */

  var reveals = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(reveals, function (el) {
      el.classList.add("is-in");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var siblings = Array.prototype.slice.call(
            entry.target.parentElement.children
          );
          var i = siblings.indexOf(entry.target);
          entry.target.style.transitionDelay = Math.min(i, 6) * 0.06 + "s";
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    Array.prototype.forEach.call(reveals, function (el) {
      revealObserver.observe(el);
    });
  }

  /* ------------------------------------------------------- Mobile menu ---- */

  var burger = document.querySelector(".burger");
  var overlay = document.querySelector(".menu-overlay");
  var sheet = document.querySelector(".menu-sheet");

  function setMenu(open) {
    if (!burger || !overlay || !sheet) return;
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    overlay.hidden = !open;
    sheet.hidden = !open;
    document.body.classList.toggle("menu-open", open);
  }

  if (burger) {
    burger.addEventListener("click", function () {
      setMenu(burger.getAttribute("aria-expanded") !== "true");
    });
  }

  if (overlay) {
    overlay.addEventListener("click", function () {
      setMenu(false);
    });
  }

  if (sheet) {
    sheet.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
  }

  window.addEventListener("resize", function () {
    if (window.innerWidth > 720) setMenu(false);
  });

  /* -------------------------------------------------------- Demo modal ---- */

  var modal = document.getElementById("demo-modal");
  var player = document.getElementById("demo-player");
  var lastFocused = null;

  function openDemo() {
    if (!modal) return;
    lastFocused = document.activeElement;
    setMenu(false);
    modal.hidden = false;
    document.body.classList.add("demo-open");

    // Lazy-load: the iframe (Google Drive embed) or <video> only gets a src
    // once the modal is actually opened.
    if (player && !player.src && player.dataset.src) {
      player.src = player.dataset.src;
    }
    if (player && typeof player.play === "function") {
      var playing = player.play();
      if (playing && typeof playing.catch === "function") playing.catch(function () {});
    }

    var closeBtn = modal.querySelector(".demo-close");
    if (closeBtn) closeBtn.focus();
  }

  function closeDemo() {
    if (!modal || modal.hidden) return;
    if (player && typeof player.pause === "function") player.pause();
    // Iframes (Drive embed) have no pause() — clearing src stops playback
    // and drops the src attribute so the modal re-lazy-loads next time.
    if (player && player.tagName === "IFRAME") player.removeAttribute("src");
    modal.hidden = true;
    document.body.classList.remove("demo-open");
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  document.querySelectorAll("[data-demo-open]").forEach(function (btn) {
    btn.addEventListener("click", openDemo);
  });

  document.querySelectorAll("[data-demo-close]").forEach(function (btn) {
    btn.addEventListener("click", closeDemo);
  });

  // Backgrounding the tab (app switcher, home button, switching tabs) while
  // the demo is open leaves the Drive iframe's video "playing" as far as the
  // OS is concerned, which is what surfaces Android's media-control card in
  // the recent-apps view. Stop it (without closing the modal) the moment the
  // page goes hidden, and reload it when the tab comes back to front.
  document.addEventListener("visibilitychange", function () {
    if (!modal || modal.hidden || !player) return;

    if (document.hidden) {
      if (typeof player.pause === "function") player.pause();
      if (player.tagName === "IFRAME" && player.src) {
        player.dataset.src = player.dataset.src || player.src;
        player.removeAttribute("src");
      }
    } else if (player.tagName === "IFRAME" && !player.src && player.dataset.src) {
      player.src = player.dataset.src;
    }
  });

  /* ------------------------------------------------------------ Escape ---- */

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (modal && !modal.hidden) closeDemo();
    else setMenu(false);
  });

  /* ------------------------------------------------------------ Contact --- */

  var contactForm = document.getElementById("contact-form");
  var contactStatus = document.getElementById("contact-status");

  if (contactForm && contactStatus) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      var submitBtn = contactForm.querySelector(".contact-submit");
      var label = submitBtn.querySelector(".contact-submit-label");
      var data = {
        name: contactForm.name.value.trim(),
        email: contactForm.email.value.trim(),
        message: contactForm.message.value.trim(),
      };

      submitBtn.disabled = true;
      if (label) label.textContent = "Sending…";
      contactStatus.textContent = "";
      contactStatus.className = "form-status";

      // TODO: replace with the real endpoint once the backend contact route
      // exists, e.g. fetch(`${BACKEND_URL}/contact`, { method: "POST", ... }).
      // Left as a stub for now — no request is actually sent.
      Promise.resolve(data)
        .then(function () {
          return new Promise(function (resolve) {
            setTimeout(resolve, 600);
          });
        })
        .then(function () {
          contactStatus.textContent =
            "Thanks — we'll get back to you shortly.";
          contactStatus.className = "form-status is-success";
          contactForm.reset();
        })
        .catch(function () {
          contactStatus.textContent =
            "Something went wrong. Please try again.";
          contactStatus.className = "form-status is-error";
        })
        .finally(function () {
          submitBtn.disabled = false;
          if (label) label.textContent = "Send";
        });
    });
  }
})();
