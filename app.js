(function () {
  var video = document.getElementById("intro");
  var soundBtn = document.getElementById("sound-btn");
  var muteIcon = document.getElementById("mute-icon");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setMuted(muted) {
    if (!video) return;
    video.muted = muted;
    if (soundBtn) soundBtn.textContent = muted ? "Tap for sound" : "Sound on";
    if (muteIcon) muteIcon.setAttribute("aria-label", muted ? "Unmute" : "Mute");
  }

  function tryPlay() {
    if (!video || reduce) return;
    video.muted = true;
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
    tryPlay();
    video.addEventListener("canplay", tryPlay);
    video.addEventListener("loadeddata", tryPlay);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) tryPlay();
    });
    video.addEventListener("click", function () {
      if (video.paused) tryPlay();
      else video.pause();
    });
  }

  function toggleSound(e) {
    if (e) e.stopPropagation();
    if (!video) return;
    if (video.muted) {
      video.muted = false;
      setMuted(false);
      try { video.currentTime = 0; } catch (err) {}
      video.play().catch(function () {});
    } else {
      setMuted(true);
    }
  }
  if (soundBtn) soundBtn.addEventListener("click", toggleSound);
  if (muteIcon) muteIcon.addEventListener("click", toggleSound);

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
            weatherEl.textContent = place + ", " + temp + "°F" + (phrase ? ", " + phrase : "");
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
  if (location.search.indexOf("notes=thanks") >= 0) {
    var thanks = document.getElementById("guestbook-thanks");
    if (thanks) thanks.classList.remove("hidden");
    var form = document.getElementById("guestbook-form");
    if (form) form.classList.add("hidden");
  }
  if (location.search.indexOf("updates=thanks") >= 0) {
    var uthanks = document.getElementById("updates-thanks");
    if (uthanks) uthanks.classList.remove("hidden");
    var uform = document.getElementById("updates-form");
    if (uform) uform.classList.add("hidden");
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
    greece.fitBounds([[34.82, 22.95], [38.32, 26.25]], { padding: [24, 24], animate: false });

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
          }).addTo(greece).bindPopup("Planned — roads on Crete");
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
          }).addTo(greece).bindPopup(s.name + (done ? " · visited" : ""));
        });
      })
      .catch(function () {
        var land = [[35.5164, 24.0181], [35.231, 23.68], [35.4296, 24.1911], [35.265, 25.723], [35.3387, 25.1442]];
        var ferry = [[35.3387, 25.1442], [36.4165, 25.4324], [37.9838, 23.7275]];
        L.polyline(land, { color: "#1b6f66", weight: 3, opacity: 0.45, dashArray: "8 8" }).addTo(greece);
        L.polyline(ferry, { color: "#c4a35a", weight: 3, dashArray: "7 7", opacity: 0.95 }).addTo(greece);
      });

    function photoPin(lat, lng, src, label) {
      var html = '<div class="photo-pin"><div class="photo-pin-card"><img src="' + src + '" alt="" onerror="this.parentNode.parentNode.style.display=\'none\'" /></div><div class="photo-pin-tail"></div></div>';
      L.marker([lat, lng], {
        icon: L.divIcon({ className: "photo-pin-icon", html: html, iconSize: [56, 66], iconAnchor: [28, 66] }),
        zIndexOffset: 900,
        title: label
      }).addTo(greece).bindPopup(label);
    }

    fetch("/photos/album.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (items) {
        (items || []).forEach(function (item) {
          if (item.lat && item.lng && item.src) photoPin(item.lat, item.lng, item.src, item.caption || "Photo");
        });
      })
      .catch(function () {});
  }
})();
