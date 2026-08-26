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

  if (video) {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("autoplay", "");
    video.loop = true;
    video.removeAttribute("poster");
    setMuted(true);
    tryPlay();
    video.addEventListener("canplay", tryPlay);
    video.addEventListener("loadeddata", tryPlay);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && video.muted) tryPlay();
    });
  }

  function toggleSound(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!video) return;
    if (video.muted) {
      video.muted = false;
      setMuted(false);
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    } else {
      setMuted(true);
    }
  }
  if (soundBtn) soundBtn.addEventListener("click", toggleSound);

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
      dayEl.textContent = "Home again \u2014 " + TRIP_DAYS + " days on the road";
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
      var text = "Follow Daniel and Julia through Crete, Santorini, and Athens \u2014 Aug 24 to Sep 17.";
      var payload = { title: "Daniel & Julia\u2019s Greece Adventure", text: text, url: url };
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
          showShare("Link copied \u2014 paste it into a text or email.");
        }).catch(function () {
          showShare(url);
        });
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
      if (tomorrow && status.tomorrow) {
        tomorrow.textContent = "Tomorrow: " + status.tomorrow;
      }
      var card = status.postcard || {};
      var postcard = document.getElementById("postcard");
      if (postcard && (card.note || card.title)) {
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
      }
      var lat = status.lat != null ? status.lat : 32.2226;
      var lng = status.lng != null ? status.lng : -110.9747;
      var place = status.location || "Tucson";
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
          ? "You\u2019re on the list. We\u2019ll tap you when we post."
          : "Got it \u2014 thank you. We\u2019ll read this.";
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
      if (!list) return;
      var toneClass = {
        muted: "bg-bg-warm text-muted",
        crete: "bg-primary-soft text-primary",
        island: "bg-accent-soft text-fg",
        athens: "bg-primary/15 text-primary"
      };
      list.innerHTML = "";
      (stops || []).forEach(function (s) {
        var days = (s.days || []).map(function (d) {
          return "<li><time>" + d.date + "</time><span>" + (d.actual || "\u2014") + "</span></li>";
        }).join("");
        var li = document.createElement("li");
        li.className = "relative pl-9";
        li.innerHTML =
          '<span class="absolute left-0 top-5 size-5 rounded-full border-[3px] border-accent bg-surface"></span>' +
          '<article class="rounded-xl bg-surface p-5 card-shadow">' +
          '<div class="flex flex-wrap items-center gap-2">' +
          '<p class="text-sm font-semibold text-primary">' + (s.dates || "") + "</p>" +
          '<span class="inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-semibold tracking-wide ' + (toneClass[s.tone] || toneClass.muted) + '">' + (s.tag || "") + "</span>" +
          "</div>" +
          '<h3 class="mt-2 font-serif text-xl font-semibold text-fg">' + (s.title || "") + "</h3>" +
          '<p class="mt-1.5 text-base leading-relaxed text-fg/90">' + (s.blurb || "") + "</p>" +
          '<div class="itinerary-sub"><h4 class="text-primary">The plan</h4>' +
          '<p class="mt-1.5 text-base leading-relaxed text-fg/90">' + (s.plan || "") + "</p></div>" +
          '<div class="itinerary-sub"><h4 class="text-muted">What we actually did</h4>' +
          '<ul class="itinerary-days">' + days + "</ul></div></article>";
        list.appendChild(li);
      });
    })
    .catch(function () {});

  var lb = document.getElementById("lb");
  var lbImg = document.getElementById("lb-img");
  var lbCaption = document.getElementById("lb-caption");
  var lbCount = document.getElementById("lb-count");
  var lbPrev = document.getElementById("lb-prev");
  var lbNext = document.getElementById("lb-next");
  var lbClose = document.getElementById("lb-close");
  var lbItems = [];
  var lbIndex = 0;

  function renderLightbox() {
    if (!lb || !lbImg || !lbItems.length) return;
    var item = lbItems[lbIndex];
    lbImg.src = item.src;
    lbImg.alt = item.caption || "";
    if (lbCaption) lbCaption.textContent = item.caption || "";
    if (lbCount) {
      lbCount.textContent = lbItems.length > 1 ? (lbIndex + 1) + " / " + lbItems.length : "";
    }
    var many = lbItems.length > 1;
    if (lbPrev) lbPrev.classList.toggle("hidden", !many);
    if (lbNext) lbNext.classList.toggle("hidden", !many);
    lb.classList.remove("hidden");
    lb.classList.add("flex");
    document.body.style.overflow = "hidden";
  }

  function openLightbox(items, start) {
    lbItems = (items || []).filter(function (it) { return it && it.src; });
    if (!lbItems.length) return;
    lbIndex = Math.max(0, Math.min(start || 0, lbItems.length - 1));
    renderLightbox();
  }

  function closeLightbox() {
    if (!lb) return;
    lb.classList.add("hidden");
    lb.classList.remove("flex");
    document.body.style.overflow = "";
  }

  function stepLightbox(dir) {
    if (lbItems.length < 2) return;
    lbIndex = (lbIndex + dir + lbItems.length) % lbItems.length;
    renderLightbox();
  }

  if (lbClose) lbClose.addEventListener("click", function (e) { e.stopPropagation(); closeLightbox(); });
  if (lbPrev) lbPrev.addEventListener("click", function (e) { e.stopPropagation(); stepLightbox(-1); });
  if (lbNext) lbNext.addEventListener("click", function (e) { e.stopPropagation(); stepLightbox(1); });
  if (lb) {
    lb.addEventListener("click", function (e) {
      if (e.target === lb) closeLightbox();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (!lb || lb.classList.contains("hidden")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") stepLightbox(-1);
    if (e.key === "ArrowRight") stepLightbox(1);
  });
  var touchX = null;
  if (lb) {
    lb.addEventListener("touchstart", function (e) {
      if (e.changedTouches && e.changedTouches[0]) touchX = e.changedTouches[0].clientX;
    }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (touchX == null || !e.changedTouches || !e.changedTouches[0]) return;
      var dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (dx > 40) stepLightbox(-1);
      if (dx < -40) stepLightbox(1);
    }, { passive: true });
  }

  if (typeof L === "undefined") return;

  var tiles = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  var attr = "&copy; OpenStreetMap &copy; CARTO";
  var TUCSON = [32.2226, -110.9747];

  var liveEl = document.getElementById("live-map");
  if (liveEl) {
    var live = L.map(liveEl, { scrollWheelZoom: false, zoomControl: true }).setView(TUCSON, 11);
    L.tileLayer(tiles, { attribution: attr, maxZoom: 19 }).addTo(live);
    L.circle(TUCSON, { radius: 12000, color: "#1b6f66", weight: 1, fillColor: "#1b6f66", fillOpacity: 0.12, interactive: false }).addTo(live);
    L.marker(TUCSON, {
      icon: L.divIcon({ className: "trip-pin", html: '<div class="trip-pin-inner"><span class="live-pin-pulse"></span><div class="trip-pin-head"><span></span></div><div class="trip-pin-tail"></div></div>', iconSize: [28, 40], iconAnchor: [14, 40] })
    }).addTo(live).bindPopup('<p class="map-popup-title">Home</p><p class="map-popup-meta">Tucson, Arizona</p>');
  }

  var greeceEl = document.getElementById("greece-map");
  if (greeceEl) {
    var greece = L.map(greeceEl, { scrollWheelZoom: false, zoomControl: true, maxBounds: [[34.5, 22.3], [38.85, 26.95]] });
    L.tileLayer(tiles, { attribution: attr, maxZoom: 19 }).addTo(greece);
    greece.fitBounds([[35.45, 23.90], [35.58, 24.15]], { padding: [20, 20], animate: false });

    function nearestIndex(path, lat, lng) {
      var best = 0, bestD = Infinity;
      for (var i = 0; i < path.length; i++) {
        var d = Math.hypot(path[i][0] - lat, path[i][1] - lng);
        if (d < bestD) { bestD = d; best = i; }
      }
      return best;
    }

    function buildActualFromVisited(planned, stops, visitedIds) {
      if (!visitedIds || !visitedIds.length || !planned || !planned.length) return [];
      var creteIds = ["chania", "paleochora", "douliana", "elounda", "heraklion"];
      var creteVisited = visitedIds.filter(function (id) { return creteIds.indexOf(id) >= 0; });
      if (!creteVisited.length) return [];
      var byId = {};
      (stops || []).forEach(function (s) { byId[s.id] = s; });
      var idxs = creteVisited.map(function (id) {
        var s = byId[id];
        return s ? nearestIndex(planned, s.lat, s.lng) : 0;
      }).sort(function (a, b) { return a - b; });
      var from = idxs[0];
      var to = idxs[idxs.length - 1];
      return planned.slice(from, to + 1);
    }

    fetch("/route.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (route) {
        route = route || {};
        var planned = route.plannedCrete || [];
        var ferry = route.ferry || [[35.3387, 25.1442], [36.4165, 25.4324], [37.9838, 23.7275]];
        var stops = route.stops || [];
        var visited = route.visited || [];
        var actual = (route.actual && route.actual.length) ? route.actual : buildActualFromVisited(planned, stops, visited);

        if (planned.length) {
          L.polyline(planned, {
            color: "#1b6f66",
            weight: 3,
            opacity: 0.45,
            dashArray: "8 8"
          }).addTo(greece).bindPopup("Planned \u2014 roads on Crete");
        }

        if (actual.length > 1) {
          L.polyline(actual, {
            color: "#1b6f66",
            weight: 4,
            opacity: 0.95
          }).addTo(greece).bindPopup("Actual path so far");
        }

        L.polyline(ferry, {
          color: "#c4a35a",
          weight: 3,
          dashArray: "7 7",
          opacity: 0.95
        }).addTo(greece).bindPopup("Ferry");

        stops.forEach(function (s, i) {
          var done = visited.indexOf(s.id) >= 0;
          L.marker([s.lat, s.lng], {
            icon: L.divIcon({
              className: "route-pin-icon",
              html: '<div class="route-pin' + (done ? " route-pin-done" : "") + '">' + (i + 1) + "</div>",
              iconSize: [26, 26],
              iconAnchor: [13, 13]
            })
          }).addTo(greece).bindPopup(s.name + (done ? " \u00b7 visited" : ""));
        });
      })
      .catch(function () {
        var land = [[35.5164, 24.0181], [35.231, 23.68], [35.4296, 24.1911], [35.265, 25.723], [35.3387, 25.1442]];
        var ferry = [[35.3387, 25.1442], [36.4165, 25.4324], [37.9838, 23.7275]];
        L.polyline(land, { color: "#1b6f66", weight: 3, opacity: 0.45, dashArray: "8 8" }).addTo(greece);
        L.polyline(ferry, { color: "#c4a35a", weight: 3, dashArray: "7 7", opacity: 0.95 }).addTo(greece);
      });

    function photoPin(lat, lng, items) {
      var first = items[0];
      var extra = items.length > 1 ? '<span class="photo-pin-count">' + items.length + "</span>" : "";
      var html = '<div class="photo-pin"><div class="photo-pin-card"><img src="' + first.src + '" alt="" onerror="this.parentNode.parentNode.style.display=\'none\'" />' + extra + '</div><div class="photo-pin-tail"></div></div>';
      var marker = L.marker([lat, lng], {
        icon: L.divIcon({ className: "photo-pin-icon", html: html, iconSize: [56, 66], iconAnchor: [28, 66] }),
        zIndexOffset: 900,
        title: first.caption || "Photo"
      }).addTo(greece);
      marker.on("click", function (e) {
        if (e && e.originalEvent) {
          e.originalEvent.preventDefault();
          e.originalEvent.stopPropagation();
        }
        openLightbox(items, 0);
      });
    }

    fetch("/photos/album.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (items) {
        var groups = {};
        (items || []).forEach(function (item) {
          if (!item.lat || !item.lng || !item.src) return;
          var key = Number(item.lat).toFixed(3) + "," + Number(item.lng).toFixed(3);
          if (!groups[key]) groups[key] = { lat: item.lat, lng: item.lng, items: [] };
          groups[key].items.push(item);
        });
        Object.keys(groups).forEach(function (key) {
          var g = groups[key];
          photoPin(g.lat, g.lng, g.items);
        });
      })
      .catch(function () {});
  }
})();
