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

  var album = document.getElementById("album");
  if (album) {
    fetch("/photos/album.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (items) {
        if (!Array.isArray(items) || !items.length) return;
        items.forEach(function (item) {
          var src = typeof item === "string" ? item : item.src;
          var caption = typeof item === "string" ? "" : (item.caption || "");
          if (!src) return;
          var li = document.createElement("li");
          li.innerHTML =
            '<button type="button" class="photo group relative block w-full overflow-hidden rounded-xl bg-bg-warm text-left card-shadow" data-full="' + src + '">' +
            '<img src="' + src + '" alt="' + caption + '" class="aspect-photo w-full object-cover" />' +
            (caption ? '<span class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-fg/70 to-transparent px-3 pb-3 pt-8 text-sm font-medium text-surface">' + caption + "</span>" : "") +
            "</button>";
          album.appendChild(li);
        });
        bindLightbox();
      })
      .catch(function () {});
  }

  var lb = document.getElementById("lb");
  var lbImg = document.getElementById("lb-img");
  function bindLightbox() {
    document.querySelectorAll(".photo").forEach(function (el) {
      if (el.dataset.bound) return;
      el.dataset.bound = "1";
      el.addEventListener("click", function () {
        lbImg.src = el.getAttribute("data-full");
        lb.classList.remove("hidden");
        lb.classList.add("flex");
      });
    });
  }
  bindLightbox();
  function closeLb() {
    if (!lb) return;
    lb.classList.add("hidden");
    lb.classList.remove("flex");
    lbImg.src = "";
  }
  var closeBtn = document.getElementById("lb-close");
  if (closeBtn) closeBtn.addEventListener("click", closeLb);
  if (lb) lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLb(); });

  if (typeof L === "undefined") return;

  var tiles = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  var attr = "&copy; OpenStreetMap &copy; CARTO";
  var HOME = [32.1848, -110.8147];

  var liveEl = document.getElementById("live-map");
  if (liveEl) {
    var live = L.map(liveEl, { scrollWheelZoom: false, zoomControl: true }).setView(HOME, 15);
    L.tileLayer(tiles, { attribution: attr, maxZoom: 19 }).addTo(live);
    L.circle(HOME, { radius: 220, color: "#1b6f66", weight: 1, fillColor: "#1b6f66", fillOpacity: 0.14, interactive: false }).addTo(live);
    L.marker(HOME, {
      icon: L.divIcon({ className: "trip-pin", html: '<div class="trip-pin-inner"><span class="live-pin-pulse"></span><div class="trip-pin-head"><span></span></div><div class="trip-pin-tail"></div></div>', iconSize: [28, 40], iconAnchor: [14, 40] })
    }).addTo(live).bindPopup('<p class="map-popup-title">Home</p><p class="map-popup-meta">Tucson, Arizona</p>');
  }

  var greeceEl = document.getElementById("greece-map");
  if (greeceEl) {
    var greece = L.map(greeceEl, { scrollWheelZoom: false, zoomControl: true, maxBounds: [[34.5, 22.3], [38.85, 26.95]] });
    L.tileLayer(tiles, { attribution: attr, maxZoom: 19 }).addTo(greece);
    greece.fitBounds([[34.82, 22.95], [38.32, 26.25]], { padding: [24, 24], animate: false });

    var land = [[35.5164, 24.0181], [35.231, 23.68], [35.4296, 24.1911], [35.265, 25.723], [35.3387, 25.1442]];
    var ferry = [[35.3387, 25.1442], [36.4165, 25.4324], [37.9838, 23.7275]];
    L.polyline(land, { color: "#1b6f66", weight: 3, opacity: 0.9 }).addTo(greece);
    L.polyline(ferry, { color: "#c4a35a", weight: 3, dashArray: "7 7", opacity: 0.95 }).addTo(greece);

    var stops = [
      [35.5164, 24.0181, "Chania"],
      [35.231, 23.68, "Paleochora"],
      [35.4296, 24.1911, "Douliana"],
      [35.265, 25.723, "Elounda"],
      [35.3387, 25.1442, "Heraklion"],
      [36.4165, 25.4324, "Santorini"],
      [37.9838, 23.7275, "Athens"]
    ];
    stops.forEach(function (s, i) {
      L.marker([s[0], s[1]], {
        icon: L.divIcon({ className: "route-pin-icon", html: '<div class="route-pin">' + (i + 1) + "</div>", iconSize: [26, 26], iconAnchor: [13, 13] })
      }).addTo(greece).bindPopup(s[2]);
    });

    function photoPin(lat, lng, src, label) {
      var html = '<div class="photo-pin"><div class="photo-pin-card"><img src="' + src + '" alt="" /></div><div class="photo-pin-tail"></div></div>';
      L.marker([lat, lng], {
        icon: L.divIcon({ className: "photo-pin-icon", html: html, iconSize: [56, 66], iconAnchor: [28, 66] }),
        zIndexOffset: 900,
        title: label
      }).addTo(greece).bindPopup(label);
    }
    photoPin(35.3, 24.9, "/photos/crete.jpg", "Crete");
    photoPin(36.4165, 25.4324, "/photos/santorini.jpg", "Santorini");
    photoPin(37.9838, 23.7275, "/photos/athens.jpg", "Athens");
  }
})();
