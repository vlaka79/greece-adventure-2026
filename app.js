(function () {
  var video = document.getElementById("intro");
  var soundBtn = document.getElementById("sound-btn");
  var muteIcon = document.getElementById("mute-icon");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setMuted(muted) {
    video.muted = muted;
    if (soundBtn) soundBtn.textContent = muted ? "Tap for sound" : "Sound on";
  }

  if (video) {
    video.addEventListener("loadeddata", function () {
      if (!reduce) video.play().catch(function () {});
    });
    video.addEventListener("click", function () {
      if (video.paused) video.play().catch(function () {});
      else video.pause();
    });
  }
  function toggleSound() {
    setMuted(!video.muted);
    video.play().catch(function () {});
  }
  if (soundBtn) soundBtn.addEventListener("click", toggleSound);
  if (muteIcon) muteIcon.addEventListener("click", toggleSound);

  if (typeof L === "undefined") return;

  var tiles = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  var attr = "&copy; OpenStreetMap &copy; CARTO";

  var liveEl = document.getElementById("live-map");
  if (liveEl) {
    var live = L.map(liveEl, { scrollWheelZoom: false, zoomControl: true }).setView([32.2226, -110.9747], 11);
    L.tileLayer(tiles, { attribution: attr, maxZoom: 19 }).addTo(live);
    L.circle([32.2226, -110.9747], { radius: 480, color: "#1b6f66", weight: 1, fillColor: "#1b6f66", fillOpacity: 0.14, interactive: false }).addTo(live);
    L.marker([32.2226, -110.9747], {
      icon: L.divIcon({ className: "trip-pin", html: '<div class="trip-pin-inner"><span class="live-pin-pulse"></span><div class="trip-pin-head"><span></span></div><div class="trip-pin-tail"></div></div>', iconSize: [28, 40], iconAnchor: [14, 40] })
    }).addTo(live).bindPopup('<p class="map-popup-title">Daniel &amp; Julia</p><p class="map-popup-meta">Preparing to depart</p>');
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

  var lb = document.getElementById("lb");
  var lbImg = document.getElementById("lb-img");
  document.querySelectorAll(".photo").forEach(function (el) {
    el.addEventListener("click", function () {
      lbImg.src = el.getAttribute("data-full");
      lb.classList.remove("hidden");
      lb.classList.add("flex");
    });
  });
  function closeLb() {
    lb.classList.add("hidden");
    lb.classList.remove("flex");
    lbImg.src = "";
  }
  var closeBtn = document.getElementById("lb-close");
  if (closeBtn) closeBtn.addEventListener("click", closeLb);
  if (lb) lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLb(); });
})();
