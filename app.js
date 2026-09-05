(function () {
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
      video.setAttribute("poster", "/intro.jpg");
      video.pause();
      if (soundBtn) soundBtn.textContent = "Tap to play";
    } else {
      video.setAttribute("autoplay", "");
      video.preload = "auto";
      video.removeAttribute("poster");
      setMuted(true);
      tryPlay();
      video.addEventListener("canplay", tryPlay);
      video.addEventListener("loadeddata", tryPlay);
      document.addEventListener("visibilitychange", function () {
        if (!document.hidden && video.muted) tryPlay();
      });
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

  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function daysBetween(a, b) {
    return Math.round((startOfDay(b) - startOfDay(a)) / 86400000);
  }
  function formatDate(iso) {
    if (!iso) return "";
    return new Date(iso + "T12:00:00").toLocaleDateString(undefined, {
      year: "numeric", month: "long", day: "numeric"
    });
  }

  var TRIP_START = new Date(2026, 7, 24);
  var TRIP_END = new Date(2026, 8, 17);
  var TRIP_DAYS = daysBetween(TRIP_START, TRIP_END) + 1;
  var dayEl = document.getElementById("day-count");
  if (dayEl) {
    var today = new Date();
    if (startOfDay(today) < startOfDay(TRIP_START)) {
      var left = daysBetween(today, TRIP_START);
      dayEl.textContent = left === 1 ? "1 day until we leave" : left + " days until we leave";
    } else if (startOfDay(today) > startOfDay(TRIP_END)) {
      dayEl.textContent = "Home again — " + TRIP_DAYS + " days on the road";
    } else {
      dayEl.textContent = "Day " + (daysBetween(TRIP_START, today) + 1) + " of " + TRIP_DAYS;
    }
  }

  var shareBtn = document.getElementById("share-btn");
  var shareStatus = document.getElementById("share-status");
  function showShare(msg) {
    if (!shareStatus) return;
    shareStatus.textContent = msg;
    shareStatus.classList.remove("hidden");
  }
  if (shareBtn) {
    shareBtn.addEventListener("click", function () {
      var url = location.origin + "/";
      var text = "Follow Daniel and Julia through Crete, Santorini, and Athens — Aug 24 to Sep 17.";
      var payload = { title: "Daniel & Julia’s Greece Adventure", text: text, url: url };
      if (navigator.share) {
        navigator.share(payload).catch(function () {});
        return;
      }
      var sms = "sms:?&body=" + encodeURIComponent(text + " " + url);
      if (/iPhone|iPad|Android/i.test(navigator.userAgent)) {
        location.href = sms;
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          showShare("Link copied — paste it into a text or email.");
        }).catch(function () { showShare(url); });
      } else {
        showShare(url);
      }
    });
  }

  function weatherPhrase(code) {
    if (code == null) return "";
    if (code === 0) return "clear";
    if (code <= 3) return "partly cloudy";
    if (code <= 48) return "foggy";
    if (code <= 67) return "rain";
    if (code <= 77) return "snow";
    if (code <= 82) return "showers";
    if (code >= 95) return "thunderstorms";
    return "mixed skies";
  }

  fetch("/status.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (status) {
      status = status || {};
      var tomorrow = document.getElementById("tomorrow-line");
      if (tomorrow && status.tonight) {
        tomorrow.textContent = "Tonight: " + status.tonight;
      } else if (tomorrow && status.tomorrow) {
        tomorrow.textContent = "Tomorrow: " + status.tomorrow;
      }
      var card = status.postcard || {};
      var postcard = document.getElementById("postcard");
      var convo = card.conversation || null;
      var hasConvo = convo && convo.lines && convo.lines.length;
      if (postcard && (card.note || card.title || hasConvo)) {
        postcard.classList.remove("hidden");
        var title = document.getElementById("postcard-title");
        var note = document.getElementById("postcard-note");
        var date = document.getElementById("postcard-date");
        if (title) title.textContent = card.title || "Postcard";
        if (note) note.textContent = card.note || "";
        if (date) date.textContent = formatDate(card.date);
        if (card.photo) {
          var wrap = document.getElementById("postcard-photo-wrap");
          var img = document.getElementById("postcard-photo");
          if (wrap && img) {
            img.src = card.photo;
            img.alt = card.title || "Postcard";
            wrap.classList.remove("hidden");
          }
        }
        var convoBox = document.getElementById("postcard-conversation");
        var convoLabel = document.getElementById("postcard-convo-label");
        var convoTitle = document.getElementById("postcard-convo-title");
        var convoLines = document.getElementById("postcard-convo-lines");
        if (convoBox && convoLines) {
          if (hasConvo) {
            convoBox.classList.remove("hidden");
            if (convoLabel) convoLabel.textContent = convo.label || "Conversation of the day";
            if (convoTitle) convoTitle.textContent = convo.title || "";
            convoLines.innerHTML = "";
            convo.lines.forEach(function (line) {
              var row = document.createElement("p");
              row.className = "leading-relaxed";
              var who = document.createElement("span");
              who.className = "font-semibold text-primary";
              who.textContent = (line.who || "") + ": ";
              row.appendChild(who);
              row.appendChild(document.createTextNode(line.text || ""));
              convoLines.appendChild(row);
            });
            if (convo.closer) {
              var closer = document.createElement("p");
              closer.className = "mt-3 text-base italic text-fg/80";
              closer.textContent = convo.closer;
              convoLines.appendChild(closer);
            }
          } else {
            convoBox.classList.add("hidden");
            convoLines.innerHTML = "";
          }
        }
      }
      var word = status.word || {};
      var wordCard = document.getElementById("word-card");
      if (wordCard && word.el) {
        wordCard.classList.remove("hidden");
        var wlabel = document.getElementById("word-label");
        var wel = document.getElementById("word-el");
        var wen = document.getElementById("word-en");
        var wsay = document.getElementById("word-say");
        if (wlabel) wlabel.textContent = "Greek word of the day";
        if (wel) {
          wel.textContent = word.el;
          wel.className = "mt-2 font-serif text-3xl font-semibold text-fg";
        }
        if (wen) {
          wen.className = "mt-1 text-base text-fg/90";
          wen.textContent = (word.en || "") + (word.meaning ? " — " + word.meaning : "");
        }
        if (wsay) wsay.textContent = word.say ? "Say: " + word.say : "";
      }
      var lat = status.lat != null ? status.lat : 35.5162;
      var lng = status.lng != null ? status.lng : 24.0178;
      var place = status.location || "Western Crete";
      var weatherEl = document.getElementById("weather-line");
      if (weatherEl) {
        var url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat +
          "&longitude=" + lng + "&current=temperature_2m,weather_code&temperature_unit=fahrenheit";
        fetch(url)
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (w) {
            if (!w || !w.current) return;
            var temp = Math.round(w.current.temperature_2m);
            var phrase = weatherPhrase(w.current.weather_code);
            weatherEl.textContent = place + ", " + temp + "\u00b0F" + (phrase ? ", " + phrase : "");
          })
          .catch(function () {});
      }
    })
    .catch(function () {});

  function tickClocks() {
    var opts = { hour: "numeric", minute: "2-digit" };
    var gr = document.getElementById("clock-gr");
    var now = new Date();
    if (gr) gr.textContent = now.toLocaleTimeString("en-GB", Object.assign({ timeZone: "Europe/Athens" }, opts));
  }
  tickClocks();
  setInterval(tickClocks, 30000);

  var notesList = document.getElementById("guestbook-list");
  if (notesList) {
    fetch("/guestbook.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (items) {
        notesList.innerHTML = "";
        (items || []).forEach(function (n) {
          var li = document.createElement("li");
          li.className = "rounded-xl bg-surface p-5 card-shadow";
          var when = formatDate(n.date);
          var html =
            '<div class="flex flex-wrap items-baseline justify-between gap-2">' +
            '<p class="font-semibold text-fg">' + (n.name || "Friend") + "</p>" +
            (when ? '<time class="text-sm text-muted">' + when + "</time>" : "") +
            "</div>" +
            '<p class="mt-2 text-base leading-relaxed text-fg/90">' + (n.message || "") + "</p>";
          if (n.reply) {
            html +=
              '<div class="guestbook-reply">' +
              '<p class="text-xs font-semibold uppercase tracking-wide text-primary">Daniel & Julia</p>' +
              '<p class="mt-1 text-base leading-relaxed text-fg/90">' + n.reply + "</p>" +
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
  function silentForm(form) {
    if (!form) return;
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
        var note = form.id === "updates-form"
          ? "You’re on the list. We’ll tap you when we post."
          : "Got it — thank you. We’ll read this.";
        showFormToast(note);
      }).catch(function () {
        form.submit();
      }).then(function () {
        if (btn) btn.disabled = false;
      });
    });
  }
  silentForm(document.getElementById("guestbook-form"));
  silentForm(document.getElementById("updates-form"));

  fetch("/itinerary.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (stops) {
      var list = document.getElementById("itinerary-list");
      var btnEarlier = document.getElementById("itin-earlier");
      var btnLater = document.getElementById("itin-later");
      if (!list) return;
      stops = stops || [];
      var toneClass = {
        muted: "bg-bg-warm text-muted",
        crete: "bg-primary-soft text-primary",
        island: "bg-accent-soft text-fg",
        athens: "bg-primary/15 text-primary"
      };
      var nowIdx = -1;
      for (var i = 0; i < stops.length; i++) {
        if (stops[i].state === "now") { nowIdx = i; break; }
      }
      if (nowIdx < 0) {
        for (var j = 0; j < stops.length; j++) {
          if (stops[j].state === "upcoming") { nowIdx = j; break; }
        }
      }
      if (nowIdx < 0) nowIdx = Math.max(0, stops.length - 1);
      var showEarlier = false;
      var showLater = false;

      function focusLabel(role) {
        if (role === "prev") return "Previous";
        if (role === "now") return "Now";
        if (role === "next") return "Next up";
        return "";
      }
      function buildItem(s, role) {
        var li = document.createElement("li");
        var roleClass = "";
        if (role === "now") roleClass = " itin-block-now";
        else if (role === "prev" || role === "past") roleClass = " itin-block-past";
        li.className = "relative pl-9" + roleClass;
        li.setAttribute("data-state", s.state || "upcoming");
        li.setAttribute("data-title", s.title || "");
        var label = focusLabel(role);
        var labelHtml = label ? '<p class="itin-focus-label">' + label + "</p>" : "";
        var pinClass = role === "now" ? "border-primary bg-primary" : "border-accent bg-surface";
        var nowBadge = (s.state === "now")
          ? '<span class="it-now-label inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-semibold tracking-wide" style="background:#1b6f66;color:#f4eee4;">Here now</span>'
          : "";
        var doneBadge = (s.state === "done")
          ? '<span class="it-done-label" style="margin-left:0.5rem;font-size:0.7rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#1b6f66;">Done</span>'
          : "";
        li.innerHTML =
          '<span class="absolute left-0 top-5 size-5 rounded-full border-[3px] ' + pinClass + '"></span>' +
          '<article class="rounded-xl bg-surface p-5 card-shadow">' +
          labelHtml +
          '<div class="flex flex-wrap items-center gap-2">' +
          '<p class="text-sm font-semibold text-primary">' + (s.dates || "") + "</p>" +
          '<span class="inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-semibold tracking-wide ' + (toneClass[s.tone] || toneClass.muted) + '">' + (s.tag || "") + "</span>" +
          nowBadge +
          "</div>" +
          '<h3 class="mt-2 font-serif text-xl font-semibold text-fg">' + (s.title || "") + doneBadge + "</h3>" +
          '<p class="mt-1.5 text-base leading-relaxed text-fg/90">' + (s.blurb || "") + "</p>" +
          '<div class="itinerary-sub"><h4 class="text-primary">The plan</h4>' +
          '<p class="mt-1.5 text-base leading-relaxed text-fg/90">' + (s.plan || "") + "</p></div></article>";
        var article = li.querySelector("article");
        var dot = li.querySelector(":scope > span");
        if (s.state === "done") {
          if (article) article.style.opacity = "0.55";
          if (dot) {
            dot.style.background = "#1b6f66";
            dot.style.borderColor = "#1b6f66";
            dot.innerHTML = '<span style="display:block;width:100%;height:100%;border-radius:999px;background:#1b6f66;color:#f4eee4;font-size:10px;line-height:14px;text-align:center;font-weight:700;">\u2713</span>';
            dot.style.display = "flex";
            dot.style.alignItems = "center";
            dot.style.justifyContent = "center";
            dot.style.overflow = "hidden";
          }
        } else if (s.state === "now") {
          if (article) {
            article.style.boxShadow = "0 0 0 2px #1b6f66, 0 8px 24px rgba(27,111,102,0.15)";
            article.style.background = "#f7faf9";
          }
          if (dot) {
            dot.style.background = "#1b6f66";
            dot.style.borderColor = "#1b6f66";
            dot.style.boxShadow = "0 0 0 4px rgba(27,111,102,0.25)";
          }
        }
        return li;
      }
      function render() {
        list.innerHTML = "";
        var earlierCount = nowIdx > 1 ? nowIdx - 1 : 0;
        var laterCount = Math.max(0, stops.length - (nowIdx + 2));
        if (btnEarlier) {
          if (earlierCount > 0) {
            btnEarlier.hidden = false;
            btnEarlier.textContent = showEarlier ? "Hide earlier stops" : "Show earlier stops (" + earlierCount + ")";
          } else {
            btnEarlier.hidden = true;
          }
        }
        if (btnLater) {
          if (laterCount > 0) {
            btnLater.hidden = false;
            btnLater.textContent = showLater ? "Hide later stops" : "Show later stops (" + laterCount + ")";
          } else {
            btnLater.hidden = true;
          }
        }
        if (showEarlier) {
          for (var e = 0; e < nowIdx - 1; e++) list.appendChild(buildItem(stops[e], "past"));
        }
        if (nowIdx > 0) list.appendChild(buildItem(stops[nowIdx - 1], "prev"));
        list.appendChild(buildItem(stops[nowIdx], "now"));
        if (nowIdx + 1 < stops.length) list.appendChild(buildItem(stops[nowIdx + 1], "next"));
        if (showLater) {
          for (var f = nowIdx + 2; f < stops.length; f++) list.appendChild(buildItem(stops[f], ""));
        }
      }
      if (btnEarlier) btnEarlier.addEventListener("click", function () { showEarlier = !showEarlier; render(); });
      if (btnLater) btnLater.addEventListener("click", function () { showLater = !showLater; render(); });
      render();
    })
    .catch(function () {});


  fetch("/status.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (st) {
      var a = document.getElementById("open-maps");
      if (!a || !st) return;
      var lat = Number(st.lat), lng = Number(st.lng);
      if (!isFinite(lat) || !isFinite(lng)) return;
      a.href = "https://www.google.com/maps/search/?api=1&query=" + lat + "," + lng;
      a.hidden = false;
    })
    .catch(function () {});

})();
