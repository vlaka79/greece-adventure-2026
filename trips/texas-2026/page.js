(function () {
  var TRIP_BASE = "/trips/texas-2026";
  var video = document.getElementById("intro");
  var soundBtn = document.getElementById("sound-btn");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function setMuted(muted) {
    if (!video) return;
    video.muted = muted;
    if (soundBtn) {
      soundBtn.textContent = muted ? "Tap for sound" : "Sound on";
      soundBtn.setAttribute("aria-pressed", muted ? "false" : "true");
    }
  }
  function tryPlay() {
    if (!video || reduce) return;
    if (!video.muted) return;
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }
  var isPhone = window.matchMedia("(max-width: 700px), (pointer: coarse)").matches;
  if (video) {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.loop = true;
    if (reduce || isPhone) {
      video.removeAttribute("autoplay");
      video.preload = "metadata";
      video.pause();
      if (soundBtn) soundBtn.textContent = "Tap to play";
    } else {
      video.setAttribute("autoplay", "");
      video.preload = "auto";
      setMuted(true);
      tryPlay();
      video.addEventListener("canplay", tryPlay);
      video.addEventListener("loadeddata", tryPlay);
    }
  }
  function startIntro() {
    if (!video) return;
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }
  function toggleSound(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!video) return;
    if (video.paused) {
      video.muted = true;
      setMuted(true);
      startIntro();
      return;
    }
    if (video.muted) {
      video.muted = false;
      setMuted(false);
      startIntro();
    } else {
      setMuted(true);
    }
  }
  if (soundBtn) soundBtn.addEventListener("click", toggleSound);
  if (video && isPhone) video.addEventListener("click", toggleSound);


  function formatDate(iso) {
    if (!iso) return "";
    try {
      return new Date(iso + "T12:00:00").toLocaleDateString(undefined, {
        year: "numeric", month: "long", day: "numeric"
      });
    } catch (e) { return iso; }
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function logSummary(body) {
    body = String(body || "").trim();
    if (body.length <= 160) return { summary: body, expandable: false };
    var cut = body.slice(0, 140);
    var sp = cut.lastIndexOf(" ");
    if (sp > 80) cut = cut.slice(0, sp);
    return { summary: cut.replace(/[.,;:\s]+$/, "") + "…", expandable: true };
  }
  function bindLogExpand(root) {
    (root || document).querySelectorAll("[data-log-expand]").forEach(function (btn) {
      if (btn._logBound) return;
      btn._logBound = true;
      btn.addEventListener("click", function () {
        var art = btn.closest("article");
        if (!art) return;
        var bodyEl = art.querySelector("[data-log-body]");
        if (!bodyEl) return;
        var open = art.getAttribute("data-expanded") === "1";
        if (open) {
          bodyEl.textContent = bodyEl.getAttribute("data-summary") || "";
          art.setAttribute("data-expanded", "0");
          btn.textContent = "Read more";
          btn.setAttribute("aria-expanded", "false");
        } else {
          bodyEl.textContent = bodyEl.getAttribute("data-full") || "";
          art.setAttribute("data-expanded", "1");
          btn.textContent = "Show less";
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });
  }
  function renderLogArticle(e, headingTag) {
    headingTag = headingTag || "h3";
    var body = e.body || "";
    var parts = logSummary(body);
    var html =
      '<article class="log-entry rounded-xl bg-surface p-5 card-shadow" data-expanded="0">' +
      '<div class="flex flex-wrap items-center gap-2">' +
      '<time datetime="' + esc(e.date || "") + '" class="text-sm font-medium text-muted">' + esc(formatDate(e.date)) + "</time>" +
      (e.tag ? '<span class="inline-flex min-h-7 items-center rounded-full bg-primary-soft px-2.5 text-xs font-semibold tracking-wide text-primary">' + esc(e.tag) + "</span>" : "") +
      "</div>" +
      "<" + headingTag + ' class="mt-3 font-serif text-2xl font-semibold text-fg">' + esc(e.title || "") + "</" + headingTag + ">" +
      '<p class="mt-2 text-base leading-relaxed text-fg/90" data-log-body data-summary="' + esc(parts.summary) + '" data-full="' + esc(body) + '">' + esc(parts.summary) + "</p>";
    if (parts.expandable) {
      html += '<button type="button" class="log-expand-btn tap-lg mt-2 min-h-11 text-sm font-semibold text-primary" data-log-expand aria-expanded="false">Read more</button>';
    }
    html += "</article>";
    return html;
  }

    fetch(TRIP_BASE + "/log.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (items) {
      var list = document.getElementById("trip-log");
      if (!list) return;
      (items || []).forEach(function (e) {
        var li = document.createElement("li");
        li.innerHTML = renderLogArticle(e, "h3");
        list.appendChild(li);
      });
      bindLogExpand(list);
    })
    .catch(function () {});

    fetch(TRIP_BASE + "/eats.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (items) {
      var list = document.getElementById("eats-list");
      var empty = document.getElementById("eats-empty");
      if (!list) return;
      items = items || [];
      if (!items.length) {
        if (empty) empty.classList.remove("hidden");
        return;
      }
      if (empty) empty.classList.add("hidden");
      list.innerHTML = "";
      list.className = "mt-6";
      var card = document.createElement("article");
      card.id = "eats-rotator";
      card.className = "overflow-hidden rounded-xl bg-surface card-shadow";
      card.innerHTML =
        '<div id="eats-rot-photo-wrap" class="hidden">' +
        '<img id="eats-rot-photo" alt="" class="aspect-video w-full object-cover" />' +
        "</div>" +
        '<div class="p-5">' +
        '<p id="eats-rot-place" class="text-xs font-semibold uppercase tracking-widest text-primary"></p>' +
        '<h3 id="eats-rot-dish" class="mt-1 font-serif text-xl font-semibold text-fg"></h3>' +
        '<p id="eats-rot-note" class="mt-1.5 text-base leading-relaxed text-fg/90"></p>' +
        '<p id="eats-rot-dots" class="mt-3 flex flex-wrap gap-1.5" aria-hidden="false"></p>' +
        "</div>";
      list.appendChild(card);
      if (!document.getElementById("eats-see-all")) {
        var more = document.createElement("p");
        more.id = "eats-see-all";
        more.className = "mt-4";
        more.innerHTML = '<a href="' + TRIP_BASE + '/eats.html" class="tap-lg inline-flex min-h-11 items-center text-sm font-semibold text-primary">See all eat & drink \u2192</a>';
        list.parentNode.insertBefore(more, list.nextSibling);
      }
      var i = 0;
      function show(idx) {
        var e = items[idx];
        if (!e) return;
        var place = document.getElementById("eats-rot-place");
        var dish = document.getElementById("eats-rot-dish");
        var note = document.getElementById("eats-rot-note");
        var photo = document.getElementById("eats-rot-photo");
        var wrap = document.getElementById("eats-rot-photo-wrap");
        var dots = document.getElementById("eats-rot-dots");
        if (place) place.textContent = e.place || "Somewhere along the way";
        if (dish) dish.textContent = e.dish || "";
        if (note) note.textContent = e.note || "";
        if (photo && wrap) {
          if (e.photo) {
            photo.src = e.photo;
            photo.alt = e.dish || "";
            wrap.classList.remove("hidden");
          } else {
            wrap.classList.add("hidden");
          }
        }
        if (dots) {
          dots.innerHTML = "";
          items.forEach(function (_, j) {
            var d = document.createElement("button");
            d.type = "button";
            d.setAttribute("aria-label", "Show item " + (j + 1));
            d.className = "size-2.5 min-h-0 rounded-full " + (j === idx ? "bg-primary" : "bg-fg/20");
            d.addEventListener("click", function () { i = j; show(i); });
            dots.appendChild(d);
          });
        }
      }
      show(0);
      if (items.length > 1) {
        setInterval(function () {
          i = (i + 1) % items.length;
          show(i);
        }, 5500);
      }
    })
    .catch(function () {});


  var notesList = document.getElementById("guestbook-list");
  if (notesList) {
    fetch(TRIP_BASE + "/notes.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (items) {
        notesList.innerHTML = "";
        (items || []).forEach(function (n) {
          var li = document.createElement("li");
          li.className = "rounded-xl bg-surface p-5 card-shadow";
          var when = formatDate(n.date);
          var html =
            '<div class="flex flex-wrap items-baseline justify-between gap-2">' +
            '<p class="font-semibold text-fg">' + esc(n.name || "Friend") + "</p>" +
            (when ? '<time class="text-sm text-muted">' + esc(when) + "</time>" : "") +
            "</div>" +
            '<p class="mt-2 text-base leading-relaxed text-fg/90">' + esc(n.message || "") + "</p>";
          if (n.reply) {
            html +=
              '<div class="guestbook-reply">' +
              '<p class="text-xs font-semibold uppercase tracking-wide text-primary">Daniel &amp; Julia</p>' +
              '<p class="mt-1 text-base leading-relaxed text-fg/90">' + esc(n.reply) + "</p>" +
              "</div>";
          }
          li.innerHTML = html;
          notesList.appendChild(li);
        });
      })
      .catch(function () {});
  }

  function showFormToast(msg) {
    var el = document.getElementById("form-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "form-toast";
      el.setAttribute("role", "status");
      el.style.cssText = "position:fixed;left:50%;bottom:1.4rem;transform:translateX(-50%);z-index:80;width:min(22rem,calc(100% - 2rem));border-radius:1rem;background:#1b6f66;color:#f4eee4;padding:1rem 1.15rem;text-align:center;font:600 1rem/1.4 Source Sans 3,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.2);";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = "block";
    clearTimeout(showFormToast._t);
    showFormToast._t = setTimeout(function () { el.style.display = "none"; }, 4200);
  }
  var form = document.getElementById("notes-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector("button[type=submit]");
      if (btn) btn.disabled = true;
      var data = new URLSearchParams(new FormData(form));
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: data.toString()
      }).then(function () {
        form.reset();
        showFormToast("Got it — thank you. We’ll read this.");
      }).catch(function () {
        form.submit();
      }).then(function () {
        if (btn) btn.disabled = false;
      });
    });
  }
})();
